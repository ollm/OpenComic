import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import p from 'node:path';
import appImageOffset from '../../appimage-offset.js';

function withAppImage(data: Buffer, run: (file: string) => void)
{
	const directory = fs.mkdtempSync(p.join(os.tmpdir(), 'opencomic-appimage-test-'));

	try
	{
		const file = p.join(directory, 'test.AppImage');
		fs.writeFileSync(file, data);
		run(file);
	}
	finally
	{
		fs.rmSync(directory, {recursive: true, force: true});
	}
}

function fixture(machine: number)
{
	const data = Buffer.alloc(64 + 2 * 64 + 4);
	Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0x41, 0x49, 2]).copy(data);
	data.writeUInt16LE(machine, 18);
	data.writeBigUInt64LE(64n, 40);
	data.writeUInt16LE(64, 58);
	data.writeUInt16LE(2, 60);
	data.write('hsqs', 192);
	return data;
}

describe('AppImage SquashFS offset', function() {

	for(const [architecture, machine] of [['x64', 62], ['arm64', 183]] as const)
	{
		it(`reads the ${architecture} offset without executing the AppImage`, function() {

			withAppImage(fixture(machine), file => assert.strictEqual(appImageOffset(file), 192));

		});
	}

	it('rejects invalid headers and section tables', function() {

		withAppImage(Buffer.alloc(10), file => assert.throws(() => appImageOffset(file), /type 2 AppImage/));
		const data = fixture(183);
		data.writeUInt16LE(0, 60);
		withAppImage(data, file => assert.throws(() => appImageOffset(file), /section table/));

	});

	it('rejects a missing SquashFS at the computed offset', function() {

		const data = fixture(183);
		data.write('xxxx', 192);
		withAppImage(data, file => assert.throws(() => appImageOffset(file), /SquashFS not found/));

	});

});
