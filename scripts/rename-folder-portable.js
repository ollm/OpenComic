const fs = require('fs'),
	p = require('path');

const dist = p.join(__dirname, '../dist');
const files = fs.readdirSync(dist);

function sleep(ms)
{
	return new Promise(function(resolve){
		setTimeout(resolve, ms)
	});
}

async function renameWithRetry(oldPath, newPath)
{
	for(let i = 0; i < 5; i++)
	{
		try
		{
			if(fs.existsSync(newPath)) fs.unlinkSync(newPath);
			fs.renameSync(oldPath, newPath);

			return;
		}
		catch (err)
		{
			if(i === 4)
				throw err;

			await sleep(100);
		}
	}
}

for(const file of files)
{
	if(/^OpenComic ([0-9.]+)\.exe$/.test(file))
	{
		renameWithRetry(p.join(dist, file), p.join(dist, file.replace(/^OpenComic ([0-9.]+)\.exe$/, 'OpenComic Folder Portable $1.exe')));
	}
}
