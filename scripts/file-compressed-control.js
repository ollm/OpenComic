var unzip = false, unrar = false, un7z = false, compressedFiles = {};

function returnFilesWD(path, all, callback = false)
{
	sha = sha1(p.normalize(path));

	cacheFile = 'compressed-files-'+sha+'.json';

	json = cache.readFile(cacheFile);

	if(json)
		json = JSON.parse(json);

	mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);

	if(json)
	{
		if(json.mtime >= mtime)
		{
			compressedFiles[sha] = json.files;

			if(callback)
				callback((all) ? json.files : file.allToFirst(json.files));
			else
				return (all) ? json.files : file.allToFirst(json.files);

			return true;
		}
	}

	if(fs.existsSync(p.join(tempFolder, sha)))
	{
		files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: path});
		compressedFiles[sha] = files;

		if(callback)
			callback((all) ? files : file.allToFirst(files));
		else
			return (all) ? files : file.allToFirst(files);

		return true;
	}

	return {error: NOT_POSSIBLE_WITHOUT_DECOMPRESSING}; //If it is not possible to return the files without decompressing
}

function returnFiles(path, all, fromCache, callback)
{
	let sha = sha1(p.normalize(path));

	cacheFile = 'compressed-files-'+sha+'.json';

	json = cache.readFile(cacheFile);

	if(json)
		json = JSON.parse(json);

	virtualPath = path;
	path = file.realPath(path, -1);

	mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);

	if(fromCache)
	{
		if(json)
		{
			if(json.mtime >= mtime)
			{
				compressedFiles[sha] = json.files;
				callback((all) ? json.files : file.allToFirst(json.files));
				return true;
			}
		}
	}

	if(fs.existsSync(p.join(tempFolder, sha)))
	{
		files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});
		compressedFiles[sha] = files;
		callback((all) ? files : file.allToFirst(files));
		return true;
	}
	else
	{
		if(inArray(fileExtension(path), compressedExtensions.zip))
		{
			if(!unzip) unzip = require('unzip2');

			fs.createReadStream(path).pipe(

				unzip.Extract({path: p.join(tempFolder, sha)}).on('close', function () {

					files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

					if(!json || json.mtime != mtime)
						cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}));

					compressedFiles[sha] = files;

					callback((all) ? files : file.allToFirst(files));

				})
			);
		}
		else if(inArray(fileExtension(path), compressedExtensions.rar))
		{
			if(!unrar) unrar = require('node-unrar');

			console.log('unrar');
			 
			var rar = new unrar(path);
			 			 
			rar.extract(p.join(tempFolder, sha), null, function (err) {

				console.log(err);

				files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

				if(!json || json.mtime != mtime)
					cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}));

				compressedFiles[sha] = files;

				callback((all) ? files : file.allToFirst(files));

			});

		}
		else if(inArray(fileExtension(path), compressedExtensions['7z']))
		{
			if(!un7z) un7z = require('node-7z');

			var myTask = new un7z();
			myTask.extractFull(path, p.join(tempFolder, sha), {p: false/*'myPassword'*/}).progress(function (files){}).then(function () {

				files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

				if(!json || json.mtime != mtime)
					cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}));

				compressedFiles[sha] = files;

				callback((all) ? files : file.allToFirst(files));

			});

		}

		console.log(compressedExtensions['7z']);

		return true;
	}
}

function decompressRecursive(path, callback = false, start = 1, virtualPath = false, newPath = false)
{
	segments = path.split(p.sep);

	callbackDR = callback;

	if(virtualPath === false)
		virtualPath = newPath = (segments.length > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	numSegments = segments.length;

	for(let i = start; i < segments.length; i++)
	{
		virtualPath = p.join(virtualPath, segments[i]);
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			extension = fileExtension(virtualPath);

			if(extension && inArray(extension, compressedExtensions.all) && !fs.statSync(newPath).isDirectory())
			{
				sha = sha1(p.normalize(virtualPath));

				newPath = p.join(tempFolder, sha);

				fileCompressed.returnFiles(virtualPath, false, false, function(files){

					i++;

					fileCompressed.decompressRecursive(path, callbackDR, i, virtualPath, newPath);

				});

				return false;
			}
		}
	}

	if(callbackDR)
		callbackDR(path);
}

module.exports = {
	returnFiles: returnFiles,
	returnFilesWD: returnFilesWD,
	decompressRecursive: decompressRecursive,
};