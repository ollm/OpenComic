var saveIsActive = false;

function save(path = false, mainPath = false)
{
	if(!onReading || !reading.isLoaded())
		return;

	reading.hideMouseInFullscreen();

	if(!saveIsActive)
		return;

	if(!path)
	{
		const image = reading.getImage(reading.currentPage());
		path = p.normalize(image.path);
	}

	const dirname = p.dirname(path);

	if(mainPath === false)
	{
		mainPath = dom.history.mainPath;

		// Save also the current folder progress
		if(mainPath !== dirname)
			save(path, dirname);
	}

	const hasChildFolders = Object.values(reading.currentComics()).find((comic) => comic.folder);
	const isParent = mainPath !== dirname || hasChildFolders ? true : false;

	// Calculate progress of eBook
	let progress = 0;
	let chapterIndex = 0;
	let chapterProgress = 0;

	if(reading.isEbook())
	{
		const page = reading._ebook.pages[reading.currentPage()];

		progress = page.progress;
		chapterIndex = page.chapterIndex;
		chapterProgress = page.chapterProgress;
	}

	// Calculate general progress in pages
	let currentPage = reading.currentPage();
	const totalPages = reading.totalPages();

	if(reading.doublePage() && totalPages - currentPage === 1)
		currentPage++;

	const percent = (totalPages === 1) ? 0 : (((currentPage - 1) / (totalPages - 1)) * 100);

	storage.updateVar('readingProgress', mainPath, {
		index: currentPage,
		path: path.replace(/\?page=[0-9]+$/, ''),
		lastReading: Date.now(),
		ebook: reading.isEbook(),
		progress: progress,
		chapterIndex: chapterIndex,
		chapterProgress: chapterProgress,
		// Visible progress
		page: !isParent ? currentPage : 0, // Calculate from childrens if is parent
		pages: !isParent ? totalPages : 0, // Calculate from childrens if is parent
		percent: !isParent ? percent : 0, // Calculate from childrens if is parent
		completed: !isParent ? (currentPage >= totalPages) : false, // Calculate from childrens if is parent
	});

	dom.history.updateLastComic(path);

	return true;
}

var interval = false;

function _setInterval()
{
	clearTimeout(interval);
	interval = setInterval(save, 60 * 2 * 1000); // Save every 2 minutes
}

async function get(path, cache = true, cacheOnly = false)
{
	const _readPages = await readPages(path);
	const totalPages = await countPages(path, cache, cacheOnly);

	let percent = (totalPages === 1) ? 0 : ((((_readPages || 1) - 1) / (totalPages - 1)) * 100);
	if(percent > 100) percent = 100;

	return {
		read: _readPages,
		total: totalPages,
		percent: percent,
		percentRound: Math.round(percent),
		completed: (_readPages >= totalPages),
	};
}

async function readPages(path)
{
	const readingProgress = storage.get('readingProgress');

	const paths = await findReadingProgressPaths(path, false);
	let pages = 0;

	for(const key of paths)
	{
		const progress = readingProgress[key];

		if(progress && progress.page && fileManager.simpleExists(key, true))
			pages += progress.page;
	}

	return pages;
}

var readingPages = false;

async function _countPages(path, file, first = false, cache = true)
{
	const progress = storage.getKey('readingProgress', path);
	if(progress && progress.pages) return progress.pages;

	if(readingPages === false)
		readingPages = storage.get('readingPages') || {};

	const time = app.time();
	const pages = readingPages[path]?.pages;

	if(pages !== undefined && !first && cache)
	{
		readingPages[path].lastAccess = time;
		return pages;
	}

	const files = await file.read({}, path);

	let count = 0;
	let images = 0;
	let hasChildFolders = false;

	for(let i = 0, len = files.length; i < len; i++)
	{
		const _file = files[i];

		if(_file.folder || _file.compressed)
		{
			count += await _countPages(_file.path, file, false, cache);
			hasChildFolders = true;
		}
		else// if(compatible.image(_file.path))
		{
			images++;
		}
	}

	if(!hasChildFolders)
		count += images;

	readingPages[path] = {
		pages: count,
		lastAccess: time
	};

	storage.setThrottle('readingPages', readingPages);

	return count;
}

async function countPages(path = false, cache = true, cacheOnly = false)
{
	if(!path) return 0;

	const file = fileManager.file(path);
	file.updateConfig({cacheOnly: cacheOnly, sort: false});
	const pages = await _countPages(path, file, true, cache);
	file.destroy();

	return pages;
}

async function _findReadingProgressPaths(path, file)
{
	let paths = [];
	const files = await file.read({}, path);

	let hasImages = false;

	for(let i = 0, len = files.length; i < len; i++)
	{
		const _file = files[i];

		if(_file.folder || _file.compressed)
		{
			paths = [...paths, ...(await _findReadingProgressPaths(_file.path, file))];
		}
		else// if(compatible.image(_file.path))
		{
			hasImages = true;
		}
	}

	if(hasImages)
		paths.push(path);

	return paths;
}

async function findReadingProgressPaths(path, all = false)
{
	if(!all)
	{
		const regex = new RegExp('^\s*'+pregQuote(path)+'(?:[\\\/\\\\]|$)');
		const readingProgress = storage.get('readingProgress');

		let paths = Object.keys(readingProgress).filter(function(key){

			return regex.test(key);

		});

		if(paths.length > 1)
		{
			// Remove parent key
			paths = paths.filter(function(key){

				return path !== key;

			});
		}

		return paths;
	}
	else
	{
		const file = fileManager.file(path);
		file.updateConfig({sort: false});
		const paths = await _findReadingProgressPaths(path, file);
		file.destroy();

		return paths;
	}
}

async function read(path)
{
	const readingProgress = storage.get('readingProgress');
	const paths = await findReadingProgressPaths(path, true);

	for(const key of paths)
	{
		const progress = readingProgress[key];
		const pages = await countPages(key);

		readingProgress[key] = {
			...progress,
			...{
				page: pages,
				pages: pages,
				percent: 100,
				completed: true,
			}
		};
	}

	storage.set('readingProgress', readingProgress);
	updateProgress(path);

}

async function unread(path)
{
	const readingProgress = storage.get('readingProgress');
	const paths = await findReadingProgressPaths(path, false);

	for(const key of paths)
	{
		const progress = readingProgress[key];

		progress.page = 0;
		progress.percent = 0;
		progress.completed = false;
	}

	storage.set('readingProgress', readingProgress);
	updateProgress(path);
}

async function updateProgress(path, progress = false)
{
	progress = progress || await get(path, false); // false to force a recount

	const sizes = [
		false,
		100,
		150,
		200,
		250,
		300,
	];

	for(const size of sizes)
	{
		const folderSha = sha1(path+(size ? '?size='+size : ''));
		dom.addProgressToDom(folderSha, progress, true);
	}
}

function purge()
{
	if(!readingPages) return;

	const time = app.time();
	const cacheMaxOld = config.cacheMaxOld * 60 * 60 * 24;

	for(let key in readingPages)
	{
		if(time - readingPages[key].lastAccess > cacheMaxOld)
			delete readingPages[key];
	}

	storage.set('readingPages', readingPages);

	return;
}

module.exports = {
	save,
	activeSave: function(active = true){saveIsActive = active},
	setInterval: _setInterval,
	get,
	readPages,
	countPages,
	read,
	unread,
	updateProgress,
	purge,
}