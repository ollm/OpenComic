
function realPath(path, index = 0)
{
	segments = path.split(p.sep);

	newPath = (segments.length > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	numSegments = segments.length + index;

	for(let i = 1; i < segments.length; i++)
	{
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			extension = fileExtension(newPath);

			if(extension && inArray(extension, compressedExtensions.all) && !fs.statSync(newPath).isDirectory())
			{
				sha = sha1(p.normalize(newPath));

				newPath = p.join(tempFolder, sha);
			}
		}
	}

	return newPath;
}

function filtered(path, files)
{
	filtered = [];

	if(files)
	{
		for(var i = 0; i < files.length; i++)
		{
			var filePath = p.join(path, files[i]);

			if(inArray(mime.lookup(filePath), compatibleMime))
				filtered.push({name: files[i], path: filePath, folder: false, compressed: false});
			else if(fs.statSync(filePath).isDirectory())
				filtered.push({name: files[i], path: filePath, folder: true, compressed: false});
			else if(inArray(fileExtension(filePath), compressedExtensions.all))
				filtered.push({name: files[i], path: filePath, folder: false, compressed: true});
		}

		if(filtered.length > 0)
			return filtered;
	}
}

function returnFirst(path)
{
	path = file.realPath(path);

	if(fs.existsSync(path))
	{
		var files = fs.readdirSync(path);

		return file.filtered(path, files);
	}
}

function returnAll(path)
{
	let returnFiles = [];

	if(fs.existsSync(path))
	{
		var files = fs.readdirSync(path);

		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				var filePath = p.join(path, files[i]);

				if(inArray(mime.lookup(filePath), compatibleMime))
					returnFiles.push({name: files[i], path: filePath, folder: false, compressed: false});
				else if(fs.statSync(filePath).isDirectory())
					returnFiles.push({name: files[i], path: filePath, folder: true, compressed: false, files: returnAll(filePath)});
				else if(inArray(fileExtension(filePath), compressedExtensions.all))
					filtered.push({name: files[i], path: filePath, folder: false, compressed: true, files: []});

			}
		}
	}

	return returnFiles;
}

function allToFirst(files)
{
	returnFiles = [];

	for(let i in files)
	{
		returnFiles.push({name: files[i].name, path: files[i].path, folder: files[i].folder, compressed: files[i].compressed});
	}

	return returnFiles;
}

function sort(files)
{
	if(files)
	{
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

		files.sort(function (a, b) {
			if(foldersFirst && a.folder && !b.folder) return -1; 
			if(foldersFirst && b.folder && !a.folder) return 1; 
			return (sortInvert) ? -(dom.orderBy(a, b, order, 'name')) : dom.orderBy(a, b, order, 'name');
		});

		return files;
	}
}

module.exports = {
	filtered: filtered,
	returnFirst: returnFirst,
	returnAll: returnAll,
	allToFirst: allToFirst,
	sort: sort,
	realPath: realPath,
};