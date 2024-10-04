
function show(gamepad = false)
{
	const saveImages = (reading.isCanvas() || reading.isEbook()) ? false : true;
	dom.queryAll('.separator-save-images, .reading-context-menu-save-image, .reading-context-menu-save-all-images').css({display: saveImages ? '' : 'none'});

	if(gamepad)
		events.activeMenu('#reading-context-menu', false, 'gamepad');
	else
		events.activeContextMenu('#reading-context-menu');
}

function getVars()
{
	const indexPathA = dom.indexPathA();
	const currentPath = onReading ? reading.readingCurrentPath() : indexPathA;
	const pathIsFolder = (currentPath && fs.existsSync(currentPath) && fs.statSync(currentPath).isDirectory()) ? true : false;

	return {
		currentPath: currentPath,
		pathIsFolder: pathIsFolder,
	};
}

function openFileLocation()
{
	const vars = getVars();

	if(vars.pathIsFolder)
		electron.shell.showItemInFolder(p.join(vars.currentPath, '.null'))
	else
		electron.shell.showItemInFolder(fileManager.firstCompressedFile(vars.currentPath))
}

function aboutFile()
{
	const vars = getVars();

	dom.fileInfo.show(vars.pathIsFolder ? vars.currentPath : fileManager.lastCompressedFile(vars.currentPath));
}

function saveImage()
{
	const currentIndex = reading.currentIndex();
	saveAllImages(currentIndex - 1);
}

function saveAllImages(index = false)
{
	const images = reading.images();
	const imagesData = reading.imagesData();

	electronRemote.dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory'], buttonLabel: language.buttons.save}).then(async function(files) {

		if(files.filePaths && files.filePaths[0] && fs.statSync(files.filePaths[0]).isDirectory())
		{
			const saveTo = files.filePaths[0];
			const toSave = [];

			for(let key in images)
			{
				const path = images[key].path;

				if(index === false || index == imagesData[key].position)
					toSave.push({path: path});
			}

			if(toSave.length)
			{
				let file = fileManager.file(p.dirname(toSave[0].path));
				await file.makeAvailable(toSave);
				file.destroy();


				for(let i = 0, len = toSave.length; i < len; i++)
				{
					const realPath = fileManager.realPath(toSave[i].path);
					const saveImageTo = p.join(saveTo, p.basename(realPath));

					if(!fs.existsSync(saveImageTo))
						fs.copyFileSync(realPath, saveImageTo);
				}
			}

			events.snackbar({
				key: 'saveAllImages',
				text: language.global.contextMenu.saveImagesMessage,
				duration: 6,
				buttons: [
					{
						text: language.global.open,
						function: 'electron.shell.showItemInFolder(\''+escapeQuotes(escapeBackSlash(p.join(saveTo, '.null')), 'simples')+'\');',
					},
				],
			});
		}

	});
}

module.exports = {
	show: show,
	openFileLocation: openFileLocation,
	aboutFile: aboutFile,
	saveImage: saveImage,
	saveAllImages: saveAllImages,
};