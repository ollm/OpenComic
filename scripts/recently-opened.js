function start()
{
	load();
}

async function reload(animation = true)
{
	load(animation, true);
}

async function load(animation = true, content = false)
{
	onReading = _onReading = false;

	dom.boxes.reset();
	dom.fromLibrary(false);
	dom.indexPathControl(false, false, false, false, true);
	dom.setCurrentPageVars('recently-opened');

	template.loadContentRight('index.content.right.loading.html', animation);
	template.loadHeader('recently.opened.header.html', animation);

	let now = Date.now();

	let sort = config.sortRecentlyOpened;
	let sortInvert = config.sortInvertRecentlyOpened;

	let order = '';
	let orderKey = 'name';
	let orderKey2 = false;

	if(sort == 'name')
	{
		order = 'simple';
	}
	else if(sort == 'numeric')
	{
		order = 'numeric';
	}
	else if(sort == 'name-numeric')
	{
		order = 'simple-numeric';
	}
	else if(sort == 'last-opened')
	{
		order = 'real-numeric';
		orderKey = 'lastOpened';
		sortInvert = !sortInvert;
	}
	else
	{
		order = 'real-numeric';
		orderKey = 'readingProgress';
		orderKey2 = 'lastReading';
		sortInvert = !sortInvert;
	}

	let comics = [];

	// Get comics in library
	let recentlyOpened = storage.get('recentlyOpened');

	if(!isEmpty(recentlyOpened))
	{
		for(let mainPath in recentlyOpened)
		{
			let file = recentlyOpened[mainPath];

			if(fs.existsSync(file.path))
			{
				let name = p.basename(file.path);

				comics.push({
					name: name,
					path: file.path,
					mainPath: mainPath,
					lastOpened: file.lastOpened,
					added: 0,
					folder: true,
					compressed: fileManager.isCompressed(name),
					fromRecentlyOpened: true,
					fromMasterFolder: true,
				});
			}
		}
	}

	cache.cleanQueue();
	cache.stopQueue();
	threads.stop('folderThumbnails');

	if(comics.length > 0)
	{
		// Comic reading progress
		let readingProgress = relative.get('readingProgress');

		for(let key in comics)
		{
			let images = await dom.getFolderThumbnails(comics[key].path);

			comics[key].sha = sha1(comics[key].path);
			comics[key].poster = images.poster;
			comics[key].onclick = 'recentlyOpened.set(\''+escapeQuotes(escapeBackSlash(comics[key].mainPath), 'simples')+'\')';
			comics[key].images = images.images;
			comics[key].mainPath = config.showFullPathOpened ? p.parse(comics[key].path).root : comics[key].mainPath;
			comics[key].readingProgress = readingProgress[comics[key].path] || {lastReading: 0};
			comics[key].progress = images.progress;
		}

		comics.sort(function(a, b) {
			return (sortInvert) ? -(dom.orderBy(a, b, order, orderKey, orderKey2)) : dom.orderBy(a, b, order, orderKey, orderKey2);
		});
	}

	handlebarsContext.comics = comics.slice(0, config.recentlyOpenedItems);
	handlebarsContext.comicsReadingProgress = false;

	if(Date.now() - now < 300)
		template._contentRight().firstElementChild.innerHTML = template.load('index.content.right.'+config.viewRecentlyOpened+'.html');
	else
		template.loadContentRight('index.content.right.'+config.viewRecentlyOpened+'.html', animation);

	cache.resumeQueue();
	threads.resume('folderThumbnails');

	handlebarsContext.headerTitle = false;
	handlebarsContext.headerTitlePath = false;

	if(!content)
	{
		if(template.contentLeft('.menu-list').length === 0) dom.loadIndexContentLeft(animation);
		template.loadGlobalElement('index.elements.menus.html', 'menus');
		dom.floatingActionButton(false);
	}

	shortcuts.register('browse');
	gamepad.updateBrowsableItems('recently-opened');

	events.events();
}

function set(mainPath)
{
	let recentlyOpened = storage.get('recentlyOpened');

	recentlyOpened[mainPath] = {
		path: mainPath,
		lastOpened: time(),
	};

	let recentlyOpenedA = [];

	for(let path in recentlyOpened)
	{
		recentlyOpenedA.push(recentlyOpened[path]);
	}

	if(recentlyOpenedA.length > config.recentlyOpenedItems)
	{
		recentlyOpenedA.sort(function(a, b) {
		
			if(a.lastOpened == b.lastOpened)
				return 0;

			return a.lastOpened < b.lastOpened ? 1 : -1;
			
		});
	
		for(let i = config.recentlyOpenedItems, len = recentlyOpenedA.length; i < len; i++)
		{
			delete recentlyOpened[recentlyOpenedA[i].path];
		}
	}

	storage.set('recentlyOpened', recentlyOpened);
}

module.exports = {
	start: start,
	load: load,
	reload: reload,
	set: set,
};