import {describe, it} from 'node:test';
import assert from 'node:assert';
import sharp from 'sharp';
import p from 'node:path';

const ___dirname = typeof __dirname !== 'undefined' ? __dirname : import.meta.dirname;
const imagesDir = p.join(___dirname, '../../../scripts/test/images');

const images = {
	jxl: p.join(imagesDir, 'test1.jxl'), // https://jpegxl.info/old/art/2021-04_jon.html
	avif: p.join(imagesDir, 'hato.profile2.12bpc.yuv422.avif'), // https://github.com/link-u/avif-sample-images
	avif12yuv444: p.join(imagesDir, 'plum-blossom-large.profile2.12bpc.yuv444.alpha-full.avif'), // https://github.com/link-u/avif-sample-images
	jp2: p.join(imagesDir, 'sample1.jp2'), // https://filesamples.com/formats/jp2
	heic: p.join(imagesDir, 'classic-car.heic'), // https://heic.digital/samples/
	heic10: p.join(imagesDir, 'hato.10bpc.heic'), // https://github.com/link-u/avif-sample-images // hato.16bpc.png converted with gimp
	heic12: p.join(imagesDir, 'hato.12bpc.heic'), // https://github.com/link-u/avif-sample-images // hato.16bpc.png converted with gimp
	heic12yuv444: p.join(imagesDir, 'hato.12bpc.yuv444.heic'), // https://github.com/link-u/avif-sample-images // hato.16bpc.png converted with gimp
};

describe('Sharp', function() {

	// JXL
	it('JXL', async function() {

		const _sharp = await sharp(images.jxl);
		const metadata = await _sharp.metadata();

		assert.strictEqual('jxl', metadata.format);
		assert.strictEqual('rgb16', metadata.space);
		assert.strictEqual('image/jxl', metadata.mediaType);
		assert.strictEqual(10, metadata.bitsPerSample);
		assert.strictEqual(924, metadata.width);
		assert.strictEqual(1386, metadata.height);

	});

	// AVIF
	it('AVIF', async function() {

		const _sharp = await sharp(images.avif);
		const metadata = await _sharp.metadata();

		assert.strictEqual('heif', metadata.format);
		assert.strictEqual('rgb16', metadata.space);
		assert.strictEqual('image/avif', metadata.mediaType);
		assert.strictEqual(12, metadata.bitsPerSample);
		assert.strictEqual(3078, metadata.width);
		assert.strictEqual(2049, metadata.height); // 2048, test fail

	});

	// AVIF 12bpc yuv444
	it('AVIF 12bpc yuv444', async function() {

		const _sharp = await sharp(images.avif12yuv444);
		const metadata = await _sharp.metadata();

		assert.strictEqual('heif', metadata.format);
		assert.strictEqual('rgb16', metadata.space);
		assert.strictEqual('image/avif', metadata.mediaType);
		assert.strictEqual(4, metadata.channels);
		assert.strictEqual(12, metadata.bitsPerSample);
		assert.strictEqual(2048, metadata.width);
		assert.strictEqual(2048, metadata.height); // 2048, test fail

	});

	// JP2
	it('JP2', async function() {

		const _sharp = await sharp(images.jp2);
		const metadata = await _sharp.metadata();

		assert.strictEqual('jp2', metadata.format);
		assert.strictEqual('srgb', metadata.space);
		assert.strictEqual('image/jp2', metadata.mediaType);
		assert.strictEqual(8, metadata.bitsPerSample);
		assert.strictEqual(2717, metadata.width);
		assert.strictEqual(3701, metadata.height);

	});

	/*
	// HEIC
	it('HEIC', async function() {

		const _sharp = await sharp(images.heic);
		const metadata = await _sharp.metadata();

		assert.strictEqual('heif', metadata.format);
		assert.strictEqual('srgb', metadata.space);
		assert.strictEqual('image/heic', metadata.mediaType);
		assert.strictEqual(8, metadata.bitsPerSample);
		assert.strictEqual(3024, metadata.width);
		assert.strictEqual(4032, metadata.height);

	});

	// HEIC 10bpc
	it('HEIC 10bpc', async function() {

		const _sharp = await sharp(images.heic10);
		const metadata = await _sharp.metadata();

		assert.strictEqual('heif', metadata.format);
		assert.strictEqual('rgb16', metadata.space);
		assert.strictEqual('image/heic', metadata.mediaType);
		assert.strictEqual(10, metadata.bitsPerSample);
		assert.strictEqual(3078, metadata.width);
		assert.strictEqual(2048, metadata.height);

	});

	// HEIC 12bpc
	it('HEIC 12bpc', async function() {

		const _sharp = await sharp(images.heic12);
		const metadata = await _sharp.metadata();

		assert.strictEqual('heif', metadata.format);
		assert.strictEqual('rgb16', metadata.space);
		assert.strictEqual('image/heic', metadata.mediaType);
		assert.strictEqual(12, metadata.bitsPerSample);
		assert.strictEqual(3078, metadata.width);
		assert.strictEqual(2048, metadata.height);

	});

	// HEIC 12bpc yuv444
	it('HEIC 12bpc yuv444', async function() {

		const _sharp = await sharp(images.heic12);
		const metadata = await _sharp.metadata();

		assert.strictEqual('heif', metadata.format);
		assert.strictEqual('rgb16', metadata.space);
		assert.strictEqual('image/heic', metadata.mediaType);
		assert.strictEqual(12, metadata.bitsPerSample);
		assert.strictEqual(3078, metadata.width);
		assert.strictEqual(2048, metadata.height);

	});
	*/

});
