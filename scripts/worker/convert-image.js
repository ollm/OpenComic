const fs = require('fs');

let jpegxr = false;

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

async function convert(path, mime)
{
	switch (mime)
	{
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