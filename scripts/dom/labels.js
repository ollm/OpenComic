
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

		if(isEmpty(_labels))
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

			for(let path in comicLabels)
			{
				let _labels = [];

				for(let i = 0, len = comicLabels[path].length; i < len; i++)
				{
					if(comicLabels[path][i] === prevName)
						_labels.push(name);
					else
						_labels.push(comicLabels[path][i]);
				}

				comicLabels[path] = _labels;
			}

			storage.set('labels', labels);
			storage.set('comicLabels', comicLabels);


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

		let name = labels[key];
		labels.splice(key, 1);

		for(let path in comicLabels)
		{
			let _labels = [];

			for(let i = 0, len = comicLabels[path].length; i < len; i++)
			{
				if(comicLabels[path][i] !== name)
					_labels.push(comicLabels[path][i]);
			}

			if(isEmpty(_labels))
				delete comicLabels[path];
			else
				comicLabels[path] = _labels;
		}

		deleteFromSortAndView('label', key);

		storage.set('labels', labels);
		storage.set('comicLabels', comicLabels);

		dom.loadIndexContentLeft(true, false);

		let prevIndexLabel = dom.prevIndexLabel();

		if(prevIndexLabel.label && prevIndexLabel.label === name)
			dom.loadIndexPage(true);

		editLabels();
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

module.exports = {
	masterFolder: masterFolder,
	setFavorite: setFavorite,
	favorites: favorites,
	label: label,
	server: server,
	setLabels: setLabels,
	newLabel: newLabel,
	editLabels: editLabels,
	editLabel: editLabel,
	deleteLabel: deleteLabel,
	deleteFromSortAndView: deleteFromSortAndView,
	menuItemSelector: menuItemSelector,
	getName: getName,
};