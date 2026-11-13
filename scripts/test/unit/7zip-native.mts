import {describe, it} from 'node:test';
import assert from 'node:assert';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {Writable} from 'node:stream';
import p from 'node:path';

Object.assign(globalThis, {asarToAsarUnpacked: (path: string) => path});
const {default: native7z} = await import('../../7zip-native.mjs');
const {Archive, ArchiveError} = await native7z;

const ___dirname = typeof __dirname !== 'undefined' ? __dirname : import.meta.dirname;
const filesDir = p.join(___dirname, '../../../scripts/test/files');

const archives = {
	'7z': p.join(filesDir, 'sample.7z'),
	'rar': p.join(filesDir, 'sample.rar'),
	'tar': p.join(filesDir, 'sample.tar'),
	'zip': p.join(filesDir, 'sample.zip'),
	'ace': p.join(filesDir, 'sample.ace'),
	'tar.bzip2': p.join(filesDir, 'sample.tar.bzip2'),
	'tar.gz': p.join(filesDir, 'sample.tar.gz'),
	'tar.xz': p.join(filesDir, 'sample.tar.xz'),
	'tar.zstd': p.join(filesDir, 'sample.tar.zstd'),
	'wim': p.join(filesDir, 'sample.wim'),
};

describe('7zip-native', function() {

	it('creates and compresses 7z archives', async function() {

		const outputDir = await mkdtemp(p.join(tmpdir(), 'opencomic-7zip-native-create-'));
		const archivePath = p.join(outputDir, 'created.7z');
		const sourcePaths = Object.values(archives);

		try
		{
			await Archive.create(archivePath, sourcePaths.map(sourcePath => ({
				sourcePath,
				path: p.basename(sourcePath),
			})), {compressionLevel: 1});

			const archive = await Archive.open(archivePath);

			try
			{
				const entries = await archive.entries();
				assert.deepStrictEqual(
					entries.filter(entry => !entry.isDirectory).map(entry => entry.path).sort(),
					sourcePaths.map(sourcePath => p.basename(sourcePath)).sort(),
				);

				for(const entry of entries.filter(entry => !entry.isDirectory))
				{
					assert.deepStrictEqual(
						await archive.extract(entry.id),
						await readFile(p.join(filesDir, entry.path)),
					);
				}
			}
			finally
			{
				await archive.close();
			}
		}
		finally
		{
			await rm(outputDir, {recursive: true, force: true});
		}

	});

	for(const [format, archivePath] of Object.entries(archives))
	{
		it(`opens and reads ${format} archives`, async function() {

			const archive = await Archive.open(archivePath);

			try
			{
				const entries = await archive.entries();
				const entry = await archive.getEntry('sample/noise.avif');

				assert.ok(entries.length > 0);
				assert.ok(entry);
				assert.strictEqual(entry.extractedPath, p.normalize(entry.path));
				assert.strictEqual((await archive.getEntry(entry.id))?.path, entry.path);

				const buffer = await archive.extract(entry.id);
				assert.strictEqual(buffer.length, Number(entry.size));

				const batch = await archive.extract([entry.id, 'sample/noise.jpg']);
				assert.strictEqual(batch.length, 2);
				assert.strictEqual(batch[0].length, buffer.length);

				const partial = await archive.read(entry.path, {offset: 10, length: 64});
				assert.deepStrictEqual(partial, buffer.subarray(10, 74));

				const streamChunks: Buffer[] = [];
				for await(const chunk of archive.createReadStream(entry.id))
					streamChunks.push(Buffer.from(chunk));

				assert.deepStrictEqual(Buffer.concat(streamChunks), buffer);

				const outputChunks: Buffer[] = [];
				const output = new Writable({
					write(chunk: Buffer, _encoding, callback) {
						outputChunks.push(Buffer.from(chunk));
						callback();
					},
				});
				await archive.extractToStream(entry.path, output);
				assert.deepStrictEqual(Buffer.concat(outputChunks), buffer);

				const outputDir = await mkdtemp(p.join(tmpdir(), 'opencomic-7zip-native-'));
				try
				{
					await archive.extractToFolder(outputDir, {paths: [entry.path]});
					assert.deepStrictEqual(await readFile(p.join(outputDir, entry.path)), buffer);
				}
				finally
				{
					await rm(outputDir, {recursive: true, force: true});
				}
			}
			finally
			{
				await archive.close();
			}

			await assert.rejects(
				() => archive.entries(),
				(error: unknown) => error instanceof ArchiveError && error.code === 'ERR_ARCHIVE_CLOSED',
			);

		});
	}

	it('sets and resets native extraction concurrency', function() {

		const previous = Archive.concurrency();

		try
		{
			assert.strictEqual(Archive.concurrency(1), 1);
			assert.strictEqual(Archive.concurrency(), 1);
			assert.ok(Archive.concurrency(0) > 0);
		}
		finally
		{
			Archive.concurrency(previous);
		}

	});

});
