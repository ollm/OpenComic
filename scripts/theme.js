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

	storage.setKey('config', 'themeColor', color);

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

function loadCustomThemes()
{
	const customThemes = storage.get('customThemes');

	const currentCustomTheme = dom.queryAll('link.custom-theme');
	currentCustomTheme.remove();

	for(const theme of customThemes)
	{
		if(!theme.active)
			continue;

		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = theme.path;
		link.classList.add('custom-theme');
		document.head.appendChild(link);
	}

}

function updateCustomThemes()
{
	let customThemes = storage.get('customThemes');
	handlebarsContext.customThemes = customThemes;

	let contentRight = template._contentRight();

	let empty = contentRight.querySelector('.settings-custom-themes-empty');
	let list = contentRight.querySelector('.settings-custom-themes-list');

	if(!isEmpty(customThemes))
	{
		empty.style.display = 'none';
		list.style.display = '';
	}
	else
	{
		empty.style.display = '';
		list.style.display = 'none';
	}

	// Copiar de los macros???
	list.innerHTML = template.load('theme.content.right.custom.themes.list.html');
	
	events.eventSwitch();
}

let currentCustomThemePath = '';

function setCustomThemePath()
{
	const dialog = electronRemote.dialog;

	dialog.showOpenDialog({properties: ['openFile'], filters: [{extensions: ['css']}], securityScopedBookmarks: macosMAS, defaultPath: currentCustomThemePath}).then(async function (files) {

		fileManager.macosSecurityScopedBookmarks(files);

		if(files.filePaths && files.filePaths[0])
		{
			const folder = files.filePaths[0];
			currentCustomThemePath = folder;
			dom.queryAll('.input-path .path-selector span').html(folder);
		}

	});
}

function getCustomThemeInputValues()
{
	const name = document.querySelector('.input-name').value;
	const path = currentCustomThemePath;
	const active = +document.querySelector('.input-active').dataset.value;

	return {
		name: name,
		path: path,
		active: !!active,
	};
}

function addCustomTheme(edit = false, save = false)
{
	if(save)
	{
		const customThemes = storage.get('customThemes');

		if(edit !== false)
			customThemes[edit] = getCustomThemeInputValues();
		else
			customThemes.push(getCustomThemeInputValues());

		events.closeDialog();

		storage.set('customThemes', customThemes);
		updateCustomThemes();
		loadCustomThemes();
	}
	else
	{
		const customThemes = storage.get('customThemes');
		handlebarsContext.customTheme = edit !== false ? customThemes[edit] : false;
		currentCustomThemePath = edit !== false ? customThemes[edit].path : '';

		events.dialog({
			header: language.settings.theme.customThemes.main,
			width: 600,
			height: false,
			content: template.load('dialog.custom.theme.add.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.save,
					function: `theme.addCustomTheme(${edit}, true);`,
				}
			],
		});

		events.eventSwitch();
		events.eventInput();
	}
}

function editCustomTheme(key)
{
	addCustomTheme(key, false);
}

function activeCustomTheme(key, active)
{
	const customThemes = storage.get('customThemes');

	if(customThemes[key])
	{
		customThemes[key].active = active;
		storage.set('customThemes', customThemes);
		// updateCustomThemes();
	}

	loadCustomThemes();
}

function removeCustomTheme(key, confirm = false)
{
	if(confirm)
	{
		const customThemes = storage.get('customThemes');
		customThemes.splice(key, 1);
		storage.set('customThemes', customThemes);
		updateCustomThemes();
	}
	else
	{
		events.dialog({
			header: language.settings.theme.customThemes.delete,
			width: 400,
			height: false,
			content: language.settings.theme.customThemes.confirmDelete,
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.delete,
					function: 'events.closeDialog(); theme.removeCustomTheme('+key+', true);',
				}
			],
		});
	}
}

function start()
{
	const themeColors = [];

	for(let key in allColors.list)
	{
		const color = allColors.list[key];
		const tokens = getColorTokens(color);

		themeColors.push({
			key: color,
			name: language.settings.theme.colors[color] || (color.charAt(0).toUpperCase() + color.slice(1)),
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

	template.loadContentRight('theme.content.right.html', true);

	gamepad.updateBrowsableItems('theme');

	events.events();
	updateCustomThemes();
}

module.exports = {
	setColor,
	systemNightMode,
	loadCustomThemes,
	addCustomTheme,
	editCustomTheme,
	activeCustomTheme,
	removeCustomTheme,
	setCustomThemePath,
	start,
};