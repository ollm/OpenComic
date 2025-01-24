const mv = require('mv');

function canAddPosterInside(path = false)
{
	if(fileManager.containsCompressed(path))
		return false;
	else
		return true;
}

function canAddPosterOutside(path = false)
{
	if(fileManager.containsCompressed(p.dirname(path)))
		return false;
	else
		return true;
}

var currentPath = '', addPosterInside = false;

function add(fromIndexNotMasterFolders = false, path = false, currentPoster = false)
{
	currentPath = path;
	addPosterInside = false;

	let canAddPoster = false;

	if((fromIndexNotMasterFolders) && canAddPosterInside(path))
		addPosterInside = true;

	if(addPosterInside || canAddPosterOutside(path))
		canAddPoster = true;

	if(canAddPoster)
	{
		openDialog(path);
	}
	else
	{
		events.snackbar({
			key: 'cannotAddPoster',
			text: language.global.contextMenu.cannotAddPoster,
			duration: 14,
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

function openDialog(path)
{
	let dialog = electronRemote.dialog;

	dialog.showOpenDialog({properties: ['openFile'], defaultPath: fileManager.containsCompressed(path) ? p.dirname(path) : path, filters: [{name: language.global.comics, extensions: [...compatibleImageExtensions, ...compatibleSpecialExtensions]}]}).then(function (files) {

		if(files.filePaths && files.filePaths[0])
			setNewPoster(files.filePaths[0]);

	});
}

function setNewPoster(path, reload = true, message = false)
{
	let sha = sha1(path);
	let tmp = p.join(tempFolder, sha+'.jpg');

	let name = p.parse(currentPath).name;

	let posterPath = p.join(addPosterInside ? currentPath : p.dirname(currentPath), name+'.tbn');

	image.resize(path, tmp, {width: 1200, quality: 80}).then(function(image){

		if(fs.existsSync(posterPath))
			fs.unlinkSync(posterPath);

		mv(tmp, posterPath, async function(error) {

			if(!error)
			{
				await cache.deleteInCache(posterPath);

				if(message)
				{
					events.snackbar({
						key: 'setNewPoster',
						text: language.global.contextMenu.posterSetSuccessfully,
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

				if(reload) dom.reload();
			}
			else
			{
				console.log(error);

				events.snackbar({
					key: 'setNewPoster',
					text: 'Error',
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

		});

	}).catch(function(){

		events.snackbar({
			key: 'setNewPoster',
			text: 'Error',
			duration: 6,
			update: true,
			buttons: [
				{
					text: language.buttons.dismiss,
					function: 'events.closeSnackbar();',
				},
			],
		});

	});

}

async function _delete(currentPoster = false, moveToTrash = false, silent = false)
{
	if(!fileManager.containsCompressed(currentPoster))
	{
		if(fs.existsSync(currentPoster))
		{
			if(moveToTrash)
				await electron.shell.trashItem(currentPoster);
			else
				fs.unlinkSync(currentPoster);
		}

		await cache.deleteInCache(currentPoster);

		if(!silent) dom.reload();
	}
	else if(!silent)
	{
		events.snackbar({
			key: 'cannotDeletePoster',
			text: language.global.contextMenu.cannotDeletePoster,
			duration: 14,
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

async function findAndDelete(path, moveToTrash = false, silent = true)
{
	let images = [];

	try
	{
		let file = fileManager.file(path, {subtask: true});
		images = await file.images(2, false, true);
		file.destroy();
	}
	catch{}

	let poster = !Array.isArray(images) ? images : false;

	if(poster && !poster.fromFirstImageAsPoster)
		await _delete(poster.path, moveToTrash, silent);
}

async function setAsPoster(path, _currentPath = false)
{
	currentPath = _currentPath || p.dirname(path);
	addPosterInside = false;

	if(canAddPosterOutside(currentPath))
	{
		let file = fileManager.file(path);
		await file.makeAvailable([{path: path}]);
		file.destroy();

		await setNewPoster(fileManager.realPath(path), false, true);
	}
	else
	{
		events.snackbar({
			key: 'cannotAddPoster',
			text: language.global.contextMenu.cannotAddPoster,
			duration: 14,
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

async function setAsPosterFolders(path, mainPath, folderPath = false, confirm = false)
{
	if(confirm)
	{
		events.closeDialog();
		await setAsPoster(path, folderPath);
	}
	else
	{
		const dirname = p.dirname(mainPath);
		const segments = fileManager.splitPath(fileManager.removePathPart(path, dirname));
		segments.pop();

		const posterFolders = [];
		let _path = dirname;

		for(let i = 0, len = segments.length; i < len; i++)
		{
			_path = p.join(_path, segments[i]);

			posterFolders.push({
				name: segments[i],
				image: path,
				path: _path,
			});
		}

		handlebarsContext.posterFolders = posterFolders;

		events.dialog({
			header: language.global.contextMenu.setAsPosterFolders,
			width: 600,
			height: false,
			content: template.load('dialog.poster.folders.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				}
			],
		});

	}
}

module.exports = {
	add: add,
	delete: _delete,
	findAndDelete: findAndDelete,
	setAsPoster: setAsPoster,
	setAsPosterFolders: setAsPosterFolders,
};