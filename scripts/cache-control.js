var queuedImages = [], processingTheImageQueue = false;

function processTheImageQueue()
{

	if(typeof gm == 'undefined') var gm = require('gm').subClass({imageMagick: true});;

	var img = queuedImages[0];
	var sha = img.sha;

	gm(img.file).resize(img.size, null).noProfile().write(appDir+'/cache/'+sha+'.jpg', function(){

		if(typeof data[sha] == 'undefined') data[sha] = {lastAccess: time()};

		data[sha].size = img.size;

		img.callback({cache: true, path: appDir+'/cache/'+sha+'.jpg?size='+img.size, sha: sha});

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

function returnCacheImage(file, sha, callback)
{

	if(!data) data = storage.get('cache');

	if(typeof callback == 'undefined')
	{
		callback = sha;
		sha = sha1(file);
	}
	
	var size = Math.round(window.devicePixelRatio * 150);

	var imgCache = data[sha];

	var path = appDir+'/cache/'+sha+'.jpg?size='+size;

	if(typeof imgCache == 'undefined' || !fs.existsSync(appDir+'/cache/'+sha+'.jpg'))
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

			return {cache: true, path: path, sha: sha};
		}
		else
		{
			return {cache: true, path: path, sha: sha};
		}
	}
}

module.exports = {
	returnCacheImage: returnCacheImage,
	cleanQueue: cleanQueue,
};