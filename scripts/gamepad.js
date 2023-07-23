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

	console.log(axesStepsEvents);
}

// Use the gamepad to navigate between the items in the content
var currentScreenItems = [];
var currentHighlightItem = -1;

function updateBrowsableItems(force = false)
{
	if(!hasGamepads && !force) return;

	currentScreenItems = [];
	currentHighlightItem = -1;

	// Content right
	let items = template.contentRight('.gamepad-item').get();
	let scrollElement = template.contentRight().children().get(0);
	let scrollTop = scrollElement.scrollTop;

	for(let i = 0, len = items.length; i < len; i++)
	{
		let item = items[i];
		let rect = item.getBoundingClientRect();

		currentScreenItems.push({
			element: item,
			x: rect.left + (rect.width / 2),
			y: rect.top + (rect.height / 2) + scrollTop,
		});
	}

	if(currentScreenItems.length > 0)
		highlightItem(0);
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
	}
	else if(index == -1)
	{
		if(current)
			current.element.classList.remove('gamepad-highlight');

		currentHighlightItem = index;
	}
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

/*$(window).on('keydown', function(e) {

	if(onReading)
	{
		if(e.keyCode == 37)
		{
			goPrevious();
		}
		else if(e.keyCode == 38 && !readingViewIs('scroll'))
		{
			goStart();
		}
		else if(e.keyCode == 39)
		{
			goNext();
		}
		else if(e.keyCode == 40 && !readingViewIs('scroll'))
		{
			goEnd();
		}
	}
	
});*/

module.exports = {
	setButtonEvent: setButtonEvent,
	setAxesEvent: setAxesEvent,
	setAxesStepsEvent: setAxesStepsEvent,
	updateBrowsableItems: updateBrowsableItems,
}