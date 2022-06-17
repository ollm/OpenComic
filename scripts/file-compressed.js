const fs = require('fs'),
	p = require('path');

var unzip = false, unrar = false, un7z = false, bin7z = false, untar = false, unpdf = false, compressedFiles = {};

var fileDocumentsToRender = {};

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

function setProgress(progress, contentRightZindex)
{
	$('.content-right .content-right-'+contentRightZindex+' .loading.loading96 svg').css({
		'animation': 'none',
		'transform': 'rotate(-90deg)',
	});

	$('.content-right .content-right-'+contentRightZindex+' .loading.loading96 circle').css({
		'animation': 'none',
		'stroke-dashoffset': 225,
		'stroke-dasharray': 226 + ((422 - 226) * progress),
	});
}

function extractZip(path, virtualPath, sha, all, json, callback)
{
	let cacheFile = 'compressed-files-'+sha+'.json';
	let mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);
	let shaExt = 'extracting-'+sha;
	let contentRightZindex = template.contentRightZindex();

	if(unzip === false) unzip = require('unzipper');

	try
	{
		fs.createReadStream(path).pipe(

			unzip.Extract({path: p.join(tempFolder, shaExt)}).on('close', function () {

				if(fs.existsSync(p.join(tempFolder, shaExt))) fs.renameSync(p.join(tempFolder, shaExt), p.join(tempFolder, sha));

				var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

				if(!json || json.mtime != mtime)
					cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

				compressedFiles[sha] = files;

				callback((all) ? files : file.allToFirst(files));

			}).on('error', function(error){

				if(/0xafbc7a37/.test(error.message)) // 7zip file
					fileCompressed.extract7zip(path, virtualPath, sha, all, json, callback);
				else
					callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
				
			})
		);
	}
	catch(error)
	{
		console.error(error);
		callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
	}
}

function extract7zip(path, virtualPath, sha, all, json, callback)
{
	let cacheFile = 'compressed-files-'+sha+'.json';
	let mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);
	let shaExt = 'extracting-'+sha;
	let contentRightZindex = template.contentRightZindex();

	if(un7z === false) un7z = require('node-7z');
	if(bin7z === false) bin7z = asarToAsarUnpacked(require('7zip-bin').path7za);

	un7z.extractFull(path, p.join(tempFolder, shaExt), {$progress: true, p: false/*'myPassword'*/, $bin: bin7z}).on('progress', function(progress) {

		setProgress(progress.percent / 100, contentRightZindex);

	}).on('end', function (data) {

		try
		{
			if(fs.existsSync(p.join(tempFolder, shaExt))) fs.renameSync(p.join(tempFolder, shaExt), p.join(tempFolder, sha));

				var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

			if(!json || json.mtime != mtime)
				cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

			compressedFiles[sha] = files;

			callback((all) ? files : file.allToFirst(files));
		}
		catch(error)
		{
			console.error(error);
			callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
		}

	}).on('error', function(error){

		callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.stderr});

	});
}

function extractRar(path, virtualPath, sha, all, json, callback)
{
	let cacheFile = 'compressed-files-'+sha+'.json';
	let mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);
	let shaExt = 'extracting-'+sha;
	let contentRightZindex = template.contentRightZindex();

	if(unrar === false) unrar = require('unrar');

	var bin = false;

	if(process.platform == 'win32' || process.platform == 'win64')
		bin = asarToAsarUnpacked(p.join(appDir, 'unrar/UnRAR.exe'));
	else if(process.platform == 'darwin')
		bin = asarToAsarUnpacked(p.join(appDir, 'unrar/unrar_MacOSX_10.13.2_64bit'));

	var archive = new unrar({
		path: path,
		bin: bin,
	});
	
	archive.list(function (error, entries) {

		try
		{
			if(!error)
			{
				if(!fs.existsSync(p.join(tempFolder, shaExt))) fs.mkdirSync(p.join(tempFolder, shaExt));

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
					if(!fs.existsSync(p.join(tempFolder, shaExt, dirs[i].name))) fs.mkdirSync(p.join(tempFolder, shaExt, dirs[i].name));
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
						stream.pipe(require('fs').createWriteStream(p.join(tempFolder, shaExt, entries[i].name)));

					}));
				}

				Promise.all(tasks).then(function(){

					if(process.platform == 'win32' || process.platform == 'win64') // Fix Windows bug: EPERM: operation not permitted, rename
					{
						for(let i = 0; i < 100; i++)
						{
							if(fs.existsSync(p.join(tempFolder, shaExt)))
							{
								try
								{
									fs.renameSync(p.join(tempFolder, shaExt), p.join(tempFolder, sha));
								}
								catch
								{

								}
							}
							else
							{
								break;
							}
						}
					}

					if(fs.existsSync(p.join(tempFolder, shaExt))) fs.renameSync(p.join(tempFolder, shaExt), p.join(tempFolder, sha));

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
		}
		catch(error)
		{
			console.error(error);
			callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
		}

	});
}

function extractTar(path, virtualPath, sha, all, json, callback)
{
	let cacheFile = 'compressed-files-'+sha+'.json';
	let mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);
	let shaExt = 'extracting-'+sha;
	let contentRightZindex = template.contentRightZindex();

	if(untar === false) untar = require('tar-fs');

	var untarP = fs.createReadStream(path).pipe(untar.extract(p.join(tempFolder, shaExt))).on('finish', function () {

		try
		{
			if(fs.existsSync(p.join(tempFolder, shaExt))) fs.renameSync(p.join(tempFolder, shaExt), p.join(tempFolder, sha));

			var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

			if(!json || json.mtime != mtime)
				cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

			compressedFiles[sha] = files;

			callback((all) ? files : file.allToFirst(files));
		}
		catch(error)
		{
			console.error(error);
			callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
		}

	}).on('error', function(error){

		callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});

		untarP.destroy();

	});
}

function extractPdf(path, virtualPath, sha, all, json, callback)
{
	let cacheFile = 'compressed-files-'+sha+'.json';
	let mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);
	let shaExt = 'extracting-'+sha;
	let contentRightZindex = template.contentRightZindex();

	if(unpdf === false)
	{
		unpdf = require('pdfjs-dist/build/pdf');
		unpdf.GlobalWorkerOptions.workerSrc = p.join(appDir, 'node_modules/pdfjs-dist/build/pdf.worker.js');
	}

	(async function() {

		try
		{
			console.time('pdf render');

			let pdf = await unpdf.getDocument({url: path, nativeImageDecoderSupport: 'none', disableFontFace: true}).promise;

			fileDocumentsToRender[path] = pdf;

			let pages = pdf.numPages;

			if(!fs.existsSync(p.join(tempFolder, shaExt))) fs.mkdirSync(p.join(tempFolder, shaExt));

			for (let i = 1; i <= pages; i++)
			{
				setProgress((i - 1) / pages, contentRightZindex);

				// Render page
				let page = await pdf.getPage(i);
				let viewport = page.getViewport({scale: 1}); // window.devicePixelRatio;

				//let scale = 300 / viewport.width;
				//viewport = page.getViewport({scale: scale});
				let scale = template.contentRight().children().width() / viewport.width;
				viewport = page.getViewport({scale: scale});

				let canvas = document.createElement('canvas');
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				let context = canvas.getContext('2d');

				await page.render({canvasContext: context, viewport: viewport}).promise;

				let imageData = canvas.toDataURL('image/jpeg', 1);

				fs.writeFileSync(p.join(tempFolder, shaExt, 'page-'+i+'.jpg'), Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64'));
			}

			setProgress(1, contentRightZindex);

			console.timeEnd('pdf render');

			if(fs.existsSync(p.join(tempFolder, shaExt))) fs.renameSync(p.join(tempFolder, shaExt), p.join(tempFolder, sha));

				var files = file.returnAll(p.join(tempFolder, sha), {from: p.join(tempFolder, sha), to: virtualPath});

			if(!json || json.mtime != mtime)
				cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}), {}, function(){});

			compressedFiles[sha] = files;

			callback((all) ? files : file.allToFirst(files));
		}
		catch(error)
		{
			console.error(error);
			callback({error: ERROR_UNZIPPING_THE_FILE, detail: error.message});
		}

	})();
}

function returnFiles(path, all, fromCache, callback)
{
	let sha = sha1(p.normalize(path));

	let cacheFile = 'compressed-files-'+sha+'.json';

	let json = cache.readFile(cacheFile);

	if(json)
		json = JSON.parse(json);

	let virtualPath = path;
	path = file.realPath(path, -1);

	let mtime = Date.parse(fs.statSync(file.firstCompressedFile(path)).mtime);

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
			fileCompressed.extractZip(path, virtualPath, sha, all, json, callback);
		}
		else if(inArray(fileExtension(path), compressedExtensions['7z']))
		{
			fileCompressed.extract7zip(path, virtualPath, sha, all, json, callback);
		}
		else if(inArray(fileExtension(path), compressedExtensions.rar))
		{
			fileCompressed.extractRar(path, virtualPath, sha, all, json, callback);
		}
		else if(inArray(fileExtension(path), compressedExtensions.tar))
		{
			fileCompressed.extractTar(path, virtualPath, sha, all, json, callback);
		}
		else if(inArray(fileExtension(path), compressedExtensions.pdf))
		{
			fileCompressed.extractPdf(path, virtualPath, sha, all, json, callback);
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

	extractZip: extractZip,
	extract7zip: extract7zip,
	extractRar: extractRar,
	extractTar: extractTar,
	extractPdf: extractPdf,
	fileDocumentsToRender: function(){return fileDocumentsToRender},
};
