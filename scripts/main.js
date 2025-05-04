const {app, ipcMain, BrowserWindow, Menu, nativeImage, shell} = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const folderPortable = require(path.join(__dirname, 'folder-portable.js'));

require('@electron/remote/main').initialize();
//remoteMain.enable(window.webContents);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win, appClosing;

process.traceProcessWarnings = true;

function createWindow() {
	// Create the browser window.

	let gotSingleInstanceLock = app.requestSingleInstanceLock();
	if(!gotSingleInstanceLock)
	{
		let _toOpenFile = false;

		for(let i = 1, len = process.argv.length; i < len; i++)
		{
			let arg = process.argv[i];

			if(arg && ['scripts/main.js', '.'].indexOf(arg) == -1 && !/^--/.test(arg) && fs.existsSync(arg))
			{
				_toOpenFile = arg;
				break;
			}
		}

		if(_toOpenFile) app.quit();
	}

	let mainWindowState = windowStateKeeper({
		defaultWidth: 1100,
		defaultHeight: 640,
		fullScreen: false,
	});

	let image = nativeImage.createFromPath(path.join(__dirname, '../images/logo.png'));

	win = new BrowserWindow({
		show: false,
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
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

	require("@electron/remote/main").enable(win.webContents)

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

	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, '../templates/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	// Open the DevTools.
	// win.webContents.openDevTools()

	if(toOpenFile)
		win.webContents.executeJavaScript('toOpenFile = "'+toOpenFile+'";', false);

	win.on('close',	function(event) {

		if(!appClosing)
		{
			appClosing = true;

			win.webContents.executeJavaScript('var saved = reading.saveReadingProgress(); settings.purgeTemporaryFiles(); cache.purge(); ebook.closeAllRenders(); workers.closeAllWorkers(); saved;', false).then(function(value) {

				if(!value)
					app.quit();
				else // Wait for it to save
					setTimeout(function(win){app.quit();}, 200, win);

			});

			event.preventDefault();
		}

	});

	// Emitted when the window is closed.
	win.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.

		win = null
	});

	let windowShowed = false;

	let showTimeout = setTimeout(function() {

		win.show();
		windowShowed = true;
		console.log('Warning: win.show() from setTimeout and not from ready-to-show');

	}, 2000);

	win.once('ready-to-show', function() {

		clearTimeout(showTimeout);
		
		if(!windowShowed) win.show();

	});

	win.webContents.setWindowOpenHandler(function(details) {

		shell.openExternal(details.url);

		return {action: 'deny'};

	});

	mainWindowState.manage(win);
}

const configInitFile = (process.env.PORTABLE_EXECUTABLE_DIR && folderPortable.check()) ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'opencomic', 'storage', 'configInit.json') : path.join(app.getPath('userData'), 'storage', 'configInit.json');
const configInit = fs.existsSync(configInitFile) ? JSON.parse(fs.readFileSync(configInitFile, 'utf8')) : {};

if(configInit.forceColorProfile)
	app.commandLine.appendSwitch('force-color-profile', configInit.forceColorProfile);

var toOpenFile = false;

app.on('open-file', function(event, path) {

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

	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})

ipcMain.on('open-at-login', function(event, active = false) {

	app.setLoginItemSettings({
		openAtLogin: active,
	})

});

ipcMain.handle('move-to-trash', function(event, path) {

	return shell.trashItem(path);

});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// Menu
/*
const menuTemplate = [{}];

const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)*/
