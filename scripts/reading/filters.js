
var presetColors = {
	redAndBlueSaturated: [
		{h: 0, s: 0, m: 1},
		{h: 240, s: 1, m: 1},
		{h: 0, s: 1, m: 1},
		{h: 50, s: 2, m: 1},
		{h: 0, s: 0, m: 1},
	],
	redAndBlue: [
		{h: 0, s: 0, m: 1},
		{h: 240, s: 0.6, m: 1},
		{h: 0, s: 0.7, m: 1},
		{h: 50, s: 1.5, m: 1},
		{h: 0, s: 0, m: 1},
	],
	redAndBlueGray: [
		{h: 0, s: 0, m: 1},
		{h: 240, s: 0.4, m: 1},
		{h: 0, s: 0.5, m: 1},
		{h: 50, s: 1, m: 1},
		{h: 0, s: 0, m: 1},
	],
	redAndBlueGraySharp: [
		{h: 0, s: 0, m: 5},
		{h: 240, s: 0.3, m: 5},
		{h: 0, s: 0.35, m: 5},
		{h: 50, s: 0.7, m: 5},
		{h: 0, s: 0, m: 5},
	],
	blueSky: [
		{h: 0, s: 0, m: 1},
		{h: 204, s: 0.73, m: 1},
		{h: 200, s: 0.79, m: 1},
		{h: 206, s: 0.84, m: 1}
	],
	blueAndCarnation: [
		{h: 223, s: 0.93, m: 1},
		{h: 199, s: 0.4, m: 3},
		{h: 6, s: 0.23, m: 2},
		{h: 6, s: 1.25, m: 1}
	],
	blueViolet: [
		{h: 268, s: 0.78, m: 1},
		{h: 283, s: 0.94, m: 1},
		{h: 206, s: 0.97, m: 1},
		{h: 194, s: 0.97, m: 1}
	],
	paleYellowAndBrown: [
		{h: 203, s: 0, m: 1},
		{h: 238, s: 0.14, m: 1},
		{h: 15, s: 0.55, m: 1},
		{h: 14, s: 0.63, m: 1},
		{h: 41, s: 0.5, m: 1},
		{h: 44, s: 0.58, m: 1},
		{h: 45, s: 0.78, m: 1},
		{h: 48, s: 0.93, m: 1},
		{h: 52, s: 0.95, m: 1}
	],
	purpleAndCarnation: [
		{h: 0, s: 0, m: 1},
		{h: 260, s: 0.2, m: 1},
		{h: 280, s: 0.2, m: 1},
		{h: 300, s: 0.2, m: 1},
		{h: 0, s: 0, m: 1},
	],
	violetAndCarnation: [
		{h: 0, s: 0, m: 1},
		{h: 300, s: 0.7, m: 1},
		{h: 300, s: 0.4, m: 2},
		{h: 1, s: 0.4, m: 1},
		{h: 0, s: 0, m: 1},
	],
	violetAndCarnationGray: [
		{h: 0, s: 0, m: 1},
		{h: 300, s: 0.2, m: 1},
		{h: 300, s: 0.3, m: 2},
		{h: 360, s: 0.2, m: 1},
		{h: 0, s: 0, m: 1},
	],
	violetAndBrown: [
		{h: 323, s: 0.37, m: 1},
		{h: 321, s: 0.42, m: 1},
		{h: 314, s: 0.49, m: 2},
		{h: 18, s: 0.72, m: 3},
		{h: 28, s: 0.83, m: 1}
	],

	// One tone colors
	red: [
		{h: 0, s: 0, m: 1},
		{h: 0, s: 0.70, m: 1},
		{h: 0, s: 0, m: 1},
	],
	redOrange: [
		{h: 0, s: 0, m: 1},
		{h: 20, s: 1, m: 1},
		{h: 0, s: 0, m: 1},
	],
	orange: [
		{h: 0, s: 0, m: 1},
		{h: 30, s: 1.33, m: 1},
		{h: 0, s: 0, m: 1},
	],
	yellowOrange: [
		{h: 0, s: 0, m: 1},
		{h: 40, s: 1.66, m: 1},
		{h: 0, s: 0, m: 1},
	],
	yellow: [
		{h: 0, s: 0, m: 1},
		{h: 50, s: 2, m: 1},
		{h: 0, s: 0, m: 1},
	],
	yellowGreen: [
		{h: 0, s: 0, m: 1},
		{h: 70, s: 1, m: 1},
		{h: 0, s: 0, m: 1},
	],
	green: [
		{h: 0, s: 0, m: 1},
		{h: 120, s: 0.70, m: 1},
		{h: 0, s: 0, m: 1},
	],
	greenBlue: [
		{h: 0, s: 0, m: 1},
		{h: 160, s: 0.80, m: 1},
		{h: 0, s: 0, m: 1},
	],
	blueGreen: [
		{h: 0, s: 0, m: 1},
		{h: 200, s: 0.70, m: 1},
		{h: 0, s: 0, m: 1},
	],
	blue: [
		{h: 0, s: 0, m: 1},
		{h: 230, s: 0.70, m: 1},
		{h: 0, s: 0, m: 1},
	],
	blueViolet: [
		{h: 0, s: 0, m: 1},
		{h: 250, s: 0.70, m: 1},
		{h: 0, s: 0, m: 1},
	],
	violet: [
		{h: 0, s: 0, m: 1},
		{h: 280, s: 0.70, m: 1},
		{h: 0, s: 0, m: 1},
	],
	redViolet: [
		{h: 0, s: 0, m: 1},
		{h: 340, s: 0.70, m: 1},
		{h: 0, s: 0, m: 1},
	],
};

var presetColorsNames = {

};

function change(key, value, save = false)
{
	switch (key)
	{
		case 'colorize':

			if(value)
				dom.queryAll('.reading-only-black-and-white, .filters-colors').removeClass('disable-pointer');
			else
				dom.queryAll('.reading-only-black-and-white, .filters-colors').addClass('disable-pointer');

			break;
	}

	let readingFilters = structuredClone(_config.readingFilters);

	readingFilters[key] = value;

	apply(readingFilters);

	if(save)
	{
		reading.updateReadingPagesConfig('readingFilters', readingFilters);
		focusIndex(currentIndex);
	}
}

function saveColorize(colors, force = false)
{
	let sameAsPreset = '';

	// Check OpenComic presets
	for(let key in presetColors)
	{
		if(isEqual(colors, presetColors[key]))
		{
			sameAsPreset = key;
		}
	}

	// Check user presets
	let colorPresets = storage.get('colorPresets');

	for(let key in colorPresets)
	{
		if(isEqual(colors, colorPresets[key].colors))
		{
			sameAsPreset = key;
		}
	}

	if(colors.length < 2 && !sameAsPreset)
		sameAsPreset = 'redAndBlueGray';

	let readingFilters = structuredClone(_config.readingFilters);

	let _colorPreset = readingFilters.colorPreset;

	readingFilters.colorPreset = sameAsPreset;
	readingFilters.colors = sameAsPreset ? [] : colors;

	reading.updateReadingPagesConfig('readingFilters', readingFilters);

	if(_colorPreset !== sameAsPreset || force)
	{
		let text = document.querySelector('.reading-filters-presets .text');
		if(text) text.innerHTML = getColorsPresetName()
		events.eventSelect();
	}
}


function changeColorize(key, index, value, save = false)
{
	let colors = [];

	let _colors = document.querySelectorAll('.filters-colors .filters-colorize');

	for(let i = 0, len = _colors.length; i < len; i++)
	{
		let inputs = _colors[i].querySelectorAll('input');

		let h = 0;
		let s = 1;
		let m = 1;

		for(let i2 = 0, len2 = inputs.length; i2 < len2; i2++)
		{
			let input = inputs[i2];

			switch (input.getAttribute('name'))
			{
				case 'hue':
					h = +input.value;
					break;
				case 'saturation':
					s = +input.value / 100;
					break;
				case 'multiplier':
					m = +input.value;
					break;
			}
		}

		colors.push({
			h: h,
			s: s,
			m: m,
		});
	}

	let pColors = processColors(colors);

	for(let i = 0, len = _colors.length; i < len; i++)
	{
		let element = _colors[i].querySelector('.filters-colorize-color > div');
		element.style.backgroundColor = 'rgb('+pColors[i].color+', '+pColors[i].color+', '+pColors[i].color+')';
	}

	colorize(colors);

	if(save)
		saveColorize(colors);

}

function apply(readingFilters = false)
{
	readingFilters = readingFilters || _config.readingFilters;

	let filters = [];
	let bwFilters = [];

	let contentRight = template._contentRight();
	let contentRightIndex = template.contentRightIndex();

	if(readingFilters.colorize)
	{
		colorize(getColors());

		if(readingFilters.onlyBlackAndWhite)
			bwFilters.push('grayscale(100%) url(#colorChangeFilter'+contentRightIndex+')');
		else
			filters.push('grayscale(100%) url(#colorChangeFilter'+contentRightIndex+')');
	}

	if(readingFilters.brightness != 100) filters.push('brightness('+readingFilters.brightness+'%)');
	if(readingFilters.saturation != 100) filters.push('saturate('+readingFilters.saturation+'%)');
	if(readingFilters.contrast != 100) filters.push('contrast('+readingFilters.contrast+'%)');
	if(readingFilters.sepia != 0) filters.push('sepia('+readingFilters.sepia+'%)');
	if(readingFilters.hueRotate != 0) filters.push('hue-rotate('+readingFilters.hueRotate+'deg)');
	if(readingFilters.invert) filters.push('invert(100%)');

	let readingFiltersStyle = contentRight.querySelector('.reading-filters style');

	let html = '';

	if(bwFilters.length > 0)
		html += '.content-right-'+contentRightIndex+' .reading-body .r-img.black-and-white > oc-img > *, .content-right-'+contentRightIndex+' .reading-lens .r-img.black-and-white > oc-img > *{filter: '+bwFilters.join(' ')+' '+filters.join(' ')+'}';

	if(filters.length > 0)
		html += '.content-right-'+contentRightIndex+' .reading-body .r-img > oc-img > *, .content-right-'+contentRightIndex+' .reading-lens .r-img > oc-img > *{filter: '+filters.join(' ')+'}';

	readingFiltersStyle.innerHTML = html;
}

function keepLuminance(center, r, g, b, s)
{
	s = s < 1 ? 1 : s;
	let startL = ((r * 0.2126) + (g * 0.7152) + (b * 0.0722));
	let increase = startL > center ? false : true;

	let _s = (s - 1);
	let p = ((1 * (Math.abs(r - center) * 0.2126)) + (1 * (Math.abs(g - center) * 0.7152)) + (1 * (Math.abs(b - center) * 0.0722)));
	_s = _s * p * 0.1;

	let _center = increase ? center - _s : center + _s;

	let i = 0;
	let change = Math.abs(_center - startL) / 3;

	while(true)
	{
		let _r = r;
		let _g = g;
		let _b = b;

		if(increase)
		{
			_r += change;
			_g += change;
			_b += change;
		}
		else
		{
			_r -= change;
			_g -= change;
			_b -= change;

			if(_r < 0) _r = 0;
			if(_g < 0) _g = 0;
			if(_b < 0) _b = 0;
		}

		let l = (_r * 0.2126) + (_g * 0.7152) + (_b * 0.0722);

		if((increase && l >= _center) || (!increase && l <= _center))
			break;

		if(i > 10000)
			break;

		change = Math.abs(_center - l) / 3;

		if(change < 0.001)
			change = 0.001;

		r = _r;
		g = _g;
		b = _b;

		i++;
	}

	return {
		r: r,
		g: g,
		b: b,
	};
}

function colorize(colors = [], _apply = false, _return = false)
{
	let _colors = [];

	for(let i = 0, len = colors.length; i < len; i++)
	{
		let m = colors[i].m;

		for(let n = 0; n < m; n++)
		{
			_colors.push(colors[i]);
		}
	}

	colors = _colors;

	let len = colors.length;
	let sum = 1 / (len - 1);

	let feFuncR = [];
	let feFuncG = [];
	let feFuncB = [];

	for(let i = 0; i < len; i++)
	{
		let color = colors[i];

		let center = sum * i;
		let up = 1 - center;

		let _color = hslToRgb(color.h / 360, 1, 0.5);

		let r = _color.r;
		let g = _color.g;
		let b = _color.b;
		let s = typeof color.s !== 'undefined' ? color.s : 1;

		//s = s > 1 ? s + ((s - 1) * (center * 5)) : s;

		let _r = r;
		let _g = g;
		let _b = b;

		let m = 1 - (((r + g + b) - 1) / 2);

		_r = s * _r;
		_g = s * _g;
		_b = s * _b;

		let fR = _r > 0 ? center + up * (_r * m) : (center + (_r * m) * center);
		let fG = _g > 0 ? center + up * (_g * m) : (center + (_g * m) * center);
		let fB = _b > 0 ? center + up * (_b * m) : (center + (_b * m) * center);

		if(center == 1 && s > 1)
		{
			fR = fR + (_r * (s - 1));
			fG = fG + (_g * (s - 1));
			fB = fB + (_b * (s - 1));
		}

		_color = keepLuminance(center, fR, fG, fB, s);

		feFuncR.push(_color.r);
		feFuncG.push(_color.g);
		feFuncB.push(_color.b);
	}

	if(_return)
	{
		return {
			feFuncR: feFuncR.join(' '),
			feFuncG: feFuncG.join(' '),
			feFuncB: feFuncB.join(' '),
		};
	}

	let contentRight = template._contentRight();

	let readingFiltersDiv = contentRight.querySelector('.reading-filters div');

	let contentRightIndex = template.contentRightIndex();

	handlebarsContext.contentRightIndex = contentRightIndex;
	handlebarsContext.feFuncR = feFuncR.join(' ');
	handlebarsContext.feFuncG = feFuncG.join(' ');
	handlebarsContext.feFuncB = feFuncB.join(' ');
	readingFiltersDiv.innerHTML = template.load('filters.colorize.html');

	if(_apply)
		apply();
}

function colorizePreset(preset, save = false)
{
	let colors = presetColors[preset] || storage.get('colorPresets')[preset]?.colors;

	if(colors)
	{
		colorize(colors);

		if(save)
		{
			saveColorize(colors);
			updateColorsList();
		}
	}
}

function rgbToHue(r, g, b)
{
	let h;

	let max = Math.max(r, g, b), min = Math.min(r, g, b);

	if(max - min == 0)
		return 0;

	if(max == r)
		h = (g-b)/(max-min);
	else if(max == g)
		h = 2 +(b-r)/(max-min);
	else if(max == b)
		h = 4 + (r-g)/(max-min);

	h = h*60;

	h %= 360;

	if(h < 0)
		h += 360;

	return Math.round(h);
}

function rgbToHsl(r, g, b)
{
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	let h, s, l = (max + min) / 2;

	if (max === min)
	{
		h = s = 0; // achromatic
	}
	else
	{
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	return [h, s, l];
}

function hslToRgb(h, s, l)
{
	let r, g, b;

	if (s === 0)
	{
		r = g = b = l;
	}
	else
	{
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hueToRgb(p, q, h + 1 / 3);
		g = hueToRgb(p, q, h);
		b = hueToRgb(p, q, h - 1 / 3);
	}

	return {
		r: r,
		g: g,
		b: b,
	};
}

function hueToRgb(p, q, t)
{
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1 / 6) return p + (q - p) * 6 * t;
	if (t < 1 / 2) return q;
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}

function processColors(colors)
{
	let _colors = [];

	let sum = 0;

	for(let i = 0, len = colors.length; i < len; i++)
	{
		let color = colors[i];
		sum += color.m;
	}

	let index = -0.5;

	// Convert values
	for(let i = 0, len = colors.length; i < len; i++)
	{
		let color = colors[i];

		let _s = color.m

		_colors.push({
			color: (index + (color.m / 2)) / (sum - 1) * 255,
			hue: Math.round(color.h),
			saturation: Math.round(color.s * 100),
			multiplier: Math.round(color.m),
		});

		index += color.m;
	}

	return _colors;
}

function getColors()
{
	if(_config.readingFilters.colors.length > 2)
		return _config.readingFilters.colors;

	return presetColors[_config.readingFilters.colorPreset] || storage.get('colorPresets')[_config.readingFilters.colorPreset]?.colors || presetColors.redAndBlueGray;
}

function getColorsPresetName(name = false)
{
	if(!name && _config.readingFilters.colors.length > 2)
		return '';

	let colorPresets = storage.get('colorPresets');

	if(!name && colorPresets[_config.readingFilters.colorPreset])
		return colorPresets[_config.readingFilters.colorPreset].name;

	name = name || (presetColors[_config.readingFilters.colorPreset] ? (presetColorsNames[_config.readingFilters.colorPreset] || _config.readingFilters.colorPreset) : 'redAndBlueGray');

	let words = name.split(/(?=[A-Z])/);

	for(let i = 0, len = words.length; i < len; i++)
	{
		let str = words[i];

		if(str != 'And')
			words[i] = str.charAt(0).toUpperCase() + str.slice(1);
		else
			words[i] = str.toLowerCase();
	}

	return words.join(' ');
}

function processContext()
{
	let colors = structuredClone(getColors());

	let contentRightIndex = template.contentRightIndex();

	colorize(getColors());

	handlebarsContext.readingFiltersCss = 'grayscale(100%) url(#colorChangeFilter'+contentRightIndex+')';
	handlebarsContext.readingFiltersColors = processColors(colors);
	handlebarsContext.readingFiltersPreset = getColorsPresetName();
}

function updateColorsList()
{
	processContext();

	let globalElement = template._globalElement();

	let colorsList = globalElement.querySelector('.filters-colors-list');
	if(colorsList) colorsList.innerHTML = template.load('reading.elements.menus.pages.filters.html');

	events.eventsTab();
	events.eventRange('.global-elements .menus');
}

changeColorize

function up(index = 0)
{
	let colors = getColors();

	if(index > 1)
	{
		if(colors[index])
		{
			let curent = colors[index];
			let toChange = colors[index - 1];

			colors[index] = toChange;
			colors[index - 1] = curent;
		}

		saveColorize(colors);
		updateColorsList();
	}
}

function down(index = 0)
{
	let colors = getColors();

	if(index < colors.length - 2)
	{
		if(colors[index])
		{
			let curent = colors[index];
			let toChange = colors[index + 1];

			colors[index] = toChange;
			colors[index + 1] = curent;
		}

		saveColorize(colors);
		updateColorsList();
	}
}

function remove(index = 0)
{
	let colors = getColors();

	if(colors.length < 4) return;

	colors.splice(index, 1);

	saveColorize(colors);
	updateColorsList();
}

function add()
{
	let colors = getColors();

	colors.splice(colors.length - 1, 0, {h: app.rand(0, 360), s: 1, m: 1});

	saveColorize(colors);
	updateColorsList();
}

function loadImage(url, encode = false)
{
	return new Promise(function(resolve) {
		let image = new Image();
		image.onload = function(){resolve(image)}
		image.onerror = function(){resolve(image)}
		image.src = encode ? encodeSrcURI(url) : url;
	});
}

var prevColors = false, imagePath = false;

function fromImage()
{
	prevColors = structuredClone(getColors());

	imagePath = false;

	let dialog = electronRemote.dialog;

	dialog.showOpenDialog({properties: ['openFile'], filters: [{name: language.global.comics, extensions: [...compatibleImageExtensions, ...compatibleSpecialExtensions]}]}).then(async function (files) {

		if(files.filePaths && files.filePaths[0])
		{
			events.dialog({
				header: language.dialog.pages.readingNumColorsGenerate,
				width: 500,
				height: 274,
				content: template.load('dialog.reading.filters.image.html'),
				onClose: 'reading.filters.confirmColors(false);',
				buttons: [
					{
						text: language.buttons.cancel,
						function: 'events.closeDialog(); reading.filters.confirmColors(false);',
					},
					{
						text: language.buttons.ok,
						function: 'events.closeDialog(); reading.filters.confirmColors(true);',
					}
				],
			});

			events.events();

			imagePath = files.filePaths[0];
			await loadContext(imagePath);
			generateFromImage(false, 16);
		}

	});
}

var fromImageColorsQueueST = false;

async function fromImageColors(num = 2, end = false)
{
	clearTimeout(fromImageColorsQueueST);

	fromImageColorsQueueST = setTimeout(function(){

		generateFromImage(false, num);

	}, 100);
}

function confirmColors(confirm = false)
{
	if(!confirm)
	{
		saveColorize(prevColors);
		updateColorsList();
	}
}

var data = false, width = false, height = false;

async function loadContext(path)
{
	let image = await loadImage(path, true);
	let canvas = document.createElement('canvas');
	width = canvas.width = image.width;
	height = canvas.height = image.height;
	let context = canvas.getContext('2d');

	context.drawImage(image, 0, 0, width, height);
	data = context.getImageData(0, 0, width, height).data;
}

async function generateFromImage(path = false, numColors = false)
{
	if(data === false && path)
		await loadContext(path);

	if(numColors === false)
		numColors = +document.querySelector('input[name="filtersNumColors"]').value;

	let reverseNumColors = 256 / numColors;

	let colorsL = [];
	let colorsS = [];

	for(let i = 0; i < numColors; i++)
	{
		colorsL.push({});
		colorsS.push({});
	}

	for(let x = 0; x < width; x++)
	{
		for(let y = 0; y < height; y++)
		{
			let i = (y * width + x) * 4;

			let r = data[i];
			let g = data[i + 1];
			let b = data[i + 2];

			let hsl = rgbToHsl(r, g, b);

			let h = hsl[0] * 360;
			let l = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
			let s = (hsl[1] * 100);

			let _h = Math.floor(h / reverseNumColors);
			let _l = Math.floor(l / reverseNumColors);
			let _s = Math.floor(s / reverseNumColors);

			if(r !== g && g !== b)
			{
				if(!colorsL[_l][_h]) colorsL[_l][_h] = {n: 0, h: 0, l: 0};
				colorsL[_l][_h].n++;
				colorsL[_l][_h].h += h;
				colorsL[_l][_h].l += l;

				if(!colorsS[_l][_h]) colorsS[_l][_h] = {};
				if(!colorsS[_l][_h][_s]) colorsS[_l][_h][_s] = {n: 0, s: 0};
				colorsS[_l][_h][_s].n++;
				colorsS[_l][_h][_s].s += s;
			}
		}
	}

	let colors = [];

	for(let key in colorsL)
	{
		let h = false, l = 0, _h = 0, prev = 0;

		for(let H in colorsL[key])
		{
			let color = colorsL[key][H];

			if(h === false || color.n > prev)
			{
				prev = color.n;
				h = color.h / color.n;
				l = color.l / color.n;
				_h = H;
			}
		}

		let s = false;
		prev = 0;

		for(let _s in colorsS[key][_h])
		{
			let color = colorsS[key][_h][_s];

			if(s === false || color.n > prev)
			{
				prev = color.n;
				s = color.s / color.n;
			}
		}

		s = s / 100;
		let _l = (l / 255);

		colors.push({
			h: Math.round(h),
			s: s + ((1 - s) * (_l / 1.2)),
			m: 1,
		});

	}

	saveColorize(colors);
	updateColorsList();

	return;
}

/* Detect if image is black and white */

var file = false,
	imagesPath = [],
	currentIndex = 0,
	isBlackAndWhite = {},
	isBlackAndWhiteCurrent = {},
	isBlackAndWhiteQueue = {},
	processingIsBlackAndWhiteQueue = false;
	toCheck = [];

function setImagesPath(_imagesPath, mainPath)
{
	file = fileManager.file(mainPath);

	isBlackAndWhiteCurrent = {};

	let newImagesPath = {};

	for(let path in _imagesPath)
	{
		newImagesPath[_imagesPath[path]] = {path: path, sha: sha1(path)};
	}

	imagesPath = newImagesPath;
}

async function checkIsBlackAndWhite(path, sha, index)
{
	// Load image to a canvas
	let image = await loadImage(path, false);
	let canvas = document.createElement('canvas');
	let width = canvas.width = image.width;
	let height = canvas.height = image.height;
	let context = canvas.getContext('2d');

	context.drawImage(image, 0, 0, width, height);
	let data = context.getImageData(0, 0, width, height).data;

	// Detect if image is black and white or one tone color
	let blackAndWhite = false;
	let saturation = {s: 0, n: 0, m: 0};

	for(let x = 0; x < width; x++)
	{
		for(let y = 0; y < height; y++)
		{
			let i = (y * width + x) * 4;

			let r = data[i];
			let g = data[i + 1];
			let b = data[i + 2];

			if((r > 5 && r < 250) || (g > 5 && g < 250) || (b > 5 && b < 250)) // Ignore almost black and white colors
			{
				let diff1 = Math.abs(r - b);
				let diff2 = Math.abs(g - r);
				let diff3 = Math.abs(b - g);

				s = (diff1 + diff2 + diff3) / 2 / 2.55;

				saturation.s += s;
				saturation.n++;
				if(saturation.m < s) saturation.m = s;
			}
		}
	}

	if(saturation.n)
	{
		saturation.s = saturation.s / saturation.n;
		blackAndWhite = (saturation.s < 5 && saturation.m < 10) ? true : false;
	}
	else // Is pure black or white image
	{
		blackAndWhite = true;
	}

	isBlackAndWhiteCurrent[sha] = true;
	isBlackAndWhite[sha] = blackAndWhite;

	if(blackAndWhite)
		dom.this(template._contentRight()).find('.r-img-i'+index, true).addClass('black-and-white');

	return;
}

async function _processIsBlackAndWhiteQueue()
{
	let sha = false, image = false;

	for(sha in isBlackAndWhiteQueue)
	{
		image = isBlackAndWhiteQueue[sha];

		break;
	}

	if(image && sha)
	{
		let thumbnail = cache.returnThumbnailsImages({path: image.path, sha: image.sha}, async function(thumbnail) {

			await checkIsBlackAndWhite(thumbnail.path, sha, image.index);
			delete isBlackAndWhiteQueue[sha];

			_processIsBlackAndWhiteQueue();

		}, file);

		if(thumbnail.cache)
		{
			await checkIsBlackAndWhite(thumbnail.path, sha, image.index);
			delete isBlackAndWhiteQueue[sha];

			_processIsBlackAndWhiteQueue()
		}
	}
	else
	{
		processingIsBlackAndWhiteQueue = false;
	}
}

async function processIsBlackAndWhiteQueue()
{
	if(!processingIsBlackAndWhiteQueue)
	{
		processingIsBlackAndWhiteQueue = true;

		_processIsBlackAndWhiteQueue();
	}
}

async function focusIndex(index)
{
	currentIndex = index;

	if(!_config.readingFilters.colorize || !_config.readingFilters.onlyBlackAndWhite) return;

	let contentRight = template._contentRight();

	for(let n = 0; n < 4; n++)
	{
		for(let p = 0; p < 2; p++)
		{
			let i = p == 0 ? index + n : index - n;
			let image = imagesPath[i] || false;

			if(image)
			{
				let sha = image.sha;

				if(isBlackAndWhite[sha] === undefined)
				{
					isBlackAndWhiteQueue[sha] = {index: i, path: image.path, sha: image.sha};

					processIsBlackAndWhiteQueue();
				}
				else
				{
					if(!isBlackAndWhiteCurrent[sha])
					{
						isBlackAndWhiteCurrent[sha] = true;

						if(isBlackAndWhite[sha])
							dom.this(contentRight).find('.r-img-i'+i, true).addClass('black-and-white');
					}
				}
			}
		}
	}
}

function loadFiltersPresets()
{
	let presetGroups = [
		{
			name: language.reading.pages.multipleTonePresets,
			colors: [
				'redAndBlueSaturated',
				'redAndBlue',
				'redAndBlueGray',
				'redAndBlueGraySharp',
				'blueSky',
				'blueAndCarnation',
				'blueViolet',
				'paleYellowAndBrown',
				'purpleAndCarnation',
				'violetAndCarnation',
				'violetAndCarnationGray',
				'violetAndBrown',
			],
		},
		{
			name: language.reading.pages.oneTonePresets,
			colors: [
				'red',
				'redOrange',
				'orange',
				'yellowOrange',
				'yellow',
				'yellowGreen',
				'green',
				'greenBlue',
				'blueGreen',
				'blue',
				'blueViolet',
				'violet',
				'redViolet',
			],
		},
	];

	let currentPreset = _config.readingFilters.colors.length > 2 ? '' : _config.readingFilters.colorPreset;

	let presets = [];
	let userPresets = [];

	for(let key in presetGroups)
	{
		let group = presetGroups[key];
		let colors = [];

		for(let key2 in group.colors)
		{
			let color = group.colors[key2];

			let name = getColorsPresetName(color);
			let feFunc = colorize(presetColors[color], false, true);

			colors.push({
				key: color,
				select: color == currentPreset ? true : false,
				name: name,
				feFuncR: feFunc.feFuncR,
				feFuncG: feFunc.feFuncG,
				feFuncB: feFunc.feFuncB,
			});
		}

		presets.push({
			name: group.name,
			colors: colors,
		});
	}

	// User presets
	let colorPresets = storage.get('colorPresets');

	for(let key in colorPresets)
	{
		let name = colorPresets[key].name;
		let feFunc = colorize(colorPresets[key].colors, false, true);

		userPresets.push({
			key: key,
			select: key == currentPreset ? true : false,
			name: name,
			feFuncR: feFunc.feFuncR,
			feFuncG: feFunc.feFuncG,
			feFuncB: feFunc.feFuncB,
		});
	}

	handlebarsContext.presets = presets;
	handlebarsContext.userPresets = userPresets;

	document.querySelector('#reading-filters-presets .menu-simple-content').innerHTML = template.load('reading.elements.menus.filters.presets.html');
}

function saveAsPreset(save = false)
{
	if(save)
	{
		let name = document.querySelector('.input-preset-name').value;

		if(isEmpty(name.trim()))
		{
			events.snackbar({
				key: 'saveAsPreset',
				text: language.global.valueCannotBeEmpty,
				duration: 6,
				buttons: [
					{
						text: language.buttons.dismiss,
						function: 'events.closeSnackbar();',
					},
				],
			});
		}
		else
		{
			let colorPresets = storage.get('colorPresets');

			colorPresets.push({
				name: name,
				colors: getColors(),
			});

			storage.update('colorPresets', colorPresets);

			events.closeDialog();
		}
	}
	else
	{
		handlebarsContext.readingShortcutPresetName = '';

		events.dialog({
			header: language.reading.pages.saveAsPreset,
			width: 400,
			height: false,
			content: template.load('dialog.pages.reading.filters.save.as.preset.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.save,
					function: 'reading.filters.saveAsPreset(true);',
				}
			],
		});
	}
}

function editPreset(key, save = false)
{
	if(save)
	{
		let name = document.querySelector('.input-preset-name').value;

		if(isEmpty(name.trim()))
		{
			events.snackbar({
				key: 'saveAsPreset',
				text: language.global.valueCannotBeEmpty,
				duration: 6,
				buttons: [
					{
						text: language.buttons.dismiss,
						function: 'events.closeSnackbar();',
					},
				],
			});
		}
		else
		{
			let colorPresets = storage.get('colorPresets');

			if(colorPresets[key])
			{
				colorPresets[key].name = name;
				storage.update('colorPresets', colorPresets);

				saveColorize(getColors(), true);
			}

			events.closeDialog();
		}
	}
	else
	{
		let colorPresets = storage.get('colorPresets');
		let name = colorPresets[key].name;

		handlebarsContext.readingShortcutPresetName = name;

		events.dialog({
			header: language.reading.pages.saveAsPreset,
			width: 400,
			height: false,
			content: template.load('dialog.pages.reading.filters.save.as.preset.html'),
			buttons: [
				{
					text: language.buttons.remove,
					function: 'events.closeDialog(); reading.filters.removePreset('+key+');',
				},
				{
					text: language.buttons.save,
					function: 'reading.filters.editPreset('+key+', true);',
				}
			],
		});
	}
}

function removePreset(key)
{
	let colorPresets = storage.get('colorPresets');

	if(colorPresets[key])
	{
		colorPresets.splice(key, 1);
		storage.update('colorPresets', colorPresets);

		saveColorize(getColors(), true);
	}
}

module.exports = {
	colorize: colorize,
	colorizePreset: colorizePreset,
	apply: apply,
	change: change,
	changeColorize: changeColorize,
	processContext: processContext,
	up: up,
	down: down,
	remove: remove,
	add: add,
	fromImage: fromImage,
	fromImageColors: fromImageColors,
	generateFromImage: generateFromImage,
	confirmColors: confirmColors,
	setImagesPath: setImagesPath,
	focusIndex: focusIndex,
	loadFiltersPresets: loadFiltersPresets,
	saveAsPreset: saveAsPreset,
	editPreset: editPreset,
	removePreset: removePreset,
};