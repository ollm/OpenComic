const _sanitizeHtml = require('sanitize-html'),
	country = require(p.join(appDir, 'scripts/dom/file-info-country.js')),
	findOn = require(p.join(appDir, 'scripts/dom/file-info-find-on.js'));

// Also support ComicInfo.xml if it is in a folder

var currentPath = false;

var compactData = ['size', 'language', 'releaseDate', 'readingDate', 'modifiedDate', 'bookNumber', 'bookTotal', 'volume', 'pages', 'alternateBookNumber', 'alternateBookTotal'];
var ignoreData = [
	...['title', 'author', 'description', 'longDescription', 'metadata', 'year', 'month', 'day', 'poster', 'manga', 'writer', 'penciller', 'inker', 'colorist', 'letterer', 'coverArtist', 'editor', 'translator', 'imprint'],
	...compactData,
];

var keyOrder = [

	// dataCompactList
	'bookNumber',
	'bookTotal',
	'volume',
	'pages',

	'alternateBookNumber',
	'alternateBookTotal',

	'releaseDate',
	'readingDate',
	'modifiedDate',

	'language',
	'size',

	// dataList
	'series',
	'localizedSeries',
	'alternateSeries',
	'seriesGroup',


	'storyArc',
	'storyArcNumber',

	'ageRating',
	'genre',
	'subject', // epub
	'tags',
	'web',
	'identifier', // pdf and epub
	'source', // epub

	'characters',
	'teams',
	'locations',
	'mainCharacterOrTeam',

	'contributor',
	'publisher',

	'format',
	'creatorTool', // pdf
	'scanInformation',
	'notes',
	'rights', // epub
	'GTIN',


];

var contributorKeyOrder = [
	'author',
	'writer',
	'penciller',
	'inker',
	'colorist',
	'letterer',
	'illustrator',
	'photographer',
	'coverArtist',
	'editor',
	'translator',
	'compiler',
	'adapter',
	'commentator',
	'preface',
	'foreword',
	'introduction',
	'imprint',
	'contributor',
];

var epubConvertKeys = {
	aut: 'author',
	edt: 'editor',
	ill: 'illustrator',
	trl: 'translator',
	ptg: 'photographer',
	com: 'compiler',
	adp: 'adapter',
	cmm: 'commentator',
	pfr: 'preface',
	fwd: 'foreword',
	inr: 'introduction',
	ctb: 'contributor',
};

async function show(path)
{
	currentPath = path;

	let sha = sha1(p.normalize(path));
	let cacheFile = 'compressed-files-'+sha+'.json';

	let metadata = {};

	if(cache.existsJson(cacheFile))
		metadata = cache.readJson(cacheFile).metadata || {};

	metadata.size = '<span class="file-info-size">...</span>';
	metadata.contributor = parseContributor(metadata);

	let readingProgress = storage.get('readingProgress');
	readingProgress = readingProgress[path] || false;

	if(readingProgress)
		metadata.readingDate = readingProgress.lastReading;

	let dataCompactList = [];

	let dataList = [];

	for(let key in metadata)
	{
		if(!inArray(key, keyOrder))
		{
			keyOrder.push(key);
		}
	}

	for(let i = 0, len = keyOrder.length; i < len; i++)
	{
		let key = keyOrder[i];

		if(!app.empty(metadata[key]))
		{
			if(!inArray(key, ignoreData))
			{
				dataList.push({
					key: key,
					name: language.dialog.fileInfo.data[key] || app.capitalize(key),
					value: parseValue(metadata[key], key),
					dataCompact: metadata[key] instanceof Object ? metadata[key].dataCompact : false,
				});
			}
			else if(inArray(key, compactData))
			{
				dataCompactList.push({
					key: key,
					name: language.dialog.fileInfo.data[key] || app.capitalize(key),
					value: parseValue(metadata[key], key),
				});
			}
		}
	}

	let bigPoster = true;
	let file = fileManager.file(path);
	let images = await file.images(4, false, true);

	if(Array.isArray(images) || !bigPoster)
	{
		images = await dom.getFolderThumbnails(path);
	}
	else
	{
		await file.makeAvailable([{path: images.path}]);

		images.realPath = fileManager.realPath(images.path);

		images = {
			images: false,
			poster: images,
		};
	}

	file.destroy();

	if(images.poster)
		await image.loadImage(images.poster.realPath, true);

	handlebarsContext.fileInfo = {
		title: metadata.title || p.basename(path),
		author: metadata.author,
		poster: images.poster,
		bigPoster: images.poster && bigPoster ? true : false,
		images: images.images,
		description: parseHtmlUrls(sanitizeHtml(metadata.longDescription || metadata.description)),
		dataCompactList: dataCompactList,
		dataList: dataList,
		firstCompressedFile: fileManager.firstCompressedFile(path),
	};

	events.dialog({
		width: images.poster && bigPoster ? 1000 : 600,
		maxHeight: images.poster && bigPoster ? 600 : 800,
		height: false,
		overflowHidden: images.poster && bigPoster ? true : false,
		content: template.load('dialog.file.info.html'),
		onClose: 'dom.fileInfo.resize(false)',
	});

	if(images.poster && bigPoster)
		dom.fileInfo.resize(true);

	getFileSize();
}

async function getFileSize()
{
	let size = await fileManager.dirSize(fileManager.realPath(fileManager.firstCompressedFile(currentPath)));

	size = size / 1000 / 1000;

	if(size > 1000)
		size = app.round(size / 1000, 1)+'GB';
	else
		size = app.round(size, 1)+'MB';

	dom.queryAll('.file-info-size').html(size);
}

function parseValue(value, key)
{
	switch (key)
	{
		case 'releaseDate':
		case 'readingDate':
		case 'modifiedDate':

			value = parseDate(value);

			break;

		case 'genre':
		case 'tags':
		case 'characters':

			value = splitCommaSeparated(value).join(', ');

			break;

		case 'web':

			value = parseUrl(value);

			break;

		case 'subject':

			value = parseSubject(value);

			break;
	}

	if(typeof value === 'string')
	{
		value = parseTextUrls(value);
		return parseHtmlUrls(sanitizeHtml(value));
	}
	else
	{
		return value;
	}
}

function parseHtmlUrls(html)
{
	return html.replace(/(\<a\s)/ig, '$1 target="_blank"');
}

function parseTextUrls(text)
{
	text = text.replace(/\(([^\)]+)\)\s*\[(http[^\]]+)\]/iug, '<a href="$2" target="_blank">$1</a>');
	text = text.replace(/\[([^\]]+)\]\s*\((http[^\)]+)\)/iug, '<a href="$2" target="_blank">$1</a>');

	return text;
}

function parseUrl(url)
{
	return '<a href="'+url+'" target="_blank">'+url+'</a>';
}

function parseSubject(subject)
{
	let html = [];

	for(let i = 0, len = subject.length; i < len; i++)
	{
		let value = subject[i];
		html.push('<i class="material-icon">sell</i> '+value.name);
	}

	return '<div class="file-info-subject">'+html.join('<br>')+'</div>';
}

function _parseContributor(metadata, key)
{
	if(!metadata.contributor) metadata.contributor = [];

	if(metadata[key])
	{
		let names = splitCommaSeparated(metadata[key]);

		for(let i = 0, len = names.length; i < len; i++)
		{
			metadata.contributor.push({name: names[i], role: key});
		}
	}

	return metadata;
}

function parseContributor(metadata)
{
	metadata = _parseContributor(metadata, 'writer');
	metadata = _parseContributor(metadata, 'penciller');
	metadata = _parseContributor(metadata, 'inker');
	metadata = _parseContributor(metadata, 'colorist');
	metadata = _parseContributor(metadata, 'letterer');
	metadata = _parseContributor(metadata, 'coverArtist');
	metadata = _parseContributor(metadata, 'editor');
	metadata = _parseContributor(metadata, 'translator');
	metadata = _parseContributor(metadata, 'imprint');

	let html = '';

	let data = [];

	for(let i = 0, len = metadata.contributor.length; i < len; i++)
	{
		let contributor = metadata.contributor[i];

		let key = contributor.role || 'contributor';
		let langKey = epubConvertKeys[key] || key;

		let value = contributor.name;

		data.push({
			key: langKey,
			name: language.dialog.fileInfo.data[langKey] || app.capitalize(langKey),
			value: parseValue(value, key),
		});
	}

	let _contributorKeyOrder = {};

	for(let i = 0, len = contributorKeyOrder.length; i < len; i++)
	{
		_contributorKeyOrder[contributorKeyOrder[i]] = i + 1;
	}

	data.sort(function(a, b) {
		
		if(_contributorKeyOrder[a.key] === _contributorKeyOrder[b.key])
			return 0;

		return (_contributorKeyOrder[a.key] && _contributorKeyOrder[a.key] < _contributorKeyOrder[b.key]) ? -1 : 1;
	});

	return data.length ? {dataCompact: data} : {};
}

function splitCommaSeparated(string)
{
	let data = string.split(',');

	let _data = [];

	for(let i = 0, len = data.length; i < len; i++)
	{
		let value = data[i].trim();

		if(value)
			_data.push(value);
	}

	return _data;
}

function parseDate(value)
{
	let date = new Date(typeof value === 'number' ? value : Date.parse(value));

	let options = {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		//hour: 'numeric',
		//minute: 'numeric',
		//second: 'numeric',
	};

	return date.toLocaleDateString(false, options);
}

function sanitizeHtml(string)
{
	return _sanitizeHtml(string, {
		allowedClasses: {
			span: ['file-info-size'],
			div: ['file-info-subject'],
			i: ['material-icon'],
		},
	});
}

var activeResize = false;

function _resize()
{
	if(activeResize)
	{
		let fileInfoContent = document.querySelector('.file-info-content');
		let fileInfoPoster = document.querySelector('.file-info-poster');
		if(!fileInfoPoster) return;

		let height = window.innerHeight - titleBar.height() - 32;

		if(height > 600) height = 600;

		fileInfoPoster.style.height = height+'px';
		fileInfoPoster.style.width = Math.round(height / 1.5)+'px';

		fileInfoContent.style.height = height+'px';
		fileInfoContent.style.width = 'calc(100% - '+Math.round(height / 1.5)+'px)';
	}
}

function resize(active = false)
{
	activeResize = active;
	if(!activeResize) return;

	_resize();

	app.event(window, 'resize', _resize);
}

module.exports = {
	show: show,
	resize: resize,
	country: country,
	findOn: findOn,
};