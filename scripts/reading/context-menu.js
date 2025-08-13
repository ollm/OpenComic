
function show(gamepad = false)
{
	const saveImages = (reading.isCanvas() || reading.isEbook()) ? false : true;
	dom.queryAll('.separator-set-as-poster, .separator-save-images, .reading-context-menu-save-image, .reading-context-menu-save-all-images, .reading-context-menu-save-bookmarks-images, .reading-context-menu-save-all-bookmarks-images, .reading-context-menu-set-as-poster, .reading-context-menu-set-as-poster-folders').css({display: saveImages ? '' : 'none'});

	if(saveImages)
	{
		const setAsPoster = /app\.asar\.unpacked/.test(reading.readingCurrentPath()) ? false : true;
		dom.queryAll('.separator-set-as-poster, .reading-context-menu-set-as-poster, .reading-context-menu-set-as-poster-folders').css({display: setAsPoster ? '' : 'none'});
	}

	if(gamepad)
		events.activeMenu('#reading-context-menu', false, 'gamepad');
	else
		events.activeContextMenu('#reading-context-menu');
}

function getVars()
{
	const currentPath = onReading ? reading.readingCurrentPath() : dom.history.path;
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
		electron.shell.openPath(vars.currentPath)
	else
		electron.shell.showItemInFolder(fileManager.firstCompressedFile(vars.currentPath))
}

function aboutFile()
{
	const vars = getVars();

	dom.fileInfo.show(vars.pathIsFolder ? vars.currentPath : fileManager.lastCompressedFile(vars.currentPath));
}

function getCurrentImage()
{
	const currentIndex = reading.currentIndex() - 1;

	const images = reading.images();
	const imagesData = reading.imagesData();

	for(let key in images)
	{
		if(currentIndex == imagesData[key].position)
			return images[key].path;
	}

	return false;	
}

function setAsPoster()
{
	const image = getCurrentImage();
	if(!image) return;

	dom.poster.setAsPoster(image);
}

function setAsPosterFolders()
{
	const image = getCurrentImage();
	if(!image) return;

	dom.poster.setAsPosterFolders(image, dom.history.mainPath);
}

function generateFileName(path, page, leadingZeros, fileName)
{
	// Parent folder name
	let parentFolderName = p.dirname(p.dirname(path));
	let ext1 = p.extname(parentFolderName);
	parentFolderName = p.basename(parentFolderName, (ext1 && ext1.length < 6 ? ext1 : ''));

	// Current file/folder name
	let folderName = p.dirname(path);
	let ext2 = p.extname(folderName);
	folderName = p.basename(folderName, (ext2 && ext2.length < 6 ? ext2 : ''));

	const extension = p.extname(path);
	const imageName = p.basename(path, extension);

	fileName = fileName.replace(/\[parentFolder(?:Name)?\]/, parentFolderName);
	fileName = fileName.replace(/\[folder(?:Name)?\]/, folderName);
	fileName = fileName.replace(/\[image(?:Name)?\]/, imageName);
	fileName = fileName.replace(/\[page\]/, String(page).padStart(leadingZeros, '0'));
	fileName = fileName.replace(/\[pageInt\]/, page);

	let ext3 = p.extname(fileName);
	if(!ext3 || ext3.length >= 6) fileName += extension;

	return fileName;
}

function saveImage()
{
	const position = reading.currentImagePosition();
	saveAllImages(position);
}

function saveAllImages(position = false, _return = false)
{
	const images = reading.images();
	const imagesData = reading.imagesData();

	const toSave = [];
	let highestPage = 0;

	for(let key in images)
	{
		const path = images[key].path;

		if(position === false || position == imagesData[key].position)
			toSave.push({path: path, page: key});

		if(+key > highestPage)
			highestPage = +key;
	}

	if(_return)
		return toSave;

	saveImages(toSave, String(highestPage).length);
}

function saveBookmarksImages(loadBookmarks = false)
{
	saveAllBookmarksImages(loadBookmarks, true);
}

function saveAllBookmarksImages(loadBookmarks = false, onlyCurrent = false)
{
	if(loadBookmarks) reading.loadBookmarks();
	const bookmarks = handlebarsContext.bookmarks;

	const toSave = [];
	let highestPage = 0;

	for(let i = 0, len = bookmarks.length; i < len; i++)
	{
		const folder = bookmarks[i];

		if((!onlyCurrent || folder.current) && !folder.continueReading)
		{
			for(let i = 0, len = folder.bookmarks.length; i < len; i++)
			{
				const bookmark = folder.bookmarks[i];

				toSave.push({path: bookmark.path, page: bookmark.index});

				if(bookmark.index > highestPage)
					highestPage = bookmark.index;
			}
		}
	}

	saveImages(toSave, String(highestPage).length);
}

function saveImages(toSave = [], leadingZeros = 3)
{
	if(config.saveImageToFolder)
	{
		const saveImageFolder = relative.resolve(config.saveImageFolder);
		fileManager.macosStartAccessingSecurityScopedResource(saveImageFolder);
		_saveImages(toSave, leadingZeros, saveImageFolder, config.saveImageTemplate);
	}
	else
	{
		const saveDialog = macosMAS ? saveDialogDirectory : saveDialogFile;

		saveDialog(async function(saveTo, fileName){

			_saveImages(toSave, leadingZeros, saveTo, fileName);

		});
	}

}

async function _saveImages(toSave = [], leadingZeros = 3, saveTo, fileName)
{
	const currentTime = new Date();
	let first = '';

	if(toSave.length)
	{
		let file = fileManager.file(p.dirname(toSave[0].path));
		await file.makeAvailable(toSave);
		file.destroy();

		for(let i = 0, len = toSave.length; i < len; i++)
		{
			const image = toSave[i];
			const realPath = fileManager.realPath(image.path);
			const saveImageTo = fileManager.genearteFilePath(saveTo, generateFileName(image.path, image.page, leadingZeros, fileName));
			if(first === '') first = saveImageTo;

			if(!fs.existsSync(saveImageTo))
			{
				fs.copyFileSync(realPath, saveImageTo);
				fs.utimes(saveImageTo, currentTime, currentTime, function(){});
			}
		}
	
		events.snackbar({
			key: 'saveAllImages',
			text: language.global.contextMenu.saveImagesMessage,
			duration: 6,
			buttons: [
				{
					text: language.global.open,
					function: 'electron.shell.showItemInFolder(\''+escapeQuotes(escapeBackSlash(first), 'simples')+'\');',
				},
			],
		});
	}
	else
	{
		console.error('No images to save');
	}
}

function saveDialogFile(callback)
{
	electronRemote.dialog.showSaveDialog({properties: ['openDirectory', 'createDirectory'], buttonLabel: language.buttons.save, defaultPath: config.saveImageTemplate}).then(function(result) {

		if(!result.canceled && result.filePath)
			callback(p.dirname(result.filePath), p.basename(result.filePath));

	});
}

function saveDialogDirectory(callback)
{
	electronRemote.dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory'], buttonLabel: language.buttons.save}).then(function(files) {

		if(files.filePaths && files.filePaths[0] && fs.statSync(files.filePaths[0]).isDirectory())
			callback(files.filePaths[0], (config.saveImageTemplate === '[parentFolder] - [folder] - [image] - [page]' ? '[folder] - [image] - [page]' : config.saveImageTemplate));

	});
}

async function copyImageToClipboard()
{
	const position = reading.currentImagePosition();
	let images = saveAllImages(position, true);
	let len = images.length;

	if(!len)
		return;

	if(_config.readingManga && !reading.readingViewIs('scroll'))
		images = images.reverse();

	for(let i = 0; i < len; i++)
	{
		images[i].image = fileManager.realPath(images[i].path);
	}

	const sizes = await image.getSizes(images);
	let maxHeight = 0;

	for(let i = 0; i < len; i++)
	{
		const size = sizes[i];

		if(size.height > maxHeight)
			maxHeight = size.height;
	}

	// Generate new sizes
	const resizes = [];
	let sumWidth = 0;

	for(let i = 0; i < len; i++)
	{
		const size = sizes[i];
		const factor = maxHeight / size.height;
		const width = Math.round(size.width * factor);

		resizes.push({
			width: width,
			height: Math.round(size.height * factor),
		});

		sumWidth += width;
	}

	// Resize images to blob and put them on canvas
	const canvas = document.createElement('canvas');
	canvas.width = sumWidth;
	canvas.height = maxHeight;
	const ctx = canvas.getContext('2d');

	let left = 0;

	for(let i = 0; i < len; i++)
	{
		let src = images[i].image;

		const size = resizes[i];
		const options = {
			width: size.width,
			height: size.height,
			kernel: 'lanczos3',
			compressionLevel: 0,
		};

		if(compatible.image.blob(src)) // Convert unsupported images to blob
		{
			src = await workers.convertImageToBlob(src, {priorize: true});
			options.blob = true;
		}

		let data = await image.resizeToBlob(src, options);

		// Draw image
		const img = new Image();
		img.src = data.blob;
		await img.decode();
		ctx.drawImage(img, left, 0);

		left += size.width;

		URL.revokeObjectURL(data.blob);
	}

	const nativeImage = electron.nativeImage.createFromDataURL(canvas.toDataURL());

	electron.clipboard.writeImage(nativeImage, 'clipboard');

	events.snackbar({
		key: 'copyImageToClipboard',
		text: language.global.contextMenu.copyImageMessage,
		duration: 6,
		buttons: [
			{
				text: language.buttons.dismiss,
				function: 'events.closeSnackbar();',
			},
		],
	});
}

module.exports = {
	show: show,
	openFileLocation: openFileLocation,
	aboutFile: aboutFile,
	setAsPoster: setAsPoster,
	setAsPosterFolders: setAsPosterFolders,
	saveImage: saveImage,
	saveAllImages: saveAllImages,
	saveBookmarksImages: saveBookmarksImages,
	saveAllBookmarksImages: saveAllBookmarksImages,
	copyImageToClipboard: copyImageToClipboard,
};