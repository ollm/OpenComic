
function compressJsonCache()
{
	console.time('Migration: compressJsonCache');

	let files = fs.readdirSync(cache.folder);

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];

		if(/\.json$/.test(file))
		{
			let json = fs.readFileSync(p.join(cache.folder, file));
			json = JSON.parse(json);

			cache.writeJsonSync(file, json);
			fs.unlinkSync(p.join(cache.folder, file));
		}
	}

	console.timeEnd('Migration: compressJsonCache');
}

function clearCacheAndTemporaryFiles()
{
	console.time('Migration: clearCacheAndTemporaryFiles');

	settings.clearCache();
	settings.removeTemporaryFiles();

	console.timeEnd('Migration: clearCacheAndTemporaryFiles');
}

function fixEpubWrongFilenames(data)
{
	console.time('Migration: fixEpubWrongFilenames');

	clearCacheAndTemporaryFiles();

	for(let path in data.bookmarks)
	{
		for(let i = 0, len = data.bookmarks[path].length; i < len; i++)
		{
			if(/([\/\\][0-9]+)\:sortonly/.test(data.bookmarks[path][i].path))
				data.bookmarks[path][i].path = data.bookmarks[path][i].path.replace(/([\/\\][0-9]+)\:sortonly/, '$1_sortonly');
		}
	}

	for(let path in data.readingProgress)
	{
		if(/([\/\\][0-9]+)\:sortonly/.test(data.readingProgress[path].path))
			data.readingProgress[path].path = data.readingProgress[path].path.replace(/([\/\\][0-9]+)\:sortonly/, '$1_sortonly');
	}

	console.timeEnd('Migration: fixEpubWrongFilenames');

	return data;
}

function start(data)
{
	let changes = data.config.changes;

	//if(changes < 75)
	//	compressJsonCache();

	if(changes < 77) // Fix ePub wrong filenames
		data = fixEpubWrongFilenames(data);

	return data;
}

module.exports = {
	start: start,
	compressJsonCache: compressJsonCache,
};