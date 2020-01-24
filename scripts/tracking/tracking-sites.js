sites = [
	{
		key: 'anilist',
		name: 'AniList',
		description: 'Track, Discover, Share Anime & Manga',
		trackingChapter: true, // Supports chapter tracking 
		trackingVolume: true,  // Supports volume tracking
		url: 'https://anilist.co/',
	},
];


if(fs.existsSync(p.join(tracking.scriptsPath(), '_tracking-sites-keys.js')))
	var trackingSitesKeys = require(p.join(tracking.scriptsPath(), '_tracking-sites-keys.js'));
else
	var trackingSitesKeys = require(p.join(tracking.scriptsPath(), 'tracking-sites-keys.js'));

trackingSitesKeys = trackingSitesKeys.authKeys;

// Get user site config
function getSiteConfig(site = '')
{
	var configSites = storage.getKey('config', 'trackingSites');

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
	var _tracking = false;

	if(returnTrackingActive)
		_tracking = storage.getKey('tracking', dom.indexMainPathA());

	var _sites = [];

	for(let i in sites)
	{
		site = sites[i];

		site.logo = '../scripts/tracking/'+site.key+'/logo.png';
		site.script = p.join(tracking.scriptsPath(site.key), site.key+'.js');
		site.config = getSiteConfig(site.key);
		site.auth = trackingSitesKeys[site.key] ? trackingSitesKeys[site.key] : {};

		if(returnTrackingActive)
		{
			if(_tracking && _tracking[site.key])
				site.tracking = _tracking[site.key];
			else
				site.tracking = {id: '', active: false};
		}

		_sites.push(site);
	}

	_sites.sort(function(a, b) {

		return dom.orderBy(a, b, 'simple', 'name');
	
	});

	return _sites;
}

function listFavorite(returnTrackingActive = false)
{
	var _sites = [];

	_list = list(returnTrackingActive);

	for(let key in _list)
	{
		if(_list[key].config.favorite)
			_sites.push(_list[key]);
	}

	return _sites;
}

function site(site = '', returnTrackingActive = false)
{
	var _sites = list(returnTrackingActive);

	for(let key in _sites)
	{
		if(site == _sites[key].key)
			return _sites[key];
	}

	return false;
}

module.exports = {
	list: list,
	listFavorite: listFavorite,
	site: site,
};