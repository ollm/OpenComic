const domPoster = require(p.join(appDir, 'scripts/dom/poster.js')),
	domManager = require(p.join(appDir, 'scripts/dom/dom.js')),
	search = require(p.join(appDir, 'scripts/dom/search.js'));

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
		if (aValue > bValue) return 1;

		if (aValue < bValue) return -1;

		return 0;
	}
	else if(mode == 'real-numeric')
	{
		if (aValue > bValue) return 1;

		if (aValue < bValue) return -1;

		return 0;
	}
	else if(mode == 'numeric')
	{
		let matchA = aValue.match(/([0-9]+)/g);
		let matchB = bValue.match(/([0-9]+)/g);

		if(!matchA) return 1;

		if(!matchB) return -1;

		for(let i = 0, len1 = matchA.length, len2 = matchB.length; i < len1 && i < len2; i++)
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
		let matchA = aValue.match(/([0-9]+|.?)/g);
		let matchB = bValue.match(/([0-9]+|.?)/g);

		if(!matchA) return 1;

		if(!matchB) return -1;

		for (let i = 0, len1 = matchA.length, len2 = matchB.length; i < len1 && i < len2; i++)
		{
			if(isNaN(matchA[i]) || isNaN(matchB[i]))
			{
				if (matchA[i] > matchB[i]) return 1;

				if (matchA[i] < matchB[i]) return -1;
			}
			else
			{
				if (+matchA[i] > +matchB[i]) return 1;

				if (+matchA[i] < +matchB[i]) return -1;
			}
		}

		return (matchA.length < matchB.length) ? 1 : -1;
	}
}


//Get reading progres of path
function getReadingProgress(path, callback)
{
	path = p.normalize(path);

	var readingProgress = storage.getKey('readingProgress');

	for(let rpPath in readingProgress)
	{
		var data = readingProgress[rpPath];

		if(typeof data.progress[path] !== 'undefined')		
			return data;
	}

	return false;
}

function calcReadingProgress(path, mainPath, callback)
{
	(function(path, mainPath, callback){

		process.nextTick(function() {

			var progress = calcReadingProgressWD(path, mainPath, callback);

			if(checkError(progress))
			{
				(function(error, path, mainPath, callback){

					fileCompressed.addCompressedFilesQueue(error.compressedPath, false, function(files){

						if(!checkError(files))
							dom.calcReadingProgress(path, mainPath, callback);
						else
							callback(files);

					});

				})(progress, path, mainPath, callback)
			}
			else
			{
				if(callback)
					callback(progress);
			}
		});

	})(path, mainPath, callback);
}

function calcReadingProgressWD()
{

}

function addImageToDom(querySelector, path, animation = true)
{
	let backgroundImage = 'url('+path+')';

	let src = dom.queryAll('.fi-sha-'+querySelector+' img, .sha-'+querySelector+' img, img.fi-sha-'+querySelector).setAttribute('src', path);

	let ri = dom.queryAll('.ri-sha-'+querySelector).setAttribute('src', path);
	let cr = dom.queryAll('.continue-reading-sha-'+querySelector+', .search-result-sha-'+querySelector).css({backgroundImage: backgroundImage});

	if(animation)
	{
		src.addClass('a');
		cr.addClass('a');
	}
	else
	{
		src.filter('.folder-poster-img').addClass('has-poster');
	}
}

async function loadFilesIndexPage(file, animation, path, keepScroll, mainPath)
{
	return file.read().then(async function(files){

		queue.clean('folderThumbnails');

		let pathFiles = [];
		let thumbnails = [];

		// Get comic reading progress image
		let readingProgress = storage.get('readingProgress');

		if(files)
		{
			let images = [];

			for(let i = 0, len = files.length; i < len; i++)
			{
				let _file = files[i];

				if(inArray(mime.getType(_file.path), compatibleMime))
				{
					images.push(files[i]);
				}
			}

			if(readingProgress[mainPath] && readingProgress[mainPath].lastReading > 0)
			{
				let path = readingProgress[mainPath].path;
				let sha = sha1(path);

				images.push({path: path, sha: sha});

				readingProgress[mainPath].sha = sha;
			}

			thumbnails = cache.returnThumbnailsImages(images, function(data){

				addImageToDom(data.sha, data.path);

			}, file);

			for(let i = 0, len = files.length; i < len; i++)
			{
				let file = files[i];
				let fileName = file.name;
				let filePath = file.path;

				let realPath = fileManager.realPath(filePath, -1);

				if(inArray(mime.getType(realPath), compatibleMime))
				{
					let sha = file.sha;

					let thumbnail = thumbnails[file.sha];

					pathFiles.push({
						sha: sha,
						name: fileName.replace(/\.[^\.]*$/, ''),
						path: filePath,
						mainPath: mainPath,
						thumbnail: (thumbnail.cache) ? thumbnail.path : '',
						folder: false,
					});
				}
				else if(file.folder || file.compressed)
				{
					let images = await getFolderThumbnails(filePath);

					pathFiles.push({
						sha: file.sha,
						name: fileName,
						path: filePath,
						mainPath: mainPath,
						poster: images.poster,
						images: images.images,
						folder: true,
						compressed: file.compressed,
					});
				}
			}
		}
		else
		{
			if(readingProgress[mainPath] && readingProgress[mainPath].lastReading > 0)
			{
				let path = readingProgress[mainPath].path;
				let sha = sha1(path);

				let thumbnail = cache.returnThumbnailsImages({path: path, sha: sha}, function(data){

					addImageToDom(data.sha, data.path);

				}, file);

				readingProgress[mainPath].sha = sha;
				thumbnails[sha] = thumbnail;
			}
		}

		handlebarsContext.comics = pathFiles;

		// Comic reading progress
		if(readingProgress[mainPath] && readingProgress[mainPath].lastReading > 0)
		{
			let path = readingProgress[mainPath].path;
			let sha = readingProgress[mainPath].sha;

			let thumbnail = thumbnails[sha];

			readingProgress[mainPath].sha = sha;
			readingProgress[mainPath].thumbnail = (thumbnail.cache) ? thumbnail.path : '';
			readingProgress[mainPath].mainPath = mainPath;	
			readingProgress[mainPath].pathText = returnTextPath(readingProgress[mainPath].path, mainPath, true);	
			handlebarsContext.comicsReadingProgress = readingProgress[mainPath];
		}
		else
		{
			handlebarsContext.comicsReadingProgress = false;
		}

		if(keepScroll > 1)
			template.contentRight().children().html(template.load('index.content.right.'+config.view+'.html')).scrollTop(keepScroll);
		else
			template.contentRight().children().html(template.load('index.content.right.'+config.view+'.html'));

		//template.loadContentRight('index.content.right.'+config.view+'.html', animation, keepScroll);
		events.events();

		return pathFiles;

	}).catch(function(error){

		console.error(error);
		dom.compressedError(error);

		return [];

	});

}

async function reloadIndex()
{
	loadIndexPage(true, indexPathA, true, true, indexMainPathA);
}

var currentPath = false, currentPathScrollTop = [], fromIgnoreSingleFoldersNow = 0;

async function loadIndexPage(animation = true, path = false, content = false, keepScroll = false, mainPath = false, fromGoBack = false, disableIgnoreSingleFolders = false, fromIgnoreSingleFolders = false)
{
	selectMenuItem('library');

	onReading = _onReading = false;

	reading.hideContent();

	generateAppMenu();

	currentPathScrollTop[currentPath === false ? 0 : currentPath] = template.contentRight().children().scrollTop();

	for(let _path in currentPathScrollTop)
	{
		if(_path != 0 && !new RegExp('^'+pregQuote(_path)).test(path))
			delete currentPathScrollTop[_path];
	}

	if(currentPathScrollTop[path === false ? 0 : path])
		keepScroll = currentPathScrollTop[path === false ? 0 : path];

	currentPath = path;

	if(!path)
	{
		indexPathControl(false);

		let sort = config.sortIndex;
		let sortInvert = config.sortInvertIndex;
		let foldersFirst = config.foldersFirstIndex;

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

		// Get comics in master folders
		let masterFolders = storage.get('masterFolders');
		let pathInMasterFolder = {};

		if(!isEmpty(masterFolders))
		{
			for(let key in masterFolders)
			{
				if(fs.existsSync(masterFolders[key]))
				{
					let file = fileManager.file(masterFolders[key]);
					let files = await file.readDir();
					file.destroy();

					for(let i = 0, len = files.length; i < len; i++)
					{
						let folder = files[i];

						if((folder.folder || folder.compressed) && !pathInMasterFolder[folder.path])
						{
							comics.push({
								name: folder.name,
								path: folder.path,
								added: Math.round(fs.statSync(folder.path).mtimeMs / 1000),
								folder: true,
								compressed: folder.compressed,
								fromMasterFolder: true,
							});

							pathInMasterFolder[folder.path] = true;
						}
					}
				}
			}
		}

		// Get comics in library
		let comicsStorage = storage.get('comics');

		if(!isEmpty(comicsStorage))
		{
			for(let key in comicsStorage)
			{
				if(!pathInMasterFolder[comicsStorage[key].path] && fs.existsSync(comicsStorage[key].path))
					comics.push(comicsStorage[key]);
			}
		}

		cache.cleanQueue();
		cache.stopQueue();

		if(comics.length > 0)
		{
			// Comic reading progress
			let readingProgress = storage.get('readingProgress');

			for(let key in comics)
			{
				let images = await getFolderThumbnails(comics[key].path);

				comics[key].sha = sha1(comics[key].path);
				comics[key].poster = images.poster;
				comics[key].images = images.images;
				comics[key].mainPath = config.showFullPathLibrary ? p.parse(comics[key].path).root : comics[key].path;
				comics[key].readingProgress = readingProgress[comics[key].path] || {};
			}

			comics.sort(function (a, b) {
				return (sortInvert) ? -(orderBy(a, b, order, orderKey, orderKey2)) : orderBy(a, b, order, orderKey, orderKey2);
			});
		}

		handlebarsContext.comics = comics;
		handlebarsContext.comicsIndex = true;
		handlebarsContext.comicsIndexVar = 'true';
		handlebarsContext.comicsReadingProgress = false;

		template.loadContentRight('index.content.right.'+config.viewIndex+'.html', animation, keepScroll);

		cache.resumeQueue();

		handlebarsContext.headerTitle = false;
		handlebarsContext.headerTitlePath = false;
		template.loadHeader('index.header.html', animation);

		if(!content)
		{
			if(template.contentLeft('.menu-list').length === 0) template.loadContentLeft('index.content.left.html', animation);
			template.loadGlobalElement('index.elements.menus.html', 'menus');
			floatingActionButton(true, 'dom.addComicButtons();');
		}

		events.events();

	}
	else
	{
		if(!fromGoBack)
			indexPathControl(path, mainPath);

		handlebarsContext.comics = [];
		handlebarsContext.comicsIndex = false;
		handlebarsContext.comicsIndexVar = 'false';
		handlebarsContext.comicsDeep2 = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep).length >= 2 ? true : false;

		if(handlebarsContext.comicsDeep2)
			showIfHasPrevOrNext(path, mainPath);

		headerPath(path, mainPath);

		if(fromIgnoreSingleFolders && Date.now() - fromIgnoreSingleFoldersNow < 300)
		{
			template._barHeader().firstElementChild.innerHTML = template.load('index.header.html');
			template._contentRight().firstElementChild.innerHTML = template.load('index.content.right.loading.html');
		}
		else
		{
			template.loadHeader('index.header.html', animation);
			template.loadContentRight('index.content.right.loading.html', animation, keepScroll);
		}

		if(!content)
		{
			if(readingActive)
			{
				template.loadContentLeft('index.content.left.html', animation);
			}

			template.loadGlobalElement('index.elements.menus.html', 'menus');
			floatingActionButton(false);
		}

		cache.cleanQueue();
		cache.stopQueue();

		let file = fileManager.file(path);
		let files = await loadFilesIndexPage(file, animation, path, keepScroll, mainPath);
		file.destroy();

		if(config.ignoreSingleFoldersLibrary && !fromGoBack && !disableIgnoreSingleFolders && files.length == 1 && (files[0].folder || files[0].compressed))
		{
			fromIgnoreSingleFoldersNow = Date.now();

			indexPathControlA.pop();

			dom.loadIndexPage(true, files[0].path, false, false, files[0].mainPath, false, false, true);

			return;
		}

		cache.resumeQueue();
	}

	if(readingActive)
		readingActive = false;

	shortcuts.register('browse');
	gamepad.updateBrowsableItems(path ? sha1(path) : 'library');
}

function compressedError(error)
{
	//console.log(error);

	electronRemote.dialog.showMessageBox({
		type: 'error',
		title: language.error.uncompress.title,
		message: language.error.uncompress.message,
		detail: error.detail || error.message,
	});
}

function addSepToEnd(path)
{
	if(!new RegExp(pregQuote(p.sep)+'\s*$').test(path))
		path = path + p.sep;

	return path;
}

function returnTextPath(path, mainPath, image = false)
{
	mainPathR = addSepToEnd(p.dirname(mainPath));

	var files = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep);

	var path = [];

	for(let index in files)
	{
		path.push(image ? htmlEntities(files[index]) : files[index]);
	}

	return path.join(image ? '<i class="material-icon navegation">chevron_right</i>' : ' / '); 
}

function headerPath(path, mainPath)
{
	mainPathR = addSepToEnd(p.dirname(mainPath));

	var files = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep);

	var path = [];

	var pathJoin = mainPathR;

	for(let index in files)
	{
		pathJoin = p.join(pathJoin, files[index]);

		path.push({name: files[index], path: p.normalize(pathJoin), mainPath: mainPath});
	}

	if(path.length > 0)
		path[path.length - 1].last = true;

	handlebarsContext.headerTitlePath = path;
}

async function nextComic(path, mainPath)
{
	let file = fileManager.file(mainPath);
	let image = await file.images(1, path);
	file.destroy();

	return image && image.path ? image.path : false;
}

async function previousComic(path, mainPath)
{
	let file = fileManager.file(mainPath);
	let image = await file.images(-1, path);
	file.destroy();

	return image && image.path ? image.path : false;
}

async function goNextComic(path, mainPath)
{
	let _nextComic = await nextComic(indexPathA, indexMainPathA);

	if(_nextComic)
	{
		dom.loadIndexPage(true, p.dirname(_nextComic), false, false, indexMainPathA);
	}
}

async function goPrevComic(path, mainPath)
{
	let prevComic = await previousComic(indexPathA, indexMainPathA);

	if(prevComic)
	{
		dom.loadIndexPage(true, p.dirname(prevComic), false, false, indexMainPathA);
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

async function _getFolderThumbnails(file, images, _images, path, folderSha, isAsync = false)
{
	let shaIndex = {};

	let poster = false;

	if(Array.isArray(_images))
	{
		if(isAsync) dom.queryAll('.sha-'+folderSha+' .folder-poster').remove();

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
					addImageToDom(imageCache.sha, imageCache.path);
					addImageToDom(folderSha+'-'+i, imageCache.path);
				}
			}
		}
	}
	else
	{
		if(isAsync) dom.queryAll('.sha-'+folderSha+' .folder-images').remove();

		poster = cache.returnThumbnailsImages({path: _images.path, sha: _images.sha}, function(data){

			addImageToDom(data.sha, data.path);
			addImageToDom(folderSha+'-0', data.path);

		}, file);

		poster.sha = folderSha+'-0';

		images = false;
	}

	return {poster: poster, images: images};
}

async function getFolderThumbnails(path)
{
	let folderSha = sha1(path);

	let poster = {cache: false, path: '', sha: folderSha+'-0'};

	let images = [
		{cache: false, path: '', sha: folderSha+'-0'},
		{cache: false, path: '', sha: folderSha+'-1'},
		{cache: false, path: '', sha: folderSha+'-2'},
		{cache: false, path: '', sha: folderSha+'-3'},
	];
	
	try
	{
		let file = fileManager.file(path);
		file.updateConfig({cacheOnly: true});
		let _images = await file.images(4, false, true);

		_images = await _getFolderThumbnails(file, images, _images, path, folderSha);

		file.destroy();

		poster = _images.poster;
		images = _images.poster ? false : _images.images;
	}
	catch(error)
	{
		if(error.message && error.message === 'notCacheOnly')
		{
			queue.add('folderThumbnails', async function(path, folderSha) {

				let file = fileManager.file(path);
				let _images = await file.images(4, false, true);

				await _getFolderThumbnails(file, images, _images, path, folderSha, true);

				file.destroy();

				return;

			}, path, folderSha);
		}
		else
		{
			console.error(error);
			dom.compressedError(error);
		}
	}

	return {poster: poster, images: images};
}

var indexPathControlA = [], indexPathA = false, indexMainPathA = false;

function indexPathControlGoBack()
{
	if(indexPathControlA.length == 1)
	{
		loadIndexPage(true, false);
	}
	else if(indexPathControlA.length > 0)
	{
		let goBack = indexPathControlA[indexPathControlA.length - 2];

		if(goBack.isComic)
			openComic(true, goBack.path, goBack.mainPath, false, true);
		else
			loadIndexPage(true, goBack.path, false, false, goBack.mainPath, true);


		indexPathControlA.pop();

		indexPathA = goBack.path;
		indexMainPathA = goBack.mainPath;
	}
}

function indexPathControlUpdateLastComic(path = false)
{
	let index = indexPathControlA.length - 1;
	let last = indexPathControlA[index];

	if(last.isComic && p.normalize(p.dirname(last.path)) === p.normalize(p.dirname(path)))
	{
		indexPathControlA[index].file = p.basename(path);
		indexPathControlA[index].path = path;
	}
}

var barBackStatus = false; 

// This needs to be improved more, if is from fromNextAndPrev, consider changing the previous route/path
function indexPathControl(path = false, mainPath = false, isComic = false, fromNextAndPrev = false)
{
	indexPathA = path;
	indexMainPathA = mainPath;

	if(path === false || mainPath === false)
	{
		indexPathControlA = [];
	}
	else
	{
		mainPathR = addSepToEnd(p.dirname(mainPath));

		let files = path.replace(new RegExp('^\s*'+pregQuote(mainPathR)), '').split(p.sep);

		let index = files.length - 1;

		let len = indexPathControlA.length;

		if(index >= 0)
		{
			if(len > 0 && isComic && fromNextAndPrev && indexPathControlA[len-1].isComic) // 
				indexPathControlA[len-1] = {file: files[index], path: path, mainPath: mainPath, isComic: isComic};
			else
				indexPathControlA.push({file: files[index], path: path, mainPath: mainPath, isComic: isComic});
		}
	}

	if(indexPathControlA.length > 0)
	{
		if(!barBackStatus)
		{
			handlebarsContext['bar-back'] = 'show';
			$('.bar-back').removeClass('disable active').addClass('show');
		}
		else
		{
			handlebarsContext['bar-back'] = 'active';
		}

		barBackStatus = true;
	}
	else
	{
		if(barBackStatus)
		{
			handlebarsContext['bar-back'] = 'disable';
			$('.bar-back').removeClass('active show').addClass('disable');
		}
		else
		{
			handlebarsContext['bar-back'] = '';
		}

		barBackStatus = false;
	}
}

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

	template.loadContentLeft('index.content.left.html', false);
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

	template.loadContentRight('settings.content.right.html', animation);
	template.loadHeader('settings.header.html', animation);
	template.loadGlobalElement('general.elements.menus.html', 'menus');
	floatingActionButton(false);

	settings.start();

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

function selectMenuItem(page)
{
	let contentLeft = template.contentLeft().get(0);
	//let contentLeft = dom.this(contentLeft);

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

function changeView(mode, index)
{
	var icon = '';

	if(mode == 'module')
		icon = 'view_module';
	else
		icon = 'sort';

	if(index)
	{
		if(mode != config.viewIndex)
		{
			storage.updateVar('config', 'viewIndex', mode);
			//$('.button-view').html(icon);
			selectElement('.view-'+mode);
			loadIndexPage(true, false, true, true);
		}
	}
	else
	{
		if(mode != config.view)
		{
			storage.updateVar('config', 'view', mode);
			//$('.button-view').html(icon);
			selectElement('.view-'+mode);
			loadIndexPage(true, indexPathA, true, true, indexMainPathA);
		}
	}
}

function changeSort(type, mode, index)
{
	if(type == 1)
	{
		if(index)
		{
			if(mode != config.sortIndex)
			{
				storage.updateVar('config', 'sortIndex', mode);
				selectElement('.sort-'+mode);
				loadIndexPage(true, false, true, true);
			}
		}
		else
		{
			if(mode != config.sort)
			{
				storage.updateVar('config', 'sort', mode);
				selectElement('.sort-'+mode);
				loadIndexPage(true, indexPathA, true, true, indexMainPathA);
			}
		}
	}
	else if(type == 2)
	{
		if(index)
		{
			if(mode != config.sortInvertIndex)
			{
				storage.updateVar('config', 'sortInvertIndex', mode);
				selectElement('.sort-'+mode);
				loadIndexPage(true, false, true, true);
			}
		}
		else
		{
			if(mode != config.sortInvert)
			{
				storage.updateVar('config', 'sortInvert', mode);
				selectElement('.sort-'+mode);
				loadIndexPage(true, indexPathA, true, true, indexMainPathA);
			}
		}
	}
	else if(type == 3)
	{
		if(mode != config.foldersFirst)
		{
			storage.updateVar('config', 'foldersFirst', mode);
			selectElement('.sort-'+mode);
			loadIndexPage(true, indexPathA, true, true, indexMainPathA);
		}
	}
}

function selectElement(element)
{
	$(element).parent().children().removeClass('s');
	$(element).addClass('s');
}

//Enable/Disable night mode

function nightMode()
{
	if($('.app').hasClass('night-mode'))
	{
		$('.app').removeClass('night-mode');
		$('.button-night-mode').html('light_mode');
		handlebarsContext.nightMode = false;
		storage.updateVar('config', 'nightMode', false);
	}
	else
	{
		$('.app').addClass('night-mode');
		$('.button-night-mode').html('dark_mode');
		handlebarsContext.nightMode = true;
		storage.updateVar('config', 'nightMode', true);
	}
}

// Show the comic context menu
async function comicContextMenu(path, fromIndex = true, folder = false, gamepad = false)
{	
	// Remove
	let remove = document.querySelector('#index-context-menu .context-menu-remove');

	if(fromIndex)
		remove.style.display = 'block';
	else
		remove.style.display = 'none';

	remove.setAttribute('onclick', 'dom.removeComic(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');

	// Open file location
	let openFileLocation = document.querySelector('#index-context-menu .context-menu-open-file-location');
	openFileLocation.setAttribute('onclick', 'electron.shell.showItemInFolder(\''+escapeQuotes(escapeBackSlash(fileManager.firstCompressedFile(path)), 'simples')+'\');');

	// Add poster and delete
	let addPoster = document.querySelector('#index-context-menu .context-menu-add-poster');
	let deletePoster = document.querySelector('#index-context-menu .context-menu-delete-poster');

	if(folder)
	{
		addPoster.style.display = 'block';

		let file = fileManager.file(path);
		let images = await file.images(2, false, true);
		file.destroy();

		poster = !Array.isArray(images) ? images.path : false;

		addPoster.setAttribute('onclick', 'dom.addPoster('+(fromIndex ? 'true' : 'false')+', \''+escapeQuotes(escapeBackSlash(path), 'simples')+'\', '+(poster ? '\''+escapeQuotes(escapeBackSlash(poster), 'simples')+'\'' : 'false')+');');
		addPoster.querySelector('span').innerHTML = poster ? language.global.contextMenu.changePoster : language.global.contextMenu.addPoster;

		if(poster)
		{
			deletePoster.style.display = 'block';
			deletePoster.setAttribute('onclick', 'dom.deletePoster(\''+escapeQuotes(escapeBackSlash(poster), 'simples')+'\');');
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

	if(gamepad)
		events.activeMenu('#index-context-menu', false, 'gamepad');
	else
		events.activeContextMenu('#index-context-menu');
}

function addPoster(fromIndex = false, path = false, currentPoster = false)
{
	domPoster.add(fromIndex, path, currentPoster);
}

function deletePoster(currentPoster = false)
{
	domPoster.delete(currentPoster);
}

// Remove the comic from OpenComic
function removeComic(path, confirm = false)
{
	var _comics = [], comics = storage.get('comics');

	for(let i in comics)
	{
		if(comics[i].path != path)
			_comics.push(comics[i]);
	}

	storage.update('comics', _comics);

	dom.loadIndexPage(true, false, true, true);
}

var readingActive = false, skipNextComic = false, skipPreviousComic = false;

async function openComic(animation = true, path = true, mainPath = true, end = false, fromGoBack = false, fromNextAndPrev = false)
{
	// Start reading comic
	currentPathScrollTop[currentPath === false ? 0 : currentPath] = template.contentRight().children().scrollTop();
	currentPath = path;

	let now = Date.now();

	let startImage = false;
	let imagePath = path;
	let indexStart = 1;

	if(compatibleMime.indexOf(mime.getType(path)) != -1)
	{
		startImage = path;
		path = p.dirname(path);
	}

	// Show loadign page
	headerPath(path, mainPath);

	handlebarsContext.comics = [];
	template.loadContentLeft('reading.content.left.html', true);
	template.loadContentRight('reading.content.right.html', true);
	template.loadHeader('reading.header.html', true);

	// Load files
	let file = fileManager.file(path);
	let files = await file.read();

	let isCanvas = false;
	let compressedFile = fileManager.lastCompressedFile(path);

	if(compressedFile)
	{
		let features = fileManager.fileCompressed(compressedFile);
		features = features.getFeatures();

		if(features.canvas)
		{
			await file.makeAvailable([{path: compressedFile}]);
			isCanvas = true;
		}
		else
		{
			await file.makeAvailable(files);
		}
	}

	file.destroy();

	skipNextComic = await nextComic(path, mainPath);
	skipPreviousComic = await previousComic(path, mainPath);

	if(!fromGoBack)
		indexPathControl(imagePath, mainPath, true, fromNextAndPrev);

	readingActive = true;

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

		let thumbnails = cache.returnThumbnailsImages(images, function(data) {

			addImageToDom(data.sha, data.path);

		}, file);

		for(let i = 0; i < len; i++)
		{
			let file = files[i];

			if(file.folder || file.compressed)
			{
				let fileImage = fileManager.file(file.path);
				let images = await fileImage.images(4);
				file.destroy();

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
				let thumbnail = thumbnails[file.sha] || {};

				comics.push({
					sha: file.sha,
					name: file.name.replace(/\.[^\.]*$/, ''),
					image: fileManager.realPath(file.path),
					path: file.path,
					mainPath: mainPath,
					thumbnail: (thumbnail.cache) ? thumbnail.path : '',
					size: file.size || false,
					canvas: isCanvas,
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

	handlebarsContext.comics = comics;
	handlebarsContext.previousComic = skipPreviousComic;
	handlebarsContext.nextComic = skipNextComic;
	reading.setCurrentComics(comics);

	if(Date.now() - now < 300)
	{
		template._contentLeft().firstElementChild.innerHTML = template.load('reading.content.left.html');
		template._contentRight().firstElementChild.innerHTML = template.load('reading.content.right.html');
	}
	else
	{
		template.loadContentLeft('reading.content.left.html', true);
		template.loadContentRight('reading.content.right.html', true);
	}

	if(template.globalElement('.reading-elements-menus').length == 0) template.loadGlobalElement('reading.elements.menus.html', 'menus');

	floatingActionButton(false);
	
	events.events();

	reading.read(path, indexStart, end, isCanvas);
	reading.hideContent(electronRemote.getCurrentWindow().isFullScreen(), true);

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
	reloadIndex: reloadIndex,
	loadLanguagesPage: loadLanguagesPage,
	loadSettingsPage: loadSettingsPage,
	loadThemePage: loadThemePage,
	changeLanguage: changeLanguage,
	floatingActionButton: floatingActionButton,
	changeView: changeView,
	changeSort: changeSort,
	indexPathControl: indexPathControl,
	indexPathControlA: function(){return indexPathControlA},
	indexPathControlGoBack: indexPathControlGoBack,
	selectElement: selectElement,
	openComic: openComic,
	nextComic: function(){return skipNextComic},
	previousComic: function(){return skipPreviousComic},
	goNextComic: goNextComic,
	goPrevComic: goPrevComic,
	orderBy: orderBy,
	nightMode: nightMode,
	addComicButtons: addComicButtons,
	comicContextMenu: comicContextMenu,
	removeComic: removeComic,
	calcReadingProgress: calcReadingProgress,
	calcReadingProgressWD: calcReadingProgressWD,
	compressedError: compressedError,
	addImageToDom: addImageToDom,
	addSepToEnd: addSepToEnd,
	addPoster: addPoster,
	deletePoster: deletePoster,
	indexPathControlUpdateLastComic: indexPathControlUpdateLastComic,
	indexMainPathA: function(){return indexMainPathA},
	currentPathScrollTop: function(){return currentPathScrollTop},
	search: search,
	this: domManager.this,
	query: domManager.query,
	queryAll: domManager.queryAll,
};
