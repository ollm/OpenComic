const fs = require('fs');

var jpegxr = false;

async function jp2(path)
{
	const buffer = fs.readFileSync(path);

	if(pdfjs === false)
		await loadPdfjs();

	try
	{
		const decodedBuffer = await pdfjs.JpxImage.decode(buffer);
		const properties = pdfjs.JpxImage.parseImageProperties(buffer);

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
			pixelInfo: pixelInfo,
			removeAlpha: true,
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
	}

	return false;
}

module.exports = {
	convert: convert,
}