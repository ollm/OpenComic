var sitesScripts = {};

function loadSiteScript(site)
{
	if(!sitesScripts[site])
	{
		const siteData = app.copy(trackingSites.site(site));

		if(siteData)
		{
			siteData.config.access.pass = storage.safe.decrypt(siteData.config.access.pass);
			siteData.config.access.token = storage.safe.decrypt(siteData.config.access.token);
			siteData.config.session.token = storage.safe.decrypt(siteData.config.session.token);
			siteData.config.session.refreshToken = storage.safe.decrypt(siteData.config.session.refreshToken);

			sitesScripts[site] = require(siteData.script);
			sitesScripts[site].setSiteData(siteData);
		}
	}
}

function setSiteData(site)
{
	const siteData = app.copy(trackingSites.site(site));

	if(siteData)
	{
		siteData.config.access.pass = storage.safe.decrypt(siteData.config.access.pass);
		siteData.config.access.token = storage.safe.decrypt(siteData.config.access.token);
		siteData.config.session.token = storage.safe.decrypt(siteData.config.session.token);
		siteData.config.session.refreshToken = storage.safe.decrypt(siteData.config.session.refreshToken);

		loadSiteScript(site);
		sitesScripts[site].setSiteData(siteData);
	}
}

var tracked = {}, trackST = [], trackIndex = 0;

async function track(chapter = false, volume = false, onlySite = false, reduceIfTrackingAtTheEndIsEnabled = false)
{
	let fromDialog = false;

	if(chapter !== false || volume !== false)
	{
		fromDialog = true;
	}
	else
	{
		chapter = getChapter();
		volume = getVolume();

		if(reduceIfTrackingAtTheEndIsEnabled && config.readingTrackingAtTheEnd)
		{
			chapter = chapter > 1 ? chapter - 1 : false;
			volume = volume > 1 ? volume - 1 : false;
		}
	}

	const _trackingSites = trackingSites.list(true);

	let haveToTracking = false;

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

			const mainPath = dom.history.mainPath;
			const readingCurrentPath = reading.readingCurrentPath();

			let chapters = '??';
			let volumes = '??';

			const tracking = storage.getKey('tracking', mainPath);

			for(let site in tracking)
			{
				if(!onlySite || onlySite == site)
				{
					const data = tracking[site];

					if(data.chapters)
						chapters = data.chapters;

					if(data.volumes)
						volumes = data.volumes;

					const lastUpdatedChapters = data.lastUpdatedChapters || 0;

					if(Date.now() - lastUpdatedChapters > 604800000) // One week
					{
						loadSiteScript(site);
						const comicData = (await sitesScripts[site].getComicData(data.id)) || {};
						setTrackingChapters(site, comicData, mainPath);
					}
				}
			}

			let allTracked = true;

			for(let key in _trackingSites)
			{
				const site = _trackingSites[key];
				let prevTracked = false;

				if(tracked[mainPath] && tracked[mainPath][site.key])
				{
					for(let key2 in tracked[mainPath][site.key])
					{
						if(readingCurrentPath == tracked[mainPath][site.key][key2])
						{
							prevTracked = true;

							break;
						}
					}
				}

				const progress = tracking[site.key]?.progress || {};
				const prevTrackedInSite = ((!chapter || chapter <= progress.chapters) && (!volume || volume <= progress.volumes)) ? true : false;

				if(site.config.session.valid && ((onlySite && onlySite == site.key) || (site.tracking.active && !prevTracked && !prevTrackedInSite && !onlySite)))
					allTracked = false;
			}

			if(!allTracked)
			{
				trackST[trackIndex] = setTimeout(function(vars) {

					console.log('Tracking');

					for(let key in _trackingSites)
					{
						const site = _trackingSites[key];
						let prevTracked = false;

						if(tracked[mainPath] && tracked[mainPath][site.key])
						{
							for(let key2 in tracked[mainPath][site.key])
							{
								if(readingCurrentPath == tracked[mainPath][site.key][key2])
								{
									prevTracked = true;

									break;
								}
							}
						}

						if(site.config.session.valid && ((vars.onlySite && vars.onlySite == site.key) || (site.tracking.active && !prevTracked && !vars.onlySite)))
						{
							if(!tracked[mainPath]) tracked[mainPath] = {};
							if(!tracked[mainPath][site.key]) tracked[mainPath][site.key] = [];
							tracked[mainPath][site.key].push(readingCurrentPath);

							loadSiteScript(site.key);

							sitesScripts[site.key].track({
								id: site.tracking.id,
								chapters: vars.chapter,
								volumes: vars.volume,
								mainPath: mainPath,
							});
						}
					}

				}, 10500, { // 10.5 seconds to track
					chapter: chapter,
					volume: volume,
					onlySite: onlySite,
				});

				// Remove prev

				events.snackbar({
					key: 'trackingConfirm',
					text: language.reading.tracking.marked+': '+(chapter !== false ? language.reading.tracking.chapter+' '+chapter+'/'+chapters : '')+(volume !== false ? (chapter !== false ? ' · ' : '')+language.reading.tracking.volume+' '+volume+'/'+volumes : ''),
					duration: 10,
					update: true,
					buttons: [
						{
							text: language.buttons.dismiss,
							function: 'events.closeSnackbar();',
						},
						{
							text: language.buttons.undo,
							function: 'events.closeSnackbar(); clearTimeout(tracking.trackST()['+trackIndex+'])',
						},
					],
				});

				trackIndex++;
			}
		}
	}
}

function saveSiteConfig(site, key, value)
{
	const siteData = trackingSites.site(site);
	const configSites = storage.getKey('config', 'trackingSites');

	siteData.config[key] = value;

	configSites[site] = siteData.config;
	storage.updateVar('config', 'trackingSites', configSites);

	setSiteData(site);
}

function configTracking(site = '', force = false)
{
	const siteData = trackingSites.site(site, true);
	if(!siteData) return;

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

// Execute site login function
async function login(site, fromConfig = false)
{
	const siteData = trackingSites.site(site);
	if(!siteData) return;

	loadSiteScript(site);

	const session = await sitesScripts[site].login();

	if(session.valid)
	{
		setSessionToken(site, session);
		
		if(fromConfig)
			configTracking(site, true);
		else
			tracking.track(false, false, false, true);
	}
	else
	{
		invalidateSession(site, true, true);
	}
}

// Refresh tokens
async function refreshTokens(force = false)
{
	const _trackingSites = trackingSites.list(true);
	const time = app.time();

	for(let key in _trackingSites)
	{
		const siteData = _trackingSites[key];
		const site = siteData.key;
		const currentSession = siteData.config.session;

		// Check if session is valid and refresh token if needed
		if(currentSession.valid && currentSession.refreshToken && (force || !currentSession.expires || (currentSession.expires - currentSession.expiresIn / 2) < time))
		{
			loadSiteScript(site);

			sitesScripts[site].refreshToken().then(function(session) {

				if(session.valid)
					setSessionToken(site, session);
				else
					invalidateSession(site, true);

			});	
		}
	}
}

// Save session token
function setSessionToken(site = '', session = {})
{
	session.expiresIn = (session.expiresIn || !session.refreshToken) ? session.expiresIn : 3600;
	const expires = (session.expiresIn ? app.time() + session.expiresIn : 0);

	saveSiteConfig(site, 'session', {
		valid: true,
		token: storage.safe.encrypt(session.token),
		refreshToken: storage.safe.encrypt(session.refreshToken),
		expires: expires,
		expiresIn: session.expiresIn,
	});
}

// Remove session token
function invalidateSession(site = '', loginDialog = false, fromConfig = false)
{
	saveSiteConfig(site, 'session', {valid: false, token: '', refreshToken: '', expires: 0, expiresIn: 0});

	if(loginDialog)
		invalidTokenDialog(site, fromConfig);
}

// Active and deactivate tracking site
function activeAndDeactivateTrackingSite(site = '', active = false)
{
	const _tracking = storage.getKey('tracking', dom.history.mainPath) || {};

	if(_tracking[site])
		_tracking[site].active = active;

	storage.updateVar('tracking', dom.history.mainPath, _tracking);
}

// Current dialog
async function currentTrackingDialog(site)
{
	const siteData = trackingSites.site(site, true);
	if(!siteData) return;

	loadSiteScript(site);

	events.dialog({
		header: false,
		width: 500,
		height: (!siteData.trackingChapter || !siteData.trackingVolume) ? 446 : 526,
		content: template.load('loading.html'),
		buttons: false,
	});

	const path = dom.history.mainPath;

	const data = await sitesScripts[site].getComicData(siteData.tracking.id);
	if(data === null) return; // Invalid session

	data.url = siteData.pageUrl.replace('{{siteId}}', siteData.tracking.id);
	handlebarsContext.trackingResult = data;
	handlebarsContext.siteData = siteData;

	if(!handlebarsContext.trackingResult.chapters)
		handlebarsContext.trackingResult.chapters = '??';

	if(!handlebarsContext.trackingResult.volumes)
		handlebarsContext.trackingResult.volumes = '??';

	setTrackingChapters(site, data, path);

	$('.dialog-text').html(template.load('dialog.tracking.current.tracking.html'));

	events.events();
}

// Login dialogs
var getRedirectResultResolve = false;

async function getRedirectResult(site, url)
{
	const siteData = trackingSites.site(site);
	if(!siteData) return;

	events.dialog({
		header: hb.compile(language.dialog.auth.loginTo)({siteName: siteData.name}),
		width: 400,
		height: false,
		content: '<div style="height: 72px;">'+template.load('loading.html')+'</div>',
		onClose: 'tracking.handleOpenUrl();',
		buttons: [
			{
				text: language.buttons.cancel,
				function: 'events.closeDialog(); tracking.handleOpenUrl();',
			},
			{
				text: language.dialog.auth.manualLogin,
				function: 'events.closeDialog(); tracking.getTokenDialog(\''+site+'\');',
			}
		],
	});

	console.log('getRedirectResult', url);
	electron.shell.openExternal(url);

	return new Promise(function(resolve){
		getRedirectResultResolve = resolve;
	});
}

async function getTokenDialog(site = '', done = false)
{
	if(done)
	{
		const token = $('.input-token').val();
		const url = !/^(?:https?|opencomic):\/\//.test(token) ? 'opencomic://tracking/'+(!/=/.test(token) ? 'token=' : '')+token : token;

		tracking.handleOpenUrl(new URL(url));
	}
	else
	{
		const siteData = trackingSites.site(site);
		if(!siteData) return;

		if(!handlebarsContext.tracking) handlebarsContext.tracking = {};
		handlebarsContext.tracking.getTokenInput = hb.compile(language.dialog.tracking.getTokenInput)({siteName: siteData.name});

		events.dialog({
			header: hb.compile(language.dialog.tracking.getTokenHeader)({siteName: siteData.name}),
			width: 400,
			height: false,
			content: template.load('dialog.tracking.sites.token.html'),
			onClose: 'tracking.handleOpenUrl();',
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog(); tracking.handleOpenUrl();',
				},
				{
					text: language.buttons.ok,
					function: 'events.closeDialog(); tracking.getTokenDialog(\''+site+'\', true);',
				}
			],
		});

		events.focus('.input-token');
		events.eventInput();
	}
}

function invalidTokenDialog(site, fromConfig = false)
{
	const siteData = trackingSites.site(site);

	events.dialog({
		header: hb.compile(language.dialog.auth.sessionExpired)({siteName: siteData.name}),
		width: 400,
		height: false,
		content: hb.compile(language.dialog.auth.loginAgain)({siteName: siteData.name}),
		buttons: [
			{
				text: language.buttons.cancel,
				function: 'events.closeDialog();',
			},
			{
				text: language.buttons.ok,
				function: 'events.closeDialog(); tracking.login(\''+site+'\', '+(fromConfig ? 'true' : 'false')+');',
			}
		],
	});
}

// Search functions
function searchDialog(site)
{
	const siteData = trackingSites.site(site);

	if(!handlebarsContext.tracking) handlebarsContext.tracking = {};
	handlebarsContext.tracking.serachIn = hb.compile(language.dialog.tracking.serachIn)({siteName: siteData.name});

	const title = getTitle();

	handlebarsContext.trackingTitle = title;
	handlebarsContext.trackingSiteKey = site;

	events.dialog({
		header: false,
		width: 500,
		height: 600,
		content: template.load('dialog.tracking.search.html'),
		buttons: false,
	});

	events.focus('.input-search');
	events.eventInput();

	searchComic(site, title);
}

async function searchComic(site, title = false)
{
	if(!title)
		title = getTitle();

	loadSiteScript(site);

	handlebarsContext.trackingSiteKey = site;

	let results = await sitesScripts[site].searchComic(title);
	if(results === null) return; // Invalid session

	results = results.map(function(result){

		const last = result.authors.pop();
		result.authors = result.authors.length ? result.authors.join(', ')+' '+language.global.and+' '+last : last;

		return result;

	});

	handlebarsContext.trackingResults = results;

	$('.tracking-search').html(template.load('dialog.tracking.search.results.html'));
}

searchInputST = false;

function searchInput(site)
{
	clearTimeout(searchInputST);

	$('.tracking-search').html(template.load('loading.html'));

	searchInputST = setTimeout(function(site){

		const title = $('.input-search').val();
		searchComic(site, title);

	}, 300, site);
}

function setTrackingId(site, siteId)
{
	events.closeDialog();

	const _tracking = storage.getKey('tracking', dom.history.mainPath) || {};

	_tracking[site] = {
		id: siteId,
		active: true,
	};

	storage.updateVar('tracking', dom.history.mainPath, _tracking);

	if(tracked[dom.history.mainPath] && tracked[dom.history.mainPath][site])
		tracked[dom.history.mainPath][site] = [];

	tracking.track(false, false, false, true);

	// Snackbar here
}

function setTrackingChapters(site, options = {}, path = dom.history.mainPath)
{
	const _tracking = storage.getKey('tracking', path) || {};
	let data = _tracking[site] || {}

	data = {
		...data,
		chapters: options.chapters || data.chapters || false,
		volumes: options.volumes || data.volumes || false,
		progress: {
			chapters: options.progress?.chapters ?? data.progress?.readChapters ?? false,
			volumes: options.progress?.volumes ?? data.progress?.readVolumes ?? false,
		},
		lastUpdatedChapters: Date.now(),
	};

	_tracking[site] = data;
	storage.updateVar('tracking', path, _tracking);
}

// Others dialogs
function addChapterNumberDialog(done = false, onlySite = false)
{
	if(done)
	{
		let chapter = +$('.input-chapter').val();
		let volume = +$('.input-volume').val();

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
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.ok,
					function: 'events.closeDialog(); tracking.addChapterNumberDialog(true);',
				}
			],
		});

		events.focus('.input-chapter');
		events.eventInput();
	}
}

function getStatus()
{
	const tracking = storage.getKey('tracking', dom.history.mainPath);

	return tracking;
}

// Scraping functions
function getTitle(full = false)
{
	const path = reading.readingCurrentPath();
	if(!path) return '';

	let title = '';

	const firstCompressedFile = fileManager.firstCompressedFile(path);
	const metadata = fileManager.compressedMetadata(firstCompressedFile);

	if(metadata)
		title = metadata.series || metadata.localizedSeries || metadata.title || '';

	if(!title)
	{
		if(compatible.compressed(path))
			title = p.basename(path).replace(/\.[^/.]+$/, '');
		else
			title = dom.history.mainPath ? p.basename(dom.history.mainPath) : '';
	}

	// Try detect end of name
	title = title.replace(/(?:[\.\-_:;]|\sv[0-9]+).*/, '', title).trim();

	// return only first 4 words to avoid incorrect words from the end of the filename
	if(!full)
		title = title.split(/\s+/).splice(0, 4).join(' ');

	return title;
}

function getTitlesAndMetadata()
{
	const path = reading.readingCurrentPath();
	if(!path) return;

	const name = p.basename(path);

	const titles = [
		name,
	];

	const firstCompressedFile = fileManager.firstCompressedFile(path);
	const metadata = fileManager.compressedMetadata(firstCompressedFile);

	if(metadata.title)
		titles.push(metadata.title);

	if(firstCompressedFile)
	{
		const compressedName = p.basename(firstCompressedFile);

		if(compressedName !== name)
			titles.push(compressedName);
	}

	const images = [];

	for(let i = 0, len = handlebarsContext.comics?.length; i < len; i++)
	{
		const comic = handlebarsContext.comics[i];
		
		if(comic.name)
			images.push(comic.name);
	}

	return {
		titles: titles,
		images: images,
		chapter: 0, // metadata.bookNumber ?? 0,
		volume: metadata.volume ?? 0,
		metadata,
	};
}

function getChapter()
{
	const regexs = [
		/chapters?|episodes?|issues?/, // English
		/caps?|cap[íi]tulos?|episodios/, // Spanish
		/cap[íi]tols?|episodis?/, // Catalan
	];

	const regexsEnd = [
		/話/, // Japanese
	];

	const regexsMin = [
		/ch?|ep?/, // English
	];

	const data = getTitlesAndMetadata();
	if(!data) return false;

	let number = data.chapter;

	const reliablePatterns = [
		// Match common patterns like Chapter 5, Capítulo-5, etc.
		new RegExp('(?:'+joinRegexs(regexs).source+')'+/[\.\-_:;\(\)\[\]\s]*((?:\d+\.)?\d+)/.source, 'iu'),

		// Match ending patterns like 5話
		new RegExp(/((?:\d+\.)?\d+)/.source+'(?:'+joinRegexs(regexsEnd).source+')', 'iu'),

		// Match Ch. 5, Ep 3, etc.
		new RegExp(/(?:^|[\.\-_:;\(\)\[\]\s])/.source+'(?:'+joinRegexs(regexsMin).source+')'+/[\.\-_:;\(\)\[\]\s]*((?:\d+\.)?\d+)/.source, 'iu'),
	];

	const patterns = [
		...reliablePatterns,

		// Range chapters
		/[0-9]{1,4}-([0-9]{1,4})/iu,
	];

	for(const title of data.titles)
	{
		if(number) break;

		for(const regex of patterns)
		{
			number = app.extract(regex, title, 1);
			if(number) break;
		}
	}

	// Find in image names
	for(const title of data.images)
	{
		if(number) break;

		for(const regex of reliablePatterns)
		{
			number = app.extract(regex, title, 1);
			if(number) break;
		}
	}

	// Run this patters after the main patterns
	const patternsLast = [
		// Match only a number at the start of the title
		/^\s*([0-9]+)/iu
	];

	for(const title of data.titles)
	{
		if(number) break;

		for(const regex of patternsLast)
		{
			number = app.extract(regex, title, 1);
			if(number) break;
		}

		if(!number)
		{
			const volume = getVolume();

			if(!volume) // Has a 1 or 4 digit number (Only if no volume are detected)
				number = app.extract(/\s([0-9]{1,4})(?:\s|\.|$)/iu, title, 1);
		}

		if(!number && /^\d+$/.test(title)) // the folder name is numeric
			number = title;
	}

	return number > 0 ? +number : false;
}

function getVolume()
{
	const regexs = [
		/volumes?/, // English
		/tomos?|volumen|volumenes/, // Spanish
		/toms?/, // Catalan
	];

	const regexsEnd = [
		/巻/, // Japanese
	];

	const regexsMin = [
		/vo?|vol/, // English
	];

	const data = getTitlesAndMetadata();
	if(!data) return false;

	let number = data.volume;

	const reliablePatterns = [
		// Match common patterns like volume 5, Tom-5, etc.
		new RegExp('(?:'+joinRegexs(regexs).source+')'+/[\.\-_:;\(\)\[\]\s]*((?:\d+\.)?\d+)/.source, 'iu'),

		// Match ending patterns like 5巻
		new RegExp(/((?:\d+\.)?\d+)/.source+'(?:'+joinRegexs(regexsEnd).source+')', 'iu'),

		// Match Vo. 5, Vol 3, etc.
		new RegExp(/(?:^|[\.\-_:;\(\)\[\]\s])/.source+'(?:'+joinRegexs(regexsMin).source+')'+/[\.\-_:;\(\)\[\]\s]*((?:\d+\.)?\d+)/.source, 'iu'),
	];

	const patterns = [
		...reliablePatterns,
	];

	for(const title of data.titles)
	{
		if(number) break;

		for(const regex of patterns)
		{
			number = app.extract(regex, title, 1);
			if(number) break;
		}
	}

	// Find in image names
	for(const title of data.images)
	{
		if(number) break;

		for(const regex of reliablePatterns)
		{
			number = app.extract(regex, title, 1);
			if(number) break;
		}
	}

	return number > 0 ? +number : false;
}

function handleOpenUrl(url = false)
{
	if(!getRedirectResultResolve) return;
	if(!url) url = new URL('opencomic://tracking');

	getRedirectResultResolve(url);
	getRedirectResultResolve = false;
}

function scriptsPath(site = '')
{
	return p.join(appDir, 'scripts/tracking/'+site);
}

function start()
{
	refreshTokens();
	setInterval(refreshTokens, 60 * 60 * 12 * 1000); // Every 12 hours
}

module.exports = {
	scriptsPath: scriptsPath,
	configTracking: configTracking,
	setSessionToken: setSessionToken,
	invalidateSession: invalidateSession,
	addChapterNumberDialog: addChapterNumberDialog,
	getRedirectResult: getRedirectResult,
	getTokenDialog: getTokenDialog,
	invalidTokenDialog: invalidTokenDialog,
	searchDialog: searchDialog,
	getTitle: getTitle,
	login: login,
	refreshTokens: refreshTokens,
	searchInput: searchInput,
	setTrackingId: setTrackingId,
	setTrackingChapters: setTrackingChapters,
	track: track,
	trackST: function(){return trackST},
	getChapter: getChapter,
	getVolume: getVolume,
	getTitlesAndMetadata,
	getStatus,
	activeAndDeactivateTrackingSite: activeAndDeactivateTrackingSite,
	tracked: function(){return tracked},
	handleOpenUrl: handleOpenUrl,
	start: start,
};
