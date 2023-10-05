const p = require('path'),
	app = require('../app.js'),
	fileManager = require('../file-manager.js');

var files = [], indexFinished = false;

async function _indexFiles(file, mainPath)
{
	if(!filesHas[file.path])
	{
		filesHas[file.path] = true;

		files.push({
			name: file.name,
			path: file.path,
			mainPath: mainPath,
			folder: file.folder,
			compressed: file.compressed,
		});

		if(file.folder || file.compressed)
		{
			let _files;

			if(file.files)
			{
				_files = file.files;
			}
			else
			{
				let _file = fileManager.file(file.path);
				_files = await _file.read({sha: false});
				delete file;
			}

			for(let i = 0, len = _files.length; i < len; i++)
			{
				let _file = _files[i];
				await _indexFiles(_file, mainPath);
			}
		}
	}
}

async function indexFiles(currentFiles)
{
	files = [];
	filesHas = {};

	for(let i = 0, len = currentFiles.length; i < len; i++)
	{
		let file = currentFiles[i];
		await _indexFiles(file, file.mainPath);
	}

	return files;
}

onmessage = async function(event) {

	let data = event.data;

	if(data.type == 'files')
	{
		self.postMessage(await indexFiles(data.files));
	}
	else if(data.type == 'files')
	{
		self.postMessage(await indexFiles(data.files));
	}
};