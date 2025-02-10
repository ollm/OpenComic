const fs = require('fs');

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

async function convert(path, mime)
{
	switch (mime)
	{
		case 'image/jp2':
		case 'image/jpx':
		case 'image/jpm':

			return jp2(path);

			break;
	}

	return false;
}

module.exports = {
	convert: convert,
}