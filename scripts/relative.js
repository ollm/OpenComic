var isFolderPortable = folderPortable.check();
var base = false;

function getBase()
{
	if(base)
		return;

	base = {
		path: storagePath,
		disk: (process.platform === 'win32') ? p.parse(storagePath).root[0] : '',
	};

	return base;
}

const cacheResolve = new Map();

function resolve(relatives)
{
	if(!relatives.includes('|||||'))
		return relatives;

	if(cacheResolve.has(relatives))
		return cacheResolve.get(relatives);

	const paths = relatives.split('|||||');

	let path = '';
	let exists = false;

	for(let i = 0, len = paths.length; i < len; i++)
	{
		path = p.resolve(base.path, paths[i]);

		if(fs.existsSync(path))
		{
			exists = true;
			break;
		}
	}

	// Check if file exists in the same disk as OpenComic
	if(!exists && base.disk)
	{
		const sameDisk = path.replace(/^([A-Za-z]):/, base.disk+':');

		if(sameDisk !== path && fs.existsSync(path))
		{
			exists = true;
			path = sameDisk;
		}
	}

	if(exists)
		cacheRelative.set(path, relatives);

	cacheResolve.set(relatives, path);

	return path;
}

const cacheRelative = new Map();

function _path(path)
{
	if(!isFolderPortable)
		return path;

	if(cacheRelative.has(path))
		return cacheRelative.get(path);

	getBase();

	const relative = p.relative(base.path, path);
	const relatives = (relative !== path ? relative+'|||||' : '')+path;

	cacheRelative.set(path, relatives);
	return relatives;
}

const cacheResolved = new Map();

function get(key)
{
	const resolved = cacheResolved.get(key);

	if(resolved && resolved.lastUpdate === storage.lastUpdate(key))
		return resolved.data;

	const data = storage.get(key);
	let resolvedData = data;

	switch (key)
	{
		case 'masterFolders':

			resolvedData = data.map(function(path) {

				return resolve(path);

			});

			break;

		case 'comics':

			resolvedData = data.map(function(data) {

				return {
					...data,
					path: resolve(data.path),
				};

			});

			break;

		case 'favorites':
		case 'comicLabels':
		case 'bookmarks':

			resolvedData = {};

			for(let path in data)
			{
				resolvedData[resolve(path)] = data[path];
			}

			break;

		case 'readingProgress':

			resolvedData = {};

			for(let path in data)
			{
				resolvedData[resolve(path)] = {
					...data[path],
					path: resolve(data[path].path),
				};
			}

			break;
	}

	cacheResolved.set(key, {
		lastUpdate: storage.lastUpdate(key),
		data: resolvedData,
	});

	return resolvedData;
}

module.exports = {
	resolve,
	path: _path,
	get,
	get cacheResolve(){return cacheResolve},
	get cacheRelative(){return cacheRelative}
};