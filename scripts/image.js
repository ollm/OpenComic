let sharp = false, imageSize = false, imageSizeFromFile = false;

inChildFork = typeof inChildFork !== 'undefined' ? inChildFork : false;
const useChildFork = (process.platform === 'linux' && !inChildFork) ? true : false;

async function loadSharp()
{
	if(sharp !== false) return;
	sharp = require('sharp');
}

async function resize(fromImage, toImage, config = {})
{
	await loadSharp();

	if(!inChildFork)
	{
		fromImage = app.shortWindowsPath(fromImage);
		fileManager.macosStartAccessingSecurityScopedResource(fromImage);

		const extension = app.extname(fromImage);

		if(/*compatible.image.ico.has(extension)/* || */compatible.image.ico.has(extension)) // Unsupported images format for resize
			throw new Error({});
	}

	config = {
		width: 200,
		fit: sharp.fit.inside,
		quality: 95,
		background: 'white',
		...config,
	};

	return _resize(fromImage, toImage, config);
}

async function _resize(fromImage, toImage, config = {}, deep = 0)
{
	if(useChildFork && !inChildFork)
		return childFork._resize(fromImage, toImage, config, deep);

	await loadSharp();

	let options = {}

	if(deep > 3)
		options = {failOn: 'none'};

	try
	{
		await sharp(fromImage, options).flatten({background: {r: 255, g: 255, b: 255}}).jpeg({quality: config.quality}).resize(config).toFile(toImage);

		return toImage;
	}
	catch(error)
	{
		if(error && /unsupported image format/iu.test(error?.message || ''))
		{
			throw error;
		}
		else if(error)
		{
			if(deep > 3)
			{
				console.error(fromImage, error);
				throw error;
			}
			else
			{
				deep++;

				if(deep > 3)
					console.warn('Warning: Image resizing failed, Trying once more in '+(100 * deep)+'ms with failOn: none | '+fromImage, error);
				else
					console.log('Log: Image resizing failed, Trying again in '+(100 * deep)+'ms | '+fromImage, error);

				await app.sleep(100 * deep);
				return _resize(fromImage, toImage, config, deep);
			}
		}
	}
}

async function resizeToBlob(fromImage, config = {})
{
	await loadSharp();

	if(!inChildFork)
	{
		fromImage = app.shortWindowsPath(fromImage);
		fileManager.macosStartAccessingSecurityScopedResource(fromImage);
	}

	config = {
		kernel: 'lanczos3',
		compressionLevel: 0,
		...config,
	};

	if(config.width && config.width < 1) config.width = 1;
	if(config.height && config.height < 1) config.height = 1;

	if(useChildFork && !inChildFork)
	{
		const toFile = p.join(tempFolder, crypto.randomUUID()+'.png');
		config.toFile = toFile;

		const info = await childFork.resizeToBlob(fromImage, config);
		const data = await fsp.readFile(toFile);
		fsp.unlink(toFile);

		const blob = new Blob([data], {type: 'image/png'});
		const url = URL.createObjectURL(blob);

		return {blob: url, info, size: blob.size};
	}

	let _sharp = sharp(fromImage).keepIccProfile();

	if(config.width && config.height)
	{
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
				_sharp = _sharp.resize({kernel: 'cubic', width: imageWidth});

			_sharp = _sharp.affine([config.width / imageWidth, 0, 0, config.height / imageHeight], {interpolator: config.interpolator});
		}
		else
		{
			_sharp = _sharp.resize(config);
		}
	}

	try
	{
		if(config.toFile)
		{
			const info = await _sharp.png({compressionLevel: config.compressionLevel, force: true}).toFile(config.toFile);
			return {data: [], info, size: 0};
		}

		const {data, info} = await _sharp.png({compressionLevel: config.compressionLevel, force: true}).toBuffer({resolveWithObject: true});

		if(config.returnData)
			return {data, info};

		const blob = new Blob([data], {type: 'image/png'});
		const url = URL.createObjectURL(blob);

		return {blob: url, info, size: blob.size};
	}
	catch(error)
	{
		throw error;
	}
}

async function toPng(fromImage, toImage, config = {})
{
	await loadSharp();

	config = {
		kernel: 'nearest',
		compressionLevel: 2,
		...config,
	};

	return new Promise(function(resolve, reject) {

		const _sharp = sharp(fromImage);

		if(config.removeAlpha)
			_sharp.removeAlpha();

		_sharp.keepIccProfile().png({compressionLevel: config.compressionLevel, force: true}).toFile(toImage, function(error) {

			if(error)
				reject(error);
			else
				resolve(toImage);

		});

	});
}

async function rawToPng(fromBuffer, toImage, raw = {}, config = {})
{
	await loadSharp();

	config = {
		kernel: 'nearest',
		compressionLevel: 2,
		...config,
	};

	return new Promise(function(resolve, reject) {

		const _sharp = sharp(fromBuffer, {raw: raw});

		if(config.removeAlpha)
			_sharp.removeAlpha();

		_sharp.keepIccProfile().pipelineColourspace(raw.rgb16 ? 'rgb16' : 'srgb').toColourspace(raw.rgb16 ? 'rgb16' : 'srgb').png({compressionLevel: config.compressionLevel, force: true}).toFile(toImage, function(error) {
		
			if(error)
				reject(error);
			else
				resolve(toImage);

		});

	});
}

async function rawToBuffer(fromBuffer, raw = {}, config = {})
{
	await loadSharp();

	config = {
		kernel: 'nearest',
		compressionLevel: 0,
		...config,
	};

	return new Promise(function(resolve, reject) {

		const _sharp = sharp(fromBuffer, {raw: raw});

		if(config.removeAlpha)
			_sharp.removeAlpha();

		_sharp.keepIccProfile().pipelineColourspace(raw.rgb16 ? 'rgb16' : 'srgb').toColourspace(raw.rgb16 ? 'rgb16' : 'srgb').png({compressionLevel: config.compressionLevel, force: true}).toBuffer(function(error, buffer, info) {
		
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

		try
		{
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
		catch(error)
		{
			if(!/Failed to retrieve track metadata/iu.test(error))
				console.error(error);
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

async function metadata(path)
{
	await loadSharp();

	const _sharp = sharp(path);
	return await _sharp.metadata();
}

var sizesCache = {};

async function getBuffersFS(getImageBuffersFS)
{
	const promises = [];

	for(const {i, ext, sha, path, compressedFile, name, size} of getImageBuffersFS)
	{
		promises.push((async function(){

			let buffer;

			try
			{
				const realPath = fileManager.realPath(path, -1);
				buffer = await fileManager.readChunk(realPath, {start: 0, size: size});
			}
			catch(error)
			{
				return;
			}

			return buffer;

		})());
	}

	return await Promise.all(promises);
}

async function getSizesFromBuffer(getImageBuffers, buffers)
{
	await loadSharp();

	const Sharp = async function(buffer) {

		const _metadata = useChildFork ? await childFork.metadata(buffer) : await metadata(buffer);

		return {
			width: _metadata.width,
			height: _metadata.height,
		};

	}

	const ImageSize = async function(buffer) {

		if(imageSize === false)
			imageSize = require('image-size').imageSize;

		const dimensions = imageSize(buffer);

		return {
			width: dimensions.width,
			height: dimensions.height,
		};

	}

	const promises = [];

	for(let i = 0, len = getImageBuffers.length; i < len; i++)
	{
		const {ext, sha, compressedFile, name, size} = getImageBuffers[i];
		const buffer = buffers[i];

		if(buffer)
		{
			promises.push(threads.job('getImageSizesFromBuffer', {useThreads: threads.ALL}, async function() {

				let size = {
					width: 0,
					height: 0,
				};

				try
				{
					if(compatible.image.convert.has(ext))
					{
						size = await ImageSize(buffer);
					}
					else if(sharpSupportedFormat(image.image, ext))
					{
						if(process.platform === 'linux' && !compatible.image.jxl.has(ext)) // Sharp is slower in Linux due childFork usage
						{
							try
							{
								size = await ImageSize(buffer);
							}
							catch(error)
							{
								size = await Sharp(buffer);
							}
						}
						else
						{
							size = await Sharp(buffer);
						}
					}
				}
				catch(error)
				{
					console.warn('Error reading buffer for', name, error);
				}

				if(size.width && size.height)
					sizesCache[sha] = size;

				return;

			}));
		}
	}

	await Promise.all(promises);

}

async function getSizes(images)
{
	await loadSharp();

	const _Image = async function(image) {

		const img = new Image();
		img.src = image.image;
		await img.decode();

		return {
			width: img.naturalWidth,
			height: img.naturalHeight,
		};

	};

	const Sharp = async function(image) {

		try
		{
			fileManager.macosStartAccessingSecurityScopedResource(image.image);

			const path = app.shortWindowsPath(image.image);
			const _metadata = useChildFork ? await childFork.metadata(path) : await metadata(path);

			return {
				width: _metadata.width,
				height: _metadata.height,
			};
		}
		catch(error)
		{
			return await _Image(image);
		}

	}

	const ImageSize = async function(image) {

		if(imageSizeFromFile === false)
			imageSizeFromFile = require('image-size/fromFile').imageSizeFromFile;

		const dimensions = await imageSizeFromFile(path);

		return {
			width: dimensions.width,
			height: dimensions.height,
		};

	}

	const sizes = [];
	const promises = [];
	const len = images.length;

	const shaMap = new Map();
	const getImageBuffers = [];
	const getImageBuffersFS = [];

	for(let i = 0; i < len; i++)
	{
		const image = images[i];

		if(!image.image || image.folder)
			continue;

		const path = image.path;

		const sha = image.sha || sha1(path);
		shaMap.set(path, sha);

		if(sizesCache[sha])
			continue;

		const ext = app.extname(path);

		let bufferSize = 0; // Size in bytes to read from the compressed file, enough to get the dimensions of the image without decompressing the whole file. The actual size needed may vary depending on the image format and its metadata structure.

		/*if(compatible.image.heic.has(ext)) // To much buffer to read
			bufferSize = 32768;
		else */if(compatible.image.jpg.has(ext) || compatible.image.jp2.has(ext))
			bufferSize = 8192;
		else if(compatible.image.avif.has(ext))
			bufferSize = 4096;
		else if(compatible.image.jxl.has(ext))
			bufferSize = 512;
		else if(compatible.image.webp.has(ext))
			bufferSize = 128;
		else if(compatible.image.png.has(ext) || /*compatible.image.jxr.has(ext) ||*/ compatible.image.gif.has(ext))
			bufferSize = 64;

		if(!bufferSize)
			continue;

		const compressed = fileManager.lastCompressedFile(path);
		const isExtracted = fileManager.isExtracted(path);

		const data = {
			sha,
			ext,
			path,
			compressed: compressed,
			name: p.basename(path),
			size: bufferSize,
		};

		if(isExtracted)
			getImageBuffersFS.push(data);
		else if(compressed)
			getImageBuffers.push(data);
	}

	console.time('getSizesFromBuffer');

	await Promise.all([
		(async () => {
			const buffers = await fileManager.compressedStreamReader.getBuffers(getImageBuffers);
			await getSizesFromBuffer(getImageBuffers, buffers);
		})(),

		(async () => {
			const buffersFS = await getBuffersFS(getImageBuffersFS);
			await getSizesFromBuffer(getImageBuffersFS, buffersFS);
		})(),
	]);

	console.timeEnd('getSizesFromBuffer');

	console.time('getSizes');

	// Make available files that failed to read from compressed buffers
	const makeAvailable = [];

	for(let i = 0; i < len; i++)
	{
		const image = images[i];

		if(!image.image || image.folder)
			continue;

		const sha = shaMap.get(image.path);

		if(!sizesCache[sha])
			makeAvailable.push(image);
	}

	if(makeAvailable.length)
	{
		const file = fileManager.file();
		await file.makeAvailable(makeAvailable);
		file.destroy();
	}

	for(let i = 0; i < len; i++)
	{
		sizes.push(false);

		const image = images[i];

		if(!image.image || image.folder)
			continue;

		const sha = shaMap.get(image.path);

		if(sizesCache[sha])
		{
			sizes[i] = sizesCache[sha];
			continue;
		}

		promises.push(threads.job('getImageSizes', {useThreads: threads.ALL}, async function() {

			let size = {
				width: 1,
				height: 1,
			};

			try
			{
				const path = fileManager.realPath(image.path, -1);
				const ext = app.extname(path);

				if(compatible.image.convert.has(ext))
				{
					try
					{
						size = await ImageSize(image);
					}
					catch(error)
					{
						const image = await workers.convertImage(path);
						const _metadata = await metadata(image);

						size = {
							width: _metadata.width,
							height: _metadata.height,
						};
					}
				}
				else if(sharpSupportedFormat(image.image, ext))
				{
					if(process.platform === 'linux' && !compatible.image.jxl.has(ext)) // Sharp is slower in Linux due childFork usage
					{
						try
						{
							size = await ImageSize(image);
						}
						catch(error)
						{
							size = await Sharp(image);
						}
					}
					else
					{
						size = await Sharp(image);
					}
				}
				else
				{
					size = await _Image(image);
				}
			}
			catch(error)
			{
				console.error(image.image, error);
			}

			sizesCache[sha] = size;
			sizes[i] = size;

			return;

		}));
	}

	await Promise.all(promises);

	console.timeEnd('getSizes');

	return sizes;
}

module.exports = {
	resize: resize,
	_resize: _resize,
	resizeToBlob: resizeToBlob,
	toPng: toPng,
	rawToPng: rawToPng,
	rawToBuffer: rawToBuffer,
	isAnimated: isAnimated,
	sharpSupportedFormat: sharpSupportedFormat,
	loadImage: loadImage,
	metadata: metadata,
	getSizes: getSizes,
};