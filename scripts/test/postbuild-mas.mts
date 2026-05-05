import fs from 'fs';

import {exists, existsRegex, fix, versions} from './build/exists.mjs';

const darwin = '/Applications/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';

if(process.platform == 'darwin')
{
	// Node ZSTD All
	exists(darwin, '@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK);
	exists(darwin, '@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK);

	// Sharp x64
	exists(darwin, `@img/sharp-libvips-darwin-x64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_X64);
	existsRegex(darwin, '@img/sharp-darwin-x64/lib', /^sharp-darwin-x64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_X64);

	// Sharp arm64
	exists(darwin, `@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.${versions.libvips}.dylib`, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);
	existsRegex(darwin, '@img/sharp-darwin-arm64/lib', /^sharp-darwin-arm64(?:-[0-9.]+)?\.node$/, fs.constants.R_OK, fix.sharp.MACOSS_ARM64);

	// 7zip
	exists(darwin, '7zip-bin-full/mac/arm64/7zz', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin, '7zip-bin-full/mac/x64/7zz', fs.constants.X_OK | fs.constants.R_OK);

	// 7zipc
	exists(darwin, '7zip-bin-full/mac/arm64/7zzc', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin, '7zip-bin-full/mac/x64/7zzc', fs.constants.X_OK | fs.constants.R_OK);

	// OpenComicAI
	exists(darwin, 'opencomic-ai-bin/mac/arm64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin, 'opencomic-ai-bin/mac/arm64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin, 'opencomic-ai-bin/mac/arm64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin, 'opencomic-ai-bin/mac/x64/realcugan/realcugan-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin, 'opencomic-ai-bin/mac/x64/waifu2x/waifu2x-ncnn-vulkan.app', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin, 'opencomic-ai-bin/mac/x64/upscayl/upscayl-bin.app', fs.constants.X_OK | fs.constants.R_OK);

	console.log('Runed postbuild mas tests: Ok');
}
