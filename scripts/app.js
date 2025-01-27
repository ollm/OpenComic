
function event(selector, eventsNames, listener, options = false)
{
	if(typeof selector == 'string')
		selector = document.querySelectorAll(selector);
	else if(selector === window || selector === document || (!selector.length && selector.length !== 0))
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
	else if(selector === window || selector === document || (!selector.length && selector.length !== 0))
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

function roundDPR(number, base = 0) {

	return Math.round(base + number * window.devicePixelRatio) / window.devicePixelRatio - base;

}

function floorDPR(number, base = 0) {

	return Math.floor(base + number * window.devicePixelRatio) / window.devicePixelRatio - base;

}

function ceilDPR(number, base = 0) {

	return Math.ceil(base + number * window.devicePixelRatio) / window.devicePixelRatio - base;

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

function touchesXY(e)
{
	let touches = [];

	for(let i = 0, len = e.touches.length; i < len; i++)
	{
		touches.push(e.touches[i].pageX);
		touches.push(e.touches[i].pageY);
	}

	return touches;
}

function touchesDiff(touches0, touches1)
{
	let touches = [];

	for(let i = 0, len = touches0.length; i < len; i++)
	{
		if(touches1[i] !== undefined)
			touches.push(Math.abs(touches0[i] - touches1[i]));
	}

	return touches;
}

function distance(x1, y1, x2, y2)
{
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function rand(min = 0, max = 10000000)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extract(code, string, value = 1)
{
	string = string.match(code);
	return (string !== null && typeof string[value] != 'undefined') ? string[value] : '';
}

function capitalize(s)
{
    return s && s[0].toUpperCase() + s.slice(1);
}

function stripTagsWithDOM(string)
{
    let doc = new DOMParser().parseFromString(string, 'text/html');
    return doc.body.textContent || '';
}

function validateUrl(value, protocols = 'https?|ftp')
{
	return new RegExp('^(?:(?:(?:'+protocols+'):)?\\/\\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:[/?#]\\S*)?$', 'i').test(value);
}

function copy(toCopy)
{
	if(typeof toCopy !== 'object' || toCopy === null)
	{
		return toCopy;
	}
	else if(Array.isArray(toCopy))
	{
		let len = toCopy.length;
		let result = new Array(len);

		for(let i = 0; i < len; i++)
		{
			let _toCopy = toCopy[i];
			result[i] = typeof _toCopy !== 'object' || _toCopy === null ? _toCopy : copy(_toCopy);
		}

		return result;
	}
	else
	{
		let result = {};

		for(let i in toCopy)
		{
			let _toCopy = toCopy[i];
			result[i] = typeof _toCopy !== 'object' || _toCopy === null ? _toCopy : copy(_toCopy);
		}

		return result;
	}
}

function _shortWindowsPath(path, fileToBlob = false)
{
	if(process.platform !== 'win32') return path;

	path = shortWindowsPath.generateSync(path);

	if(path.length >= 260)
	{
		if(fileToBlob)
			path = fileManager.fileToBlob(path);
		else if(!/^\\\\\?/.test(path))
			path = '\\\\?\\'+path;
	}

	return path;
}

function _encodeSrcURI(path)
{
	return /^blob/.test(path) ? path : encodeSrcURI(path);
}

var throttles = {};
var debounces = {};

async function setThrottle(key, callback, debounce = 300, throttle = 3000)
{
	clearTimeout(debounces[key]);

	debounces[key] = setTimeout(function(){

		clearTimeout(throttles[key]);
		throttles[key] = false;

		callback(true);

	}, debounce);

	if(throttles[key] === undefined || throttles[key] === false)
	{
		throttles[key] = setTimeout(function(){

			clearTimeout(debounces[key]);
			throttles[key] = false;

			callback();

		}, throttle);
	}
}


function time()
{
	return Math.floor(Date.now() / 1000);
}

function sleep(ms)
{
	return new Promise(function(resolve){
		setTimeout(resolve, ms)
	});
}

function setImmediate()
{
	return new Promise(function(resolve){
		window.setImmediate(resolve);
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
	ceilDPR: ceilDPR,
	invertedDPR: invertedDPR,
	pageY: pageY,
	pageX: pageX,
	clientY: clientY,
	clientX: clientX,
	touchesXY: touchesXY,
	touchesDiff: touchesDiff,
	distance: distance,
	rand: rand,
	extract: extract,
	capitalize: capitalize,
	stripTagsWithDOM: stripTagsWithDOM,
	validateUrl: validateUrl,
	copy: copy,
	time: time,
	sleep: sleep,
	setImmediate: setImmediate,
	setThrottle: setThrottle,
	shortWindowsPath: _shortWindowsPath,
	encodeSrcURI: _encodeSrcURI,
};