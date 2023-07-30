var queuedImages = [], processingTheImageQueue = false, imageLibrary = false, imageUse = 'im', sharp = false, jimp = false;

var cacheFolder = p.join(electronRemote.app.getPath('cache'), 'opencomic');

if(!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);
cacheFolder = p.join(cacheFolder, 'cache');
if(!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

function processTheImageQueue()
{
	if(sharp === false) sharp = require('sharp');

	var img = queuedImages[0];
	var sha = img.sha;

	var realPath = fileManager.realPath(img.file);

	sharp(realPath).jpeg({quality: 95}).resize({width: img.size, background: 'white'}).toFile(p.join(cacheFolder, sha+'.jpg'), function(error) {
	
		if(error)
		{

			if(!imageLibrary) imageLibrary = require('gm').subClass({imageMagick: true});

			imageLibrary(realPath).resize(img.size, null).quality(95).noProfile().write(p.join(cacheFolder, sha+'.jpg'), function(error){

				if(error)
				{
					if(imageUse !== 'gm')
					{
						imageLibrary = require('gm').subClass({imageMagick: false});
						imageUse = 'gm';

						process.nextTick(function() {
							processTheImageQueue();
						});
					}
					else
					{
						imageLibrary = require('gm').subClass({imageMagick: true});
						imageUse = 'im';

						if(jimp === false) jimp = require('jimp');

						jimp.read(realPath, function(error, lenna) {

							if(error)
							{
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
							}
							else
							{
								lenna.resize(img.size, jimp.AUTO).quality(95).background(0xFFFFFFFF).write(p.join(cacheFolder, sha+'.jpg'), function(){

									if(typeof data[sha] == 'undefined') data[sha] = {lastAccess: time()};

									data[sha].size = img.size;

									img.callback({cache: true, path: escapeBackSlash(p.join(cacheFolder, sha+'.jpg?size='+img.size)), sha: sha}, img.vars);

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

						});

					}

				}
				else
				{
					if(typeof data[sha] == 'undefined') data[sha] = {lastAccess: time()};

					data[sha].size = img.size;

					img.callback({cache: true, path: escapeBackSlash(p.join(cacheFolder, sha+'.jpg?size='+img.size)), sha: sha}, img.vars);

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
				}
			});
		}
		else
		{
			if(typeof data[sha] == 'undefined') data[sha] = {lastAccess: time()};

			data[sha].size = img.size;

			img.callback({cache: true, path: escapeBackSlash(p.join(cacheFolder, sha+'.jpg?size='+img.size)), sha: sha}, img.vars);

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
		}
	});
}

function addImageToQueue(file, size, sha, callback, vars)
{
	queuedImages.push({file: file, size: size, sha: sha, callback: callback, vars: vars});

	if(!processingTheImageQueue)
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

function returnCacheImage(file, sha, callback = false, vars = false)
{
	if(!data) data = storage.get('cache');

	if(!callback)
	{
		callback = sha;
		vars = callback;
		sha = sha1(file);
	}
	
	let size = Math.round(window.devicePixelRatio * 150);

	let imgCache = data[sha];

	let path = p.join(cacheFolder, sha+'.jpg?size='+size);

	if(typeof imgCache == 'undefined' || !fs.existsSync(p.join(cacheFolder, sha+'.jpg')))
	{
		addImageToQueue(file, size, sha, callback, vars);

		return {cache: false, path: /*path*/'', sha: sha};
	}
	else
	{
		data[sha].lastAccess = time();

		if(imgCache.size != size)
		{
			addImageToQueue(file, size, sha, callback, vars);

			return {cache: true, path: escapeBackSlash(path), sha: sha};
		}
		else
		{
			return {cache: true, path: escapeBackSlash(path), sha: sha};
		}
	}
}

async function returnThumbnailsImages(images, callback, file = false)
{
	if(!data) data = storage.get('cache');

	let size = Math.round(window.devicePixelRatio * 150);

	let thumbnails = {};
	let toGenerateThumbnails = [];
	let toGenerateThumbnailsData = {};

	for(let i = 0, len = images.length; i < len; i++)
	{
		let image = images[i];

		let sha = image.sha || sha1(image.path);
		let imgCache = data[sha];

		let path = p.join(cacheFolder, sha+'.jpg?size='+size);

		if(typeof imgCache == 'undefined' || !fs.existsSync(p.join(cacheFolder, sha+'.jpg')))
		{
			toGenerateThumbnails.push(image);
			toGenerateThumbnailsData[image.path] = {sha: sha, vars: image.vars};

			thumbnails[sha] = {cache: false, path: '', sha: sha};
		}
		else
		{
			data[sha].lastAccess = time();

			if(imgCache.size != size)
			{
				toGenerateThumbnails.push(image);
				toGenerateThumbnailsData[image.path] = {sha: sha, vars: image.vars};

				thumbnails[sha] = {cache: true, path: escapeBackSlash(path), sha: sha};
			}
			else
			{
				thumbnails[sha] = {cache: true, path: escapeBackSlash(path), sha: sha};
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

	return thumbnails;
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

module.exports = {
	folder: cacheFolder,
	returnCacheImage: returnCacheImage,
	returnThumbnailsImages: returnThumbnailsImages,
	cleanQueue: cleanQueue,
	writeFile: writeFile,
	readFile: readFile,
	queuedImages: function(){return queuedImages},
	processingTheImageQueue: function(){return processingTheImageQueue},
};
