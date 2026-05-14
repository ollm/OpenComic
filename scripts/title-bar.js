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

	if(process.platform == 'darwin') // Now tabs bar has the space of the traffic lights
		hide();
}

function getControlsPosition()
{
	const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();

	const MARGIN = 60; // Add some margin to have some area to click and drag the window

	const rightWidth = window.innerWidth - rect.right;

	const controlsOnLeft = rect.left >= rightWidth;
	const controlsWidth = controlsOnLeft ? rect.left : rightWidth;

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
}

function clickMenu(index)
{
	let _menu = document.querySelector('.title-bar-menu-'+index);
	let _menus = document.querySelector('.title-bar-menus-'+index);

	if(_menu && _menus)
	{
		if(activeMenu !== index)
		{
			activeMenu = index;

			_menu.classList.add('active');
			_menus.style.display = 'block';
			_menus.style.left = (_menu.offsetLeft)+'px';
		
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

		if(!fromEnter)
		{
			dom.query('.bar-header').css({
				webkitAppRegion: '',
			});

			hideMenuBar();
		}
	}
}

function clickSubMenu(index1, index2)
{
	let submenu = menu[index1].submenu[index2];

	if(submenu.click)
		submenu.click();

	hideMenu(activeMenu);
}

var first = true, colors = {};

function setColors()
{
	let computedStyle = getComputedStyle(document.querySelector('.app'));

	let symbolColor = computedStyle.getPropertyValue('--md-sys-color-on-surface-variant').trim() || '#7F7F7F';
	let backgroundColor = computedStyle.getPropertyValue('--md-sys-color-surface-container').trim() || '#7F7F7F';

	let win = electronRemote.getCurrentWindow();
	win.setBackgroundColor(backgroundColor);

	colors = {
		color: backgroundColor+'00', // Add transparency
		symbolColor: symbolColor,
		height: 40,
	};

	if(process.platform == 'win32')
	{
		if(first)
			win.setTitleBarOverlay(colors);
		else
			animateSetTitleBarOverlay(win);
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
	clickSubMenu: clickSubMenu,
	setMenu: setMenu,
	setColors: setColors,
	setFullScreen: setFullScreen,
	get controls() {return controls},
};