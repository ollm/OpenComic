const fs = require('fs');

function exists(path, permissions = false, fix = false)
{
	if(!fs.existsSync(path))
		throw new Error('Not exists! '+path+(fix ? '\nTry "'+fix+'"' : '')+'\n');

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

const linux = './dist/linux-unpacked/resources/app.asar.unpacked/node_modules';
const linuxArm = './dist/linux-arm64-unpacked/resources/app.asar.unpacked/node_modules';

if(process.platform == 'darwin')
{


}
else if(process.platform == 'linux')
{
	if(fs.existsSync('./dist/linux-unpacked/'))
	{
		// Node ZSTD All
		exists(linux+'/@toondepauw/node-zstd/index.js', fs.constants.R_OK);
		exists(linux+'/@toondepauw/node-zstd/node_modules/@toondepauw/node-zstd-linux-x64-gnu/node-zstd.linux-x64-gnu.node', fs.constants.R_OK);

		// Sharp x64
		exists(linux+'/@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.42', fs.constants.R_OK);
		exists(linux+'/@img/sharp-linux-x64/lib/sharp-linux-x64.node', fs.constants.X_OK | fs.constants.R_OK);

		// 7zip
		exists(linux+'/7zip-bin/linux/x64/7za', fs.constants.X_OK | fs.constants.R_OK);
	}

	if(fs.existsSync('./dist/linux-arm64-unpacked/'))
	{
		// Node ZSTD All
		exists(linuxArm+'/@toondepauw/node-zstd/index.js', fs.constants.R_OK);
		exists(linuxArm+'/@toondepauw/node-zstd/node_modules/@toondepauw/node-zstd-linux-arm64-gnu/node-zstd.linux-arm64-gnu.node', fs.constants.R_OK);

		// Sharp arm64
		exists(linuxArm+'/@img/sharp-libvips-linux-arm64/lib/libvips-cpp.so.42', fs.constants.R_OK);
		exists(linuxArm+'/@img/sharp-linux-arm64/lib/sharp-linux-arm64.node', fs.constants.X_OK | fs.constants.R_OK);

		// 7zip
		exists(linuxArm+'/7zip-bin/linux/arm64/7za', fs.constants.X_OK | fs.constants.R_OK);
	}
}
else if(process.platform == 'win32')
{

}

console.log('Runed postbuild tests: Ok');