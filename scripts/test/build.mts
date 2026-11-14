import fs from 'fs';

import {exists, existsRegex, fix, versions, printErrors} from './build/exists.mjs';

const BASE = './node_modules/';

function native7zip(arch: string)
{
	const path = `7zip-native/prebuilds/${process.platform}-${arch}/`;
	const engine = process.platform === 'win32' ? '7z.dll' : process.platform === 'darwin' ? 'lib7z.dylib' : '7z.so';

	exists(BASE, `${path}7zip_native.node`, fs.constants.R_OK);
	exists(BASE, `${path}${engine}`, fs.constants.R_OK);
}

if(process.platform == 'darwin')
{
	// Node ZSTD All
	exists(BASE, '@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK, fix.ZSTD);
	exists(BASE, '@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK, fix.ZSTD);

	// Sharp x64
	exists(BASE, `@img/sharp-libvips-darwin-x64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_X64);
	existsRegex(BASE, '@img/sharp-darwin-x64/lib/', /^sharp-darwin-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_X64);

	// Sharp arm64
	exists(BASE, `@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);
	existsRegex(BASE, '@img/sharp-darwin-arm64/lib/', /^sharp-darwin-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);

	// 7zip-native
	native7zip('arm64');
	native7zip('x64');

	// OpenComicAI
	exists(BASE, 'opencomic-ai-bin/mac/arm64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/mac/x64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);

}
else if(process.platform == 'linux')
{
	// Node ZSTD All
	exists(BASE, '@toondepauw/node-zstd-linux-x64-gnu/node-zstd.linux-x64-gnu.node', fs.constants.R_OK, fix.ZSTD);
	exists(BASE, '@toondepauw/node-zstd-linux-arm64-gnu/node-zstd.linux-arm64-gnu.node', fs.constants.R_OK, fix.ZSTD);

	// Sharp x64
	exists(BASE, `@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.${versions.libvips}`, fs.constants.R_OK, fix.sharp.LINUX_X64);
	existsRegex(BASE, '@img/sharp-linux-x64/lib/', /^sharp-linux-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.LINUX_X64);

	// Sharp arm64
	exists(BASE, `@img/sharp-libvips-linux-arm64/lib/libvips-cpp.so.${versions.libvips}`, fs.constants.R_OK, fix.sharp.LINUX_ARM64);
	existsRegex(BASE, '@img/sharp-linux-arm64/lib/', /^sharp-linux-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.LINUX_ARM64);

	// 7zip-native
	native7zip('arm');
	native7zip('arm64');
	native7zip('ia32');
	native7zip('x64');

	// OpenComicAI
	exists(BASE, 'opencomic-ai-bin/linux/arm64/upscayl/upscayl-bin', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/linux/x64/upscayl/upscayl-bin', fs.constants.X_OK | fs.constants.R_OK);
}
else if(process.platform == 'win32')
{
	// Node ZSTD All
	exists(BASE, '@toondepauw/node-zstd-win32-x64-msvc/node-zstd.win32-x64-msvc.node', fs.constants.R_OK, fix.ZSTD);

	// Sharp x64
	exists(BASE, '@img/sharp-win32-x64/lib/libvips-42.dll', fs.constants.R_OK);
	exists(BASE, `@img/sharp-win32-x64/lib/libvips-cpp-${versions.libvips}.dll`, fs.constants.R_OK);
	existsRegex(BASE, '@img/sharp-win32-x64/lib/', /^sharp-win32-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK);

	// Sharp arm64
	exists(BASE, '@img/sharp-win32-arm64/lib/libvips-42.dll', fs.constants.R_OK, fix.sharp.WIN32_ARM64);
	exists(BASE, `@img/sharp-win32-arm64/lib/libvips-cpp-${versions.libvips}.dll`, fs.constants.R_OK, fix.sharp.WIN32_ARM64);
	existsRegex(BASE, '@img/sharp-win32-arm64/lib/', /^sharp-win32-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.WIN32_ARM64);

	// 7zip-native
	native7zip('x64');
	native7zip('arm64');

	// OpenComicAI
	exists(BASE, 'opencomic-ai-bin/win/x64/upscayl/upscayl-bin.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/win/arm64/upscayl/upscayl-bin.exe', fs.constants.X_OK | fs.constants.R_OK);
}

printErrors();

console.log('Runed build tests: Ok');
