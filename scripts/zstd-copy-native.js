const fs = require('fs');

if(process.platform == 'darwin')
{
	fs.cpSync('./build/node-zstd-native-dependencies/node_modules/@toondepauw/node-zstd-darwin-x64', './node_modules/@toondepauw/node-zstd-darwin-x64', {recursive: true});
	fs.cpSync('./build/node-zstd-native-dependencies/node_modules/@toondepauw/node-zstd-darwin-arm64', './node_modules/@toondepauw/node-zstd-darwin-arm64', {recursive: true});
}
else if(process.platform == 'linux')
{
	fs.cpSync('./build/node-zstd-native-dependencies/node_modules/@toondepauw/node-zstd-linux-x64-gnu', './node_modules/@toondepauw/node-zstd-linux-x64-gnu', {recursive: true});
	fs.cpSync('./build/node-zstd-native-dependencies/node_modules/@toondepauw/node-zstd-linux-arm64-gnu', './node_modules/@toondepauw/node-zstd-linux-arm64-gnu', {recursive: true});
}