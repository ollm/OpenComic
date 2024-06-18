setInterval(pollGamepads, 500);

var hasGamepads = false;
var gamepadAF = false;
var firstGamepadEvent = true;

function pollGamepads()
{
	let gamepads = navigator.getGamepads();
	let _hasGamepads = false;

	for(let i = 0, len = gamepads.length; i < len; i++)
	{
		if(gamepads[i])
		{
			_hasGamepads = true;

			break;
		}
	}

	if(_hasGamepads && !config.disableGamepadInput)
	{
		if(!hasGamepads)
		{
			console.log('Gamepads have been connected');

			gamepadAF = requestAnimationFrame(gamepadLoop);

			updateBrowsableItems(currentKey, true);

			firstGamepadEvent = true;
		}

		hasGamepads = true;
	}
	else
	{
		if(hasGamepads)
		{
			console.log('Gamepads have been disconnected');

			highlightItem(-1);

			cancelAnimationFrame(gamepadAF);
		}

		hasGamepads = false;
	}

}

var buttonEvents = {};
var buttonStatus = {};

var axesEvents = {};

var axesStepsEvents = {};
var axesStepsStatus = {};

var prevHasAxes = false;

function gamepadLoop()
{
	let gamepads = navigator.getGamepads();
	let now = Date.now();

	let buttons = [];
	let axes = false;

	// Merge all connected gamepad into one
	for(let i = 0, len = gamepads.length; i < len; i++)
	{
		if(gamepads[i])
		{
			let controller = gamepads[i];

			for(let i = 0, len = controller.buttons.length; i < len; i++)
			{
				let button = controller.buttons[i];

				if(button.value == 1 || !buttons[i])
					buttons[i] = button;
			}

			// Avoid controller dead zone
			let deadZone = config.controllerDeadZone || 0.06;

			let aAbs0 = Math.abs(controller.axes[0]), aAbs1 = Math.abs(controller.axes[1]), aAbs2 = Math.abs(controller.axes[2]), aAbs3 = Math.abs(controller.axes[3]);

			// Prioritize first controller
			if(!axes && (aAbs0 > deadZone || aAbs1 > deadZone || aAbs2 > deadZone || aAbs3 > deadZone))
			{
				axes = [
					(aAbs0 > deadZone ? controller.axes[0] : 0),
					(aAbs1 > deadZone ? controller.axes[1] : 0),
					(aAbs2 > deadZone ? controller.axes[2] : 0),
					(aAbs3 > deadZone ? controller.axes[3] : 0),
				];
			}
		}
	}

	// Buttons events
	for(let i = 0, len = buttons.length; i < len; i++)
	{
		let button = buttons[i];
		let pressed = (button.value > 0.5 ? true : false);

		if(pressed)
		{
			let status = buttonStatus[i] || {pressed: true, lastEvent: 0, eventNum: 0};
			status.pressed = true;

			let sendEvent = (!status.lastEvent) ? true : false;

			let speed = 200 - (status.eventNum * 5);
			if(speed < 20) speed = 20;

			if(status.eventNum == 1 && now - status.lastEvent > 800)
				sendEvent = true;
			else if(status.eventNum > 1 && now - status.lastEvent > speed)
				sendEvent = true;

			if(sendEvent && !firstGamepadEvent)
			{
				status.eventNum++;
				status.lastEvent = now;

				for(let key in buttonEvents[i])
				{
					buttonEvents[i][key](i, button);
				}
			}

			buttonStatus[i] = status;
		}
		else
		{
			if(!buttonStatus[i] || buttonStatus[i].pressed)
				buttonStatus[i] = {pressed: false, lastEvent: 0, eventNum: 0};
		}
	}

	// Axes events
	if(axes)
	{
		for(let key in axesEvents)
		{
			axesEvents[key](axes, (!prevHasAxes ? 'start' : 'move'), now);
		}

		prevHasAxes = true;

		// Axes in steps
		let x = 0;
		let y = 0;

		if(axes[0] || axes[1])
		{
			x = Math.abs(axes[0]) > Math.abs(axes[1]) ? axes[0] : 0;
			y = Math.abs(axes[1]) >= Math.abs(axes[0]) ? axes[1] : 0;
		}
		else
		{
			x = Math.abs(axes[2]) > Math.abs(axes[3]) ? axes[2] : 0;
			y = Math.abs(axes[3]) >= Math.abs(axes[2]) ? axes[3] : 0;
		}

		let i = x !== 0 ? (x < 0 ? 0 : 1) : (y < 0 ? 2 : 3);
		let c = x !== 0 ? x : y;

		if(c !== 0 && Math.abs(c) > 0.5)
		{
			let status = axesStepsStatus[i] || {pressed: true, lastEvent: 0, eventNum: 0};
			status.pressed = true;

			let sendEvent = (!status.lastEvent) ? true : false;

			let speed = 800 - (Math.abs(c) * 700);

			if(status.eventNum == 1 && now - status.lastEvent > 800)
				sendEvent = true;
			else if(status.eventNum > 1 && now - status.lastEvent > speed)
				sendEvent = true;

			if(sendEvent && !firstGamepadEvent)
			{
				status.eventNum++;
				status.lastEvent = now;

				for(let _key in axesStepsEvents[i])
				{
					axesStepsEvents[i][_key](i, axes);
				}
			}

			axesStepsStatus[i] = status;
		}
		else
		{
			if(!axesStepsStatus[i] || axesStepsStatus[i].pressed)
				axesStepsStatus[i] = {pressed: false, lastEvent: 0, eventNum: 0};
		}
	}
	else if(prevHasAxes)
	{
		for(let key in axesEvents)
		{
			axesEvents[key](axes, 'end', now);
		}

		prevHasAxes = false;

		axesStepsStatus = {};
	}

	gamepadAF = requestAnimationFrame(gamepadLoop);

	firstGamepadEvent = false;
}

function reset(key = false)
{
	if(key === false)
	{
		buttonEvents = {};
	}
	else
	{
		for(let button in buttonEvents)
		{
			if(buttonEvents[button] && buttonEvents[button][key]) delete buttonEvents[button][key];
		}
	}
}

function setButtonEvent(key, buttons, callback)
{
	if(typeof buttons == 'number')
		buttons = [buttons];

	for(let i = 0, len = buttons.length; i < len; i++)
	{
		let button = buttons[i];

		if(!buttonEvents[button]) buttonEvents[button] = {};
		buttonEvents[button][key] = callback;
	}
}

function setAxesEvent(key, callback)
{
	axesEvents[key] = callback;
}


function setAxesStepsEvent(key, buttons, callback)
{
	if(typeof buttons == 'number')
		buttons = [buttons];

	for(let i = 0, len = buttons.length; i < len; i++)
	{
		let button = buttons[i];

		if(!axesStepsEvents[button]) axesStepsEvents[button] = {};
		axesStepsEvents[button][key] = callback;
	}
}

// Use the gamepad to navigate between the items in the content
var currentKey = false;
var prevKey = false;
var currentScreenItems = [];
var currentHighlightItem = -1;
var currentScrollElement = false;
var currentScrollElementRect = false;
var highlightItemHistory = {};
var lastUpdateBrowsableItemsSkiped = false;
var hasKeyboardNavigation = false;
var fromGoBack = false;

function updateBrowsableItems(key = false, force = false, _highlightItem = true, ignore = {})
{
	if(key != currentKey) prevKey = currentKey;
	currentKey = key;

	if(!hasGamepads && !hasKeyboardNavigation && !force)
	{
		lastUpdateBrowsableItemsSkiped = true;

		return;
	}

	hasKeyboardNavigation = false;
	lastUpdateBrowsableItemsSkiped = false;

	currentScreenItems = [];
	currentHighlightItem = -1;

	let toHighlight = false, index = 0;

	let has = false;

	// Search
	let search = template._globalElement().querySelector('.search-bar.active');
	let hasSearch = search && !ignore.search ? true : false;

	if(hasSearch)
	{
		let items = search.querySelectorAll('.gamepad-item');
		let scrollElement = currentScrollElement = search.querySelector('.search-bar-results');
		let scrollTop = scrollElement.scrollTop;
		currentScrollElementRect = scrollElement.getBoundingClientRect();

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];
			let rect = item.getBoundingClientRect();

			if((toHighlight === false && item.classList.contains('gamepad-to-highlight')) || item.classList.contains('gamepad-highlight'))
				toHighlight = index;

			if(rect.height != 0 || rect.width != 0)
			{
				currentScreenItems.push({
					inScroll: true,
					block: 'top',
					element: item,
					x: rect.left,
					y: rect.top + scrollTop,
					centerY: rect.top + (rect.height / 2) + scrollTop,
					onLeft: item.dataset.gamepadLeft,
					onRight: item.dataset.gamepadRight,
					left: rect.left,
					right: rect.right,
					top: rect.top + scrollTop,
					bottom: rect.bottom + scrollTop,
				});

				index++;
			}
		}
	}

	has = hasSearch || has;

	// Dialog
	let dialog = template._globalElement().querySelector('.dialogs .dialog:not(.hide)');
	let hasDialog = dialog && !ignore.dialog ? true : false;

	if(hasDialog && !has)
	{
		let items = dialog.querySelectorAll('.gamepad-item');
		let scrollElement = currentScrollElement = dialog.querySelector('.dialog-content');
		let scrollTop = scrollElement.scrollTop;
		currentScrollElementRect = scrollElement.getBoundingClientRect();

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];
			let rect = item.getBoundingClientRect();

			if((toHighlight === false && item.classList.contains('gamepad-to-highlight')) || item.classList.contains('gamepad-highlight'))
				toHighlight = index;

			if(rect.height != 0 || rect.width != 0)
			{
				currentScreenItems.push({
					inScroll: true,
					block: 'top',
					element: item,
					x: rect.left,
					y: rect.top + scrollTop,
					centerY: rect.top + (rect.height / 2) + scrollTop,
					onLeft: item.dataset.gamepadLeft,
					onRight: item.dataset.gamepadRight,
					left: rect.left,
					right: rect.right,
					top: rect.top + scrollTop,
					bottom: rect.bottom + scrollTop,
				});

				index++;
			}
		}
	}

	has = hasDialog || has;

	// Menu
	let menu = template._globalElement().querySelector('.menu-simple.a');
	let hasMenu = menu && !ignore.menu ? true : false;

	if(hasMenu && !has)
	{
		let items = menu.querySelectorAll('.gamepad-item');
		let scrollElement = currentScrollElement = menu.querySelector('.menu-simple-content');
		let scrollTop = scrollElement.scrollTop;
		currentScrollElementRect = scrollElement.getBoundingClientRect();

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];
			let rect = item.getBoundingClientRect();

			if((toHighlight === false && item.classList.contains('gamepad-to-highlight')) || item.classList.contains('gamepad-highlight'))
				toHighlight = index;

			if(rect.height != 0 || rect.width != 0)
			{
				currentScreenItems.push({
					inScroll: true,
					block: 'top',
					element: item,
					x: rect.left,
					y: rect.top + scrollTop,
					centerY: rect.top + (rect.height / 2) + scrollTop,
					onLeft: item.dataset.gamepadLeft,
					onRight: item.dataset.gamepadRight,
					left: rect.left,
					right: rect.right,
					top: rect.top + scrollTop,
					bottom: rect.bottom + scrollTop,
				});

				index++;
			}
		}
	}

	has = hasMenu || has;

	// Content right
	if(!has && !ignore.right)
	{
		let items = template._contentRight().querySelectorAll('.gamepad-item');
		let scrollElement = currentScrollElement = template.contentRight().children().get(0);
		let scrollTop = scrollElement.scrollTop;
		currentScrollElementRect = scrollElement.getBoundingClientRect();

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];
			let rect = item.getBoundingClientRect();

			if((toHighlight === false && item.classList.contains('gamepad-to-highlight')) || item.classList.contains('gamepad-highlight'))
				toHighlight = index;

			if(rect.height != 0 || rect.width != 0)
			{
				currentScreenItems.push({
					inScroll: true,
					block: 'right',
					element: item,
					x: rect.left,
					y: rect.top + scrollTop,
					centerY: rect.top + (rect.height / 2) + scrollTop,
					onLeft: item.dataset.gamepadLeft,
					onRight: item.dataset.gamepadRight,
					left: rect.left,
					right: rect.right,
					top: rect.top + scrollTop,
					bottom: rect.bottom + scrollTop,
				});

				index++;
			}
		}
	}

	// Content left
	if(!has && !ignore.left)
	{
		let items = template._contentLeft().querySelectorAll('.gamepad-item');

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];
			let rect = item.getBoundingClientRect();

			if(item.classList.contains('gamepad-highlight'))
				item.classList.remove('gamepad-highlight');

			if(rect.height != 0 || rect.width != 0)
			{
				currentScreenItems.push({
					inScroll: false,
					block: 'left',
					element: item,
					rect: rect,
					x: rect.left,
					y: rect.top,
					centerX: rect.left + (rect.width / 2),
					centerY: rect.top + (rect.height / 2),
					left: rect.left,
					right: rect.right,
					top: rect.top,
					bottom: rect.bottom,
				});

				index++;
			}
		}
	}

	if(fromGoBack && highlightItemHistory[key] !== undefined)
		toHighlight = highlightItemHistory[key];

	if(currentScreenItems.length > 0 && _highlightItem)
		highlightItem(toHighlight ? toHighlight : 0);

	fromGoBack = false;
}

function updateBrowsableItemsPrevKey()
{
	if(prevKey) updateBrowsableItems(prevKey);
}

function cleanBrowsableItems()
{
	currentScreenItems = [];
}

function highlightItem(index)
{
	let item = currentScreenItems[index] || false;
	let current = currentScreenItems[currentHighlightItem] || false;

	if(item)
	{
		if(current)
			current.element.classList.remove('gamepad-highlight');

		item.element.classList.add('gamepad-highlight');

		currentHighlightItem = index;

		if(item.inScroll)
			scrollToItem(item);
	}
	else if(index == -1)
	{
		if(current)
			current.element.classList.remove('gamepad-highlight');

		currentHighlightItem = index;
	}

	highlightItemHistory[currentKey] = currentHighlightItem;
}

var prevScrollTop = false;

function scrollToItem(item)
{
	let top = item.centerY - currentScrollElementRect.top;
	let scrollTop = Math.round(top - (currentScrollElementRect.height / 2));

	if(scrollTop < 0)
		scrollTop = 0;

	if(scrollTop !== prevScrollTop)
		$(currentScrollElement).stop(true).animate({scrollTop: scrollTop+'px'}, 300, $.bez([0.22, 0.6, 0.3, 1]));

	prevScrollTop = scrollTop;
}

function highlightClosestItem(key)
{
	// left: 0, right: 1, top: 2, bottom: 3

	if(currentScreenItems.length > 0)
	{
		let current = currentScreenItems[currentHighlightItem] || false;

		if(current)
		{
			if((current.onLeft && key == 0) || (current.onRight && key == 1))
			{
				if(key == 0)
					new Function(current.onLeft).call(current.element);
				else
					new Function(current.onRight).call(current.element);
			}
			else
			{
				let closest = false;

				for(let i = 0, len = currentScreenItems.length; i < len; i++)
				{
					let item = currentScreenItems[i];

					let x, y;

					if(key == 0)
						x = current.left - item.right;
					else if(key == 1)
						x = current.right - item.left;
					else
						x = current.x - item.x;

					if(key == 2)
						y = current.top - item.bottom;
					else if(key == 3)
						y = current.bottom - item.top;
					else
						y = current.y - item.y;

					let d = Math.sqrt(x ** 2 + y ** 2); // Distance
					
					item.d = d;
					item.i = i;

					if(key == 0) // Left
					{
						if(item.right <= current.left && (item.block == current.block || item.block == 'left'))
						{
							if((!closest || (closest.d > d)) && !item.element.classList.contains('disable-pointer'))
								closest = item;
						}
					}
					else if(key == 1) // Right
					{
						if(item.left >= current.right && (item.block == current.block || item.block == 'right'))
						{
							if((!closest || (closest.d > d)) && !item.element.classList.contains('disable-pointer'))
								closest = item;
						}
					}
					else if(key == 2) // Top
					{
						if(item.bottom <= current.top && (item.block == current.block || item.block == 'top'))
						{
							if((!closest || (closest.d > d)) && !item.element.classList.contains('disable-pointer'))
								closest = item;
						}
					}
					else if(key == 3) // Bottom
					{
						if(item.top >= current.bottom && (item.block == current.block || item.block == 'bottom'))
						{
							if((!closest || (closest.d > d)) && !item.element.classList.contains('disable-pointer'))
								closest = item;
						}
					}
				}

				if(closest)
					highlightItem(closest.i);
			}
		}
		else
		{
			highlightItem(0);
		}
	}
}

function goHighlightItem()
{
	let current = currentScreenItems[currentHighlightItem] || false;

	if(current)
	{
		if(current.element.getAttribute('onclick'))
		{
			new Function(current.element.getAttribute('onclick')).call(current.element);
		}
		else
		{
			let _switch = current.element.querySelector('.switch');
			let _checkbox = current.element.querySelector('.checkbox');
			let _select = current.element.querySelector('.select');

			if(_switch)
				$(_switch).trigger('click');
			else if(_checkbox)
				$(_checkbox).trigger('click');
			else if(_select)
				$(_select).trigger('click');
			else
				$(current.element).trigger('click');
		}
	}
}

function highlightItemContextMenu()
{
	let current = currentScreenItems[currentHighlightItem] || false;

	if(current && current.element.getAttribute('oncontextmenu'))
		new Function('let fromGamepad = true;'+current.element.getAttribute('oncontextmenu')).call(current.element);
}

function showMenu()
{
	let query = !onReading ? '#index-menu-gamepad' : '#reading-menu-gamepad';

	if(document.querySelector(query+' .menu-simple.a'))
		events.desactiveMenu(query);
	else
		events.activeMenu(query, false, 'gamepad');

	dom.query('.gamepad-reading-music').css({display: !handlebarsContext.hasMusic ? 'none' : ''});

	if(!onReading)
	{
		let viewIcon = document.querySelector('.menu-gamepad-view-icon');
		if(!viewIcon) return;

		let icon = '';

		if(handlebarsContext.comicsIndex)
			icon = (config.viewIndex == 'module') ? 'view_module' : 'view_list';
		else
			icon = (config.view == 'module') ? 'view_module' : 'view_list';

		viewIcon.innerHTML = icon;
	}
}

var buttonNames = {
	0: 'A',
	1: 'B',
	2: 'X',
	3: 'Y',
	4: 'LB',
	5: 'RB',
	6: 'LT',
	7: 'RT',
	8: 'View',
	9: 'Menu',
	10: 'L',
	11: 'R',
	12: 'Up',
	13: 'Down',
	14: 'Left',
	15: 'Right',
	16: 'Xbox',
};

function buttonName(button = false)
{
	if(button !== false && button !== undefined)
		return buttonNames[button];

	return '';
}

var buttonKeys = {
	'A': 0,
	'B': 1,
	'X': 2,
	'Y': 3,
	'LB': 4,
	'RB': 5,
	'LT': 6,
	'RT': 7,
	'View': 8,
	'Menu': 9,
	'L': 10,
	'R': 11,
	'Up': 12,
	'Down': 13,
	'Left': 14,
	'Right': 15,
	'Xbox': 16,
};

function buttonKey(button = false)
{
	if(button !== false && button !== undefined)
		return buttonKeys[button];

	return -1;
}

function goBack(fromKeyboard = false)
{
	if(fromKeyboard)
		hasKeyboardNavigation = true;

	// Close dialog
	let dialogActive = document.querySelector('.dialogs .dialog');

	if(dialogActive)
	{
		events.closeDialog();

		return;
	}

	// Close menu
	let menuActive = document.querySelector('.menu-close.a');

	if(menuActive)
	{
		eval(menuActive.getAttribute('onclick'));

		return;
	}

	// Go back
	let barBack = document.querySelector('.bar-back.active, .bar-back.show');

	if(barBack)
	{
		fromGoBack = true;
		eval(barBack.getAttribute('onclick'));
	}
}

setButtonEvent('browsableItems', [0, 2, 3, 9, 12, 13, 14, 15, 16], function(key) {

	if(key == 0)
		goHighlightItem();
	else if(key == 2)
		highlightItemContextMenu();
	else if(key == 3)
		highlightItemContextMenu();
	else if(key == 12)
		highlightClosestItem(2);
	else if(key == 13)
		highlightClosestItem(3);
	else if(key == 14)
		highlightClosestItem(0);
	else if(key == 15)
		highlightClosestItem(1);
	else if(!onReading && (key == 9 || key == 16))
		showMenu();

});

setAxesStepsEvent('browsableItems', [0, 1, 2, 3], function(key, axes) {

	highlightClosestItem(key);

});

setButtonEvent('fullscreen', 11, function(key) {

	if(!onReading)
	{
		fullScreen();
	}

});

// Support also navigation by keyboard
window.addEventListener('keydown', function(event) {

	let key = event.keyCode;

	if((!onReading || document.querySelector('.menu-simple.a')) || key == 8)
	{
		let inputIsFocused = shortcuts.inputIsFocused();

		if(!inputIsFocused || inputIsFocused.classList.contains('search-input'))
		{
			if(((key == 8 || key == 37 || key == 39) && !inputIsFocused) || key == 13 || key == 38 || key == 40)
			{
				event.preventDefault();

				hasKeyboardNavigation = true;

				if(key == 8)
					goBack();
				else if(key == 13)
					goHighlightItem();
				else if(key == 37)
					highlightClosestItem(0);
				else if(key == 38)
					highlightClosestItem(2);
				else if(key == 39)
					highlightClosestItem(1);
				else if(key == 40)
					highlightClosestItem(3);

				if(lastUpdateBrowsableItemsSkiped)
					updateBrowsableItems(currentKey, true);
			}
			else
			{
				// console.log(key);
			}
		}
	}
	
});

// Update Browsable Items position if window size its changed
var gamepadResizeST = false;

window.addEventListener('resize', function(){

	gamepadResizeST = setTimeout(function(){

		updateBrowsableItems(currentKey);

	}, 500);

});

module.exports = {
	reset: reset,
	setButtonEvent: setButtonEvent,
	setAxesEvent: setAxesEvent,
	setAxesStepsEvent: setAxesStepsEvent,
	updateBrowsableItems: updateBrowsableItems,
	updateBrowsableItemsPrevKey: updateBrowsableItemsPrevKey,
	cleanBrowsableItems: cleanBrowsableItems,
	goBack: goBack,
	buttonName: buttonName,
	buttonKey: buttonKey,
	buttonEvents: function(){return buttonEvents},
	currentKey: function(){return currentKey},
	currentScreenItems: function(){return currentScreenItems},
	highlightItem: highlightItem,
	currentHighlightItem: function(){return currentHighlightItem},
	showMenu: showMenu,
}