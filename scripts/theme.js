const allColors = require(p.join(appDir, 'themes/material-design/colors/all-colors.js'));

function getColorTokens(color)
{
	let tokens = fs.readFileSync(p.join(appDir, 'themes/material-design/colors', color, 'tokens.css'), 'utf8');
	tokens += fs.readFileSync(p.join(appDir, 'themes/material-design/colors', color, 'tokens.missing.css'), 'utf8');

	return tokens;
}

function getTokensColor(tokens, theme, key)
{
	let color = extract(new RegExp('(?:color|palette)-'+key+'-'+theme+':\\s*([a-z0-9#]+)', 'iu'), tokens, 1);

	return color;
}

function setColor(color)
{
	let app = document.querySelector('.app');

	for(let key in allColors.list)
	{
		app.classList.remove(allColors.list[key]);
	}

	app.classList.add(color);

	storage.updateVar('config', 'themeColor', color);

	titleBar.setColors();
}

var nightMode;

function _systemNightMode()
{
	if(config.systemNightMode)
	{
		if(nightMode.matches)
			dom.nightMode(true);
		else
			dom.nightMode(false);
	}
}

function systemNightMode()
{
	nightMode = window.matchMedia('(prefers-color-scheme: dark)');
	nightMode.addEventListener('change', _systemNightMode);

	_systemNightMode();
}

function start()
{
	events.events();

	if(!handlebarsContext.themeColors)
	{
		let themeColors = [];

		for(let key in allColors.list)
		{
			let color = allColors.list[key];

			let tokens = getColorTokens(color);

			themeColors.push({
				key: color,
				name: color.charAt(0).toUpperCase() + color.slice(1),
				colors: [
					getTokensColor(tokens, 'light', 'secondary-container'),
					getTokensColor(tokens, 'light', 'surface-2'),

				],
				/*light: {
					primary: getTokensColor(tokens, 'light', 'primary'),
					secondary: getTokensColor(tokens, 'light', 'secondary'),
					tertiary: getTokensColor(tokens, 'light', 'tertiary'),
				},
				dark: {
					primary: getTokensColor(tokens, 'dark', 'primary'),
					secondary: getTokensColor(tokens, 'dark', 'secondary'),
					tertiary: getTokensColor(tokens, 'dark', 'tertiary'),
				},*/
			});
		}

		handlebarsContext.themeColors = themeColors;
	}

	template.loadContentRight('theme.content.right.html', true);

	gamepad.updateBrowsableItems('theme');
}

module.exports = {
	setColor: setColor,
	systemNightMode: systemNightMode,
	start: start,
};