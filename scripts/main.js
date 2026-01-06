const {app, ipcMain, BrowserWindow, screen, Menu, nativeImage, shell} = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const windowStateKeeper = require('electron-window-state');
const folderPortable = require(path.join(__dirname, 'folder-portable.js'));

require('@electron/remote/main').initialize();
//remoteMain.enable(window.webContents);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows = new Map();
let firstWindowCreated = false;

process.traceProcessWarnings = true;

function getArgValue(args, flag, defaultValue = null)
{
	const arg = args.find(a => a.startsWith(flag+'='));
	if(!arg) return defaultValue;
	return arg.split('=')[1];
}

function createWindow(options = {}) {

	const args = options.args ?? process.argv;

	// Create the browser window.
	const id = crypto.randomUUID();
	const newWindow = args.includes('--new-window');

	let win = null;
	let appClosing = false;
	let windowShowed = false;

	let gotSingleInstanceLock = app.requestSingleInstanceLock();
	if(!gotSingleInstanceLock)
	{
		let _toOpenFile = false;

		const len = args.length;
		const last = args[len - 1];

		if(/^opencomic:\/\//.test(last))
			app.quit();

		for(let i = 1; i < len; i++)
		{
			let arg = args[i];

			if(arg && !['--no-sandbox', 'scripts/main.js', '.dist/main.js', '.', '--new-window'].includes(arg) && !/^--/.test(arg) && !/app\.asar/i.test(arg) && fs.existsSync(arg))
			{
				_toOpenFile = arg;
				break;
			}
		}

		if(_toOpenFile && !newWindow) app.quit();
	}

	let mainWindowState = windowStateKeeper({
		defaultWidth: 1100,
		defaultHeight: 640,
		fullScreen: false,
	});

	let image = nativeImage.createFromPath(path.join(__dirname, '../images/logo.png'));

	const windowOffset = (newWindow && !mainWindowState.isMaximized && !mainWindowState.isFullScreen ? 24 : 0);

	const x = windowOffset ? +getArgValue(args, '--window-x', mainWindowState.x) : mainWindowState.x;
	const y = windowOffset ? +getArgValue(args, '--window-y', mainWindowState.y) : mainWindowState.y;
	const width = windowOffset ? +getArgValue(args, '--window-width', mainWindowState.width) : mainWindowState.width;
	const height = windowOffset ? +getArgValue(args, '--window-height', mainWindowState.height) : mainWindowState.height;

	win = new BrowserWindow({
		show: false,
		x: x + windowOffset,
		y: y + windowOffset,
		width: width,
		height: height,
		minWidth: 320,
		minHeight: 200,
		icon: image,
		webPreferences: {
			plugins: true, 
			contextIsolation: false,
			nodeIntegration: true,
			nodeIntegrationInWorker: true,
			enableRemoteModule: true,
			backgroundThrottling: false,
			nativeWindowOpen: false,
			additionalArguments: options.args ?? [],
		},
		titleBarStyle: (process.platform == 'linux' && !configInit.forceLinuxHiddenTitleBar) ? 'native' : 'hidden',
		titleBarOverlay: {
			color: '#242a3000',
			symbolColor: '#c2c7cf',
			height: 29,
		},
		trafficLightPosition: {x: 10, y: 7},
		backgroundColor: '#242a30',
	});

	require('@electron/remote/main').enable(win.webContents)

	let menuTemplate = [
		{
			label: '...',
			submenu: [
				{role: 'reload'},
				{role: 'forceReload'},
				{role: 'toggleDevTools'},
			]
		}
	];

	let menu = Menu.buildFromTemplate(menuTemplate);
	win.setMenu(menu);

	win.removeMenu();

	const showWindow = function(message = '') {

		if(!windowShowed)
		{
			win.show();
			windowShowed = true;

			if(message)
				console.log(message);
		}

	}
	win.once('ready-to-show', showWindow);

	// https://github.com/electron/electron/issues/42409
	win.webContents.once('did-finish-load', () => showWindow('Warning: win.show() from did-finish-load and not from ready-to-show'));
	setTimeout(() => showWindow('Warning: win.show() from setTimeout and not from ready-to-show'), 5000);

	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, '../templates/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	// Open the DevTools.
	if(configInit.openDevTools)
		win.webContents.openDevTools()

	if(toOpenFile && !newWindow)
		win.webContents.executeJavaScript('toOpenFile = "'+toOpenFile+'";', false);

	const initData = {};

	if(options.initHistory)
		initData.history = options.initHistory;

	win.webContents.send('init-data', initData);

	win.on('close',	function(event) {

		if(!appClosing)
		{
			appClosing = true;

			win.webContents.executeJavaScript('var saved = reading.progress.save(); settings.purgeTemporaryFiles(); cache.purge(); ebook.closeAllRenders(); workers.closeAllWorkers(); storage.purgeOldAtomic(); saved;', false).then(function(value) {

				if(!value)
					win.close();
				else // Wait for it to save
					setTimeout(function(win){win.close()}, 200, win);

			});

			event.preventDefault();
		}

	});

	// Emitted when the window is closed.
	win.on('closed', function() {

		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		windows.delete(id);
		win = null;

	});

	win.webContents.setWindowOpenHandler(function(details) {

		shell.openExternal(details.url);

		return {action: 'deny'};

	});

	let wasInside = false;

	setInterval(function() {

		if(!win || win.isDestroyed())
			return;

		const cursor = screen.getCursorScreenPoint();
		const bounds = win.getBounds();

		const inside = (cursor.x >= bounds.x) && (cursor.x <= bounds.x + bounds.width) && (cursor.y >= bounds.y) && (cursor.y <= bounds.y + bounds.height);

		if(inside && !wasInside)
			win.webContents.send('cursorenter');
		else if(!inside && wasInside)
			win.webContents.send('cursorleave');

		wasInside = inside;

	}, 100);

	if(gotSingleInstanceLock && !newWindow)
		mainWindowState.manage(win);

	windows.set(id, win);
	firstWindowCreated = true;
}

let configInitFile = path.join(app.getPath('userData'), 'storage', 'configInit.json');

if(folderPortable.check())
{
	const executableDir = process.env.OPENCOMIC_PORTABLE_EXECUTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;

	if(executableDir)
	{
		configInitFile = path.join(executableDir, 'opencomic', 'storage', 'configInit.json');
	}
	else
	{
		const outsidePath = path.join(__dirname, '../../../../', 'opencomic');

		if(fs.existsSync(outsidePath))
			configInitFile = path.join(outsidePath, 'storage', 'configInit.json');
		else
			configInitFile = path.join(__dirname, '../../../', 'storage', 'configInit.json');
	}
}

const configInit = fs.existsSync(configInitFile) ? JSON.parse(fs.readFileSync(configInitFile, 'utf8')) : {};

if(configInit.forceColorProfile)
	app.commandLine.appendSwitch('force-color-profile', configInit.forceColorProfile);

var toOpenFile = false;

app.on('open-file', function(event, path) {

	if(!firstWindowCreated)
		toOpenFile = path;

});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

	createWindow();

})

// Quit when all windows are closed.
app.on('window-all-closed', () => {

	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if(process.platform !== 'darwin')
		app.quit()

})

app.on('activate', () => {

	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if(windows.size === 0)
		createWindow()

})

ipcMain.on('open-at-login', function(event, active = false) {

	app.setLoginItemSettings({
		openAtLogin: active,
	})

});

ipcMain.handle('move-to-trash', function(event, path) {

	return shell.trashItem(path);

});

ipcMain.handle('open-new-window', function(event, options = {}) {

	createWindow(options)

});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// Menu
/*
const menuTemplate = [{}];

const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)*/
