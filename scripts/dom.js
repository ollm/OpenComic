const domPoster = require(p.join(appDir, 'scripts/dom/poster.js')),
	domManager = require(p.join(appDir, 'scripts/dom/dom.js')),
	labels = require(p.join(appDir, 'scripts/dom/labels.js')),
	fileInfo = require(p.join(appDir, 'scripts/dom/file-info.js')),
	clearFileCache = require(p.join(appDir, 'scripts/dom/clear-file-cache.js')),
	search = require(p.join(appDir, 'scripts/dom/search.js')),
	header = require(p.join(appDir, 'scripts/dom/header.js')),
	boxes = require(p.join(appDir, 'scripts/dom/boxes.js')),
	history = require(p.join(appDir, 'scripts/dom/history.js')),
	scroll = require(p.join(appDir, 'scripts/dom/scroll.js'));

/*Page - Index*/

function orderBy(a, b, mode, key = false, key2 = false)
{
	let aValue = a;
	let bValue = b;

	if(key2)
	{
		aValue = a[key][key2];
		bValue = b[key][key2];
	}
	else if(key)
	{
		aValue = a[key];
		bValue = b[key];
	}

	if(mode != 'real-numeric')
	{
		aValue = aValue.toLowerCase();
		bValue = bValue.toLowerCase();
	}

	if(mode == 'simple')
	{
		if(aValue > bValue) return 1;
		if(aValue < bValue) return -1;

		return 0;
	}
	else if(mode == 'real-numeric')
	{
		if(aValue > bValue) return 1;
		if(aValue < bValue) return -1;

		return 0;
	}
	else if(mode == 'numeric')
	{
		let matchA = aValue.match(/([0-9]+)/g);
		let matchB = bValue.match(/([0-9]+)/g);

		if(!matchA) return 1;
		if(!matchB) return -1;

		for(let i = 0, len = Math.min(matchA.length, matchB.length); i < len; i++)
		{
			if(+matchA[i] > +matchB[i]) return 1;
			if(+matchA[i] < +matchB[i]) return -1;
		}

		if(matchA.length > matchB.length) return 1;
		if(matchA.length < matchB.length) return -1;

		if(aValue > bValue) return 1;
		if(aValue < bValue) return -1;

		return 0;
	}
	else if(mode == 'simple-numeric')
	{
		let matchA = aValue.split(/([0-9]+)/);
		let matchB = bValue.split(/([0-9]+)/);

		if(!matchA) return 1;
		if(!matchB) return -1;

		for(let i = 0, len = Math.min(matchA.length, matchB.length); i < len; i++)
		{
			if(isNaN(matchA[i]) || isNaN(matchB[i]))
			{
				if(matchA[i] > matchB[i]) return 1;
				if(matchA[i] < matchB[i]) return -1;
			}
			else
			{
				if(+matchA[i] > +matchB[i]) return 1;
				if(+matchA[i] < +matchB[i]) return -1;
			}
		}

		return (matchA.length < matchB.length) ? 1 : -1;
	}
}

function addImageToDom(sha, path, animation = true)
{
	const src = dom.queryAll('img.sha-image-'+sha).setAttribute('src', app.encodeSrcURI(app.shortWindowsPath(path, true)));

	if(animation)
	{
		src.addClass('a', 'active', 'border');
	}
	else
	{
		src.addClass('active', 'border');
		src.filter('.folder-poster-img').addClass('has-poster');
	}
}

async function addProgressToDom(sha, progress, animation = true)
{
	const src = document.querySelectorAll('.sha-'+sha);
	const _src = dom.this(src);

	if(!animation)
		_src.addClass('disable-transitions');

	// Fade completed
	if(handlebarsContext.page.fadeCompleted)
	{
		if(progress.completed)
		{
			for(const item of src)
			{
				if(item.classList.contains('medium-list'))
					item.style.opacity = 0.3;
				else
					item.firstElementChild.style.opacity = 0.3;
			}
		}
		else
		{
			for(const item of src)
			{
				if(item.classList.contains('medium-list'))
					item.style.opacity = '';
				else
					item.firstElementChild.style.opacity = '';
			}
		}
	}

	// Progress bar
	if(handlebarsContext.page.progressBar)
	{
		const _progress = dom.this(src).find('.progress-bar', true);
		_progress.class(progress.percent, 'show');

		for(const item of _progress._this)
		{
			item.firstElementChild.style.transform = 'translateX(calc(-100% + '+progress.percent+'%))';
			if(item.children[1]) item.children[1].style.transform = 'translateX(calc('+progress.percent+'% + 4px))';
		}
	}

	if(handlebarsContext.page.progressPages || handlebarsContext.page.progressPercent)
		dom.this(src).find('.progress-pages').addClass('show');

	// Pages
	if(handlebarsContext.page.progressPages)
		dom.this(src).find('.progress-pages > svg text:first-child textPath, .progress-pages > span', true).html(progress.read+' / '+progress.total);

	// percent
	if(handlebarsContext.page.progressPercent)
	{
		dom.this(src).find('.progress-pages > svg text:nth-child(2) textPath, .progress-percent > span', true).html(progress.percentRound+'%');
		dom.this(src).find('.progress-percent', true).addClass('show');
	}

	if(!animation)
	{
		await app.sleep(100);
		_src.removeClass('disable-transitions');
	}
}

function setWindowTitle(title = 'OpenComic')
{
	let _title = document.querySelector('head title');
	_title.innerText = title;
}

function translatePageName(name)
{
	name = name.replace(/^[0-9]+\_sortonly - /, '');

	return name.replace(/^page\-0*([0-9]+)/, language.global.pageAndNumber);
}

function metadataPathName(file, force = false)
{
	if(fileManager.isOpds(file.path))
	{
		return opds.pathName(file.name);
	}
	else if(file.compressed || force)
	{
		let metadata = storage.getKey('compressedMetadata', file.path);
		if(metadata && metadata.title) return metadata.title;
	}

	return file.name;
}

async function readFilesIndexPage(path, mainPath, fromGoBack, notAutomaticBrowsing, fromGoForwards)
{
	const file = fileManager.file(path);
	let files;

	try 
	{
		files = await file.read();
	}
	catch(error)
	{
		console.error(error);

		dom.compressedError(error);
		fileManager.requestFileAccess.check(path, error);

		return {
			path: path,
			mainPath: mainPath,
			files: []
		};
	}

	const basic = {
		path: path,
		mainPath: mainPath,
		files: files,
	};

	// Get comic reading progress image
	let _readingProgress = relative.get('readingProgress');
	let readingProgress = _readingProgress[mainPath]?.path ? _readingProgress[mainPath] : false;
	let readingProgressCurrentPath = (mainPath != path) ? (_readingProgress[path]?.path ? _readingProgress[path] : false) : false;

	// const isCompressed = fileManager.isCompressed(fileManager.firstCompressedFile(path));
	const isCompressed = fileManager.isCompressed(path);
	const openingBehavior = isCompressed ? config.openingBehaviorFile : config.openingBehaviorFolder;

	const lastFolder = ['first-page-last', 'continue-reading-last', 'continue-reading-first-page-last'].includes(openingBehavior);
	let openFirstPage = ['first-page', 'continue-reading-first-page', 'first-page-last', 'continue-reading-first-page-last'].includes(openingBehavior);
	let openContinueReading = ['continue-reading', 'continue-reading-first-page', 'continue-reading-last', 'continue-reading-first-page-last'].includes(openingBehavior);

	if(openContinueReading && !fromGoBack && !notAutomaticBrowsing && readingProgress)
	{
		const isParentPath = fileManager.isParentPath(path, readingProgress.path);

		if(isParentPath || readingProgressCurrentPath)
		{
			if(!isParentPath && readingProgressCurrentPath)
				readingProgress = readingProgressCurrentPath;
		}
		else
		{
			openContinueReading = false;
		}

		if(openContinueReading && !fileManager.simpleExists(readingProgress.path))
			openContinueReading = false;
	}
	else
	{
		openContinueReading = false;
	}

	// Only in last deep folded
	if(lastFolder)
	{
		let hasFolder = false;

		for(let i = 0, len = files.length; i < len; i++)
		{
			if(files[i].folder || files[i].compressed)
			{
				hasFolder = true;
				break;
			}
		}

		if(hasFolder)
		{
			openFirstPage = false;
			openContinueReading = false;
		}
	}

	if(openContinueReading && !fromGoBack && !fromGoForwards && !notAutomaticBrowsing)
	{
		if(readingProgress.ebook)
			reading.setNextOpenChapterProgress(readingProgress.chapterIndex, readingProgress.chapterProgress);

		file.destroy();

		return {
			open: true,
			path: readingProgress.path,
			mainPath: mainPath,
			files: files,
		};
	}
	else if(openFirstPage && !fromGoBack && !fromGoForwards && !notAutomaticBrowsing)
	{
		let first;

		if(file.files)
			file.files = fileManager.sort(file.files, {extraKey: 'Reading'});

		file.updateConfig({sort: {extraKey: 'Reading'}});

		try
		{
			first = await file.images(1);
		}
		catch(error)
		{
			console.error(error);
			dom.compressedError(error);

			return basic;
		}

		if(first)
		{
			file.destroy();

			return {
				open: true,
				path: first.path,
				mainPath: mainPath,
				files: files,
			};
		}
	}

	file.destroy();

	if(config.ignoreSingleFoldersLibrary && !fromGoBack && !fromGoForwards && !notAutomaticBrowsing && files.length == 1 && (files[0].folder || files[0].compressed))
	{
		return readFilesIndexPage(files[0].path, mainPath, fromGoBack, notAutomaticBrowsing, fromGoForwards);
	}

	return basic;
}

async function loadFilesIndexPage(files, file, animation, path, keepScroll, mainPath, _indexLabel)
{
	threads.clean('folderThumbnails');

	let pathFiles = [];
	let thumbnails = [];

	// Get comic reading progress image
	let _readingProgress = relative.get('readingProgress');

	let readingProgress = _readingProgress[mainPath]?.path ? _readingProgress[mainPath] : false;
	let readingProgressCurrentPath = (mainPath != path) ? (_readingProgress[path]?.path ? _readingProgress[path] : false) : false;

	if(files)
	{
		const viewModuleSize = handlebarsContext.page.viewModuleSize || 150;
		let images = [];

		for(let i = 0, len = files.length; i < len; i++)
		{
			const file = files[i];

			if(compatible.image(file.path))
			{
				file.forceSize = viewModuleSize;
				file.sha = cache.imageSizeSha(file);
				images.push(file);
			}
		}

		if(readingProgress)
		{
			let path = readingProgress.path;
			let sha = sha1(path);

			images.push({path: path, sha: sha});

			readingProgress.sha = sha;
		}

		if(readingProgressCurrentPath)
		{
			let path = readingProgressCurrentPath.path;
			let sha = sha1(path);

			images.push({path: path, sha: sha});

			readingProgressCurrentPath.sha = sha;
		}

		thumbnails = cache.returnThumbnailsImages(images, function(data){

			addImageToDom(data.sha, data.path);

		}, file);

		let visibleItems = calculateVisibleItems(config.view, keepScroll);

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i];
			let fileName = file.name;
			let filePath = file.path;

			let realPath = fileManager.realPath(filePath, -1);

			if(compatible.image(realPath))
			{
				let sha = file.sha;

				let thumbnail = thumbnails[file.sha];

				pathFiles.push({
					sha: sha,
					name: translatePageName(fileName.replace(/\.[^\.]*$/, '')),
					path: filePath,
					mainPath: mainPath,
					thumbnail: (thumbnail.cache) ? thumbnail.path : '',
					folder: false,
				});
			}
			else if(file.folder || file.compressed)
			{
				let images = await getFolderThumbnails(filePath, false, i, visibleItems.start, visibleItems.end);

				pathFiles.push({
					sha: file.sha,
					name: metadataPathName(file),
					path: filePath,
					mainPath: mainPath,
					poster: images.poster,
					images: images.images,
					addToQueue: images.addToQueue,
					folder: true,
					compressed: file.compressed,
					progress: images.progress,
				});
			}
		}
	}
	else
	{
		let images = [];

		if(readingProgress)
		{
			let path = readingProgress.path;
			let sha = sha1(path);

			images.push({path: path, sha: sha});

			readingProgress.sha = sha;
		}

		if(readingProgressCurrentPath)
		{
			let path = readingProgressCurrentPath.path;
			let sha = sha1(path);

			images.push({path: path, sha: sha});

			readingProgressCurrentPath.sha = sha;
		}

		thumbnails = cache.returnThumbnailsImages(images, function(data){

			addImageToDom(data.sha, data.path);

		}, file);
	}

	if(_indexLabel?.filter)
	{
		pathFiles = dom.labels.filterList(pathFiles, _indexLabel.filter);
	}

	handlebarsContext.comics = pathFiles;

	const processReadingProgress = function(progress) {

		const sha = progress.sha;
		const thumbnail = thumbnails[sha];

		progress.sha = sha;
		progress.thumbnail = (thumbnail.cache) ? thumbnail.path : '';
		progress.mainPath = mainPath;
		progress.pathText = returnTextPath(progress.path, mainPath, true, !progress.ebook);
		progress.exists = fileManager.simpleExists(progress.path);

		progress.contextMenu = {
			path: p.dirname(progress.path),
		};

		return progress;

	}

	// Comic reading progress
	if(readingProgress)
		handlebarsContext.comicsReadingProgress = processReadingProgress(readingProgress);
	else
		handlebarsContext.comicsReadingProgress = false;

	// Current folder reading progress
	if(readingProgressCurrentPath && (!readingProgress || readingProgress.path !== readingProgressCurrentPath.path))
		handlebarsContext.comicsReadingProgressCurrentPath = processReadingProgress(readingProgressCurrentPath);
	else
		handlebarsContext.comicsReadingProgressCurrentPath = false;

	if(!pathFiles.length && fileManager.isServer(path) && serverClient.serverLastError())
	{
		handlebarsContext.serverLastError = serverClient.serverLastError();
		handlebarsContext.serverHasCache = file.serverHasCache(path);
	}

	events.events();

	return {files: pathFiles, readingProgress: readingProgress || {}, readingProgressCurrentPath: readingProgressCurrentPath || {}, html: template.load('index.content.right.'+config.view+'.html')};

}

async function reloadIndex(fromSetOfflineMode = false)
{
	indexLabel = prevIndexLabel;
	loadIndexPage(true, history.path, true, true, history.mainPath, false, true, fromSetOfflineMode);
}

function reload(fromSetOfflineMode = false)
{
	if(onReading)
		reading.reload(true);
	else if(handlebarsContext.page.key == 'recently-opened')
		recentlyOpened.reload();
	else
		reloadIndex(fromSetOfflineMode);
}

var indexLabel = false, prevIndexLabel = false;

function setIndexLabel(options)
{
	options.has = (options && Object.keys(options).some(key => key !== 'filter' && key !== 'has'));
	indexLabel = options;
}

function setPrevIndexLabel(options)
{
	options.has = (options && Object.keys(options).some(key => key !== 'filter' && key !== 'has'));
	prevIndexLabel = options;
}

var currentPath = false, currentPathScrollTop = [];

async function loadIndexPage(animation = true, path = false, content = false, keepScroll = false, mainPath = false, fromGoBack = false, notAutomaticBrowsing = false, fromSetOfflineMode = false, fromGoForwards = false)
{
	onReading = _onReading = false;

	fileManager.revokeAllObjectURL();
	reading.render.revokeAllObjectURL();
	workers.clean('convertImageToBlob');

	scroll.reset();
	reading.hideContent();
	reading.music.pause();

	setWindowTitle();

	const isOpds = fileManager.isOpds(path);

	currentPathScrollTop[currentPath === false ? 0 : currentPath] = isOpds ? template.contentRight().find('.opds-browse-content').scrollTop() : template.contentRight().children().scrollTop();

	for(let _path in currentPathScrollTop)
	{
		if(_path != 0 && !new RegExp('^'+pregQuote(_path)).test(path))
			delete currentPathScrollTop[_path];
	}

	if(currentPathScrollTop[path === false ? 0 : path])
		keepScroll = currentPathScrollTop[path === false ? 0 : path];

	const _indexLabel = prevIndexLabel = (indexLabel || {});
	indexLabel = false;

	currentPath = path;

	handlebarsContext.serverLastError = false;

	let contentRightIndex = template.contentRightIndex();

	if(_indexLabel.opds || isOpds)
	{
		if(!template._contentLeft().querySelector('.menu-list'))
			dom.loadIndexContentLeft(animation);
		
		if(!path)
		{
			dom.fromLibrary(true);
			dom.indexPathControl(false);

			generateAppMenu();

			dom.setCurrentPageVars('index', _indexLabel);
			dom.floatingActionButton(false);

			handlebarsContext.headerTitle = false;
			handlebarsContext.headerTitlePath = false;

			// OPDS
			await opds.home();
		}
		else
		{
			if(!fromGoBack && !opds.isPublication(path))
				indexPathControl(path, mainPath);

			generateAppMenu();

			dom.setCurrentPageVars('browsing', {filter: _indexLabel?.filter || {}});
			dom.headerPath(path, mainPath);
			dom.floatingActionButton(false);

			// OPDS
			await opds.browse(path, mainPath, keepScroll);
		}
	}
	else if(!path)
	{
		dom.fromLibrary(true);
		dom.indexPathControl(false);

		generateAppMenu();

		if(!fromSetOfflineMode)
			fileManager.setServerInOfflineMode(false);

		dom.setCurrentPageVars('index', _indexLabel);

		let sort = config.sortIndex;
		let sortInvert = config.sortInvertIndex;
		let continueReading = config.continueReadingIndex;
		let recentlyAdded = config.recentlyAddedIndex;

		let sortAndView = false;

		if(_indexLabel.has)
		{
			let labelKey = '';

			if(_indexLabel.favorites)
				labelKey = 'favorites';
			else if(_indexLabel.opds)
				labelKey = 'opds';
			else if(_indexLabel.masterFolder)
				labelKey = 'masterFolder-'+_indexLabel.index;
			else if(_indexLabel.server)
				labelKey = 'server-'+_indexLabel.index;
			else if(_indexLabel.label)
				labelKey = 'label-'+_indexLabel.index;

			sortAndView = config.sortAndView[labelKey] || defaultSortAndView;

			sort = sortAndView.sort;
			sortInvert = sortAndView.sortInvert;
			continueReading = sortAndView.continueReading;
			recentlyAdded = sortAndView.recentlyAdded;
		}

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
		else if(sort == 'last-add')
		{
			order = 'real-numeric';
			orderKey = 'added';
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
		let comicPaths = new Set();

		let ignore = fileManager.ignoreFilesRegex();

		// Get comics in master folders
		let masterFolders = relative.get('masterFolders');

		if(!isEmpty(masterFolders))
		{
			for(let path of masterFolders)
			{
				path = path;

				if(fs.existsSync(path) && (!_indexLabel.masterFolder || _indexLabel.masterFolder == path) && !_indexLabel.server)
				{
					let file = fileManager.file(path);
					let files = await file.readDir();
					file.destroy();

					for(let i = 0, len = files.length; i < len; i++)
					{
						let folder = files[i];

						if(ignore && ignore.test(folder.name))
							continue;

						if((folder.folder || folder.compressed) && !comicPaths.has(folder.path))
						{
							comics.push({
								name: metadataPathName(folder),
								path: folder.path,
								added: Math.round(fs.statSync(folder.path).ctimeMs / 1000),
								folder: true,
								compressed: folder.compressed,
								fromMasterFolder: true,
							});

							comicPaths.add(folder.path);
						}
					}
				}
			}
		}

		// Get server file lists
		let servers = storage.get('servers');

		if(!isEmpty(servers))
		{
			if(_indexLabel.server)
			{
				const root = history.root();
				selectMenuItem(dom.labels.menuItemSelector(root.indexLabel?.has ? root.indexLabel : _indexLabel));

				handlebarsContext.animationDelay = 0.2;
				template.loadContentRight('index.content.right.loading.html', animation, keepScroll);
				handlebarsContext.animationDelay = false;

				contentRightIndex = template.contentRightIndex();
			}

			for(let i = 0, len2 = servers.length; i < len2; i++)
			{
				const server = servers[i];

				if((((server.showOnLibrary || _indexLabel.favorites || _indexLabel.label) && !_indexLabel.server) || _indexLabel.server == server.path) && !_indexLabel.masterFolder)
				{
					const file = fileManager.file(server.path);
					if(!_indexLabel.server) file.updateConfig({cacheServer: true});
					let files = await file.readServer();

					if(server.filesInSubfolders && !_indexLabel.server)
					{
						let _files = [];

						for(let j = 0, len = files.length; j < len; j++)
						{
							const folder = files[j];

							if(folder.folder || folder.compressed)
							{
								const _file = fileManager.file(folder.path);
								_file.updateConfig({cacheServer: true});
								_files = _files.concat(await _file.readServer());
							}
						}

						if(_indexLabel.has)
							_files = _files.concat(files);

						files = _files;
					}

					const len = files.length;

					for(let j = 0; j < len; j++)
					{
						const folder = files[j];

						if(ignore && ignore.test(folder.name))
							continue;

						if((folder.folder || folder.compressed) && !comicPaths.has(folder.path))
						{
							comics.push({
								name: metadataPathName(folder),
								path: folder.path,
								added: Math.round(folder.mtime / 1000),
								folder: true,
								compressed: folder.compressed,
								fromMasterFolder: true,
							});

							comicPaths.add(folder.path);
						}
					}

					if(!len && _indexLabel.server && serverClient.serverLastError())
					{
						handlebarsContext.serverLastError = serverClient.serverLastError();
						handlebarsContext.serverHasCache = file.serverHasCache(server.path);
					}

					file.destroy();
				}
			}
		}

		// Get comics in library
		let comicsStorage = relative.get('comics');

		if(!isEmpty(comicsStorage) && !_indexLabel.masterFolder && !_indexLabel.server)
		{
			for(const comic of comicsStorage)
			{
				const path = comic.path;

				if(!comicPaths.has(path) && fs.existsSync(path))
				{
					comic.name = metadataPathName(comic);
					comics.push(comic);

					comicPaths.add(path);
				}
			}
		}

		// Get comics in favorite/labels that are not in master folders, servers and library, like comics in subfolders
		if(!_indexLabel?.filter?.onlyRoot && (_indexLabel.favorites || _indexLabel.label))
		{
			const labelsPath = [];

			// Favorites
			const favorites = relative.get('favorites');

			for(let path in favorites)
			{
				labelsPath.push(path);
			}

			// Labels
			const comicLabels = relative.get('comicLabels');

			for(let path in comicLabels)
			{
				labelsPath.push(path);
			}

			// Process
			for(const path of labelsPath)
			{
				if(!comicPaths.has(path) && fileManager.simpleExists(path))
				{
					const isServer = fileManager.isServer(path);
					const firstCompressedFile = fileManager.firstCompressedFile(path, 0, false);

					comics.push({
						name: metadataPathName({path: path, name: p.basename(path)}),
						path: path,
						added: isServer ? 0 : Math.round(fs.statSync(firstCompressedFile).ctimeMs / 1000),
						folder: true,
						compressed: compatible.compressed(path),
						fromMasterFolder: true,
					});

					comicPaths.add(path);
				}
			}
		}

		cache.cleanQueue();
		cache.stopQueue();
		threads.stop('folderThumbnails');

		let len = comics.length;

		if(len && _indexLabel.has)
		{
			if(_indexLabel.favorites)
			{
				let favorites = relative.get('favorites');
				let _comics = [];

				for(let i = 0; i < len; i++)
				{
					if(favorites[comics[i].path])
						_comics.push(comics[i]);
				}

				comics = _comics;
				len = comics.length;
			}
			else if(_indexLabel.label)
			{
				let labels = storage.get('labels') || [];
				let label = labels[_indexLabel.index] || false;

				let comicLabels = relative.get('comicLabels');
				let _comics = [];

				for(let i = 0; i < len; i++)
				{
					if(comicLabels[comics[i].path] && comicLabels[comics[i].path].includes(label))
						_comics.push(comics[i]);
				}

				comics = _comics;
				len = comics.length;
			}
		}

		if(_indexLabel?.filter)
		{
			comics = dom.labels.filterList(comics, _indexLabel.filter);
			len = comics.length;
		}

		if(len)
		{
			// Comic reading progress
			let readingProgress = relative.get('readingProgress');

			for(let i = 0; i < len; i++)
			{
				comics[i].readingProgress = readingProgress[comics[i].path] || {lastReading: 0};
			}

			comics.sort(function(a, b) {
				return (sortInvert) ? -(orderBy(a, b, order, orderKey, orderKey2)) : orderBy(a, b, order, orderKey, orderKey2);
			});

			let visibleItems = calculateVisibleItems((sortAndView ? sortAndView.view : config.viewIndex), keepScroll);

			for(let i = 0; i < len; i++)
			{
				let images = await getFolderThumbnails(comics[i].path, false, i, visibleItems.start, visibleItems.end);

				comics[i].sha = sha1(comics[i].path);
				comics[i].poster = images.poster;
				comics[i].images = images.images;
				comics[i].addToQueue = images.addToQueue;
				comics[i].mainPath = comics[i].path;
				comics[i].progress = images.progress;
			}
		}

		// Avoid continue if another loadIndexPage has been run
		if(contentRightIndex != template.contentRightIndex()) return;

		dom.boxes.reset();
		if(sort != 'last-reading' && continueReading) await dom.boxes.continueReading(comics);
		if(sort != 'last-add' && recentlyAdded) await dom.boxes.recentlyAdded(comics);

		handlebarsContext.comics = comics;
		handlebarsContext.comicsIndex = true;
		handlebarsContext.sortAndView = sortAndView || false;
		handlebarsContext.comicsReadingProgress = false;
		handlebarsContext.comicsReadingProgressCurrentPath = false;

		template.loadContentRight('index.content.right.'+(sortAndView ? sortAndView.view : config.viewIndex)+'.html', animation, keepScroll);

		cache.resumeQueue();
		threads.resume('folderThumbnails');

		handlebarsContext.headerTitle = false;
		handlebarsContext.headerTitlePath = false;
		dom.loadIndexHeader(_indexLabel.has ? _indexLabel.name : false, animation);

		if(!template._contentLeft().querySelector('.menu-list'))
			dom.loadIndexContentLeft(animation);

		if(!content)
		{
			template.loadGlobalElement('index.elements.menus.html', 'menus');
			floatingActionButton(true, 'dom.addComicButtons();');
		}
		
		if(_indexLabel.has)
			floatingActionButton(false);

		events.events();

	}
	else
	{
		const files = await readFilesIndexPage(path, mainPath, fromGoBack, notAutomaticBrowsing, fromGoForwards);

		path = files.path;
		mainPath = files.mainPath;

		if(files.open)
		{
			template.loadContentRight('index.content.right.loading.html', animation, keepScroll);
			dom.openComic(animation, path, mainPath, false, false, false, true);

			return;
		}

		if(!fromGoBack)
			indexPathControl(path, mainPath);

		dom.boxes.reset();
		handlebarsContext.comics = [];
		handlebarsContext.comicsIndex = false;
		handlebarsContext.sortAndView = false;
		handlebarsContext.comicsDeep2 = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep).length >= 2 ? true : false;
		dom.setCurrentPageVars('browsing', {filter: _indexLabel?.filter || {}});

		if(handlebarsContext.comicsDeep2)
			showIfHasPrevOrNext(path, mainPath);

		headerPath(path, mainPath);

		dom.loadIndexHeader(false, animation);
		template.loadContentRight('index.content.right.loading.html', animation, keepScroll);

		contentRightIndex = template.contentRightIndex();

		if(!template._contentLeft().querySelector('.menu-list'))
			dom.loadIndexContentLeft(animation);

		if(!content)
		{
			template.loadGlobalElement('index.elements.menus.html', 'menus');
			floatingActionButton(false);
		}

		cache.cleanQueue();
		cache.stopQueue();
		threads.stop('folderThumbnails');

		// Avoid continue if another loadIndexPage has been run
		if(contentRightIndex != template.contentRightIndex())
			return;

		const file = fileManager.file(path);
		const indexData = await loadFilesIndexPage(files.files, file, animation, path, keepScroll, mainPath, _indexLabel);
		file.destroy();

		let contentRightScroll = template.contentRight().children().html(indexData.html);

		if(keepScroll > 1)
			contentRightScroll.scrollTop(keepScroll);

		cache.resumeQueue();
		threads.resume('folderThumbnails');

		generateAppMenu();
	}

	if(readingActive)
		readingActive = false;

	const root = history.root();

	if(!_indexLabel.has && !root.indexLabel?.has)
	{
		if(!root.recentlyOpened)
			selectMenuItem('library');
		else
			selectMenuItem('recently-opened');
	}
	else
	{
		selectMenuItem(dom.labels.menuItemSelector(root.indexLabel.has ? root.indexLabel : _indexLabel));
	}

	shortcuts.register(isOpds || _indexLabel.opds ? 'opds' : 'browse');
	gamepad.updateBrowsableItems(path ? sha1(path) : 'library');
	reading.discord.update();
	scroll.event();
}

function loadIndexContentLeft(animation)
{
	// Master folders
	let masterFolders = relative.get('masterFolders');

	masterFolders = masterFolders.map(function(path, i) {

		path = path;

		return {
			id: 'master-folder-'+i,
			key: i,
			name: p.basename(path),
			path: path,
		};

	});

	masterFolders.sort(function(a, b){

		if(a.name === b.name)
			return 0;

		return a.name > b.name ? 1 : -1;

	});

	handlebarsContext.masterFolders = masterFolders;

	// Labels
	let labels = storage.get('labels');

	let _labels = [];

	for(let i = 0, len = labels.length; i < len; i++)
	{
		_labels.push({
			id: 'label-'+i,
			key: i,
			name: labels[i],
		});
	}

	_labels.sort(function(a, b){

		if(a.name === b.name)
			return 0;

		return a.name > b.name ? 1 : -1;

	});

	handlebarsContext.labels = _labels;

	// Servers
	let servers = storage.get('servers');

	let _servers = [];

	for(let i = 0, len = servers.length; i < len; i++)
	{
		_servers.push({
			id: 'server-'+i,
			key: i,
			name: servers[i].name,
			path: servers[i].path,
		});
	}

	_servers.sort(function(a, b){

		if(a.name === b.name)
			return 0;

		return a.name > b.name ? 1 : -1;

	});

	handlebarsContext.servers = _servers;

	// OPDS Catalogs
	const opdsCatalogs = storage.get('opdsCatalogs');
	const opdsCatalogsLeft = [];

	for(let i = 0, len = opdsCatalogs.length; i < len; i++)
	{
		opdsCatalogsLeft.push({
			id: 'opds-'+i,
			key: i,
			title: opdsCatalogs[i].title,
			url: opdsCatalogs[i].url,
			showOnLeft: opdsCatalogs[i].showOnLeft,
		});
	}

	opdsCatalogsLeft.sort(function(a, b){

		if(a.name === b.name)
			return 0;

		return a.name > b.name ? 1 : -1;

	});

	handlebarsContext.opdsCatalogsLeft = opdsCatalogsLeft;

	// Is from
	handlebarsContext.isFrom = currentSelectMenuItem;

	template.loadContentLeft('index.content.left.html', animation);

	setTimeout(function() {

		// Show hover text in menus that are long
		const menus = template._contentLeft().querySelectorAll('.menu-item');

		for(const menu of menus)
		{
			if(menu.scrollWidth > menu.clientWidth)
				menu.classList.add('hover-text');
			else
				menu.removeAttribute('hover-text');
		}

		events.eventHover();

	}, 100);

	handlebarsContext.isFrom = false;
}

function loadIndexHeader(title = false, animation = true)
{
	handlebarsContext.indexHeaderTitle = title || language.global.library;
	template.loadHeader('index.header.html', animation);
}

function indexHeader(title = false)
{
	handlebarsContext.indexHeaderTitle = title || language.global.library;
	return template.load('index.header.html');
}

function continueReadingError()
{
	events.snackbar({
		key: 'continueReadingError',
		text: language.comics.continueReadingNotExists,
		duration: 6,
		buttons: [
			{
				text: language.buttons.dismiss,
				function: 'events.closeSnackbar();',
			},
		],
	});
}

function compressedError(error, showInPage = true, snackbarKey = '', path = false)
{
	if(showInPage)
	{
		handlebarsContext.compressedError = error ? (error.detail || error.message) : '';
		handlebarsContext.contentRightMessage = template.load('content.right.message.compressed.error.html');
		template._contentRight().firstElementChild.innerHTML = template.load('content.right.message.html');
	}
	else
	{
		const message = language.error.uncompress.title+(error ? ': '+(error.detail || error.message) : '');

		events.snackbar({
			key: 'compressedError'+snackbarKey,
			text: message,
			duration: 6,
			update: true,
			updateShown: true,
			buttons: [
				{
					text: language.buttons.dismiss,
					function: 'events.closeSnackbar();',
				},
			],
		});

		if(path)
			console.warn('%cError when unzipping %c'+path+'%c: '+message, '', 'color: #cc0000;', '');
	}
}

function addSepToEnd(path)
{
	if(!new RegExp(pregQuote(p.sep)+'\s*$').test(path))
		path = path + p.sep;

	return path;
}

function returnTextPath(path, mainPath, image = false, extension = true)
{
	mainPathR = addSepToEnd(p.dirname(mainPath));

	let files = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep);
	path = [];

	let _path = mainPathR;

	for(let i = 0, len = files.length; i < len; i++)
	{
		_path = p.normalize(p.join(_path, files[i]));
		files[i] = metadataPathName({path: _path, name: files[i]}, true);

		if(!extension && i == len - 1)
			files[i] = p.parse(files[i]).name;

		path.push(translatePageName(image ? htmlEntities(files[i]) : files[i]));
	}

	return path.join(image ? '<i class="material-icon navegation">chevron_right</i>' : ' / '); 
}

var isFromLibrary = true;

function fromLibrary(value)
{
	isFromLibrary = value;
}

function headerPath(path, mainPath, windowTitle = false)
{
	let _mainPath = mainPath;

	if((config.showFullPathLibrary && isFromLibrary) || (config.showFullPathOpened && !isFromLibrary))
		_mainPath = p.parse(path).root;

	mainPathR = addSepToEnd(p.dirname(_mainPath));

	let files = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep);
	path = [];

	let _path = mainPathR;

	for(let i = 0, len = files.length; i < len; i++)
	{
		if(!files[i] && i === len - 1)
			continue;

		_path = p.normalize(p.join(_path, files[i]));
		path.push({name: metadataPathName({path: _path, name: files[i]}, true), path: _path, mainPath: mainPath});
	}

	const root = history.root();

	if(config.showLibraryPath && (isFromLibrary || root.indexLabel?.has || root.recentlyOpened))
		path.unshift({name: labels.getName(root.indexLabel, root.recentlyOpened), path: '', mainPath: ''});

	let len = path.length;

	if(len > 0)
		path[len - 1].last = true;

	if(windowTitle && len > 0)
	{
		let firstCompressedFile = fileManager.firstCompressedFile(_path);
		setWindowTitle(dom.metadataPathName({path: firstCompressedFile, name: p.basename(firstCompressedFile)}, true));
	}

	handlebarsContext.headerTitlePath = path;
}

async function nextComic(path, mainPath)
{
	let file = fileManager.file(mainPath, {cacheServer: true, subtask: true});
	let image = await file.images(1, path);
	file.destroy();

	return image && image.path ? image.path : false;
}

async function previousComic(path, mainPath)
{
	let file = fileManager.file(mainPath, {cacheServer: true, subtask: true});
	let image = await file.images(-1, path);
	file.destroy();

	return image && image.path ? image.path : false;
}

async function goNextComic(path, mainPath)
{
	let _nextComic = await nextComic(history.path, history.mainPath);

	if(_nextComic)
	{
		dom.loadIndexPage(true, p.dirname(_nextComic), false, false, history.mainPath, false, true);
	}
}

async function goPrevComic(path, mainPath)
{
	let prevComic = await previousComic(history.path, history.mainPath);

	if(prevComic)
	{
		dom.loadIndexPage(true, p.dirname(prevComic), false, false, history.mainPath, false, true);
	}
}

async function showIfHasPrevOrNext(path, mainPath)
{
	let _nextComic = await nextComic(path, mainPath);
	let prevComic = await previousComic(path, mainPath);

	let barHeader = template._barHeader();

	let buttonNext = barHeader.querySelector('.button-next-comic');
	let buttonPrev = barHeader.querySelector('.button-prev-comic');

	if(buttonNext)
	{
		if(_nextComic)
			buttonNext.classList.remove('disable-pointer');
	}

	if(buttonPrev)
	{
		if(prevComic)
			buttonPrev.classList.remove('disable-pointer');
	}
}

function pickAtRandom()
{
	const contentRight = template._contentRight();
	const comics = contentRight.querySelectorAll('div:not(.box-content) > .content-view-module > div, .content-view-list .medium-list');

	const random = Math.floor(Math.random() * comics.length);
	const item = comics[random];

	const onclick = item.getAttribute('onclick');

	if(onclick)
		eval(onclick);
}

async function _getFolderThumbnails(file, images, _images, path, folderSha, isAsync = false, forceSize = false)
{
	const viewModuleSize = forceSize ? forceSize : (handlebarsContext.page.viewModuleSize || 150);

	let shaIndex = {};
	let poster = false;

	if(Array.isArray(_images)) // 4 Images
	{
		if(isAsync) dom.queryAll('.sha-'+folderSha+' .folder-poster, .sha-'+folderSha+':not(.medium-list) .progress-pages').remove();

		for(let i = 0, len = _images.length; i < len; i++)
		{
			_images[i].vars = {i: i};
			shaIndex[i] = _images[i].sha;
		}

		_images = cache.returnThumbnailsImages(_images,  function(data, vars) {

			addImageToDom(data.sha, data.path);
			addImageToDom(folderSha+'-'+vars.i, data.path);

		}, file);

		for(let i = 0, len = images.length; i < len; i++)
		{
			let imageCache = _images[shaIndex[i]];

			if(imageCache && imageCache.cache)
			{
				images[i].path = imageCache.path;
				images[i].cache = true;

				if(isAsync)
				{
					addImageToDom(imageCache.sha, imageCache.path, false);
					addImageToDom(folderSha+'-'+i, imageCache.path, false);
				}
			}
		}
	}
	else // Poster
	{
		if(isAsync) dom.queryAll('.sha-'+folderSha+' .folder-images').remove();

		poster = cache.returnThumbnailsImages({path: _images.path, sha: _images.sha, type: 'poster', forceSize: viewModuleSize}, function(data){

			addImageToDom(data.sha, data.path);
			addImageToDom(folderSha+'-0', data.path);

		}, file);

		if(isAsync && poster.path)
		{
			addImageToDom(poster.sha, poster.path, false);
			addImageToDom(folderSha+'-0', poster.path, false);
		}

		poster.sha = folderSha+'-0';

		images = false;
	}

	return {poster: poster, images: images};
}

async function getFolderThumbnails(path, forceSize = false, index = 0, start = 0, end = 99999)
{
	const getProgress = handlebarsContext.page.fadeCompleted || handlebarsContext.page.progressBar || handlebarsContext.page.progressPages || handlebarsContext.page.progressPercent;
	const folderSha = sha1(path+(forceSize ? '?size='+forceSize : ''));

	let poster = {cache: false, path: '', sha: folderSha+'-0'};

	let images = [
		{cache: false, path: '', sha: folderSha+'-0'},
		{cache: false, path: '', sha: folderSha+'-1'},
		{cache: false, path: '', sha: folderSha+'-2'},
		{cache: false, path: '', sha: folderSha+'-3'},
	];

	let progress = false;

	let addToQueue = false;
	let addToQueueProgress = false;
	
	if(index >= start && index <= end)
	{
		try
		{
			let file = fileManager.file(path, {fromThumbnailsGeneration: true, subtask: true});
			file.updateConfig({cacheOnly: true});
			let _images = await file.images(4, false, true);

			_images = await _getFolderThumbnails(file, images, _images, path, folderSha, false, forceSize);

			file.destroy();

			poster = _images.poster;
			images = _images.poster ? false : _images.images;
		}
		catch(error)
		{
			if(error.message && /notCacheOnly/.test(error.message))
			{
				addToQueue = 1;
			}
			else
			{
				console.error(error);

				dom.compressedError(error, false);
				fileManager.requestFileAccess.check(path, error);
			}
		}

		try
		{
			if(getProgress)
				progress = await reading.progress.get(path, true, true);
		}
		catch(error)
		{
			if(error.message && /notCacheOnly/.test(error.message))
				addToQueueProgress = 1;
		}
	}
	else
	{
		addToQueue = 2;
		addToQueueProgress = 2;
	}

	if(forceSize !== null || addToQueue || addToQueueProgress)
	{
		scroll.setStatus(folderSha, {
			index,
			path,
			forceSize,
			thumbnails: addToQueue,
			progress: addToQueueProgress,
			folderSha,
		});
	}

	return {poster: poster, images: images, addToQueue: addToQueue, progress: progress};
}

function calculateVisibleItems(view, scrollTop = false)
{
	const element = template._contentRight().firstElementChild;
	let rect = element.getBoundingClientRect();

	if(rect.width == 0 || rect.height == 0)
		rect = {width: window.innerWidth, height: window.innerHeight};

	scrollTop = scrollTop || 0; // element.scrollTop;

	let start = 0;
	let end = 100;

	if(view == 'module')
	{
		const viewModuleSize = handlebarsContext.page.viewModuleSize || 150;

		const sizes = {
			100: {
				width: 116,
				height: 230,
			},
			150: {
				width: 166,
				height: 305,
			},
			200: {
				width: 216,
				height: 380,
			},
			250: {
				width: 266,
				height: 455,
			},
			300: {
				width: 316,
				height: 530,
			},
		};

		const size = sizes[viewModuleSize];

		const itemsPerLine =  Math.floor((rect.width - 16) / size.width);
		const lines = Math.ceil(rect.height / size.height);
		const line = Math.floor(scrollTop / size.height);

		start = scrollTop ? (line - 1) * itemsPerLine : 0; // 1 margin line
		end = (line + lines + 1) * itemsPerLine; // 1 margin line
	}
	else
	{
		start = scrollTop ? Math.floor(scrollTop / 72) - 4 : 0; // 4 margin items
		end = Math.floor((scrollTop + rect.height) / 72) + 4; // 4 margin items
	}

	return {start: start, end: end};
}

function goStartPath()
{
	const root = history.root();

	if(root.indexLabel?.has && !root.recentlyOpened)
		indexLabel = root.indexLabel;

	if(root.recentlyOpened)
		recentlyOpened.load(true);
	else
		loadIndexPage(true, false);
}

var barBackStatus = false;

// This needs to be improved more, if is from fromNextAndPrev, consider changing the previous route/path
function indexPathControl(path = false, mainPath = false, isComic = false, fromNextAndPrev = false, fromRecentlyOpened = false)
{
	if(path === false || mainPath === false)
	{
		handlebarsContext.fromRecentlyOpened = fromRecentlyOpened;

		history.clean();
		history.add({root: true, file: false, path: false, mainPath: false, isComic: false, indexLabel: prevIndexLabel, recentlyOpened: fromRecentlyOpened});
	}
	else
	{
		mainPathR = addSepToEnd(p.dirname(mainPath));

		const files = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep);
		const index = files.length - 1;

		const current = history.current();

		if(index >= 0)
		{
			const page = {file: files[index], path: path, mainPath: mainPath, isComic: isComic, indexLabel: prevIndexLabel};

			if(current && isComic && fromNextAndPrev && current.isComic)
			{
				history.update(page);
			}
			else if(!current || current.path !== path || current.mainPath !== mainPath || current.isComic !== isComic)
			{
				if(!history.fromGoForwards())
					history.cleanForwards();

				history.add(page);
			}
			else if(current && !current.root)
			{
				history.update(page);
			}
		}
	}

	const current = history.current();

	if(!current.root)
	{
		if(!barBackStatus)
		{
			template.setHeaderDelay();
			handlebarsContext.barBack = 'show';

			dom.queryAll('.bar-left, .bar-back').css({animationDelay: ''});
			dom.queryAll('.bar-left').removeClass('disable', 'active').addClass('show');
		}
		else
		{
			handlebarsContext.barBack = 'active';
		}

		barBackStatus = true;
	}
	else
	{
		if(barBackStatus)
		{
			template.setHeaderDelay();
			handlebarsContext.barBack = 'disable';

			dom.queryAll('.bar-left, .bar-back').css({animationDelay: ''});
			dom.queryAll('.bar-left').removeClass('active', 'show').addClass('disable');
		}
		else
		{
			handlebarsContext.barBack = '';
		}

		barBackStatus = false;
	}
}

/* Page - Recently Opened */

function loadRecentlyOpened(animation = true)
{
	indexPathControl(false);
	selectMenuItem('recently-opened');

	onReading = _onReading = false;

	reading.hideContent();

	generateAppMenu();

	recentlyOpened.load(animation);

	if(readingActive)
		readingActive = false;
}

/* Page - Theme */

/*Page - Languages*/

function loadLanguagesPage(animation = true)
{
	indexPathControl(false);
	selectMenuItem('language');

	onReading = _onReading = false;

	reading.hideContent();

	generateAppMenu();

	if(typeof handlebarsContext.languagesList == 'undefined')
	{
		var languagesList = $.parseJSON(readFileApp('/languages/languagesList.json'));

		handlebarsContext.languagesList = [];

		for(let code in languagesList)
		{
			if(typeof languagesList[code].active != 'undefined' && languagesList[code].active)
			{
				handlebarsContext.languagesList.push({code: code, name: languagesList[code].name, nativeName: languagesList[code].nativeName});
			}
		}
	}

	handlebarsContext.languagesList.sort(function(a, b) {
		
		if(a.nativeName == b.nativeName)
			return 0;

		return a.nativeName > b.nativeName ? 1 : -1;
		
	});

	template.loadContentRight('languages.content.right.html', animation);
	template.loadHeader('languages.header.html', animation);
	template.loadGlobalElement('general.elements.menus.html', 'menus');
	floatingActionButton(false);

	events.events();
	gamepad.updateBrowsableItems('languagesPage');

	if(readingActive)
		readingActive = false;
}

function changeLanguage(lan)
{
	loadLanguage(lan);
	
	template.contentRight('.language-list.active').removeClass('active');
	template.contentRight('.language-list-'+lan).addClass('active');

	dom.loadIndexContentLeft(false);
	template.loadHeader('languages.header.html', false);
	storage.updateVar('config', 'language', lan);

	gamepad.updateBrowsableItems(gamepad.currentKey());
}

/* Page - Settings */

function loadSettingsPage(animation = true)
{
	indexPathControl(false);
	selectMenuItem('settings');

	onReading = _onReading = false;

	reading.hideContent();

	generateAppMenu();

	settings.start();

	template.loadContentRight('settings.content.right.html', animation);
	template.loadHeader('settings.header.html', animation);
	template.loadGlobalElement('general.elements.menus.html', 'menus');
	floatingActionButton(false);

	settings.startSecond();

	if(readingActive)
		readingActive = false;
}

/* Page - Theme */

function loadThemePage(animation = true)
{
	indexPathControl(false);
	selectMenuItem('theme');

	onReading = _onReading = false;

	reading.hideContent();

	generateAppMenu();

	//template.loadContentRight('theme.content.right.html', animation);
	template.loadHeader('theme.header.html', animation);
	template.loadGlobalElement('general.elements.menus.html', 'menus');
	floatingActionButton(false);

	theme.start();

	if(readingActive)
		readingActive = false;
}

var currentSelectMenuItem = false;

function selectMenuItem(page)
{
	currentSelectMenuItem = page;
	let contentLeft = template._contentLeft();

	let active = contentLeft.querySelector('.menu-item.active');
	if(active) active.classList.remove('active');

	page = contentLeft.querySelector('.menu-item-'+page);
	if(page) page.classList.add('active');
}

var addComicButtonsST = false, addComicButtonsActive = false;

function addComicButtons(show = true, first = true)
{
	clearTimeout(addComicButtonsST);

	if(show)
	{
		var more = false, have = false;

		$($('.floating-action-button-min').get().reverse()).each(function(){

			if(!$(this).hasClass('s'))
			{
				if(!have)
					$(this).removeClass('h').addClass('s');
				else
					more = true;

				have = true;
			}

		});

		if(more)
			addComicButtonsST = setTimeout(function(){addComicButtons(true, false)}, 50);

		if(first)
		{
			floatingActionButton(true, 'dom.addComicButtons(false);');
			$('.floating-action-button-add > div').css('transform', 'rotate(135deg)');
		}

		addComicButtonsActive = true;
	}
	else
	{
		var more = false, have = false;

		$('.floating-action-button-min').each(function(){

			if(!$(this).hasClass('h'))
			{
				if(!have)
					$(this).removeClass('s').addClass('h');
				else
					more = true;

				have = true;
			}

		});

		if(more)
			addComicButtonsST = setTimeout(function(){addComicButtons(false, false)}, 50);

		if(first)
		{
			floatingActionButton(true, 'dom.addComicButtons();');
			$('.floating-action-button-add > div').css('transform', '');
		}

		addComicButtonsActive = false;
	}
}

function floatingActionButton(active, callback)
{
	if(active)
	{
		$('.floating-action-button-add').removeClass('disable').attr('onclick', callback);
	}
	else
	{
		if(addComicButtonsActive)
			addComicButtons(false);

		$('.floating-action-button-add').addClass('disable');
	}
}

const defaultSortAndView = {
	view: 'module',
	sort: 'name',
	sortInvert: false,
	continueReading: true,
	recentlyAdded: true,
	viewModuleSize: 150,
};

function setCurrentPageVars(page, _indexLabel = false)
{
	_indexLabel = _indexLabel || {};
	let labelKey = false;
	let sortAndView = false;

	let key = page;

	if(_indexLabel.has)
	{
		if(_indexLabel.favorites)
		{
			labelKey = key = 'favorites';
		}
		else if(_indexLabel.opds)
		{
			labelKey = key = 'opds';
		}
		else if(_indexLabel.masterFolder)
		{
			labelKey = 'masterFolder-'+_indexLabel.index;
			key = 'masterFolder';
		}
		else if(_indexLabel.server)
		{
			labelKey = 'server-'+_indexLabel.index;
			key = 'server';
		}
		else if(_indexLabel.label)
		{
			labelKey = 'label-'+_indexLabel.index;
			key = 'label';
		}

		sortAndView = config.sortAndView[labelKey] || defaultSortAndView;
	}

	let extraKey = '';

	if(page == 'recently-opened')
		extraKey = 'RecentlyOpened';
	else if(page == 'index')
		extraKey = 'Index';
	else if(page == 'reading')
		extraKey = 'Reading';

	const sortAndViewOpds = config.sortAndView.opds || defaultSortAndView;

	handlebarsContext.page = {
		..._indexLabel,
		...{
			key: key,
			name: labelKey ? labelKey : page,
			view: sortAndView ? sortAndView.view : config['view'+extraKey],
			sort: sortAndView ? sortAndView.sort : config['sort'+extraKey],
			sortInvert: sortAndView ? sortAndView.sortInvert : config['sortInvert'+extraKey],
			foldersFirst: sortAndView ? true : (config['foldersFirst'+extraKey] || false),
			compressedFirst: sortAndView ? true : (config['compressedFirst'+extraKey] || false),
			boxes: (page == 'recently-opened' || page == 'browsing') ? false : true,
			continueReading: sortAndView ? sortAndView.continueReading : config['continueReading'+extraKey],
			recentlyAdded: sortAndView ? sortAndView.recentlyAdded : config['recentlyAdded'+extraKey],
			viewModuleSize: sortAndView ? sortAndView.viewModuleSize : config['viewModuleSize'+extraKey],
			filter: _indexLabel.filter || {},
			labelOrFavorites: !!(_indexLabel.label || _indexLabel.favorites),
			fadeCompleted: sortAndView ? sortAndView.fadeCompleted : config['fadeCompleted'+extraKey],
			progressBar: sortAndView ? sortAndView.progressBar : config['progressBar'+extraKey],
			progressPages: sortAndView ? sortAndView.progressPages : config['progressPages'+extraKey],
			progressPercent: sortAndView ? sortAndView.progressPercent : config['progressPercent'+extraKey],
			opds: {
				continueReading: sortAndViewOpds.continueReading,
				recentlyAdded: sortAndViewOpds.recentlyAdded,
			},
		}
	};
}

function changeView(mode, page)
{
	let labelKey = false;
	let sortAndView = false;

	if(/favorites|opds|masterFolder|server|label/.test(page))
	{
		labelKey = page;

		sortAndView = config.sortAndView[labelKey] || defaultSortAndView;
	}

	let changed = false;

	if(sortAndView)
	{
		if(mode != sortAndView.view)
		{
			sortAndView.view = mode;
			config.sortAndView[labelKey] = sortAndView;

			storage.updateVar('config', 'sortAndView', config.sortAndView);
			selectElement('.view-'+mode);
			changed = true;
		}
	}
	else
	{
		let extraKey = '';

		if(page == 'recently-opened')
			extraKey = 'RecentlyOpened';
		else if(page == 'index')
			extraKey = 'Index';
		else if(page == 'reading')
			extraKey = 'Reading';

		if(mode != config['view'+extraKey])
		{
			storage.updateVar('config', 'view'+extraKey, mode);
			selectElement('.view-'+mode);
			changed = true;
		}
	}

	if(changed)
	{
		dom.this(template._globalElement().querySelector('.view-module-size')).class(!(mode == 'module'), 'disable-pointer');
		dom.reload();
	}
}

function changeViewModuleSize(size, end, page)
{
	if(!end) return;

	let labelKey = false;
	let sortAndView = false;

	if(/favorites|opds|masterFolder|server|label/.test(page))
	{
		labelKey = page;

		sortAndView = config.sortAndView[labelKey] || defaultSortAndView;
	}

	let changed = false;

	if(sortAndView)
	{
		if(size != sortAndView.viewModuleSize)
		{
			sortAndView.viewModuleSize = size;
			config.sortAndView[labelKey] = sortAndView;

			storage.updateVar('config', 'sortAndView', config.sortAndView);
			changed = true;
		}
	}
	else
	{
		let extraKey = '';

		if(page == 'recently-opened')
			extraKey = 'RecentlyOpened';
		else if(page == 'index')
			extraKey = 'Index';
		else if(page == 'reading')
			extraKey = 'Reading';

		if(size != config['viewModuleSize'+extraKey])
		{
			storage.updateVar('config', 'viewModuleSize'+extraKey, size);
			changed = true;
		}
	}

	if(changed)
		dom.reload();
}

function changeSort(type, mode, page)
{
	let labelKey = false;
	let sortAndView = false;

	if(/favorites|opds|masterFolder|server|label/.test(page))
	{
		labelKey = page;

		sortAndView = config.sortAndView[labelKey] || defaultSortAndView;
	}

	let changed = false;

	if(sortAndView)
	{
		if(type == 1)
		{
			if(mode != sortAndView.sort)
			{
				sortAndView.sort = mode;
				changed = true;
			}
		}
		else if(type == 2)
		{
			if(mode != sortAndView.sortInvert)
			{
				sortAndView.sortInvert = mode;
				changed = true;
			}
		}

		if(changed)
		{
			config.sortAndView[labelKey] = sortAndView;

			storage.updateVar('config', 'sortAndView', config.sortAndView);
			selectElement('.sort-'+mode);
		}
	}
	else
	{
		let extraKey = '';

		if(page == 'recently-opened')
			extraKey = 'RecentlyOpened';
		else if(page == 'index')
			extraKey = 'Index';
		else if(page == 'reading')
			extraKey = 'Reading';

		if(type == 1)
		{
			if(mode != config['sort'+extraKey])
			{
				storage.updateVar('config', 'sort'+extraKey, mode);
				selectElement('.sort-'+mode);
				changed = true;
			}
		}
		else if(type == 2)
		{
			if(mode != config['sortInvert'+extraKey])
			{
				storage.updateVar('config', 'sortInvert'+extraKey, mode);
				changed = true;
			}
		}
		else if(type == 3)
		{
			if(mode != config['foldersFirst'+extraKey])
			{
				storage.updateVar('config', 'foldersFirst'+extraKey, mode);
				changed = true;
			}
		}
		else if(type == 4)
		{
			if(mode != config['compressedFirst'+extraKey])
			{
				storage.updateVar('config', 'compressedFirst'+extraKey, mode);
				changed = true;
			}
		}
	}

	if(changed)
		dom.reload();
}

function changeConfig(key, value, page)
{
	let labelKey = false;
	let sortAndView = false;

	if(/favorites|opds|masterFolder|server|label/.test(page))
	{
		labelKey = page;

		sortAndView = config.sortAndView[labelKey] || defaultSortAndView;
	}

	let changed = false;

	if(sortAndView)
	{
		sortAndView[key] = value;

		config.sortAndView[labelKey] = sortAndView;
		storage.updateVar('config', 'sortAndView', config.sortAndView);
	}
	else
	{
		let extraKey = '';

		if(page == 'recently-opened')
			extraKey = 'RecentlyOpened';
		else if(page == 'index')
			extraKey = 'Index';

		storage.updateVar('config', key+extraKey, value);
	}

	dom.reload();
}

function selectElement(element)
{
	$(element).parent().children().removeClass('s');
	$(element).addClass('s');
}

//Enable/Disable night mode

function nightMode(force = null)
{
	let _app = document.querySelector('.app');

	if((force === null && _app.classList.contains('night-mode')) || force === false)
	{
		_app.classList.remove('night-mode');
		dom.queryAll('.button-night-mode').html('light_mode');
		handlebarsContext.nightMode = false;
		storage.updateVar('config', 'nightMode', false);
	}
	else
	{
		_app.classList.add('night-mode');
		dom.queryAll('.button-night-mode').html('dark_mode');
		handlebarsContext.nightMode = true;
		storage.updateVar('config', 'nightMode', true);
	}

	nightModeConfig(_app);

	titleBar.setColors();
}

function nightModeConfig(_app = false)
{
	_app = _app || document.querySelector('.app');

	if(config.nightModeBlackBackground)
		_app.classList.add('night-mode-black-background');
	else
		_app.classList.remove('night-mode-black-background');

	if(config.nightModeWhiteBlankPage)
		_app.classList.add('night-mode-white-blank-page');
	else
		_app.classList.remove('night-mode-white-blank-page');
}

let comicContextMenuIndex = 0;

// Show the comic context menu
async function comicContextMenu(path, mainPath, fromIndex = true, fromIndexNotMasterFolders = true, folder = false, gamepad = false)
{	
	comicContextMenuIndex++;

	let isServer = fileManager.isServer(path);
	if(fileManager.isOpds(path)) return;

	const canBeDelete = (!fileManager.isServer(path) && !fileManager.lastCompressedFile(p.dirname(path))) ? true : false;

	dom.query('#index-context-menu .separator-remove').css({display: canBeDelete ? 'block' : 'none'});

	// Remove
	let remove = document.querySelector('#index-context-menu .context-menu-remove');

	if(fromIndexNotMasterFolders)
	{
		remove.style.display = 'block';
		remove.setAttribute('onclick', 'dom.removeComic(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');
	}
	else
	{
		remove.style.display = 'none';
	}

	// Move to trash
	let moveToTrash = document.querySelector('#index-context-menu .context-menu-move-to-trash');

	if(canBeDelete)
	{
		moveToTrash.style.display = 'block';
		moveToTrash.setAttribute('onclick', 'dom.moveToTrash(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\', '+(fromIndexNotMasterFolders ? 'true' : 'false')+');');
	}
	else
	{
		moveToTrash.style.display = 'none';
	}

	// Delete permanently
	let deletePermanently = document.querySelector('#index-context-menu .context-menu-delete-permanently');

	if(canBeDelete)
	{
		deletePermanently.style.display = 'block';
		deletePermanently.setAttribute('onclick', 'dom.deletePermanently(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\', '+(fromIndexNotMasterFolders ? 'true' : 'false')+');');
	}
	else
	{
		deletePermanently.style.display = 'none';
	}

	dom.query('#index-context-menu .separator-labels').css({display: fromIndex ? 'block' : 'none'});

	// Mark read an unread
	let markRead = document.querySelector('#index-context-menu .context-menu-mark-read');
	let markUnread = document.querySelector('#index-context-menu .context-menu-mark-unread');
	let separatorMark = document.querySelector('#index-context-menu .separator-mark');

	if(fromIndex || folder)
	{
		const currentIndex = comicContextMenuIndex;

		markRead.style.display = 'block';
		markUnread.style.display = 'block';
		separatorMark.style.display = 'block';

		markRead.classList.add('disable-pointer');
		markUnread.classList.add('disable-pointer');

		(async function(){

			try
			{
				const progress = await reading.progress.get(path);
				reading.progress.updateProgress(path, progress);

				if(currentIndex !== comicContextMenuIndex)
					return;

				dom.this(markRead).class(progress.completed, 'disable-pointer');
				markRead.setAttribute('onclick', 'reading.progress.read(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');

				dom.this(markUnread).class((progress.percent === 0), 'disable-pointer');
				markUnread.setAttribute('onclick', 'reading.progress.unread(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');
			}
			catch(error)
			{
				console.error(error);
			}

		})()
	}
	else
	{
		markRead.style.display = 'none';
		markUnread.style.display = 'none';
		separatorMark.style.display = 'none';
	}

	// Favorite
	let favorite = document.querySelector('#index-context-menu .context-menu-favorite');

	if(fromIndex || folder)
	{
		let favorites = relative.get('favorites');
		let isFavorte = favorites[path] ? true : false;

		favorite.style.display = 'block';
		favorite.setAttribute('onclick', 'dom.labels.setFavorite(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');

		if(isFavorte)
			favorite.querySelector('i').classList.add('fill');
		else
			favorite.querySelector('i').classList.remove('fill');
	}
	else
	{
		favorite.style.display = 'none';
	}

	// Labels
	let labels = document.querySelector('#index-context-menu .context-menu-labels');

	if(fromIndex || folder)
	{
		labels.style.display = 'block';
		labels.setAttribute('onclick', 'dom.labels.setLabels(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');

		if(dom.labels.has(path))
			labels.querySelector('i').classList.add('fill');
		else
			labels.querySelector('i').classList.remove('fill');
	}
	else
	{
		labels.style.display = 'none';
	}

	if(isServer)
	{
		dom.query('#index-context-menu .separator-poster').css({display: 'none'});

		let openFileLocation = document.querySelector('#index-context-menu .context-menu-open-file-location');
		let addPoster = document.querySelector('#index-context-menu .context-menu-add-poster');
		let deletePoster = document.querySelector('#index-context-menu .context-menu-delete-poster');
		let clearFileCache = document.querySelector('#index-context-menu .context-menu-clear-file-cache');
		let setAsPoster = document.querySelector('#index-context-menu .context-menu-set-as-poster');
		let setAsPosterFolders = document.querySelector('#index-context-menu .context-menu-set-as-poster-folders');

		openFileLocation.style.display = 'none';
		addPoster.style.display = 'none';
		deletePoster.style.display = 'none';
		clearFileCache.style.display = 'none';
		setAsPoster.style.display = 'none';
		setAsPosterFolders.style.display = 'none';
	}
	else
	{
		dom.query('#index-context-menu .separator-poster').css({display: 'block'});

		// Open file location
		let openFileLocation = document.querySelector('#index-context-menu .context-menu-open-file-location');
		openFileLocation.setAttribute('onclick', 'electron.shell.showItemInFolder(\''+escapeQuotes(escapeBackSlash(fileManager.firstCompressedFile(path)), 'simples')+'\');');
		openFileLocation.style.display = 'block';

		// Add poster and delete
		let addPoster = document.querySelector('#index-context-menu .context-menu-add-poster');
		let deletePoster = document.querySelector('#index-context-menu .context-menu-delete-poster');
		addPoster.style.display = 'block';
		deletePoster.style.display = 'block';

		if(folder)
		{
			addPoster.style.display = 'block';

			let images = [];

			try
			{
				let file = fileManager.file(path, {subtask: true});
				images = await file.images(2, false, true);
				file.destroy();
			}
			catch{}

			let poster = !Array.isArray(images) ? images : false;

			addPoster.setAttribute('onclick', 'dom.poster.add('+(fromIndexNotMasterFolders ? 'true' : 'false')+', \''+escapeQuotes(escapeBackSlash(path), 'simples')+'\', '+(poster ? '\''+escapeQuotes(escapeBackSlash(poster.path), 'simples')+'\'' : 'false')+');');
			addPoster.querySelector('span').innerHTML = poster ? language.global.contextMenu.changePoster : language.global.contextMenu.addPoster;

			if(poster && !poster.fromFirstImageAsPoster)
			{
				deletePoster.style.display = 'block';
				deletePoster.setAttribute('onclick', 'dom.poster.delete(\''+escapeQuotes(escapeBackSlash(poster.path), 'simples')+'\');');
			}
			else
			{
				deletePoster.style.display = 'none';
			}

			openFileLocation.querySelector('span').innerHTML = language.global.contextMenu.openFolderLocation;
		}
		else
		{
			addPoster.style.display = 'none';
			deletePoster.style.display = 'none';

			openFileLocation.querySelector('span').innerHTML = language.global.contextMenu.openFileLocation;
		}

		// Set image as poster
		let setAsPoster = document.querySelector('#index-context-menu .context-menu-set-as-poster');
		let setAsPosterFolders = document.querySelector('#index-context-menu .context-menu-set-as-poster-folders');

		if(!folder)
		{
			setAsPoster.style.display = 'block';
			setAsPosterFolders.style.display = 'block';

			setAsPoster.setAttribute('onclick', 'dom.poster.setAsPoster(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');
			setAsPosterFolders.setAttribute('onclick', 'dom.poster.setAsPosterFolders(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\', \''+escapeQuotes(escapeBackSlash(mainPath), 'simples')+'\');');
		}
		else
		{
			setAsPoster.style.display = 'none';
			setAsPosterFolders.style.display = 'none';
		}

		// Clear file cache
		let clearFileCache = document.querySelector('#index-context-menu .context-menu-clear-file-cache');

		clearFileCache.setAttribute('onclick', 'dom.clearFileCache.clear(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');
		clearFileCache.style.display = folder ? 'block' : 'none';
	}

	// File info
	let fileInfo = document.querySelector('#index-context-menu .context-menu-file-info');

	fileInfo.setAttribute('onclick', 'dom.fileInfo.show(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');
	fileInfo.style.display = folder ? 'block' : 'none';

	if(/app\.asar\.unpacked/.test(path)) // Is the Pepper & Carrot example comic
	{
		let addPoster = document.querySelector('#index-context-menu .context-menu-add-poster');
		let deletePoster = document.querySelector('#index-context-menu .context-menu-delete-poster');
		let setAsPoster = document.querySelector('#index-context-menu .context-menu-set-as-poster');
		let setAsPosterFolders = document.querySelector('#index-context-menu .context-menu-set-as-poster-folders');
		let moveToTrash = document.querySelector('#index-context-menu .context-menu-move-to-trash');
		let deletePermanently = document.querySelector('#index-context-menu .context-menu-delete-permanently');

		addPoster.style.display = 'none';
		deletePoster.style.display = 'none';
		setAsPoster.style.display = 'none';
		setAsPosterFolders.style.display = 'none';
		moveToTrash.style.display = 'none';
		deletePermanently.style.display = 'none';

		if(!fromIndex)
		{
			dom.query('#index-context-menu .separator-poster').css({display: 'none'});
			dom.query('#index-context-menu .separator-remove').css({display: 'none'});
		}
	}

	if(gamepad)
		events.activeMenu('#index-context-menu', false, 'gamepad');
	else
		events.activeContextMenu('#index-context-menu');
}

// Remove the comic from OpenComic
function removeComic(path, confirm = false, reload = true)
{
	path = relative.path(path);
	var _comics = [], comics = storage.get('comics');

	for(let i in comics)
	{
		if(comics[i].path != path)
			_comics.push(comics[i]);
	}

	storage.update('comics', _comics);

	if(reload) dom.reload();
}

async function moveToTrash(path, fromIndexNotMasterFolders = false, confirm = false)
{
	await dom.poster.findAndDelete(path, true, true);
	await electron.ipcRenderer.invoke('move-to-trash', path);

	if(fromIndexNotMasterFolders)
		dom.removeComic(path, true, false);

	dom.reload();
}

async function deletePermanently(path, fromIndexNotMasterFolders = false, confirm = false)
{
	if(confirm)
	{
		await dom.poster.findAndDelete(path, false, true);

		fs.rmSync(path, {recursive: true});

		if(fromIndexNotMasterFolders)
			dom.removeComic(path, true, false);

		dom.reload();
	}
	else
	{
		events.dialog({
			header: language.global.contextMenu.deletePermanently,
			width: 400,
			height: false,
			content: language.global.contextMenu.deletePermanentlyConfirm,
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.global.contextMenu.deletePermanently,
					function: 'events.closeDialog(); dom.deletePermanently(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\', '+(fromIndexNotMasterFolders ? 'true' : 'false')+', true);',
				}
			],
		});
	}
}


var readingActive = false, skipNextComic = false, skipPreviousComic = false;

async function openComic(animation = true, path = true, mainPath = true, end = false, fromGoBack = false, fromNextAndPrev = false)
{
	fileManager.revokeAllObjectURL();
	reading.render.revokeAllObjectURL();
	workers.clean('convertImageToBlob');

	dom.setCurrentPageVars('reading');

	// Start reading comic
	if(config.readingStartReadingInFullScreen && !fromNextAndPrev && !fromGoBack)
	{
		if(!isFullScreen)
			fullScreen(true);
	}

	reading.setIsLoaded(false);
	onReading = _onReading = true;

	currentPathScrollTop[currentPath === false ? 0 : currentPath] = template.contentRight().children().scrollTop();
	currentPath = path;

	let now = Date.now();

	let startImage = false;
	let imagePath = path;
	let indexStart = 1;

	if(compatible.image(path))
	{
		startImage = path;
		path = p.dirname(path);
	}

	// Show loadign page
	headerPath(path, mainPath, true);

	// Load files
	let file = fileManager.file(path);
	let files = [];

	try
	{
		files = await file.read({filtered: false, sort: {extraKey: 'Reading'}});
	}
	catch(error)
	{
		console.error(error);
		dom.compressedError(error);

		return;
	}

	let hasMusic = await reading.music.has(files, path);
	handlebarsContext.hasMusic = hasMusic;

	files = fileManager.filtered(files);

	handlebarsContext.comics = [];

	if(!template._contentRight().querySelector('.loading'))
	{
		handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', animation);
		file.updateContentRightIndex();
	}

	template.loadHeader('reading.header.html', animation);
	template.loadContentLeft('reading.content.left.html', animation);

	let isCanvas = false;
	let isEbook = false;
	let compressedFile = fileManager.lastCompressedFile(path);

	if(hasMusic) files.push(hasMusic); // Only to make available

	if(compressedFile)
	{
		let features = fileManager.fileCompressed(compressedFile);
		features = features.getFeatures();

		if(features.canvas)
		{
			await file.makeAvailable([{path: compressedFile}]);
			isCanvas = true;
		}
		else if(features.ebook)
		{
			await file.makeAvailable([{path: compressedFile}]);
			isEbook = true;
			// files = [];
		}
		else
		{
			await file.makeAvailable(files);
		}
	}
	else if(fileManager.isServer(path))
	{
		await file.makeAvailable(files, false, true);
	}

	await fileManager.convertUnsupportedImages(files);

	if(hasMusic) files.pop(); // Remove now

	file.destroy();

	skipNextComic = await nextComic(path, mainPath);
	skipPreviousComic = await previousComic(path, mainPath);

	// The user has gone back before finishing loading
	if(!onReading)
		return;

	if(!fromGoBack)
		indexPathControl(imagePath, mainPath, true, fromNextAndPrev);

	readingActive = true;

	cache.cleanQueue();
	cache.stopQueue();

	let comics = [];

	if(files)
	{
		let len = files.length;
		let images = [];

		for(let i = 0; i < len; i++)
		{
			let file = files[i];

			if(!file.folder && !file.compressed)
				images.push(file);
		}

		for(let i = 0; i < len; i++)
		{
			let file = files[i];

			if(file.folder || file.compressed)
			{
				let fileImage = fileManager.file(file.path);
				let images = await fileImage.images(4);
				fileImage.destroy();

				if(images.length > 0)
				{
					comics.push({
						name: file.name,
						path: file.path,
						mainPath: mainPath,
						fristImage: images[0].path,
						images: images,
						folder: true,
					});
				}
			}
			else
			{
				comics.push({
					sha: file.sha,
					name: file.name.replace(/\.[^\.]*$/, ''),
					image: fileManager.realPath(file.path),
					path: file.path,
					mainPath: mainPath,
					size: file.size || false,
					canvas: isCanvas,
					ebook: isEbook,
					folder: false,
				});		
			}
		}
	}

	for(let i = 0, len = comics.length; i < len; i++)
	{
		comics[i].index = i + 1;

		if(comics[i].path == imagePath)
			indexStart = comics[i].index;
	}

	if(isEbook)
		comics = [];

	handlebarsContext.comics = comics;
	handlebarsContext.previousComic = skipPreviousComic;
	handlebarsContext.nextComic = skipNextComic;
	reading.setCurrentComics(comics);

	handlebarsContext.loading = true;

	if(Date.now() - now < 200)
	{
		if(template._contentRight().querySelector('.loading') && !template._contentRight().querySelector('.reading-body'))
		{
			handlebarsContext.loading = false;
			template._contentRight().firstElementChild.insertAdjacentHTML('beforeend', template.load('reading.content.right.html'));
		}
		else
		{
			template._contentRight().firstElementChild.innerHTML = template.load('reading.content.right.html');
		}

		template._contentLeft().firstElementChild.innerHTML = template.load('reading.content.left.html');
	}
	else
	{
		template.loadContentLeft('reading.content.left.html', animation);
		template.loadContentRight('reading.content.right.html', animation);
	}

	template._contentLeft().firstElementChild.style.height = 'calc(100% - 66px)';

	if(template.globalElement('.reading-elements-menus').length == 0) template.loadGlobalElement('reading.elements.menus.html', 'menus');

	floatingActionButton(false);
	
	events.events();

	reading.onLoad(function(){

		cache.resumeQueue();
		reading.discord.update();

	});

	reading.read(path, indexStart, end, isCanvas, isEbook, imagePath);
	reading.hideContent(isFullScreen, true);
	reading.music.read(hasMusic);

	generateAppMenu();
	
	shortcuts.register('reading');
	gamepad.updateBrowsableItems('reading-'+sha1(path));
}

// Gamepad events
gamepad.setButtonEvent('reading', 1, function(key, button) {

	if(key == 1 && (!onReading || document.querySelector('.menu-simple.a')))
		gamepad.goBack();

});

module.exports = {
	loadIndexPage: loadIndexPage,
	loadIndexContentLeft: loadIndexContentLeft,
	loadIndexHeader: loadIndexHeader,
	indexHeader: indexHeader,
	headerPath: headerPath,
	setIndexLabel: setIndexLabel,
	setPrevIndexLabel: setPrevIndexLabel,
	prevIndexLabel: function(){return prevIndexLabel},
	reloadIndex: reloadIndex,
	reload: reload,
	loadRecentlyOpened: loadRecentlyOpened,
	loadLanguagesPage: loadLanguagesPage,
	loadSettingsPage: loadSettingsPage,
	loadThemePage: loadThemePage,
	changeLanguage: changeLanguage,
	selectMenuItem: selectMenuItem,
	floatingActionButton: floatingActionButton,
	setCurrentPageVars: setCurrentPageVars,
	changeView: changeView,
	changeViewModuleSize: changeViewModuleSize,
	changeSort: changeSort,
	changeBoxes: changeConfig,
	changeConfig: changeConfig,
	indexPathControl: indexPathControl,
	goStartPath: goStartPath,
	selectElement: selectElement,
	openComic: openComic,
	nextComic: function(){return skipNextComic},
	previousComic: function(){return skipPreviousComic},
	goNextComic: goNextComic,
	goPrevComic: goPrevComic,
	pickAtRandom: pickAtRandom,
	orderBy: orderBy,
	nightMode: nightMode,
	nightModeConfig: nightModeConfig,
	addComicButtons: addComicButtons,
	comicContextMenu: comicContextMenu,
	removeComic: removeComic,
	moveToTrash: moveToTrash,
	deletePermanently: deletePermanently,
	compressedError: compressedError,
	addImageToDom: addImageToDom,
	addProgressToDom: addProgressToDom,
	addSepToEnd: addSepToEnd,
	currentPathScrollTop: function(){return currentPathScrollTop},
	getFolderThumbnails: getFolderThumbnails,
	_getFolderThumbnails: _getFolderThumbnails,
	translatePageName: translatePageName,
	metadataPathName: metadataPathName,
	setWindowTitle: setWindowTitle,
	fromLibrary: fromLibrary,
	continueReadingError: continueReadingError,
	calculateVisibleItems: calculateVisibleItems,
	poster: domPoster,
	search: search,
	labels: labels,
	fileInfo: fileInfo,
	clearFileCache: clearFileCache,
	boxes: boxes,
	header: header,
	history: history,
	scroll: scroll,
	this: domManager.this,
	query: domManager.query,
	queryAll: domManager.queryAll,
};
