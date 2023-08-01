setInterval(pollGamepads, 500);

var hasGamepads = false;
var gamepadAF = false;

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

	if(_hasGamepads)
	{
		if(!hasGamepads)
		{
			console.log('Gamepads have been connected');

			gamepadAF = requestAnimationFrame(gamepadLoop);

			updateBrowsableItems(true);
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
			if(speed < 100) speed = 100;

			if(status.eventNum == 1 && now - status.lastEvent > 800)
				sendEvent = true;
			else if(status.eventNum > 1 && now - status.lastEvent > speed)
				sendEvent = true;

			if(sendEvent)
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

		if(c !== 0)
		{
			let status = axesStepsStatus[i] || {pressed: true, lastEvent: 0, eventNum: 0};
			status.pressed = true;

			let sendEvent = (!status.lastEvent) ? true : false;

			let speed = 800 - (Math.abs(c) * 700);

			if(status.eventNum == 1 && now - status.lastEvent > 800)
				sendEvent = true;
			else if(status.eventNum > 1 && now - status.lastEvent > speed)
				sendEvent = true;

			if(sendEvent)
			{
				console.log('sendEvent');

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
var currentScreenItems = [];
var currentHighlightItem = -1;
var currentScrollElement = false;
var currentScrollElementRect = false;
var highlightItemHistory = {};
var lastUpdateBrowsableItemsSkiped = false;
var hasKeyboardNavigation = false;
var fromGoBack = false;

function updateBrowsableItems(key = false, force = false)
{
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

	// Content right
	let items = template.contentRight('.gamepad-item').get();
	let scrollElement = currentScrollElement = template.contentRight().children().get(0);
	let scrollTop = scrollElement.scrollTop;
	currentScrollElementRect = scrollElement.getBoundingClientRect();

	let toHighlight = false;

	for(let i = 0, len = items.length; i < len; i++)
	{
		let item = items[i];
		let rect = item.getBoundingClientRect();

		if((toHighlight === false && item.classList.contains('gamepad-to-highlight')) || item.classList.contains('gamepad-highlight'))
			toHighlight = i;

		currentScreenItems.push({
			element: item,
			x: rect.left,
			y: rect.top + scrollTop,
			centerX: rect.left + (rect.width / 2),
			centerY: rect.top + (rect.height / 2) + scrollTop,
		});
	}

	if(fromGoBack && highlightItemHistory[key] !== undefined)
		toHighlight = highlightItemHistory[key];

	if(currentScreenItems.length > 0)
		highlightItem(toHighlight ? toHighlight : 0);

	fromGoBack = false;
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
			let closest = false;

			for(let i = 0, len = currentScreenItems.length; i < len; i++)
			{
				let item = currentScreenItems[i];
				let d = Math.sqrt((current.x - item.x) ** 2 + (current.y - item.y) ** 2); // Distance

				item.i = i;
				item.d = d;

				if(key == 0) // Left
				{
					if(item.x < current.x)
					{
						if(!closest || (closest.d > d))
							closest = item;
					}
				}
				else if(key == 1) // Right
				{
					if(item.x > current.x)
					{
						if(!closest || (closest.d > d))
							closest = item;
					}
				}
				else if(key == 2) // Top
				{
					if(item.y < current.y)
					{
						if(!closest || (closest.d > d))
							closest = item;
					}
				}
				else if(key == 3) // Bottom
				{
					if(item.y > current.y)
					{
						if(!closest || (closest.d > d))
							closest = item;
					}
				}
			}

			if(closest)
				highlightItem(closest.i);
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
		eval(current.element.getAttribute('onclick'));
}

function goBack()
{
	let barBack = document.querySelector('.bar-back.active, .bar-back.show');

	if(barBack)
	{
		fromGoBack = true;
		eval(barBack.getAttribute('onclick'));
	}
}

setButtonEvent('browsableItems', [0, 12, 13, 14, 15], function(key) {

	if(key == 0)
		goHighlightItem();
	else if(key == 12)
		highlightClosestItem(2);
	else if(key == 13)
		highlightClosestItem(3);
	else if(key == 14)
		highlightClosestItem(0);
	else if(key == 15)
		highlightClosestItem(1);

});

setAxesStepsEvent('browsableItems', [0, 1, 2, 3], function(key, axes) {

	highlightClosestItem(key);

});

setButtonEvent('fullscreen', 11, function(key) {

	let win = electronRemote.getCurrentWindow();
	let isFullScreen = win.isFullScreen();

	reading.hideContent(!isFullScreen);
	win.setMenuBarVisibility(isFullScreen);
	win.setFullScreen(!isFullScreen);

});

// Support also navigation by keyboard
window.addEventListener('keydown', function(event) {

	let key = event.keyCode;

	if(!onReading || key == 8)
	{
		if(key == 8 || key == 13 || key == 37 || key == 38 || key == 39 || key == 40)
		{
			event.preventDefault();

			hasKeyboardNavigation = true;

			if(lastUpdateBrowsableItemsSkiped)
				updateBrowsableItems(currentKey, true);

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
		}
		else
		{
			console.log(key);
		}
	}
	
});

// Update Browsable Items position if window size its changed
var gamepadResizeST = false;

window.addEventListener('resize', function() {

	gamepadResizeST = setTimeout(function(){

		updateBrowsableItems(currentKey);

	}, 500);

});

module.exports = {
	setButtonEvent: setButtonEvent,
	setAxesEvent: setAxesEvent,
	setAxesStepsEvent: setAxesStepsEvent,
	updateBrowsableItems: updateBrowsableItems,
	goBack: goBack,
}