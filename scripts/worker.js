const p = require('path'),
	fs = require('fs');

var convertImage = false;

function asarToAsarUnpacked(path)
{
	if(!/app\.asar\.unpacked/.test(path))
	{
		var pathUnpacked = path.replace(/app\.asar/, 'app.asar.unpacked');

		if(fs.existsSync(pathUnpacked)) path = pathUnpacked;
	}

	return path;
}

function posixPath(path)
{
	return path.split(p.sep).join(p.posix.sep);
}

self.addEventListener('message', async function(message) {

	const data = message.data;
	const job = data.job;

	switch (job)
	{
		case 'ping':

			self.postMessage('pong');

			break;
		case 'convertImage':
		case 'convertImageToBlob':

			if(convertImage === false)
				convertImage = require(p.join(__dirname, '../.dist/worker/convert-image.js'));

			const image = await convertImage.convert(data.path, data.mime);
			self.postMessage(image);

			break;
	}

});