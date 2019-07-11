const fs = require('fs'),
	p = require('path');

var unzip = false, unrar = false, un7z = false, bin7z = false, untar = false, compressedFiles = {};

function returnFilesWD(path, all, callback = false)
{
	var sha = sha1(p.normalize(path));

	var cacheFile = 'compressed-files-'+sha+'.json';

	var json = cache.readFile(cacheFile);

	if(json)
		json = JSON.parse(json);

	var mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);

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
		var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: path});
		compressedFiles[sha] = files;

		if(callback)
			callback((all) ? files : file.allToFirst(files));
		else
			return (all) ? files : file.allToFirst(files);

		return true;
	}

	return {error: NOT_POSSIBLE_WITHOUT_DECOMPRESSING, compressedPath: path}; //If it is not possible to return the files without decompressing
}

var queuedCompressedFiles = {}, processingCompressedFilesQueue = false;

function addCompressedFilesQueue(path, all, callback = false, processQueue = true)
{
	var sha = sha1(p.normalize(path));

	if(typeof queuedCompressedFiles[sha] !== 'undefined')
		queuedCompressedFiles[sha].callback.push(callback);
	else
		queuedCompressedFiles[sha] = {path: path, all: all, callback: [callback]};

	if(!processingCompressedFilesQueue && processQueue)
	{
		setTimeout(function(){

			process.nextTick(function() {
				processCompressedFilesQueue();
			});

		}, 0);
	}
}

function processCompressedFilesQueue(force = false)
{

	if((!processingCompressedFilesQueue || force) && !$.isEmptyObject(queuedCompressedFiles))
	{
		var processingCompressedFilesQueue = true;

		var key = Object.keys(queuedCompressedFiles)[0];

		returnFiles(queuedCompressedFiles[key].path, queuedCompressedFiles[key].all, false, function(files){

			var key = Object.keys(queuedCompressedFiles)[0];

			if(key)
			{
				for(let i in queuedCompressedFiles[key].callback)
				{
					if(queuedCompressedFiles[key].callback[i])
						queuedCompressedFiles[key].callback[i](files);
				}

				delete queuedCompressedFiles[key];

				if(!$.isEmptyObject(queuedCompressedFiles))
				{
					process.nextTick(function() {
						processCompressedFilesQueue(true);
					});
				}
				else
				{
					processingCompressedFilesQueue = false;
				}
			}

		});
	}
}

function returnFiles(path, all, fromCache, callback)
{
	let sha = sha1(p.normalize(path));

	var cacheFile = 'compressed-files-'+sha+'.json';

	var json = cache.readFile(cacheFile);

	if(json)
		json = JSON.parse(json);

	let virtualPath = path;
	path = file.realPath(path, -1);

	var mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);

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
		var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});
		compressedFiles[sha] = files;
		callback((all) ? files : file.allToFirst(files));
		return true;
	}
	else
	{
		if(inArray(fileExtension(path), compressedExtensions.zip))
		{
			if(unzip === false) unzip = require('unzipper');

			fs.createReadStream(path).pipe(

				unzip.Extract({path: p.join(tempFolder, sha)}).on('close', function () {

					var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

					if(!json || json.mtime != mtime)
						cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

					compressedFiles[sha] = files;

					callback((all) ? files : file.allToFirst(files));

				}).on('error', function(error){

					callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
					
				})
			);
		}
		else if(inArray(fileExtension(path), compressedExtensions.rar))
		{
			if(unrar === false) unrar = require('unrar');

			var archive = new unrar({
				path: path,
				$bin: (process.platform == 'win32' || process.platform == 'win64') ? p.join(appDir, 'unrar/UnRAR.exe') : false,
			});
			
			archive.list(function (error, entries) {

				if(!error)
				{
					if(!fs.existsSync(p.join(tempFolder, sha))) fs.mkdirSync(p.join(tempFolder, sha));

					var dirs = [];

					for(let i = 0, len = entries.length; i < len; i++)
					{
						if(entries[i].type !== 'File')
							dirs.push({name: entries[i].name, dimensions: entries[i].name.split(p.sep).length})
					}

					dirs.sort(function (a, b) {

						if(a.dimensions == b.dimensions)
							return 0;
						
						return (a.dimensions > b.dimensions) ? 1 : -1;

					});

					for(let i = 0, len = dirs.length; i < len; i++)
					{
						fs.mkdirSync(p.join(tempFolder, sha, dirs[i].name));
					}

					var tasks = [];

					for(let i = 0, len = entries.length; i < len; i++)
					{
						if(entries[i].type !== 'File')
							continue;

						tasks.push(new Promise(function(resolve, reject) {

							var stream = archive.stream(entries[i].name);
							stream.on('error', console.error);
							stream.on('end', resolve);
							stream.pipe(require('fs').createWriteStream(p.join(tempFolder, sha, entries[i].name)));

						}));
					}

					Promise.all(tasks).then(function(){

						// Get files
						var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

						if(!json || json.mtime != mtime)
							cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

						compressedFiles[sha] = files;
						
						callback((all) ? files : file.allToFirst(files));

					});
				}
				else
				{
					callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
				}

			});

		}
		else if(inArray(fileExtension(path), compressedExtensions['7z']))
		{
			if(un7z === false) un7z = require('node-7z');
			
			if(bin7z === false)
			{
				bin7z = require('7zip-bin').path7za;

				if(!/app\.asar\.unpacked/.test(bin7z))
				{
					var bin7zUnpacked = bin7z.replace(/app\.asar/, 'app.asar.unpacked');

					if(fs.existsSync(bin7zUnpacked)) bin7z = bin7zUnpacked;
				}
			}

			un7z.extractFull(path, p.join(tempFolder, sha), {p: false/*'myPassword'*/, $bin: bin7z}).on('data', function (data) {

				if(data.status == 'extracted')
				{
	 				var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

					if(!json || json.mtime != mtime)
						cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

					compressedFiles[sha] = files;

					callback((all) ? files : file.allToFirst(files));
				}
				else
				{
					console.log(data);

					callback({error: ERROR_UNZIPPING_THE_FILE, detail: data.status});
				}

			}).on('error', function(error){

				callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.stderr});

			});

		}
		else if(inArray(fileExtension(path), compressedExtensions.tar))
		{
			if(untar === false) untar = require('tar-fs');

			var untarP = fs.createReadStream(path).pipe(untar.extract(p.join(tempFolder, sha))).on('finish', function () {

				var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

				if(!json || json.mtime != mtime)
					cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

				compressedFiles[sha] = files;

				callback((all) ? files : file.allToFirst(files));

			}).on('error', function(error){

				callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});

				untarP.destroy();

			});
		}

		return true;
	}
}

function decompressRecursive(path, callback = false, start = 1, virtualPath = false, newPath = false)
{
	let segments = path.split(p.sep);

	var callbackDR = callback;

	if(virtualPath === false)
		virtualPath = newPath = (segments.length > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	let numSegments = segments.length;

	for(let i = start; i < segments.length; i++)
	{
		virtualPath = p.join(virtualPath, segments[i]);
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			extension = fileExtension(virtualPath);

			if(extension && inArray(extension, compressedExtensions.all) && !fs.statSync(newPath).isDirectory())
			{
				var sha = sha1(p.normalize(virtualPath));

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
	addCompressedFilesQueue: addCompressedFilesQueue,
	decompressRecursive: decompressRecursive,
};