const sites = [
	{
		key: 'anilist',
		name: 'AniList',
		description: 'Track, Discover, Share Anime & Manga',
		trackingChapter: true, // Supports chapter tracking 
		trackingVolume: true,  // Supports volume tracking
		url: 'https://anilist.co/',
	},
	{
		key: 'myanimelist',
		name: 'MyAnimeList',
		description: 'Anime and manga Database and Community',
		trackingChapter: true, // Supports chapter tracking 
		trackingVolume: true,  // Supports volume tracking
		url: 'https://myanimelist.net/',
	},
];

const trackingSitesKeys = require(p.join(tracking.scriptsPath(), 'tracking-sites-keys.js'));

// Get user site config
function getSiteConfig(site = '')
{
	const configSites = storage.getKey('config', 'trackingSites') || {};

	if(!configSites[site])
	{
		configSites[site] = {
			favorite: false,
			access: {
				pass: '',
				user: '',
				token: '',
			},
			session: {
				valid: false,
				token: '',
			},
		};
	}

	return configSites[site];
}

function list(returnTrackingActive = false)
{
	const _tracking = returnTrackingActive ? storage.getKey('tracking', dom.indexMainPathA()) : false;
	const _sites = sites.map(function(site) {

		const key = site.key;

		return {
			...site,
			logo: '../scripts/tracking/'+key+'/logo.png',
			script: p.join(tracking.scriptsPath(key), key+'.js'),
			config: getSiteConfig(key),
			auth: trackingSitesKeys[key] || {},
			tracking: returnTrackingActive ? (_tracking?.[key] || {id: '', active: false}) : undefined,
		};

	});

	return _sites.sort((a, b) => dom.orderBy(a, b, 'simple', 'name'))
}

function listFavorite(returnTrackingActive = false)
{
	const sites = list(returnTrackingActive);
	return sites.filter(site => site.config.favorite);
}

function site(site = '', returnTrackingActive = false)
{
	const sites = list(returnTrackingActive);
	return sites.find(_site => _site.key === site) || false;
}

module.exports = {
	list: list,
	listFavorite: listFavorite,
	site: site,
};