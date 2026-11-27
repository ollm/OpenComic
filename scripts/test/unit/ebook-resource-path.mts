import {describe, it} from 'node:test';
import assert from 'node:assert';
import p from 'node:path';

Object.assign(globalThis, {
	p,
	app: {extname: (path: string) => p.extname(path).slice(1)},
	ebook: {standarSizeConfig: {}},
	extract: (regex: RegExp, content: string, index: number) => regex.exec(content)?.[index],
	fs: {existsSync: () => true},
	fsp: {readFile: async() => '<container><rootfile full-path="../../../etc/passwd"/></container>'},
	fileManager: {realPath: (path: string, index = -1) => index === 0 ? '/tmp/opencomic-epub' : path},
	compatible: {compressed: {foliate: {has: () => false}}},
});

const {default: epub} = await import('../../ebook/epub.js');
const book = epub.load('/tmp/book.epub');

describe('EPUB resource paths', function() {

	it('resolves resources inside the extraction directory', function() {

		assert.strictEqual(book.resourcePath('OEBPS/chapter.xhtml'), p.join('/tmp/opencomic-epub', 'OEBPS', 'chapter.xhtml'));

	});

	it('rejects paths that escape the extraction directory', function() {

		assert.throws(() => book.resourcePath('../../../etc/passwd'), /escapes the extraction directory/);
		assert.throws(() => book.resourcePath('%2e%2e/%2e%2e/etc/passwd'), /escapes the extraction directory/);

	});

	it('rejects an escaping OPF path from container.xml', async function() {

		const unsafeBook = epub.load('/tmp/book.epub');
		Object.defineProperty(unsafeBook, 'readEpubZipFiles', {value: async() => []});
		Object.defineProperty(unsafeBook, 'makeAvailable', {value: async() => {}});

		await assert.rejects(unsafeBook.findContentOpf(), /escapes the extraction directory/);

	});

});
