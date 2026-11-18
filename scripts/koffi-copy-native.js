const fs = require('fs'),
	p = require('path');

if(process.platform == 'linux')
{
	const sourceRoot = p.join(__dirname, '../build/koffi-native-dependencies/node_modules/@koromix');
	const destination = p.join(__dirname, '../node_modules/@koromix');

	fs.mkdirSync(destination, {recursive: true});

	for(const arch of ['x64', 'arm64'])
	{
		const name = `koffi-linux-${arch}`;
		const source = p.join(sourceRoot, name);

		if(!fs.existsSync(source))
			throw new Error(`Missing Koffi prebuild package: ${source}`);

		fs.cpSync(source, p.join(destination, name), {recursive: true});
	}
}
