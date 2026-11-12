const fs = require('fs');

function appImageOffset(appImagePath)
{
	const file = fs.openSync(appImagePath, 'r');

	try
	{
		const header = Buffer.alloc(64);

		if(fs.readSync(file, header, 0, header.length, 0) !== header.length
			|| !header.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
			|| header[4] !== 2 || header[5] !== 1
			|| !header.subarray(8, 11).equals(Buffer.from([0x41, 0x49, 0x02])))
		{
			throw new Error('Expected a 64-bit little-endian type 2 AppImage');
		}

		// The type 2 runtime ends after its ELF section header table.
		const sectionOffset = header.readBigUInt64LE(40);
		const sectionSize = header.readUInt16LE(58);
		const sectionCount = header.readUInt16LE(60);
		const offset = sectionOffset + BigInt(sectionSize) * BigInt(sectionCount);

		if(sectionOffset < 64n || sectionSize !== 64 || sectionCount === 0 || offset > BigInt(Number.MAX_SAFE_INTEGER))
		{
			throw new Error('Invalid AppImage ELF section table');
		}

		const squashfsMagic = Buffer.alloc(4);
		const position = Number(offset);

		if(fs.readSync(file, squashfsMagic, 0, squashfsMagic.length, position) !== squashfsMagic.length
			|| squashfsMagic.toString('ascii') !== 'hsqs')
		{
			throw new Error(`SquashFS not found at AppImage offset ${position}`);
		}

		return position;
	}
	finally
	{
		fs.closeSync(file);
	}
}

module.exports = appImageOffset;
