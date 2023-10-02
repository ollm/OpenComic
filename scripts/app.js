
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

function extname(path)
{
	return p.extname(path).replace(/^.*\./, '').toLowerCase();
}

function round(number, precision = 0) {

	multipler = Math.pow(10, precision);

	return Math.round(number * multipler) / multipler;

}

function roundDPR(number) {

	return Math.round(number * window.devicePixelRatio) / window.devicePixelRatio;

}

function floorDPR(number) {

	return Math.floor(number * window.devicePixelRatio) / window.devicePixelRatio;

}

function invertedDPR(number) {

	return 1 / window.devicePixelRatio;

}

function pageY(e) {

	return e.touches ? e.touches[0].pageY : e.pageY;

}

function pageX(e) {

	return e.touches ? e.touches[0].pageX : e.pageX;

}

function clientY(e) {

	if(e.touches && e.touches[0].clientY !== undefined)
		return e.touches[0].clientY;
	else if(e.clientY !== undefined)
		return e.clientY;

	return pageY(e);

}

function clientX(e) {

	if(e.touches && e.touches[0].clientX !== undefined)
		return e.touches[0].clientX;
	else if(e.clientX !== undefined)
		return e.clientX;

	return pageX(e);

}

function rand(min = 0, max = 10000000)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms)
{
	return new Promise(function(resolve){
		setTimeout(resolve, ms)
	});
}

module.exports = {
	event: event,
	eventOff: eventOff,
	empty: empty,
	extname: extname,
	round: round,
	roundDPR: roundDPR,
	floorDPR: floorDPR,
	invertedDPR: invertedDPR,
	pageY: pageY,
	pageX: pageX,
	clientY: clientY,
	clientX: clientX,
	rand: rand,
	sleep: sleep,
};