var sitesScripts = {};

function loadSiteScript(site)
{
	if(!sitesScripts[site])
	{
		var siteData = trackingSites.site(site);

		if(siteData)
		{
			sitesScripts[site] = require(siteData.script);
			sitesScripts[site].setSiteData(siteData);
		}
	}
}

function setSiteData(site)
{
	var siteData = trackingSites.site(site);

	if(siteData)
	{
		loadSiteScript(site);
		sitesScripts[site].setSiteData(siteData);
	}
}

var tracked = {};

async function track(chapter = false, volume = false, onlySite = false)
{
	var fromDialog = false;

	if(chapter !== false || volume !== false)
	{
		fromDialog = true;
	}
	else
	{
		chapter = getChapter();
		volume = getVolume();
	}

	var _trackingSites = trackingSites.list(true);

	var haveToTracking = false;

	for(let key in _trackingSites)
	{
		if(_trackingSites[key].tracking.active)
			haveToTracking = true;
	}

	if(haveToTracking)
	{
		if(chapter === false && volume === false)
		{
			$('.bar-right-buttons .button-tracking-sites').html('sync_problem').addClass('tracking-problem');
		}
		else
		{
			if(!fromDialog)
				$('.bar-right-buttons .button-tracking-sites').html('sync').removeClass('tracking-problem');

			for(let key in _trackingSites)
			{
				var site = _trackingSites[key];

				var prevTracked = false;

				if(tracked[dom.indexMainPathA()] && tracked[dom.indexMainPathA()][site.key])
				{
					var readingCurrentPath = reading.readingCurrentPath();

					for(let key2 in tracked[dom.indexMainPathA()][site.key])
					{
						if(readingCurrentPath == tracked[dom.indexMainPathA()][site.key][key2])
						{
							prevTracked = true;

							break;
						}
					}
				}

				if(site.config.session.valid && ((onlySite && onlySite == site.key) || (site.tracking.active && !prevTracked && !onlySite)))
				{
					if(!tracked[dom.indexMainPathA()]) tracked[dom.indexMainPathA()] = {};
					if(!tracked[dom.indexMainPathA()][site.key]) tracked[dom.indexMainPathA()][site.key] = [];
					tracked[dom.indexMainPathA()][site.key].push(reading.readingCurrentPath());

					loadSiteScript(site.key);

					sitesScripts[site.key].track({
						id: site.tracking.id,
						chapters: chapter,
						volumes: volume,
					});
				}
			}
		}
	}
}

function saveSiteConfig(site, key, value)
{
	var siteData = trackingSites.site(site);
	var configSites = storage.getKey('config', 'trackingSites');

	siteData.config[key] = value;

	configSites[site] = siteData.config;
	storage.updateVar('config', 'trackingSites', configSites);

	setSiteData(site);
}

function configTracking(site = '', force = false)
{
	var siteData = trackingSites.site(site, true);

	if(siteData)
	{
		if($('#tracking-sites, .bar-right-buttons .button-tracking-sites').length >= 2)
		{
			reading.magnifyingGlassControl(2);
			events.desactiveMenu('#tracking-sites', '.bar-right-buttons .button-tracking-sites');
		}

		loadSiteScript(site);

		if(siteData.config.session.valid && siteData.tracking.id)
		{
			currentTrackingDialog(site);
		}
		else if(siteData.config.session.valid)
		{
			searchDialog(site);
		}
		else
		{
			login(site, true);
		}
	}
}

// Execute site login function
function login(site, fromConfig = false)
{
	var siteData = trackingSites.site(site);

	if(siteData)
	{
		loadSiteScript(site);

		sitesScripts[site].login(function(session) {

			if(session.valid)
			{
				setSessionToken(site, session.token);
				
				if(fromConfig)
					configTracking(site, true);
				else
					tracking.track();
			}
			else
			{
				invalidateSession(site, true, true);
			}

		});
	}
}

// Get session

// Save session token
function setSessionToken(site = '', token = '')
{
	saveSiteConfig(site, 'session', {valid: true, token: token});
}

// Remove session token
function invalidateSession(site = '', loginDialog = false, fromConfig = false)
{
	saveSiteConfig(site, 'session', {valid: false, token: ''});

	if(loginDialog)
		invalidTokenDialog(site, fromConfig);
}

// Active and deactivate tracking site
function activeAndDeactivateTrackingSite(site = '', active = false)
{
	var _tracking = storage.getKey('tracking', dom.indexMainPathA());
	if(!_tracking) _tracking = {};

	if(_tracking[site])
		_tracking[site].active = active;

	storage.updateVar('tracking', dom.indexMainPathA(), _tracking);
}

// Current dialog
function currentTrackingDialog(site)
{
	var siteData = trackingSites.site(site, true);

	if(siteData)
	{
		loadSiteScript(site);

		events.dialog({
			header: false,
			width: 500,
			height: (!siteData.trackingChapter || !siteData.trackingVolume) ? 398 : 470,
			content: template.load('loading.html'),
			buttons: false,
		});

		sitesScripts[site].getComicData(siteData.tracking.id, function(data){

			handlebarsContext.trackingResult = data;
			handlebarsContext.siteData = siteData;

			$('.dialog-text').html(template.load('dialog.tracking.current.tracking.html'));

			events.events();

		});
	}
}

// Login dialogs
getTokenDialogCallback = false;

function getTokenDialog(site = '', callback = false, done = false)
{
	if(done)
	{
		var token = $('.input-token').val();

		if(!isEmpty(token))
		{
			if(getTokenDialogCallback)
				getTokenDialogCallback(token);
		}
		else
		{
			if(getTokenDialogCallback)
				getTokenDialogCallback(false);
		}
	}
	else
	{
		var siteData = trackingSites.site(site);

		if(siteData)
		{
			getTokenDialogCallback = callback;

			if(!handlebarsContext.tracking) handlebarsContext.tracking = {};
			handlebarsContext.tracking.getTokenInput = hb.compile(language.dialog.tracking.getTokenInput)({siteName: siteData.name});

			events.dialog({
				header: hb.compile(language.dialog.tracking.getTokenHeader)({siteName: siteData.name}),
				width: 400,
				height: false,
				content: template.load('dialog.tracking.sites.token.html'),
				buttons: [
					{
						text: language.dialog.buttons.cancel,
						function: 'events.closeDialog();',
					},
					{
						text: language.dialog.buttons.ok,
						function: 'events.closeDialog(); tracking.getTokenDialog(\''+site+'\', false, true);',
					}
				],
			});
		}
	}
}

function invalidTokenDialog(site, fromConfig = false)
{
	var siteData = trackingSites.site(site);

	events.dialog({
		header: hb.compile(language.dialog.tracking.invalidTokenHeader)({siteName: siteData.name}),
		width: 400,
		height: false,
		content: hb.compile(language.dialog.tracking.resendToken)({siteName: siteData.name}),
		buttons: [
			{
				text: language.dialog.buttons.cancel,
				function: 'events.closeDialog();',
			},
			{
				text: language.dialog.buttons.ok,
				function: 'events.closeDialog(); tracking.login(\''+site+'\', '+(fromConfig ? 'true' : 'false')+');',
			}
		],
	});
}

// Search functions
function searchDialog(site)
{
	var siteData = trackingSites.site(site);

	if(!handlebarsContext.tracking) handlebarsContext.tracking = {};
	handlebarsContext.tracking.serachIn = hb.compile(language.dialog.tracking.serachIn)({siteName: siteData.name});

	handlebarsContext.trackingSiteKey = site;

	events.dialog({
		header: false,
		width: 500,
		height: 400,
		content: template.load('dialog.tracking.search.html'),
		buttons: false,
	});

	var title = getTitle();

	searchComic(site, title);
}

function searchComic(site, title = false)
{
	if(!title)
		title = getTitle();

	loadSiteScript(site);

	handlebarsContext.trackingSiteKey = site;

	sitesScripts[site].searchComic(title, function(results) {

		handlebarsContext.trackingResults = results;

		$('.tracking-search').html(template.load('dialog.tracking.search.results.html'));

	});
}

searchInputST = false;

function searchInput(site)
{
	clearTimeout(searchInputST);

	$('.tracking-search').html(template.load('loading.html'));

	searchInputST = setTimeout(function(site){

		var title = $('.input-search').val();

		searchComic(site, title);

	}, 300, site);
}

function setTrackingId(site, siteId)
{
	events.closeDialog();

	var _tracking = storage.getKey('tracking', dom.indexMainPathA());
	if(!_tracking) _tracking = {};

	_tracking[site] = {
		id: siteId,
		active: true,
	};

	storage.updateVar('tracking', dom.indexMainPathA(), _tracking);

	if(tracked[dom.indexMainPathA()] && tracked[dom.indexMainPathA()][site])
		tracked[dom.indexMainPathA()][site] = {};

	tracking.track();

	// Snackbar here
}

// Others dialogs
function addChapterNumberDialog(done = false, onlySite = false)
{
	if(done)
	{
		var chapter = +$('.input-chapter').val();
		var volume = +$('.input-volume').val();

		if(chapter < 1)
			chapter = false;

		if(volume < 1)
			volume = false;
	
		if(chapter !== false || volume !== false)
		{
			tracking.track(chapter, volume, onlySite);
		}
	}
	else
	{
		if($('#tracking-sites, .bar-right-buttons .button-tracking-sites').length >= 2)
		{
			reading.magnifyingGlassControl(2);
			events.desactiveMenu('#tracking-sites', '.bar-right-buttons .button-tracking-sites');
		}

		events.dialog({
			header: language.dialog.tracking.setHeader,
			width: 400,
			height: false,
			content: template.load('dialog.tracking.sites.chapter.number.html'),
			buttons: [
				{
					text: language.dialog.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.dialog.buttons.ok,
					function: 'events.closeDialog(); tracking.addChapterNumberDialog(true);',
				}
			],
		});
	}
}

// Scraping functions
function getTitle()
{
	var title = '';

	if(reading.readingCurrentPath() && inArray(fileExtension(reading.readingCurrentPath()), compressedExtensions.all))
		title = reading.readingCurrentPath() ? p.basename(reading.readingCurrentPath()).replace(/\.[^/.]+$/, '') : '';
	else
		title = dom.indexMainPathA() ? p.basename(dom.indexMainPathA()) : '';

	// return only first 4 words to avoid incorrect words from the end of the filename
	title = title.split(/\s+/).splice(0, 4).join(' ');

	return title;
}

function getChapter()
{
	var regexs = [
		/chapters?|episodes?/, // English
		/caps?|cap[íi]tulos?|episodios/, // Spanish
		/cap[íi]tols?|episodis?/, // Catalan
	];

	var regexsMin = [
		/ch?|ep?/, // English
	];

	if(reading.readingCurrentPath())
		var name = p.basename(reading.readingCurrentPath());
	else
		return false;

	var chapter = extract(new RegExp('('+joinRegexs(regexs).source+')'+/[\.\-_:;\s]*(\d+)/.source, 'iu'), name, 2);

	if(chapter.length == 0)
	{
		chapter = extract(new RegExp(/(^|[\.\-_:;\s])/.source+'('+joinRegexs(regexsMin).source+')'+/[\.\-_:;\s]*(\d+)/.source, 'iu'), name, 3);

		if(chapter.length == 0) // Start with chapter number
			chapter = extract(/^\s*([0-9]+)/iu, name, 3);
	}

	return chapter.length > 0 ? +chapter : false;
}

function getVolume()
{
	var regexs = [
		/volumes?/, // English
		/tomos?/, // Spanish
		/toms?/, // Catalan
	];

	var regexsMin = [
		/vo?|vol/, // English
	];

	if(reading.readingCurrentPath())
		var name = p.basename(reading.readingCurrentPath());
	else
		return false;

	var volume = extract(new RegExp('('+joinRegexs(regexs).source+')'+/[\.\-_:;\s]*(\d+)/.source, 'iu'), name, 2);

	if(volume.length == 0)
		volume = extract(new RegExp(/(^|[\.\-_:;\s])/.source+'('+joinRegexs(regexsMin).source+')'+/[\.\-_:;\s]*(\d+)/.source, 'iu'), name, 3);

	return volume.length > 0 ? +volume : false;
}


function scriptsPath(site = '')
{
	return p.join(appDir, 'scripts/tracking/'+site);
}

module.exports = {
	scriptsPath: scriptsPath,
	configTracking: configTracking,
	setSessionToken: setSessionToken,
	invalidateSession: invalidateSession,
	addChapterNumberDialog: addChapterNumberDialog,
	getTokenDialog: getTokenDialog,
	invalidTokenDialog: invalidTokenDialog,
	searchDialog: searchDialog,
	getTitle: getTitle,
	login: login,
	searchInput: searchInput,
	setTrackingId: setTrackingId,
	track: track,
	getChapter: getChapter,
	getVolume: getVolume,
	activeAndDeactivateTrackingSite: activeAndDeactivateTrackingSite,
	tracked: function(){return tracked},
};