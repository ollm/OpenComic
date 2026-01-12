const opds = require(p.join(appDir, '.dist/opds/opds.js')),
	search = require(p.join(appDir, '.dist/opds/search.js')),
	auth = require(p.join(appDir, '.dist/opds/auth.mjs')).default;

const opdsPathNames = {};
const defaultCatalogs = [
	{
		title: 'Feedbooks',
		subtitle: '',
		url: 'https://catalog.feedbooks.com/catalog/index.json',
		changes: 102,
	},
	/*{
		title: 'Internet Archive',
		subtitle: '',
		url: 'https://bookserver.archive.org/catalog/',
		changes: 102,
	},*/
	{
		title: 'Project Gutenberg',
		subtitle: 'Free eBooks since 1971.',
		url: 'https://m.gutenberg.org/ebooks.opds/',
		changes: 102,
	},
	{
		title: 'unglue.it',
		subtitle: '',
		url: 'https://unglue.it/api/opds/',
		changes: 102,
	},
	{
		title: 'textos.info',
		subtitle: 'Biblioteca virtual abierta y gratuita',
		url: 'https://www.textos.info/catalogo.atom',
		changes: 102,
	},
]

// Test catalogs
/*defaultCatalogs.push({
	title: 'OPDS Test Catalog',
	subtitle: 'Test catalog from GitHub (Feedbooks)',
	url: 'https://feedbooks.github.io/opds-test-catalog/catalog/root.xml',
	changes: 102,
});*/

function addNewDefaultCatalogs(data, changes)
{
	data.opdsCatalogs = (data.opdsCatalogs && data.opdsCatalogs.length) ? data.opdsCatalogs : [];
	let added = false;

	for(let i = 0, len = defaultCatalogs.length; i < len; i++)
	{
		const catalog = defaultCatalogs[i];

		if(catalog.changes > changes)
		{
			data.opdsCatalogs.push({
				title: catalog.title,
				subtitle: catalog.subtitle,
				url: catalog.url,
				downloadAuto: false,
				showOnLeft: false,
			});

			added = true;
		}
	}

	if(added)
		storage.set('opdsCatalogs', data.opdsCatalogs);

	return data;
}

var currentCatalog = false;

function setCurrentCatalog(url)
{
	const opdsCatalogs = storage.get('opdsCatalogs');

	for(let i = 0, len = opdsCatalogs.length; i < len; i++)
	{
		const catalog = opdsCatalogs[i];
		catalog.index = i;

		if(catalog.url === url)
			currentCatalog = catalog;
	}
}

function updateCatalog(index, data = {})
{
	const opdsCatalogs = storage.get('opdsCatalogs');

	if(opdsCatalogs[index])
	{
		for(let key in data)
		{
			opdsCatalogs[index][key] = data[key];
		}
	}

	storage.set('opdsCatalogs', opdsCatalogs);
}

function updateCatalogSubtitle(url, subtitle)
{
	const opdsCatalogs = storage.get('opdsCatalogs');

	for(let i = 0, len = opdsCatalogs.length; i < len; i++)
	{
		const catalog = opdsCatalogs[i];

		if(catalog.url === url)
			catalog.subtitle = subtitle;
	}

	storage.set('opdsCatalogs', opdsCatalogs);
}

function updateSearchButton()
{
	const header = template._barHeader();
	const button = header.querySelector('.button-opds-search');

	if(button)
	{
		if(currentSearch)
			button.classList.remove('disable-pointer');
		else
			button.classList.add('disable-pointer');
	}
}

async function home()
{
	opds.abort();

	publicationsCache = {};

	const catalogs = [];
	const opdsCatalogs = storage.get('opdsCatalogs');

	for(let i = 0, len = opdsCatalogs.length; i < len; i++)
	{
		const catalog = opdsCatalogs[i];
		const base64 = opds.base64(catalog.url);
		const url = 'opds:'+p.sep+base64;

		catalogs.push({
			title: catalog.title,
			subtitle: catalog.subtitle,
			url: url,
			secure: /^https/.test(catalog.url),
		});

		addPathName(base64, catalog.title);
	}

	handlebarsContext.opds = false;
	handlebarsContext.opdsCatalogs = catalogs;
	currentFeed = false;
	currentSearch = false;

	await boxes();

	template.loadHeader('opds.header.html', true);
	template.loadContentRight('opds.content.right.home.html', true);

	updateSearchButton();

	events.events();
}

var currentFeed = false, currentSearch = false, fromContextMenu = false;

async function browse(path, mainPath, keepScroll)
{
	if(isPublication(path))
		return publication(path);

	publicationsCache = {};
	handlebarsContext.opds = {...currentFeed, loading: true, showFacets: isFromFacets};

	try
	{
		const url = opds.base64ToUrl(path);
		setCurrentCatalog(url);

		await boxes(path, mainPath);

		template.loadHeader('opds.header.html', true);
		template.loadContentRight('opds.content.right.browse.html', true);

		// Load feed
		const feed = await opds.read(url, path, mainPath);

		await getPublicationPosters(feed);

		if(currentFeed === false)
			updateCatalogSubtitle(url, feed.metadata.subtitle);

		feed.showFacets = feed.facets?.length > 0 ? true : false;
		handlebarsContext.opds = feed;
		currentFeed = feed;

		if(feed.search)
			currentSearch = feed.search;

		template.loadContentRight('opds.content.right.browse.html', true);

		updateSearchButton();

		const contentRight = template._contentRight();
		const content = contentRight.querySelector('.opds-browse-content');
		if(content) content.scrollTop = keepScroll || 0;
	}
	catch(error)
	{
		const message = error.message || error || 'OPDS Conexion Error';

		if(/abortController/.test(message))
			return;

		console.error(error);

		handlebarsContext.serverLastError = message;
		handlebarsContext.serverHasCache = false;

		template.loadContentRight('index.content.right.else.html', true);
	}

	isFromFacets = false;
	fromContextMenu = false;
	events.events();
}

async function read(path, mainPath)
{
	const url = opds.base64ToUrl(path);
	const feed = await opds.read(url, path, mainPath);

	return [];
}

function getPublications(feed)
{
	const publications = [];

	if(feed.groups)
	{
		for(let i = 0, len = feed.groups.length; i < len; i++)
		{
			const group = feed.groups[i];

			if(group.filePublications)
				publications.push(...group.filePublications);
		}
	}

	if(feed.filePublications)
		publications.push(...feed.filePublications);

	return publications;
}

function getPosterPath(image)
{
	image = image.replace(/^http/, 'opdsf');

	const dirname = p.dirname(image);
	const basename = p.basename(image);
	const ext = app.extname(basename).replace(/\?.*/, '');

	image = p.join(dirname, opds.btoa(basename)+(ext ? '.'+ext : ''));

	return serverClient.fixStart(image);
}

async function getPublicationPosters(feed)
{
	const publications = getPublications(feed);
	const images = [];

	for(let i = 0, len = publications.length; i < len; i++)
	{
		const publication = publications[i];
		const image = getPosterPath(publication.image);

		const sha = cache.imageSizeSha({path: image, sha: false, type: 'poster'});
		publication.poster.sha = sha;

		if(image)
			images.push({path: image, sha: sha, type: 'poster'});
	}

	const file = fileManager.file(feed.url, {fromThumbnailsGeneration: true, subtask: true})
	file.updateConfig({cacheOnly: true});

	const posters = cache.returnThumbnailsImages(images, function(data) {

		dom.addImageToDom(data.sha, data.path);

	}, file);

	file.destroy();

	for(let i = 0, len = publications.length; i < len; i++)
	{
		const publication = publications[i];
		const poster = posters[publication.poster.sha];

		if(poster && poster.cache)
		{
			publication.poster.path = poster.path;
			publication.poster.cache = true;
		}
	}

	return true;
}

var currentPublication = false;

async function publication(path = false)
{
	path = path || currentPublication.path;
	const uuid = app.extract(/publication:([0-9a-f-]*)/, path);

	const publication = publicationsCache[uuid];
	publication.path = path;
	currentPublication = publication;

	if(!fromContextMenu && hasDownloadable(publication.acquisitionLinks) && currentCatalog.downloadAuto)
	{
		openBestAcquisitionLink(publication.acquisitionLinks, currentCatalog.downloadFiles);
		
		return;
	}

	const currentUrl = publication.currentUrl;
	const mainPath = publication.mainPath;
	const metadata = publication.metadata;

	// Find and show download file from this publication
	let downloadFile = findDownloadFile(publication.acquisitionLinks, currentCatalog.downloadFiles);

	handlebarsContext.opdsDownloadFile = downloadFile;
	handlebarsContext.opdsAcquisitionLinks = publication.acquisitionLinks;
	
	// Get image in cache
	const image = getPosterPath(metadata.poster);

	const poster = {
		path: '',
		sha: cache.imageSizeSha({path: image, sha: false, type: 'poster'}),
		cache: false,
	};

	const file = fileManager.file(path, {fromThumbnailsGeneration: true, subtask: true})

	const _poster = cache.returnThumbnailsImages({path: image, sha: poster.sha, type: 'poster'}, function(data){

		dom.addImageToDom(data.sha, data.path);

	}, file);

	file.destroy();

	if(_poster && _poster.cache)
	{
		poster.path = _poster.path;
		poster.cache = true;
	}

	const html = await dom.fileInfo.show('', {
		title: metadata.title || '',
		subtitle: metadata.subtitle || '',

		series: addUrlFunctions(metadata.belongsTo?.series, currentUrl, mainPath),
		tags: metadata.belongsTo?.collection || '',
		// seriesGroup: metadata.belongsTo?.collection || '',

		poster: poster,
		pages: metadata.numberOfPages,

		author: addUrlFunctions(metadata.author, currentUrl, mainPath),
		// writer: metadata.writer || '',
		penciller: addUrlFunctions((metadata.penciler || metadata.penciller), currentUrl, mainPath),
		inker: addUrlFunctions(metadata.inker, currentUrl, mainPath),
		colorist: addUrlFunctions(metadata.colorist, currentUrl, mainPath),
		letterer: addUrlFunctions(metadata.letterer, currentUrl, mainPath),
		coverArtist: addUrlFunctions(metadata.artist, currentUrl, mainPath),
		illustrator: addUrlFunctions(metadata.illustrator, currentUrl, mainPath),
		editor: addUrlFunctions(metadata.editor, currentUrl, mainPath),
		translator: addUrlFunctions(metadata.translator, currentUrl, mainPath),
		narrator: addUrlFunctions(metadata.narrator, currentUrl, mainPath),
		publisher: addUrlFunctions(metadata.publisher, currentUrl, mainPath),
		// imprint: metadata.imprint || '',
		// contributor: metadata.contributor || [],

		subject: addUrlFunctions(metadata.subject || [], currentUrl, mainPath),
		genre: metadata.genre || '',

		description: metadata.description || '',
		longDescription: metadata.longDescription || '',
		rights: metadata.rights || '',

		language: metadata.language || '',

		web: metadata.identifier ? app.extract(/^(?:url|uri):(.*)/iu, metadata.identifier) : '',
		identifier: metadata.identifier,
		source: metadata.source,

		releaseDate: metadata.published || '',
		modifiedDate: metadata.modified || '',
	});

	fromContextMenu = false;

	return;

	handlebarsContext.opdsPublication = html;

	template.loadContentRight('opds.content.right.publication.html', true);
}

function hasDownloadable(acquisitionLinks)
{
	return acquisitionLinks.download.links && acquisitionLinks.download.links.some(link => link.type !== 'text/html');
}

function findDownloadFile(acquisitionLinks, downloadFiles)
{
	let downloadFile = false;

	toBreak:
	for(const key in acquisitionLinks)
	{
		for(const link of acquisitionLinks[key].links)
		{
			if(link.type !== 'text/html' && downloadFiles[link.href])
			{
				const _downloadFile = downloadFiles[link.href].path;

				if(fs.existsSync(_downloadFile))
				{
					downloadFile = _downloadFile;
					break toBreak;
				}
			}
		}
	}

	return downloadFile;
}

function openBestAcquisitionLink(acquisitionLinks, downloadFiles)
{
	let downloadFile = findDownloadFile(acquisitionLinks, downloadFiles);

	if(downloadFile)
	{
		dom.loadIndexPage(true, downloadFile, false, false, downloadFile);
		return;
	}

	const bestLink = findBestAcquisitionLink(acquisitionLinks.download.links);

	console.log(bestLink);

	dom.loadIndexPage(true, bestLink.path, false, false, bestLink.path);
	// dom.loadIndexPage(true, bestLink.path, false, false, bestLink.mainPath);

	const name = dom.metadataPathName({
		name: p.basename(bestLink.path),
		path: bestLink.path,
		compressed: fileManager.isCompressed(bestLink.path),
	}); // OR bestLink.publicationTitle

	currentCatalog.downloadFiles[bestLink.href] = {path: bestLink.path, name: name};
	updateCatalog(currentCatalog.index, {downloadFiles: currentCatalog.downloadFiles});
}

function findBestAcquisitionLink(acquisitionLinks)
{
	const orders = [
		'7z',
		'pdf',
		'epub',
	];

	const len = orders.length;

	acquisitionLinks = app.copy(acquisitionLinks);
	acquisitionLinks = acquisitionLinks.map(function(link) {

		let order = len;

		for(let i = 0; i < len; i++)
		{
			const ext = orders[i];

			if(compatible.mime.compressed[ext](link.mime))
			{
				order = i;
				break;
			}
		}

		link.order = order;
		return link;

	});

	acquisitionLinks.sort(function(a, b) {

		return a.order - b.order;

	});

	const bestLink = acquisitionLinks[0];
	return bestLink;
}

function downloadOrSelect(type, index = false)
{
	const acquisitionLinks = currentPublication.acquisitionLinks[type];
	const links = acquisitionLinks.links;

	if(links.length > 1 && index === false)
	{
		const items = [];

		for(let i = 0, len = links.length; i < len; i++)
		{
			const link = links[i];
			const name = (link.title || language.buttons[type] || type)+' ('+compatible.extension.get(link.mime)+')';

			items.push({
				name: name,
				icon: (link.type === 'text/html') ? 'open_in_new' : 'download',
				function: 'opds.downloadOrSelect(\''+type+'\', '+i+');',
				select: false,
			});
		}

		handlebarsContext.menu = {
			items: items,
		};

		document.querySelector('#menu-simple-element .menu-simple-content').innerHTML = template.load('menu.simple.element.html');

		const button = document.querySelector('.file-info-odps-button-'+type);
		events.showSelect(button, 'menu-simple-element', true, false);
	}
	else
	{
		index = index || 0;

		links[index].button = type;
		downloadOrOpen(links[index]);
	}
}

function downloadOrOpen(link)
{
	if(link.type === 'text/html')
	{
		electron.shell.openExternal(link.url);
	}
	else
	{
		if(config.downloadOpdsToFolder)
			download(link);
		else
			downloadDialog(link);

	}
}

function downloadDialog(link, confirm = false)
{
	downloadLink = link;

	handlebarsContext.downloadLink = link;
	handlebarsContext.downloadOpdsFolder = relative.resolve(config.downloadOpdsFolder);

	events.dialog({
		header: language.dialog.opds.downloadTitle,
		width: 600,
		height: false,
		content: template.load('dialog.opds.download.html'),
		onClose: 'opds.publication();',
		buttons: [
			{
				text: language.buttons.cancel,
				function: 'opds.publication();',
			},
			{
				text: language.buttons.download,
				function: 'opds.publication(); opds.download();',
			}
		],
	});

	events.events();
}

async function download(link = false)
{
	link = link || downloadLink;

	if(link)
	{
		const downloadOpdsFolder = relative.resolve(config.downloadOpdsFolder);
		fileManager.macosStartAccessingSecurityScopedResource(downloadOpdsFolder);

		const button = document.querySelector('.dialog .file-info-odps-button-'+link.button);
		events.buttonLoading(button, true);

		const fileName = getFileName(link);
		const downloadPath = fileManager.genearteFilePath(downloadOpdsFolder, fileName);
		const _downloadPath = escapeQuotes(escapeBackSlash(downloadPath));

		if(!fs.existsSync(downloadPath))
		{
			const response = await auth.fetch(link.url);

			if(response.ok)
			{
				const len = parseInt(response.headers.get('content-length'), 10);

				const reader = response.body.getReader();
				const fileStream = fs.createWriteStream(downloadPath);

				let downloaded = 0;

				while(true)
				{
					const {done, value} = await reader.read();

					if(done)
						break;

					fileStream.write(value);
					downloaded += value.byteLength;

					events.buttonLoading(button, downloaded / len);
				}

				events.buttonLoading(button, 1);

				let resolve;

				const promise = new Promise(function(_resolve){

					resolve = _resolve;

				});

				fileStream.end(resolve);

				await promise;
			}
			else
			{
				events.snackbar({
					key: 'downloadError',
					text: 'Invalid response: '+response.status+' '+response.statusText,
					duration: 6,
					buttons: [
						{
							text: language.buttons.dismiss,
							function: 'events.closeSnackbar();',
						},
					],
				});

				events.buttonLoading(button, false);

				return;
			}
		}

		events.buttonLoading(button, false);

		// Add to library
		addComicsToLibrary([downloadPath], false);

		currentCatalog.downloadFiles[link.href] = {path: downloadPath};
		updateCatalog(currentCatalog.index, {downloadFiles: currentCatalog.downloadFiles});

		const odpsButtonOpen = document.querySelector('.file-info-odps-button-open');

		if(odpsButtonOpen)
		{
			odpsButtonOpen.style.display = 'block';
			odpsButtonOpen.setAttribute('onclick', 'events.closeDialog(); /*dom.loadIndexPage(true);*/ dom.loadIndexPage(true, \''+_downloadPath+'\', false, false, \''+_downloadPath+'\');');
		}

		events.snackbar({
			key: 'downloadSuccess',
			text: language.dialog.opds.downloadSuccess,
			duration: 8,
			buttons: [
				{
					text: language.global.open,
					function: 'events.closeDialog(); /*dom.loadIndexPage(true);*/ dom.loadIndexPage(true, \''+_downloadPath+'\', false, false, \''+_downloadPath+'\');',
				},
			],
		});
	}
}

function getFileName(link)
{
	const basename = p.basename(link.href);
	const fileName = link.publicationTitle || p.parse(basename).name;
	const ext = compatible.extension.get(link.mime) || app.extname(basename);

	return fileName.replace(/[\\\/:*?\"<>|]/g, '')+(ext ? '.'+ext : '');
}

function addUrlFunctions(items, currentUrl, mainPath)
{
	if(!items)
		return '';

	if(!items.length)
		items = [items];

	for(let i = 0, len = items.length; i < len; i++)
	{
		const item = items[i];
		const path = opds.getPath(item, currentUrl, mainPath);

		if(path)
			item.function = 'events.closeDialog(); dom.fileInfo.resize(false); dom.loadIndexPage(true, \''+escapeQuotes(escapeBackSlash(path), 'simples')+'\', false, false, \''+escapeQuotes(escapeBackSlash(mainPath), 'simples')+'\');';
	}

	return items;
}

var isFromFacets = false;

function fromFacets(facets)
{
	isFromFacets = true;
}

function isPublication(path)
{
	if(/^opds:[\/\\]+publication:/.test(path))
		return true;

	return false;
}

var publicationsCache = {};

function addPublication(uuid, publication)
{
	publication.uuid = uuid;
	publicationsCache[uuid] = publication;
}

function addPathName(path, name)
{
	opdsPathNames[opdsPath(path)] = name;
}

function pathName(path)
{
	const _path = path.replace(/\.[^\.]*$/, '');
	return opdsPathNames[opdsPath(_path)] || opdsPathNames[opdsPath(path)] || 'Null';
}

function opdsPath(path)
{
	return serverClient.posixPath(path).replace(/\/+$/, '');
}

function getInputValues()
{
	let title = document.querySelector('.input-title').value;
	let url = document.querySelector('.input-url').value;
	let user = document.querySelector('.input-user') ? document.querySelector('.input-user').value : '';
	let pass = document.querySelector('.input-pass') ? document.querySelector('.input-pass').value : '';
	let downloadAuto = !!+document.querySelector('.input-download-auto').dataset.value;
	let showOnLeft = !!+document.querySelector('.input-show-on-left').dataset.value;

	return {
		title: title,
		url: url,
		user: user,
		pass: pass,
		downloadAuto: downloadAuto,
		showOnLeft: showOnLeft,
	};
}

function add(save = false)
{
	if(save)
	{
		const opdsCatalogs = storage.get('opdsCatalogs');

		const values = getInputValues();
		
		opdsCatalogs.push({
			title: values.title,
			subtitle: '',
			url: values.url,
			downloadAuto: values.downloadAuto,
			showOnLeft: values.showOnLeft,
			downloadFiles: {},
		});

		storage.set('opdsCatalogs', opdsCatalogs);

		dom.loadIndexContentLeft(true);
		dom.reload();
	}
	else
	{
		handlebarsContext.opdsCatalog = false;

		events.dialog({
			header: language.global.catalogs,
			width: 600,
			height: false,
			content: template.load('dialog.opds.add.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.save,
					function: 'events.closeDialog(); opds.add(true);',
				}
			],
		});

		events.eventSwitch();
		events.eventInput();
	}
}

function edit(key, save = false)
{
	const opdsCatalogs = storage.get('opdsCatalogs');

	if(save)
	{
		const values = getInputValues();
		const opdsCatalog = opdsCatalogs[key];

		opdsCatalog.title = values.title;
		opdsCatalog.url = values.url;
		opdsCatalog.user = values.user;
		opdsCatalog.pass = storage.safe.encrypt(values.pass);
		opdsCatalog.downloadAuto = values.downloadAuto;
		opdsCatalog.showOnLeft = values.showOnLeft;

		storage.set('opdsCatalogs', opdsCatalogs);

		dom.loadIndexContentLeft(true);
		dom.reload();
	}
	else
	{
		handlebarsContext.opdsCatalog = opdsCatalogs[key];
		handlebarsContext.opdsCatalog.pass = storage.safe.decrypt(opdsCatalogs[key].pass);

		events.dialog({
			header: language.global.catalogs,
			width: 600,
			height: false,
			content: template.load('dialog.opds.add.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.save,
					function: 'events.closeDialog(); opds.edit('+key+', true);',
				}
			],
		});

		events.eventSwitch();
		events.eventInput();
	}
}

function _delete(key, confirm = false)
{
	if(confirm)
	{
		const opdsCatalogs = storage.get('opdsCatalogs');

		opdsCatalogs.splice(key, 1);
		storage.set('opdsCatalogs', opdsCatalogs);

		dom.loadIndexContentLeft(true);
		dom.reload();
	}
	else
	{
		events.dialog({
			header: language.dialog.opds.delete,
			width: 400,
			height: false,
			content: language.dialog.opds.confirmDelete,
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.remove,
					function: 'events.closeDialog(); opds.delete('+key+', true);',
				}
			],
		});
	}
}

async function boxes(path = false, mainPath = false)
{
	if(path === false || path === mainPath)
	{
		const files = [];

		if(!path)
		{
			const opdsCatalogs = storage.get('opdsCatalogs');

			for(const key in opdsCatalogs)
			{
				files.push(...Object.values(opdsCatalogs[key].downloadFiles ?? {}));
			}
		}
		else
		{
			files.push(...Object.values(currentCatalog.downloadFiles ?? {}));
		}

		const comics = [];

		for(let i = 0, len = files.length; i < len; i++)
		{
			const file = files[i];
			const path = file.path;
			const isServer = fileManager.isServer(path);

			if(fs.existsSync(path) || isServer)
			{
				const stat = !isServer ? fs.statSync(path) : {ctimeMs: 0};
				const compressed = fileManager.isCompressed(path);

				const name = dom.metadataPathName({
					name: file.name || p.basename(path),
					path: path,
					compressed: compressed,
				});

				comics.push({
					name: name,
					path: path,
					added: Math.round(stat.ctimeMs / 1000),
					folder: true,
					compressed: compressed,
				});
			}
		}

		const len = comics.length;

		if(len)
		{
			// Comic reading progress
			let readingProgress = relative.get('readingProgress');

			for(let i = 0; i < len; i++)
			{
				comics[i].readingProgress = readingProgress[comics[i].path] || {lastReading: 0};
			}

			for(let i = 0; i < len; i++)
			{
				const comic = comics[i];

				comic.sha = sha1(comic.path);
				comic.addToQueue = 2;
				comic.mainPath = comic.path;
			}
		}

		const sortAndView = handlebarsContext.page.opds;

		dom.boxes.reset();
		if(sortAndView.continueReading) await dom.boxes.continueReading(comics, true);
		if(sortAndView.recentlyAdded) await dom.boxes.recentlyAdded(comics, true);

		handlebarsContext.opdsBoxes = true;
	}
	else
	{
		dom.boxes.reset();
		handlebarsContext.opdsBoxes = false;
	}
}

module.exports = {
	addNewDefaultCatalogs: addNewDefaultCatalogs,
	home: home,
	browse: browse,
	read: read,
	fromFacets: fromFacets,
	pathName: pathName,
	addPathName: addPathName,
	publication: publication,
	addPublication: addPublication,
	isPublication: isPublication,
	downloadOrSelect: downloadOrSelect,
	download: download,
	downloadDialog: downloadDialog,
	currentCatalog: function(){return currentCatalog},
	setCurrentCatalog: function(catalog){currentCatalog = catalog;},
	updateCatalog: updateCatalog,
	getFeed: function() {return currentFeed},
	getSearch: function() {return currentSearch},
	findBestAcquisitionLink,
	add: add,
	edit: edit,
	delete: _delete,
	opds: opds,
	search: search,
	auth: auth,
	set fromContextMenu(value) {fromContextMenu = value},
	get fromContextMenu() {return fromContextMenu},
}