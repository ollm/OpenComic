let zstd = false;
let zstdEncoder = false;
let zstdDecoder = false;

try
{
	zstd = require('@toondepauw/node-zstd');
	zstdEncoder = new zstd.Encoder(5);
	zstdDecoder = new zstd.Decoder();
}
catch (error)
{
	console.error('Warning: ZSTD cache compression not working');
	console.error(error);

	zstd = zstdEncoder = zstdDecoder = false;
}

var queuedImages = [], processingTheImageQueue = false;

var cacheFolder = p.join(electronRemote.app.getPath('cache'), 'opencomic');

if(process.platform == 'win32' || process.platform == 'win64')
	cacheFolder = cacheFolder.replace(/AppData\\Roaming/, 'AppData\\Local');

if(!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);
cacheFolder = p.join(cacheFolder, 'cache');
if(!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

var imagesWithoutSaving = 0;

function processTheImageQueue()
{
	let img = queuedImages[0];
	let sha = img.sha;

	let realPath = fileManager.realPath(img.file);
	let toImage = p.join(cacheFolder, sha+'.jpg');

	let fit = {
		poster: 'cover',
	};

	let ratios = {
		poster: 1.51369,
	};

	image.resize(realPath, toImage, {width: img.size, height: Math.round(img.size * (img.type ? ratios[img.type] : 1.5)), quality: 95, fit: img.type ? fit[img.type] : 'inside'}).then(function(){

		if(typeof data[sha] == 'undefined') data[sha] = {lastAccess: app.time()};

		data[sha].size = img.size;

		img.callback({cache: true, path: escapeBackSlash(addCacheVars(toImage, img.size, img.sha)), sha: sha}, img.vars);

		queuedImages.splice(0, 1);

		if(queuedImages.length > 0)
		{
			imagesWithoutSaving++;

			process.nextTick(function() {
				processTheImageQueue();
			});

			if(imagesWithoutSaving > 50)
			{
				imagesWithoutSaving = 0;
				storage.setThrottle('cache', data);
			}
		}
		else
		{
			imagesWithoutSaving = 0;
			processingTheImageQueue = false;

			storage.setThrottle('cache', data);
		}

	}).catch(function(){

		img.callback({cache: true, path: escapeBackSlash(realPath), sha: sha}, img.vars);

		queuedImages.splice(0, 1);

		if(queuedImages.length > 0)
		{
			imagesWithoutSaving++;

			process.nextTick(function() {
				processTheImageQueue();
			});

			if(imagesWithoutSaving > 50)
			{
				imagesWithoutSaving = 0;
				storage.setThrottle('cache', data);
			}
		}
		else
		{
			imagesWithoutSaving = 0;
			processingTheImageQueue = false;

			storage.setThrottle('cache', data);
		}

	});
}

function addImageToQueue(file, size, sha, callback, vars, type)
{
	queuedImages.push({file: file, size: size, sha: sha, callback: callback, vars: vars, type: type});

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
	if(data !== false) storage.setThrottle('cache', data);
}

var data = false;

function returnThumbnailsImages(images, callback, file = false)
{
	if(!data) data = storage.get('cache') || {};

	let single = images.length === undefined ? true : false;
	images = single ? [images] : images;

	let size = Math.round(window.devicePixelRatio * 150);

	sizes = {
		poster: Math.round(window.devicePixelRatio * 146),
	};

	let thumbnail = {};
	let thumbnails = {};
	let toGenerateThumbnails = [];
	let toGenerateThumbnailsData = {};

	let time = app.time();

	for(let i = 0, len = images.length; i < len; i++)
	{
		let image = images[i];

		let sha = (image.type) ? sha1(image.path+'?type='+image.type) : (image.sha || sha1(image.path));
		let imgCache = data[sha];

		let _size = image.type ? sizes[image.type] : size;

		let path = addCacheVars(p.join(cacheFolder, sha+'.jpg'), _size, sha);

		if(typeof imgCache == 'undefined' || !fs.existsSync(p.join(cacheFolder, sha+'.jpg')))
		{
			toGenerateThumbnails.push(image);
			toGenerateThumbnailsData[image.path] = {sha: sha, vars: image.vars, type: image.type || false};

			thumbnails[sha] = thumbnail = {cache: false, path: '', sha: sha};
		}
		else
		{
			data[sha].lastAccess = time;

			if(imgCache.size != _size)
			{
				toGenerateThumbnails.push(image);
				toGenerateThumbnailsData[image.path] = {sha: sha, vars: image.vars, type: image.type || false};

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
			let _size = data.type ? sizes[data.type] : size;
			addImageToQueue(image.path, _size, data.sha, callback, data.vars || false, data.type);

		}, false, true);
	}

	return single ? thumbnail : thumbnails;
}

async function writeFile(name, content)
{
	fs.writeFile(p.join(cacheFolder, name), content, function(){}); 
}

function writeFileSync(name, content)
{
	fs.writeFileSync(p.join(cacheFolder, name), content, function(){}); 
}

var jsonMemory = {};

function setJsonInMemory(name, json)
{
	if(jsonMemory[name])
		clearTimeout(jsonMemory[name].timeout);

	jsonMemory[name] = {
		timeout: setTimeout(function(){
			delete jsonMemory[name];
		}, 1000 * 60 * 60),
		json: json,
		lastUsage: app.time(),
	};

	if(app.rand(0, 20))
	{
		let num = 0;
		let data = [];

		for(let key in jsonMemory)
		{
			num++;

			data.push({
				name: key,
				lastUsage: jsonMemory[key].lastUsage,
			});
		}

		let max = 500;

		if(num > max)
		{
			data.sort(function(a, b) {

				if(a.lastUsage === b.lastUsage)
					return 0;

				return a.lastUsage > b.lastUsage ? 1 : -1;

			});

			for(let i = 0, len = data.length - max; i < len; i++)
			{
				delete jsonMemory[data[i].name];
			}
		}
	}
}

function readJsonInMemory(name)
{
	if(jsonMemory[name])
	{
		clearTimeout(jsonMemory[name].timeout);

		jsonMemory[name].timeout = setTimeout(function(){
			delete jsonMemory[name];
		}, 1000 * 60 * 60);

		jsonMemory[name].lastUsage = app.time();

		return app.copy(jsonMemory[name].json);
	}

	return false;
}

function flushJsonMemory()
{
	jsonMemory = {};
}

async function writeJson(name, json)
{
	setJsonInMemory(name, json);

	let encoded, path;

	if(zstd !== false)
	{
		path = p.join(cacheFolder, name+'.zstd');
		encoded = await zstdEncoder.encode(Buffer.from(JSON.stringify(json)));
	}
	else
	{
		path = p.join(cacheFolder, name);
		encoded = JSON.stringify(json);
	}

	fs.writeFile(path, encoded, function(){});
}

function writeJsonSync(name, json)
{
	setJsonInMemory(name, json);

	let encoded, path;

	if(zstd !== false)
	{
		path = p.join(cacheFolder, name+'.zstd');
		encoded = zstdEncoder.encodeSync(Buffer.from(JSON.stringify(json)));
	}
	else
	{
		path = p.join(cacheFolder, name);
		encoded = JSON.stringify(json);
	}

	fs.writeFileSync(path, encoded, function(){});
}

function readFile(name)
{
	let path = p.join(cacheFolder, name);

	if(fs.existsSync(path))
		return fs.readFileSync(path, 'utf8');
	else
		return false;
}

function readJson(name)
{
	let json = readJsonInMemory(name);
	if(json) return json;

	if(zstd !== false)
	{
		const path = p.join(cacheFolder, name+'.zstd');

		if(fs.existsSync(path))
		{
			json = JSON.parse(zstdDecoder.decodeSync(fs.readFileSync(path)));
			setJsonInMemory(name, json);
			return json;
		}
		else
		{
			return false;
		}
	}
	else
	{
		const path = p.join(cacheFolder, name);

		if(fs.existsSync(path))
		{
			json = JSON.parse(fs.readFileSync(path));
			setJsonInMemory(name, json);
			return json;
		}
		else
		{
			return false;
		}
	}
}

function validateJson(name)
{
	if(zstd !== false)
	{
		const path = p.join(cacheFolder, name+'.zstd');

		if(fs.existsSync(path))
		{
			let json;

			try
			{
				json = fs.readFileSync(path);
			}
			catch
			{
				return 'readError';
			}

			try
			{
				json = zstdDecoder.decodeSync(json);
			}
			catch
			{
				return 'corruptedZstd';
			}

			try
			{
				JSON.parse(json);
			}
			catch
			{
				return 'corruptedJson';
			}

			return 'correct';
		}
		else
		{
			return 'notInCache';
		}
	}
	else
	{
		const path = p.join(cacheFolder, name);

		if(fs.existsSync(path))
		{
			let json;

			try
			{
				json = fs.readFileSync(path);
			}
			catch
			{
				return 'readError';
			}

			try
			{
				JSON.parse(json);
			}
			catch
			{
				return 'corruptedJson';
			}

			return 'correct';
		}
		else
		{
			return 'notInCache';
		}
	}
}

function existsFile(name)
{
	let path = p.join(cacheFolder, name);

	if(fs.existsSync(path))
		return true;
	else
		return false;
}

function existsJson(name)
{
	let path = p.join(cacheFolder, (zstd !== false) ? name+'.zstd' : name);

	if(fs.existsSync(path))
		return true;
	else
		return false;
}

function addCacheVars(path, size, sha)
{
	return path+'?size='+size+(cacheImagesDeleted[sha] ? '&a='+cacheImagesDeleted[sha] : '');
}

var cacheImagesDeleted = [];

async function deleteInCache(path, type = false)
{
	let sha = (type) ? sha1(path+'?type='+type) : sha1(path);
	let cachePath = p.join(cacheFolder, sha+'.jpg');

	if(data[sha])
		delete data[sha];

	if(fs.existsSync(cachePath))
	{
		fs.unlinkSync(cachePath);
	
		let size = Math.round(window.devicePixelRatio * 150);
	}

	cacheImagesDeleted[sha] = cacheImagesDeleted[sha] ? cacheImagesDeleted[sha] + 1 : 1;

	if(!type)
	{
		await deleteInCache(path, 'poster');
	}
		
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
	if(!data) data = storage.get('cache') || {};

	let time = app.time();

	let cacheMaxSize = config.cacheMaxSize * 1000 * 1000;
	let cacheMaxOld = config.cacheMaxOld * 60 * 60 * 24;

	let dataArray = [];

	// Remove not usage files
	for(let sha in data)
	{
		if(time - data[sha].lastAccess > cacheMaxOld)
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

	// Remove unreferenced files
	let files = fs.readdirSync(cache.folder);

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];

		let sha = extract(/^([a-z0-9]+)\.jpg/iu, file, 1);

		if(sha && !data[sha])
			deleteInCacheSha(sha);
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

function _validate(files, type = '')
{
	const correct = [];
	const corruptedZstd = [];
	const corruptedJson = [];
	const readError = [];
	const notInCache = [];

	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];
		const path = (type == 'servers' ? serverClient.fixPath(file.path) : file.path);
		const sha = sha1(path);
		const name = (type == 'servers' ? 'server-files-'+sha+'.json' : 'compressed-files-'+sha+'.json');

		const status = validateJson(name);

		if(status == 'correct')
			correct.push(path);
		else if(status == 'corruptedZstd')
			corruptedZstd.push(path);
		else if(status == 'corruptedJson')
			corruptedJson.push(path);
		else if(status == 'readError')
			readError.push(path);
		else if(status == 'notInCache')
			notInCache.push(path);
	}

	console.log('Correct: '+correct.length+'\nCorrupted Zstd: '+corruptedZstd.length+'\nCorrupted Json: '+corruptedJson.length+'\nRead Error: '+readError.length+'\nNot in Cache: '+notInCache.length);
	console.log({
		correct: correct,
		corruptedZstd: corruptedZstd,
		corruptedJson: corruptedJson,
		readError: readError,
		notInCache: notInCache,
	});
	console.log(' ');
}

function validateThumbnails(images, type = '')
{
	const correct = [];
	const errorOnlyFile = [];
	const errorOnlyData = [];
	const notThumbnails = [];

	const size = Math.round(window.devicePixelRatio * 150);

	for(let i = 0, len = images.length; i < len; i++)
	{
		const image = images[i];
		const sha = image.sha || sha1(image.path);
		const imgCache = data[sha];

		const exists = fs.existsSync(p.join(cacheFolder, sha+'.jpg'));

		if(typeof imgCache != 'undefined' && exists)
			correct.push(image.path);
		else if(typeof imgCache != 'undefined')
			errorOnlyData.push(image.path);
		else if(exists)
			errorOnlyFile.push(image.path);
		else
			notThumbnails.push(image.path);
	}

	console.log('Correct: '+correct.length+'\nError only file: '+errorOnlyFile.length+'\nError only data: '+errorOnlyData.length+'\nNot Thumbnails: '+notThumbnails.length);
	console.log({
		correct: correct,
		errorOnlyFile: errorOnlyFile,
		errorOnlyData: errorOnlyData,
		notThumbnails: notThumbnails,
	});
	console.log(' ');
}

function validate()
{
	const currentFiles = handlebarsContext.comics;

	const folders = [];
	const compressed = [];
	const servers = [];
	const images = [];

	for(let i = 0, len = currentFiles.length; i < len; i++)
	{
		const file = currentFiles[i];

		if(fileManager.isServer(file.path) && file.folder && !file.compressed)
			servers.push(file);
		else if(file.compressed)
			compressed.push(file);
		else if(file.folder)
			folders.push(file);
		else
			images.push(file);
	}

	console.log(' ');
	console.log('Folders: '+folders.length+'\nCompressed files: '+compressed.length+'\nServers: '+servers.length+'\nImages: '+images.length);
	console.log(' ');

	if(compressed.length)
	{
		console.log('Validating cache of compressed files...');
		_validate(compressed, 'compressed');
	}

	if(servers.length)
	{
		console.log('Validating cache of servers...');
		_validate(servers, 'servers');
	}

	if(images.length)
	{
		console.log('Validating cache of thumbnail images...');
		validateThumbnails(images, 'servers');
	}

	console.log('Done');
}

module.exports = {
	folder: cacheFolder,
	returnThumbnailsImages: returnThumbnailsImages,
	cleanQueue: cleanQueue,
	writeFile: writeFile,
	writeFileSync: writeFileSync,
	writeJson: writeJson,
	writeJsonSync: writeJsonSync,
	readFile: readFile,
	readJson: readJson,
	existsJson: existsJson,
	existsFile: existsFile,
	deleteInCache: deleteInCache,
	flushJsonMemory: flushJsonMemory,
	jsonMemory: function(){return jsonMemory},
	queuedImages: function(){return queuedImages},
	processingTheImageQueue: function(){return processingTheImageQueue},
	stopQueue: stopQueue,
	resumeQueue: resumeQueue,
	purge: purge,
	validate: validate,
	zstd: zstd,
};
