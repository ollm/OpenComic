const fs = require('fs'),
	p = require('path');

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

const dist = p.join(__dirname, '../dist');
const files = fs.readdirSync(dist);

const type = process.argv[2];

switch(type)
{
	case 'portable':

		for(const file of files)
		{
			if(/^OpenComic ([0-9.]+)\.exe$/.test(file))
			{
				renameWithRetry(p.join(dist, file), p.join(dist, file.replace(/^OpenComic ([0-9.]+)\.exe$/, 'OpenComic Portable $1.exe')));
			}
		}

		break;

	case 'folder-portable':

		for(const file of files)
		{
			if(/^OpenComic ([0-9.]+)\.exe$/.test(file))
			{
				renameWithRetry(p.join(dist, file), p.join(dist, file.replace(/^OpenComic ([0-9.]+)\.exe$/, 'OpenComic Folder Portable $1.exe')));
			}
			else if(/^OpenComic\-([0-9.]+)\-win\.7z$/.test(file))
			{
				renameWithRetry(p.join(dist, file), p.join(dist, file.replace(/^OpenComic\-([0-9.]+)\-win\.7z$/, 'OpenComic-Folder-Portable-$1.7z')));
			}
		}

		break;

	case 'win-arm':

		for(const file of files)
		{
			if(/^OpenComic Setup ([0-9.]+)\.exe$/.test(file))
			{
				renameWithRetry(p.join(dist, file), p.join(dist, file.replace(/^OpenComic Setup ([0-9.]+)\.exe$/, 'OpenComic Setup $1 arm64.exe')));
			}
		}

		break;
}