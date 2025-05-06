const safe = require(p.join(appDir, 'scripts/storage/safe.js'));

const changes = 111; // Update this if readingPagesConfig is updated

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
	readingRotateHorizontals: false,
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
		view: 'module',
		viewIndex: 'module',
		viewRecentlyOpened: 'module',
		sort: 'name-numeric',
		sortIndex: 'name',
		sortRecentlyOpened: 'last-opened',
		sortInvert: false,
		sortInvertIndex: false,
		sortInvertRecentlyOpened: false,
		continueReadingIndex: true,
		continueReadingRecentlyOpened: true,
		recentlyAddedIndex: true,
		recentlyAddedRecentlyOpened: true,
		viewModuleSize: 150,
		viewModuleSizeIndex: 150,
		viewModuleSizeRecentlyOpened: 150,
		sortAndView: {
			wildcard: {
				view: 'module',
				sort: 'name',
				sortInvert: false,
				continueReading: true,
				recentlyAdded: true,
				viewModuleSize: 150,
			}
		},
		recentlyOpenedItems: 100,
		showFullPathLibrary: false,
		showFullPathOpened: false,
		showLibraryPath: true,
		...readingPagesConfig,
		readingMagnifyingGlass: false,
		readingMagnifyingGlassZoom: 2,
		readingMagnifyingGlassSize: 400,
		readingMagnifyingGlassRatio: 1.25,
		readingMagnifyingGlassRadius: 4,
		readingHideContentLeft: false,
		readingHideBarHeader: false,
		readingHideContentLeftFullScreen: true,
		readingHideBarHeaderFullScreen: true,
		readingRotateHorizontalsAnticlockwise: false,
		readingMaxMargin: 800,
		readingGlobalZoom: true,
		readingGlobalZoomSlide: true,
		readingMoveZoomWithMouse: false,
		readingScrollWithMouse: false,
		readingGoNextPrevChapterWithScroll: true,
		readingStartReadingInFullScreen: false,
		readingTrackingAtTheEnd: true,
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
		saveImageTemplate: '[parentFolder] - [folder] - [image] - [page]',
		saveImageFolder: getDownloadsPath(),
		saveImageToFolder: false,
		downloadOpdsFolder: p.join(getDocumentsPath(), 'OPDS'),
		downloadOpdsToFolder: false,
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
		bookmark: false,  // I think this is no longer used now, but I not sure
		folder: true,
		readingProgress: { // I think this is no longer used now, but I not sure
			path: 'Path',
			lastReading: 0,
			progress: 0,
		},
	},
	{
		name: 'Pepper & Carrot',
		path: asarToAsarUnpacked(p.join(appDir, 'Pepper & Carrot')),
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
		}
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
	compressedMetadata: {
		wildcard: {
			title: '',
			author: '',
		}
	},
	cache: {
		wildcard: {
			lastAccess: 0,
			size: 0,
		}
	},
	tmpUsage: {
		wildcard: {
			lastAccess: 0,
		}
	},
};

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

	ejs.set(key, storageJson[key], function(error){});
}

function deleteVar(key, keyVar)
{
	if(typeof storageJson[key] === 'undefined')
		storageJson[key] = {};

	delete storageJson[key][keyVar];

	ejs.set(key, storageJson[key], function(error){});
}

function update(key, value)
{
	storageJson[key] = value;

	ejs.set(key, storageJson[key], function(error){});
}

function push(key, item)
{
	storageJson[key].push(item);

	ejs.set(key, storageJson[key], function(error){});
}

var throttles = {};
var debounces = {};

// Improve save perfomance in places that do not require instantaneous save
async function setThrottle(key, value)
{
	clearTimeout(throttles[key]);

	storageJson[key] = value;

	throttles[key] = setTimeout(function(){

		clearTimeout(debounces[key]);
		debounces[key] = false;

		ejs.set(key, storageJson[key], function(error){});

	}, 300);

	if(debounces[key] === undefined || debounces[key] === false)
	{
		debounces[key] = setTimeout(function(){

			clearTimeout(throttles[key]);
			debounces[key] = false;

			ejs.set(key, storageJson[key], function(error){});

		}, 3000);
	}
}

var storageKeys = [];

for(let key in storageDefault)
{
	storageKeys.push(key);
}

function start(callback)
{
	let storagePath = p.join(electronRemote.app.getPath('userData'), 'storage');

	if(folderPortable.check())
	{
		if(process.env.PORTABLE_EXECUTABLE_DIR)
			storagePath = p.join(process.env.PORTABLE_EXECUTABLE_DIR, 'opencomic', 'storage');
		else
			storagePath = p.join(__dirname, '../../../../', 'opencomic', 'storage');
	}

	ejs.setDataPath(storagePath);

	ejs.getMany(storageKeys, function(error, data) {

		// if(error) throw error;

		if(!isEmpty(data))
			var config = data.config;

		let _appVersion = config.appVersion;
		let _changes = config.changes;

		if(_changes != changes)
		{
			let migration = require(p.join(appDir, 'scripts/migration.js'));
			data = migration.start(data);
		}

		for(let i in storageKeys)
		{
			var key = storageKeys[i];

			if(typeof data == 'undefined' || typeof data[key] == 'undefined')
			{
				if(key == 'config')
					storageDefault[key].language = getLocaleUserLanguage();

				let storageNew = updateStorageMD(false, storageDefault[key]);

				ejs.set(key, storageNew, function(error){});

				storageJson[key] = storageNew;
			}
			else
			{
				if(_appVersion != _package.version || _changes != changes)
				{
					if(key == 'config')
						storageDefault[key].language = getLocaleUserLanguage();

					let newData;

					if(_changes != changes)
						newData = updateStorageMD(data[key], storageDefault[key]);
					else
						newData = data[key];

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
	});
}



function get(key)
{
	return storageJson[key];
}

function getKey(key, key2)
{
	return storageJson[key][key2];
}

module.exports = {
	start: start,
	get: get,
	getKey: getKey,
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
	safe: safe,
};
