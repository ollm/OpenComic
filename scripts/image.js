var sharp = false, jimp = false, imageMagick = false, graphicsMagick = false;

async function resize(fromImage, toImage, config = {})
{
	if(sharp === false) sharp = require('sharp');

	config = {...{
		width: 200,
		fit: sharp.fit.inside,
		quality: 95,
		background: 'white',
	}, ...config};

	return new Promise(function(resolve, reject) {

		sharp(fromImage).jpeg({quality: config.quality}).resize(config).toFile(toImage, function(error) {
		
			if(error)
			{
				if(!imageMagick) imageMagick = require('gm').subClass({imageMagick: true});

				imageMagick(fromImage).resize(config.width, null).quality(config.quality).noProfile().write(toImage, function(error){

					if(error)
					{
						if(!graphicsMagick) graphicsMagick = require('gm').subClass({imageMagick: false});

						graphicsMagick(fromImage).resize(config.width, null).quality(config.quality).noProfile().write(toImage, function(error){

							if(error)
							{
								if(jimp === false) jimp = require('jimp');

								jimp.read(fromImage, function(error, lenna) {

									if(error)
									{
										reject(error);
									}
									else
									{
										lenna.resize(config.width, jimp.AUTO).quality(config.quality).background(0xFFFFFFFF).write(toImage, function(){

											resolve(toImage);

										});
									}

								});
							}
							else
							{
								resolve(toImage);
							}
						});

					}
					else
					{
						resolve(toImage);
					}
				});
			}
			else
			{
				resolve(toImage);
			}
		});

	});
}

async function resizeToCanvas(fromImage, config = {})
{
	if(sharp === false) sharp = require('sharp');

	config = {...{
		// background: 'white',
		kernel: 'lanczos3',
	}, ...config};

	return new Promise(function(resolve, reject) {

		// pipelineColourspace('rgb16').toColourspace('rgb16')
		sharp(fromImage).ensureAlpha(1).toColourspace('rgb8').raw({depth: 'uchar'}).resize(config).toBuffer(function(error, data, info) {
		
			if(error)
			{
				reject(error);
			}
			else
			{
				let imageData;

				try
				{
					imageData = new ImageData(new Uint8ClampedArray(data), info.width, info.height);
				}
				catch(error)
				{
					console.error(error);
				}

				resolve({data: imageData, info: info});
			}

		});

	});
}

async function resizeToBlob(fromImage, config = {})
{
	if(sharp === false) sharp = require('sharp');

	config = {...{
		// background: 'white',
		kernel: 'lanczos3',
		compressionLevel: 0,
	}, ...config};

	return new Promise(function(resolve, reject) {

		// pipelineColourspace('rgb16').toColourspace('rgb16')

		let _sharp = sharp(fromImage);

		if(config.interpolator && !config.kernel)
			_sharp = _sharp.affine([config.width / config.imageWidth, 0, 0, config.height / config.imageHeight], {interpolator: config.interpolator});
		else
			_sharp = _sharp.resize(config);

		_sharp.png({compressionLevel: config.compressionLevel, force: true}).toBuffer(function(error, buffer, info) {
		
			if(error || !buffer)
			{
				reject(error);
			}
			else
			{
				let blob;

				try
				{

					blob = new Blob([buffer], {type: 'image/png'});
				}
				catch(error)
				{
					console.error(error);

					reject();
					return;
				}

				// URL.createObjectURL(resizedBlob)
				// URL.revokeObjectURL();

				resolve({blob: URL.createObjectURL(blob), info: info});
			}

		});
	});

	/*
	sharpen({
		sigma: 0.5,
	})

	convolve({
		width: 3,
		height: 3,
		kernel: [0.0, -0.125, 0.0, -0.125, 1.5, -0.125, 0.0, -0.125, 0.0],
	})*/

}

async function convertToPng(fromImage, toImage, config = {})
{
	if(sharp === false) sharp = require('sharp');

	config = {...{
		// background: 'white',
		kernel: 'nearest',
		compressionLevel: 0,
		quality: 100,
	}, ...config};

	// await image.metadata();

	return new Promise(function(resolve, reject) {

		sharp(fromImage).png({force: true, compressionLevel: config.compressionLevel}).resize(config).toFile(toImage, function(error) {
		
			if(error)
				reject();
			else
				resolve(toImage);

		});
	});
}

async function convertToWebp(fromImage, toImage, config = {})
{
	if(sharp === false) sharp = require('sharp');

	config = {...{
		// background: 'white',
		kernel: 'nearest',
		compressionLevel: 0,
		quality: 100,
		lossless: true,
	}, ...config};

	return new Promise(function(resolve, reject) {

		sharp(fromImage).webp({force: true, lossless: config.lossless, quality: config.quality}).resize(config).toFile(toImage, function(error) {
		
			if(error)
				reject();
			else
				resolve(toImage);

		});
	});
}

var isAnimatedCache = {};

async function isAnimated(path)
{
	if(isAnimatedCache[path] !== undefined) return isAnimatedCache[path];

	let extension = fileExtension(path);
	let _isAnimated = false;

	if(inArray(extension, imageExtensions.jpg) || inArray(extension, imageExtensions.bmp) || inArray(extension, imageExtensions.ico)) // Extensions that do not support animations
	{
		_isAnimated = false;
	}
	else if(inArray(extension, imageExtensions.svg) || inArray(extension, imageExtensions.gif)) // Is always animated or is a vector format
	{
		_isAnimated = true;
	}
	else if(inArray(extension, imageExtensions.png) || inArray(extension, imageExtensions.webp) || inArray(extension, imageExtensions.avif))  // They can have animations
	{
		_isAnimated = false;

		let type = 'image/png';

		if(inArray(extension, imageExtensions.png))
			type = 'image/png';
		else if(inArray(extension, imageExtensions.webp))
			type = 'image/webp';
		else if(inArray(extension, imageExtensions.avif))
			type = 'image/avif';

		let decoder = new ImageDecoder({data: await fsp.readFile(path), type: type});
		await decoder.tracks.ready;

		for(let i = 0, len = decoder.tracks.length; i < len; i++)
		{
			if(decoder.tracks[i].animated || decoder.tracks[i].frameCount > 1)
			{
				_isAnimated = true;
				break;
			}
		}
	}
		

	isAnimatedCache[path] = _isAnimated;
	return _isAnimated;
}

module.exports = {
	resize: resize,
	resizeToCanvas: resizeToCanvas,
	resizeToBlob: resizeToBlob,
	convertToPng: convertToPng,
	convertToWebp: convertToWebp,
	isAnimated: isAnimated,
};