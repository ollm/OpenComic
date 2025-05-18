const fs = require('fs');

function exists(path, permissions = false, fix = false)
{
	if(!fs.existsSync(path))
		throw new Error('Not exists! '+path+(fix ? '\n\nTry: '+fix : '')+'\n');

	if(permissions !== false)
	{
		try
		{
			fs.accessSync(path, permissions);
		}
		catch (err)
		{
			throw new Error('No access! '+path);
		}
	}
}

const darwin = './dist/mac/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';
const darwinArm = './dist/mac-arm/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';
const darwinMas = './dist/mas-universal/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';
const linux = './dist/linux-unpacked/resources/app.asar.unpacked/node_modules';
const linuxArm = './dist/linux-arm64-unpacked/resources/app.asar.unpacked/node_modules';
const windows = './dist/win-unpacked/resources/app.asar.unpacked/node_modules';
const windowsArm = './dist/win-arm64-unpacked/resources/app.asar.unpacked/node_modules';

let checkSome = false;

if(process.platform == 'darwin')
{
	if(fs.existsSync(darwin))
	{
		// Node ZSTD All
		exists(darwin+'/@toondepauw/node-zstd/index.js', fs.constants.R_OK);
		exists(darwin+'/@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK);

		// Sharp x64
		exists(darwin+'/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.16.1.dylib', fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp');
		exists(darwin+'/@img/sharp-darwin-x64/lib/sharp-darwin-x64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp');

		// 7zip
		exists(darwin+'/7zip-bin/mac/x64/7zz', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(darwinArm))
	{
		// Node ZSTD All
		exists(darwinArm+'/@toondepauw/node-zstd/index.js', fs.constants.R_OK);
		exists(darwinArm+'/@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK);

		// Sharp arm64
		exists(darwinArm+'/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.16.1.dylib', fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp');
		exists(darwinArm+'/@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp');

		// 7zip
		exists(darwinArm+'/7zip-bin/mac/arm64/7zz', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(darwinMas))
	{
		// Node ZSTD All
		exists(darwinMas+'/@toondepauw/node-zstd/index.js', fs.constants.R_OK);
		exists(darwinMas+'/@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK);
		exists(darwinMas+'/@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK);

		// Sharp x64
		exists(darwinMas+'/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.16.1.dylib', fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp');
		exists(darwinMas+'/@img/sharp-darwin-x64/lib/sharp-darwin-x64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp');

		// Sharp arm64
		exists(darwinMas+'/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.16.1.dylib', fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp');
		exists(darwinMas+'/@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp');

		// 7zip
		exists(darwinMas+'/7zip-bin/mac/arm64/7zz', fs.constants.X_OK | fs.constants.R_OK);
		exists(darwinMas+'/7zip-bin/mac/x64/7zz', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}
}
else if(process.platform == 'linux')
{
	if(fs.existsSync(linux))
	{
		// Node ZSTD All
		exists(linux+'/@toondepauw/node-zstd/index.js', fs.constants.R_OK);
		exists(linux+'/@toondepauw/node-zstd-linux-x64-gnu/node-zstd.linux-x64-gnu.node', fs.constants.R_OK);

		// Sharp x64
		exists(linux+'/@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.8.16.1', fs.constants.R_OK);
		exists(linux+'/@img/sharp-linux-x64/lib/sharp-linux-x64.node', fs.constants.X_OK | fs.constants.R_OK);

		// 7zip
		exists(linux+'/7zip-bin/linux/x64/7zz', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(linuxArm))
	{
		// Node ZSTD All
		exists(linuxArm+'/@toondepauw/node-zstd/index.js', fs.constants.R_OK);
		exists(linuxArm+'/@toondepauw/node-zstd-linux-arm64-gnu/node-zstd.linux-arm64-gnu.node', fs.constants.R_OK);

		// Sharp arm64
		exists(linuxArm+'/@img/sharp-libvips-linux-arm64/lib/libvips-cpp.so.8.16.1', fs.constants.R_OK);
		exists(linuxArm+'/@img/sharp-linux-arm64/lib/sharp-linux-arm64.node', fs.constants.X_OK | fs.constants.R_OK);

		// 7zip
		exists(linuxArm+'/7zip-bin/linux/arm64/7zz', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}
}
else if(process.platform == 'win32')
{
	if(fs.existsSync(windows))
	{
		// Node ZSTD All
		exists(windows+'/@toondepauw/node-zstd-win32-x64-msvc/node-zstd.win32-x64-msvc.node', fs.constants.R_OK);

		// Sharp x64
		exists(windows+'/@img/sharp-win32-x64/lib/libvips-42.dll', fs.constants.R_OK);
		exists(windows+'/@img/sharp-win32-x64/lib/libvips-cpp-8.16.1.dll', fs.constants.R_OK);
		exists(windows+'/@img/sharp-win32-x64/lib/sharp-win32-x64.node', fs.constants.X_OK | fs.constants.R_OK);

		// 7zip
		exists(windows+'/7zip-bin/win/x64/7z.exe', fs.constants.X_OK | fs.constants.R_OK);
		exists(windows+'/7zip-bin/win/x64/7z.dll', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}

	if(fs.existsSync(windowsArm))
	{
		// Node ZSTD All
		exists(windows+'/@toondepauw/node-zstd-win32-x64-msvc/node-zstd.win32-x64-msvc.node', fs.constants.R_OK);

		// Sharp arm64
		exists(windows+'/@img/sharp-win32-arm64/lib/libvips-42.dll', fs.constants.R_OK);
		exists(windows+'/@img/sharp-win32-arm64/lib/libvips-cpp-8.16.1.dll', fs.constants.R_OK);
		exists(windows+'/@img/sharp-win32-arm64/lib/sharp-win32-arm64.node', fs.constants.X_OK | fs.constants.R_OK);

		// 7zip
		exists(windows+'/7zip-bin/win/arm64/7z.exe', fs.constants.X_OK | fs.constants.R_OK);
		exists(windows+'/7zip-bin/win/arm64/7z.dll', fs.constants.X_OK | fs.constants.R_OK);

		checkSome = true;
	}
}

if(!checkSome)
	throw new Error('No folders have been checked');

console.log('Runed postbuild tests: Ok');