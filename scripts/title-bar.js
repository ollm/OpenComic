var visible = true;

function start()
{
	if(false)
	{


		hide();
	}

	document.querySelector('.title-bar').innerHTML = template.load('title.bar.html');

	app.event(window, 'mousedown touchstart', mousedown);
}

function mousedown(event)
{
	if(activeMenu !== false && !event.target.closest('.title-bar-menus, .title-bar-menu'))
		hideMenu(activeMenu);
}

function show()
{
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
	return visible ? 30 : 0;
}

var menu = false, activeMenu = false;

function setMenu(_menu)
{
	let cmdOrCtrl = (process.platform == 'darwin' ? '⌘' : 'Ctrl');

	for(let i = 0, len = _menu.length; i < len; i++)
	{
		let m = _menu[i];

		for(let i2 = 0, len2 = m.submenu.length; i2 < len2; i2++)
		{
			let submenu = m.submenu[i2];

			submenu.enabled = submenu.enabled === undefined ? true : submenu.enabled;
			submenu.shortcut = submenu.accelerator ? submenu.accelerator.replace(/CmdOrCtrl/iu, cmdOrCtrl).replace(/Plus/iu, '+') : false;
		}
	}

	menu = _menu;
	handlebarsContext.titleBarMenu = menu;

	let titleBar = document.querySelector('.title-bar');
	if(titleBar) titleBar.innerHTML = template.load('title.bar.html');
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
			_menus.style.left = (_menu.getBoundingClientRect().left)+'px';
		
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

	let symbolColor = computedStyle.getPropertyValue('--md-sys-color-on-surface-variant');
	let backgroundColor = computedStyle.getPropertyValue('--md-sys-color-surface-container');

	let win = electronRemote.getCurrentWindow();
	win.setBackgroundColor(backgroundColor);

	colors = {
		//color: backgroundColor,
		symbolColor: symbolColor,
		height: 29,
	};

	if(first)
		win.setTitleBarOverlay(colors);
	else
		animateSetTitleBarOverlay(win);

	first = false;
}

var animateSetTitleBarOverlayStart = 0;

function _animateSetTitleBarOverlay(win)
{
	let elapsed = Date.now() - animateSetTitleBarOverlayData;

	let computedStyle = getComputedStyle(document.querySelector('.title-bar'));

	let symbolColor = computedStyle.getPropertyValue('color');
	//let backgroundColor = computedStyle.getPropertyValue('background-color');

	win.setTitleBarOverlay({
		//color: elapsed >= 200 ? colors.color : backgroundColor,
		symbolColor: elapsed >= 200 ? colors.symbolColor : symbolColor,
		height: 29,
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
	if(fullscreen)
	{
		hide();
	}
	else
	{
		show();
	}
}

module.exports = {
	start: start,
	show: show,
	hide: hide,
	height: height,
	clickMenu: clickMenu,
	enterMenu: enterMenu,
	clickSubMenu: clickSubMenu,
	setMenu: setMenu,
	setColors: setColors,
	setFullScreen: setFullScreen,
};