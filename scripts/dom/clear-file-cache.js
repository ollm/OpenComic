
async function getRecursiveFiles(path)
{
	const file = fileManager.file(path);
	let files = [];

	try
	{
		files = await file.read();
	}
	catch(error)
	{
		console.error(error);
		dom.compressedError(error);
	}

	file.destroy();

	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];

		if(file.folder || file.compressed)
		{
			const _files = await getRecursiveFiles(file.path);
			files = files.concat(_files);
		}
	}

	return files;
}

async function clear(path)
{
	const files = await getRecursiveFiles(path);

	files.push({
		path: path,
		folder: false, // It may be true, but it only matters if it is a compressed file
		compressed: fileManager.isCompressed(path),
	});

	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];

		if(!file.folder && !file.compressed)
		{
			await cache.deleteInCache(file.path);
		}
		else if(file.compressed)
		{
			const cacheFile = 'compressed-files-'+sha1(file.path)+'.json';
			cache.deleteJson(cacheFile);
		}
	}

	dom.reload();

	events.snackbar({
		key: 'clearFileCache',
		text: language.global.contextMenu.clearFileCacheSuccessfully,
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

module.exports = {
	clear: clear,
};