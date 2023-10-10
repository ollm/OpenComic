var queuedImages = [], processingTheImageQueue = false;

var cacheFolder = p.join(electronRemote.app.getPath('cache'), 'opencomic');

if(process.platform == 'win32' || process.platform == 'win64')
	cacheFolder = cacheFolder.replace(/AppData\\Roaming/, 'AppData\\Local');

if(!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);
cacheFolder = p.join(cacheFolder, 'cache');
if(!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

function processTheImageQueue()
{
	let img = queuedImages[0];
	let sha = img.sha;

	let realPath = fileManager.realPath(img.file);
	let toImage = p.join(cacheFolder, sha+'.jpg');

	image.resize(realPath, toImage, {width: img.size, quality: 95}).then(function(){

		if(typeof data[sha] == 'undefined') data[sha] = {lastAccess: time()};

		data[sha].size = img.size;

		img.callback({cache: true, path: escapeBackSlash(addCacheVars(toImage, img.size, img.sha)), sha: sha}, img.vars);

		queuedImages.splice(0, 1);

		if(queuedImages.length > 0)
		{
			process.nextTick(function() {
				processTheImageQueue();
			});
		}
		else
		{
			processingTheImageQueue = false;

			storage.set('cache', data);
		}

	}).catch(function(){

		img.callback({cache: true, path: escapeBackSlash(realPath), sha: sha}, img.vars);

		queuedImages.splice(0, 1);

		if(queuedImages.length > 0)
		{
			process.nextTick(function() {
				processTheImageQueue();
			});
		}
		else
		{
			processingTheImageQueue = false;

			storage.set('cache', data);
		}

	});
}

function addImageToQueue(file, size, sha, callback, vars)
{
	queuedImages.push({file: file, size: size, sha: sha, callback: callback, vars: vars});

	if(!processingTheImageQueue && !stopTheImageQueue)
	{
		processingTheImageQueue = true;

		setTimeout(function(){

			process.nextTick(function() {
				processTheImageQueue();
			});

		}, 0);
	}
}

var stopTheImageQueue = false;

function stopQueue()
{
	stopTheImageQueue = true;
}

function resumeQueue()
{
	stopTheImageQueue = false;

	if(!processingTheImageQueue && queuedImages.length > 0)
	{
		processingTheImageQueue = true;

		setTimeout(function(){

			process.nextTick(function() {
				processTheImageQueue();
			});

		}, 0);
	}
}


function cleanQueue()
{
	queuedImages.splice(1, queuedImages.length - 1);
}

var data = false;

function returnThumbnailsImages(images, callback, file = false)
{
	if(!data) data = storage.get('cache');

	let single = images.length === undefined ? true : false;
	images = single ? [images] : images;

	let size = Math.round(window.devicePixelRatio * 150);

	let thumbnail = {};
	let thumbnails = {};
	let toGenerateThumbnails = [];
	let toGenerateThumbnailsData = {};

	for(let i = 0, len = images.length; i < len; i++)
	{
		let image = images[i];

		let sha = image.sha || sha1(image.path);
		let imgCache = data[sha];

		let path = addCacheVars(p.join(cacheFolder, sha+'.jpg'), size, sha);

		if(typeof imgCache == 'undefined' || !fs.existsSync(p.join(cacheFolder, sha+'.jpg')))
		{
			toGenerateThumbnails.push(image);
			toGenerateThumbnailsData[image.path] = {sha: sha, vars: image.vars};

			thumbnails[sha] = thumbnail = {cache: false, path: '', sha: sha};
		}
		else
		{
			data[sha].lastAccess = time();

			if(imgCache.size != size)
			{
				toGenerateThumbnails.push(image);
				toGenerateThumbnailsData[image.path] = {sha: sha, vars: image.vars};

				thumbnails[sha] = thumbnail = {cache: true, path: escapeBackSlash(path), sha: sha};
			}
			else
			{
				thumbnails[sha] = thumbnail = {cache: true, path: escapeBackSlash(path), sha: sha};
			}
		}
	}

	if(toGenerateThumbnails.length > 0 && file)
	{
		// Consider adding this to a queue if it causes problems
		file.makeAvailable(toGenerateThumbnails, function(image) {

			let data = toGenerateThumbnailsData[image.path];
			addImageToQueue(image.path, size, data.sha, callback, data.vars || false);

		});
	}

	return single ? thumbnail : thumbnails;
}


function writeFile(name, content)
{
	fs.writeFile(p.join(cacheFolder, name), content, function(){}); 
}

function readFile(name)
{
	if(fs.existsSync(p.join(cacheFolder, name)))
		return fs.readFileSync(p.join(cacheFolder, name), 'utf8');
	else
		return false;
}

function addCacheVars(path, size, sha)
{
	return path+'?size='+size+(cacheImagesDeleted[sha] ? '&a='+cacheImagesDeleted[sha] : '');
}

var cacheImagesDeleted = [];

async function deleteInCache(path)
{
	let sha = sha1(path);
	let cachePath = p.join(cacheFolder, sha+'.jpg');

	if(data[sha])
		delete data[sha];

	if(fs.existsSync(cachePath))
	{
		fs.unlinkSync(cachePath);
	
		let size = Math.round(window.devicePixelRatio * 150);
	}

	cacheImagesDeleted[sha] = cacheImagesDeleted[sha] ? cacheImagesDeleted[sha] + 1 : 1;
		
	return;
}

function deleteInCacheSha(sha, returnFileSize = false)
{
	let cachePath = p.join(cacheFolder, sha+'.jpg');

	if(data[sha])
		delete data[sha];

	let fileSize = 0;

	if(fs.existsSync(cachePath))
	{
		if(returnFileSize)
			fileSize = fs.statSync(cachePath).size;

		fs.unlinkSync(cachePath);
	}

	return fileSize;
}

function purge()
{
	let _time = time();

	let cacheMaxSize = config.cacheMaxSize * 1000 * 1000;
	let cacheMaxOld = config.cacheMaxOld * 60 * 60 * 24;

	let dataArray = [];

	// Remove not usage files
	for(let sha in data)
	{
		if(_time - data[sha].lastAccess > cacheMaxOld)
		{
			deleteInCacheSha(sha);
		}
		else
		{
			dataArray.push({
				sha: sha,
				lastAccess: data[sha].lastAccess,
			});
		}
	}

	// Remove if exede cache max size
	let cacheSize = fileManager.dirSizeSync(cache.folder);

	if(cacheSize > cacheMaxSize)
	{
		let cacheMaxSizeMargin = cacheMaxSize * 0.8; // Remove 20% if cache exceeds maximum size to avoid running this every time

		dataArray.sort(function(a, b) {

			if(a.lastAccess === b.lastAccess)
				return 0;

			return a.lastAccess > b.lastAccess ? 1 : -1;

		});

		for(let i = 0, len = dataArray.length; i < len; i++)
		{
			let size = deleteInCacheSha(dataArray[i].sha, true);

			cacheSize -= size;

			if(cacheSize < cacheMaxSizeMargin)
				break;
		}
	}

	storage.set('cache', data);

	return;
}

module.exports = {
	folder: cacheFolder,
	returnThumbnailsImages: returnThumbnailsImages,
	cleanQueue: cleanQueue,
	writeFile: writeFile,
	readFile: readFile,
	deleteInCache: deleteInCache,
	queuedImages: function(){return queuedImages},
	processingTheImageQueue: function(){return processingTheImageQueue},
	stopQueue: stopQueue,
	resumeQueue: resumeQueue,
	purge: purge,
};
