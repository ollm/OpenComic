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

var pdfjsDecoders = false;

async function loadPdfjsDecoders()
{
	if(pdfjsDecoders) return;

	pdfjsDecoders = await import(asarToAsarUnpacked(p.join(__dirname, '..', 'node_modules/pdfjs-dist/image_decoders/pdf.image_decoders.mjs')));

	pdfjsDecoders.JpxImage.setOptions({
		useWasm: true,
		useWorkerFetch: true,
		wasmUrl: posixPath(asarToAsarUnpacked(p.join(__dirname, '..', 'node_modules/pdfjs-dist/wasm/'))),
	});

	return true;
}

var JxlImage = false;

async function loadJxlImage()
{
	if(JxlImage) return;

	JxlImage = await import(asarToAsarUnpacked(p.join(__dirname, '..', 'node_modules/jxl-oxide-wasm/jxl_oxide_wasm.js')));

	await JxlImage.default();
	JxlImage = JxlImage.JxlImage;

	return true;
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