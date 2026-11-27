import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {describe, it} from 'node:test';
import assert from 'node:assert';
import os from 'node:os';
import p from 'node:path';

const buttonLoadingCalls: unknown[] = [];
const snackbarCalls: {key: string}[] = [];

Object.assign(globalThis, {
	document: {querySelector: () => ({})},
	events: {
		INFINITY: -1,
		buttonLoading: (_button: unknown, progress: unknown) => buttonLoadingCalls.push(progress),
		closeSnackbar: () => {},
		snackbar: (options: {key: string}) => snackbarCalls.push(options),
	},
	language: {buttons: {dismiss: 'Dismiss'}},
});

const {default: download} = await import('../../download.mjs');

describe('download', function() {

	it('supports unknown content length and rejects stream errors', async function() {

		const directory = await mkdtemp(p.join(os.tmpdir(), 'opencomic-download-'));

		try
		{
			const downloadPath = p.join(directory, 'download');

			Object.assign(globalThis, {fetch: async() => new Response('download data')});
			await download('https://example.com/file', downloadPath);

			assert.strictEqual(await readFile(downloadPath, 'utf8'), 'download data');
			assert.ok(buttonLoadingCalls.includes(true));

			Object.assign(globalThis, {
				fetch: async() => new Response(new ReadableStream({
					start(controller) {
						controller.error(new Error('reader failed'));
					},
				})),
			});
			await assert.rejects(download('https://example.com/file', downloadPath), /reader failed/);
			await assert.rejects(readFile(downloadPath), /ENOENT/);

			Object.assign(globalThis, {fetch: async() => new Response('write error')});
			await assert.rejects(download('https://example.com/file', p.join(directory, 'missing', 'download')), /ENOENT/);

			assert.strictEqual(snackbarCalls.filter(call => call.key === 'downloadError').length, 2);
		}
		finally
		{
			await rm(directory, {recursive: true, force: true});
		}

	});

});
