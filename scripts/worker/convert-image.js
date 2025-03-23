const fs = require('fs');

var jpegxr = false, heic = false;

async function jp2(path)
{
	const buffer = fs.readFileSync(path);

	if(pdfjsDecoders === false)
		await loadPdfjsDecoders();

	try
	{
		const decodedBuffer = await pdfjsDecoders.JpxImage.decode(buffer);
		const properties = pdfjsDecoders.JpxImage.parseImageProperties(buffer);

		const len = decodedBuffer.length;

		const width = properties.width;
		const height = properties.height;

		const channels = Math.round(len / (width * height));

		return {
			buffer: decodedBuffer,
			width: width,
			height: height,
			length: len,
			channels: channels,
			components: properties.componentsCount, // Channels?
			bits: properties.bitsPerComponent,
		};
	}
	catch(error)
	{
		return {error: error};
	}

	return false;
}

async function jxr(path)
{
	const buffer = fs.readFileSync(path);

	if(jpegxr === false)
		jpegxr = await require('jpegxr')();

	try
	{
		const image = jpegxr.decode(buffer);
		const pixelInfo = image.pixelInfo;

		const len = image.bytes.length;

		const width = image.width;
		const height = image.height;

		const channels = Math.round(len / (width * height));

		return {
			buffer: image.bytes,
			width: width,
			height: height,
			length: len,
			channels: pixelInfo.channels || channels,
			colorFormat: pixelInfo.colorFormat,
			bits: +pixelInfo.bitDepth.replace(/[^0-9]+/, ''),
			bitsString: pixelInfo.bitDepth,
			bitsPerPixel: pixelInfo.bitsPerPixel,
			premultiplied: pixelInfo.premultipledAlpha,
			removeAlpha: true,
		};
	}
	catch(error)
	{
		return {error: error};
	}

	return false;
}

async function jxl(path)
{
	const buffer = fs.readFileSync(path);

	if(JxlImage === false)
		await loadJxlImage();

	try
	{
		const image = new JxlImage();
		image.feedBytes(buffer);

		if(!image.tryInit())
			throw new Error('Partial image, no frame data');

		const renderResult = image.render();
		const png = renderResult.encodeToPng();

		return {
			png: png,
		};
	}
	catch(error)
	{
		return {error: error};
	}

	return false;
}

async function _heic(path)
{
	const buffer = fs.readFileSync(path);

	if(heic === false)
		heic = require('heic-decode');

	try
	{
		const image = await heic({buffer});

		const len = image.data.length;

		const width = image.width;
		const height = image.height;

		const channels = Math.round(len / (width * height));

		return {
			buffer: image.data,
			width: width,
			height: height,
			length: len,
			channels: channels,
			bits: channels > 4 ? 16 : 8,
		};
	}
	catch(error)
	{
		return {error: error};
	}

	return false;
}

async function convert(path, mime)
{
	switch (mime)
	{
		case 'image/jp2':
		case 'image/jpx':
		case 'image/jpm':

			return jp2(path);

			break;
		case 'image/jxr':
		case 'image/vnd.ms-photo':

			return jxr(path);

			break;
		case 'image/jxl':

			return jxl(path);

			break;
		case 'image/heic':
		case 'image/heif':
		case 'image/heic-sequence':
		case 'image/heif-sequence':

			return _heic(path);

			break;

	}

	return false;
}

module.exports = {
	convert: convert,
}