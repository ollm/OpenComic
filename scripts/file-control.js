
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
			else if(inArray(fileExtension(filePath), compressedExtensions.all))
				filtered.push({name: files[i], path: filePath, folder: false, compressed: true});
			else if(fs.statSync(filePath).isDirectory())
				filtered.push({name: files[i], path: filePath, folder: true, compressed: false});

		}

		if(filtered.length > 0)
			return filtered;
	}
}

function returnFirst(path)
{
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
				else if(inArray(fileExtension(filePath), compressedExtensions.all))
					filtered.push({name: files[i], path: filePath, folder: false, compressed: true, files: []});
				else if(fs.statSync(filePath).isDirectory())
					returnFiles.push({name: files[i], path: filePath, folder: true, compressed: false, files: returnAll(filePath)});

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
};