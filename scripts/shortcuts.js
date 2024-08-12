var shosho = false;

var shortcuts = false;

async function loadShoShoObject()
{
	if(shosho) return;

	shosho = new ShoSho({
		capture: true,
		target: document,
	});

	shoshoMouse = new ShoSho({
		capture: true,
		target: document.querySelector('.content-right'),
	});

	return true;
}

function inputIsFocused()
{
	if(document.activeElement && document.activeElement.tagName === 'INPUT')
		return document.activeElement;

	return false;
}

function loadShortcuts()
{
	shortcuts = {
		browse: {
			actionsOrder: [
				'reload',
				'search',
				'searchFilter',
				'prevChapter',
				'nextChapter',
				'goBack',
				'goForwards',
			],
			actions: {
				reload: {
					name: language.reading.prev,
					function: function(){
						dom.reloadIndex();
						return true;
					},
				},
				search: {
					name: language.global.search,
					function: function(){
						dom.search.showHide();
						return true;
					},
				},
				searchFilter: {
					name: language.global.search,
					function: function(){
						dom.search.showHide(true);
						return true;
					},
				},
				prevChapter: {
					name: language.reading.prevChapter,
					function: function(){
						dom.goPrevComic();
						return true;
					},
				},
				nextChapter: {
					name: language.reading.nextChapter,
					function: function(){
						dom.goNextComic();
						return true;
					},
				},
				goBack: {
					name: language.global.goBack,
					function: function(){
						gamepad.goBack();
						return true;
					},
				},
				goForwards: {
					name: language.global.goForwards,
					function: function(){
						gamepad.goForwards();
						return true;
					},
				},
			},
			shortcuts: {},
			_shortcuts: {
				'F5': 'reload',
				'Ctrl+F': 'search',
				'Ctrl+G': 'searchFilter',
				'Mouse3': 'goBack',
				'Mouse4': 'goForwards',
			},
			gamepad: {},
			_gamepad: {
				'X': 'reload',
				'LB': 'prevChapter',
				'RB': 'nextChapter',
			},
		},
		reading: {
			actionsOrder: [
				'prev',
				'next',
				'start',
				'end',
				'prevComic',
				'nextComic',
				'magnifyingGlass',
				'hideBarHeader',
				'hideContentLeft',
				'createAndDeleteBookmark',
				'zoomIn',
				'zoomOut',
				'resetZoom',
				'fullscreen',
				'goBack',
				'goForwards',
				'gamepadMenu',
			],
			actions: {
				prev: {
					name: language.reading.previous,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(event instanceof PointerEvent)
						{
							return reading.leftClick(event);
						}
						else
						{
							reading.goPrev();
							return true;
						}

					},
				},
				next: {
					name: language.reading.next,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(event instanceof PointerEvent)
						{
							if(event.button != 2 || event.type != 'contextmenu')
								return reading.rightClick(event);
							else
								return false;
						}
						else
						{
							reading.goNext();
							return true;
						}

					},
				},
				start: {
					name: language.reading.firstPage,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goStart();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(true)) return true;
						}

						return false;
					},
				},
				end: {
					name: language.reading.lastPage,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goEnd();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(false)) return true;
						}

						return false;
					},
				},
				prevComic: {
					name: language.reading.prevChapter,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goPrevComic();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(true)) return true;
						}

						return false;
					},
				},
				nextComic: {
					name: language.reading.nextChapter,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goNextComic();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(false)) return true;
						}

						return false;
					},
				},
				magnifyingGlass: {
					name: language.reading.magnifyingGlass.main,
					function: function(event, gamepad = false){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.activeMagnifyingGlass(null, !!gamepad);
						return true;
					},
				},
				hideBarHeader: {
					name: language.reading.moreOptions.hideBarHeader,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.hideBarHeader();
						return true;
					},
				},
				hideContentLeft: {
					name: language.reading.moreOptions.hideContentLeft,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.hideContentLeft();
						return true;
					},
				},
				createAndDeleteBookmark: {
					name: language.reading.addBookmark,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.createAndDeleteBookmark();
						return true;
					},
				},
				zoomIn: {
					name: language.menu.view.zoomIn,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomIn(true, true);
						return true;
					},
				},
				zoomOut: {
					name: language.menu.view.zoomOut,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomOut(true, true);
						return true;
					},
				},
				resetZoom: {
					name: language.menu.view.resetZoom+'<br>'+language.menu.view.originalSize,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						let center = true;
						if(event instanceof PointerEvent) center = false;
						reading.resetZoom(true, false, true, center);
						return true;
					},
				},
				fullscreen: {
					name: language.menu.view.toggleFullScreen,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						fullScreen();
						return true;
					},
				},
				goBack: {
					name: language.global.goBack,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						gamepad.goBack();
						return true;
					},
				},
				goForwards: {
					name: language.global.goForwards,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						gamepad.goForwards();
						return true;
					},
				},
				gamepadMenu: {
					name: language.settings.shortcuts.gamepadMenu,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						gamepad.showMenu();
						return true;
					},
				},
			},
			shortcuts: {},
			_shortcuts: {
				'Left': 'prev',
				'A': 'prev',
				'LeftClick': 'prev',
				'Mouse4': 'prev',
				'Right': 'next',
				'D': 'next',
				'Space': 'next',
				'RightClick': 'next',
				'Mouse3': 'next',
				'Up': 'start',
				'W': 'start',
				'Home': 'start',
				'Down': 'end',
				'S': 'end',
				'End': 'end',
				'Ctrl+Up': 'prevComic',
				'Ctrl+Left': 'prevComic',
				'Ctrl+Down': 'nextComic',
				'Ctrl+Right': 'nextComic',
				'M': 'magnifyingGlass',
				'B': 'hideBarHeader',
				'H': 'hideBarHeader',
				'L': 'hideContentLeft',
				'P': 'hideContentLeft',
				'B': 'createAndDeleteBookmark',
				'MiddleClick': 'resetZoom',
				'Esc': 'goBack',
				'Backspace': 'goBack',
				'F11': 'fullscreen',
			},
			gamepad: {},
			_gamepad: {
				'A': 'createAndDeleteBookmark',
				'B': 'goBack',
				'X': 'hideContentLeft',
				'Y': 'hideBarHeader',
				'LB': 'prev',
				'RB': 'next',
				'LT': 'zoomOut',
				'RT': 'zoomIn',
				'View': 'magnifyingGlass',
				'Menu': 'gamepadMenu',
				'L': 'resetZoom',
				'R': 'fullscreen',
				'Up': 'start',
				'Down': 'end',
				'Left': 'prev',
				'Right': 'next',
				'Xbox': 'gamepadMenu',
			},
		},
	}

	// Load here from saved
	let _shortcuts = storage.get('shortcuts');

	for(let section in shortcuts)
	{
		// Shortcuts
		for(let shortcut in _shortcuts[section]?.shortcuts)
		{
			shortcuts[section].shortcuts[shortcut] = _shortcuts[section].shortcuts[shortcut];
		}

		// Set not configured shortcuts
		for(let shortcut in shortcuts[section]._shortcuts)
		{
			let action = shortcuts[section]._shortcuts[shortcut];

			if(!inArray(action, _shortcuts[section]?.actionsConfigured || []) && !_shortcuts[section]?.shortcuts[shortcut])
				shortcuts[section].shortcuts[shortcut] = action;
		}


		// Gamepad
		for(let button in _shortcuts[section]?.gamepad)
		{
			shortcuts[section].gamepad[button] = _shortcuts[section].gamepad[button];
		}

		// Set not configured gamepad
		for(let button in shortcuts[section]._gamepad)
		{
			let action = shortcuts[section]._gamepad[button];

			if(!inArray(action, _shortcuts[section]?.actionsConfigured || []) && !_shortcuts[section]?.gamepad[button])
				shortcuts[section].gamepad[button] = action;
		}
	}
}

var currentlyRegistered = false;

async function register(section = 'reading', force = false)
{
	if(currentlyRegistered === reading && !force)
		return;

	await loadShoSho();
	loadShoShoObject();
	loadShortcuts();

	shosho.reset();
	shoshoMouse.reset();

	for(let shortcut in shortcuts[section].shortcuts)
	{
		let actionKey = shortcuts[section].shortcuts[shortcut];
		let action = shortcuts[section].actions[actionKey];

		if(isMouseShortcut(shortcut))
			shoshoMouse.register(shortcut, action.function);
		else
			shosho.register(shortcut, action.function);
	}

	shosho.start();
	shoshoMouse.start();

	// Gamepad
	gamepad.reset('shortcuts');

	for(let button in shortcuts[section].gamepad)
	{
		let actionKey = shortcuts[section].gamepad[button];
		let action = shortcuts[section].actions[actionKey];

		gamepad.setButtonEvent('shortcuts', gamepad.buttonKey(button), action.function);
	}

	currentlyRegistered = section;
}

function unregister(force = false)
{
	if(!force || currentlyRegistered !== false)
	{
		shosho.reset();
		shoshoMouse.reset();
		gamepad.reset('shortcuts');
		currentlyRegistered = false;
	}
}

var mouse = [
	'LeftClick',
	'RightClick',
	'ClickLeft',
	'MouseLeft',
	'ClickMiddle',
	'MouseMiddle',
	'ClickRight',
	'MouseRight',
];

var mouseRegexp = new RegExp(mouse.join('|'), 'iu');

function isMouseShortcut(shortcut)
{
	return mouseRegexp.test(shortcut);
}

var modifiers = [
	'Ctrl',
	'Meta',
	'§',
	'OS',
	'Alt',
	'Shift',
];

var modifiersRegexp = new RegExp('(?:'+modifiers.join('|')+')$', 'iu');

var dispose = false;

function record(callback)
{
	if(dispose) return;

	dispose = shosho.record(function(shortcut){

		shortcut = ShoSho.format(shortcut, 'short-inflexible-nondirectional');

		if(!modifiersRegexp.test(shortcut))
		{
			callback(shortcut);
			dispose();
			setTimeout(function(){dispose = false;}, 100);
		}

	});
}

function stopRecord()
{
	if(dispose)
	{
		dispose();
		dispose = false;
	}
}

function change(section, action, current, shortcut)
{
	let saved = storage.getKey('shortcuts', section) || {};

	saved.gamepad = shortcuts[section].gamepad;

	saved.actionsConfigured = [];

	for(let key in shortcuts[section].actionsOrder)
	{
		saved.actionsConfigured.push(shortcuts[section].actionsOrder[key]);
	}

	saved.shortcuts = {};

	for(let key in shortcuts[section].shortcuts)
	{
		if(key === current && shortcut)
			saved.shortcuts[shortcut] = action;
		else if(key !== shortcut && key !== current)
			saved.shortcuts[key] = shortcuts[section].shortcuts[key];
	}

	if(!current && shortcut)
		saved.shortcuts[shortcut] = action;

	storage.setVar('shortcuts', section, saved);
}

function changeGamepad(section, action, current, button)
{
	let saved = storage.getKey('shortcuts', section) || {};

	saved.shortcuts = shortcuts[section].shortcuts;

	saved.actionsConfigured = [];

	for(let key in shortcuts[section].actionsOrder)
	{
		saved.actionsConfigured.push(shortcuts[section].actionsOrder[key]);
	}

	saved.gamepad = {};

	for(let key in shortcuts[section].gamepad)
	{
		if(key === current && button)
			saved.gamepad[button] = action;
		else if(key !== button && key !== current)
			saved.gamepad[key] = shortcuts[section].gamepad[key];
	}

	if(!current && button)
		saved.gamepad[button] = action;

	storage.setVar('shortcuts', section, saved);
}

function restoreDefaults()
{
	storage.set('shortcuts', {
		browse: {
			actionsConfigured: [],
			shortcuts: {},
			gamepad: {},
		},
		reading: {
			actionsConfigured: [],
			shortcuts: {},
			gamepad: {},
		},
	});
}

var _currentlyRegistered = false, pauseST = false;

function play()
{
	clearTimeout(pauseST);

	if(_currentlyRegistered)
	{
		register(_currentlyRegistered);
		currentlyRegistered = _currentlyRegistered;
	}
	
	_currentlyRegistered = false;
}

function pause()
{
	clearTimeout(pauseST);

	_currentlyRegistered = currentlyRegistered;

	pauseST = setTimeout(function(){

		unregister(true);

	}, 50);
}

module.exports = {
	register: register,
	unregister: unregister,
	shortcuts: function(){loadShortcuts(); return shortcuts;},
	record: record,
	stopRecord: stopRecord,
	change: change,
	changeGamepad: changeGamepad,
	restoreDefaults: restoreDefaults,
	play: play,
	pause: pause,
	inputIsFocused: inputIsFocused,
};