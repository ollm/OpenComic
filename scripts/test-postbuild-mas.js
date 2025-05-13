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

const darwin = '/Applications/OpenComic.app/Contents/Resources/app.asar.unpacked/node_modules';

if(process.platform == 'darwin')
{
	// Node ZSTD All
	exists(darwin+'/@toondepauw/node-zstd-darwin-x64/node-zstd.darwin-x64.node', fs.constants.R_OK);
	exists(darwin+'/@toondepauw/node-zstd-darwin-arm64/node-zstd.darwin-arm64.node', fs.constants.R_OK);

	// Sharp x64
	exists(darwin+'/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.16.1.dylib', fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp');
	exists(darwin+'/@img/sharp-darwin-x64/lib/sharp-darwin-x64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=x64 --os=darwin sharp');

	// Sharp arm64
	exists(darwin+'/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.16.1.dylib', fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp');
	exists(darwin+'/@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node', fs.constants.X_OK | fs.constants.R_OK, 'npm install --cpu=arm64 --os=darwin sharp');

	// 7zip
	exists(darwin+'/7zip-bin/mac/arm64/7zz', fs.constants.X_OK | fs.constants.R_OK);
	exists(darwin+'/7zip-bin/mac/x64/7zz', fs.constants.X_OK | fs.constants.R_OK);

	console.log('Runed postbuild mas tests: Ok');
}