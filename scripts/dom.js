
/*Page - Index*/

function orderBy(a, b, mode, key = false, key2 = false)
{
	if(key2)
	{
		var aValue = a[key][key2];
		var bValue = b[key][key2];
	}
	else if(key)
	{
		var aValue = a[key];
		var bValue = b[key];
	}
	else
	{
		var aValue = a;
		var bValue = b;
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
		var matchA = aValue.match(/([0-9]+)/g);
		var matchB = bValue.match(/([0-9]+)/g);

		if(!matchA) return 1;

		if(!matchB) return -1;

		for (var i = 0; i < matchA.length && i < matchB.length; i++)
		{
			if (parseInt(matchA[i]) > parseInt(matchB[i])) return 1;

			if (parseInt(matchA[i]) < parseInt(matchB[i])) return -1;
		}

		if (matchA.length > matchB.length) return 1;

		if (matchA.length < matchB.length) return -1;

		if (aValue > bValue) return 1;

		if (aValue < bValue) return -1;

		return 0;
	}
	else if(mode == 'simple-numeric')
	{
		var matchA = aValue.match(/([0-9]+|.?)/g);
		var matchB = bValue.match(/([0-9]+|.?)/g);

		if(!matchA) return 1;

		if(!matchB) return -1;

		for (var i = 0; i < matchA.length && i < matchB.length; i++)
		{
			if(!$.isNumeric(matchA[i]) || !$.isNumeric(matchB[i]))
			{
				if (matchA[i] > matchB[i]) return 1;

				if (matchA[i] < matchB[i]) return -1;
			}
			else
			{
				if (parseInt(matchA[i]) > parseInt(matchB[i])) return 1;

				if (parseInt(matchA[i]) < parseInt(matchB[i])) return -1;
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
	if(animation)
	{
		var src = $('.fi-sha-'+querySelector+' img, .sha-'+querySelector+' img, img.fi-sha-'+querySelector);

		if(src.length > 0)
			src.attr('src', path).addClass('a');
		else
			$('.fi-sha-'+querySelector+', .sha-'+querySelector+' .item-image').css({'background-image': 'url('+path+')'}).addClass('a');

		$('.ri-sha-'+querySelector).attr('src', path);

		$('.continue-reading-sha-'+querySelector).css({'background-image': 'url('+path+')'}).addClass('a');
	}
	else
	{
		var src = $('.fi-sha-'+querySelector+' img, .sha-'+querySelector+' img, img.fi-sha-'+querySelector);

		if(src.length > 0)
			src.attr('src', path);
		else
			$('.fi-sha-'+querySelector+', .sha-'+querySelector+' .item-image').css({'transition': '0s', 'background-image': 'url('+path+')'});

		$('.ri-sha-'+querySelector).attr('src', path);
		$('.continue-reading-sha-'+querySelector).css({'transition': '0s', 'background-image': 'url('+path+')'});
	}
}

function loadFilesIndexPage(animation, path, keepScroll, mainPath)
{
	queue.clean('folderThumbnails');

	if(!path)
	{
		var sort = config.sortIndex;
		var sortInvert = config.sortInvertIndex;
		var foldersFirst = config.foldersFirstIndex;
	}
	else
	{
		var sort = config.sort;
		var sortInvert = config.sortInvert;
		var foldersFirst = config.foldersFirst;
	}

	var order = '';

	if(sort == 'name')
		order = 'simple';
	else if(sort == 'numeric')
		order = 'numeric';
	else
		order = 'simple-numeric';

	let pathFiles = [];

	var files = fs.readdirSync(file.realPath(path));

	if(files)
	{
		for(var i = 0; i < files.length; i++)
		{
			var fileName = files[i];
			var filePath = p.join(path, fileName);

			var realPath = file.realPath(filePath, -1);

			if(inArray(mime.getType(realPath), compatibleMime))
			{
				var sha = sha1(filePath);

				var thumbnail = cache.returnCacheImage(realPath/*filePath*/, sha, function(data){

					addImageToDom(data.sha, data.path);

				});

				pathFiles.push({
					sha: sha,
					name: fileName.replace(/\.[^\.]*$/, ''),
					path: filePath,
					mainPath: mainPath,
					thumbnail: (thumbnail.cache) ? thumbnail.path : '',
					folder: false,
				});
			}
			else if(fs.statSync(realPath).isDirectory() || inArray(fileExtension(filePath), compressedExtensions.all))
			{
				var images = getFolderThumbnailsAsync(filePath);

				pathFiles.push({
					name: fileName,
					path: filePath,
					mainPath: mainPath,
					images: images,
					folder: true,
				});
			}
		}
	}

	if(!isEmpty(pathFiles))
	{
		pathFiles.sort(function (a, b) {
			if(foldersFirst && a.folder && !b.folder) return -1; 
			if(foldersFirst && b.folder && !a.folder) return 1; 
			return (sortInvert) ? -(orderBy(a, b, order, 'name')) : orderBy(a, b, order, 'name');
		});
	}

	handlebarsContext.comics = pathFiles;

	// Comic reading progress
	var comic = false, _comics = storage.get('comics');

	for(let i in _comics)
	{
		if(_comics[i].path == mainPath)
		{
			comic = _comics[i];
			break;
		}
	}

	var readingProgress = storage.get('readingProgress');

	if(readingProgress[mainPath] && readingProgress[mainPath].lastReading > 0)
	{
		var sha = sha1(readingProgress[mainPath].path);

		var realPath = file.realPath(readingProgress[mainPath].path, -1);

		var thumbnail = cache.returnCacheImage(realPath, sha, function(data){

			addImageToDom(data.sha, data.path);

		});

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

	template.loadContentRight('index.content.right.'+config.view+'.html', animation, keepScroll);
	events.events();
	justifyViewModule();

}

function loadIndexPage(animation = true, path = false, content = false, keepScroll = false, mainPath = false)
{
	onReading = false;

	generateAppMenu();

	if(!path)
	{
		var sort = config.sortIndex;
		var sortInvert = config.sortInvertIndex;
		var foldersFirst = config.foldersFirstIndex;
	}
	else
	{
		var sort = config.sort;
		var sortInvert = config.sortInvert;
		var foldersFirst = config.foldersFirst;
	}

	var orderKey2 = false;

	if(sort == 'name')
	{
		var order = 'simple';
		var orderKey = 'name';
	}
	else if(sort == 'numeric')
	{
		var order = 'numeric';
		var orderKey = 'name';
	}
	else if(sort == 'name-numeric')
	{
		var order = 'simple-numeric';
		var orderKey = 'name';
	}
	else if(sort == 'last-add')
	{
		var order = 'real-numeric';
		var orderKey = 'added';
		sortInvert = !sortInvert;
	}
	else
	{
		var order = 'real-numeric';
		var orderKey = 'readingProgress';
		var orderKey2 = 'lastReading';
		sortInvert = !sortInvert;
	}

	if(!path)
	{
		indexPathControl(false);

		var comicsStorage = storage.get('comics');
		var comics = [];

		if(!isEmpty(comicsStorage))
		{
			for(let key in comicsStorage)
			{
				if(fs.existsSync(comicsStorage[key].path))
				{
					comics.push(comicsStorage[key]);
				}
				else
				{
					//console.log(comicsStorage[key]);
				}
			}

			for(let key in comics)
			{
				var images = getFolderThumbnailsAsync(comics[key].path);

				comics[key].images = images;
				comics[key].mainPath = comics[key].path;
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

		handlebarsContext.headerTitle = false;
		handlebarsContext.headerTitlePath = false;
		template.loadHeader('index.header.html', animation);

		if(!content)
		{
			template.loadContentLeft('index.content.left.html', animation);
			template.loadGlobalElement('index.elements.menus.html', 'menus');
			floatingActionButton(true, 'dom.addComicButtons();');
		}

		events.events();

	}
	else
	{
		indexPathControl(path, mainPath);

		handlebarsContext.comicsIndex = false;
		handlebarsContext.comicsIndexVar = 'false';

		headerPath(path, mainPath);
		template.loadHeader('index.header.html', animation);

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

		if(!fs.existsSync(file.realPath(path, -1)) && file.containsCompressed(path))
		{
			fileCompressed.decompressRecursive(path, function(){

				if(!fs.statSync(file.realPath(path, -1)).isDirectory() && inArray(fileExtension(path), compressedExtensions.all))
				{
					fileCompressed.returnFiles(path, false, false, function(files){

						loadFilesIndexPage(animation, path, keepScroll, mainPath);

					});
				}
				else
				{
					loadFilesIndexPage(animation, path, keepScroll, mainPath);
				}

			});
		}
		else
		{
			if(!fs.statSync(file.realPath(path, -1)).isDirectory() && inArray(fileExtension(path), compressedExtensions.all))
			{
				fileCompressed.returnFiles(path, false, false, function(files){

					loadFilesIndexPage(animation, path, keepScroll, mainPath);

				});
			}
			else
			{
				loadFilesIndexPage(animation, path, keepScroll, mainPath);
			}
		}
	}

	if(readingActive)
	{
		readingActive = false;
	}

	justifyViewModule();

	$(window).off('resize').on('resize', function(){
		justifyViewModule();
	});

}

function returnTextPath(path, mainPath, image = false)
{
	var mainPathR = p.dirname(mainPath) + p.sep;

	var files = path.replace(new RegExp('^\s*'+escapeBackSlash(mainPathR)), '').split(p.sep);

	var path = [];

	for(let index in files)
	{
		path.push(image ? htmlEntities(files[index]) : files[index]);
	}

	return path.join(image ? '<i class="material-icon navegation">chevron_right</i>' : ' / '); 
}

function headerPath(path, mainPath)
{
	var mainPathR = p.dirname(mainPath) + p.sep;

	var files = path.replace(new RegExp('^\s*'+escapeBackSlash(mainPathR)), '').split(p.sep);

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

function nextComic(path, mainPath)
{
	var searchPath = p.dirname(path);

	if(p.normalize(mainPath) != p.normalize(path) && p.normalize(searchPath) != p.normalize(path))
	{
		var files = file.returnFirstWD(searchPath);

		if(checkError(files))
			return files;

		files = file.sort(files);

		var skipPath = false;

		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				var filePath = files[i].path;

				if((skipPath && files[i].folder) || skipPath && files[i].compressed)
				{
					var image = folderImagesWD(filePath, 1, 1);

					if(checkError(image) || image)
						return image;
				}
				else if(skipPath)
				{
					return files[i].path;
				}

				if(filePath == path && !skipPath)
					skipPath = true;
			}
		}

		return nextComic(searchPath, mainPath);
	}

	return false;
}

function previousComic(path, mainPath)
{
	var searchPath = p.dirname(path);

	if(p.normalize(mainPath) != p.normalize(path) && p.normalize(searchPath) != p.normalize(path))
	{
		var files = file.returnFirstWD(searchPath);

		if(checkError(files))
			return files;

		files = file.sort(files);

		var skipPath = false;

		if(files)
		{
			for(var i = (files.length - 1); i >= 0; i--)
			{
				var filePath = files[i].path;

				if((skipPath && files[i].folder) || (skipPath && files[i].compressed))
				{
					var image = folderImagesWD(filePath, 1, 2);

					if(checkError(image) || image)
						return image;
				}
				else if(skipPath)
				{
					return files[i].path;
				}

				if(filePath == path && !skipPath)
					skipPath = true;
			}
		}

		return previousComic(searchPath, mainPath);
	}

	return false;
}

function getFolderThumbnailsAsync(path)
{
	var folderSha = sha1(path);

	var images = [
		{cache: false, path: '', sha: folderSha+'-0'},
		{cache: false, path: '', sha: folderSha+'-1'},
		{cache: false, path: '', sha: folderSha+'-2'},
		{cache: false, path: '', sha: folderSha+'-3'},
	];

	queue.add('folderThumbnails', function(path, folderSha) {

		var images = folderImagesWD(path, 4);

		if(checkError(images))
		{
			var error = images;

			var images = [
				{cache: false, path: '', sha: folderSha+'-0'},
				{cache: false, path: '', sha: folderSha+'-1'},
				{cache: false, path: '', sha: folderSha+'-2'},
				{cache: false, path: '', sha: folderSha+'-3'},
			];

			var realPath = file.realPath(error.compressedPath, -1);

			if(file.containsCompressed(error.compressedPath) && fs.existsSync(realPath) && fs.statSync(realPath).size < 52428800)
			{
				(function(folderSha){

					addFolderImagesQueue(path, 4, function(images){

						for(var i = 0; i < images.length; i++)
						{
							var sha = sha1(images[i]);

							(function(i, sha, folderSha, images){

								var image = cache.returnCacheImage(images[i], sha, function(data, vars){

									addImageToDom(data.sha, data.path);
									addImageToDom(folderSha+'-'+vars.i, data.path);

								}, {i: i});

								if(image.cache)
								{
									addImageToDom(sha, image.path);
									addImageToDom(folderSha+'-'+i, image.path);
								}

							}(i, sha, folderSha, images));
						}

					});

				})(folderSha)
			}

			//Compatibility has to be added to uncompress the file and create the thumbnails
		}
		else
		{
			for(let i = 0; i < images.length; i++)
			{
				var sha = sha1(images[i]);

				images[i] = cache.returnCacheImage(images[i], sha, function(data, vars){

					addImageToDom(data.sha, data.path);
					addImageToDom(vars.folderSha+'-'+vars.i, data.path);

				}, {i: i, folderSha: folderSha});

				if(images[i].cache)
				{
					addImageToDom(sha, images[i].path, false);
					addImageToDom(folderSha+'-'+i, images[i].path, false);
				}
			}
		}

	}, path, folderSha);

	return images;
}

function getFolderThumbnailsWD(path)
{
	var images = folderImagesWD(path, 4);

	if(checkError(images))
	{
		var error = images;

		var folderSha = sha1(path);

		var images = [
			{cache: false, path: '', sha: folderSha+'-0'},
			{cache: false, path: '', sha: folderSha+'-1'},
			{cache: false, path: '', sha: folderSha+'-2'},
			{cache: false, path: '', sha: folderSha+'-3'},
		];

		var realPath = file.realPath(error.compressedPath, -1);

		if(file.containsCompressed(path) && fs.existsSync(realPath) && fs.statSync(realPath).size < 52428800)
		{
			(function(folderSha){

				addFolderImagesQueue(path, 4, function(images){

					for(var i = 0; i < images.length; i++)
					{
						var sha = sha1(images[i]);

						(function(i, sha, folderSha, images){

							var image = cache.returnCacheImage(images[i], sha, function(data, vars){

								addImageToDom(data.sha, data.path);
								addImageToDom(folderSha+'-'+vars.i, data.path);

							}, {i: i});

							if(image.cache)
							{
								addImageToDom(sha, image.path);
								addImageToDom(folderSha+'-'+i, image.path);
							}

						}(i, sha, folderSha, images));
					}

				});

			})(folderSha)
		}

		//Compatibility has to be added to uncompress the file and create the thumbnails
	}
	else
	{
		for(let i = 0; i < images.length; i++)
		{
			var sha = sha1(images[i]);

			images[i] = cache.returnCacheImage(images[i], sha, function(data){

				addImageToDom(data.sha, data.path);

			});
		}
	}

	return images;
}

var queuedFolderImages = [], processingFolderImagesQueue = false;

function addFolderImagesQueue(path, num, callback = false, processQueue = true)
{
	queuedFolderImages.push({path: path, num: num, callback: callback});

	if(!processingFolderImagesQueue && processQueue)
	{
		setTimeout(function(){

			process.nextTick(function() {
				processFolderImagesQueue();
			});

		}, 0);
	}
}

function processFolderImagesQueue(force = false)
{

	if((!processingFolderImagesQueue || force) && typeof queuedFolderImages[0] != 'undefined')
	{
		processingFolderImagesQueue = true;

		folderImages(queuedFolderImages[0].path, queuedFolderImages[0].num, function(images){

			if(queuedFolderImages[0].callback)
				queuedFolderImages[0].callback(images);

			queuedFolderImages.splice(0, 1);

			if(queuedFolderImages.length > 0)
			{
				process.nextTick(function() {
					processFolderImagesQueue(true);
				});
			}
			else
			{
				processingFolderImagesQueue = false;
			}

		});
	}
}

function folderImages(path, num, callback = false)
{

	(function(path, num, callback){

		process.nextTick(function() {

			var images = folderImagesWD(path, num);

			if(checkError(images))
			{
				(function(error, path, num, callback){

					fileCompressed.addCompressedFilesQueue(error.compressedPath, false, function(files){

						if(!checkError(files))
							dom.folderImages(path, num, callback);
						else
							callback(files);

					});

				})(images, path, num, callback)
			}
			else
			{
				if(callback)
					callback(images);
			}
		});

	})(path, num, callback);
}

function folderImagesWD(path, num, mode = false)
{

	if(!mode)
	{
		var dirs = [];

		var files = file.returnFirstWD(path);

		if(checkError(files))
			return files;

		files = file.sort(files);

		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				var filePath = files[i].path;

				if(files[i].folder || files[i].compressed)
				{
					filePath = folderImagesWD(filePath, 1, 1);

					if(checkError(filePath))
						return filePath;

					if(filePath) dirs.push(filePath);
				}
				else
				{
					dirs.push(filePath);
				}

				if(dirs.length >= num) break;
			}
		}

		return dirs;
	}
	else
	{

		var files = file.returnFirstWD(path);

		if(checkError(files))
			return files;

		files = file.sort(files);

		if(files)
		{
			if(mode == 2)
				i = (files.length - 1);
			else
				i = 0;

			while((mode == 2 && i >= 0) || (mode != 2 && i < files.length))
			{
				var filePath = files[i].path;

				if(files[i].folder || files[i].compressed)
				{
					filePath = folderImagesWD(filePath, 1, 1);

					if(checkError(filePath))
						return filePath;

					if(filePath) return filePath;
				}
				else
				{
					return filePath;
				}

				if(mode == 2)
					i--;
				else
					i++;
			}
		}

		return false;
	}
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
		loadIndexPage(true, indexPathControlA[indexPathControlA.length - 2].path, false, false,  indexPathControlA[indexPathControlA.length - 2].mainPath);
	}
}

var barBackStatus = false; 

function indexPathControl(path = false, mainPath = false)
{
	if(path === false || mainPath === false)
	{
		indexPathControlA = [];
	}
	else
	{
		indexPathA = path;
		indexMainPathA = mainPath;

		var mainPathR = p.dirname(mainPath) + p.sep;

		var files = path.replace(new RegExp('^\s*'+escapeBackSlash(mainPathR)), '').split(p.sep);

		var prev = '';

		indexPathControlA = [];

		for(let index in files)
		{
			indexPathControlA.push({file: files[index], path: p.join(mainPathR, prev, files[index]), mainPath: mainPath});
			
			prev = p.join(prev, files[index]);
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

	onReading = false;

	generateAppMenu();

	if(typeof handlebarsContext.languagesList == 'undefined')
	{
		var languagesList = $.parseJSON(readFileApp('/languages/languagesList.json'));

		handlebarsContext.languagesList = new Array();

		for(let code in languagesList)
		{
			if(typeof languagesList[code].active != 'undefined' && languagesList[code].active)
			{
				handlebarsContext.languagesList.push({code: code, name: languagesList[code].name, nativeName: languagesList[code].nativeName});
			}
		}
	}

	template.loadContentRight('languages.content.right.html', animation);
	template.loadHeader('languages.header.html', animation);
	floatingActionButton(false);

	if(readingActive)
	{
		readingActive = false;
	}
}

function changeLanguage(lan)
{
	loadLanguage(lan);
	template.loadContentLeft('index.content.left.html', false);
	template.loadHeader('languages.header.html', false);
	storage.updateVar('config', 'language', lan);
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

function justifyViewModule()
{
	if(config.viewIndex == 'module')
	{
		var contentWidth = template.contentRight().width();

		var contentPerLine = Math.floor((contentWidth - 16) / (150 + 16));

		var marginLeft = ((contentWidth - 16) - (contentPerLine * (150 + 16))) / (contentPerLine - 1);

		if(contentPerLine > 0)
		{
			template.contentRight('.content-view-module > div').each(function(index){

				if(contentPerLine == 1)
					$(this).css('margin-left', ((contentWidth / 2) - (150 / 2))+'px');
				else if(index % contentPerLine == 0)
					$(this).css('margin-left', '16px');
				else
					$(this).css('margin-left', (marginLeft + 16)+'px');

			});
		}
		else
		{
			template.contentRight('.content-view-module > div').css('margin-left', '16px');
		}
	}
}

//Enable/Disable night mode

function nightMode()
{
	if($('.app').hasClass('night-mode'))
	{
		$('.app').removeClass('night-mode');
		$('.button-night-mode').html('sun');
		handlebarsContext.nightMode = false;
		storage.updateVar('config', 'nightMode', false);
	}
	else
	{
		$('.app').addClass('night-mode');
		$('.button-night-mode').html('moon');
		handlebarsContext.nightMode = true;
		storage.updateVar('config', 'nightMode', true);
	}
}

// Show the comic contet menu
function comicContextMenu(path)
{	
	$('#index-context-menu .context-menu-remove').attr('onclick', 'dom.removeComic(\''+escapeQuotes(escapeBackSlash(path), 'simples')+'\');');
	events.activeContextMenu('#index-context-menu');
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

function openComic(animation = true, path = true, mainPath = true, end = false)
{
	var startImage = false;
	var imagePath = path;
	var indexStart = 1;

	if(compatibleMime.indexOf(mime.getType(path)) != -1)
	{
		startImage = path;
		path = p.dirname(path);
	}

	if(fs.existsSync(file.realPath(path)))
	{

		skipNextComic = nextComic(path, mainPath);
		skipPreviousComic = previousComic(path, mainPath);

		if(checkError(skipNextComic))
			skipNextComic = false;

		if(checkError(skipPreviousComic))
			skipPreviousComic = false;

		indexPathControl(imagePath, mainPath);

		readingActive = true;

		var sort = config.sort;
		var sortInvert = config.sortInvert;
		var foldersFirst = config.foldersFirst;

		var order = '';

		if(sort == 'name')
			order = 'simple';
		else if(sort == 'numeric')
			order = 'numeric';
		else
			order = 'simple-numeric';

		var files = fs.readdirSync(file.realPath(path));

		var comics = [];

		if(files)
		{

			for(var i = 0; i < files.length; i++)
			{
				var fileName = files[i];
				var filePath = p.join(path, fileName);

				if(compatibleMime.indexOf(mime.getType(filePath)) != -1)
				{
					var sha = sha1(filePath);

					var thumbnail = cache.returnCacheImage(filePath, sha, function(data){

						addImageToDom(data.sha, data.path);

					});

					comics.push({
						sha: sha,
						name: fileName.replace(/\.[^\.]*$/, ''),
						image: file.realPath(filePath),
						path: filePath,
						mainPath: mainPath,
						thumbnail: (thumbnail.cache) ? thumbnail.path : '',
						folder: false,
					});
				}
				else if(fs.statSync(filePath).isDirectory())
				{
					var images = folderImagesWD(filePath, 4);

					for(var i2 = 0; i2 < images.length; i2++)
					{
						var originalPath = images[i2];

						var sha = sha1(originalPath);

						images[i2] = cache.returnCacheImage(originalPath, sha, function(data){
							
							addImageToDom(data.sha, data.path);
							
						});

						images[i2].originalPath = originalPath;
					}

					if(typeof images[0] != 'undefined')
					{
						comics.push({
							name: fileName,
							path: filePath,
							mainPath: mainPath,
							fristImage: images[0].originalPath,
							images: images,
							folder: true,
						});
					}
				}
			}
		}

		if(!isEmpty(comics))
		{
			comics.sort(function (a, b) {
				if(foldersFirst && a.folder && !b.folder) return -1; 
				if(foldersFirst && b.folder && !a.folder) return 1; 
				return (sortInvert) ? -(orderBy(a, b, order, 'name')) : orderBy(a, b, order, 'name');
			});

			for(let key in comics)
			{
				comics[key].index = parseInt(key) + 1;
				if(comics[key].path == imagePath)
				{
					indexStart = parseInt(key) + 1;
				}
			}
		}

		handlebarsContext.comics = comics;
		handlebarsContext.previousComic = skipPreviousComic;
		handlebarsContext.nextComic = skipNextComic;
		headerPath(path, mainPath);
		reading.setCurrentComics(comics);

		template.loadContentLeft('reading.content.left.html', true);
		template.loadContentRight('reading.content.right.html', true);
		template.loadHeader('reading.header.html', true);
		if(template.globalElement('.reading-elements-menus').length == 0) template.loadGlobalElement('reading.elements.menus.html', 'menus');

		floatingActionButton(false);
		
		events.events();

		reading.read(path, indexStart, end);

		generateAppMenu();

	}
	else if(file.containsCompressed(path))
	{
		fileCompressed.decompressRecursive(path, function(){

			openComic(animation, path, mainPath, end);

		});
	}
}

function skipNextComicF()
{
	return skipNextComic;
}

function skipPreviousComicF()
{
	return skipPreviousComic;
}

module.exports = {
	loadIndexPage: loadIndexPage,
	loadLanguagesPage: loadLanguagesPage,
	changeLanguage: changeLanguage,
	floatingActionButton: floatingActionButton,
	changeView: changeView,
	changeSort: changeSort,
	indexPathControl: indexPathControl,
	indexPathControlA: indexPathControlA,
	indexPathControlGoBack: indexPathControlGoBack,
	folderImages: folderImages,
	folderImagesWD: folderImagesWD,
	selectElement: selectElement,
	openComic: openComic,
	nextComic: skipNextComicF,
	previousComic: skipPreviousComicF,
	orderBy: orderBy,
	nightMode: nightMode,
	addComicButtons: addComicButtons,
	comicContextMenu: comicContextMenu,
	removeComic: removeComic,
	calcReadingProgress: calcReadingProgress,
	calcReadingProgressWD: calcReadingProgressWD,
	justifyViewModule: justifyViewModule,
	indexMainPathA: function(){return indexMainPathA},
};
