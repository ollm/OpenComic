const fontList = require('font-list');

var pendingChange = false;

function change(key, value, save = false, saveInApply = true)
{
	switch (key)
	{
		case 'integrated':

			if(value)
				dom.queryAll('.reading-ebook-ratio').addClass('disable-pointer');
			else
				dom.queryAll('.reading-ebook-ratio').removeClass('disable-pointer');

			break;

		case 'fontFamily':

			updateFontFamilyText(value);

			pendingChange = true;

			break;

		case 'colorsTheme':

			updateColorsThemeText(value);

			break;

		case 'fontWeight':

			if(value == 700)
				dom.query('.reading-text-bold').addClass('active');
			else
				dom.query('.reading-text-bold').removeClass('active');

			break;
	}

	let readingEbook = structuredClone(_config.readingEbook);
	readingEbook[key] = value;

	let resize = false;

	if(key == 'integrated' || key == 'ratio')
		resize = true;

	apply(readingEbook, save ? saveInApply : false, resize);

	if(save)
		reading.updateReadingPagesConfig('readingEbook', readingEbook);
}

function limits(key)
{
	let max, min, steps;

	switch (key)
	{
		case 'fontSize':

			max = 68;
			min = 10;
			steps = 1;

			break;

		default:
			return;
	}

	return {
		max: max,
		min: min,
		steps: steps,
	};
}

function increase(key)
{
	const limit = limits(key);
	if(!limit) return;

	let value = _config.readingEbook[key];
	value += limit.steps;

	if(value > limit.max)
		value = limit.max;

	change(key, value, true);
}

function decrease(key)
{
	const limit = limits(key);
	if(!limit) return;

	let value = _config.readingEbook[key];
	value -= limit.steps;

	if(value < limit.min)
		value = limit.min;

	change(key, value, true);
}

function textAlign(align)
{
	let readingEbook = structuredClone(_config.readingEbook);

	if(readingEbook.textAlign == align)
		align = false;

	dom.queryAll('.reading-text-align .chip.active').removeClass('active');
	if(align) dom.query('.reading-text-align-'+align).addClass('active');

	readingEbook.textAlign = align;

	apply(readingEbook);
	reading.updateReadingPagesConfig('readingEbook', readingEbook);
}

function italic()
{
	let readingEbook = structuredClone(_config.readingEbook);

	if(readingEbook.italic)
		readingEbook.italic = false;
	else
		readingEbook.italic = true;

	dom.query('.reading-text-italic').class(readingEbook.italic, 'active');

	apply(readingEbook, true);
	reading.updateReadingPagesConfig('readingEbook', readingEbook);
}

function bold()
{
	let readingEbook = structuredClone(_config.readingEbook);

	if(readingEbook.fontWeight == 700)
		readingEbook.fontWeight = 0;
	else
		readingEbook.fontWeight = 700;

	dom.query('.reading-text-bold').class(readingEbook.fontWeight, 'active');

	document.querySelector('.reading-ebook-font-weight .simple-slider-text > div > span').innerHTML = readingEbook.fontWeight;
	document.querySelector('.reading-ebook-font-weight input').value = readingEbook.fontWeight;
	events.eventRange();

	apply(readingEbook, true);
	reading.updateReadingPagesConfig('readingEbook', readingEbook);
}

async function getFonts(_return = false)
{
	let fonts = await fontList.getFonts({disableQuoting: true});

	let _fonts = [
		{
			name: language.reading.pages.useEbookFont,
			fontFamily: '',
			select: !_config.readingEbook.fontFamily ? true : false,
		},
	];

	for(let i = 0, len = fonts.length; i < len; i++)
	{
		let fontFamily = fonts[i];

		_fonts.push({
			name: fontFamily,
			fontFamily: fontFamily,
			select: fontFamily == _config.readingEbook.fontFamily ? true : false,
		});
	}

	if(_return) return _fonts;

	handlebarsContext.fonts = _fonts;

	document.querySelector('#reading-ebook-font-family .menu-simple-content').innerHTML = template.load('reading.elements.menus.ebook.fonts.html');
}

function updateFontFamilyText(value = null)
{
	if(value === null) value = _config.readingEbook.fontFamily;

	let text = document.querySelector('.reading-ebook-font-family .text');
	if(text) text.innerHTML = (!value) ? language.reading.pages.useEbookFont : value;
}

function getThemesList()
{
	let style = window.getComputedStyle(document.querySelector('.app'));

	let ebookThemes = [
		{
			key: 'ebook',
			name: language.reading.pages.useEbookTheme,
			colors: {},
		},
		{
			key: 'app',
			name: language.reading.pages.useAppTheme,
			letter: 'A',
			colors: {
				text: style.getPropertyValue('--md-sys-color-on-surface'),
				links: style.getPropertyValue('--md-sys-color-primary'),
				background: style.getPropertyValue('--md-sys-color-background'),
			},
		},
		{
			key: 'sepia',
			name: 'Sepia',
			letter: 'S',
			colors: {
				text: '#5b4636',
				links: '#008b8b',
				background: '#efe7dd',
			},
		},
		{
			key: 'gruvbox',
			name: 'Gruvbox',
			letter: 'G',
			colors: {
				text: '#3c3836',
				links: '#076678',
				background: '#fbf1c7',
			},
		},
		{
			key: 'gruvbox_dark',
			name: 'Gruvbox Dark',
			letter: 'G',
			colors: {
				text: '#ebdbb2',
				links: '#83a598',
				background: '#282828',
			},
		},
		{
			key: 'solarized',
			name: 'Solarized',
			letter: 'S',
			colors: {
				text: '#586e75',
				links: '#268bd2',
				background: '#eee8d5',
			},
		},
		{
			key: 'solarized_dark',
			name: 'Solarized Dark',
			letter: 'S',
			colors: {
				text: '#93a1a1',
				links: '#268bd2',
				background: '#073642',
			},
		},
		{
			key: 'nord',
			name: 'Nord',
			letter: 'N',
			colors: {
				text: '#D8DEE9',
				links: '#88C0D0',
				background: '#2e333f',
			},
		},
		{
			key: 'zenburn',
			name: 'Zenburn',
			letter: 'Z',
			colors: {
				text: '#c89191',
				links: '#8bced1',
				background: '#3f3f3f',
			},
		},

	];

	for(let i = 0, len = ebookThemes.length; i < len; i++)
	{
		ebookThemes[i].select = _config.readingEbook.colorsTheme == ebookThemes[i].key ? true : false;
	}

	return ebookThemes;
}

function getthemeName(value)
{
	if(value == 'app')
		return language.reading.pages.useAppTheme;
	else if(value == 'ebook')
		return language.reading.pages.useEbookTheme;

	let ebookThemes = getThemesList();

	for(let i = 0, len = ebookThemes.length; i < len; i++)
	{
		if(value == ebookThemes[i].key)
			return ebookThemes[i].name;
	}

	return '';
}

function getThemes()
{
	// 	Availabel colors here, ebook, app, sepia, night, etc (Copy all foliate)

	let ebookThemes = getThemesList();
	handlebarsContext.ebookThemes = ebookThemes;

	document.querySelector('#reading-ebook-theme .menu-simple-content').innerHTML = template.load('reading.elements.menus.ebook.themes.html');

}

function updateColorsThemeText(value = null)
{
	if(value === null) value = _config.readingEbook.colorsTheme;

	let text = document.querySelector('.reading-ebook-theme .text');
	if(text) text.innerHTML = getthemeName(value);
}

function getThemeColors(key)
{
	let ebookThemes = getThemesList();

	for(let i = 0, len = ebookThemes.length; i < len; i++)
	{
		if(key == ebookThemes[i].key)
			return ebookThemes[i].colors;
	}

	return {};
}

function updateIfPendingChange()
{
	if(pendingChange)
		reading.generateEbookPagesDelayed();

	pendingChange = false;
}

function updateAppTheme()
{
	if(_config.readingEbook.colorsTheme != 'app' || !reading.isEbook()) return;

	let readingEbook = structuredClone(_config.readingEbook);
	apply(readingEbook, false, false);
}

function apply(readingEbook, save = false, resize = false)
{
	reading.fastUpdateEbookPages(readingEbook, resize);

	if(save)
		reading.generateEbookPagesDelayed();
}

function processContext()
{
	handlebarsContext.readingEbookTheme = getthemeName(_config.readingEbook.colorsTheme);
	handlebarsContext.readingFontFamily = (!_config.readingEbook.fontFamily) ? language.reading.pages.useEbookFont : _config.readingEbook.fontFamily;
}

module.exports = {
	change: change,
	increase: increase,
	decrease: decrease,
	textAlign: textAlign,
	bold: bold,
	italic: italic,
	getFonts: getFonts,
	getThemes: getThemes,
	getThemeColors: getThemeColors,
	updateIfPendingChange: updateIfPendingChange,
	updateAppTheme: updateAppTheme,
	processContext: processContext,
};