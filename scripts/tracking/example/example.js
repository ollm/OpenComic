var site = {}, controller = false;

/*
site
{
	key: 'example', // Site key
	auth: {
		// Auth values from tracking-sites-keys.js
	},
	config: {
		session: {
			token: 'ABCDE', // Token set in login/refreshToken function
			refreshToken: 'ABCDE', // Refresh token set in login/refreshToken function
		},
	},
};
*/

function setSiteData(siteData)
{
	site = siteData;
}

// Search comic/manga in site
async function searchComic(title)
{
	// https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch and https://developer.mozilla.org/en-US/docs/Web/API/fetch
	//
	// if(controller) controller.abort();
	// controller = new AbortController();
	//
	// const options = {signal: controller.signal};
	// const response = await fetch('url', options);
	// const json = await response.json();

	results = [];

	results.push({
		id: 0, // Comic id in site
		title: 'title', // Comic title
		image: 'https://image.small', // Comic small image
	});

	return results;
}

// Return data of comic/manga
async function getComicData(siteId, callback = false)
{
	// siteId = Comic id in site

	// https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch and https://developer.mozilla.org/en-US/docs/Web/API/fetch
	// const response = await fetch('url', options);
	// const json = await response.json();

	return {
		title: 'title', // Comic title
		image: 'https://image.large', // Comic large image
		chapters: 0, // Total comic chapters
		volumes: 0, // Total comic volumes
		progress: {
			chapters: 0, // User viewed chapters
			volumes: 0, // User viewed volumes
		},
	};
}

// Loging to site
async function login()
{
	// Open link to browser and return the redirect url/uri 
	// const url = await tracking.getRedirectResult(site.key, 'https://example.com/api/oauth/authorize?client_id='+site.auth.clientId+'&redirect_uri=opencomic://tracking/example&response_type=code');
	// const token = url.searchParams.get('token');

	// https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch and https://developer.mozilla.org/en-US/docs/Web/API/fetch
	// const response = await fetch('url', options);
	// const json = await response.json();

	if(success)
		return {valid: true, token: body.access_token, refreshToken: body.refresh_token, expiresIn: body.expires_in};
	else
		return {valid: false};
}

// Refresh session token
async function refreshToken()
{
	// const refreshToken = site.config.session.refreshToken;

	// https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch and https://developer.mozilla.org/en-US/docs/Web/API/fetch
	// const response = await fetch('url', options);
	// const json = await response.json();

	if(success)
		return {valid: true, token: body.access_token, refreshToken: body.refresh_token, expiresIn: body.expires_in};
	else
		return {valid: false};
}

// Track comic/manga
async function track(toTrack)
{
	/*
	toTrack:
	{
		id: 0, // Comic id in site
		chapters: 1.1, // Chapters to mark
		chaptersInt: 1, // Chapters to mark
		volumes: 1.1, // Volumes to mark
		volumesInt: 1, // Volumes to mark
		mainPath: '', // Used in tracking.setTrackingChapters
	}
	*/

	/*
	If the session is no longer valid
	tracking.invalidateSession(site.key, Boolean loginDialog = false);

	loginDialog: Show dialog to login again
	*/


	/*
	Update OpenComic tracking info	
	tracking.setTrackingChapters(site.key, {chapters, volumes, progress: {chapters, volumes}}, toTrack.mainPath);

	Send tracking data to the site
	fetch('url', options);
	*/
}

module.exports = {
	setSiteData: setSiteData,
	searchComic: searchComic,
	getComicData: getComicData,
	login: login,
	refreshToken: refreshToken,
	track: track,
};