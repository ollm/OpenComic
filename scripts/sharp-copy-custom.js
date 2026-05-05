const fs = require('fs');

const files = fs.readdirSync('./node_modules/@img-custom');

for(const file of files)
{
	if(!/^sharp/.test(file))
		continue;

	const source = './node_modules/@img-custom/'+file;
	const dest = './node_modules/@img/'+file;

	if(fs.existsSync(dest))
		fs.rmSync(dest, {recursive: true});

	fs.cpSync(source, dest, {recursive: true});
}

fs.rmSync('./node_modules/@img-custom', {recursive: true});