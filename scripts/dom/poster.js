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

function add(fromIndex = false, path = false, currentPoster = false)
{
	currentPath = path;
	addPosterInside = false;

	let canAddPoster = false;
	/*let currentPosterIsInside = false;

	if(currentPoster)
	{
		if(p.normalize(path) === p.normalize(p.dirname(currentPoster)))
			currentPosterIsInside = true;
	}*/

	if((fromIndex/* || currentPosterIsInside*/) && canAddPosterInside(path))
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

function setNewPoster(path)
{
	console.log(path, currentPath);

	let sha = sha1(path);
	let tmp = p.join(tempFolder, sha+'.jpg');

	let name = p.parse(currentPath).name;

	// /home/llopart/Imágenes/Pepper & Carrot.zip

	let posterPath = p.join(addPosterInside ? currentPath : p.dirname(currentPath), name+'.tbn');

	image.resize(path, tmp, {width: 1200, quality: 80}).then(function(image){

		if(fs.existsSync(posterPath))
			fs.unlinkSync(posterPath);

		mv(tmp, posterPath, async function(error) {

			if(!error)
			{
				await cache.deleteInCache(posterPath);

				dom.reloadIndex();
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

async function _delete(currentPoster = false)
{
	if(!fileManager.containsCompressed(currentPoster))
	{
		if(fs.existsSync(currentPoster))
			fs.unlinkSync(currentPoster);

		await cache.deleteInCache(currentPoster);

		dom.reloadIndex();
	}
	else
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

module.exports = {
	add: add,
	delete: _delete,
};