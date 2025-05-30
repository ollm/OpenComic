var site = {}, controller = false;
var codeVerifier = '';
var pendingCallback = null;
var oauthServer = null;

function setSiteData(siteData)
{
	site = siteData;
}

// Helper function to generate PKCE parameters
function generatePKCE() {
    // Generate code verifier (random string)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    codeVerifier = btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    // Generate code challenge (SHA256 hash of verifier)
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
        .then(hashBuffer => {
            const hashArray = new Uint8Array(hashBuffer);
            const codeChallenge = btoa(String.fromCharCode.apply(null, hashArray))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
            return codeChallenge;
        });
}

// Setup callback handler for custom protocol (recommended for desktop apps)
function setupCustomProtocolHandler() {
    // Register custom protocol handler in your main Electron process
    if (typeof electron !== 'undefined' && electron.app) {
        electron.app.setAsDefaultProtocolClient('yourapp');
        
        // Handle the protocol URL when app is already running
        electron.app.on('open-url', (event, url) => {
            event.preventDefault();
            handleOAuthCallback(url);
        });
        
        // Handle when app is launched by protocol URL
        electron.app.on('second-instance', (event, commandLine) => {
            const url = commandLine.find(arg => arg.startsWith('yourapp://'));
            if (url) {
                handleOAuthCallback(url);
            }
        });
    }
}

// Setup localhost server handler for port 3000
function setupLocalhostHandler() {
    const http = require('http');
    const url = require('url');
    const port = 3000;
    
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        
        if (parsedUrl.pathname === '/callback') {
            const code = parsedUrl.query.code;
            const state = parsedUrl.query.state;
            const error = parsedUrl.query.error;
            
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'text/html');
            
            if (error) {
                res.writeHead(200);
                res.end('<h1>Authorization Failed</h1><p>Error: ' + error + '</p><p>You can close this window.</p>');
                if (pendingCallback) {
                    pendingCallback(null);
                    pendingCallback = null;
                }
                return;
            }
            
            if (code) {
                res.writeHead(200);
                res.end('<h1>Authorization Successful</h1><p>You can close this window.</p>');
                if (pendingCallback) {
                    pendingCallback(code);
                    pendingCallback = null;
                }
            } else {
                res.writeHead(200);
                res.end('<h1>Authorization Failed</h1><p>No authorization code received.</p>');
                if (pendingCallback) {
                    pendingCallback(null);
                    pendingCallback = null;
                }
            }
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });
    
    server.listen(port, () => {
        console.log(`OAuth callback server running on port ${port}`);
    });
    
    // Store server reference to close it later if needed
    return server;
}

// Handle OAuth callback from custom protocol
function handleOAuthCallback(url) {
    try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');
        
        if (pendingCallback) {
            if (error) {
                console.error('OAuth Error:', error);
                pendingCallback(null);
            } else {
                pendingCallback(code);
            }
            pendingCallback = null;
        }
    } catch (e) {
        console.error('Error parsing OAuth callback URL:', e);
        if (pendingCallback) {
            pendingCallback(null);
            pendingCallback = null;
        }
    }
}

// Search comic/manga in site (unchanged)
async function searchComic(title, callback = false)
{
	// Don't search if title is empty
	if(!title || title.trim() === '') {
		callback([]);
		return;
	}

	if(controller) controller.abort();
	controller = new AbortController();

	let options = {
		method: 'GET',
		headers: {
			'X-MAL-CLIENT-ID': site.auth.clientId
		},
		signal: controller.signal,
	};

	let encodedTitle = encodeURIComponent(title.trim());
	let url = `https://api.myanimelist.net/v2/manga?q=${encodedTitle}&limit=10&fields=title,main_picture`;

	console.log('MAL Search URL:', url);
	console.log('MAL Client ID:', site.auth.clientId);

	fetch(url, options).then(async function(response) {
		
		console.log('MAL Search Response Status:', response.status);
		
		if(response.status == 200)
		{
			let json = await response.json();
			console.log('MAL Search Response:', JSON.stringify(json, null, 2));
			
			results = [];

			if(json.data && json.data.length > 0)
			{
				for(let key in json.data)
				{
					var manga = json.data[key].node;

					results.push({
						id: manga.id,
						title: manga.title,
						image: manga.main_picture ? manga.main_picture.medium : '',
					});
				}
			}

			callback(results);
		}
		else
		{
			// Try to get error details
			let errorText = await response.text();
			console.error('MAL Search Error:', response.status);
			console.error('MAL Error Details:', errorText);
			callback([]);
		}

	}).catch(function(error){
		console.error('MAL Search Fetch Error:', error);
		callback([]);
	});
}

// Return data of comic/manga (unchanged)
async function getComicData(siteId, callback = false)
{
	// For getting basic manga data without user progress, we don't need auth
	let options = {
		method: 'GET',
		headers: {
			'X-MAL-CLIENT-ID': site.auth.clientId
		}
	};

	// If we have a token, include it to get user progress
	if(site.config.session.token) {
		options.headers['Authorization'] = 'Bearer ' + site.config.session.token;
	}

	let url = `https://api.myanimelist.net/v2/manga/${siteId}?fields=title,main_picture,num_chapters,num_volumes,my_list_status`;

	console.log('MAL GetComicData URL:', url);
	console.log('MAL Has Token:', !!site.config.session.token);

	fetch(url, options).then(async function(response) {

		console.log('MAL GetComicData Response Status:', response.status);

		if(response.status == 200)
		{
			let json = await response.json();
			console.log('MAL GetComicData Response:', JSON.stringify(json, null, 2));
			
			callback({
				title: json.title,
				image: json.main_picture ? json.main_picture.large : '',
				chapters: json.num_chapters || 0,
				volumes: json.num_volumes || 0,
				progress: {
					chapters: json.my_list_status ? (json.my_list_status.num_chapters_read || 0) : 0,
					volumes: json.my_list_status ? (json.my_list_status.num_volumes_read || 0) : 0,
				},
			});
		}
		else if(response.status == 401)
		{
			// Token expired or invalid
			console.log('MAL: Token invalid, invalidating session');
			tracking.invalidateSession(site.key, true);
			callback({});
		}
		else
		{
			let errorText = await response.text();
			console.error('MAL GetComicData Error:', response.status);
			console.error('MAL Error Details:', errorText);
			callback({});
		}

	}).catch(function(error){
		console.error('MAL GetComicData Fetch Error:', error);
		callback({});
	});
}

// Updated login function
async function login(callback = false)
{
	// Generate PKCE parameters
	const codeChallenge = await generatePKCE();
	
	// Generate a random state for security
	let state = Math.random().toString(36).substring(2, 15);
	
	// Use registered redirect URI
	const redirectUri = 'http://localhost:3000/callback';
	
	// Open MAL OAuth authorization URL with PKCE
	let authUrl = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${site.auth.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
	
	console.log('MAL OAuth URL:', authUrl);
	electron.shell.openExternal(authUrl);

	// Set up callback handler
	pendingCallback = function(authCode) {
		
		if(authCode)
		{
			// Exchange authorization code for access token with PKCE
			let options = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: site.auth.clientId,
					grant_type: 'authorization_code',
					code: authCode,
					redirect_uri: redirectUri,
					code_verifier: codeVerifier // This is the PKCE verification
				})
			};

			fetch('https://myanimelist.net/v1/oauth2/token', options).then(async function(response) {

				if(response.status == 200)
				{
					let json = await response.json();
					callback({valid: true, token: json.access_token});
				}
				else
				{
					let errorText = await response.text();
					console.error('MAL Token Exchange Error:', response.status);
					console.error('MAL Token Error Details:', errorText);
					callback({valid: false});
				}

			}).catch(function(error){
				console.error('MAL Login Fetch Error:', error);
				callback({valid: false});
			});
		}
		else
		{
			callback({valid: false});
		}
	};
	
	// localhost timeout
	setTimeout(() => {
		if (pendingCallback) {
			console.log('OAuth timeout - no response received');
			pendingCallback(null);
			pendingCallback = null;
		}
	}, 300000); // 5 minute timeout
}

// Track comic/manga (unchanged)
async function track(toTrack)
{
	/*
	toTrack:
	{
		id: 0, // Comic id in site
		chapters: 1, // Chapters to mark
		volumes: 1, // Volumes to mark
	}
	*/

	// First, get current manga data to determine status
	let options = {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + site.config.session.token,
			'X-MAL-CLIENT-ID': site.auth.clientId
		}
	};

	let url = `https://api.myanimelist.net/v2/manga/${toTrack.id}?fields=num_chapters,num_volumes,my_list_status`;

	fetch(url, options).then(async function(response) {

		if(response.status == 401)
		{
			tracking.invalidateSession(site.key, true);
			return;
		}
		else if(response.status == 200)
		{
			let json = await response.json();
			
			let totalChapters = json.num_chapters;
			let totalVolumes = json.num_volumes;
			let currentStatus = json.my_list_status ? json.my_list_status.status : null;
			let currentChapters = json.my_list_status ? json.my_list_status.num_chapters_read : 0;
			let currentVolumes = json.my_list_status ? json.my_list_status.num_volumes_read : 0;

			// Determine new status
			let newStatus = currentStatus;
			if(totalChapters && toTrack.chapters >= totalChapters)
			{
				newStatus = 'completed';
			}
			else if(!currentStatus || currentStatus === 'plan_to_read')
			{
				newStatus = 'reading';
			}

			// Only update if there's actual progress
			if(toTrack.chapters > currentChapters || toTrack.volumes > currentVolumes || newStatus !== currentStatus)
			{
				// Prepare update data
				let updateData = {};
				
				if(newStatus) updateData.status = newStatus;
				if(toTrack.chapters > currentChapters) updateData.num_chapters_read = toTrack.chapters;
				if(toTrack.volumes > currentVolumes) updateData.num_volumes_read = toTrack.volumes;

				// Update manga list entry
				let updateOptions = {
					method: 'PATCH',
					headers: {
						'Authorization': 'Bearer ' + site.config.session.token,
						'Content-Type': 'application/x-www-form-urlencoded',
						'X-MAL-CLIENT-ID': site.auth.clientId
					},
					body: new URLSearchParams(updateData)
				};

				let updateUrl = `https://api.myanimelist.net/v2/manga/${toTrack.id}/my_list_status`;

				fetch(updateUrl, updateOptions).then(async function(updateResponse) {
					if(updateResponse.status == 200)
					{
						console.log('MAL tracking updated successfully');
					}
					else
					{
						console.error('MAL Update Error:', updateResponse.status);
					}
				}).catch(function(error){
					console.error('MAL Update Fetch Error:', error);
				});
			}
		}
		else
		{
			console.error('MAL Track Get Data Error:', response.status);
		}

	}).catch(function(error){
		console.error('MAL Track Fetch Error:', error);
	});
}

// Initialize callback handlers (call this when app starts)
function initializeOAuth() {
    // Setup localhost server for OAuth callback
    setupLocalhostHandler();
}

module.exports = {
	setSiteData: setSiteData,
	searchComic: searchComic,
	getComicData: getComicData,
	login: login,
	track: track,
	initializeOAuth: initializeOAuth, // New function to initialize
};