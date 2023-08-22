
function event(selector, eventsNames, listener, options = false)
{
	if(typeof selector == 'string')
		selector = document.querySelectorAll(selector);
	else if(selector === window || selector === document)
		selector = [selector];

	eventsNames = eventsNames.split(' ');

	for(let e = 0; e < eventsNames.length; e++)
	{
		let eventName = eventsNames[e].trim();

		if(!app.empty(eventName))
		{
			for(let i = 0, len = selector.length; i < len; i++)
			{
				selector[i].addEventListener(eventName, listener, options);
			}
		}
	}
}

function eventOff(selector, eventsNames, listener, options = false)
{
	if(typeof selector == 'string')
		selector = document.querySelectorAll(selector);
	else if(selector === window || selector === document)
		selector = [selector];

	eventsNames = eventsNames.split(' ');

	for(let e = 0; e < eventsNames.length; e++)
	{
		let eventName = eventsNames[e].trim();

		if(!app.empty(eventName))
		{
			for(let i = 0, len = selector.length; i < len; i++)
			{
				selector[i].removeEventListener(eventName, listener, options);
			}
		}
	}
}


function empty(mixedVar)
{
	let undef, key, i, len, emptyValues = [undef, null, false, 0, '', '0'];

	for(let i = 0, len = emptyValues.length; i < len; i++)
	{
		if(mixedVar === emptyValues[i])
		{
			return true
		}
	}

	if(typeof mixedVar === 'undefined')
	{
		return true
	}

	if(typeof mixedVar === 'object')
	{
		for(key in mixedVar)
		{
			if (mixedVar.hasOwnProperty(key))
			{
				return false
			}
		}

		return true
	}

	return false
}

module.exports = {
	event: event,
	eventOff: eventOff,
	empty: empty,
};