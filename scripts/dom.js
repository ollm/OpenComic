var _dom = function(_this, string = false, querySelectorAll = false) { 

	this._this = _this;

	if(string)
	{
		if(querySelectorAll)
		{
			this._this = document.querySelectorAll(this._this);
		}
		else
		{
			let __this = document.querySelector(this._this);

			if(__this)
				this._this = [__this];
			else
				this._this = [];
		}
	}
	else
	{
		if(!this._this)
			this._this = [];
		else if(this._this.length === undefined)
			this._this = [this._this];
	}

	this.each = function(callback){

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			callback.call(this._this[i]);
		}

		return this;
	}

	this.remove = function() {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].remove();
		}

		delete this._this;
		delete this;
	}

	this.find = function(query, all = false) {

		let newThis = [];

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			if(all)
			{
				newThis = [...newThis, ...this._this[i].querySelectorAll(query)];
			}
			else
			{
				let _this = this._this[i].querySelector(query);

				if(_this)
					newThis.push(_this);
			}
		}

		this._this = newThis;

		return this;
	}

	this.getParents = function(element) {

		let result = [];

		for(let parent = element && element.parentElement; parent; parent = parent.parentElement)
		{
			result.push(parent);
		}

		return result;
	}

	this.parents = function(query, all = false)
	{
		let newThis = [];

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			let parents = this.getParents(this._this[i]);

			for(let i2 = 0, len2 = parents.length; i2 < len2; i2++)
			{
				if(parents[i2].matches(query))
				{
					newThis.push(parents[i2]);
				
					if(!all)
						break;
				}
			}
		}

		this._this = newThis;

		return this;
	}

	this.siblings = function(query = false, all = false) {

		let newThis = [];

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			let parentChildren = this._this[i].parentElement.children;

			for(let i2 = 0, len2 = parentChildren.length; i2 < len2; i2++)
			{
				if((query === false || parentChildren[i2].matches(query)) && parentChildren[i2] !== this._this[i])
				{
					newThis.push(parentChildren[i2]);

					if(!all)
						break;
				}
			}
		}

		this._this = newThis;

		return this;

	}

	this.addClass = function() {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].classList.add(...arguments);
		}

		return this;
	}

	this.removeClass = function() {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].classList.remove(...arguments);
		}

		return this;
	}

	this.class = function(active) {

		let _arguments = Array.from(arguments);
		_arguments.shift();

		if(active)
			this.addClass(..._arguments);
		else
			this.removeClass(..._arguments);
	}

	this.getAttribute = function(attribute) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			let value = this._this[i].getAttribute(attribute);
			if(value) return value;
		}

		return '';
	}

	this.scrollTop = function(scrollTop = false) {

		if(scrollTop !== false)
		{
			for(let i = 0, len = this._this.length; i < len; i++)
			{
				this._this[i].scrollTop = scrollTop;
			}

			return this;
		}
		else
		{
			if(this._this.length > 0)
				return this._this[0].scrollTop;

			return 0;
		}

	}

	this.css = function(css) {

		for(let key in css)
		{
			let value = css[key];

			for(let i = 0, len = this._this.length; i < len; i++)
			{
				this._this[i].style[key] = value;
			}
		}

		return this;
	}

	this.html = function(html) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].innerHTML = html;
		}

		return this;
	}

	this.append = function(html) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].insertAdjacentHTML('beforeend', html);
		}

		return this;
	}

	this.text = function(html) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].innerHTML = playmax.text(html);
		}

		return this;
	}

	this.get = function(index) {

		return this._this[index];

	}

	this.this = function() {

		return this._this;

	}

	this.delete = function() {

		delete this._this;
		delete this;

	}

	this.destroy = function() {

		delete this._this;
		delete this;

	}
}

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
		let src = $('.fi-sha-'+querySelector+' img, .sha-'+querySelector+' img, img.fi-sha-'+querySelector);

		if(src.length > 0)
			src.attr('src', path).addClass('a');
		else
			$('.fi-sha-'+querySelector+', .sha-'+querySelector+' .item-image').css({'background-image': 'url('+path+')'}).addClass('a');

		$('.ri-sha-'+querySelector).attr('src', path);
		$('.continue-reading-sha-'+querySelector).css({'background-image': 'url('+path+')'}).addClass('a');
	}
	else
	{
		let src = $('.fi-sha-'+querySelector+' img, .sha-'+querySelector+' img, img.fi-sha-'+querySelector);

		if(src.length > 0)
			src.attr('src', path);
		else
			$('.fi-sha-'+querySelector+', .sha-'+querySelector+' .item-image').css({'transition': '0s', 'background-image': 'url('+path+')'});

		$('.ri-sha-'+querySelector).attr('src', path);
		$('.continue-reading-sha-'+querySelector).css({'transition': '0s', 'background-image': 'url('+path+')'});
	}
}

async function loadFilesIndexPage(file, animation, path, keepScroll, mainPath)
{
	return file.read().then(async function(files){

		queue.clean('folderThumbnails');

		let pathFiles = [];

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

			let thumbnails = cache.returnThumbnailsImages(images, function(data){

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
						name: fileName,
						path: filePath,
						mainPath: mainPath,
						images: images,
						folder: true,
					});
				}
			}
		}

		handlebarsContext.comics = pathFiles;

		// Comic reading progress
		let comic = false, _comics = storage.get('comics');

		for(let i in _comics)
		{
			if(_comics[i].path == mainPath)
			{
				comic = _comics[i];
				break;
			}
		}

		let readingProgress = storage.get('readingProgress');

		if(readingProgress[mainPath] && readingProgress[mainPath].lastReading > 0)
		{
			let path = readingProgress[mainPath].path;
			let sha = sha1(path);

			let thumbnail = cache.returnThumbnailsImages({path: path, sha: sha}, function(data){

				addImageToDom(data.sha, data.path);

			}, file);

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
		justifyViewModule();

	}).catch(function(error){

		console.error(error);
		dom.compressedError(error);

	});

}

var currentPath = false, currentPathScrollTop = [];

async function loadIndexPage(animation = true, path = false, content = false, keepScroll = false, mainPath = false, fromGoBack = false)
{
	onReading = false;

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
				var images = await getFolderThumbnails(comics[key].path);

				comics[key].images = images;
				comics[key].mainPath = config.showFullPathLibrary ? p.parse(comics[key].path).root : comics[key].path;
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
		if(!fromGoBack)
			indexPathControl(path, mainPath);

		handlebarsContext.comicsIndex = false;
		handlebarsContext.comicsIndexVar = 'false';

		headerPath(path, mainPath);
		template.loadHeader('index.header.html', animation);
		template.loadContentRight('index.content.right.loading.html', animation, keepScroll);

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

		let file = fileManager.file(path);
		await loadFilesIndexPage(file, animation, path, keepScroll, mainPath);
	}

	if(readingActive)
		readingActive = false;

	justifyViewModule();

	gamepad.updateBrowsableItems(path ? sha1(path) : 'library');

	$(window).off('resize').on('resize', function(){
		justifyViewModule();
	});

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

	return image && image.path ? image.path : false;
}

async function previousComic(path, mainPath)
{
	let file = fileManager.file(mainPath);
	let image = await file.images(-1, path);

	return image && image.path ? image.path : false;
}

async function _getFolderThumbnails(file, images, _images, path, folderSha, isAsync = false)
{
	let shaIndex = {};

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

	return images;
}

async function getFolderThumbnails(path)
{
	let folderSha = sha1(path);

	let images = [
		{cache: false, path: '', sha: folderSha+'-0'},
		{cache: false, path: '', sha: folderSha+'-1'},
		{cache: false, path: '', sha: folderSha+'-2'},
		{cache: false, path: '', sha: folderSha+'-3'},
	];
	
	try
	{
		try
		{
			let file = fileManager.file(path);
			file.updateConfig({cacheOnly: true});
			let _images = await file.images(4);

			images = await _getFolderThumbnails(file, images, _images, path, folderSha);
		}
		catch(error)
		{
			if(error.message && error.message === 'notCacheOnly')
			{
				queue.add('folderThumbnails', async function(path, folderSha) {

					let file = fileManager.file(path);
					let _images = await file.images(4);

					_getFolderThumbnails(file, images, _images, path, folderSha, true);

				}, path, folderSha);
			}
			else
			{
				console.error(error);
				dom.compressedError(error);
			}
		}
	}
	catch(error)
	{
		console.error(error);
		dom.compressedError(error);
	}

	return images;
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
			loadIndexPage(true, goBack.path, false, false,  goBack.mainPath, true);


		indexPathControlA.pop();
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
	if(path === false || mainPath === false)
	{
		indexPathControlA = [];
	}
	else
	{
		indexPathA = path;
		indexMainPathA = mainPath;

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

	onReading = false;

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
	floatingActionButton(false);

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
}

/* Page - Settings */

function loadSettingsPage(animation = true)
{
	indexPathControl(false);

	onReading = false;

	reading.hideContent();

	generateAppMenu();

	template.loadContentRight('settings.content.right.html', animation);
	template.loadHeader('settings.header.html', animation);
	floatingActionButton(false);

	settings.start();

	if(readingActive)
		readingActive = false;
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
		var contentWidth = template.contentRight().children().width();

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

async function openComic(animation = true, path = true, mainPath = true, end = false, fromGoBack = false, fromNextAndPrev = false)
{
	// Show loadign page
	handlebarsContext.comics = [];
	template.loadContentLeft('reading.content.left.html', true);
	template.loadContentRight('reading.content.right.html', true);
	template.loadHeader('reading.header.html', true);
	headerPath(path, mainPath);

	// Start reading comic
	currentPathScrollTop[currentPath === false ? 0 : currentPath] = template.contentRight().children().scrollTop();
	currentPath = path;

	let startImage = false;
	let imagePath = path;
	let indexStart = 1;

	if(compatibleMime.indexOf(mime.getType(path)) != -1)
	{
		startImage = path;
		path = p.dirname(path);
	}

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
	headerPath(path, mainPath);
	reading.setCurrentComics(comics);

	template.loadContentLeft('reading.content.left.html', true);
	template.loadContentRight('reading.content.right.html', true);
	template.loadHeader('reading.header.html', true);
	if(template.globalElement('.reading-elements-menus').length == 0) template.loadGlobalElement('reading.elements.menus.html', 'menus');

	floatingActionButton(false);
	
	events.events();

	reading.read(path, indexStart, end, isCanvas);
	reading.hideContent(electronRemote.getCurrentWindow().isFullScreen(), true);

	generateAppMenu();

	gamepad.updateBrowsableItems('reading-'+sha1(path));
}

// Gamepad events
gamepad.setButtonEvent('reading', 1, function(key, button) {

	if(key == 1)
		gamepad.goBack();

});

module.exports = {
	loadIndexPage: loadIndexPage,
	loadLanguagesPage: loadLanguagesPage,
	loadSettingsPage: loadSettingsPage,
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
	orderBy: orderBy,
	nightMode: nightMode,
	addComicButtons: addComicButtons,
	comicContextMenu: comicContextMenu,
	removeComic: removeComic,
	calcReadingProgress: calcReadingProgress,
	calcReadingProgressWD: calcReadingProgressWD,
	justifyViewModule: justifyViewModule,
	compressedError: compressedError,
	addImageToDom: addImageToDom,
	addSepToEnd: addSepToEnd,
	indexPathControlUpdateLastComic: indexPathControlUpdateLastComic,
	indexMainPathA: function(){return indexMainPathA},
	dom: function(_this, string = false, querySelectorAll = false) {
		return new _dom(_this, string, querySelectorAll);
	},
	query: function(_this) {
		return new _dom(_this, true, false);
	},
	queryAll: function(_this) {
		return new _dom(_this, true, true);
	},
};
