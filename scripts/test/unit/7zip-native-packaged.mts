import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {access, copyFile, cp, mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import p from 'node:path';
import {promisify} from 'node:util';
import {createPackageWithOptions} from '@electron/asar';

const require = createRequire(import.meta.url);
const electron: string = require('electron');
const packageDir = p.dirname(p.dirname(require.resolve('7zip-native')));
const execute = promisify(execFile);

describe('packaged 7zip-native', function() {

	it('creates and reads archives using the unpacked engine', async function() {

		const root = await mkdtemp(p.join(tmpdir(), 'opencomic-7zip-asar-'));
		const source = p.join(root, 'source');
		const bundled = p.join(source, 'node_modules/7zip-native');
		const runtime = `${process.platform}-${process.arch}`;

		try
		{
			await mkdir(p.join(source, '.dist'), {recursive: true});
			await mkdir(p.join(bundled, 'prebuilds'), {recursive: true});
			await copyFile(p.resolve(import.meta.dirname, '../../7zip-native.mjs'), p.join(source, '.dist/7zip-native.mjs'));
			await copyFile(p.join(packageDir, 'package.json'), p.join(bundled, 'package.json'));
			await cp(p.join(packageDir, 'dist'), p.join(bundled, 'dist'), {recursive: true});
			await cp(p.join(packageDir, 'prebuilds', runtime), p.join(bundled, 'prebuilds', runtime), {recursive: true});

			const input = p.join(root, 'input.txt');
			await writeFile(input, 'packaged backup');

			for(const name of ['app.asar', 'app-x64.asar', 'app-arm64.asar'])
			{
				const asar = p.join(root, name);
				const output = p.join(root, `${name}.7z`);
				await createPackageWithOptions(source, asar, {unpackDir: 'node_modules/7zip-native'});
				await access(p.join(`${asar}.unpacked`, 'node_modules/7zip-native/dist/index.mjs'));

				const script = `
					const {pathToFileURL} = require('node:url');
					global.document = {baseURI: pathToFileURL(process.argv[1] + '/index.html').href};
					global.asarToAsarUnpacked = path => path.replace(/(^|[\\\\/])app(-(?:arm64|x64))?\\.asar(?=[\\\\/])/, '$1app$2.asar.unpacked');
					(async () => {
						const {default: native7z} = await import(pathToFileURL(process.argv[1] + '/.dist/7zip-native.mjs').href);
						const {Archive} = await native7z;
						await Archive.create(process.argv[2], [{sourcePath: process.argv[3], path: 'input.txt'}]);
						const archive = await Archive.open(process.argv[2]);
						try {
							const content = await archive.extract('input.txt');
							if (content.toString() !== 'packaged backup') throw new Error('Unexpected archive contents');
						} finally {
							await archive.close();
						}
						console.log('Archive verified');
					})().catch(error => { console.error(error); process.exitCode = 1; });
				`;

				const {stdout} = await execute(electron, ['-e', script, asar, output, input], {
					env: {...process.env, ELECTRON_RUN_AS_NODE: '1'},
				});
				assert.match(stdout, /Archive verified/);
			}
		}
		finally
		{
			await rm(root, {recursive: true, force: true});
		}

	});

});
