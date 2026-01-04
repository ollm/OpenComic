const safe = require(p.join(appDir, '.dist/storage/safe.js')),
	syncInstances = require(p.join(appDir, '.dist/storage/sync-instances.js'));

const changes = 139; // Update this if readingPagesConfig is updated

const readingPagesConfig = {
	readingConfigName: '',
	readingView: 'slide',
	readingViewConfig: {
		roughPageTurn: {
			perspective: 6000,
		},
		smoothPageTurn: {
			angle: 30,
		},
	},
	readingViewSpeed: 0.3,
	readingViewAdjustToWidth: false,
	readingNotEnlargeMoreThanOriginalSize: true,
	readingRotate: 0,
	readingRotateHorizontals: 0,
	readingForceSinglePage: false,
	readingMargin: {
		margin: 16,
		top: 16,
		bottom: 16,
		left: 16,
		right: 16
	},
	readingHorizontalsMarginActive: false,
	readingHorizontalsMargin: {
		margin: 16,
		top: 16,
		bottom: 16,
		left: 16,
		right: 16
	},
	readingImageClip: {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0
	},
	readingDelayComicSkip: 1,
	readingDoublePage: false,
	readingDoublePageShadow: {
		active: false,
		size: 7,
		opacity: 50,
		displacement: 5,
	},
	readingDoNotApplyToHorizontals: true,
	readingAlignWithNextHorizontal: true,
	readingBlankPage: false,
	readingManga: false,
	readingWebtoon: false,
	readingSoundEffect: {
		page: {
			play: false,
			volume: 1.0,
			adaptive: true,
			sound: 'page-1',
		},
	},
	readingFilters: {
		brightness: 100,
		saturation: 100,
		contrast: 100,
		sepia: 0,
		hueRotate: 0,
		invert: false,
		negative: false,
		colorize: false,
		onlyBlackAndWhite: true,
		colorPreset: 'redAndBlueGray',
		colors: [{
			h: 0,
			s: 0,
			m: 1,
		}],
	},
	readingEbook: {
		integrated: true,
		ratio: 1.4,
		fontSize: 20,
		fontFamily: '',
		textAlign: false,
		italic: false,
		fontWeight: 0,
		maxWidth: 800,
		minMargin: 40,
		verticalMargin: 20,
		letterSpacing: 0,
		wordSpacing: 0,
		pSpacing: 4,
		pLineHeight: 0.3,
		lineHeight: 1.6,
		colorsTheme: 'app',
	},
	readingAi: {
		artifactRemoval: {
			active: false,
			model: '1x-SaiyaJin-DeJpeg',
		},
		descreen: {
			active: false,
			model: '1x_halftone_patch_060000_G',
		},
		upscale: {
			active: false,
			model: 'realcugan',
			maxMegapixels: 1.5,
			scale: 4,
			noise: 0,
			autoScale: true,
		},
	},
};

const storageDefault = {
	config: {
		appVersion: _package.version,
		changes: changes,
		language: 'en',
		theme: 'material-design',
		themeColor: 'blue',
		nightMode: false,
		nightModeBlackBackground: false,
		nightModeWhiteBlankPage: false,
		systemNightMode: false,
		zoomFactor: 1,
		foldersFirst: true,
		foldersFirstReading: true,
		compressedFirst: true,
		compressedFirstReading: true,
		view: 'module',
		viewIndex: 'module',
		viewRecentlyOpened: 'module',
		sort: 'name-numeric',
		sortIndex: 'name',
		sortRecentlyOpened: 'last-opened',
		sortReading: 'name-numeric',
		sortInvert: false,
		sortInvertIndex: false,
		sortInvertRecentlyOpened: false,
		sortInvertReading: false,
		continueReadingIndex: true,
		continueReadingRecentlyOpened: true,
		recentlyAddedIndex: true,
		recentlyAddedRecentlyOpened: true,
		viewModuleSize: 150,
		viewModuleSizeIndex: 150,
		viewModuleSizeRecentlyOpened: 150,
		fadeCompleted: true,
		fadeCompletedIndex: true,
		fadeCompletedRecentlyOpened: true,
		progressBar: true,
		progressBarIndex: true,
		progressBarRecentlyOpened: true,
		progressPages: true,
		progressPagesIndex: true,
		progressPagesRecentlyOpened: true,
		progressPercent: false,
		progressPercentIndex: false,
		progressPercentRecentlyOpened: false,
		sortAndView: {
			wildcard: {
				view: 'module',
				sort: 'name',
				sortInvert: false,
				foldersFirst: true,
				compressedFirst: true,
				continueReading: true,
				recentlyAdded: true,
				viewModuleSize: 150,	
				fadeCompleted: true,
				progressBar: true,
				progressPages: true,
				progressPercent: false,
			}
		},
		recentlyOpenedItems: 100,
		showFullPathLibrary: false,
		showFullPathOpened: false,
		showLibraryPath: true,
		showFileExtension: false,
		...readingPagesConfig,
		readingMagnifyingGlass: false,
		readingMagnifyingGlassZoom: 2,
		readingMagnifyingGlassSize: 400,
		readingMagnifyingGlassRatio: 1.25,
		readingMagnifyingGlassRadius: 4,
		readingHideContentLeft: false,
		readingHideBarHeader: false,
		readingShowPageNumber: false,
		readingHideContentLeftFullScreen: true,
		readingHideBarHeaderFullScreen: true,
		readingShowPageNumberFullScreen: false,
		readingMaxMargin: 800,
		readingGlobalZoom: true,
		readingGlobalZoomSlide: true,
		readingMoveZoomWithMouse: false,
		readingScrollWithMouse: false,
		readingGoNextPrevChapterWithScroll: true,
		readingStartReadingInFullScreen: false,
		readingTrackingAtTheEnd: true,
		readingTrackingAutoPrompt: false,
		readingTrackingAutoPromptFavorites: true,
		readingDiscordRcp: false,
		readingImageInterpolationMethodDownscaling: 'lanczos3',
		readingImageInterpolationMethodUpscaling: 'chromium',
		readingMusic: {
			play: false,
			volume: 1.0,
		},
		gamepadSensitivity: 5,
		gamepadDeadZone: 0.1,
		disableGamepadInput: false,
		mouseWheelSensitivityInZoom: 10,
		disableTapZones: false,
		invertTapZonesInManga: true,
		saveImageTemplate: '[parentFolder] - [folder] - [image] - [page]',
		saveImageFolder: relative.path(getDownloadsPath()),
		saveImageToFolder: false,
		downloadOpdsFolder: relative.path(p.join(getDocumentsPath(), 'OPDS')),
		downloadOpdsToFolder: false,
		openFilesInNewWindow: false,
		startInFullScreen: false,
		startInContinueReading: false,
		startOnlyFromLibrary: true,
		startOnStartup: false,
		ignoreSingleFoldersLibrary: true,
		ignoreFilesRegex: [
			'',
		],
		openingBehaviorFolder: 'file-list',
		openingBehaviorFile: 'continue-reading-first-page',
		useTheFirstImageAsPosterInFolders: false,
		useTheFirstImageAsPosterInFiles: true,
		renderMaxWidth: 12000,
		checkReleases: installedFromStore.check() ? false : true,
		checkPreReleases: true,
		lastCheckedRelease: '',
		lastCheckedReleaseTime: 0,
		serverTimeoutMultiplier: 1,
		useCustomCacheAndTmpFolder: false,
		customCacheAndTmpFolder: '',
		cacheMaxSize: 256, // MB
		cacheMaxOld: 60,
		tmpMaxSize: 4, // GB
		tmpMaxOld: 30,
		trackingSites: {
			wildcard: {
				favorite: false,
				access: {
					pass: '',
					user: '',
					token: '',
				},
				session: {
					valid: false,
					token: '',
					refreshToken: '',
					expires: 0,
					expiresIn: 0,
				},
			},
		},
	},
	configInit: {
		forceColorProfile: '',
		forceLinuxHiddenTitleBar: false,
	},
	readingShortcutPagesConfig: {
		wildcard: {
			key: 0,
			labels: [
				'',
			],
			...readingPagesConfig,
		}
	},
	readingPagesConfig: {
		wildcard: {
			configKey: false,
			...readingPagesConfig,
		}
	},
	comics: [{
		name: 'Name',
		path: 'Files path',
		added: 0,
		compressed: false,
		bookmark: false,  // TODO: I think this is no longer used now, but I not sure
		folder: true,
		readingProgress: { // TODO: I think this is no longer used now, but I not sure
			path: 'Path',
			lastReading: 0,
			progress: 0,
		},
	},
	{
		name: 'Pepper & Carrot',
		path: relative.path(asarToAsarUnpacked(p.join(appDir, 'Pepper & Carrot'))),
		added: 0,
		compressed: false,
		bookmark: false,
		folder: true,
		readingProgress: {
			index: 0,
			path: '',
			lastReading: 0,
			progress: 0,
		},
	}],
	recentlySearched: [
		'',
	],
	masterFolders: [
		'',
	],
	servers: [{
		name: '',
		path: '',
		user: '',
		pass: '',
		auth: '',
		domain: '',
		showOnLibrary: false,
		filesInSubfolders: false,
	}],
	favorites: {
		wildcard: {
			added: 0,
		}
	},
	labels: [
		'',
	],
	comicLabels: {
		wildcard: [
			'',
		],
	},
	securityScopedBookmarks: {
		wildcard: [{
			path: '',
			bookmark: '',
		}]
	},
	bookmarks: {
		wildcard: [{
			index: 0,
			path: 'Path',
			ebook: false,
			progress: 0,
			chapterIndex: 0,
			chapterProgress: 0,
		}]
	},
	readingProgress: {
		wildcard: {
			index: 0,
			path: 'Path',
			lastReading: 0,
			ebook: false,
			progress: 0,
			chapterIndex: 0,
			chapterProgress: 0,
			// Visible progress
			page: 0,
			pages: 0,
			percent: 0,
			completed: false,
		}
	},
	readingPages: {
		wildcard: {
			pages: 0,
			lastAccess: 0,
		},
	},
	recentlyOpened: {
		wildcard: {
			path: '',
			lastOpened: 0,
		},
	},
	tracking: {
		wildcard: {
			wildcard: {
				id: '',
				active: false,
				autoPrompt: false,
				chapters: 0,
				volumes: 0,
				progress: {
					chapters: 0,
					volumes: 0,
				}
			},
		}
	},
	opdsCatalogs: [{
		title: '',
		subtitle: '',
		url: '',
		showOnLeft: false,
		pass: '',
		user: '',
		auth: '',
		downloadFiles: {
			wildcard: '',
		},
	}],
	shortcuts: {
		browse: {
			actionsConfigured: [
				'',
			],
			shortcuts: {
				wildcard: '',
			},
			tapZones: {
				wildcard: {
					wildcard: {
						leftClick: '',
						rightClick: '',
						middleClick: '',
					},
				},
			},
			gamepad: {
				wildcard: '',
			},
		},
		opds: {
			actionsConfigured: [
				'',
			],
			shortcuts: {
				wildcard: '',
			},
			tapZones: {
				wildcard: {
					wildcard: {
						leftClick: '',
						rightClick: '',
						middleClick: '',
					},
				},
			},
			gamepad: {
				wildcard: '',
			},
		},
		reading: {
			actionsConfigured: [
				'',
			],
			shortcuts: {
				wildcard: '',
			},
			tapZones: {
				wildcard: {
					wildcard: {
						leftClick: '',
						rightClick: '',
						middleClick: '',
					},
				},
			},
			gamepad: {
				wildcard: '',
			},
		},
	},
	colorPresets: [{
		name: '',
		colors: [{
			h: 0,
			s: 0,
			m: 1,
		}],
	}],
	compressedPasswords: {
		wildcard: '',
	},
	compressedMetadata: {
		wildcard: {
			title: '',
			author: '',
		}
	},
	disks: [{
		name: '',
		mount: '',
		type: '',
		hdd: false,
		ssd: false,
		nvme: false,
	}],
	cache: {
		wildcard: {
			lastAccess: 0,
			size: 0,
		}
	},
	cacheFolderThumbnails: {
		wildcard: {
			lastAccess: 0,
			poster: {
				path: '',
				sha: '',
			},
			images: [{
				path: '',
				sha: '',
			}],
		}
	},
	tmpUsage: {
		wildcard: {
			lastAccess: 0,
		}
	},
};

const syncIgnoreKeys = ['cache', 'tmpUsage'];
const storageJson = {};

function getDownloadsPath()
{
	const macosMAS = (installedFromStore.check() && process.platform == 'darwin') ? true : false;
	let path = electronRemote.app.getPath('downloads') || '';

	if(macosMAS)
	{
		const downloads = p.basename(path);
		let segments = path.split(p.sep).filter(Boolean);

		segments = segments.slice(0, 2);
		segments.push(downloads);

		path = p.join('/', ...segments);
	}

	return path;
}

function getDocumentsPath()
{
	const macosMAS = (installedFromStore.check() && process.platform == 'darwin') ? true : false;
	let path = electronRemote.app.getPath('documents') || '';

	if(macosMAS)
	{
		const documents = p.basename(path);
		let segments = path.split(p.sep).filter(Boolean);

		segments = segments.slice(0, 2);
		segments.push(documents);

		path = p.join('/', ...segments);
	}

	return path;
}

function purgeOldAtomic()
{
	// Remove old atomic files
	const files = fs.readdirSync(storagePath);
	const now = Date.now();

	for(const file of files)
	{
		const path = p.join(storagePath, file);
		const stats = fs.statSync(path);

		if(/^[a-z]+\.json\.[0-9]+$/iu.test(file) && (now - stats.mtimeMs) > 86400000) // 24 hours
		{
			try
			{
				fs.unlinkSync(path);
			}
			catch(error)
			{
				console.error(error);
			}
		}
	}
}

var languagesList = false, getLocaleUserLanguageCache = {};

function getLocaleUserLanguage(userLanguage = false)
{
	if(userLanguage === false)
		userLanguage = navigator.language || navigator.userLanguage;

	if(!userLanguage)
		return 'en';

	userLanguage = userLanguage.replace(/\_/g, '-').toLowerCase();

	if(getLocaleUserLanguageCache[userLanguage])
		return getLocaleUserLanguageCache[userLanguage];

	var _userLanguage = userLanguage;

	if(languagesList === false)
		languagesList = JSON.parse(readFileApp('/languages/languagesList.json'));

	var codes = [];

	for(let code in languagesList)
	{
		if(languagesList[code].active)
		{
			codes.push(code.replace(/\_/g, '-'));
		}
	}

	for(let i = 0, len = codes.length; i < len; i++)
	{
		if(codes[i] === userLanguage)
		{
			return getLocaleUserLanguageCache[_userLanguage] = codes[i];
		}
	}

	userLanguage = extract(/^([a-z]+)/iu, userLanguage, 1).toLowerCase();

	for(let i = 0, len = codes.length; i < len; i++)
	{
		if(codes[i] === userLanguage)
		{
			return getLocaleUserLanguageCache[_userLanguage] = codes[i];
		}
	}

	for(let i = 0, len = codes.length; i < len; i++)
	{
		if(extract(/^([a-z]+)/iu, codes[i], 1).toLowerCase() === userLanguage)
		{
			return getLocaleUserLanguageCache[_userLanguage] = codes[i];
		}
	}

	return getLocaleUserLanguageCache[_userLanguage] = 'en';
}

function parseDefaultObj(defaultObj)
{
	let newData;

	if(typeof defaultObj !== 'object')
	{
		newData = defaultObj;
	}
	else if($.isArray(defaultObj))
	{
		newData = updateStorageArrayMD([], defaultObj);
	}
	else
	{
		newData = {};

		for(let key in defaultObj)
		{
			if($.isArray(defaultObj[key]))
				newData[key] = updateStorageArrayMD([], defaultObj[key]);
			else if(key !== 'wildcard' && typeof defaultObj[key] == 'object')
				newData[key] = parseDefaultObj(defaultObj[key]);
			else if(key !== 'wildcard')
				newData[key] = defaultObj[key];
		}
	}

	return newData;
}

function updateStorageArrayMD(data, defaultObj)
{
	let newData = [];

	if(!isEmpty(data))
	{
		for(let i = 0, len = data.length; i < len; i++)
		{
			newData.push(updateStorageMD(data[i], defaultObj[0]));
		}
	}
	else
	{
		let len = defaultObj.length;

		if(len > 1)
		{
			newData = [];

			for(let i = 1; i < len; i++)
			{
				newData.push(defaultObj[i]);
			}
		}
	}

	return newData;
}

function updateStorageMD(data, defaultObj)
{
	let newData;

	if($.isArray(defaultObj))
	{
		newData = updateStorageArrayMD(data, defaultObj);
	}
	else if(typeof defaultObj !== 'object')
	{
		newData = data;
	}
	else
	{
		newData = {};

		for(let key in defaultObj)
		{
			if(key == 'wildcard')
			{
				if(isEmpty(data))
					data = {};

				newData = {};

				for(let key2 in data)
				{
					if(key2 == 'wildcard') // Remove data generated from a previous bug
						delete newData[key2];
					else
						newData[key2] = updateStorageMD(data[key2], defaultObj[key]);
				}
			}
			else if(isEmpty(data) || typeof data[key] === 'undefined')
			{
				newData[key] = parseDefaultObj(defaultObj[key]);
			}
			else if($.isArray(defaultObj[key]))
			{
				newData[key] = updateStorageArrayMD(data[key], defaultObj[key]);
			}
			else if(typeof defaultObj[key] == 'object')
			{
				newData[key] = updateStorageMD(data[key], defaultObj[key]);
			}
			else
			{
				newData[key] = data[key];
			}
		}
	}

	return newData;
}

function updateVar(key, keyVar, value)
{
	if(typeof storageJson[key] === 'undefined')
		storageJson[key] = {};

	storageJson[key][keyVar] = value;

	setData(key, storageJson[key]);
	setLastUpdate(key);
}

function deleteVar(key, keyVar)
{
	if(typeof storageJson[key] === 'undefined')
		storageJson[key] = {};

	delete storageJson[key][keyVar];

	setData(key, storageJson[key]);
	setLastUpdate(key);
}

function update(key, value)
{
	storageJson[key] = value;

	setData(key, storageJson[key]);
	setLastUpdate(key);
}

function push(key, item)
{
	storageJson[key].push(item);

	setData(key, storageJson[key]);
	setLastUpdate(key);
}

var throttles = {};
var debounces = {};

// Improve save perfomance in places that do not require instantaneous save
async function setThrottle(key, value)
{
	storageJson[key] = value;

	app.setThrottle('storage-'+key, function() {

		setData(key, storageJson[key]);
		setLastUpdate(key);

	}, 300, 3000);
}

function setData(key, data)
{
	ejs.set(key, data, function(error) {

		if(syncIgnoreKeys.includes(key))
			return;

		syncInstances.storageUpdated(key);

	});
}

const storageKeys = Object.keys(storageDefault);

async function start(callback)
{
	syncInstances.init();
	ejs.setDataPath(storagePath);

	let data = {};
	const promises = [];

	for(const key of storageKeys)
	{
		promises.push(new Promise(async function(resolve) {

			try
			{
				const json = await fsp.readFile(p.join(storagePath, key+'.json'), 'utf8');
				const _data = JSON.parse(json) || {};
				data[key] = _data;
				resolve();
			}
			catch
			{
				ejs.get(key, function(_data) {

					data[key] = _data;
					resolve();

				});
			}

		}));
	}

	await Promise.all(promises);

	const setup = !data?.config?.appVersion; // Check if this is the first run

	const _appVersion = data?.config?.appVersion || false;
	const _changes = data?.config.changes || false;

	if(!setup && _changes != changes)
	{
		const migration = require(p.join(appDir, '.dist/migration.js'));
		data = migration.start(data);
	}

	for(const key of storageKeys)
	{
		if(setup)
		{
			if(key == 'config')
				storageDefault[key].language = getLocaleUserLanguage();

			let baseData = false;

			switch (key)
			{
				case 'opdsCatalogs':

					baseData = opds.addNewDefaultCatalogs({opdsCatalogs: []}, 0).opdsCatalogs;

					break;
			}

			const newData = updateStorageMD(baseData, storageDefault[key]);

			ejs.set(key, newData, function(error){});
			storageJson[key] = newData;
		}
		else
		{
			if(_appVersion != _package.version || _changes != changes)
			{
				if(key == 'config')
					storageDefault[key].language = getLocaleUserLanguage();

				const newData = (_changes != changes) ? updateStorageMD(data[key], storageDefault[key]) : data[key];

				if(key == 'config')
				{
					newData.appVersion = _package.version;
					newData.changes = changes;
				}

				ejs.set(key, newData, function(error){});
				storageJson[key] = newData;
			}
			else
			{
				storageJson[key] = data[key];
			}
		}
	}

	callback();
}

function _config()
{
	config = storage.get('config');

	tempFolder = settings.getTmpFolder();
	cache.setCacheFolder(settings.getCacheFolder());

	return config;
}

function getDataFromDiskAsync(key, callback = false)
{
	if(syncIgnoreKeys.includes(key) || syncInstances.num === 1)
		return;

	ejs.get(key, function(error, data) {

		if(error) return;

		if(app.isDifferent(storageJson[key], data))
		{
			storageJson[key] = data;
			setLastUpdate(key);

			if(key === 'config')
				storage.config();

			if(callback)
				callback();
		}

	});

	return;
}

// Periodically get data from disk to keep it updated if multiple windows are open
function getPeriodicallyFromDisk()
{
	if(syncInstances.num === 1) // Only one instance, no need to sync
		return;

	ejs.getMany(storageKeys, async function(error, data) {

		if(error) return;

		for(const key of storageKeys)
		{
			if(app.isDifferent(storageJson[key], data[key]))
			{
				storageJson[key] = data[key];
				setLastUpdate(key);

				if(key === 'config')
					storage.config();
			}
		}

	});
}

setInterval(getPeriodicallyFromDisk, 60000); // Every 60 seconds

function updatedFromOtherInstance(key)
{
	getDataFromDiskAsync(key, function() {

		if(storageChangeCallbacks.has(key))
		{
			for(const callback of storageChangeCallbacks.get(key))
			{
				callback(key);
			}
		}

	});
}

const storageChangeCallbacks = new Map();

function onChangeFromOtherInstance(keys, callback) {

	if(typeof keys === 'string')
		keys = [keys];

	for(const key of keys)
	{
		if(!storageChangeCallbacks.has(key))
			storageChangeCallbacks.set(key, []);

		storageChangeCallbacks.get(key).push(callback);
	}
}

function get(key)
{
	return storageJson[key];
}

function getKey(key, key2)
{
	return storageJson[key][key2];
}

const lastUpdate = new Map();

function setLastUpdate(key)
{
	lastUpdate.set(key, (lastUpdate.get(key) || 0) + 1);
}

function _lastUpdate(key)
{
	return lastUpdate.get(key) || 0;
}

function info()
{
	const toKB = (bytes) => (bytes / (1024 ** 1)).toFixed(1);
	let sizes = '';

	for(const key in storage.storageJson)
	{
		sizes += key+': '+toKB(JSON.stringify(storage.get(key)).length)+'KB\n';
	}

	console.log('');
	console.log('Storage info: {key: size}');
	console.log(sizes);
}

module.exports = {
	start: start,
	config: _config,
	get: get,
	getKey: getKey,
	lastUpdate: _lastUpdate,
	updateVar: updateVar,
	setVar: updateVar,
	deleteVar: deleteVar,
	set: update,
	setThrottle: setThrottle,
	update: update,
	push: push,
	storageJson: storageJson,
	updateStorageMD: updateStorageMD,
	parseDefaultObj: parseDefaultObj,
	getLocaleUserLanguage: getLocaleUserLanguage,
	readingPagesConfig: readingPagesConfig,
	changes: changes,
	getDownloadsPath: getDownloadsPath,
	purgeOldAtomic,
	info,
	getDataFromDiskAsync,
	updatedFromOtherInstance,
	safe,
	syncInstances,
	onChangeFromOtherInstance,
};