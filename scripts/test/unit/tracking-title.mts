import {describe, it} from 'node:test';
import assert from 'node:assert';
import p from 'node:path';

let comicPath = '';
let mainPath = '';
let metadata: {title?: string} = {};

Object.assign(globalThis, {
	p,
	joinRegexs: (regexs: RegExp[]) => new RegExp(regexs.map(regex => regex.source).join('|')),
	reading: {readingCurrentPath: () => comicPath},
	fileManager: {
		firstCompressedFile: (path: string) => path,
		compressedMetadata: () => metadata,
	},
	dom: {history: {get mainPath() {return mainPath || comicPath}}},
});

const {default: tracking} = await import('../../tracking.js');

describe('tracking.getTitle', function() {

	it('preserves hyphens before a volume marker in a full title', function() {

		comicPath = 'Rent-A-Girlfriend v01 (2020) (Digital) (Sticky Oak) (f).cbz';
		mainPath = '';
		metadata = {};

		assert.strictEqual(tracking.getTitle(true), 'Rent-A-Girlfriend');

	});

	it('preserves hyphens from book metadata in a full title', function() {

		comicPath = 'Volume 01.cbz';
		mainPath = '';
		metadata = {title: 'Rent-A-Girlfriend'};

		assert.strictEqual(tracking.getTitle(true), 'Rent-A-Girlfriend');

	});

	it('still stops a full title at a spaced dash', function() {

		comicPath = 'Rent A Girlfriend - Chapter 01.cbz';
		mainPath = '';
		metadata = {};

		assert.strictEqual(tracking.getTitle(true), 'Rent A Girlfriend');

	});

	it('still stops a tracking search title at an unspaced dash', function() {

		comicPath = 'Series-Chapter 01.cbz';
		mainPath = '';
		metadata = {};

		assert.strictEqual(tracking.getTitle(), 'Series');

	});

	it('uses the parent folder name for an archive named after its volume', function() {

		comicPath = 'Series/第01卷.cbz';
		mainPath = 'Series';
		metadata = {};

		assert.strictEqual(tracking.getTitle(), 'Series');

	});

});
