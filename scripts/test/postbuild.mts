import fs from 'fs';

import {exists, existsRegex, fix, versions} from './build/exists.mjs';

const darwin = './dist/mac/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';
const darwinArm = './dist/mac-arm64/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';
const darwinMas = './dist/mas-universal/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';
const linux = './dist/linux-unpacked/resources/app.asar.unpacked/node_modules';
const linuxArm = './dist/linux-arm64-unpacked/resources/app.asar.unpacked/node_modules';
const windows = './dist/win-unpacked/resources/app.asar.unpacked/node_modules';
const windowsArm = './dist/win-arm64-unpacked/resources/app.asar.unpacked/node_modules';

let checkSome = false;

function native7zip(base: string, platform: string, arch: string)
{
	const path = `7zip-native/prebuilds/${platform}-${arch}/`;
	const engine = platform === 'win32' ? '7z.dll' : platform === 'darwin' ? 'lib7z.dylib' : '7z.so';

	exists(base, `${path}7zip_native.node`, fs.constants.R_OK);
	exists(base, `${path}${engine}`, fs.constants.R_OK);
}

if(process.platform == 'darwin')
{
	if(fs.existsSync(darwin))
	{
		// Node ZSTD All
		exists(darwin, '@toondepauw/node-zstd/index.js', fs.constants.R_OK, fix.ZSTD);
		exists(darwin, '@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK, fix.ZSTD);

		// Sharp x64
		exists(darwin, `@img/sharp-libvips-darwin-x64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_X64);
		existsRegex(darwin, '@img/sharp-darwin-x64/lib', /^sharp-darwin-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_X64);

		// 7zip-native
		native7zip(darwin, 'darwin', 'x64');

		// OpenComicAI
		exists(darwin, 'opencomic-ai-bin/mac/x64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwin, 'opencomic-ai-bin/mac/x64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwin, 'opencomic-ai-bin/mac/x64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(darwinArm))
	{
		// Node ZSTD All
		exists(darwinArm, '@toondepauw/node-zstd/index.js', fs.constants.R_OK, fix.ZSTD);
		exists(darwinArm, '@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK, fix.ZSTD);

		// Sharp arm64
		exists(darwinArm, `@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);
		existsRegex(darwinArm, '@img/sharp-darwin-arm64/lib', /^sharp-darwin-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);

		// 7zip-native
		native7zip(darwinArm, 'darwin', 'arm64');

		// OpenComicAI
		exists(darwinArm, 'opencomic-ai-bin/mac/arm64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinArm, 'opencomic-ai-bin/mac/arm64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinArm, 'opencomic-ai-bin/mac/arm64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(darwinMas))
	{
		// Node ZSTD All
		exists(darwinMas, '@toondepauw/node-zstd/index.js', fs.constants.R_OK, fix.ZSTD);
		exists(darwinMas, '@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK, fix.ZSTD);
		exists(darwinMas, '@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK, fix.ZSTD);

		// Sharp x64
		exists(darwinMas, `@img/sharp-libvips-darwin-x64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_X64);
		existsRegex(darwinMas, '@img/sharp-darwin-x64/lib', /^sharp-darwin-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_X64);

		// Sharp arm64
		exists(darwinMas, `@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);
		existsRegex(darwinMas, '@img/sharp-darwin-arm64/lib', /^sharp-darwin-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);

		// 7zip-native
		native7zip(darwinMas, 'darwin', 'arm64');
		native7zip(darwinMas, 'darwin', 'x64');

		// OpenComicAI
		exists(darwinMas, 'opencomic-ai-bin/mac/arm64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinMas, 'opencomic-ai-bin/mac/arm64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinMas, 'opencomic-ai-bin/mac/arm64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinMas, 'opencomic-ai-bin/mac/x64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinMas, 'opencomic-ai-bin/mac/x64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinMas, 'opencomic-ai-bin/mac/x64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}
}
else if(process.platform == 'linux')
{
	if(fs.existsSync(linux))
	{
		// Node ZSTD All
		exists(linux, '@toondepauw/node-zstd/index.js', fs.constants.R_OK, fix.ZSTD);
		exists(linux, '@toondepauw/node-zstd-linux-x64-gnu/node-zstd.linux-x64-gnu.node', fs.constants.R_OK, fix.ZSTD);

		// Sharp x64
		exists(linux, `@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.${versions.libvips}`, fs.constants.R_OK);
		existsRegex(linux, '@img/sharp-linux-x64/lib', /^sharp-linux-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK);

		// 7zip-native
		native7zip(linux, 'linux', 'x64');

		// OpenComicAI
		exists(linux, 'opencomic-ai-bin/linux/x64/realcugan/realcugan-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
		exists(linux, 'opencomic-ai-bin/linux/x64/waifu2x/waifu2x-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
		exists(linux, 'opencomic-ai-bin/linux/x64/upscayl/upscayl-bin', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(linuxArm))
	{
		// Node ZSTD All
		exists(linuxArm, '@toondepauw/node-zstd/index.js', fs.constants.R_OK, fix.ZSTD);
		exists(linuxArm, '@toondepauw/node-zstd-linux-arm64-gnu/node-zstd.linux-arm64-gnu.node', fs.constants.R_OK, fix.ZSTD);

		// Sharp arm64
		exists(linuxArm, `@img/sharp-libvips-linux-arm64/lib/libvips-cpp.so.${versions.libvips}`, fs.constants.R_OK);
		existsRegex(linuxArm, '@img/sharp-linux-arm64/lib', /^sharp-linux-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK);

		// 7zip-native
		native7zip(linuxArm, 'linux', 'arm64');

		// OpenComicAI
		exists(linuxArm, 'opencomic-ai-bin/linux/arm64/realcugan/realcugan-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
		exists(linuxArm, 'opencomic-ai-bin/linux/arm64/waifu2x/waifu2x-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
		exists(linuxArm, 'opencomic-ai-bin/linux/arm64/upscayl/upscayl-bin', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}
}
else if(process.platform == 'win32')
{
	if(fs.existsSync(windows))
	{
		// Node ZSTD All
		exists(windows, '@toondepauw/node-zstd-win32-x64-msvc/node-zstd.win32-x64-msvc.node', fs.constants.R_OK, fix.ZSTD);

		// Sharp x64
		exists(windows, '@img/sharp-win32-x64/lib/libvips-42.dll', fs.constants.R_OK);
		exists(windows, `@img/sharp-win32-x64/lib/libvips-cpp-${versions.libvips}.dll`, fs.constants.R_OK);
		existsRegex(windows, '@img/sharp-win32-x64/lib', /^sharp-win32-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK);

		// 7zip-native
		native7zip(windows, 'win32', 'x64');

		// OpenComicAI
		exists(windows, 'opencomic-ai-bin/win/x64/realcugan/realcugan-ncnn-vulkan.exe', fs.constants.X_OK | fs.constants.R_OK);
		exists(windows, 'opencomic-ai-bin/win/x64/waifu2x/waifu2x-ncnn-vulkan.exe', fs.constants.X_OK | fs.constants.R_OK);
		exists(windows, 'opencomic-ai-bin/win/x64/upscayl/upscayl-bin.exe', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(windowsArm))
	{
		// Node ZSTD All
		// exists(windowsArm, '@toondepauw/node-zstd-win32-x64-msvc/node-zstd.win32-x64-msvc.node', fs.constants.R_OK, fix.ZSTD);

		// Sharp arm64
		exists(windowsArm, '@img/sharp-win32-arm64/lib/libvips-42.dll', fs.constants.R_OK);
		exists(windowsArm, `@img/sharp-win32-arm64/lib/libvips-cpp-${versions.libvips}.dll`, fs.constants.R_OK);
		existsRegex(windowsArm, '@img/sharp-win32-arm64/lib', /^sharp-win32-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK);

		// 7zip-native
		native7zip(windowsArm, 'win32', 'arm64');

		// OpenComicAI
		exists(windowsArm, 'opencomic-ai-bin/win/arm64/upscayl/upscayl-bin.exe', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}
}

if(!checkSome)
	throw new Error('No folders have been checked');

console.log('Runed postbuild tests: Ok');
