const fs = require('fs');
const p = require('path');

let basepath = p.dirname(__filename);

let folders = fs.readdirSync(basepath);
let allColorsJs = [];

let allColors = `@import url(./colors.module.css);
@import url(./typography.module.css);
@import url(./easing.css);
@import url(./theme.light.css);
@import url(./theme.dark.css);
@import url(./theme.light.missing.css);
@import url(./theme.dark.missing.css);
`;

for(let key in folders)
{
	let path = p.join(basepath, folders[key]);

	if(fs.statSync(path).isDirectory())
	{
		let color = p.basename(path);

		let css = fs.readFileSync(p.join(path, 'tokens.css'), 'utf8');

		let colors = {};

		colors = tintSurfaceColors(css, 'light', colors);
		colors = tintSurfaceColors(css, 'dark', colors);

		let tokens = '.app.'+color+' {\n';

		for(let key in colors)
		{
			tokens += '	--md-ref-palette-'+key+': '+colors[key]+';\n';
		}

		tokens += '}';

		fs.writeFileSync(p.join(path, 'tokens.missing.css'), tokens); 

		fs.copyFileSync(p.join(basepath, 'theme.css'), p.join(path, 'theme.css'));

		if(fs.existsSync(p.join(path, 'theme.light.css'))) fs.unlinkSync(p.join(path, 'theme.light.css'), 'utf8');
		if(fs.existsSync(p.join(path, 'theme.light.missing.css'))) fs.unlinkSync(p.join(path, 'theme.light.missing.css'), 'utf8');
		if(fs.existsSync(p.join(path, 'theme.dark.css'))) fs.unlinkSync(p.join(path, 'theme.dark.css'), 'utf8');
		if(fs.existsSync(p.join(path, 'theme.dark.missing.css'))) fs.unlinkSync(p.join(path, 'theme.dark.missing.css'), 'utf8');
		if(fs.existsSync(p.join(path, 'typography.module.css'))) fs.unlinkSync(p.join(path, 'typography.module.css'), 'utf8');
		if(fs.existsSync(p.join(path, 'colors.module.css'))) fs.unlinkSync(p.join(path, 'colors.module.css'), 'utf8');

		let _tokens = fs.readFileSync(p.join(path, 'tokens.css'), 'utf8');
		fs.writeFileSync(p.join(path, 'tokens.css'), _tokens.replace(/^\s*[\/.:a-z0-9-]+/iug, '.app.'+color));

		allColors += '@import url(./'+color+'/theme.css);\n';
		allColorsJs.push(color);
	}
}

fs.writeFileSync(p.join(basepath, 'all.colors.css'), allColors);
fs.writeFileSync(p.join(basepath, 'all-colors.js'), 'module.exports = {list: '+JSON.stringify(allColorsJs)+'}');

// night-mode

function tintSurfaceColors(css, theme, colors = {}) {

	let tint = extract(new RegExp('color-surface-tint-'+theme+':\\s*([a-z0-9#]+)', 'iu'), css, 1);

	let keys = [
		'background',
		'surface',
		'surface-variant',
	];

	for(let index in keys)
	{
		let key = keys[index];

		let color = extract(new RegExp('color-'+key+'-'+theme+':\\s*([a-z0-9#]+)', 'iu'), css, 1);

		colors[key+'-1-'+theme] = mixColor(color, tint, 0.05);
		colors[key+'-2-'+theme] = mixColor(color, tint, 0.08);
		colors[key+'-3-'+theme] = mixColor(color, tint, 0.11);
		colors[key+'-4-'+theme] = mixColor(color, tint, 0.12);
		colors[key+'-5-'+theme] = mixColor(color, tint, 0.14);
	}

	let rgbKeys = [
		'on-surface-variant',
	];

	for(let index in rgbKeys)
	{
		let key = rgbKeys[index];

		let color = extract(new RegExp('color-'+key+'-'+theme+':\\s*([a-z0-9#]+)', 'iu'), css, 1);

		let rgb = hexToRgb(color);

		colors[key+'-1-'+theme] = 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 0.05)';
		colors[key+'-2-'+theme] = 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 0.08)';
		colors[key+'-3-'+theme] = 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 0.11)';
		colors[key+'-4-'+theme] = 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 0.12)';
		colors[key+'-5-'+theme] = 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 0.14)';
	}

	return colors;
}

function hexToRgb(hex) {

	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;

}

function componentToHex(c) {

	let hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;

}

function rgbToHex(r, g, b) {

	return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);

}

function _mixColor(rgb1, rgb2, amount) {

	let r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * amount),
		g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * amount),
		b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * amount);

	return rgbToHex(r, g, b);

}

function mixColor(color1, color2, amount) {

	return _mixColor(hexToRgb(color1), hexToRgb(color2), amount);

}

function extract(code, string, value) {

	string = string.match(code);
	return (string !== null && typeof string[value] != 'undefined') ? string[value] : '';

}