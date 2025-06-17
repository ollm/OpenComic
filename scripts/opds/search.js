
var searchMap = false;
var urls = {};

function show()
{
	const search = opds.getSearch();

	if(search)
	{
		dom.search.showHide(true);

		urls = {
			path: dom.history.path,
			mainPath: dom.history.mainPath,
		};

		searchMap = findSearch(search);
	}
}

var searchCache = {};

async function findSearch(search)
{
	if(searchCache[search.href])
		return searchCache[search.href];

	if(/\{[^{}]*(?:query|searchTerms)[^{}]*\}/.test(search.href))
		return searchCache[search.href] = foliateJs.opds.getSearch(search);
	
	const _search = await opds.opds.read(search.href, '', '', true);
	return searchCache[search.href] = _search;
}

async function request(text)
{
	const link = opds.getSearch();
	const search = await searchMap;

	const map = new Map();

	for(let i = 0, len = search.params.length; i < len; i++)
	{
		const param = search.params[i];

		if(param.name === 'query' || param.name === 'searchTerms')
			map.set(param.ns || null, new Map([[param.name, text]]));
	}

	const url = search.search(map);
	const _base64 = opds.opds.base64(opds.opds.resolveUrl(link.currentUrl, url));
	opds.addPathName(_base64, link.title || search.metadata.title || language.global.search);

	dom.loadIndexPage(true, p.join(urls.path, _base64), false, false, urls.mainPath);
}

module.exports = {
	show: show,
	request: request,
	searchMap: function(){return searchMap},
};