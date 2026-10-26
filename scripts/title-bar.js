let visible = true;

const controls = {
	position: 'right',
	width: 0,
	widthAndmargin: 0,
	left: 0,
	right: 0,
};

function start()
{
	document.querySelector('.tabs-bar > div').insertAdjacentHTML('afterend', template.load('title.bar.html'));
	app.event(window, 'mousedown touchstart', mousedown);

	getControlsPosition();
	getControlsPositionEvent();

	if(process.platform == 'darwin') // Now tabs bar has the space of the traffic lights
		hide();
}

function getControlsPosition()
{
	const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();

	const MARGIN = 60; // Add some margin to have some area to click and drag the window

	const rightWidth = window.innerWidth - rect.right;

	const controlsOnLeft = rect.left >= rightWidth;
	let controlsWidth = controlsOnLeft ? rect.left : rightWidth;

	// console.log('getControlsPosition:', rect, controls);

	if(controlsWidth > 400)
	{
		console.error(window.innerWidth, rect);
		controlsWidth = 138;
	}

	const app = document.querySelector('.app');

	app.style.setProperty('--controls-width', controlsWidth+'px');
	app.style.setProperty('--controls-width-and-margin', (controlsWidth + MARGIN)+'px');
	app.classList.remove('controls-left', 'controls-right');
	app.classList.add(controlsOnLeft ? 'controls-left' : 'controls-right');

	controls.position = controlsOnLeft ? 'left' : 'right';
	controls.width = controlsWidth;
	controls.widthAndMargin = controlsWidth + MARGIN;
	controls.right = !controlsOnLeft ? controlsWidth + MARGIN : 0;
	controls.left = controlsOnLeft ? controlsWidth : 0;
}

function getControlsPositionEvent()
{
	navigator.windowControlsOverlay.addEventListener('geometrychange', getControlsPosition);
}

function mousedown(event)
{
	if(activeMenu !== false && !event.target.closest('.title-bar-menus, .title-bar-menu, .title-bar-icon'))
		hideMenu(activeMenu);
}

function show()
{
	if(process.platform == 'darwin') // Now tabs bar has the space of the traffic lights
	{
		hide();
		return;
	}

	visible = true;

	let app = document.querySelector('.app');
	app.classList.remove('hide-title-bar');
}

function hide()
{
	visible = false;

	let app = document.querySelector('.app');
	app.classList.add('hide-title-bar');
}

function height()
{
	return 0; // visible ? 30 : 0;
}

var menu = false, activeMenu = false;

function setMenu(_menu)
{
	let cmdOrCtrl = (process.platform == 'darwin' ? '⌘' : 'Ctrl');

	if(process.platform == 'darwin') // Keep native menu in macOS
		_menu = [];

	const assignMenuIndices = function(menu, parentIndices = []) {

		for(let i = 0, len = menu.length; i < len; i++)
		{
			const currentIndices = [...parentIndices, i];
			const item = menu[i];

			item.indices = currentIndices;
			item.indicesString = item.indices.join(', ');
			item.indicesKey = item.indices.join('-');
			item.indicesParentKey = parentIndices.join('-');

			if(item.submenu && item.submenu.length > 0)
				assignMenuIndices(item.submenu, currentIndices);
			
		}

		return menu;

	}

	_menu = assignMenuIndices(_menu);
	menu = [];

	for(let i = 0, len = _menu.length; i < len; i++)
	{
		let m = _menu[i];
		let submenus = [];

		for(let i2 = 0, len2 = m.submenu.length; i2 < len2; i2++)
		{
			let submenu = m.submenu[i2];

			if(submenu.visible || submenu.visible === undefined)
			{
				submenus.push({
					...submenu,
					enabled: submenu.enabled === undefined ? true : submenu.enabled,
					shortcut: submenu.accelerator ? submenu.accelerator.replace(/CmdOrCtrl/iu, cmdOrCtrl).replace(/Plus/iu, '+') : false,
				});
			}
		}

		menu.push({
			...m,
			submenu: submenus,
		});
	}

	handlebarsContext.titleBarMenu = menu;

	const titleBar = document.querySelector('.title-bar');

	if(titleBar)
	{
		titleBar.remove();
		document.querySelector('.tabs-bar > div').insertAdjacentHTML('afterend', template.load('title.bar.html'));
	}
}

function clickIcon()
{
	showMenuBar();
	clickMenu(0);
}

function showMenuBar()
{
	const menu = document.querySelector('.title-bar-menu');
	const app = document.querySelector('.app');
	menu.classList.add('show');
	app.classList.add('show-title-bar-menu');
}

function hideMenuBar()
{
	const menu = document.querySelector('.title-bar-menu');
	const app = document.querySelector('.app');
	menu.classList.remove('show');
	app.classList.remove('show-title-bar-menu');

	hideAllSubMenus();
}

function clickMenu(index)
{
	let _menu = document.querySelector('.title-bar-menu-'+index);
	let _menus = document.querySelector('.title-bar-menus-'+index);

	const offset = controls.position === 'left' ? controls.width : 0;

	if(_menu && _menus)
	{
		if(activeMenu !== index)
		{
			activeMenu = index;

			_menu.classList.add('active');
			_menus.style.display = 'block';
			_menus.style.left = (_menu.offsetLeft + offset)+'px';
		
			dom.query('.bar-header').css({
				webkitAppRegion: 'no-drag',
			});
		}
		else
		{
			hideMenu(activeMenu);
		}
	}
}

function enterMenu(index)
{
	if(activeMenu !== false)
	{
		hideMenu(activeMenu, true);
		clickMenu(index);
	}
}

function hideMenu(index, fromEnter = false)
{
	let _menu = document.querySelector('.title-bar-menu-'+index);
	let _menus = document.querySelector('.title-bar-menus-'+index);

	if(_menu && _menus)
	{
		activeMenu = false;

		_menu.classList.remove('active');
		_menus.style.display = 'none';

		dom.this(_menus).find(true, '.title-bar-menu-submenu').css({
			display: 'none',
		});

		if(!fromEnter)
		{
			dom.query('.bar-header').css({
				webkitAppRegion: '',
			});

			hideMenuBar();
		}
	}
}

let showSubMenuTimeout;

function showSubMenu()
{
	const indices = Array.from(arguments);

	const key = indices.join('-');
	const parentKey = indices.slice(0, -1).join('-');

	clearTimeout(showSubMenuTimeout);

	for(const [key, timeout] of Object.entries(hideSubMenuTimeout))
	{
		clearTimeout(timeout);
		delete hideSubMenuTimeout[key];
	}

	const parentMenu = document.querySelector('.title-bar-menus-' + indices.slice(0, -1).join('-'));
	const submenu = document.querySelector('.title-bar-menus-' + indices.join('-'));

	const menuRect = this.getBoundingClientRect();
	const parentRect = parentMenu ? parentMenu.getBoundingClientRect() : {top: 0, left: 0};

	if(submenu)
	{
		showSubMenuTimeout = setTimeout(() => {

			hideAllSubMenus(key, parentKey);

			const margin = 16;

			const top = menuRect.top - 5;
			const maxHeight = window.innerHeight - top - margin;

			submenu.style.display = 'block';
			submenu.style.top = top+'px';
			submenu.style.left = (parentRect.right - 1)+'px';
			submenu.style.maxHeight = maxHeight+'px';

		}, 300);
	}
}

let hideSubMenuTimeout = {};

function hideSubMenu()
{
	const indices = Array.from(arguments);

	const key = indices.join('-');
	const parentKey = indices.slice(0, -1).join('-');

	if(hideSubMenuTimeout[key])
		return;

	clearTimeout(showSubMenuTimeout);
	clearTimeout(hideSubMenuTimeout[key]);

	hideSubMenuTimeout[key] = setTimeout(() => {

		hideAllSubMenus(key, parentKey);
		delete hideSubMenuTimeout[key];

	}, 500);
}

function inSubMenu()
{
	const indices = Array.from(arguments);
	const key = indices.join('-');

	clearTimeout(hideSubMenuTimeout[key]);
	delete hideSubMenuTimeout[key];
}

function clickSubMenu()
{
	let _menu = menu;

	for(let i = 0; i < arguments.length; i++)
	{
		_menu = _menu.submenu ? _menu.submenu[arguments[i]] : _menu[arguments[i]];
	}

	const submenu = _menu;

	if(submenu.click)
		submenu.click();

	hideMenu(activeMenu);
}

function hideAllSubMenus(key = false, parentKey = false)
{
	let query = key ? `.title-bar-menus-${key}, .title-bar-menus-${key} .title-bar-menu-submenu` : '.title-bar-menu-submenu .title-bar-menu-submenu';

	if(parentKey)
		query += `, .title-bar-menus-parent-${parentKey}, .title-bar-menus-parent-${parentKey} .title-bar-menu-submenu`;

	dom.queryAll(query).css({
		display: 'none',
	});
}

var first = true, colors = {};

function getColors()
{
	const computedStyle = getComputedStyle(document.querySelector('.app'));

	const symbolColor = computedStyle.getPropertyValue('--md-sys-color-on-surface-variant').trim() || '#7F7F7F';
	const backgroundColor = computedStyle.getPropertyValue('--md-sys-color-surface-container').trim() || '#7F7F7F';

	const win = electronRemote.getCurrentWindow();
	win.setBackgroundColor(backgroundColor);

	colors = {
		color: backgroundColor+'00', // Add transparency
		symbolColor: symbolColor,
		height: 40,
	};
}

function setColors()
{
	if(!first || !colors.color)
		getColors();

	const win = electronRemote.getCurrentWindow();

	if(process.platform == 'win32')
	{
		if(first)
			win.setTitleBarOverlay(colors);
		else
			animateSetTitleBarOverlay(win);
	}
	else if(process.platform == 'linux')
	{
		win.setTitleBarOverlay(colors);
	}

	first = false;
}

var animateSetTitleBarOverlayStart = 0;
var animateSetTitleBarOverlayData = 0;

function _animateSetTitleBarOverlay(win)
{
	let elapsed = Date.now() - animateSetTitleBarOverlayData;

	let computedStyle = getComputedStyle(document.querySelector('.title-bar'));
	let symbolColor = computedStyle.getPropertyValue('color');

	win.setTitleBarOverlay({
		color: colors.color,
		symbolColor: elapsed >= 200 ? colors.symbolColor : symbolColor,
		height: 40,
	});

	if(elapsed < 200)
	{
		window.requestAnimationFrame(function(){

			_animateSetTitleBarOverlay(win);

		});
	}
}

function animateSetTitleBarOverlay(win)
{
	animateSetTitleBarOverlayData = Date.now();

	_animateSetTitleBarOverlay(win);
}

function setFullScreen(fullscreen = false)
{
	/*if(fullscreen)
	{
		hide();
	}
	else
	{
		show();
	}*/
}

module.exports = {
	start: start,
	show: show,
	hide: hide,
	height: height,
	clickIcon,
	clickMenu: clickMenu,
	enterMenu: enterMenu,
	showSubMenu: showSubMenu,
	hideSubMenu: hideSubMenu,
	inSubMenu: inSubMenu,
	clickSubMenu: clickSubMenu,
	setMenu: setMenu,
	getColors: getColors,
	setColors: setColors,
	setFullScreen: setFullScreen,
	get controls() {return controls},
	get colors() {return colors},
};