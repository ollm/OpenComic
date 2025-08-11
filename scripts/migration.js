
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

function removeJsonCache()
{
	console.time('Migration: removeJsonCache');

	let files = fs.readdirSync(cache.folder);

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];

		if(/\.json$/.test(file) || /\.json\.zstd$/.test(file))
			fs.unlinkSync(p.join(cache.folder, file));
	}

	console.timeEnd('Migration: removeJsonCache');
}

function clearCacheAndTemporaryFiles()
{
	console.time('Migration: clearCacheAndTemporaryFiles');

	settings.clearCache();
	settings.removeTemporaryFiles();

	console.timeEnd('Migration: clearCacheAndTemporaryFiles');
}

function clearPdfAndEpubCache()
{
	console.time('Migration: clearPdfAndEpubCache');

	const epubRegex = /([\/\\])([0-9]+)_sortonly/;
	const pdfRegex = /(pdf[\/\\])page-([0-9]+)\./;

	const files = fs.readdirSync(cache.folder);

	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];

		if(/^compressed-files-/.test(file))
		{
			try
			{
				const json = cache.readJson(file.replace(/\.zstd$/, ''));
				const first = json.files?.[0] ?? false;

				if(first)
				{
					if(epubRegex.test(first.path) || pdfRegex.test(first.path))
						fs.unlinkSync(p.join(cache.folder, file));
				}
			}
			catch
			{
				fs.unlinkSync(p.join(cache.folder, file));
			}
		}
	}

	cache.flushJsonMemory();

	console.timeEnd('Migration: clearPdfAndEpubCache');
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

function addLeadingZeros(regex, path)
{
	const page = app.extract(regex, path, 2);
	return String(page).padStart(4, '0');
}

function migrateEpubAndPdfToLeadingZeros(data)
{
	console.time('Migration: epubAndPdfToLeadingZeros');

	const epubRegex = /([\/\\])([0-9]+)_sortonly/;
	const pdfRegex = /(pdf[\/\\])page-([0-9]+)\./;

	clearPdfAndEpubCache();

	for(let path in data.bookmarks)
	{
		for(let i = 0, len = data.bookmarks[path].length; i < len; i++)
		{
			const _path = data.bookmarks[path][i].path;

			if(epubRegex.test(_path))
			{
				const number = addLeadingZeros(epubRegex, _path)
				data.bookmarks[path][i].path = _path.replace(epubRegex, '$1'+number+'_sortonly');
			}

			if(pdfRegex.test(_path))
			{
				const number = addLeadingZeros(pdfRegex, _path)
				data.bookmarks[path][i].path = _path.replace(pdfRegex, '$1page-'+number+'.');
			}
		}
	}

	for(let path in data.readingProgress)
	{
		const _path = data.readingProgress[path].path;

		if(epubRegex.test(_path))
		{
			const number = addLeadingZeros(epubRegex, _path)
			data.readingProgress[path].path = _path.replace(epubRegex, '$1'+number+'_sortonly');
		}

		if(pdfRegex.test(_path))
		{
			const number = addLeadingZeros(pdfRegex, _path)
			data.readingProgress[path].path = _path.replace(pdfRegex, '$1page-'+number+'.');
		}
	}

	console.timeEnd('Migration: epubAndPdfToLeadingZeros');

	return data;
}

function migrateOpeningBehavior(data)
{
	data.config.openingBehaviorFolder = data.config.whenOpenFolderFirstImageOrContinueReading ? 'continue-reading-first-page' : (data.config.whenOpenFolderContinueReading ? 'continue-reading' : 'file-list');
	data.config.openingBehaviorFile = data.config.whenOpenFileFirstImageOrContinueReading ? 'continue-reading-first-page' : (data.config.whenOpenFileContinueReading ? 'continue-reading' : 'file-list');

	return data;
}

function migrateControllerDeadZone(data)
{
	data.config.gamepadDeadZone = data.config.controllerDeadZone;

	return data;
}

function migrateMouseWheelEvents(data)
{
	if(data.shortcuts.reading.actionsConfigured.length) // Has custom shortcuts
	{
		const shortcuts = data.shortcuts.reading.shortcuts;

		shortcuts['MouseUp'] = data.config.readingTurnPagesWithMouseWheel ? 'prev' : 'zoomIn';
		shortcuts['MouseDown'] = data.config.readingTurnPagesWithMouseWheel ? 'next' : 'zoomOut';
		shortcuts['Ctrl+MouseUp'] = 'zoomIn';
		shortcuts['Ctrl+MouseDown'] = 'zoomOut';
		shortcuts['Shift+MouseUp'] = 'zoomUp';
		shortcuts['Shift+MouseDown'] = 'zoomDown';
		shortcuts['Shift+MouseLeft'] = 'zoomLeft';
		shortcuts['Shift+MouseRight'] = 'zoomRight';
		shortcuts['Alt+MouseUp'] = 'prev';
		shortcuts['Alt+MouseDown'] = 'next';
	}
	else if(data.config.readingTurnPagesWithMouseWheel) // Has turn pages with mouse wheel active but not custom shortcuts
	{
		(async function(){  // Delay until OpenComic has loaded

			await appBaseLoaded;

			settings.setTurnPagesWithMouseWheelShortcut(true, false);
			shortcuts.shortcuts();

		})();
	}

	return data;
}

function migrateIgnoreFilesRegex(data)
{
	if(data.config.ignoreFilesRegex)
		data.config.ignoreFilesRegex = [data.config.ignoreFilesRegex];

	return data;
}

function migratePasswordsAndTokensToSafeStorage(data)
{
	console.time('Migration: passwordsAndTokensToSafeStorag');

	if(data.config.trackingSites)
	{
		for(let key in data.config.trackingSites)
		{
			const site = data.config.trackingSites[key];

			site.access.pass = storage.safe.encrypt(site.access.pass);
			site.access.token = storage.safe.encrypt(site.access.token);
			site.session.token = storage.safe.encrypt(site.session.token);
		}
	}

	if(data.servers && data.servers.length)
	{
		for(const server of data.servers)
		{
			server.pass = storage.safe.encrypt(server.pass);
		}
	}

	if(data.opdsCatalogs && data.opdsCatalogs.length)
	{
		for(const catalog of data.opdsCatalogs)
		{
			catalog.pass = storage.safe.encrypt(catalog.pass);
		}
	}

	console.timeEnd('Migration: passwordsAndTokensToSafeStorag');

	return data;
}

function hasUnsupportedCharsInWindows(files)
{
	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];
		const path = file.path.replace(/^[a-z0-9]+\:/i, '');

		// Dots and spaces at the end of the filename
		if(/([\. ]+)([\\\/]|$)/.test(path))
			return true;

		// Unsupported characters
		if(/[<>:|?*"]/.test(path))
			return true;

		if(file.files && hasUnsupportedCharsInWindows(file.files))
			return true;
	}

	return false;
}

function migrateCompressedFilesWithUnsupportedCharsInWindows(data)
{
	if(process.platform !== 'win32')
		return data;

	console.time('Migration: compressedFilesWithUnsupportedCharsInWindows');

	const files = fs.readdirSync(cache.folder);

	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];

		if(/^compressed-files-/.test(file))
		{
			try
			{
				const json = cache.readJson(file.replace(/\.zstd$/, ''));

				if(hasUnsupportedCharsInWindows(json.files ?? []))
					fs.unlinkSync(p.join(cache.folder, file));
			}
			catch
			{
				fs.unlinkSync(p.join(cache.folder, file));
			}
		}
	}

	cache.flushJsonMemory();

	console.timeEnd('Migration: compressedFilesWithUnsupportedCharsInWindows');

	return data;
}

function migrateWebtoonNotEnlargeMoreThanOriginalSize(data)
{
	console.time('Migration: webtoonNotEnlargeMoreThanOriginalSize');

	if(data.config.readingWebtoon)
		data.config.readingNotEnlargeMoreThanOriginalSize = true;

	for(let key in data.readingShortcutPagesConfig)
	{
		if(data.readingShortcutPagesConfig[key]?.readingWebtoon)
			data.readingShortcutPagesConfig[key].readingNotEnlargeMoreThanOriginalSize = true;
	}

	for(let key in data.readingPagesConfig)
	{
		if(data.readingPagesConfig[key]?.readingWebtoon)
			data.readingPagesConfig[key].readingNotEnlargeMoreThanOriginalSize = true;
	}

	console.timeEnd('Migration: webtoonNotEnlargeMoreThanOriginalSize');

	return data;
}

function migrateSomeDataNewReadingProgress(data)
{
	console.time('Migration: someDataNewReadingProgress');

	for(const path in data.readingProgress)
	{
		const progress = data.readingProgress[path];

		if(!progress?.page)
			progress.page = progress.index;
	}

	console.timeEnd('Migration: someDataNewReadingProgress');

	return data;
}

function migrateSeparateOrderOfBrowsingAndReading(data)
{
	console.time('Migration: separateOrderOfBrowsingAndReading');

	data.config.sortReading = data.config.sort;
	data.config.sortInvertReading = data.config.sortInvert;
	data.config.foldersFirstReading = data.config.foldersFirst;

	console.timeEnd('Migration: separateOrderOfBrowsingAndReading');

	return data;
}

function start(data)
{
	let changes = data.config.changes;

	//if(changes < 75)
	//	compressJsonCache();

	if(changes < 77) // Fix ePub wrong filenames and clear cache
		data = fixEpubWrongFilenames(data);
	else if(changes < 79)
		removeJsonCache();

	if(changes < 92) // Change the old opening behavior setting
		data = migrateOpeningBehavior(data);

	if(changes < 99) // Change controllerDeadZone to gamepadDeadZone
		data = migrateControllerDeadZone(data);

	if(changes < 103) // Add the new mouse wheel events
		data = migrateMouseWheelEvents(data);

	if(changes < 107) // Change page-1 to page-0001 and 1_sortonly to 0001_sortonly
		data = migrateEpubAndPdfToLeadingZeros(data);

	if(changes < 108)
		data = migrateIgnoreFilesRegex(data);

	if(changes < 110) // Use safeStorage for passwords and tokens
		data = migratePasswordsAndTokensToSafeStorage(data);

	if(changes < 113) // Fix compressed files with unsupported characters in Windows
		data = migrateCompressedFilesWithUnsupportedCharsInWindows(data);

	if(changes < 119) // Fix compressed files with unsupported characters in Windows
		data = migrateWebtoonNotEnlargeMoreThanOriginalSize(data);

	if(changes < 125) // Add the index value to new page value
		data = migrateSomeDataNewReadingProgress(data);

	if(changes < 128) // Separate order of browsing and reading
		data = migrateSeparateOrderOfBrowsingAndReading(data);

	data = opds.addNewDefaultCatalogs(data, changes);

	return data;
}

module.exports = {
	start: start,
	compressJsonCache: compressJsonCache,
	removeJsonCache: removeJsonCache,
};