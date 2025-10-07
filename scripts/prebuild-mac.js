const fs = require('fs');

function change(path, search, replacement)
{
	if(!fs.existsSync(path))
		throw new Error('Not exists! '+path+'\n');

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

const store = process.argv.includes('--store');

// Rename any references to the non-public or deprecated APIs identified below for App Store guidelines.
if(store)
{
	// Sharp x64
	change('./node_modules/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.17.2.dylib', '_CTFontCopyDefaultCascadeList', 'DCTFontCopyDefaultCascadeList');

	// Sharp arm64
	change('./node_modules/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.17.2.dylib', '_CTFontCopyDefaultCascadeList', 'DCTFontCopyDefaultCascadeList');
}
else
{
	// Sharp x64
	change('./node_modules/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.17.2.dylib', 'DCTFontCopyDefaultCascadeList', '_CTFontCopyDefaultCascadeList');

	// Sharp arm64
	change('./node_modules/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.17.2.dylib', 'DCTFontCopyDefaultCascadeList', '_CTFontCopyDefaultCascadeList');
}

console.log('Runed tests: Ok');