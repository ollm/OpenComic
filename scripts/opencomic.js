//console.time('Starting time');

//console.time('Require time 1');
/*
window.onerror = function(msg, url, linenumber) {

    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;

}*/

var isFullScreen = false;

function fullScreen(force = null, win = false)
{
	if(win === false)
		win = electronRemote.getCurrentWindow();

	if(force === null)
		force = !win.isFullScreen();

	isFullScreen = force;
	titleBar.setFullScreen(force);

	reading.hideContent(force);
	win.setFullScreen(force);
	// win.setMenuBarVisibility(!force);
}

document.addEventListener('keydown', function(event) {

	if(event.key == 'Escape')
	{
		const win = electronRemote.getCurrentWindow();
		const isFullScreen = win.isFullScreen();

		if(isFullScreen)
		{
			fullScreen(false, win);
		}
		else
		{
			gamepad.goBack(true);
		}
	}

});

var errorDialog = true;

window.addEventListener('error', function(evt) {

	let error = false;

	if(evt.message && !/debug\-evaluate/.test(evt.message) && !/client_closed|connect EHOSTUNREACH/iu.test(evt.message))
		error = 'Error: '+evt.message +' at linenumber '+evt.lineno+':'+evt.colno+' of file '+evt.filename;

	if(error !== false && errorDialog)
	{
		if(electronRemote.dialog)
		{
			electronRemote.dialog.showMessageBox({
				type: 'error',
				title: 'Linenumber '+evt.lineno+':'+evt.colno,
				message: error,
				detail: evt?.error?.stack ? evt.error.stack : error,
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
	crypto = require('crypto'),
	p = require('path'),
	isEqual = require('node:util').isDeepStrictEqual,
	shortWindowsPath = require('short-windows-path'),
	$ = require('jquery');

require('jquery-bez');

//console.timeEnd('Require time 1');


// Open file and open url logic
var toOpenFile = toOpenFile || false, windowHasLoaded = false;

electronRemote.app.on('open-file', function(event, path) {

	if(windowHasLoaded)
		openComic(path, true);
	else
		toOpenFile = path;

});

electronRemote.app.on('open-url', function(event, url) {

	handleOpenUrl(url);

});

electronRemote.app.on('second-instance', function(event, argv) {

	if(!electronRemote.app.hasSingleInstanceLock())
		return;

	const win = electronRemote.getCurrentWindow();
	if(win.isMinimized()) win.restore();
	win.focus();

	const len = argv.length;
	const last = argv[len - 1];

	if(/^opencomic:\/\//.test(last))
	{
		handleOpenUrl(last);
		return;
	}

	for(let i = 1; i < len; i++)
	{
		const arg = argv[i];

		if(arg && !['--no-sandbox', 'scripts/main.js', '.'].includes(arg) && !/^--/.test(arg) && !/app\.asar/i.test(arg) && fs.existsSync(arg))
		{
			openComic(arg, true);
			break;
		}
	}

});

function registreOpenUrl()
{
	const process = electronRemote.process;

	if(process.defaultApp)
	{
		if(process.argv.length >= 2)
			electronRemote.app.setAsDefaultProtocolClient('opencomic', process.execPath, [p.resolve(process.argv[1])]);
	}
	else
	{
		electronRemote.app.setAsDefaultProtocolClient('opencomic');
	}
}

function handleOpenUrl(href)
{
	const url = new URL(href);
	if(url.protocol !== 'opencomic:') return;

	switch(url.host)
	{
		case 'tracking':

			tracking.handleOpenUrl(url);

			break;
	}
}

registreOpenUrl();

var handlebarsContext = {};
var language = {};
var config = false, _config = false;
var onReading = _onReading = false;
var readingTouchEvent = false;

var appDir = p.join(__dirname, '../');

var _package = JSON.parse(readFileApp('package.json'));

handlebarsContext.packageJson = _package;

//console.time('Require time 2');

const folderPortable = require(p.join(appDir, 'scripts/folder-portable.js'));
var storagePath = p.join(electronRemote.app.getPath('userData'), 'storage');

if(folderPortable.check())
{
	const executableDir = process.env.OPENCOMIC_PORTABLE_EXECUTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;

	if(executableDir)
	{
		storagePath = p.join(executableDir, 'opencomic', 'storage');
	}
	else
	{
		const outsidePath = p.join(__dirname, '../../../../', 'opencomic');

		if(fs.existsSync(outsidePath))
			storagePath = p.join(outsidePath, 'storage');
		else
			storagePath = p.join(__dirname, '../../../', 'storage');
	}
}

const app = require(p.join(appDir, 'scripts/app.js')),
	installedFromStore = require(p.join(appDir, 'scripts/installed-from-store.js')),
	relative = require(p.join(appDir, 'scripts/relative.js')),
	storage = require(p.join(appDir, 'scripts/storage.js')),
	compatible = require(p.join(appDir, 'scripts/compatible.js')),
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
	workers = require(p.join(appDir, 'scripts/workers.js')),
	threads = require(p.join(appDir, 'scripts/threads.js')),
	mutex = require(p.join(appDir, 'scripts/mutex.js')),
	fileManager = require(p.join(appDir, 'scripts/file-manager.js')),
	serverClient = require(p.join(appDir, 'scripts/server-client.js')),
	opds = require(p.join(appDir, 'scripts/opds.js')),
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

macosMAS = (installedFromStore.check() && process.platform == 'darwin') ? true : false;

//console.timeEnd('Require time 2');

var fromGamepad = false;

var appBaseLoadedResolve;
var appBaseLoaded = new Promise(function(resolve) {

	appBaseLoadedResolve = resolve;

});

async function start()
{
	await electronRemote.app.whenReady();

	storage.start(function() {

		config = storage.get('config');
		_config = copy(config);

		handlebarsContext.config = config;
		handlebarsContext.installedFromStore = installedFromStore.check();
		handlebarsContext.macosMAS = macosMAS;

		if(config.zoomFactor != 1)
			electron.webFrame.setZoomFactor(Math.round(config.zoomFactor * 100) / 100);

		loadLanguage(config.language);

		template.loadInQuery('body', 'body.html');
		theme.systemNightMode();

		titleBar.start();
		titleBar.setColors();

		appBaseLoadedResolve();
		startApp();

	});
}

async function startApp()
{
	if(config.checkReleases)
		checkReleases.check();

	loadContextMenu();

	handlebarsContext.indexHeaderTitle = language.global.library;

	template.loadContentRight('index.content.right.empty.html', false);
	template.loadHeader('index.header.html', false);
	template.loadGlobalElement('global.elements.menus.html', 'global-menus');
	template.loadGlobalElement('index.elements.menus.html', 'menus');
	dom.loadIndexContentLeft(false);

	if(!toOpenFile)
	{
		for(let i = 1, len = electronRemote.process.argv.length; i < len; i++)
		{
			const arg = electronRemote.process.argv[i];

			if(arg && !['--no-sandbox', 'scripts/main.js', '.'].includes(arg) && !/^--/.test(arg) && !/app\.asar/i.test(arg) && fs.existsSync(arg))
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
			let readingProgress = relative.get('readingProgress');
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
				let masterFolders = relative.get('masterFolders');

				if(!isEmpty(masterFolders))
				{
					for(let key in masterFolders)
					{
						const path = masterFolders[key];

						if(fs.existsSync(path))
						{
							let file = fileManager.file(path);
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
				let comicsStorage = relative.get('comics');

				if(!isEmpty(comicsStorage))
				{
					for(let key in comicsStorage)
					{
						const path = comicsStorage[key].path;
						mainPaths[path] = true;
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
	tracking.start();
	fileManager.diskType.findDisks();

	document.fonts.ready.then(function(){

		if(config.startInFullScreen)
		{
			let win = electronRemote.getCurrentWindow();
			let isFullScreen = win.isFullScreen();

			if(!isFullScreen)
				fullScreen(true, win);
		}

		$('body .app').css('display', 'block');
		$('body .preload').css('display', 'none');

		if(onReading && reading.isLoaded() && !reading.isEbook())
		{
			reading.disposeImages();
			reading.calculateView();
			reading.stayInLine();
		}

	});

	windowHasLoaded = true;

}

var currentContextMenuInput = false;

async function loadContextMenu()
{
	electronRemote.getCurrentWindow().webContents.on('context-menu', function(event, props) {

		currentContextMenuInput = document.activeElement;

		if(props.isEditable)
			events.activeContextMenu('#global-input-menu');
		else if(props.selectionText && props.selectionText.trim() !== '')
			events.activeContextMenu('#global-selection-menu');

	});
}

var importPromises = {};

var ShoSho = false;

async function loadShoSho()
{
	if(importPromises.ShoSho) return importPromises.ShoSho;
	if(ShoSho) return;

	importPromises.ShoSho = new Promise(async function(resolve){

		ShoSho = await import(asarToAsarUnpacked(p.join(appDir, 'node_modules/shosho/dist/index.js')));
		ShoSho = ShoSho.default;

		resolve();

		importPromises.ShoSho = false;

	});

	return importPromises.ShoSho;
}

var unpdf = false;

async function loadPdfjs()
{
	if(importPromises.unpdf) return importPromises.unpdf;
	if(unpdf) return;

	importPromises.unpdf = new Promise(async function(resolve){

		unpdf = await import(asarToAsarUnpacked(p.join(appDir, 'node_modules/pdfjs-dist/build/pdf.mjs')));
		unpdf.GlobalWorkerOptions.workerSrc = asarToAsarUnpacked(p.join(appDir, 'node_modules/pdfjs-dist/build/pdf.worker.mjs'));

		resolve();

		importPromises.unpdf = false;

	});

	return importPromises.unpdf;

}

var pdfjsDecoders = false;

async function loadPdfjsDecoders()
{
	if(importPromises.pdfjsDecoders) return importPromises.pdfjsDecoders;
	if(pdfjsDecoders) return;

	importPromises.pdfjsDecoders = new Promise(async function(resolve){

		pdfjsDecoders = await import(asarToAsarUnpacked(p.join(__dirname, '..', 'node_modules/pdfjs-dist/image_decoders/pdf.image_decoders.mjs')));

		pdfjsDecoders.JpxImage.setOptions({
			useWasm: true,
			useWorkerFetch: true,
			wasmUrl: fileManager.posixPath(asarToAsarUnpacked(p.join(appDir, 'node_modules/pdfjs-dist/wasm/'))),
		});

		resolve();

		importPromises.pdfjsDecoders = false;

	});

	return importPromises.pdfjsDecoders;

}

var JxlImage = false;

async function loadJxlImage()
{
	if(importPromises.JxlImage) return importPromises.JxlImage;
	if(JxlImage) return;

	importPromises.JxlImage = new Promise(async function(resolve){

		JxlImage = await import(asarToAsarUnpacked(p.join(__dirname, '..', 'node_modules/jxl-oxide-wasm/jxl_oxide_wasm.js')));

		await JxlImage.default();
		JxlImage = JxlImage.JxlImage;

		resolve();

		importPromises.JxlImage = false;

	});

	return importPromises.JxlImage;
	
}

var foliateJs = {};

async function loadFoliateJs()
{
	if(importPromises.foliateJs) return importPromises.foliateJs;
	if(foliateJs.opds) return;

	importPromises.foliateJs = new Promise(async function(resolve){

		foliateJs.opds = await import(asarToAsarUnpacked(p.join(__dirname, '..', 'node_modules/foliate-js/opds.js')));

		resolve();

		importPromises.foliateJs = false;

	});

	return importPromises.foliateJs;
}

async function loadWebdav()
{
	let webdav = await import(asarToAsarUnpacked(p.join(appDir, 'node_modules/webdav/dist/web/index.js')));
	return webdav;
}

/*Global functions*/

function copy(data)
{
	return JSON.parse(JSON.stringify(data));
}

function inArray(string, array)
{
	return array.includes(string) ? true : false;
}

function removeElements(array1, array2)
{
    const set2 = new Set(array2);
    return array1.filter(element => !set2.has(element));
}

function fastJoin(path1, path2)
{
	return path1.replace(/[\/\\]$/, '')+p.sep+path2.replace(/^[\/\\]/, '');
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

const shaCache = {};

function sha1(string)
{
	if(string.length > 1000)
		return crypto.hash('sha1', string, 'hex');
	else if(shaCache[string])
		return shaCache[string];

	return shaCache[string] = crypto.hash('sha1', string, 'hex');
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
	if(!/app(-(?:arm64|x64))?\.asar\.unpacked/.test(path))
	{
		var pathUnpacked = path.replace(/app(-(?:arm64|x64))?\.asar/, 'app$1.asar.unpacked');

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
	const indexPath = dom.history.path;

	if(force || generateAppMenuData.resetZoom !== electron.webFrame.getZoomFactor() || generateAppMenuData.onReading !== onReading || generateAppMenuData.indexPath !== indexPath)
	{
		let currentWindow = electronRemote.getCurrentWindow();
		generateAppMenuData = {resetZoom: electron.webFrame.getZoomFactor(), onReading: onReading, indexPath: indexPath};

		let currentPath = onReading ? reading.readingCurrentPath() : indexPath;
		let pathIsFolder = (currentPath && fs.existsSync(currentPath) && fs.statSync(currentPath).isDirectory()) ? true : false;

		var menuTemplate = [
			{
				label: language.menu.file.main,
				submenu: [
					{label: language.menu.file.openFile, click: function(){openComicDialog()}, accelerator: 'CmdOrCtrl+O'},
					{label: language.menu.file.openFolder, click: function(){openComicDialog(true)}, accelerator: 'CmdOrCtrl+Shift+O'},
					{label: language.menu.file.addFile, click: function(){addComic()}},
					{label: language.menu.file.addFolder, click: function(){addComic(true)}},
					{type: 'separator'},
					{label: language.global.labels, enabled: currentPath, click: function(){reading.contextMenu.labels()}},
					{label: pathIsFolder ? language.global.contextMenu.openFolderLocation : language.global.contextMenu.openFileLocation, enabled: currentPath, click: function(){reading.contextMenu.openFileLocation()}},
					{label: language.global.contextMenu.aboutFile, enabled: currentPath, click: function(){reading.contextMenu.aboutFile()}},
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
					{label: language.menu.help.guides, click: function(){electron.shell.openExternal('https://opencomic.app/docs/category/guides');}},
					{type: 'separator'},
					{label: language.menu.help.funding, click: function(){electron.shell.openExternal('https://opencomic.app/docs/donate');}, visible: !macosMAS},
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

function showAboutWindow()
{
	const about = new electronRemote.BrowserWindow({
		show: false,
		title: language.menu.help.about,
		width: 900,
		height: 600,
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

	const packageLock = require(p.join(appDir, 'scripts/builded/package-lock.js'));
	const highlight = [
		'electron',
		'sharp',
		'pdfjs-dist',
		'7zip-bin-full',
	];

	const allDependencies = {
		'electron': '',
		..._package.dependencies,
		..._package.devDependencies
	};
	const dependencies = [];

	for(let key in allDependencies)
	{
		allDependencies[key] = packageLock[key] ?? packageLock['node_modules/'+key] ?? allDependencies[key];

		if(!highlight.includes(key))
			dependencies.push({package: key, version: allDependencies[key]});
	}

	const highlightDependencies = [];

	for(let i = 0, len = highlight.length; i < len; i++)
	{
		const key = highlight[i];
		highlightDependencies.push({package: key, version: allDependencies[key]});
	}

	handlebarsContext.highlightDependencies = highlightDependencies;
	handlebarsContext.dependencies = dependencies;

	about.removeMenu();
	about.setMenuBarVisibility(false);

	const url = require('url');

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

function showBlobInternals()
{
	const win = new electronRemote.BrowserWindow({
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		}
	});

	win.loadURL('chrome://blob-internals/');
}

function printMemoryUsage()
{
	const memoryUsage = process.memoryUsage();
	const memory = performance.memory;

	const toGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2);

	let message = '';

	message += 'RSS: '+toGB(memoryUsage.rss)+'GB\n';
	message += 'Heap Total: '+toGB(memoryUsage.heapTotal)+'GB\n';
	message += 'Heap Used: '+toGB(memoryUsage.heapUsed)+'GB\n';
	message += 'External: '+toGB(memoryUsage.external)+'GB\n';
	message += 'Array Buffers: '+toGB(memoryUsage.arrayBuffers)+'GB\n';
	message += '-----\n';
	message += 'Total JS Heap Size: '+toGB(memory.totalJSHeapSize)+'GB\n';
	message += 'Used JS Heap Size: '+toGB(memory.usedJSHeapSize)+'GB\n';

	console.log('');
	console.log('Memory usage');
	console.log(message);
}

function escapeBackSlash(string)
{
	return (string || '').replace(/\\/g, '\\\\');
}

function invertBackslash(string)
{
	return (string || '').replace(/\\+/g, '/');
}

function encodeSrcURI(string)
{
	const vars = string.split('?');
	const segments = fileManager.splitPath(vars[0] ?? '');

	for(let i = 0, len = segments.length; i < len; i++)
	{
		if(i != 0)
			segments[i] = encodeURIComponent(segments[i]);
		else
			segments[i] = segments[i];
	}

	return segments.join(p.sep)+(vars[1] ? '?'+vars[1] : '');
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

	let helpers = [], value;

	for(let i = 0, len = arguments.length; i < len; i++)
	{
		const arg = arguments[i];

		if(hb.helpers[arg])
		{
			helpers.push(hb.helpers[arg]);
		}
		else
		{
			value = arg;

			for(let j = 0, len = helpers.length; j < len; j++)
			{
				const helper = helpers[j];
				value = helper(value, arguments[i + 1]);
			}

			break;
		}
	}

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

hb.registerHelper('shortWindowsPath', function(string) {

	return app.shortWindowsPath(string);

});

hb.registerHelper('normalizeNumber', function(value, decimals) {

	if(isNaN(value))
		value = 0;
	else
		value = +value;

	value = String(value);

	const has = value.replace(/.*?(\.|$)/, '').length;
	decimals = decimals.replace(/.*?(\.|$)/, '').length;

	if(decimals != 0)
		value = value+(/\./.test(value) ? '' : '.')+('0'.repeat(decimals - has));

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
	if(compatible.open(path) || fs.statSync(path).isDirectory())
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

	dialog.showOpenDialog({properties: properties, filters: [folders ? {name: language.global.comics} : {name: language.global.comics, extensions: compatible.open.list()}], securityScopedBookmarks: macosMAS}).then(function (files) {

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
			if(compatible.image(filePath))
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
			reading.progress.save();

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

	dialog.showOpenDialog({properties: properties, filters: [folders ? {name: language.global.comics} : {name: language.global.comics, extensions: compatible.open.list()}], securityScopedBookmarks: macosMAS}).then(function(files) {

		fileManager.macosSecurityScopedBookmarks(files);

		addComicsToLibrary(files.filePaths);

	});

}

function addComicsToLibrary(files, reload = true)
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
				if(compatible.image(filePath))
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

			path = relative.path(path);
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

	if(added && reload)
	{
		if(onReading)
			reading.progress.save();

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

fileManager.removeTmpVector();
start();