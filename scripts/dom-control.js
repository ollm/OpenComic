
/*Page - Index*/

function orderBy(a, b, mode, key = false)
{
	if(key)
	{
		var aValue = a[key].toLowerCase();
		var bValue = b[key].toLowerCase();
	}
	else
	{
		var aValue = a.toLowerCase();
		var bValue = b.toLowerCase();
	}

	if(mode == 'simple')
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

var indexPathControlA = [];

var indexPathA = false, indexMainPathA = false;

function loadFilesIndexPage(animation, path, keepScroll, mainPath)
{

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

	if(sort == 'name')
	{
		var order = 'simple';
		var key = 'name';
	}
	else if(sort == 'numeric')
	{
		var order = 'numeric';
		var key = 'name';
	}
	else if(sort == 'name-numeric')
	{
		var order = 'simple-numeric';
		var key = 'name';
	}
	else if(sort == 'last-add')
	{
		var order = 'simple';
		var key = 'added';
	}
	else
	{
		var order = 'simple';
		var key = 'lastReading';
	}

	fs.readdir(file.realPath(path), function(error, files){

		comics = [];

		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				var fileName = files[i];
				var filePath = p.join(path, fileName);

				realPath = file.realPath(filePath, -1);

				if(inArray(mime.lookup(realPath), compatibleMime))
				{
					var sha = sha1(filePath);

					var thumbnail = cache.returnCacheImage(realPath/*filePath*/, sha, function(data){
						if($('.sha-'+data.sha+' img').length > 0)
						{
							$('.sha-'+data.sha+' img').attr('src', data.path);
						}
						else
						{
							$('.sha-'+data.sha+' .item-image').css('background-image', 'url('+data.path+')');
						}
					});

					comics.push({
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
					var images = folderImagesWD(filePath, 4);

					if(checkError(images))
					{
						var sha = sha1(filePath);

						var images = [
							{cache: false, path: '', sha: sha+'-0'},
							{cache: false, path: '', sha: sha+'-1'},
							{cache: false, path: '', sha: sha+'-2'},
							{cache: false, path: '', sha: sha+'-3'},
						];

						//Compatibility has to be added to uncompress the file and create the thumbnails
					}
					else
					{
						for(var i2 = 0; i2 < images.length; i2++)
						{
							var sha = sha1(images[i2]);

							images[i2] = cache.returnCacheImage(images[i2], sha, function(data){
								if($('img.fi-sha-'+data.sha).length > 0)
									$('img.fi-sha-'+data.sha).attr('src', data.path);
								else if($('.fi-sha-'+data.sha+' img').length > 0)
									$('.fi-sha-'+data.sha+' img').attr('src', data.path);
								else
									$('.fi-sha-'+data.sha).css('background-image', 'url('+data.path+')');
							});
						}
					}

					comics.push({
						name: fileName,
						path: filePath,
						mainPath: mainPath,
						images: images,
						folder: true,
					});
				}
			}
		}

		if(!isEmpty(comics))
		{
			comics.sort(function (a, b) {
				if(foldersFirst && a.folder && !b.folder) return -1; 
				if(foldersFirst && b.folder && !a.folder) return 1; 
				return (sortInvert) ? -(orderBy(a, b, order, key)) : orderBy(a, b, order, key);
			});
		}

		handlebarsContext.comics = comics;

		template.loadContentRight('index.content.right.'+config.view+'.html', animation, keepScroll);
		events.events();
		justifyViewModule();

	});
}

function loadIndexPage(animation = true, path = false, content = false, keepScroll = false, mainPath = false)
{
	onReading = false;

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

	if(sort == 'name')
	{
		var order = 'simple';
		var key = 'name';
	}
	else if(sort == 'numeric')
	{
		var order = 'numeric';
		var key = 'name';
	}
	else if(sort == 'name-numeric')
	{
		var order = 'simple-numeric';
		var key = 'name';
	}
	else if(sort == 'last-add')
	{
		var order = 'simple';
		var key = 'added';
	}
	else
	{
		var order = 'simple';
		var key = 'lastReading';
	}

	if(!path)
	{
		var comics = storage.get('comics');

		if(!isEmpty(comics))
		{

			for(key in comics)
			{

				var images = folderImagesWD(comics[key].path, 4);

				if(checkError(images))
				{
					var folderSha = sha1(comics[key].path);

					var images = [
						{cache: false, path: '', sha: folderSha+'-0'},
						{cache: false, path: '', sha: folderSha+'-1'},
						{cache: false, path: '', sha: folderSha+'-2'},
						{cache: false, path: '', sha: folderSha+'-3'},
					];

					if(file.containsCompressed(comics[key].path))
					{
						(function(folderSha){

							addFolderImagesQueue(comics[key].path, 4, function(images){

								for(var i = 0; i < images.length; i++)
								{
									var sha = sha1(images[i]);

									(function(i, sha, folderSha, images){

										cache.returnCacheImage(images[i], sha, function(data){

											if($('img.fi-sha-'+folderSha+'-'+i).length > 0)
												$('img.fi-sha-'+folderSha+'-'+i).attr('src', data.path);
											else if($('.fi-sha-'+folderSha+'-'+i+' img').length > 0)
												$('.fi-sha-'+folderSha+'-'+i+' img').attr('src', data.path);
											else
												$('.fi-sha-'+folderSha+'-'+i).css('background-image', 'url('+data.path+')');

										});

									}(i, sha, folderSha, images));
								}
							});

						})(folderSha)
					}
					//Compatibility has to be added to uncompress the file and create the thumbnails
				}
				else
				{
					for(var i = 0; i < images.length; i++)
					{
						var sha = sha1(images[i]);

						images[i] = cache.returnCacheImage(images[i], sha, function(data){
							if($('img.fi-sha-'+data.sha).length > 0)
								$('img.fi-sha-'+data.sha).attr('src', data.path);
							else if($('.fi-sha-'+data.sha+' img').length > 0)
								$('.fi-sha-'+data.sha+' img').attr('src', data.path);
							else
								$('.fi-sha-'+data.sha).css('background-image', 'url('+data.path+')');
						});
					}
				}

				comics[key].images = images;
				comics[key].mainPath = comics[key].path;
			}

			comics.sort(function (a, b) {
				return (sortInvert) ? -(orderBy(a, b, order, 'name')) : orderBy(a, b, order, 'name');
			});
		}

		handlebarsContext.comics = comics;
		handlebarsContext.comicsIndex = true;
		handlebarsContext.comicsIndexVar = 'true';

		template.loadContentRight('index.content.right.'+config.viewIndex+'.html', animation, keepScroll);

		handlebarsContext.headerTitle = false;
		handlebarsContext.headerTitlePath = false;
		template.loadHeader('index.header.html', animation);

		if(!content)
		{
			template.loadContentLeft('index.content.left.html', animation);
			template.loadGlobalElement('index.elements.menus.html', 'menus');
			floatingActionButton(true, 'addComic();');
		}

		events.events();

	}
	else
	{

		indexPathA = path;

		indexMainPathA = mainPath;
		if(indexPathControlA.length == 0 || (indexPathControlA[indexPathControlA.length - 1].path != path))
		{
			indexPathControlA.push({path: path, mainPath: mainPath});
		}
		indexPathControl(2);
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

function headerPath(path, mainPath)
{

	var mainPathR = p.dirname(mainPath) + p.sep;

	files = path.replace(mainPathR, '').split(p.sep);

	var path = [];

	var pathJoin = mainPathR;

	for(index in files)
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

var queuedFolderImages = [], processingFolderImagesQueue = false;

function addFolderImagesQueue(path, num, callback = false, processQueue = true)
{
	queuedFolderImages.push({path: path, num: num, callback: callback});

	if(!processingFolderImagesQueue && processQueue)
	{
		process.nextTick(function() {
			processFolderImagesQueue();
		});
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

			images = folderImagesWD(path, num);

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

var barBackDisable = false;
var barBackShow = false;

function indexPathControl(mode)
{
	if(mode == 1)
	{
		if(indexPathControlA.length == 1)
		{
			indexPathControl(3);
			loadIndexPage(true, false);
		}
		else if(indexPathControlA.length > 0)
		{
			loadIndexPage(true, indexPathControlA[indexPathControlA.length - 2].path, false, false,  indexPathControlA[indexPathControlA.length - 2].mainPath);
			indexPathControlA.splice(indexPathControlA.length - 2, 2);
		}
	}
	else if(mode == 2)
	{
		if(indexPathControlA.length > 0)
		{
			if(!barBackShow)
			{
				handlebarsContext['bar-back'] = 'show';
				$('.bar-back').removeClass('disable active').addClass('show');
				barBackShow = true;
			}
			else
			{
				handlebarsContext['bar-back'] = 'active';
			}
		}
		else
		{
			if(!barBackDisable)
			{
				handlebarsContext['bar-back'] = 'disable';
				$('.bar-back').removeClass('active show').addClass('disable');
				barBackDisable = true;
			}
			else
			{
				handlebarsContext['bar-back'] = '';
			}
		}
	}
	else
	{
		if(indexPathControlA.length > 0)
		{
			handlebarsContext['bar-back'] = 'disable';
			$('.bar-back').removeClass('active show').addClass('disable');
		}
		else
		{
			handlebarsContext['bar-back'] = '';
		}

		barBackShow = false;
		barBackDisable = false;

		indexPathControlA = [];
	}
}

/*Page - Languages*/

function loadLanguagesPage(animation = true)
{
	onReading = false;

	if(typeof handlebarsContext.languagesList == 'undefined')
	{
		var languagesList = $.parseJSON(readFileApp('/languages/languagesList.json'));

		handlebarsContext.languagesList = new Array();

		for(code in languagesList)
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



function floatingActionButton(active, callback)
{
	if(active)
	{
		$('.floating-action-button').removeClass('disable').attr('onclick', callback);
	}
	else
	{
		$('.floating-action-button').addClass('disable');
	}
}

function changeView(mode, index)
{
	if(index)
	{
		if(mode != config.viewIndex)
		{
			storage.updateVar('config', 'viewIndex', mode);
			$('.button-view').removeClass('module list').addClass(mode);
			selectElement('.view-'+mode);
			loadIndexPage(true, false, true, true);
		}
	}
	else
	{
		if(mode != config.view)
		{
			storage.updateVar('config', 'view', mode);
			$('.button-view').removeClass('module list').addClass(mode);
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
		contentWidth = template.contentRight().width();

		contentPerLine = Math.floor((contentWidth - 16) / (150 + 16));

		marginLeft = ((contentWidth - 16) - (contentPerLine * (150 + 16))) / (contentPerLine - 1);

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

var readingActive = false, skipNextComic = false, skipPreviousComic = false;

function openComic(animation = true, path = true, mainPath = true, end = false)
{
	var startImage;
	var imagePath = path;
	var indexStart = 1;

	if(compatibleMime.indexOf(mime.lookup(path)) != -1)
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

		if(indexPathControlA.length > 0 && indexPathControlA[indexPathControlA.length - 1] != '')
			indexPathControlA.push({path: '', mainPath: mainPath});

		readingActive = true;

		var sort = config.sort;
		var sortInvert = config.sortInvert;
		var foldersFirst = config.foldersFirst;

		if(sort == 'name')
		{
			var order = 'simple';
			var key = 'name';
		}
		else if(sort == 'numeric')
		{
			var order = 'numeric';
			var key = 'name';
		}
		else if(sort == 'name-numeric')
		{
			var order = 'simple-numeric';
			var key = 'name';
		}
		else if(sort == 'last-add')
		{
			var order = 'simple';
			var key = 'added';
		}
		else
		{
			var order = 'simple';
			var key = 'lastReading';
		}

		fs.readdir(file.realPath(path), function(error, files){

			comics = [];

			if(files)
			{

				for(var i = 0; i < files.length; i++)
				{
					var fileName = files[i];
					var filePath = p.join(path, fileName);

					if(compatibleMime.indexOf(mime.lookup(filePath)) != -1)
					{
						var sha = sha1(filePath);

						var thumbnail = cache.returnCacheImage(filePath, sha, function(data){
							if($('img.ri-sha-'+data.sha).length > 0)
							{
								$('img.ri-sha-'+data.sha).attr('src', data.path);
							}
							else
							{
								$('.ri-sha-'+data.sha+' .item-image').css('background-image', 'url('+data.path+')');
							}
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
								//$('.ri-sha-'+data.sha).css('background-image', 'url('+data.path+')');
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
					return (sortInvert) ? -(orderBy(a, b, order, key)) : orderBy(a, b, order, key);
				});

				for(key in comics)
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

			template.loadContentLeft('reading.content.left.html', true);
			template.loadContentRight('reading.content.right.html', true);
			template.loadHeader('reading.header.html', true);
			template.loadGlobalElement('reading.elements.menus.html', 'menus');
			floatingActionButton(false);
			
			events.events();

			reading.read(path, indexStart, end);

		});
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
	folderImages: folderImages,
	folderImagesWD: folderImagesWD,
	selectElement: selectElement,
	openComic: openComic,
	nextComic: skipNextComicF,
	previousComic: skipPreviousComicF,
	orderBy: orderBy,
	indexMainPathA: function(){return indexMainPathA},
};