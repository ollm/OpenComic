var queuedImages = [], processingTheImageQueue = false, imageLibrary = false, imageUse = 'im', sharp = false;

function processTheImageQueue()
{
	if(!sharp) sharp = require('sharp');

	var img = queuedImages[0];
	var sha = img.sha;

	sharp(img.file).resize(img.size, null).background('white').quality(95).toFile(p.join(appDir, 'cache', sha+'.jpg'), function(error) {

		if(error)
		{
			if(!imageLibrary) imageLibrary = require('gm').subClass({imageMagick: true});

			imageLibrary(img.file).resize(img.size, null).quality(95).noProfile().write(p.join(appDir, 'cache', sha+'.jpg'), function(error){

				if(error && imagUse !== 'gm')
				{
					imageLibrary = require('gm').subClass({imageMagick: false});
					imageUse = 'gm';
				}
				else
				{
					if(typeof data[sha] == 'undefined') data[sha] = {lastAccess: time()};

					data[sha].size = img.size;

					img.callback({cache: true, path: escapeBackSlash(p.join(appDir, 'cache', sha+'.jpg?size='+img.size)), sha: sha});

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

			img.callback({cache: true, path: escapeBackSlash(p.join(appDir, 'cache', sha+'.jpg?size='+img.size)), sha: sha});

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

function addImageToQueue(file, size, sha, callback)
{
	queuedImages.push({file: file, size: size, sha: sha, callback: callback});

	if(!processingTheImageQueue)
	{
		processingTheImageQueue = true;

		process.nextTick(function() {
  			processTheImageQueue();
		});
	}
}

function cleanQueue()
{
	queuedImages.splice(1, queuedImages.length - 1);
}

var data = false;

function returnCacheImage(file, sha, callback = false)
{

	if(!data) data = storage.get('cache');

	if(!callback)
	{
		callback = sha;
		sha = sha1(file);
	}
	
	var size = Math.round(window.devicePixelRatio * 150);

	var imgCache = data[sha];

	var path = p.join(appDir, 'cache', sha+'.jpg?size='+size);

	if(typeof imgCache == 'undefined' || !fs.existsSync(p.join(appDir, 'cache', sha+'.jpg')))
	{
		addImageToQueue(file, size, sha, callback);

		return {cache: false, path: /*path*/'', sha: sha};
	}
	else
	{

		data[sha].lastAccess = time();

		if(imgCache.size != size)
		{
			addImageToQueue(file, size, sha, callback);

			return {cache: true, path: escapeBackSlash(path), sha: sha};
		}
		else
		{
			return {cache: true, path: escapeBackSlash(path), sha: sha};
		}
	}
}

module.exports = {
	returnCacheImage: returnCacheImage,
	cleanQueue: cleanQueue,
};