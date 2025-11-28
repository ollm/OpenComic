
function event(selector, eventsNames, listener, options = {passive: false})
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

function eventOff(selector, eventsNames, listener, options = {passive: false})
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
	return p.extname(path).substr(1).toLowerCase();
}

function extnameC(path)
{
	return extract(/\.((?:tar\.)?[a-z0-9\-]+)$/i, path).toLowerCase();
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
		return toCopy;
	
	if(Array.isArray(toCopy))
	{
		const len = toCopy.length;
		const result = new Array(len);

		for(let i = 0; i < len; i++)
		{
			const _toCopy = toCopy[i];
			result[i] = typeof _toCopy !== 'object' || _toCopy === null ? _toCopy : copy(_toCopy);
		}

		return result;
	}

	const result = {};

	for(let i in toCopy)
	{
		const _toCopy = toCopy[i];
		result[i] = typeof _toCopy !== 'object' || _toCopy === null ? _toCopy : copy(_toCopy);
	}

	return result;
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

var transitionPrev = {};

// This need to be improved to smooth transitions
function transition(key, transition = 0) 
{
	if(!transition)
	{
		return {
			speed: 0,
			function: 'linear',
		};
	}
	
	const seconds = transition < 50 ? true : false;

	transition = seconds ? transition * 1000 : transition;
	let _function = 'ease';

	const now = performance.now();
	const prev = transitionPrev[key] || 0;
	transitionPrev[key] = now;

	if(prev && now - prev < transition)
	{
		transition = now - prev;
		_function = 'linear';
	}

	return {
		speed: seconds ? transition / 1000 : transition,
		function: _function,
	};
}

function scrollTransition(key, transition = 0)
{
	if(!transition)
	{
		return {
			speed: 0,
			function: 'linear',
		};
	}

	const seconds = transition < 50 ? true : false;
	transition = transition ? 200 : 0;

	let _function = 'cubic-bezier(0.42, 0, 0.58, 1)';

	const now = performance.now();
	const prev = transitionPrev[key] || 0;
	transitionPrev[key] = now;

	if(prev && now - prev < transition)
	{
		transition = now - prev;
		if(transition < 80) transition = 80;

		_function = 'linear';
	}

	return {
		speed: seconds ? transition / 1000 : transition,
		function: _function,
	};
}

function scrollAnimation()
{

}

function isDifferent(a1, a2, ignore = {})
{
	if(a1 === a2)
		return false;

	if(!a1 || !a2 || typeof a1 !== 'object' || typeof a2 !== 'object')
		return a1 !== a2;

	if(Array.isArray(a1)) a1 = [...a1].sort();
	if(Array.isArray(a2)) a2 = [...a2].sort();

	const keys = new Set([...Object.keys(a1), ...Object.keys(a2)]);

	for(const key of keys)
	{
		if(ignore[key] === true)
			continue;

		const nextIgnore = typeof ignore[key] === 'object' ? ignore[key] : {};

		if(!(key in a1) || !(key in a2))
			return true;

		if(isDifferent(a1[key], a2[key], nextIgnore))
			return true;
	}

	return false;
}

var throttles = {};
var debounces = {};

function setDebounce(key, callback, debounce = 300, _debounce = false)
{
	const timeout = setTimeout(function(){

		const debounced = debounces[key];
		if(debounced === false) return;

		const now = Date.now();
		const elapsed = now - debounced.now;

		if(elapsed < debounce)
		{
			setDebounce(key, debounced.callback, debounce, (debounce - elapsed));
			return;
		}

		clearTimeout(throttles[key]);
		debounces[key] = false;
		throttles[key] = false;

		debounced.callback(true);

	}, _debounce || debounce);

	if(_debounce === false)
	{
		debounces[key] = {
			now: Date.now() - 5,
			callback: callback,
			timeout: timeout,
		};
	}
	else
	{
		debounces[key].timeout = timeout;
	}
}

async function setThrottle(key, callback, debounce = 300, throttle = 3000)
{
	if(debounces[key] === undefined || debounces[key] === false)
	{
		setDebounce(key, callback, debounce);
	}
	else
	{
		debounces[key].now = Date.now() - 5;
		debounces[key].callback = callback;
	}

	if(throttles[key] === undefined || throttles[key] === false)
	{
		throttles[key] = setTimeout(function(){

			if(debounces[key]) clearTimeout(debounces[key].timeout);
			debounces[key] = false;
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

function clamp(value, min, max)
{
	return Math.min(Math.max(value, min), max);
}

function normalizeNumber(value, decimals) {

	if(isNaN(value))
		value = 0;
	else
		value = +value;

	value = String(value);

	const has = value.replace(/.*?(\.|$)/, '').length;
	decimals = String(decimals).replace(/.*?(\.|$)/, '').length;

	if(decimals != 0)
		value = value+(/\./.test(value) ? '' : '.')+('0'.repeat(decimals - has));

	return value;

}

module.exports = {
	event: event,
	eventOff: eventOff,
	empty: empty,
	extname: extname,
	extnameC: extnameC,
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
	setDebounce: setDebounce,
	transition: transition,
	scrollTransition: scrollTransition,
	scrollAnimation: scrollAnimation,
	shortWindowsPath: _shortWindowsPath,
	encodeSrcURI: _encodeSrcURI,
	isDifferent: isDifferent,
	clamp: clamp,
	normalizeNumber: normalizeNumber,
};