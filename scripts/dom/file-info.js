const _sanitizeHtml = require('sanitize-html'),
	country = require(p.join(appDir, '.dist/dom/file-info-country.js')),
	findOn = require(p.join(appDir, '.dist/dom/file-info-find-on.js'));

// Also support ComicInfo.xml if it is in a folder

var currentPath = false;

const compactData = ['size', 'language', 'releaseDate', 'readingDate', 'modifiedDate', 'bookNumber', 'bookTotal', 'volume', 'pages', 'alternateBookNumber', 'alternateBookTotal'];
const ignoreData = [
	...['title', 'subtitle', 'author', 'description', 'longDescription', 'metadata', 'year', 'month', 'day', 'poster', 'manga', 'writer', 'penciller', 'inker', 'colorist', 'letterer', 'coverArtist', 'illustrator', 'editor', 'translator', 'narrator', 'imprint'],
	...compactData,
];

const keyOrder = [

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
	'ISBN', // pdf and epub


];

const contributorKeyOrder = [
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
	'narrator',
	'compiler',
	'adapter',
	'commentator',
	'preface',
	'foreword',
	'introduction',
	'imprint',
	'contributor',
];

const epubConvertKeys = {
	aut: 'author',
	edt: 'editor',
	art: 'coverArtist',
	ill: 'illustrator',
	trl: 'translator',
	nar: 'narrator', // ??
	ptg: 'photographer',
	com: 'compiler',
	adp: 'adapter',
	cmm: 'commentator',
	pfr: 'preface',
	fwd: 'foreword',
	inr: 'introduction',
	ctb: 'contributor',
};

async function show(path, opds = false)
{
	let metadata = {};
	let runCountImages = false;

	if(opds)
	{
		metadata = opds;
	}
	else
	{
		currentPath = path;

		metadata = fileManager.compressedMetadata(path);

		if(metadata === false)
		{
			const file = fileManager.file(path);
			const files = await file.read({filtered: false});
			file.destroy();

			const compressed = fileManager.fileCompressed(path);
			metadata = await compressed.readCompressedMetadata(files, false);
			compressed.destroy();
		}

		metadata.size = '<span class="file-info-size">...</span>';

		let readingProgress = relative.get('readingProgress');
		readingProgress = readingProgress[path] || false;

		if(readingProgress)
			metadata.readingDate = readingProgress.lastReading;

		if(!metadata.pages)
		{
			metadata.pages = '<span class="file-info-pages">...</span>';
			runCountImages = true;
		}
	}

	metadata.contributor = parseContributor(metadata);

	let dataCompactList = [];

	let dataList = [];

	for(let key in metadata)
	{
		if(!inArray(key, keyOrder))
		{
			keyOrder.push(key);
		}
	}

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
	let images = {};

	if(opds)
	{
		images = {
			images: false,
			poster: {
				path: opds.poster.path,
				realPath: opds.poster.path,
				sha: opds.poster.sha,
			},
		};

		bigPoster = false;
	}
	else
	{
		let file = fileManager.file(path);
		images = await file.images(4, false, true);

		if(Array.isArray(images) || !bigPoster)
		{
			images = await dom.getFolderThumbnails(path, 150);
		}
		else
		{
			await file.makeAvailable([{path: images.path}]);

			let src = fileManager.realPath(images.path);

			const options = {
				kernel: 'lanczos3',
				fit: 'cover',
				width: Math.round(400 * window.devicePixelRatio),
				height: Math.round(600 * window.devicePixelRatio),
			};

			if(compatible.image.convert(images.path)) // Convert unsupported images
				src = await workers.convertImage(images.path, {priorize: true});

			let data = await image.resizeToBlob(src, options);
			images.realPath = data.blob;

			images = {
				images: false,
				poster: images,
			};
		}

		file.destroy();
	}

	if(images.poster && !/^blob/.test(images.poster.realPath) && !opds)
		await image.loadImage(images.poster.realPath, true);

	handlebarsContext.fileInfo = {
		title: metadata.title || p.basename(path),
		subtitle: metadata.subtitle,
		author: parseHtmlUrls(parseItems(metadata.author)),
		poster: images.poster,
		bigPoster: images.poster && bigPoster ? true : false,
		images: images.images,
		description: parseDescription(parseHtmlUrls(sanitizeHtml(metadata.longDescription || metadata.description))),
		dataCompactList: dataCompactList,
		dataList: dataList,
		firstCompressedFile: fileManager.firstCompressedFile(path),
		opds: opds,
	};

	//if(opds)
	//	return template.load('dialog.file.info.html');

	events.dialog({
		width: ((images.poster && bigPoster) || opds) ? 1000 : 600,
		maxHeight: (images.poster && bigPoster) ? 600 : 800,
		height: false,
		overflowHidden: images.poster && bigPoster ? true : false,
		content: template.load('dialog.file.info.html'),
		onClose: 'dom.fileInfo.resize(false)',
	});

	if(images.poster && bigPoster)
		dom.fileInfo.resize(true);

	if(!opds)
	{
		getFileSize();

		if(runCountImages)
			countImages();
	}
}

async function getFileSize()
{
	let size = await fileManager.dirSize(fileManager.realPath(fileManager.firstCompressedFile(currentPath), -1));

	size = size / 1000 / 1000;

	if(size > 1000)
		size = app.round(size / 1000, 1)+'GB';
	else
		size = app.round(size, 1)+'MB';

	dom.queryAll('.file-info-size').html(size);
}

async function countImages()
{
	const pages = await reading.progress.countPages(currentPath, false);
	dom.queryAll('.file-info-pages').html(pages);
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

			value = joinItems(splitCommaSeparated(value), (key === 'characters'));

			break;

		case 'language':

			value = parseLanguage(value);

			break;

		case 'web':

			value = parseUrl(value);

			break;

		case 'subject':

			value = parseSubject(value);

			break;

		case 'publisher':
		case 'series':

			value = parseItems(value);

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
	if(!html) return html;

	html = html.replace(/(\<a\s)\s*/ig, '$1 target="_blank"');
	html = html.replace(/href="\/\/([^\/\>])/ig, 'href="https://$1');

	const matches = [...html.matchAll(/\<a\s+target="_blank"\s*data-function="([0-9]+)"/ig)];

	for(let i = 0, len = matches.length; i < len; i++)
	{
		const match = matches[i];
		const index = +match[1];

		html = html.replace(match[0], '<a href="javascript:void(0)" onclick="'+dataFunction[index]+'"');
		delete  dataFunction[index];
	}

	return html;
}

function parseTextUrls(text)
{
	text = text.replace(/\(([^\)]+)\)\s*\[(http[^\]]+)\]/iug, '<a href="$2" target="_blank">$1</a>');
	text = text.replace(/\[([^\]]+)\]\s*\((http[^\)]+)\)/iug, '<a href="$2" target="_blank">$1</a>');
	text = text.replace(/(^|[^">])(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s,"<]{2,})/iug, '$1<a href="$2" target="_blank">$2</a>');

	return text;
}

function parseLanguage(lang)
{
	const langs = splitCommaSeparated(lang);
	const languageNames = new Intl.DisplayNames([config.language], {type: 'language'}); // navigator.language?

	for(let i = 0, len = langs.length; i < len; i++)
	{
		try
		{
			langs[i] = app.capitalize(languageNames.of(langs[i]));
		}
		catch{}
	}

	return joinItems(langs);
}

function parseUrl(url)
{
	return '<a href="'+url+'" target="_blank">'+url+'</a>';
}

var dataFunction = {}, dataFunctionIndex = 0;

function parseUrlOrFunction(string, data)
{
	dataFunctionIndex++;
	dataFunction[dataFunctionIndex] = data.function;

	if(data.function)
		return '<a data-function="'+dataFunctionIndex+'">'+string+'</a>';
	else if(data.url)
		return '<a href="'+data.url+'" target="_blank">'+string+'</a>';

	return string;
}

function parseSubject(subject)
{
	let html = [];

	for(let i = 0, len = subject.length; i < len; i++)
	{
		let value = subject[i];
		html.push('<span>'+parseUrlOrFunction('<i class="material-icon">sell</i> '+(value.name || value.code), value)+'</span>');
	}

	return '<div class="file-info-subject">'+html.join(' ')+'</div>';
}

function parseItems(items)
{
	if(typeof items !== 'object')
		return items;

	if(!items.length)
		items = [items];

	const _items = [];

	for(let i = 0, len = items.length; i < len; i++)
	{
		let item = items[i];
		_items.push(parseUrlOrFunction(item.name || item.title || item.code || '', item));
	}

	return joinItems(_items);
}

function _parseContributor(metadata, key)
{
	if(!metadata.contributor) metadata.contributor = [];

	if(metadata[key])
	{
		if(typeof metadata[key] === 'string')
		{
			let names = splitCommaSeparated(metadata[key]);

			for(let i = 0, len = names.length; i < len; i++)
			{
				metadata.contributor.push({name: names[i], role: key});
			}
		}
		else
		{
			for(let i = 0, len = metadata[key].length; i < len; i++)
			{
				if(typeof metadata[key][i] === 'string')
					metadata[key][i] = {name: metadata[key][i]};

				metadata[key][i].role = key;
				metadata.contributor.push(metadata[key][i]);
			}
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
	metadata = _parseContributor(metadata, 'illustrator');
	metadata = _parseContributor(metadata, 'editor');
	metadata = _parseContributor(metadata, 'translator');
	metadata = _parseContributor(metadata, 'narrator');
	metadata = _parseContributor(metadata, 'imprint');

	let html = '';

	let data = [];

	for(let i = 0, len = metadata.contributor.length; i < len; i++)
	{
		let contributor = metadata.contributor[i];

		let key = contributor.role || 'contributor';
		let langKey = epubConvertKeys[key] || key;

		let value = contributor;

		data.push({
			key: langKey,
			name: language.dialog.fileInfo.data[langKey] || app.capitalize(langKey),
			value: parseValue(parseItems(value), key),
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

function joinItems(items, and = true)
{
	if(!and)
		return items.join(', ');

	const last = items.pop();
	return items.length ? items.join(', ')+' '+language.global.and+' '+last : last;
}

function parseDate(value)
{
	if(typeof value === 'string' && /^[0-9]{4}$/.test(value))
		return value;

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
			span: ['file-info-size', 'file-info-pages'],
			div: ['file-info-subject'],
			i: ['material-icon'],
		},
		allowedAttributes: {
			a: ['href', 'target', 'data-function'],
		},
	});
}

function parseDescription(string)
{
	if(!string) return string;

	if(!/<\s*p[^>]*>/.test(string) && !/<\s*br[^>]*>/.test(string))
		string = string.trim().replace(/\n/g, '<br>');

	if(!/^\s*\<\s*p[^>]*>/.test(string))
		string = '<p>'+string+'</p>';

	return string;
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
	countImages: countImages,
};