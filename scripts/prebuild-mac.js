const fs = require('fs');

function change(path, search, replacement, fix = false)
{
	if(!fs.existsSync(path))
		throw new Error('Not exists! '+path+(fix ? '\n\nTry: '+fix : '')+'\n');

	let buffer = fs.readFileSync(path);

	search = Buffer.from(search, 'utf8');
	replacement = Buffer.from(replacement, 'utf8');

	let offset = 0;

	while ((offset = buffer.indexOf(search, offset)) !== -1)
	{
	    replacement.copy(buffer, offset);
	    offset += search.length;
	}

	fs.writeFileSync(path, buffer);
}

const FIX_ZSTD = 'npm install --force --prefix ./build/node-zstd-native-dependencies && node scripts/zstd-copy-native.js';

const FIX_SHARP = {
	LINUX_X64: 'npm install @img/sharp-libvips-linuxmusl-x64 @img/sharp-libvips-linux-x64 @img/sharp-linuxmusl-x64 @img/sharp-linux-x64 --force',
	LINUX_ARM64: 'npm install @img/sharp-libvips-linux-arm64 @img/sharp-libvips-linuxmusl-arm64 @img/sharp-linux-arm64 @img/sharp-linuxmusl-arm64 --force',
	MACOSS_X64: 'npm install @img/sharp-darwin-x64 @img/sharp-libvips-darwin-x64 --force',
	MACOSS_ARM64: 'npm install @img/sharp-darwin-arm64 @img/sharp-libvips-darwin-arm64 --force',
	WIN32_X64: 'npm install --cpu=x64 --os=win32 sharp',
	WIN32_ARM64: 'npm install --cpu=arm64 --os=win32 sharp',
};

const store = process.argv.includes('--store');

// Rename any references to the non-public or deprecated APIs identified below for App Store guidelines.
if(store)
{
	// Sharp x64
	change('./node_modules/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.17.3.dylib', '_CTFontCopyDefaultCascadeList', 'DCTFontCopyDefaultCascadeList', FIX_SHARP.MACOSS_X64);

	// Sharp arm64
	change('./node_modules/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.17.3.dylib', '_CTFontCopyDefaultCascadeList', 'DCTFontCopyDefaultCascadeList', FIX_SHARP.MACOSS_ARM64);
}
else
{
	// Sharp x64
	change('./node_modules/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.17.3.dylib', 'DCTFontCopyDefaultCascadeList', '_CTFontCopyDefaultCascadeList', FIX_SHARP.MACOSS_X64);

	// Sharp arm64
	change('./node_modules/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.17.3.dylib', 'DCTFontCopyDefaultCascadeList', '_CTFontCopyDefaultCascadeList', FIX_SHARP.MACOSS_ARM64);
}

console.log('Runed tests: Ok');