function removeDiacritics(str)
{
	return str.normalize('NFKD').replace(/\p{Diacritic}/g, '');
}

function searchText(regexps, text)
{
	for(let i = 0, len = regexps.length; i < len; i++)
	{
		let regexp = regexps[i];

		if(!regexp.test(text))
			return false
	}

	return true;
}

var searchAbort = {}, searchAbortIndex = 0;

function abortAll()
{
	for(let key in searchAbort)
	{
		delete searchAbort[key];
	}
}

function isAborted(index)
{
	if(searchAbort[index])
		return false;
	else
		return true;
}

async function search(text)
{
	if(!text)
	{
		if(filterCurrentPage)
			dom.queryAll('.content-view-module > div, .content-view-list > div').css({display: 'block'});

		showRecentlySearched();

		return;
	}

	abortAll();

	const index = searchAbortIndex++;
	searchAbort[index] = 1;

	let search = removeDiacritics(text).split(' ');
	let regexps = [];

	for(let i = 0, len = search.length; i < len; i++)
	{
		let regexp = new RegExp(this.pregQuote(search[i].trim()), 'i');
		regexps.push(regexp);
	}

	let matchesName = [];
	let matchesPath = [];

	let numName = 0;
	let numPath = 0;
	let firstIndex = true;

	toBreak:
	for(let i = 0, len = files.length; i < len; i++)
	{
		let group = files[i];

		if(group.files === false && !filterCurrentPage)
		{
			if(firstIndex)
				showLoading();

			firstIndex = false;

			files[i].files = await _indexFiles(group.file, group.mainPath);
		}

		if(isAborted(index)) return;

		for(let i2 = 0, len2 = group.files.length; i2 < len2; i2++)
		{
			let file = group.files[i2];

			if(searchText(regexps, file._name))
			{
				matchesName.push(file);
				numName++;
			}
			else if(numPath < 20 && searchText(regexps, file._path))
			{
				file.matchPath = true;
				matchesPath.push(file);
				numPath++;
			}

			if(numName > 20 && !filterCurrentPage)
				break toBreak;
		}
	}

	let matches = [...matchesName, ...matchesPath];

	if(isAborted(index)) return;

	if(filterCurrentPage)
	{
		let indexs = {};

		for(let i = 0, len = matches.length; i < len; i++)
		{
			indexs[matches[i].index] = true;
		}

		let contentRight = template._contentRight();
		let elements = contentRight.querySelectorAll('.content-view-module > div, .content-view-list > div');

		for(let i = 0, len = elements.length; i < len; i++)
		{
			let element = elements[i];

			if(indexs[i])
				element.style.display = 'block';
			else
				element.style.display = 'none';
		}

		setResults([]);
	}
	else
	{
		cache.cleanQueue();
		cache.stopQueue();

		let totalResults = 0;

		let results = [];

		let len = matches.length;

		if(len > 0)
		{
			let images = [];

			for(let i = 0; i < len; i++)
			{
				let file = matches[i];

				if(!file.folder && !file.compressed)
				{
					let sha = sha1(file.path);
					matches[i].sha = sha;

					images.push(matches[i]);
				}

			}

			let thumbnails = cache.returnThumbnailsImages(images, function(data){

				dom.addImageToDom(data.sha, data.path);

			}, fileManager.file(false, {cacheServer: true}));

			for(let i = 0, len = matches.length; i < len; i++)
			{
				let file = matches[i];

				let click = '';
				let image = {};

				if(file.folder || file.compressed)
				{
					click = 'dom.loadIndexPage(true, \''+escapeQuotes(escapeBackSlash(file.path), 'simples')+'\', false, false, \''+escapeQuotes(escapeBackSlash(file.mainPath), 'simples')+'\', false, true)';
				}
				else
				{
					let thumbnail = thumbnails[file.sha];

					image.sha = file.sha;
					image.thumbnail = (thumbnail.cache) ? thumbnail.path : '';

					click = 'dom.openComic(true, \''+escapeQuotes(escapeBackSlash(file.path), 'simples')+'\', \''+escapeQuotes(escapeBackSlash(file.mainPath), 'simples')+'\')';
				}

				let text = file.matchPath ? file.path.replace(new RegExp('^\s*'+pregQuote(file.mainPath)+pregQuote(p.sep)+'?'), '') : file.name;

				results.push({
					icon: file.compressed ? 'folder_zip' : (file.folder ? 'folder' : ''),
					image: image,
					text: text,
					click: 'dom.search.saveRecentlySearched(); dom.search.hide(); '+click,
				});

				totalResults++;

				if(totalResults > 20)
					break;
			}
		}

		if(isAborted(index)) return;

		setResults(results);
		cache.resumeQueue();
	}
}

function searchClick(event)
{
	if(!showed) return;

	if(!event.target.closest('.search-bar, .button-search'))
	{
		if(filterCurrentPage)
		{
			let gamepadItem = event.target.closest('.gamepad-item');

			if((!gamepadItem || !gamepadItem.closest('.content-right')))
				dom.queryAll('.content-view-module > div, .content-view-list > div').css({display: 'block'});
			else
				saveRecentlySearched();
		}

		hide(true);
	}
}

function keyup(event)
{
	let text = this.value;

	if(event.keyCode != 37 && event.keyCode != 38 && event.keyCode != 39 && event.keyCode != 40 && event.keyCode != 13)
	{
		search(text);
	}
	else if(text && filterCurrentPage && (event.keyCode == 13 || event.keyCode == 40))
	{
		hide(true);
		saveRecentlySearched();

		gamepad.updateBrowsableItems('search', true);
	}
}

function showRecentlySearched()
{
	let recentlySearched = storage.get('recentlySearched');

	let results = [];

	for(let key in recentlySearched)
	{
		results.push({
			icon: 'history',
			text: recentlySearched[key],
			click: 'dom.search.fillInput(\''+escapeQuotes(escapeBackSlash(recentlySearched[key]), 'simples')+'\')',
		});
	}

	setResults(results);
}

function showLoading()
{
	const searchBarResults = document.querySelector('.search-bar-results');

	searchBarResults.innerHTML = template.load('loading.html');
	searchBarResults.classList.add('active');

	if(+searchBarResults.dataset.height < 200)
	{
		const height = 200;
		searchBarResults.style.height = height+'px';
		searchBarResults.dataset.height = height;
	}
}

function saveRecentlySearched()
{
	let input = document.querySelector('.search-bar > div input');
	let text = input.value;

	if(!text.trim()) return;

	let recentlySearched = storage.get('recentlySearched');
	recentlySearched.unshift(text);

	recentlySearched = recentlySearched.slice(0, 30);

	storage.set('recentlySearched', recentlySearched);
}

var updateBrowsableItemsST = false;

function setResults(results)
{
	clearTimeout(updateBrowsableItemsST);

	handlebarsContext.searchResults = results;

	let len = results.length;

	let searchBarResults = document.querySelector('.search-bar-results');

	let height = (len * 56);

	if(height > window.innerHeight - 136 - titleBar.height())
		height = window.innerHeight - 136 - titleBar.height();

	searchBarResults.style.height = height+'px';
	searchBarResults.innerHTML = template.load('search.results.html');
	searchBarResults.dataset.height = height;

	if(len > 0)
		searchBarResults.classList.add('active');
	else
		searchBarResults.classList.remove('active');

	if(document.querySelector('.search-bar.active'))
	{
		updateBrowsableItemsST = setTimeout(function(){

			gamepad.updateBrowsableItems('search', true);

		}, 300);
	}
}

var files = [], filesHas = {};

async function _indexFiles(file, mainPath)
{
	let files = [];

	return new Promise(async function(resolve) {

		if(!filesHas[file.path])
		{
			filesHas[file.path] = true;

			files.push({
				name: file.name,
				_name: removeDiacritics(file.name),
				path: file.path,
				_path: removeDiacritics(file.path.replace(new RegExp('^\s*'+pregQuote(file.mainPath)), '')),
				mainPath: mainPath,
				folder: file.folder,
				compressed: file.compressed,
			});

			if(file.folder || file.compressed)
			{
				let _files;

				if(file.files)
				{
					_files = fileManager.filtered(file.files);
				}
				else
				{
					let _file = fileManager.file(file.path, {cacheServer: true});

					try
					{
						_files = await _file.read({sha: false, sort: false});
					}
					catch(error)
					{
						console.error(error);

						if(!macosMAS)
							throw new Error(error);
					}

					_file.destroy();
					delete _file;
				}

				let promises = [];

				for(let i = 0, len = _files.length; i < len; i++)
				{
					let _file = _files[i];
					promises.push(_indexFiles(_file, mainPath));

					if(promises.length > 4 || i + 1 === len)
					{
						const results = await Promise.all(promises);

						for(let i = 0, len = results.length; i < len; i++)
						{
							files = files.concat(results[i]);
						}

						promises = [];
					}
				}

				resolve(files);
			}
			else
			{
				resolve(files);
			}
		}
		else
		{
			resolve(files);
		}

	});
}

async function indexFiles()
{
	let currentFiles = handlebarsContext.comics;

	files = [];
	filesHas = {};

	for(let i = 0, len = currentFiles.length; i < len; i++)
	{
		let file = currentFiles[i];

		files.push({
			file: file,
			mainPath: file.mainPath,
			files: false,
		});
	}
}

async function indexFilesDom()
{
	let currentFiles = handlebarsContext.comics;

	let _files = [];

	for(let i = 0, len = currentFiles.length; i < len; i++)
	{
		let file = currentFiles[i];

		_files.push({
			index: i,
			_name: removeDiacritics(file.name),
			_path: '',
		});
	}

	files = [{
		path: 'dom',
		path: 'dom',
		files: _files,
	}];
}

var showed = false, filterCurrentPage = false;

function showHide(_filterCurrentPage = false)
{
	if(showed) return hide();

	clearTimeout(updateBrowsableItemsST);
	clearTimeout(hideST);

	let searchBarResults = document.querySelector('.search-bar-results');
	let height = +searchBarResults.dataset.height;

	if(height > window.innerHeight - 136 - titleBar.height())
	{
		height = window.innerHeight - 136 - titleBar.height();
		searchBarResults.style.height = height+'px';
	}

	filterCurrentPage = _filterCurrentPage;

	let search = document.querySelector('.search-bar');
	search.classList.remove('disable');
	search.classList.add('active');

	let input = document.querySelector('.search-bar > div input');
	input.value = '';
	input.focus();

	updateBrowsableItemsST = setTimeout(function(){

		gamepad.updateBrowsableItems('search', true);

	}, 300);

	if(filterCurrentPage)
	{
		indexFilesDom();
		document.querySelector('.search-bar > span').style.display = 'none';
	}
	else
	{
		indexFiles();
		document.querySelector('.search-bar > span').style.display = '';
	}

	app.event(window, 'click', searchClick, {capture: true});

	showed = true;
}

let hideST = false;

async function hide(fromSearchClick = false)
{
	if(!showed) return;

	abortAll();

	clearTimeout(updateBrowsableItemsST);
	clearTimeout(hideST);

	let search = document.querySelector('.search-bar');
	search.classList.remove('active');
	search.classList.add('disable');

	let input = document.querySelector('.search-bar > div input');
	input.blur();

	app.eventOff(window, 'click', searchClick, {capture: true});

	if(filterCurrentPage && !fromSearchClick)
		dom.queryAll('.content-view-module > div, .content-view-list > div').css({display: 'block'});

	hideST = setTimeout(showRecentlySearched, 500);

	showed = false;
	files = [];
	filesHas = {};
}

function fillInput(text)
{
	let input = document.querySelector('.search-bar > div input');
	input.value = text;

	search(text);
}

module.exports = {
	showHide: showHide,
	keyup: keyup,
	hide: hide,
	fillInput: fillInput,
	saveRecentlySearched: saveRecentlySearched,
	files: function(){return files},
	start: function(){

		hideST = setTimeout(showRecentlySearched, 500);

	},
};