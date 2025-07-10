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

	const isParent = mainPath !== dirname ? true : false;

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

async function get(path, cacheOnly = false)
{
	const _readPages = readPages(path);
	const totalPages = await countPages(path, cacheOnly);

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

function readPages(path)
{
	const regex = new RegExp('^\s*'+pregQuote(path));
	const readingProgress = storage.get('readingProgress');

	let keys = Object.keys(readingProgress).filter(function(key){

		return regex.test(key);

	});

	if(keys.length > 1)
	{
		// Remove parent key
		keys = keys.filter(function(key){

			return path !== key;

		});
	}

	let pages = 0;

	for(const key of keys)
	{
		const progress = readingProgress[key];

		if(progress && (progress.page || progress.index))
			pages += progress.page || progress.index;
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

	for(let i = 0, len = files.length; i < len; i++)
	{
		const _file = files[i];

		if(_file.folder || _file.compressed)
		{
			count += await _countPages(_file.path, file, false, cache);
		}
		else// if(compatible.image(_file.path))
		{
			count++;
		}
	}

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
	purge,
}