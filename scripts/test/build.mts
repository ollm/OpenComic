import fs from 'fs';

import {exists, existsRegex, fix, versions} from './build/exists.mjs';

const BASE = './node_modules/';

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
	existsRegex(BASE, '@img/sharp-darwin-arm64/lib/', /^sharp-darwin-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);

	// 7zip
	exists(BASE, '7zip-bin-full/mac/arm64/7zz', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/mac/x64/7zz', fs.constants.X_OK | fs.constants.R_OK);

	// 7zipc
	exists(BASE, '7zip-bin-full/mac/arm64/7zzc', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/mac/x64/7zzc', fs.constants.X_OK | fs.constants.R_OK);

	// OpenComicAI
	exists(BASE, 'opencomic-ai-bin/mac/arm64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/mac/arm64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/mac/arm64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/mac/x64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/mac/x64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/mac/x64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);

}
else if(process.platform == 'linux')
{
	// Node ZSTD All
	exists(BASE, '@toondepauw/node-zstd-linux-x64-gnu/node-zstd.linux-x64-gnu.node', fs.constants.R_OK, fix.ZSTD);
	exists(BASE, '@toondepauw/node-zstd-linux-arm64-gnu/node-zstd.linux-arm64-gnu.node', fs.constants.R_OK, fix.ZSTD);

	// Sharp x64
	exists(BASE, `@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.${versions.libvips}`, fs.constants.R_OK, fix.sharp.LINUX_X64);
	existsRegex(BASE, '@img/sharp-linux-x64/lib/', /^sharp-linux-x64(?:-[0-9.]+)?\.node/, fs.constants.R_OK, fix.sharp.LINUX_X64);

	// Sharp arm64
	exists(BASE, `@img/sharp-libvips-linux-arm64/lib/libvips-cpp.so.${versions.libvips}`, fs.constants.R_OK, fix.sharp.LINUX_ARM64);
	existsRegex(BASE, '@img/sharp-linux-arm64/lib/', /^sharp-linux-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.LINUX_ARM64);

	// 7zip
	exists(BASE, '7zip-bin-full/linux/arm/7zz', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/linux/arm64/7zz', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/linux/ia32/7zz', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/linux/x64/7zz', fs.constants.X_OK | fs.constants.R_OK);

	// 7zip
	exists(BASE, '7zip-bin-full/linux/arm/7zzc', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/linux/arm64/7zzc', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/linux/ia32/7zzc', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/linux/x64/7zzc', fs.constants.X_OK | fs.constants.R_OK);

	// OpenComicAI
	exists(BASE, 'opencomic-ai-bin/linux/arm64/realcugan/realcugan-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/linux/arm64/waifu2x/waifu2x-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/linux/arm64/upscayl/upscayl-bin', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/linux/x64/realcugan/realcugan-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/linux/x64/waifu2x/waifu2x-ncnn-vulkan', fs.constants.X_OK | fs.constants.R_OK);
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

	// 7zip
	exists(BASE, '7zip-bin-full/win/x64/7z.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/win/x64/7z.dll', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/win/arm64/7z.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/win/arm64/7z.dll', fs.constants.X_OK | fs.constants.R_OK);

	// 7zipc
	exists(BASE, '7zip-bin-full/win/x64/7zc/7z.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/win/x64/7zc/7z.dll', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/win/arm64/7zc/7z.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, '7zip-bin-full/win/arm64/7zc/7z.dll', fs.constants.X_OK | fs.constants.R_OK);

	// OpenComicAI
	exists(BASE, 'opencomic-ai-bin/win/x64/realcugan/realcugan-ncnn-vulkan.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/win/x64/waifu2x/waifu2x-ncnn-vulkan.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/win/x64/upscayl/upscayl-bin.exe', fs.constants.X_OK | fs.constants.R_OK);
	exists(BASE, 'opencomic-ai-bin/win/arm64/upscayl/upscayl-bin.exe', fs.constants.X_OK | fs.constants.R_OK);
}

console.log('Runed build tests: Ok');
