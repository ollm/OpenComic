
const crypto = require('crypto');
const http = require('http');
const { URL } = require('url');

// MAL credentials
const CLIENT_ID = '4bb3d90eaf4f31d6042e551db7f85ba6';
const CLIENT_SECRET = '72767e017847e38bbd4374306e394953c2c5691ef182be5f40121e85116f14f2';
const REDIRECT_URI = 'http://localhost:3000/callback';
const PORT = 3000;

// PKCE helper functions - MAL uses PLAIN method, not S256
function generateCodeVerifier() {
    // Generate a random string with allowed characters [A-Z][a-z][0-9]-._~
    // Length must be between 43 and 128 characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < 128; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateCodeChallenge(codeVerifier) {
    // MAL uses PLAIN method, so code_challenge = code_verifier
    return codeVerifier;
}

// Generate PKCE pair
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);

console.log('🔐 PKCE Generation (PLAIN method):');
console.log('Code Verifier:', codeVerifier);
console.log('Code Challenge:', codeChallenge);
console.log('Same?', codeVerifier === codeChallenge ? 'YES ✅' : 'NO ❌');
console.log('');

// Generate OAuth URL with PLAIN PKCE
function generateOAuthURL() {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_challenge: codeChallenge,
        code_challenge_method: 'plain', // Changed from S256 to plain
        state: Math.random().toString(36).substring(7) // Random state for security
    });
    
    return `https://myanimelist.net/v1/oauth2/authorize?${params.toString()}`;
}

// Exchange authorization code for access token
async function exchangeCodeForToken(authCode) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
    });

    console.log('🔄 Exchanging authorization code for token...');
    console.log('Request details:');
    console.log('- Client ID:', CLIENT_ID);
    console.log('- Auth Code:', authCode.substring(0, 20) + '...');
    console.log('- Code Verifier:', codeVerifier.substring(0, 20) + '...');
    console.log('- Redirect URI:', REDIRECT_URI);

    try {
        const response = await fetch('https://myanimelist.net/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MAL-OAuth-Test/1.0'
            },
            body: params.toString()
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        const tokenData = JSON.parse(responseText);
        console.log('🎉 SUCCESS! Token received:');
        console.log('Access Token:', tokenData.access_token?.substring(0, 50) + '...');
        console.log('Token Type:', tokenData.token_type);
        console.log('Expires In:', tokenData.expires_in, 'seconds');
        console.log('Refresh Token:', tokenData.refresh_token?.substring(0, 50) + '...');
        
        return tokenData;
    } catch (error) {
        console.error('❌ Token exchange failed:', error.message);
        throw error;
    }
}

// Start the OAuth flow
async function startOAuthFlow() {
    console.log('🚀 Starting MAL OAuth Flow with PLAIN PKCE...\n');
    
    // Create a simple HTTP server to handle the callback
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        
        if (url.pathname === '/callback') {
            const authCode = url.searchParams.get('code');
            const error = url.searchParams.get('error');
            const state = url.searchParams.get('state');
            
            console.log('📥 Callback received:');
            console.log('- Path:', url.pathname);
            console.log('- Code:', authCode ? authCode.substring(0, 20) + '...' : 'null');
            console.log('- Error:', error);
            console.log('- State:', state);
            
            if (error) {
                console.error('❌ Authorization failed:', error);
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`<h1>Authorization Failed</h1><p>Error: ${error}</p>`);
                server.close();
                return;
            }
            
            if (authCode) {
                console.log('✅ Authorization code received:', authCode.substring(0, 20) + '...');
                
                try {
                    const tokenData = await exchangeCodeForToken(authCode);
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <h1>🎉 OAuth Success!</h1>
                        <p>Authorization completed successfully.</p>
                        <p>You can close this window now.</p>
                        <p>Check your console for the access token details.</p>
                    `);
                    
                    // Test the token by making an API call
                    await testTokenWithAPI(tokenData.access_token);
                    
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end(`<h1>❌ Token Exchange Failed</h1><p>${error.message}</p>`);
                }
                
                server.close();
            } else {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<h1>❌ No authorization code received</h1>');
                server.close();
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Not Found</h1>');
        }
    });
    
    server.listen(PORT, () => {
        console.log(`🌐 Callback server started on http://localhost:${PORT}`);
        console.log('');
        
        const authURL = generateOAuthURL();
        console.log('📋 STEP 1: Copy this URL and open it in your browser:');
        console.log('');
        console.log(authURL);
        console.log('');
        console.log('📋 STEP 2: Login to MyAnimeList and authorize the application');
        console.log('📋 STEP 3: You will be redirected back automatically');
        console.log('');
        console.log('⏳ Waiting for authorization...');
    });
    
    // Auto-close server after 10 minutes
    setTimeout(() => {
        console.log('⏰ Timeout reached. Closing server...');
        server.close();
    }, 600000);
}

// Test the access token with a simple API call
async function testTokenWithAPI(accessToken) {
    console.log('\n🧪 Testing access token with API call...');
    
    try {
        const response = await fetch('https://api.myanimelist.net/v2/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'MAL-OAuth-Test/1.0'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log('✅ API Test Successful!');
            console.log('User ID:', userData.id);
            console.log('Username:', userData.name);
            console.log('Join Date:', userData.joined_at);
        } else {
            const errorText = await response.text();
            console.log('❌ API Test Failed:', response.status, response.statusText);
            console.log('Error body:', errorText);
        }
    } catch (error) {
        console.log('❌ API Test Error:', error.message);
    }
}

// Main execution
if (require.main === module) {
    console.log('🔧 MAL OAuth Test with PLAIN PKCE');
    console.log('===================================\n');
    
    // Important setup instructions
    console.log('⚠️  IMPORTANT SETUP REQUIRED:');
    console.log('1. Go to https://myanimelist.net/apiconfig');
    console.log('2. Edit your application settings');
    console.log(`3. Set the "App Redirect Url" to: ${REDIRECT_URI}`);
    console.log('4. Save the changes');
    console.log('');
    console.log('ℹ️  Using PLAIN PKCE method (MAL requirement)');
    console.log('Press ENTER to continue...');
    
    process.stdin.once('data', () => {
        startOAuthFlow();
    });
}

module.exports = {
    generateCodeVerifier,
    generateCodeChallenge,
    exchangeCodeForToken,
    startOAuthFlow
};