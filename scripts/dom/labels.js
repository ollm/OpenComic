
function masterFolder(folder, index)
{
	dom.setIndexLabel({masterFolder: folder, index: index, name: p.basename(folder)});
	dom.loadIndexPage(true);
}

function setFavorite(path)
{
	let favorites = storage.get('favorites');

	if(favorites[path])
		delete favorites[path];
	else
		favorites[path] = {added: time()};

	storage.set('favorites', favorites);

	let prevIndexLabel = dom.prevIndexLabel();

	if(prevIndexLabel.favorites)
		dom.reload();
}

function favorites()
{
	dom.setIndexLabel({favorites: true, name: language.global.favorites});
	dom.loadIndexPage(true);
}

async function _opds(url = false, index = false, title = false)
{
	dom.setIndexLabel({opds: true, index: index, name: language.global.catalogs});
	await dom.loadIndexPage(true);

	if(url)
	{
		dom.setIndexLabel({opds: true, index: index, name: title});

		const base64 = opds.opds.base64(url);
		opds.addPathName(base64, title);

		const path = 'opds:/'+base64;
		await dom.loadIndexPage(true, path, false, false, path);
	}
}

function label(name, index)
{
	dom.setIndexLabel({label: name, index: index, name: name});
	dom.loadIndexPage(true);
}

function server(path, index, name)
{
	dom.setIndexLabel({server: path, index: index, name: name});
	dom.loadIndexPage(true);
}

function deleteFromSortAndView(name, index)
{
	let sortAndView = {};

	let regex = new RegExp('^'+pregQuote(name));

	for(let key in config.sortAndView)
	{
		if(regex.test(key))
		{
			let _index = +app.extract(/([0-9]+)/, key, 1);

			if(_index !== index)
			{
				if(_index < index)
					sortAndView[key] = config.sortAndView[key];
				else
					sortAndView[name+'-'+(_index - 1)] = config.sortAndView[key];
			}
		}
		else
		{
			sortAndView[key] = config.sortAndView[key];
		}
	}

	storage.updateVar('config', 'sortAndView', sortAndView);
}

var labelsDialogPath = false;

function setLabels(path, save = false)
{
	if(save)
	{
		let labels = storage.get('labels');
		let comicLabels = storage.get('comicLabels');

		let _labels = [];

		let inputs = template._globalElement().querySelectorAll('.dialog .checkbox input');

		for(let i = 0, len = inputs.length; i < len; i++)
		{
			let input = inputs[i];
			let key = +input.dataset.key;
			let value = +input.value;

			if(value && labels[key])
				_labels.push(labels[key]);
		}

		if(!_labels.length)
			delete comicLabels[labelsDialogPath];
		else
			comicLabels[labelsDialogPath] = _labels;

		storage.set('comicLabels', comicLabels);

		labelsDialogPath = false;

		let prevIndexLabel = dom.prevIndexLabel();

		if(prevIndexLabel.label)
			dom.reload();
	}
	else
	{
		labelsDialogPath = path;

		let labels = storage.get('labels');
		let comicLabels = storage.get('comicLabels');
		comicLabels = comicLabels[path] || [];

		let _labels = [];

		for(let i = 0, len = labels.length; i < len; i++)
		{
			let label = labels[i];

			_labels.push({
				key: i,
				name: label,
				active: inArray(label, comicLabels), 
			});
		}

		_labels.sort(function(a, b){

			if(a.name === b.name)
				return 0;

			return a.name > b.name ? 1 : -1;

		});

		handlebarsContext.labels = _labels;

		events.dialog({
			header: language.global.labels,
			width: 400,
			height: false,
			content: template.load('dialog.labels.set.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.save,
					function: 'events.closeDialog(); dom.labels.setLabels(false, true);',
				}
			],
		});

		// events.eventCheckbox();
	}
}

function newLabel(save = false, fromEditLabels = false)
{
	if(save)
	{
		let name = document.querySelector('.input-new-label').value;
		if(!name) return;

		let labels = storage.get('labels');

		let exists = false;

		for(let i = 0, len = labels.length; i < len; i++)
		{
			let label = labels[i];

			if(label == name)
			{
				exists = true;
				break;
			}
		}

		if(!exists)
		{
			labels.push(name);
			storage.set('labels', labels);

			if(fromEditLabels)
				editLabels();
			else if(labelsDialogPath)
				setLabels(labelsDialogPath);
			else if(labelsShortcutPageConfig)
				setShortcutPageConfigLabels();

			if(!labelsShortcutPageConfig) dom.loadIndexContentLeft(true, false);
		}
		else
		{
			events.snackbar({
				key: 'labelExists',
				text: language.dialog.labels.labelExists,
				duration: 6,
				update: true,
				buttons: [
					{
						text: language.buttons.dismiss,
						function: 'events.closeSnackbar();',
					},
				],
			});
		}
	}
	else
	{
		handlebarsContext.labelName = '';

		events.dialog({
			header: language.global.labels,
			width: 400,
			height: false,
			content: template.load('dialog.labels.new.html'),
			onClose: fromEditLabels ? 'dom.labels.editLabels();' : '',
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();'+(fromEditLabels ? 'dom.labels.editLabels();' : ''),
				},
				{
					text: language.buttons.save,
					function: 'dom.labels.newLabel(true, '+(fromEditLabels ? 'true' : 'false')+');',
				}
			],
		});

		events.focus('.input-new-label');
		events.eventInput();
	}
}

function editLabels()
{
	let labels = storage.get('labels');
	let _labels = [];

	for(let i = 0, len = labels.length; i < len; i++)
	{
		let label = labels[i];

		_labels.push({
			key: i,
			name: label,
		});
	}

	_labels.sort(function(a, b){

		if(a.name === b.name)
			return 0;

		return a.name > b.name ? 1 : -1;

	});

	handlebarsContext.labels = _labels;

	events.dialog({
		header: language.global.labels,
		width: 400,
		height: false,
		content: template.load('dialog.labels.edit.html'),
		buttons: [
			{
				text: language.buttons.close,
				function: 'events.closeDialog();',
			}
		],
	});
}

function editLabel(key, save = false)
{
	if(save)
	{
		let name = document.querySelector('.input-new-label').value;
		if(!name) return;

		let labels = storage.get('labels');
		let comicLabels = storage.get('comicLabels');
		let readingShortcutPagesConfig = storage.get('readingShortcutPagesConfig');

		let prevName = labels[key];
		let exists = false;

		for(let i = 0, len = labels.length; i < len; i++)
		{
			let label = labels[i];

			if(label == name)
			{
				exists = true;
				break;
			}
		}

		if(!exists || prevName === name)
		{
			labels[key] = name;

			// Update label name in comicLabels
			for(let path in comicLabels)
			{
				const _labels = [];

				for(let i = 0, len = comicLabels[path].length; i < len; i++)
				{
					const label = comicLabels[path][i];

					if(label === prevName)
						_labels.push(name);
					else
						_labels.push(label);
				}

				if(!_labels.length)
					delete comicLabels[path];
				else
					comicLabels[path] = _labels;
			}

			// Update label name in readingShortcutPagesConfig
			for(let index in readingShortcutPagesConfig)
			{
				const _labels = [];

				for(let i = 0, len = readingShortcutPagesConfig[index].labels.length; i < len; i++)
				{
					const label = readingShortcutPagesConfig[index].labels[i];

					if(label === prevName)
						_labels.push(name);
					else
						_labels.push(label);
				}

				readingShortcutPagesConfig[index].labels = _labels;
			}

			storage.set('labels', labels);
			storage.set('comicLabels', comicLabels);
			storage.set('readingShortcutPagesConfig', readingShortcutPagesConfig);

			editLabels();

			dom.loadIndexContentLeft(true, false);
		}
		else
		{
			events.snackbar({
				key: 'labelExists',
				text: language.dialog.labels.labelExists,
				duration: 6,
				update: true,
				buttons: [
					{
						text: language.buttons.dismiss,
						function: 'events.closeSnackbar();',
					},
				],
			});
		}
	}
	else
	{
		let labels = storage.get('labels');
		handlebarsContext.labelName = labels[key];

		events.dialog({
			header: language.global.labels,
			width: 400,
			height: false,
			content: template.load('dialog.labels.new.html'),
			onClose: 'dom.labels.editLabels();',
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog(); dom.labels.editLabels();',
				},
				{
					text: language.buttons.save,
					function: 'dom.labels.editLabel('+key+', true);',
				}
			],
		});

		events.focus('.input-new-label');
		events.eventInput();
	}
}

function deleteLabel(key, confirm = false)
{
	if(confirm)
	{
		let labels = storage.get('labels');
		let comicLabels = storage.get('comicLabels');
		let readingShortcutPagesConfig = storage.get('readingShortcutPagesConfig');

		let name = labels[key];
		labels.splice(key, 1);

		// Delete label name in comicLabels
		for(let path in comicLabels)
		{
			const _labels = [];

			for(let i = 0, len = comicLabels[path].length; i < len; i++)
			{
				if(comicLabels[path][i] !== name)
					_labels.push(comicLabels[path][i]);
			}

			if(!_labels.length)
				delete comicLabels[path];
			else
				comicLabels[path] = _labels;
		}

		// Delete label name in readingShortcutPagesConfig
		for(let index in readingShortcutPagesConfig)
		{
			const _labels = [];

			for(let i = 0, len = readingShortcutPagesConfig[index].labels.length; i < len; i++)
			{
				const label = readingShortcutPagesConfig[index].labels[i];

				if(label !== name)
					_labels.push(label);
			}

			readingShortcutPagesConfig[index].labels = _labels;
		}

		deleteFromSortAndView('label', key);

		storage.set('labels', labels);
		storage.set('comicLabels', comicLabels);
		storage.set('readingShortcutPagesConfig', readingShortcutPagesConfig);

		dom.loadIndexContentLeft(true, false);

		let prevIndexLabel = dom.prevIndexLabel();

		if(prevIndexLabel.label && prevIndexLabel.label === name)
			dom.loadIndexPage(true);

		editLabels();

		reading.purgeGlobalReadingPagesConfig();
	}
	else
	{
		events.dialog({
			header: language.dialog.labels.deleteLabel,
			width: 400,
			height: false,
			content: language.dialog.labels.confirmDelete,
			onClose: 'dom.labels.editLabels();',
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog(); dom.labels.editLabels();',
				},
				{
					text: language.buttons.remove,
					function: 'dom.labels.deleteLabel('+key+', true);',
				}
			],
		});
	}
}

function menuItemSelector(labels)
{
	if(labels.favorites)
		return 'favorites';
	else if(labels.opds)
		return 'opds'+(labels.index !== false ? '-'+labels.index : '');
	else if(labels.masterFolder)
		return 'master-folder-'+labels.index;
	else if(labels.label)
		return 'label-'+labels.index;
	else if(labels.server)
		return 'server-'+labels.index;

	return '';
}

function getName(indexLabel, recentlyOpened)
{
	if(indexLabel)
		return indexLabel.name;
	else if(recentlyOpened)
		return language.global.recentlyOpened;

	return language.global.library;
}

function has(path, parents = false)
{
	const comicLabels = storage.get('comicLabels');

	if(comicLabels[path])
		return comicLabels[path];

	if(parents)
	{
		while(path)
		{
			path = p.dirname(path);

			if(comicLabels[path])
				return comicLabels[path];

			const sections = path.split(p.sep).filter(Boolean);

			if(sections.length <= 1)
				break;
		}
	}

	return false;
}

// Labels functions related to reading shortcut page config
var labelsShortcutPageConfig = false;

function setShortcutPageConfigLabels(save = false)
{
	if(save)
	{
		const labels = storage.get('labels');
		const _labels = [];

		const inputs = template._globalElement().querySelectorAll('.dialog .checkbox input');

		for(let i = 0, len = inputs.length; i < len; i++)
		{
			const input = inputs[i];
			const key = +input.dataset.key;
			const value = +input.value;

			if(value && labels[key])
				_labels.push(labels[key]);
		}

		labelsShortcutPageConfig = false;

		reading.updateReadingPagesConfig('labels', _labels);
		reading.updateConfigLabels();
		reading.purgeGlobalReadingPagesConfig();
	}
	else
	{
		const labels = storage.get('labels');
		const _labels = [];

		for(let i = 0, len = labels.length; i < len; i++)
		{
			const label = labels[i];

			_labels.push({
				key: i,
				name: label,
				active: _config.labels.includes(label),
			});
		}

		_labels.sort(function(a, b){

			if(a.name === b.name)
				return 0;

			return a.name > b.name ? 1 : -1;

		});

		handlebarsContext.labels = _labels;

		events.dialog({
			header: language.global.labels,
			width: 400,
			height: false,
			content: template.load('dialog.labels.set.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.save,
					function: 'events.closeDialog(); dom.labels.setShortcutPageConfigLabels(true);',
				}
			],
		});

		labelsShortcutPageConfig  = true;

		// events.eventCheckbox();
	}
}

function removeLabelFromShortcutPageConfig(label = '')
{
	const labels = [];

	for(let i = 0, len = _config.labels.length; i < len; i++)
	{
		const _label = _config.labels[i];

		if(_label !== label)
			labels.push(_label);
	}

	reading.updateReadingPagesConfig('labels', labels);
	reading.updateConfigLabels();
	reading.purgeGlobalReadingPagesConfig();
}

function applyShortcutPageConfigToAll(label = '', apply = false)
{
	if(apply)
	{
		const readingPagesConfig = storage.get('readingPagesConfig');

		for(let path in readingPagesConfig)
		{
			const labels = has(path);

			if(labels && labels.includes(label))
				delete readingPagesConfig[path];
		}

		storage.set('readingPagesConfig', readingPagesConfig);
	}
	else
	{
		events.dialog({
			header: language.dialog.pages.readingConfigApplyToAllLabel,
			width: 400,
			height: false,
			content: language.dialog.pages.readingConfigApplyToAllLabelDescription,
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.apply,
					function: 'events.closeDialog(); dom.labels.applyShortcutPageConfigToAll(\''+escapeQuotes(escapeBackSlash(label), 'simples')+'\', true);',
				}
			],
		});
	}
}

module.exports = {
	masterFolder: masterFolder,
	setFavorite: setFavorite,
	favorites: favorites,
	opds: _opds,
	label: label,
	server: server,
	setLabels: setLabels,
	newLabel: newLabel,
	editLabels: editLabels,
	editLabel: editLabel,
	deleteLabel: deleteLabel,
	deleteFromSortAndView: deleteFromSortAndView,
	has: has,
	menuItemSelector: menuItemSelector,
	getName: getName,

	setShortcutPageConfigLabels: setShortcutPageConfigLabels,
	removeLabelFromShortcutPageConfig: removeLabelFromShortcutPageConfig,
	applyShortcutPageConfigToAll: applyShortcutPageConfigToAll,
};