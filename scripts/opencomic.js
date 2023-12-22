//console.time('Starting time');

//console.time('Require time 1');
/*
window.onerror = function(msg, url, linenumber) {

    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;

}*/

function fullScreen(force = null)
{
	if(force === null)
	{
		win = electronRemote.getCurrentWindow();
		force = !win.isFullScreen();
	}

	titleBar.setFullScreen(force);

	reading.hideContent(force);
	win.setFullScreen(force);
	// win.setMenuBarVisibility(!force);
}

document.addEventListener("keydown", event => {

	if(event.key == 'Escape')
	{
		let win = electronRemote.getCurrentWindow();
		let isFullScreen = win.isFullScreen();

		if(isFullScreen)
		{
			fullScreen(false);
		}
		else
		{
			gamepad.goBack();
		}
	}

});

var errorDialog = true;

window.addEventListener('error', function(evt) {

	let error = false;

	if(evt.message && !/debug\-evaluate/.test(evt.message))
		error = 'Error: '+evt.message +' at linenumber '+evt.lineno+':'+evt.colno+' of file '+evt.filename;

	if(error !== false && errorDialog)
	{
		if(electronRemote.dialog)
		{
			electronRemote.dialog.showMessageBox({
				type: 'error',
				title: 'Linenumber '+evt.lineno+':'+evt.colno,
				message: error,
				detail: evt.error.stack ? evt.error.stack : error,
			});
		}
		else if(evt.filename || evt.lineno || evt.colno)
		{
			alert(error+(evt.error.stack ? ' '+evt.error.stack : ''));
		}
	}

}, true);

const electron = require('electron'),
	electronRemote = require('@electron/remote'),
	fs = require('fs'),
	fsp = fs.promises,
	fse = require('fs-extra'),
	hb = require('handlebars'),
	os = require('os'),
	ejs = require('electron-json-storage'),
	mime = require('mime'),
	sha1 = require('sha1'),
	p = require('path'),
	isEqual = require('lodash.isequal'),
	$ = require('jquery');

require('jquery-bez');

//console.timeEnd('Require time 1');

var toOpenFile = toOpenFile || false, windowHasLoaded = false;

electronRemote.app.on('open-file', function(event, path) {

	if(windowHasLoaded)
		openComic(path, true);
	else
		toOpenFile = path;

});

electronRemote.app.on('second-instance', function(event, argv) {

	if(electronRemote.app.hasSingleInstanceLock())
	{
		let win = electronRemote.getCurrentWindow();
		if (win.isMinimized()) win.restore();
		win.focus();

		for(let i = 1, len = argv.length; i < len; i++)
		{
			let arg = argv[i];

			if(arg && !inArray(arg, ['--no-sandbox', 'scripts/main.js', '.']) && !/^--/.test(arg) && fs.existsSync(arg))
			{
				openComic(arg, true);
				break;
			}
		}
	}

});

var handlebarsContext = {};
var language = {};
var config = false, _config = false;
var onReading = _onReading = false;
var readingTouchEvent = false;

var appDir = p.join(__dirname, '../');

var _package = JSON.parse(readFileApp('package.json'));

handlebarsContext.packageJson = _package;

var compatibleMime = [
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/apng',
	'image/svg',
	'image/svg+xml',
	'image/gif',
	'image/x-ms-bmp',
	'image/bmp',
	'image/x-icon',
	'image/vnd.microsoft.icon',
	'image/webp',
	'image/avif',
	'image/avif-sequence',
];

var compressedMime = {
	'all': [
		'application/zip',
		'application/x-cbz',
		'applicatpdomion/x-zip',
		'application/x-zip-compressed',
		'application/rar',
		'application/x-cbr',
		'application/x-rar',
		'application/x-rar-compressed',
		'application/7z',
		'application/x-cb7',
		'application/x-7z',
		'application/x-7z-compressed',
		'application/tar',
		'application/x-cbt',
		'application/x-tar',
		'application/x-tar-compressed',
		'application/epub+zip',
	],
	'zip': [
		'application/zip',
		'application/x-cbz',
		'application/x-zip',
		'application/x-zip-compressed',
	],
	'rar': [
		'application/rar',
		'application/x-cbr',
		'application/x-rar',
		'application/x-rar-compressed',
	],
	'7z': [
		'application/7z',
		'application/x-cb7',
		'application/x-7z',
		'application/x-7z-compressed',
	],
	'tar': [
		'application/tar',
		'application/x-cbt',
		'application/x-tar',
		'application/x-tar-compressed',
	],
	'pdf': [
		'application/pdf',
		'application/x-bzpdf',
		'application/x-gzpdf',
	],
	'epub': [
		'application/epub+zip',
	],
};


var compressedExtensions = {
	'all': [
		'zip',
		'cbz',
		'rar',
		'cbr',
		'7z',
		'cb7',
		'tar',
		'cbt',
		'pdf',
		'epub',
		'epub3',
	],
	'zip': [
		'zip',
		'cbz',
	],
	'rar': [
		'rar',
		'cbr',
	],
	'7z': [
		'7z',
		'cb7',
	],
	'tar': [
		'tar',
		'cbt',
	],
	'pdf': [
		'pdf',
	],
	'epub': [
		'epub',
		'epub3',
	],
};

var compatibleImageExtensions = [
	/*jpeg*/'jpg', 'jpeg', 'jif', 'jfi', 'jfif', 'jfif-tbnl', 'jpe', 
	/*png*/'png', 'x-png', 'apng',
	/*svg*/'svg', 'svgz',
	/*gif*/'gif',
	/*bmp*/'bmp', 'dib',
	/*ico*/'ico',
	/*webp*/'webp',
	/*avif*/'avif', 'avifs',
];

var compatibleCompressedExtensions = [
	/*compressed*/'zip', 'cbz', 'rar', 'cbr', '7z', 'cb7', 'tar', 'cbt',
	/*pdf*/'pdf',
	/*epub*/'epub', 'epub3',
];

var compatibleExtensions = [
	...compatibleImageExtensions,
	...compatibleCompressedExtensions,
];

var compatibleSpecialExtensions = [
	'tbn',
];

//console.time('Require time 2');

const app = require(p.join(appDir, 'scripts/app.js')),
	installedFromStore = require(p.join(appDir, 'scripts/installed-from-store.js')),
	storage = require(p.join(appDir, 'scripts/storage.js')),
	image = require(p.join(appDir, 'scripts/image.js')),
	cache = require(p.join(appDir, 'scripts/cache.js')),
	queue = require(p.join(appDir, 'scripts/queue.js')),
	templates = require(p.join(appDir, 'scripts/builded/templates.js')),
	template = require(p.join(appDir, 'scripts/template.js')),
	titleBar = require(p.join(appDir, 'scripts/title-bar.js')),
	gamepad = require(p.join(appDir, 'scripts/gamepad.js')),
	dom = require(p.join(appDir, 'scripts/dom.js')),
	events = require(p.join(appDir, 'scripts/events.js')),
	ebook = require(p.join(appDir, 'scripts/ebook.js')),
	fileManager = require(p.join(appDir, 'scripts/file-manager.js')),
	reading = require(p.join(appDir, 'scripts/reading.js')),
	recentlyOpened = require(p.join(appDir, 'scripts/recently-opened.js')),
	settings = require(p.join(appDir, 'scripts/settings.js')),
	theme = require(p.join(appDir, 'scripts/theme.js')),
	dragAndDrop = require(p.join(appDir, 'scripts/drag-and-drop.js')),
	checkReleases = require(p.join(appDir, 'scripts/check-releases.js')),
	shortcuts = require(p.join(appDir, 'scripts/shortcuts.js')),
	tracking = require(p.join(appDir, 'scripts/tracking.js')),
	trackingSites = require(p.join(appDir, 'scripts/tracking/tracking-sites.js'));

var tempFolder = p.join(os.tmpdir(), 'opencomic');

// Use cache folder on Linux and Darwin to avoid tmp system cleanup on reboot
if(process.platform == 'linux' || process.platform == 'darwin')
{
	tempFolder = p.join(electronRemote.app.getPath('cache'), 'opencomic', 'tmp');
	if(!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);
}
else if(!fs.existsSync(tempFolder))
{
	fs.mkdirSync(tempFolder);
}

var macosMAS = false;
fileManager.removeTmpVector();

macosMAS = (installedFromStore.check() && process.platform == 'darwin') ? true : false;

//console.timeEnd('Require time 2');

var fromGamepad = false;

window.onload = function() {

	storage.start(function() {

		config = storage.get('config');
		_config = copy(config);
		handlebarsContext.config = config;

		if(config.zoomFactor != 1)
			electron.webFrame.setZoomFactor(Math.round(config.zoomFactor * 100) / 100);

		loadLanguage(config.language);

		template.loadInQuery('body', 'body.html');
		theme.systemNightMode();

		titleBar.start();
		titleBar.setColors();

		startApp();

	});

}

async function startApp()
{
	if(config.checkReleases)
		checkReleases.check();

	handlebarsContext.indexHeaderTitle = language.global.comics;

	template.loadContentRight('index.content.right.empty.html', false);
	template.loadHeader('index.header.html', false);
	template.loadGlobalElement('index.elements.menus.html', 'menus');
	dom.loadIndexContentLeft(false);

	if(!toOpenFile)
	{
		for(let i = 1, len = electronRemote.process.argv.length; i < len; i++)
		{
			let arg = electronRemote.process.argv[i];

			if(arg && !inArray(arg, ['scripts/main.js', '.']) && !/^--/.test(arg) && fs.existsSync(arg))
			{
				toOpenFile = arg;
				break;
			}
		}
	}

	if(toOpenFile && fs.existsSync(toOpenFile))
	{
		openComic(toOpenFile, false);
	}
	else
	{
		let lastReading = false;

		if(config.startInContinueReading)
		{
			let readingProgress = storage.get('readingProgress');
			let highest = 0;

			for(let key in readingProgress)
			{
				if(readingProgress[key].lastReading > highest)
				{
					lastReading = {
						mainPath: key,
						path: readingProgress[key].path,
					};

					highest = readingProgress[key].lastReading;
				}
			}

			if(lastReading && config.startOnlyFromLibrary)
			{
				let mainPaths = {};

				// Comics in master folders
				let masterFolders = storage.get('masterFolders');

				if(!isEmpty(masterFolders))
				{
					for(let key in masterFolders)
					{
						if(fs.existsSync(masterFolders[key]))
						{
							let file = fileManager.file(masterFolders[key]);
							let files = await file.readDir();
							file.destroy();

							for(let i = 0, len = files.length; i < len; i++)
							{
								let folder = files[i];

								if(folder.folder || folder.compressed)
									mainPaths[folder.path] = true;
							}
						}
					}
				}

				// Comics in library
				let comicsStorage = storage.get('comics');

				if(!isEmpty(comicsStorage))
				{
					for(let key in comicsStorage)
					{
						mainPaths[comicsStorage[key].path] = true;
					}
				}

				if(!mainPaths[lastReading.mainPath])
					lastReading = false;
			}
		}

		if(lastReading && fs.existsSync(lastReading.mainPath))
			dom.openComic(false, lastReading.path, lastReading.mainPath);
		else
			dom.loadIndexPage(false);
	}

	dragAndDrop.start();
	dom.search.start();

	document.fonts.ready.then(function(){

		if(config.startInFullScreen)
		{
			let win = electronRemote.getCurrentWindow();
			let isFullScreen = win.isFullScreen();

			if(!isFullScreen)
				fullScreen(true);
		}

		$('body .app').css('display', 'block');
		$('body .preload').css('display', 'none');

		if(onReading && !reading.isEbook())
		{
			reading.disposeImages();
			reading.calculateView();
			reading.stayInLine();
		}

	});

	windowHasLoaded = true;

}

var ShoSho = false;

async function loadShoSho()
{
	if(ShoSho) return;

	ShoSho = await import(asarToAsarUnpacked(p.join(appDir, 'node_modules/shosho/dist/index.js')));
	ShoSho = ShoSho.default;

	return true;
}

/*Global functions*/

function copy(data) {

	return JSON.parse(JSON.stringify(data));

}

function inArray(string, array)
{
	return (array.indexOf(string) != -1) ? true : false;
}

function fileExtension(path)
{
	return p.extname(path).replace(/^\./, '').toLowerCase();
}

function pregQuote(str, delimiter = false)
{
	return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

function mousePosition(e, mode)
{
	if(mode == 'x')
		return e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
	else
		return e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);
}

function htmlEntities(str)
{
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function htmlQuote(str)
{
	return String(str).replace(/"/g, '&quot;');
}

function escapeQuotes(str, mode = false)
{
	if(mode === 'simples')
		return String(str).replace(/'/g, '\\\'');
	else if(mode === 'doubles')
		return String(str).replace(/"/g, '\\\"');
	else
		return String(str).replace(/'/g, '\\\'').replace(/"/g, '\\\"');
}

function readFileApp(file)
{
	return fs.readFileSync(p.join(appDir, file), 'utf8');
}

function readFile(file)
{
	return fs.readFileSync(file, 'utf8');
}

function existsFileApp(file)
{
	return fs.existsSync(p.join(appDir, file))
}

function existsFile(file)
{
	return fs.existsSync(file)
}

function loadLanguageMD(hbc, obj)
{
	for(let key in obj)
	{
		if(Array.isArray(obj[key]))
		{
			hbc[key] = obj[key];
		}
		else if(typeof obj[key] == 'object')
		{
			if(!hbc[key])
				hbc[key] = {};

			loadLanguageMD(hbc[key], obj[key]);
		}
		else if(obj[key])
		{
			hbc[key] = obj[key];
		}
	}
}

function time()
{
	return Math.floor(Date.now() / 1000);
}

function loadLanguage(lan = false)
{
	language = JSON.parse(readFileApp('./languages/es.json'));
	loadLanguageMD(language, JSON.parse(readFileApp('./languages/en.json')));

	handlebarsContext.language = language;

	if(lan && existsFileApp('./languages/'+lan+'.json'))
	{
		loadLanguageMD(language, JSON.parse(readFileApp('./languages/'+lan+'.json')));

		generateAppMenu(true);
		generateAppMenuShortcut();
	}
}

function asarToAsarUnpacked(path)
{
	if(!/app\.asar\.unpacked/.test(path))
	{
		var pathUnpacked = path.replace(/app\.asar/, 'app.asar.unpacked');

		if(fs.existsSync(pathUnpacked)) path = pathUnpacked;
	}

	return path;
}

function zoomIn()
{
	var factor = electron.webFrame.getZoomFactor();

	if(factor >= 3)
		factor += 1;
	else if(factor >= 2)
		factor += 1;
	else if(factor >= 1.25)
		factor += 0.25;
	else if(factor >= 1.10)
		factor += 0.15;
	else
		factor += 0.10;

	if(factor > 5)
		factor = 5;
	else if(factor < 0.50)
		factor = 0.50;

	storage.updateVar('config', 'zoomFactor', factor);

	electron.webFrame.setZoomFactor(Math.round(factor * 100) / 100);
}

function zoomOut()
{
	var factor = electron.webFrame.getZoomFactor();

	if(factor > 3)
		factor -= 1;
	else if(factor > 2)
		factor -= 1;
	else if(factor > 1.25)
		factor -= 0.25;
	else if(factor > 1.10)
		factor -= 0.15;
	else
		factor -= 0.10;

	if(factor > 5)
		factor = 5;
	else if(factor < 0.50)
		factor = 0.50;

	storage.updateVar('config', 'zoomFactor', factor);

	electron.webFrame.setZoomFactor(Math.round(factor * 100) / 100);
}

function resetZoom()
{
	storage.updateVar('config', 'zoomFactor', 1);

	electron.webFrame.setZoomLevel(0);
}

function generateAppMenuShortcut()
{
	electronRemote.globalShortcut.unregisterAll();
	/*electronRemote.globalShortcut.register('CmdOrCtrl+O', function(){openComicDialog()});
	electronRemote.globalShortcut.register('CmdOrCtrl+Q', function(){electronRemote.app.quit()});
	electronRemote.globalShortcut.register('CmdOrCtrl+0', function(){resetZoom(); generateAppMenu();});
	electronRemote.globalShortcut.register('CmdOrCtrl+Shift+0', function(){resetZoom(); generateAppMenu();});
	electronRemote.globalShortcut.register('CmdOrCtrl+Plus', function(){zoomIn(); generateAppMenu();});
	electronRemote.globalShortcut.register('CmdOrCtrl+=', function(){zoomIn(); generateAppMenu();});
	electronRemote.globalShortcut.register('CmdOrCtrl+-', function(){zoomOut(); generateAppMenu();});
	electronRemote.globalShortcut.register('CmdOrCtrl+Shift+-', function(){zoomOut(); generateAppMenu();});*/
}

var generateAppMenuData = {resetZoom: null, onReading: null};

function generateAppMenu(force = false)
{
	if(force || generateAppMenuData.resetZoom !== electron.webFrame.getZoomFactor() || generateAppMenuData.onReading !== onReading)
	{
		let currentWindow = electronRemote.getCurrentWindow();
		generateAppMenuData = {resetZoom: electron.webFrame.getZoomFactor(), onReading: onReading};

		var menuTemplate = [
			{
				label: language.menu.file.main,
				submenu: [
					{label: language.menu.file.openFile, click: function(){openComicDialog()}, accelerator: 'CmdOrCtrl+O'},
					{label: language.menu.file.openFolder, click: function(){openComicDialog(true)}, accelerator: 'CmdOrCtrl+Shift+O'},
					{label: language.menu.file.addFile, click: function(){addComic()}},
					{label: language.menu.file.addFolder, click: function(){addComic(true)}},
					{type: 'separator'},
					{role: 'quit', label: language.menu.file.quit, click: function(){electronRemote.app.quit();}},
				]
			},
			{
				label: language.menu.view.main,
				submenu: [
					{label: language.menu.view.resetZoom, enabled: (electron.webFrame.getZoomFactor() != 1 ? true : false), click: function(){resetZoom(); generateAppMenu();}, accelerator: 'CmdOrCtrl+0'},
					{label: language.menu.view.zoomIn, click: function(){zoomIn(); generateAppMenu();}, accelerator: 'CmdOrCtrl+Plus'},
					{label: language.menu.view.zoomIn, click: function(){zoomIn(); generateAppMenu();}, accelerator: 'CmdOrCtrl+=', visible: false, acceleratorWorksWhenHidden: true},
					{label: language.menu.view.zoomOut, click: function(){zoomOut(); generateAppMenu();}, accelerator: 'CmdOrCtrl+-'},
					{type: 'separator'},
					{label: language.menu.view.toggleFullScreen, click: function(){fullScreen();}, accelerator: 'F11'},
				]
			},
			{
				label: language.menu.goto.main,
				submenu: [
					{label: language.reading.firstPage, enabled: onReading, click: function(){reading.goStart();}},
					{label: language.reading.previous, enabled: onReading, click: function(){reading.goPrevious();}},
					{label: language.reading.next, enabled: onReading, click: function(){reading.goNext();}},
					{label: language.reading.lastPage, enabled: onReading, click: function(){reading.goEnd();}},
					// {label: 'Next chapter', enabled: onReading, click: function(){reading.goEnd();}, accelerator: 'Ctrl+End'},
				]
			},
			{
				label: language.menu.debug.main,
				submenu: [
					{label: language.menu.debug.reload, click: function(){electronRemote.getCurrentWindow().webContents.reload();}, accelerator: 'CmdOrCtrl+R'},
					{label: language.menu.debug.forceReload, click: function(){electronRemote.getCurrentWindow().webContents.reloadIgnoringCache();}, accelerator: 'CmdOrCtrl+Shift+R'},
					{label: language.menu.debug.toggleDevTools, click: function(){electronRemote.getCurrentWindow().webContents.toggleDevTools();}, accelerator: 'CmdOrCtrl+Shift+I'},
				]
			},
			{
				label: language.menu.help.main,
				submenu: [
					{label: language.menu.help.bug, click: function(){electron.shell.openExternal('https://github.com/ollm/OpenComic/issues');}},
					{type: 'separator'},
					{label: language.menu.help.funding, click: function(){electron.shell.openExternal('https://github.com/ollm/OpenComic/blob/master/FUNDING.md');}},
					{label: language.menu.help.about, click: function(){showAboutWindow();}},
				]
			}
		];

		var menu = electronRemote.Menu.buildFromTemplate(menuTemplate);
		currentWindow.setMenu(menu);

		if(process.platform == 'darwin')
		{
			electronRemote.Menu.setApplicationMenu(menu);
		}
		else
		{
			currentWindow.setMenuBarVisibility(false);
		}
		
		titleBar.setMenu(menuTemplate);
	}
}

var about = false;

function showAboutWindow()
{
	var about = new electronRemote.BrowserWindow({
		show: false,
		title: language.menu.help.about,
		width: 380,
		height: 260,
		minWidth: 380,
		minHeight: 260,
		//resizable: false,
		modal: (process.platform == 'darwin') ? false : true,
		parent: electronRemote.getCurrentWindow(),
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			enableRemoteModule: true,
		},
	});

	about.removeMenu();
	about.setMenuBarVisibility(false);

	var url = require('url');

	about.loadURL(url.format({
		pathname: p.join(appDir, './templates/about.html'),
		protocol: 'file:',
		slashes: true
	}));

	about.once('ready-to-show', function() {
	
		about.webContents.executeJavaScript('document.querySelector(\'body\').innerHTML = `'+template.load('about.body.html')+'`;', false).then(function(){

			about.show();

		});

	});
}

function escapeBackSlash(string)
{
	return string.replace(/\\+/g, '\\\\');
}

function invertBackslash(string)
{
	return string.replace(/\\+/g, '/');
}

function encodeSrcURI(string)
{
	let segments = string.split(p.sep);

	for(let i in segments)
	{
		if(i != 0)
			segments[i] = encodeURIComponent(segments[i]);
		else
			segments[i] = segments[i];
	}

	return segments.join(p.sep);
}

function toUnixPath(string)
{
	return string.replace(/\\+/g, '/').trim().replace(/^c\:/ig, '/');
}

function joinRegexs(regexs)
{
	var _regexs = [];

	for(let key in regexs)
	{
		_regexs.push(regexs[key].source);
	}

	return new RegExp(_regexs.join('|'));
}

function extract(code, string, value)
{
	string = string.match(code);
	return (string !== null && typeof string[value] != 'undefined') ? string[value] : '';
}

function isEmpty(mixedVar)
{
	var undef, key, i, len, emptyValues = [undef, null, false, 0, '', '0'];

	for(var i = 0, len = emptyValues.length; i < len; i++)
	{
		if(mixedVar === emptyValues[i])
		{
			return true
		}
	}

	if(typeof mixedVar === 'undefined')
	{
		return true
	}

	if(typeof mixedVar === 'object')
	{
		for(key in mixedVar)
		{
			if (mixedVar.hasOwnProperty(key))
			{
				return false
			}
		}

		return true
	}
}

function matchArray(string, array)
{
	for(var i = 0; i < array.length; i++)
	{
		if(string.match(array))
		{
			return true;
		}
	}

	return false;
}

function callbackString(callback)
{
	var func = new Function(callback);
	func();
}

/*Handlebars helpers*/

hb.registerHelper('chain', function() {

	var helpers = [], value;

	$.each(arguments, function (i, arg) {

		if(hb.helpers[arg])
		{
			helpers.push(hb.helpers[arg]);
		}
		else
		{
			value = arg;

			$.each(helpers, function (j, helper) {
				value = helper(value, arguments[i + 1]);
			});

			return false;
		}
	});

	return value;
});

hb.registerHelper('compare', function(lvalue, operator, rvalue, options) {

	var operators = {
		'==':	function(l,r) { return l == r; },
		'===':	function(l,r) { return l === r; },
		'!=':	function(l,r) { return l != r; },
		'!==':	function(l,r) { return l !== r; },
		'<':	function(l,r) { return l < r; },
		'>':	function(l,r) { return l > r; },
		'<=':	function(l,r) { return l <= r; },
		'>=':	function(l,r) { return l >= r; },
		'typeof':	function(l,r) { return typeof l == r; }
	}

	var result = operators[operator](lvalue,rvalue);

	if(result)
		return options.fn(this);
	else
		return options.inverse(this);

});

hb.registerHelper('ifOr', function() {

	let options = arguments[arguments.length - 1];

	for(let i = 0, len = arguments.length - 1; i < len; i++)
	{
		if(!playmax.empty(arguments[i]))
			return options.fn(this);
	}

	return options.inverse(this);

});

hb.registerHelper('for', function(from, to, incr, options) {

	var accum = '';

	for(var i = from; i < to; i += incr)
		accum += options.fn(i);

	return accum;

});

hb.registerHelper('round', function(number) {

	return Math.round(+number);

});

hb.registerHelper('sLength', function(value) {

	return String(value).length;

});

hb.registerHelper('escapeQuotes', function(string) {

	return escapeQuotes(string);

});

hb.registerHelper('escapeQuotesSimples', function(string) {

	return escapeQuotes(string, 'simples');

});

hb.registerHelper('escapeQuotesDoubles', function(string) {

	return escapeQuotes(string, 'doubles');

});

hb.registerHelper('escapeBackSlash', function(string) {

	return escapeBackSlash(string);

});

hb.registerHelper('toUnixPath', function(string) {

	return toUnixPath(string);

});

hb.registerHelper('invertBackslash', function(string) {

	return invertBackslash(string);

});

hb.registerHelper('isEmpty', function(obj) {

	return isEmpty(obj);

});

hb.registerHelper('encodeURI', function(string) {

	return encodeURI(string);

});

hb.registerHelper('encodeSrcURI', function(string) {

	return encodeSrcURI(string);

});

hb.registerHelper('normalizeNumber', function(value, decimals) {

	value = String(value);

	var num_v = String(value).replace(/.*?(\.|$)/, '').length;

	var num_d = decimals.replace(/.*?(\.|$)/, '').length;

	if(num_d != 0)
		value = value+(/\./.test(value) ? '' : '.')+('0'.repeat(num_d - num_v));

	return value;

});

hb.registerHelper('htmlEntities', function(string) {

	return htmlEntities(string);

});

hb.registerHelper('htmlQuote', function(string) {

	return htmlQuote(string);

});

hb.registerHelper('configIsTrue', function(key, value) {

	if(config[key] == value)
	{
		return true;
	}
	else
	{
		return false;
	}

});

function pathIsSupported(path)
{
	if(inArray(mime.getType(path), compatibleMime) || inArray(fileExtension(path), compressedExtensions.all) || fs.statSync(path).isDirectory())
		return true;

	return false;
}

function openComicDialog(folders = false)
{
	if(folders)
		var properties = ['openDirectory'];
	else
		var properties = ['openFile'];

	var dialog = electronRemote.dialog;

	dialog.showOpenDialog({properties: properties, filters: [folders ? {name: language.global.comics} : {name: language.global.comics, extensions: compatibleExtensions}], securityScopedBookmarks: macosMAS}).then(function (files) {

		fileManager.macosSecurityScopedBookmarks(files);

		if(files.filePaths && files.filePaths[0])
			openComic(files.filePaths[0]);

	});

}

var fromLibrary = true;

function openComic(filePath, animation = true)
{
	if(pathIsSupported(filePath))
	{
		let selectImage = false, path = false, mainPath = false;

		if(fs.statSync(filePath).isDirectory())
		{
			path = filePath;
		}
		else
		{
			if(inArray(mime.getType(filePath), compatibleMime))
			{
				selectImage = true;
				path = filePath;

				filePath = p.dirname(filePath);

				mainPath = filePath;
			}
			else
			{
				path = filePath;
			}
		}

		if(mainPath === false)
			mainPath = path;

		if(onReading)
			reading.saveReadingProgress();

		recentlyOpened.set(mainPath);

		dom.fromLibrary(false);

		if(selectImage)
			dom.openComic(animation, path, mainPath);
		else
			dom.loadIndexPage(animation, path, false, false, mainPath);
	}
	else
	{
		if(!windowHasLoaded)
			dom.loadIndexPage(false);

		events.snackbar({
			key: 'unsupportedFile',
			text: language.global.unsupportedFile,
			duration: 6,
			update: true,
			buttons: [
				{
					text: language.buttons.dismiss,
					function: 'events.closeSnackbar();',
				},
			],
		});
	}
}

function addComic(folders = false)
{
	if(folders)
		var properties = ['openDirectory', 'multiSelections'];
	else
		var properties = ['openFile', 'multiSelections'];

	var dialog = electronRemote.dialog;

	dialog.showOpenDialog({properties: properties, filters: [folders ? {name: language.global.comics} : {name: language.global.comics, extensions: compatibleExtensions}], securityScopedBookmarks: macosMAS}).then(function(files) {

		fileManager.macosSecurityScopedBookmarks(files);

		addComicsToLibrary(files.filePaths);

	});

}

function addComicsToLibrary(files)
{
	let added = false;

	for(let i in files)
	{
		let filePath = files[i];

		if(pathIsSupported(filePath))
		{
			let name, path, compressed;

			if(fs.statSync(filePath).isDirectory())
			{
				name = p.basename(filePath);
				path = filePath;
				compressed = false;
			}
			else
			{
				if(inArray(mime.getType(filePath), compatibleMime))
				{
					filePath = p.dirname(filePath);

					name = p.basename(filePath);
					path = filePath;
					compressed = false;
				}
				else
				{
					name = p.basename(filePath).replace(/\.[^\.]*$/, '');
					path = filePath;
					compressed = true;
				}
			}

			let comics = storage.get('comics');

			let exists = false;

			for(let key in comics)
			{
				if(comics[key].path == path)
				{
					exists = true;

					break;
				}
			}

			if(!exists)
			{
				storage.push('comics', {
					name: name,
					path: path,
					added: time(),
					compressed: compressed,
					folder: true,
					readingProgress: {
						path: 'Path',
						lastReading: 0,
						progress: 0,
					},
				});

				added = true;
			}
		}
	}

	if(added)
	{
		if(onReading)
			reading.saveReadingProgress();

		dom.loadIndexPage(true);
	}
}

function callCallbacks()
{
	for(let i = 1, len = arguments.length; i < len; i++)
	{
		if(arguments[i])
			arguments[i].apply(null, arguments[0])
	}
}

//Cheack errors

function checkError(value, error = false)
{
	if(value && typeof value.error != 'undefined')
	{
		if(error && value.error == error)
			return true;
		else if(!error)
			return true;
	}

	return false;
}

//Errors list

const NOT_POSSIBLE_WITHOUT_DECOMPRESSING = 1;
const ERROR_UNZIPPING_THE_FILE = 2;
const ERROR_READING_THE_FILE = 3;
const ERROR_RENDERING_THE_FILE = 4;
