var sharp = false, imageSize = false, heic = false;

async function loadSharp()
{
	if(sharp !== false) return;
	sharp = require('sharp');
}

async function resize(fromImage, toImage, config = {})
{
	await loadSharp();

	if(!config.blob)
	{
		fromImage = app.shortWindowsPath(fromImage);
		fileManager.macosStartAccessingSecurityScopedResource(fromImage);
	}

	config = {...{
		width: 200,
		fit: sharp.fit.inside,
		quality: 95,
		background: 'white',
	}, ...config};

	return new Promise(function(resolve, reject) {

		if(!config.blob)
		{
			const extension = app.extname(fromImage);

			if(/*compatible.image.ico.has(extension)/* || */compatible.image.ico.has(extension)) // Unsupported images format for resize
				return reject({});
		}

		_resize(fromImage, toImage, config, resolve, reject);

	});
}

async function _resize(fromImage, toImage, config = {}, resolve, reject, deep = 0)
{
	let options = {}

	if(deep > 3)
		options = {failOn: 'none'};

	if(config.blob)
		fromImage = await (await fetch(fromImage)).arrayBuffer();

	sharp(fromImage, options).flatten({background: {r: 255, g: 255, b: 255}}).jpeg({quality: config.quality}).resize(config).toFile(toImage, async function(error) {

		if(error && /unsupported image format/iu.test(error?.message || '') && !config.blob)
		{
			reject(error);
		}
		else if(error)
		{
			if(deep > 3)
			{
				console.error(fromImage, error);
				reject(error);
			}
			else
			{
				deep++;

				if(deep > 3)
					console.warn('Warning: Image resizing failed, Trying once more in '+(100 * deep)+'ms with failOn: none | '+fromImage, error);
				else
					console.log('Log: Image resizing failed, Trying again in '+(100 * deep)+'ms | '+fromImage, error);

				await app.sleep(100 * deep);
				_resize(fromImage, toImage, config, resolve, reject, deep);
			}
		}
		else
		{
			resolve(toImage);
		}
	});
}

async function resizeToBlob(fromImage, config = {})
{
	await loadSharp();

	if(!config.blob)
	{
		fromImage = app.shortWindowsPath(fromImage);
		fileManager.macosStartAccessingSecurityScopedResource(fromImage);
	}

	config = {...{
		kernel: 'lanczos3',
		compressionLevel: 0,
	}, ...config};

	if(config.width && config.width < 1)
		config.width = 1;

	if(config.height && config.height < 1)
		config.height = 1;

	return new Promise(async function(resolve, reject) {

		// pipelineColourspace('rgb16').toColourspace('rgb16')

		if(config.blob)
			fromImage = await (await fetch(fromImage)).arrayBuffer();

		let _sharp = sharp(fromImage).keepIccProfile();

		if(config.interpolator && !config.kernel)
		{
			let imageWidth = config.imageWidth;
			let imageHeight = config.imageHeight;

			if(config.width < imageWidth)
			{
				let m = Math.floor(imageWidth / config.width);

				if(m >= 2)
				{
					imageWidth = Math.round(imageWidth / m);
					imageHeight = Math.round(imageHeight / m);
				}
			}

			if(imageWidth != config.imageWidth)
				_sharp.resize({kernel: 'cubic', width: imageWidth});

			_sharp = _sharp.affine([config.width / imageWidth, 0, 0, config.height / imageHeight], {interpolator: config.interpolator});
		}
		else
		{
			_sharp = _sharp.resize(config);
		}

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

async function rawToPng(fromBuffer, toImage, raw = {}, config = {})
{
	await loadSharp();

	config = {...{
		kernel: 'nearest',
		compressionLevel: 2,
	}, ...config};

	return new Promise(function(resolve, reject) {

		const _sharp = sharp(fromBuffer, {raw: raw});

		if(config.removeAlpha)
			_sharp.removeAlpha();

		_sharp.keepIccProfile().pipelineColourspace(raw.rgb16 ? 'rgb16' : 'srgb').toColourspace(raw.rgb16 ? 'rgb16' : 'srgb').png({force: true, compressionLevel: config.compressionLevel}).toFile(toImage, function(error) {
		
			if(error)
				reject();
			else
				resolve(toImage);

		});

	});
}

async function rawToBuffer(fromBuffer, raw = {}, config = {})
{
	await loadSharp();

	config = {...{
		kernel: 'nearest',
		compressionLevel: 0,
	}, ...config};

	return new Promise(function(resolve, reject) {

		const _sharp = sharp(fromBuffer, {raw: raw});

		if(config.removeAlpha)
			_sharp.removeAlpha();

		_sharp.keepIccProfile().pipelineColourspace(raw.rgb16 ? 'rgb16' : 'srgb').toColourspace(raw.rgb16 ? 'rgb16' : 'srgb').png({force: true, compressionLevel: config.compressionLevel}).toBuffer(function(error, buffer, info) {
		
			if(error || !buffer)
				reject(error);
			else
				resolve(buffer);

		});

	});
}

var isAnimatedCache = {};

async function isAnimated(path)
{
	if(isAnimatedCache[path] !== undefined) return isAnimatedCache[path];

	let extension = app.extname(path);
	let _isAnimated = false;

	if(compatible.image.bmp.has(extension) || compatible.image.ico.has(extension)) // Unsupported image format by sharp
	{
		_isAnimated = true;
	}
	else if(compatible.image.jpg.has(extension)) // Extensions that do not support animations
	{
		_isAnimated = false;
	}
	else if(compatible.image.svg.has(extension)) // Is a vector format
	{
		_isAnimated = true;
	}
	else if(compatible.image.png.has(extension) || compatible.image.webp.has(extension) || compatible.image.avif.has(extension) || compatible.image.gif.has(extension))  // They can have animations
	{
		_isAnimated = false;

		let type = 'image/png';

		if(compatible.image.png.has(extension))
			type = 'image/png';
		else if(compatible.image.webp.has(extension))
			type = 'image/webp';
		else if(compatible.image.avif.has(extension))
			type = 'image/avif';
		else if(compatible.image.gif.has(extension))
			type = 'image/gif';

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

function sharpSupportedFormat(path, extension = false)
{
	extension = extension || app.extname(path);

	if(compatible.image.bmp.has(extension) || compatible.image.ico.has(extension)) // Unsupported image format by sharp
		return false;

	return true;
}

function loadImage(url, encode = false)
{
	return new Promise(function(resolve) {
		let image = new Image();
		image.onload = function(){resolve(image)}
		image.onerror = function(){resolve(image)}
		image.src = encode ? encodeSrcURI(url) : url;
	});
}

var sizesCache = {};

async function getSizes(images)
{
	await loadSharp();

	const sizes = [];
	const promises = [];
	const len = images.length;

	for(let i = 0; i < len; i++)
	{
		sizes.push(false);

		const image = images[i];

		if(!image.image || image.folder)
			continue;

		const sha = image.sha || sha1(image.path);

		if(sizesCache[sha])
		{
			sizes[i] = sizesCache[sha];
			continue;
		}

		promises.push(threads.job('getImageSizes', {useThreads: 1}, async function() {

			let size = {
				width: 1,
				height: 1,
			};

			try
			{
				const extension = app.extname(image.image);

				if(compatible.image.heic.has(extension))
				{
					if(heic === false)
						heic = require('heic-decode');

					const buffer = await fsp.readFile(image.image);
					const images = await heic.all({buffer});
					const properties = images[0] || {width: 1, height: 1};

					size = {
						width: properties.width,
						height: properties.height,
					};
				}
				else if(compatible.image.jp2.has(extension))
				{
					if(pdfjsDecoders === false)
						await loadPdfjsDecoders();

					const buffer = await fsp.readFile(image.image);
					const properties = pdfjsDecoders.JpxImage.parseImageProperties(buffer);

					size = {
						width: properties.width,
						height: properties.height,
					};
				}
				else if(compatible.image.jxl.has(extension))
				{
					if(JxlImage === false)
						await loadJxlImage();

					const buffer = await fsp.readFile(image.image);

					const jxlImage = new JxlImage();
					jxlImage.feedBytes(buffer);
			
					if(!jxlImage.tryInit())
						throw new Error('Partial image, no frame data');

					size = {
						width: jxlImage.width,
						height: jxlImage.height,
					};
				}
				else if(compatible.image.blob.has(extension))
				{
					if(imageSize === false)
						imageSize = require('image-size/fromFile').imageSizeFromFile;

					try
					{
						const dimensions = await imageSize(image.image);

						size = {
							width: dimensions.width,
							height: dimensions.height,
						};
					}
					catch(error)
					{
						const blob = await workers.convertImageToBlob(image.image);
						const buffer = await (await fetch(blob)).arrayBuffer();

						const _sharp = sharp(buffer);
						const metadata = await _sharp.metadata();

						size = {
							width: metadata.width,
							height: metadata.height,
						};
					}
				}
				else if(sharpSupportedFormat(image.image, extension))
				{
					try
					{
						fileManager.macosStartAccessingSecurityScopedResource(image.image);
						const _sharp = sharp(app.shortWindowsPath(image.image));
						const metadata = await _sharp.metadata();

						size = {
							width: metadata.width,
							height: metadata.height,
						};
					}
					catch(error)
					{
						const img = new Image();
						img.src = image.image;
						await img.decode();

						size = {
							width: img.naturalWidth,
							height: img.naturalHeight,
						};
					}
				}
				else
				{
					const img = new Image();
					img.src = image.image;
					await img.decode();

					size = {
						width: img.naturalWidth,
						height: img.naturalHeight,
					};
				}
			}
			catch(error)
			{
				console.error(error);
			}

			sizesCache[sha] = size;
			sizes[i] = size;

			return;

		}));
	}

	await Promise.all(promises);

	return sizes;
}

module.exports = {
	resize: resize,
	resizeToBlob: resizeToBlob,
	rawToPng: rawToPng,
	rawToBuffer: rawToBuffer,
	isAnimated: isAnimated,
	sharpSupportedFormat: sharpSupportedFormat,
	loadImage: loadImage,
	getSizes: getSizes,
};