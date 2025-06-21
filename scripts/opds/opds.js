var controller = false;

async function read(url, path, mainPath, unparsed = false, forceCredentials = false)
{
	if(controller) controller.abort('abortController');
	controller = new AbortController();

	const response = await fetch(url, {signal: controller.signal, headers: opds.auth.headers(url)});
	const body = await response.text();

	if(!response.ok)
	{
		const valid = opds.auth.valid(response);

		if(valid)
		{
			await opds.auth.requestCredentials(response, forceCredentials);
			return read(url, path, mainPath, unparsed, true);
		}
	}

	if(!response.ok)
		throw new Error('Invalid response: '+response.status+' '+response.statusText);

	return await parse(body, url, path, mainPath);
}

function abort()
{
	if(controller) controller.abort('abortController');
	controller = false;
}

async function parse(string, url, path, mainPath)
{
	if(!foliateJs.opds)
		await loadFoliateJs();

	if(/^\s*{/.test(string)) // OPDS2
	{
		return _parse(JSON.parse(string), url, path, mainPath);
	}
	else // OPDS1
	{
		const xml = new DOMParser().parseFromString(string, 'application/xml');

		if (!xml || !xml.documentElement)
			throw new Error('Invalid XML/OPDS');

		if(xml.documentElement.localName === 'entry')
			return _parse(foliateJs.opds.getPublication(xml), url, path, mainPath);
		else if(xml.documentElement.localName === 'OpenSearchDescription')
			return getOpenSearch(xml);

		return _parse(foliateJs.opds.getFeed(xml), url, path, mainPath);
	}
}

async function _parse(feed, url, path, mainPath)
{
	feed.url = url;
	feed.hostUrl = serverClient.getHost(url);
	feed.baseUrl = serverClient.getBaseUrl(url);

	feed = findSearchUrl(feed, url);
	feed = findPagination(feed);

	feed = renameSummaryKeyInNavigation(feed);
	feed = convertPublicationsToFile(feed, path, mainPath, url);
	feed = parseUrls(feed, path, mainPath, url);

	return feed;
}

function getOpenSearch(xml)
{
	const urls = xml.querySelectorAll('Url');

	let hasOpdsCatalog = false;

	for(let i = 0, len = urls.length; i < len; i++)
	{
		const url = urls[i];
		const type = url.getAttribute('type');

		if(isOpdsCatalog(type) || isAtomCatalog(type))
			hasOpdsCatalog = true;
	}

	// Remove all not OPDS urls if has one or more OPDS urls
	if(hasOpdsCatalog)
	{
		for(let i = 0, len = urls.length; i < len; i++)
		{
			const url = urls[i];
			const type = url.getAttribute('type');

			if(!isOpdsCatalog(type) && !isAtomCatalog(type))
				url.remove();
		}
	}

	const search = foliateJs.opds.getOpenSearch(xml);

	return search;
}

function findSearchUrl(feed, currentUrl)
{
	let search = false;

	for(let i = 0, len = feed.links.length; i < len; i++)
	{
		const link = feed.links[i];
		const rel = getRel(link.rel);

		if(rel == 'search' || link.type == 'application/opensearchdescription+xml')
		{
			link.currentUrl = currentUrl;
			search = link;
			break;
		}
	}

	feed.search = search;

	return feed;
}

function isOpdsCatalog(type)
{
	return /opds-catalog|opds\+json/.test(type);
}

function isAtomCatalog(type)
{
	return /atom\+xml/.test(type);
}

function findPagination(feed)
{
	let pagination = {
		first: false,
		prev: false,
		next: false,
		last: false,
	};

	for(let i = 0, len = feed.links.length; i < len; i++)
	{
		const link = feed.links[i];
		const rel = getRel(link.rel);

		if(rel == 'next' && isOpdsCatalog(link.type))
		{
			pagination.next = link;
		}
		else if((rel == 'prev' || rel == 'previous') && isOpdsCatalog(link.type))
		{
			pagination.prev = link;
		}
		else if(rel == 'first' && isOpdsCatalog(link.type))
		{
			pagination.first = link;
		}
		else if(rel == 'last' && isOpdsCatalog(link.type))
		{
			pagination.last = link;
		}
	}

	if(pagination.next || pagination.prev || pagination.first || pagination.last)
		feed.pagination = pagination;
	else
		feed.pagination = false;

	return feed;
}

function getSelfLink(links)
{
	for(let i = 0, len = links.length; i < len; i++)
	{
		const link = links[i];
		const rel = getRel(link.rel);

		if(rel == 'self' && isOpdsCatalog(link.type))
			return link;
	}

	return false;
}

function renameSummaryKeyInNavigation(feed)
{
	if(feed.navigation)
	{
		for(let i = 0, len = feed.navigation.length; i < len; i++)
		{
			const navigation = feed.navigation[i];

			const symbols = Object.getOwnPropertySymbols(navigation);
			const symbolData = {};

			symbols.map(function(sym){
				symbolData[sym.description] = navigation[sym];
			});

			if(symbolData.summary)
				navigation.summary = symbolData.summary;
		}
	}

	return feed;
}

function getContentKeyValue(metadata)
{
	const symbols = Object.getOwnPropertySymbols(metadata);
	const symbolData = {};

	symbols.map(function(sym){
		symbolData[sym.description] = metadata[sym];
	});

	if(symbolData.content)
		return symbolData.content.value;

	return '';
}

function convertPublicationsToFile(feed, path, mainPath, currentUrl)
{
	if(feed.groups)
	{
		for(let i = 0, len = feed.groups.length; i < len; i++)
		{
			const group = feed.groups[i];
			const self = getSelfLink(group.links ?? []);

			if(self)
			{
				const _base64 = base64(resolveUrl(currentUrl, self.href));

				group.mainPath = mainPath;
				group.path = serverClient.fixStart(p.join(path, _base64));

				opds.addPathName(_base64, group.metadata.title);
			}

			if(group.publications)
				feed.groups[i] = convertPublicationsToFile(group, path, mainPath, currentUrl);
		}
	}

	if(feed.publications)
	{
		const filePublications = [];

		for(let i = 0, len = feed.publications.length; i < len; i++)
		{
			const publication = feed.publications[i];
			const metadata = publication.metadata;

			let image = false;

			for(let j = 0, len2 = publication.images.length; j < len2; j++)
			{
				const _image = publication.images[j];

				if(image === false || _image.width > image.width)
					image = _image;
			}

			const uuid = crypto.randomUUID();
			const url = 'opds:'+p.sep+'publication:'+uuid;
			const sha = sha1(url);

			const poster = resolveUrl(currentUrl, image.href || '');

			publication.currentUrl = currentUrl;
			publication.mainPath = mainPath;
			publication.metadata.poster = poster;
			publication.acquisitionLinks = findAcquisitionLinks(publication.links, currentUrl, metadata.title);
			publication.price = bestPrince(publication.acquisitionLinks);

			if(!publication.metadata.description)
				publication.metadata.description = getContentKeyValue(publication.metadata);

			opds.addPathName(url, metadata.title);
			opds.addPublication(uuid, publication);

			filePublications.push({
				name: metadata.title,
				subname: publication.price ? publication.price.format : false,
				path: url,
				compressed: true,
				folder: true,
				sha: sha,
				image: poster,
				poster: {
					cache: false,
					path: '',
					sha: sha,
				},
				mainPath: mainPath,
				noHighlight: true,
			});
		}

		feed.filePublications = filePublications;
	}

	return feed;
}

const acquisitionLinksTypes = {
	'http://opds-spec.org/acquisition': 'download',
	'http://opds-spec.org/acquisition/open-access': 'download',
	'http://opds-spec.org/acquisition/buy': 'buy',
	'http://opds-spec.org/acquisition/sample': 'sample',
	'http://opds-spec.org/acquisition/borrow': 'borrow',
	'http://opds-spec.org/acquisition/subscribe': 'subscribe',
	'preview': 'preview',
};

const acquisitionLinksIcons = {
	download: 'download',
	buy: 'shopping_cart',
	sample: 'book_5',
	borrow: 'approval_delegation',
	subscribe: 'credit_card',
	preview: 'visibility',
};

function findAcquisitionLinks(links, currentUrl, publicationTitle)
{
	acquisitionLinks = {};

	for(let i = 0, len = links.length; i < len; i++)
	{
		const link = links[i];
		const rel = getRel(link.rel);
		const mime = link.properties?.indirectAcquisition?.[0]?.type || link.type;

		const type = acquisitionLinksTypes[rel];

		if(type && (mime == 'text/html' || compatible.mime.compressed(mime)))
		{
			const name = language.buttons[type] || type;
			const icon = acquisitionLinksIcons[type];
			const fill = (type == 'download' || type == 'buy'/* || type == 'borrow'*/) ? true : false;

			link.url = resolveUrl(currentUrl, link.href);
			link.html = link.type === 'text/html' ? true : false;
			link.mime = mime;
			link.publicationTitle = publicationTitle;

			if(!acquisitionLinks[type])
				acquisitionLinks[type] = {type: type, name: name, icon: icon, fill: fill, multiples: false, links: []};
			else
				acquisitionLinks[type].multiples = true;

			acquisitionLinks[type].links.push(link);
		}
	}

	return acquisitionLinks;
}

function bestPrince(acquisitionLinks)
{
	let price = false;

	for(let key in acquisitionLinks)
	{
		const acquisition = acquisitionLinks[key];
		let groupPrice = false;

		for(let i = 0, len = acquisition.links.length; i < len; i++)
		{
			const link = acquisition.links[i];
			const _price = link?.properties?.price;

			if(_price)
			{
				if(!price || _price.value < price.value)
					price = _price;

				if(!groupPrice || _price.value < groupPrice.value)
					groupPrice = _price;

				_price.format = new Intl.NumberFormat(config.language, {style: 'currency', currency: _price.currency}).format(_price.value); // navigator.language?
			}
		}

		acquisition.price = groupPrice;
	}

	return price;
}

function parseUrls(feed, path, mainPath, currentUrl)
{
	if(feed.navigation)
	{
		for(let i = 0, len = feed.navigation.length; i < len; i++)
		{
			const navigation = feed.navigation[i];
			const _base64 = base64(resolveUrl(currentUrl, navigation.href));

			navigation.path = serverClient.fixStart(p.join(path, _base64));
			navigation.mainPath = mainPath;
			navigation.differentHost = differentHost(currentUrl, navigation.href) ? navigation.href : false;

			opds.addPathName(_base64, navigation.title);
		}
	}

	if(feed.pagination)
	{
		for(let key in feed.pagination)
		{
			const pagination = feed.pagination[key];

			if(pagination)
			{
				const _base64 = base64(resolveUrl(currentUrl, pagination.href));

				pagination.path = serverClient.fixStart(p.join(p.dirname(path), _base64));
				pagination.mainPath = mainPath;

				opds.addPathName(_base64, opds.pathName(p.basename(path)));
			}
		}
	}

	if(feed.facets)
	{
		for(let i = 0, len = feed.facets.length; i < len; i++)
		{
			const facet = feed.facets[i];

			if(facet)
			{
				for(let j = 0, len2 = facet.links.length; j < len2; j++)
				{
					const link = facet.links[j];
					const rel = getRel(link.rel);
					const _base64 = base64(resolveUrl(currentUrl, link.href));

					link.path = serverClient.fixStart(p.join(p.dirname(path), _base64));
					link.mainPath = mainPath;
					link.active = rel == 'self' ? true : false;

					opds.addPathName(_base64, (link.title || opds.pathName(p.basename(path))));
				}
			}
		}
	}

	return feed;
}

function getRel(rel)
{
	if(typeof rel == 'object')
		return rel?.[0] || '';

	return rel || '';
}

function addOpdsProtocol(path)
{
	return path.replace(/^https?/, 'opds');
}

function differentHost(currentUrl, path)
{
	if(!/^http/.test(path))
		return false;

	return (serverClient.getHost(currentUrl) !== serverClient.getHost(path) ? true : false);
}

function resolveUrl(currentUrl, path)
{
	const fullUrl = new URL(path, currentUrl);
	return serverClient.posixPath(fullUrl.href);
}

function btoa(string)
{
	return window.btoa(string).replace(/\//g, '-');
}

function atob(string)
{
	return window.atob(string.replace(/-/g, '\/'));
}

function base64(url)
{
	const base64 = btoa(url);

	return 'base64,'+base64;
}

function base64ToUrl(path)
{
	const basename = p.basename(path);
	return atob(basename.replace(/^base64\,/, ''));
}

function getPath(item, currentUrl, mainPath)
{
	for(let j = 0, len2 = item.links?.length; j < len2; j++)
	{
		const link = item.links[j];

		if(isOpdsCatalog(link.type))
		{
			const _base64 = base64(resolveUrl(currentUrl, link.href));
			link.path = serverClient.fixStart(p.join(mainPath, _base64));

			opds.addPathName(_base64, (link.title || link.name || item.title || item.name || opds.pathName(p.basename(mainPath))));

			return link.path;
		}
	}

	return false;
}

module.exports = {
	read: read,
	abort: abort,
	resolveUrl: resolveUrl,
	differentHost: differentHost,
	btoa: btoa,
	atob: atob,
	base64: base64,
	base64ToUrl: base64ToUrl,
	getPath: getPath,
};