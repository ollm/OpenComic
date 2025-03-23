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

if(process.platform == 'darwin')
{
	// Node ZSTD All
	exists('./node_modules/@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK);
	exists('./node_modules/@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK);

	// Sharp x64
	exists('./node_modules/sharp-34/node_modules/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.15.5.dylib', fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp-34@npm:sharp@0.34.0-rc.0');
	exists('./node_modules/sharp-34/node_modules/@img/sharp-darwin-x64/lib/sharp-darwin-x64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp-34@npm:sharp@0.34.0-rc.0');

	// Sharp arm64
	exists('./node_modules/sharp-34/node_modules/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.15.5.dylib', fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp-34@npm:sharp@0.34.0-rc.0');
	exists('./node_modules/sharp-34/node_modules/@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp-34@npm:sharp@0.34.0-rc.0');

	// 7zip
	exists('./node_modules/7zip-bin/mac/arm64/7za', fs.constants.X_OK | fs.constants.R_OK);
	exists('./node_modules/7zip-bin/mac/x64/7za', fs.constants.X_OK | fs.constants.R_OK);
}
else if(process.platform == 'linux')
{	
	// Node ZSTD All
	exists('./node_modules/@toondepauw/node-zstd-linux-x64-gnu/node-zstd.linux-x64-gnu.node', fs.constants.R_OK);
	exists('./node_modules/@toondepauw/node-zstd-linux-arm64-gnu/node-zstd.linux-arm64-gnu.node', fs.constants.R_OK);

	// Sharp x64
	exists('./node_modules/sharp-34/node_modules/@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.8.16.1', fs.constants.R_OK);
	exists('./node_modules/sharp-34/node_modules/@img/sharp-linux-x64/lib/sharp-linux-x64.node', fs.constants.X_OK | fs.constants.R_OK);

	// Sharp arm64
	exists('./node_modules/sharp-34/node_modules/@img/sharp-libvips-linux-arm64/lib/libvips-cpp.so.8.16.1', fs.constants.R_OK, 'npm install --cpu=arm64 --os=linux --libc=glibc sharp-34@npm:sharp@0.34.0-rc.0');
	exists('./node_modules/sharp-34/node_modules/@img/sharp-linux-arm64/lib/sharp-linux-arm64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=arm64 --os=linux --libc=glibc sharp-34@npm:sharp@0.34.0-rc.0');

	// 7zip
	exists('./node_modules/7zip-bin/linux/arm/7za', fs.constants.X_OK | fs.constants.R_OK);
	exists('./node_modules/7zip-bin/linux/arm64/7za', fs.constants.X_OK | fs.constants.R_OK);
	exists('./node_modules/7zip-bin/linux/ia32/7za', fs.constants.X_OK | fs.constants.R_OK);
	exists('./node_modules/7zip-bin/linux/x64/7za', fs.constants.X_OK | fs.constants.R_OK);
}
else if(process.platform == 'win32')
{
	// Node ZSTD All
	exists('./node_modules/@toondepauw/node-zstd-win32-x64-msvc/node-zstd.win32-x64-msvc.node', fs.constants.R_OK);

	// Sharp x64
	exists('./node_modules/sharp-34/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll', fs.constants.R_OK);
	exists('./node_modules/sharp-34/node_modules/@img/sharp-win32-x64/lib/libvips-cpp-8.16.1.dll', fs.constants.R_OK);
	exists('./node_modules/sharp-34/node_modules/@img/sharp-win32-x64/lib/sharp-win32-x64.node', fs.constants.X_OK | fs.constants.R_OK);

	// 7zip
	exists('./node_modules/7zip-bin/win/x64/7za.exe', fs.constants.X_OK | fs.constants.R_OK);
}

console.log('Runed tests: Ok');