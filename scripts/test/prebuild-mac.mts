import {change, fix, versions} from './build/exists.mjs';

const store = process.argv.includes('--store');

const BASE = './node_modules';

// Rename any references to the non-public or deprecated APIs identified below for App Store guidelines.
if(store)
{
	// Sharp x64
	change(BASE, `@img/sharp-libvips-darwin-x64/lib/libvips-cpp.${versions.libvips}.dylib`, '_CTFontCopyDefaultCascadeList', 'DCTFontCopyDefaultCascadeList', fix.sharp.MACOSS_X64);

	// Sharp arm64
	change(BASE, `@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.${versions.libvips}.dylib`, '_CTFontCopyDefaultCascadeList', 'DCTFontCopyDefaultCascadeList', fix.sharp.MACOSS_ARM64);
}
else
{
	// Sharp x64
	change(BASE, `@img/sharp-libvips-darwin-x64/lib/libvips-cpp.${versions.libvips}.dylib`, 'DCTFontCopyDefaultCascadeList', '_CTFontCopyDefaultCascadeList', fix.sharp.MACOSS_X64);

	// Sharp arm64
	change(BASE, `@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.${versions.libvips}.dylib`, 'DCTFontCopyDefaultCascadeList', '_CTFontCopyDefaultCascadeList', fix.sharp.MACOSS_ARM64);
}

console.log('Runed tests: Ok');
