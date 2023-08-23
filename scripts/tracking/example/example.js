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
			token: 'ABCDE', // Token set in login function
		},
	},
};
*/

function setSiteData(siteData)
{
	site = siteData;
}

// Search comic/manga in site
async function searchComic(title, callback = false)
{

	// https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch and https://developer.mozilla.org/en-US/docs/Web/API/fetch
	// if(controller) controller.abort();
	// controller = new AbortController();
	// options = {signal: controller.signal};
	// fetch('url', options).then(async function(response){await response.json()});

	results = [];

	results.push({
		id: 0, // Comic id in site
		title: 'title', // Comic title
		image: 'https://image.small', // Comic small image
	});

	callback(results);
}

// Return data of comic/manga
async function getComicData(siteId, callback = false)
{
	// siteId = Comic id in site

	// https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch and https://developer.mozilla.org/en-US/docs/Web/API/fetch
	// fetch('url', options).then(async function(response){await response.json()});

	callback({
		title: 'title', // Comic title
		image: 'https://image.large', // Comic large image
		chapters: 0, // Total comic chapters
		volumes: 0, // Total comic volumes
		progress: {
			chapters: 0, // User viewed chapters
			volumes: 0, // User viewed volumes
		},
	});
}

// Loging to site
async function login(callback = false)
{
	// Open link to browser, for example to get a token
	// electron.shell.openExternal('https://open-this-link-in-a-browser.com');

	// https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch and https://developer.mozilla.org/en-US/docs/Web/API/fetch
	// fetch('url', options).then(async function(response){await response.json()});

	// Show token dialog
	// tracking.getTokenDialog(site.key, function(token) { });

	// Show user/pass dialog
	// tracking.getUserPassDialog(site.key, function(user, pass) { });

	if(success)
		callback({valid: true, token: body.access_token});
	else
		callback({valid: false});
}

// Track comic/manga
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

	/*
	If the session is no longer valid
	tracking.invalidateSession(site.key, Boolean loginDialog = false);

	loginDialog: Show dialog to login again
	*/
}

module.exports = {
	setSiteData: setSiteData,
	searchComic: searchComic,
	getComicData: getComicData,
	login: login,
	track: track,
};