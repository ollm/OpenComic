
function realPath(path, index = 0)
{
	let segments = path.split(p.sep);

	var virtualPath;

	var newPath = virtualPath = (segments.length > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	let numSegments = segments.length + index;

	for(let i = 1; i < segments.length; i++)
	{
		newPath = p.join(newPath, segments[i]);
		virtualPath = p.join(virtualPath, segments[i]);

		if(i < numSegments)
		{
			var extension = fileExtension(newPath);

			if(extension && inArray(extension, compressedExtensions.all) && fs.existsSync(newPath) && !fs.statSync(newPath).isDirectory())
			{
				var sha = sha1(p.normalize(virtualPath));

				newPath = p.join(tempFolder, sha);
			}
		}
	}

	return newPath;
}

function firstCompressedFile(path, index = 0)
{
	let segments = path.split(p.sep);

	var newPath = (segments.length > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	let numSegments = segments.length + index;

	for(let i = 1; i < segments.length; i++)
	{
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			var extension = fileExtension(newPath);

			if(extension && inArray(extension, compressedExtensions.all) && !fs.statSync(newPath).isDirectory())
			{
				return newPath;
			}
		}
	}

	return newPath;
}

function filtered(path, files)
{
	var filtered = [];

	if(files)
	{
		for(var i = 0; i < files.length; i++)
		{
			var filePath = p.join(path, files[i]);

			if(inArray(mime.getType(filePath), compatibleMime))
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

function readdirWD(path, index = 0)
{
	let segments = path.split(p.sep);

	var newPath = (segments.length > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	let numSegments = segments.length + index;
	let files = null;

	var compressed = false;

	eachPaths:
	for(let i = 1; i < segments.length; i++)
	{
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			var extension = fileExtension(newPath);

			if(extension && inArray(extension, compressedExtensions.all) && (!fs.existsSync(newPath) || !fs.statSync(newPath).isDirectory()))
			{
				compressed = true;

				files = fileCompressed.returnFilesWD(newPath, true);

				if(checkError(files))
					return files;
			}
			else if(files)
			{
				eachFiles:
				for(let i2 in files)
				{
					if(files[i2].name === segments[i])
					{
						files = files[i2].files;
						break eachFiles;
					}
				}
			}
		}
	}

	if(!compressed && fs.existsSync(path))
		files = file.filtered(path, fs.readdirSync(path));
	else if(compressed && typeof files == 'undefined')
		files = [];
	else if(compressed && typeof files.files != 'undefined')
		delete files.files;

	return files;
}

function containsCompressed(path, index = 0)
{
	let segments = path.split(p.sep);

	var virtualPath = (segments.length > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	let numSegments = segments.length + index;

	for(let i = 1; i < segments.length; i++)
	{
		virtualPath = p.join(virtualPath, segments[i]);

		if(i < numSegments)
		{
			var extension = fileExtension(virtualPath);

			if(extension && inArray(extension, compressedExtensions.all) && !fs.statSync(virtualPath).isDirectory())
			{
				return true;
			}
		}
	}

	return false;
}

function pathType(path)
{
	if(inArray(mime.getType(path), compatibleMime))
		return {folder: false, compressed: false};
	else if(fs.statSync(path).isDirectory())
		return {folder: true, compressed: false};
	else if(inArray(fileExtension(path), compressedExtensions.all))
		return {folder: false, compressed: true};
	else
		return false;
}

function returnFirst(path)
{
	var path = file.realPath(path);

	if(fs.existsSync(path))
	{
		var files = fs.readdirSync(path);

		return file.filtered(path, files);
	}
}

function returnFirstWD(path)
{
	return file.readdirWD(path);
}

function returnAll(path, changePath = false)
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

				if(!changePath)
					var retrunPath = filePath;
				else
					var retrunPath = filePath.replace(new RegExp('^'+pregQuote(changePath.from)), changePath.to);

				if(inArray(mime.getType(filePath), compatibleMime))
					returnFiles.push({name: files[i], path: retrunPath, folder: false, compressed: false});
				else if(fs.statSync(filePath).isDirectory())
					returnFiles.push({name: files[i], path: retrunPath, folder: true, compressed: false, files: returnAll(filePath, changePath)});
				else if(inArray(fileExtension(filePath), compressedExtensions.all))
					returnFiles.push({name: files[i], path: retrunPath, folder: false, compressed: true, files: []});

			}
		}
	}

	return returnFiles;
}

function allToFirst(files)
{
	var returnFiles = [];

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
	pathType: pathType,
	readdirWD: readdirWD,
	returnFirstWD: returnFirstWD,
	firstCompressedFile: firstCompressedFile,
	containsCompressed: containsCompressed,
};