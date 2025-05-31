const crypto = require('crypto');
const EventEmitter = require('events');

/**
 * Configuration constants
 */
const CONFIG = {
    API_BASE_URL: 'https://api.myanimelist.net/v2',
    AUTH_BASE_URL: 'https://myanimelist.net/v1/oauth2',
    OAUTH_TIMEOUT: 300000, // 5 minutes
    DEFAULT_PORT: 3000,
    RATE_LIMIT: {
        requests: 100,
        windowMs: 60000, // 1 minute
    },
    RETRY: {
        maxAttempts: 3,
        backoffMs: 1000,
    }
};

// Custom error classes
class MALError extends Error {
    constructor(message, code, statusCode = null) {
        super(message);
        this.name = 'MALError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

class MALAuthError extends MALError {
    constructor(message, code = 'AUTH_ERROR') {
        super(message, code, 401);
        this.name = 'MALAuthError';
    }
}

class MALRateLimitError extends MALError {
    constructor(message) {
        super(message, 'RATE_LIMIT_ERROR', 429);
        this.name = 'MALRateLimitError';
    }
}

// Rate limiting
class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    async checkLimit() {
        const now = Date.now();
        
        // Remove old requests
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = this.windowMs - (now - oldestRequest);
            throw new MALRateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
        }
        
        this.requests.push(now);
    }
}

// Secure PKCE implementation
class PKCEManager {
    constructor() {
        this.sessions = new Map(); // Store multiple sessions securely
    }

    /**
     * Generate PKCE parameters for a new OAuth session
     * @returns {Promise<{codeVerifier: string, codeChallenge: string, sessionId: string}>}
     */
    async generatePKCE() {
        try {
            // Generate cryptographically secure random bytes
            const codeVerifier = crypto.randomBytes(32)
                .toString('base64url'); // Use base64url encoding (RFC 7636)

            // Generate SHA256 challenge
            const codeChallenge = crypto.createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');

            // Create unique session ID
            const sessionId = crypto.randomUUID();

            // Store securely with expiration
            this.sessions.set(sessionId, {
                codeVerifier,
                createdAt: Date.now(),
                expiresAt: Date.now() + CONFIG.OAUTH_TIMEOUT
            });

            return { codeVerifier, codeChallenge, sessionId };
        } catch (error) {
            throw new MALError('Failed to generate PKCE parameters', 'PKCE_GENERATION_ERROR');
        }
    }

    /**
     * Retrieve and validate code verifier for a session
     * @param {string} sessionId - Session identifier
     * @returns {string|null} Code verifier if valid, null otherwise
     */
    getCodeVerifier(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }

        // Check expiration
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return null;
        }

        return session.codeVerifier;
    }

    // Clean up expired sessions
    cleanup() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(sessionId);
            }
        }
    }

    /**
     * Remove a specific session
     * @param {string} sessionId - Session to remove
     */
    removeSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}

// OAuth callback server manager
class OAuthServer extends EventEmitter {
    constructor(port = CONFIG.DEFAULT_PORT) {
        super();
        this.port = port;
        this.server = null;
        this.isListening = false;
    }

    /**
     * Start the OAuth callback server
     * @returns {Promise<void>}
     */
    async start() {
        if (this.isListening) {
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                const http = require('http');
                const url = require('url');

                this.server = http.createServer((req, res) => {
                    this.handleRequest(req, res);
                });

                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        reject(new MALError(`Port ${this.port} is already in use`, 'PORT_IN_USE'));
                    } else {
                        reject(new MALError(`Server error: ${error.message}`, 'SERVER_ERROR'));
                    }
                });

                this.server.listen(this.port, '127.0.0.1', () => {
                    this.isListening = true;
                    console.log(`OAuth callback server started on http://127.0.0.1:${this.port}`);
                    resolve();
                });

            } catch (error) {
                reject(new MALError(`Failed to start OAuth server: ${error.message}`, 'SERVER_START_ERROR'));
            }
        });
    }

    // Handle incoming OAuth callback requests
    handleRequest(req, res) {
        try {
            const parsedUrl = url.parse(req.url, true);
            
            // Set security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');

            if (parsedUrl.pathname === '/callback') {
                const { code, state, error, error_description } = parsedUrl.query;

                if (error) {
                    const errorMsg = error_description || error;
                    this.sendErrorResponse(res, `Authorization failed: ${errorMsg}`);
                    this.emit('callback', { error: errorMsg, state });
                    return;
                }

                if (!code || !state) {
                    this.sendErrorResponse(res, 'Missing required parameters');
                    this.emit('callback', { error: 'Missing parameters', state });
                    return;
                }

                this.sendSuccessResponse(res);
                this.emit('callback', { code, state });

            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }

        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            this.sendErrorResponse(res, 'Internal server error');
            this.emit('callback', { error: 'Server error' });
        }
    }

    // Send success response to user
    sendSuccessResponse(res) {
        res.writeHead(200);
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Successful</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .success { color: #28a745; }
                </style>
            </head>
            <body>
                <h1 class="success">✓ Authorization Successful</h1>
                <p>You can safely close this window and return to the application.</p>
                <script>
                    setTimeout(() => window.close(), 3000);
                </script>
            </body>
            </html>
        `);
    }

    // Send error response to user
    sendErrorResponse(res, errorMessage) {
        res.writeHead(200);
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Failed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #dc3545; }
                </style>
            </head>
            <body>
                <h1 class="error">✗ Authorization Failed</h1>
                <p>${this.escapeHtml(errorMessage)}</p>
                <p>You can close this window and try again.</p>
                <script>
                    setTimeout(() => window.close(), 5000);
                </script>
            </body>
            </html>
        `);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Stop the OAuth callback server
    async stop() {
        if (!this.server || !this.isListening) {
            return;
        }

        return new Promise((resolve) => {
            this.server.close(() => {
                this.isListening = false;
                console.log('OAuth callback server stopped');
                resolve();
            });
        });
    }
}

// Main MAL Tracker class
class MALTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Validate required configuration
        if (!config.clientId) {
            throw new MALError('Client ID is required', 'MISSING_CLIENT_ID');
        }

        this.config = {
            clientId: config.clientId,
            port: config.port || CONFIG.DEFAULT_PORT,
            redirectUri: config.redirectUri || `http://127.0.0.1:${config.port || CONFIG.DEFAULT_PORT}/callback`,
            ...config
        };

        // Initialize components
        this.pkceManager = new PKCEManager();
        this.rateLimiter = new RateLimiter(CONFIG.RATE_LIMIT.requests, CONFIG.RATE_LIMIT.windowMs);
        this.oauthServer = new OAuthServer(this.config.port);
        
        // Session management
        this.session = {
            token: null,
            refreshToken: null,
            expiresAt: null,
            isValid: false
        };

        // Request management
        this.abortController = null;
        
        // Cleanup timer
        this.cleanupTimer = setInterval(() => {
            this.pkceManager.cleanup();
        }, 60000); // Cleanup every minute
    }

    // Validate input parameters
    validateInput(input, rules) {
        for (const [field, rule] of Object.entries(rules)) {
            const value = input[field];
            
            if (rule.required && (value === undefined || value === null || value === '')) {
                throw new MALError(`${field} is required`, 'VALIDATION_ERROR');
            }
            
            if (value !== undefined && rule.type && typeof value !== rule.type) {
                throw new MALError(`${field} must be of type ${rule.type}`, 'VALIDATION_ERROR');
            }
            
            if (value !== undefined && rule.min && value < rule.min) {
                throw new MALError(`${field} must be at least ${rule.min}`, 'VALIDATION_ERROR');
            }
        }
    }

    // Make authenticated API request with retry logic
    async makeRequest(url, options = {}, retryCount = 0) {
        try {
            // Check rate limiting
            await this.rateLimiter.checkLimit();

            // Set up abort controller
            if (this.abortController) {
                this.abortController.abort();
            }
            this.abortController = new AbortController();

            const requestOptions = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.config.clientId,
                    'User-Agent': 'MAL-Tracker/2.0.0',
                    ...options.headers
                },
                signal: this.abortController.signal,
                ...options
            };

            // Add authentication if token is available
            if (this.session.token && this.isTokenValid()) {
                requestOptions.headers['Authorization'] = `Bearer ${this.session.token}`;
            }

            console.log(`Making API request: ${url}`);
            const response = await fetch(url, requestOptions);

            // Handle different response statuses
            if (response.status === 401) {
                this.invalidateSession();
                throw new MALAuthError('Authentication required or token expired');
            }

            if (response.status === 429) {
                throw new MALRateLimitError('API rate limit exceeded');
            }

            if (response.status === 403) {
                throw new MALError('Access forbidden - check API permissions', 'FORBIDDEN', 403);
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new MALError(`API request failed: ${response.status} - ${errorText}`, 'API_ERROR', response.status);
            }

            return await response.json();

        } catch (error) {
            // Handle retry logic
            if (retryCount < CONFIG.RETRY.maxAttempts && 
                (error.name === 'TypeError' || error.code === 'NETWORK_ERROR')) {
                console.log(`Retrying request (${retryCount + 1}/${CONFIG.RETRY.maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.backoffMs * (retryCount + 1)));
                return this.makeRequest(url, options, retryCount + 1);
            }

            throw error;
        } finally {
            this.abortController = null;
        }
    }

    // Check if current token is valid
    isTokenValid() {
        return this.session.isValid && 
               this.session.token && 
               this.session.expiresAt && 
               Date.now() < this.session.expiresAt;
    }

    // Invalidate current session
    invalidateSession() {
        this.session = {
            token: null,
            refreshToken: null,
            expiresAt: null,
            isValid: false
        };
        this.emit('sessionInvalidated');
    }

    // Set site/session data
    setSiteData(siteData) {
        if (siteData.auth && siteData.auth.clientId) {
            this.config.clientId = siteData.auth.clientId;
        }
        
        if (siteData.config && siteData.config.session) {
            const sessionData = siteData.config.session;
            if (sessionData.token) {
                this.session.token = sessionData.token;
                this.session.refreshToken = sessionData.refreshToken;
                this.session.expiresAt = sessionData.expiresAt || (Date.now() + 3600000); // 1 hour default
                this.session.isValid = true;
            }
        }
    }

    /**
     * Search for manga/comics
     * @param {string} title - Title to search for
     * @returns {Promise<Array>} Array of search results
     */
    async searchComic(title) {
        try {
            // Validate input
            this.validateInput({ title }, {
                title: { required: true, type: 'string' }
            });

            const trimmedTitle = title.trim();
            if (trimmedTitle.length === 0) {
                return [];
            }

            const url = `${CONFIG.API_BASE_URL}/manga?q=${encodeURIComponent(trimmedTitle)}&limit=10&fields=title,main_picture,synopsis`;
            const data = await this.makeRequest(url);

            const results = [];
            if (data.data && Array.isArray(data.data)) {
                for (const item of data.data) {
                    const manga = item.node;
                    results.push({
                        id: manga.id,
                        title: manga.title,
                        image: manga.main_picture ? manga.main_picture.medium : null,
                        synopsis: manga.synopsis || null
                    });
                }
            }

            console.log(`Found ${results.length} results for "${trimmedTitle}"`);
            return results;

        } catch (error) {
            console.error('Search error:', error.message);
            if (error instanceof MALError) {
                throw error;
            }
            throw new MALError(`Search failed: ${error.message}`, 'SEARCH_ERROR');
        }
    }

    /**
     * Get detailed comic/manga data
     * @param {number} siteId - MAL manga ID
     * @returns {Promise<Object>} Manga details
     */
    async getComicData(siteId) {
        try {
            // Validate input
            this.validateInput({ siteId }, {
                siteId: { required: true, type: 'number', min: 1 }
            });

            const url = `${CONFIG.API_BASE_URL}/manga/${siteId}?fields=title,main_picture,num_chapters,num_volumes,synopsis,my_list_status,status`;
            const data = await this.makeRequest(url);

            const result = {
                id: data.id,
                title: data.title,
                image: data.main_picture ? data.main_picture.large : null,
                chapters: data.num_chapters || 0,
                volumes: data.num_volumes || 0,
                synopsis: data.synopsis || null,
                status: data.status || 'unknown',
                progress: {
                    chapters: 0,
                    volumes: 0,
                    status: null
                }
            };

            // Add user progress if available
            if (data.my_list_status) {
                result.progress = {
                    chapters: data.my_list_status.num_chapters_read || 0,
                    volumes: data.my_list_status.num_volumes_read || 0,
                    status: data.my_list_status.status || null
                };
            }

            console.log(`Retrieved data for manga ID: ${siteId}`);
            return result;

        } catch (error) {
            console.error('Get comic data error:', error.message);
            if (error instanceof MALError) {
                throw error;
            }
            throw new MALError(`Failed to get comic data: ${error.message}`, 'GET_DATA_ERROR');
        }
    }

    /**
     * Authenticate with MyAnimeList using OAuth 2.0 + PKCE
     * @returns {Promise<Object>} Authentication result
     */
    async login() {
        try {
            console.log('Starting MAL OAuth login process...');

            // Generate PKCE parameters
            const { codeChallenge, sessionId } = await this.pkceManager.generatePKCE();
            
            // Generate secure state parameter
            const state = crypto.randomUUID();
            
            // Start OAuth server
            await this.oauthServer.start();

            // Build authorization URL
            const authParams = new URLSearchParams({
                response_type: 'code',
                client_id: this.config.clientId,
                redirect_uri: this.config.redirectUri,
                state: state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                scope: 'read write' // Specify required scopes
            });

            const authUrl = `${CONFIG.AUTH_BASE_URL}/authorize?${authParams.toString()}`;
            console.log('Opening authorization URL...');

            // Open browser (environment-specific)
            if (typeof require !== 'undefined') {
                try {
                    const { shell } = require('electron');
                    shell.openExternal(authUrl);
                } catch (e) {
                    // Fallback for Node.js environment
                    const { exec } = require('child_process');
                    const opener = process.platform === 'win32' ? 'start' : 
                                 process.platform === 'darwin' ? 'open' : 'xdg-open';
                    exec(`${opener} "${authUrl}"`);
                }
            } else {
                // Browser environment
                window.open(authUrl, '_blank');
            }

            // Wait for OAuth callback
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.oauthServer.removeAllListeners('callback');
                    this.oauthServer.stop();
                    this.pkceManager.removeSession(sessionId);
                    reject(new MALError('OAuth timeout - no response received', 'OAUTH_TIMEOUT'));
                }, CONFIG.OAUTH_TIMEOUT);

                this.oauthServer.once('callback', async (callbackData) => {
                    clearTimeout(timeout);
                    
                    try {
                        if (callbackData.error) {
                            throw new MALAuthError(`OAuth error: ${callbackData.error}`);
                        }

                        // Validate state parameter (CSRF protection)
                        if (callbackData.state !== state) {
                            throw new MALAuthError('Invalid state parameter - possible CSRF attack');
                        }

                        // Get code verifier
                        const codeVerifier = this.pkceManager.getCodeVerifier(sessionId);
                        if (!codeVerifier) {
                            throw new MALAuthError('Invalid or expired OAuth session');
                        }

                        // Exchange code for token
                        const tokenData = await this.exchangeCodeForToken(callbackData.code, codeVerifier);
                        
                        // Clean up
                        this.pkceManager.removeSession(sessionId);
                        await this.oauthServer.stop();

                        resolve(tokenData);

                    } catch (error) {
                        this.pkceManager.removeSession(sessionId);
                        await this.oauthServer.stop();
                        reject(error);
                    }
                });
            });

        } catch (error) {
            console.error('Login error:', error.message);
            await this.oauthServer.stop();
            if (error instanceof MALError) {
                throw error;
            }
            throw new MALError(`Login failed: ${error.message}`, 'LOGIN_ERROR');
        }
    }

    /**
     * Exchange authorization code for access token
     * @private
     */
    async exchangeCodeForToken(code, codeVerifier) {
        const tokenParams = new URLSearchParams({
            client_id: this.config.clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.config.redirectUri,
            code_verifier: codeVerifier
        });

        const response = await fetch(`${CONFIG.AUTH_BASE_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MAL-Tracker/2.0.0'
            },
            body: tokenParams.toString()
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new MALAuthError(`Token exchange failed: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        
        // Update session
        this.session = {
            token: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
            isValid: true
        };

        console.log('Authentication successful');
        this.emit('authenticated', {
            valid: true,
            token: tokenData.access_token,
            expiresIn: tokenData.expires_in
        });

        return {
            valid: true,
            token: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in
        };
    }

    /**
     * Track manga progress
     * @param {Object} trackData - Progress data to update
     * @returns {Promise<boolean>} Success status
     */
    async track(trackData) {
        try {
            // Validate input
            this.validateInput(trackData, {
                id: { required: true, type: 'number', min: 1 },
                chapters: { type: 'number', min: 0 },
                volumes: { type: 'number', min: 0 }
            });

            if (!this.isTokenValid()) {
                throw new MALAuthError('Valid authentication required for tracking');
            }

            console.log(`Tracking progress for manga ID: ${trackData.id}`);

            // Get current manga data
            const currentData = await this.getComicData(trackData.id);
            const currentProgress = currentData.progress;

            // Determine what needs to be updated
            const updates = {};
            let shouldUpdate = false;

            // Update chapters
            if (trackData.chapters !== undefined && trackData.chapters > currentProgress.chapters) {
                updates.num_chapters_read = trackData.chapters;
                shouldUpdate = true;
            }

            // Update volumes
            if (trackData.volumes !== undefined && trackData.volumes > currentProgress.volumes) {
                updates.num_volumes_read = trackData.volumes;
                shouldUpdate = true;
            }

            // Determine status
            const totalChapters = currentData.chapters;
            const newChapters = updates.num_chapters_read || currentProgress.chapters;
            
            if (totalChapters > 0 && newChapters >= totalChapters) {
                updates.status = 'completed';
                shouldUpdate = true;
            } else if (!currentProgress.status || currentProgress.status === 'plan_to_read') {
                updates.status = 'reading';
                shouldUpdate = true;
            }

            if (!shouldUpdate) {
                console.log('No updates needed - progress is current');
                return true;
            }

            // Make update request
            const url = `${CONFIG.API_BASE_URL}/manga/${trackData.id}/my_list_status`;
            await this.makeRequest(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(updates).toString()
            });

            console.log('Progress tracking updated successfully');
            this.emit('progressUpdated', {
                mangaId: trackData.id,
                updates: updates
            });

            return true;

        } catch (error) {
            console.error('Tracking error:', error.message);
            if (error instanceof MALError) {
                throw error;
            }
            throw new MALError(`Tracking failed: ${error.message}`, 'TRACKING_ERROR');
        }
    }

    /**
     * Clean up resources and stop background processes
     */
    async destroy() {
        console.log('Cleaning up MAL Tracker resources...');
        
        // Clear cleanup timer
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        // Abort any pending requests
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // Stop OAuth server
        await this.oauthServer.stop();

        // Clear session data
        this.invalidateSession();

        // Remove all listeners
        this.removeAllListeners();

        console.log('MAL Tracker cleanup completed');
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS
    module.exports = {
        MALTracker,
        MALError,
        MALAuthError,
        MALRateLimitError,
        
        // Legacy compatibility functions
        setSiteData: (siteData) => {
            if (!global.malTracker) {
                throw new MALError('MALTracker instance not initialized', 'NOT_INITIALIZED');
            }
            return global.malTracker.setSiteData(siteData);
        },
        
        searchComic: async (title, callback) => {
            if (!global.malTracker) {
                throw new MALError('MALTracker instance not initialized', 'NOT_INITIALIZED');
            }
            try {
                const results = await global.malTracker.searchComic(title);
                if (callback) callback(results);
                return results;
            } catch (error) {
                if (callback) callback([]);
                throw error;
            }
        },
        
        getComicData: async (siteId, callback) => {
            if (!global.malTracker) {
                throw new MALError('MALTracker instance not initialized', 'NOT_INITIALIZED');
            }
            try {
                const data = await global.malTracker.getComicData(siteId);
                if (callback) callback(data);
                return data;
            } catch (error) {
                if (callback) callback({});
                throw error;
            }
        },
        
        login: async (callback) => {
            if (!global.malTracker) {
                throw new MALError('MALTracker instance not initialized', 'NOT_INITIALIZED');
            }
            try {
                const result = await global.malTracker.login();
                if (callback) callback(result);
                return result;
            } catch (error) {
                if (callback) callback({ valid: false, error: error.message });
                throw error;
            }
        },
        
        track: async (trackData) => {
            if (!global.malTracker) {
                throw new MALError('MALTracker instance not initialized', 'NOT_INITIALIZED');
            }
            return await global.malTracker.track(trackData);
        },
        
        // Initialize global instance (for legacy compatibility)
        initializeTracker: (config) => {
            global.malTracker = new MALTracker(config);
            return global.malTracker;
        },
        
        // Get current global instance
        getInstance: () => {
            return global.malTracker;
        },
        
        // Cleanup global instance
        cleanup: async () => {
            if (global.malTracker) {
                await global.malTracker.destroy();
                global.malTracker = null;
            }
        }
    };
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.MALTracker = MALTracker;
    window.MALError = MALError;
    window.MALAuthError = MALAuthError;
    window.MALRateLimitError = MALRateLimitError;
}