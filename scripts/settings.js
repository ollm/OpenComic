function start()
{
	generateShortcutsTable();

	updateMasterFolders();

	getStorageSize();

	events.events();
}

async function getStorageSize()
{
	// Cache size
	let cacheSize = await fileManager.dirSize(cache.folder);

	cacheSize = cacheSize / 1000 / 1000;

	if(cacheSize > 1000)
		cacheSize = app.round(cacheSize / 1000, 1)+'GB';
	else
		cacheSize = app.round(cacheSize, 1)+'MB';

	dom.queryAll('.cacheSize').html('&nbsp;('+cacheSize+')');

	// Temp size
	let tmpSize = await fileManager.dirSize(tempFolder);

	tmpSize = tmpSize / 1000 / 1000;

	if(tmpSize > 1000)
		tmpSize = app.round(tmpSize / 1000, 1)+'GB';
	else
		tmpSize = app.round(tmpSize, 1)+'MB';

	dom.queryAll('.temporaryFilesSize').html('&nbsp;('+tmpSize+')');
}

async function clearCache()
{
	storage.set('cache', {});
	await fse.emptyDir(cache.folder);

	getStorageSize();
}

function removeTemporaryFiles(onClose = false)
{
	try
	{
		fse.emptyDirSync(tempFolder);
	}
	catch(error)
	{
		console.error(error);
	}

	if(!onClose)
		getStorageSize();
}

function removeUnreferencedTemporaryFiles(tmpUsage, dir, first = true)
{
	let files = fs.readdirSync(dir, {withFileTypes: true});
	let empty = true;

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];
		let path = p.join(dir, file.name);

		if(file.isDirectory())
		{
			let _empty = removeUnreferencedTemporaryFiles(tmpUsage, path, false);

			if(!_empty)
				empty = false;
		}
		else if(file.isFile())
		{
			if(!/opencomic[a-z0-9_-]*\.txt$/iu.test(path))
			{
				if(!tmpUsage[path])
					fs.unlinkSync(path);
				else
					empty = false;
			}
		}
	}

	if(empty && !first)
		fs.rmdirSync(dir, {recursive: true})

	return empty;
}

function removeTemporaryPath(path)
{
	let size = 0;

	if(fs.existsSync(path))
	{
		if(fs.statSync(path).isDirectory())
		{
			size = fileManager.dirSizeSync(path);
			fs.rmdirSync(path, {recursive: true});
		}
		else
		{
			size = fs.statSync(path).size;
			fs.unlinkSync(path);
		}
	}

	return size;
}

function purgeTemporaryFiles()
{
	try
	{
		if(config.tmpMaxSize == 0)
		{
			settings.removeTemporaryFiles(true);
		}
		else
		{
			let time = app.time();
			let tmpUsage = storage.get('tmpUsage') || {};

			let tmpMaxSize = config.tmpMaxSize * 1000 * 1000 * 1000;
			let tmpMaxOld = config.tmpMaxOld * 60 * 60 * 24;

			let dataArray = [];

			// Remove not usage files
			for(let path in tmpUsage)
			{
				if(time - tmpUsage[path].lastAccess > tmpMaxOld)
				{
					if(fs.existsSync(path))
						fs.unlinkSync(path);
				}
				else
				{
					dataArray.push({
						path: path,
						lastAccess: tmpUsage[path].lastAccess,
					});
				}
			}

			// Remove unreferenced files
			removeUnreferencedTemporaryFiles(tmpUsage, tempFolder, true);

			// Remove if exede tmp max size
			let tmpSize = fileManager.dirSizeSync(tempFolder);

			if(tmpSize > tmpMaxSize)
			{
				let tmpMaxSizeMargin = tmpMaxSize * 0.8; // Remove 20% if tmp exceeds maximum size to avoid running this every time

				dataArray.sort(function(a, b) {

					if(a.lastAccess === b.lastAccess)
						return 0;

					return a.lastAccess > b.lastAccess ? 1 : -1;

				});

				for(let i = 0, len = dataArray.length; i < len; i++)
				{
					let path = dataArray[i].path;
					delete tmpUsage[path];

					let size = removeTemporaryPath(path);

					tmpSize -= size;

					if(tmpSize < tmpMaxSizeMargin)
						break;
				}
			}

			storage.set('tmpUsage', tmpUsage);
		}
	}
	catch(error)
	{
		console.error(error);
	}
}

function removeMasterFolder(key)
{
	let masterFolders = storage.get('masterFolders');

	if(masterFolders[key])
	{
		masterFolders.splice(key, 1);
		storage.set('masterFolders', masterFolders);

		updateMasterFolders();
		dom.loadIndexContentLeft(true);
	}
}

function addMasterFolder()
{
	let dialog = electronRemote.dialog;

	dialog.showOpenDialog({properties: ['openDirectory'], filters: [{name: language.settings.masterFolders.folder}], securityScopedBookmarks: macosMAS}).then(async function (files) {

		fileManager.macosSecurityScopedBookmarks(files);

		if(files.filePaths && files.filePaths[0])
		{
			let folder = files.filePaths[0];
			let masterFolders = storage.get('masterFolders');

			if(!inArray(folder, masterFolders))
			{
				masterFolders.push(folder);
				storage.set('masterFolders', masterFolders);

				updateMasterFolders();
				dom.loadIndexContentLeft(true);
			}
		}

	});
}

function updateMasterFolders()
{
	let masterFolders = storage.get('masterFolders');
	handlebarsContext.masterFolders = masterFolders;

	let contentRight = template._contentRight();

	let empty = contentRight.querySelector('.settings-master-folders-empty');
	let list = contentRight.querySelector('.settings-master-folders-list');

	if(masterFolders.length)
	{
		empty.style.display = 'none';
		list.style.display = '';
	}
	else
	{
		empty.style.display = '';
		list.style.display = 'none';
	}

	list.innerHTML = template.load('settings.content.right.master.folders.list.html');
}

function generateShortcutsTable(highlightItem = false)
{
	let list = shortcuts.shortcuts();

	// Keyboard
	let keys = {};

	for(let key in list.reading.shortcuts)
	{
		let action = list.reading.shortcuts[key];

		if(!keys[action]) keys[action] = [];
		keys[action].push(key);
	}

	// Gamepad
	let buttons = {};

	for(let button in list.reading.gamepad)
	{
		let action = list.reading.gamepad[button];

		if(!buttons[action]) buttons[action] = [];
		buttons[action].push(button);
	}

	let actions = [];

	for(let key in list.reading.actionsOrder)
	{
		let action = list.reading.actionsOrder[key];
		let data = list.reading.actions[action];

		let _keys = keys[action] || {};
		let _buttons = buttons[action] || {};

		let shortcut = {
			action: action,
			name: data.name,
			key1: _keys[0] || '',
			key2: _keys[1] || '',
			key3: _keys[2] || '',
			key4: _keys[3] || '',
			key5: _keys[4] || '',
			gamepad1: (_buttons[0] || '').toLowerCase(),
			gamepad1_: _buttons[0] || '',
			gamepad2: (_buttons[1] || '').toLowerCase(),
			gamepad2_: _buttons[1] || '',
		};

		actions.push(shortcut);
	}

	handlebarsContext.shortcuts = actions;

	let table = template._contentRight().querySelector('.settings-shortcuts-table');
	table.innerHTML = template.load('settings.content.right.shortcuts.html');

	gamepad.updateBrowsableItems('settings', false, !(highlightItem !== false));
	if(highlightItem !== false) gamepad.highlightItem(highlightItem);
}

var recording= false;

function changeShortcut(action, current, This)
{
	if(recording) return;

	recording = true;

	dom.this(template._contentRight()).find('table tbody td').removeClass('active');
	This.classList.add('active');

	shortcuts.record(function(shortcut) {

		shortcuts.change('reading', action, current, shortcut);

		generateShortcutsTable(gamepad.currentHighlightItem());

		setTimeout(function(){recording = false}, 100);

	});
}

function removeShortcut(action, current)
{
	shortcuts.change('reading', action, current, '');

	generateShortcutsTable(gamepad.currentHighlightItem());
}

function changeButton(action, current, This)
{
	if(recording) return;

	recording = true;

	dom.this(template._contentRight()).find('table tbody td').removeClass('active');
	This.classList.add('active');

	shortcuts.record(function(shortcut){

		gamepad.reset('record');

		console.log(This);
		This.classList.remove('active');

		events.snackbar({
			key: 'useGamepad',
			text: language.settings.shortcuts.useGamepad,
			duration: 6,
			update: true,
			buttons: [
				{
					text: language.buttons.dismiss,
					function: 'events.closeSnackbar();',
				},
			],
		});

		setTimeout(function(){recording = false}, 100);

	});

	console.log(action, current);

	gamepad.setButtonEvent('record', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], function(key, button){

		console.log(key, button);

		gamepad.reset('record');
		shortcuts.stopRecord();

		shortcuts.changeGamepad('reading', action, current, gamepad.buttonName(key));

		generateShortcutsTable(gamepad.currentHighlightItem());

		setTimeout(function(){recording = false}, 100);

	});
}

function removeButton(action, current)
{
	shortcuts.changeGamepad('reading', action, current, '');

	generateShortcutsTable(gamepad.currentHighlightItem());
}

function resoreShortcuts()
{
	shortcuts.restoreDefaults();

	generateShortcutsTable(gamepad.currentHighlightItem());
}

function setMaxMargin(value, save = false)
{
	if(save) storage.updateVar('config', 'readingMaxMargin', value);
}

function setCacheMaxSize(value, save = false)
{
	if(save) storage.updateVar('config', 'cacheMaxSize', value);
}

function setCacheMaxOld(value, save = false)
{
	if(save) storage.updateVar('config', 'cacheMaxOld', value);
}

function setGlobalZoom(value)
{
	storage.updateVar('config', 'readingGlobalZoom', value);
}

function setMoveZoomWithMouse(value)
{
	storage.updateVar('config', 'readingMoveZoomWithMouse', value);
}

function setScrollWithMouse(value)
{
	storage.updateVar('config', 'readingScrollWithMouse', value);
}

function setStartReadingInFullScreen(value)
{
	storage.updateVar('config', 'readingStartReadingInFullScreen', value);
}

function setTrackingAtTheEnd(value)
{
	storage.updateVar('config', 'readingTrackingAtTheEnd', value);
}

function setIgnoreSingleFoldersLibrary(value)
{
	storage.updateVar('config', 'ignoreSingleFoldersLibrary', value);
}

function setShowFullPathLibrary(value)
{
	storage.updateVar('config', 'showFullPathLibrary', value);
}

function setShowFullPathOpened(value)
{
	storage.updateVar('config', 'showFullPathOpened', value);
}

function setStartInFullScreen(value)
{
	storage.updateVar('config', 'startInFullScreen', value);
}

function setStartInContinueReading(value)
{
	storage.updateVar('config', 'startInContinueReading', value);

	dom.query('.settings-start-only-from-library').class(!value, 'disable-pointer');
}

function setStartOnlyFromLibrary(value)
{
	storage.updateVar('config', 'startOnlyFromLibrary', value);
}

function setStartOnStartup(value)
{
	storage.updateVar('config', 'startOnStartup', value);
	electron.ipcRenderer.send('open-at-login', value);
}

function setCheckReleases(value)
{
	storage.updateVar('config', 'checkReleases', value);

	dom.query('.settings-check-prereleases').class(!value, 'disable-pointer');
}

function setCheckPreReleases(value)
{
	storage.updateVar('config', 'checkPreReleases', value);
}

function set(key, value, save = true)
{
	switch (key)
	{
		case 'whenOpenFolderFirstImageOrContinueReading':

			if(!value)
				dom.queryAll('.settings-when-open-folder-continue-reading').removeClass('disable-pointer');
			else
				dom.queryAll('.settings-when-open-folder-continue-reading').addClass('disable-pointer');

			break;

		case 'whenOpenFileFirstImageOrContinueReading':

			if(!value)
				dom.queryAll('.settings-when-open-file-continue-reading').removeClass('disable-pointer');
			else
				dom.queryAll('.settings-when-open-file-continue-reading').addClass('disable-pointer');

			break;
	}

	if(save)
		storage.updateVar('config', key, value);
}

module.exports = {
	start: start,
	set: set,
	setMaxMargin: setMaxMargin,
	setGlobalZoom: setGlobalZoom,
	setMoveZoomWithMouse: setMoveZoomWithMouse,
	setScrollWithMouse: setScrollWithMouse,
	setStartReadingInFullScreen: setStartReadingInFullScreen,
	setTrackingAtTheEnd: setTrackingAtTheEnd,
	setIgnoreSingleFoldersLibrary: setIgnoreSingleFoldersLibrary,
	setShowFullPathLibrary: setShowFullPathLibrary,
	setShowFullPathOpened: setShowFullPathOpened,
	setStartInFullScreen: setStartInFullScreen,
	setStartInContinueReading: setStartInContinueReading,
	setStartOnlyFromLibrary: setStartOnlyFromLibrary,
	setStartOnStartup: setStartOnStartup,
	setCheckReleases: setCheckReleases,
	setCheckPreReleases: setCheckPreReleases,
	changeShortcut: changeShortcut,
	removeShortcut: removeShortcut,
	changeButton: changeButton,
	removeButton: removeButton,
	resoreShortcuts: resoreShortcuts,
	removeMasterFolder: removeMasterFolder,
	addMasterFolder: addMasterFolder,
	setCacheMaxSize: setCacheMaxSize,
	setCacheMaxOld: setCacheMaxOld,
	clearCache: clearCache,
	removeTemporaryFiles: removeTemporaryFiles,
	purgeTemporaryFiles: purgeTemporaryFiles,
};