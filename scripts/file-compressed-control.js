var unzip = false, compressedFiles = {};

function returnFiles(path, all, fromCache, callback)
{
	sha = sha1(p.normalize(path));

	cacheFile = 'compressed-files-'+sha+'.json';

	json = cache.readFile(cacheFile);
	json = JSON.parse(json);

	mtime = Date.parse(fs.statSync(path).mtime);

	if(fromCache)
	{
		if(json)
		{
			if(json.mtime == mtime)
			{
				compressedFiles[sha] = json.files;
				callback((all) ? json.files : file.allToFirst(json.files));
				return true;
			}
		}
	}

	if(fs.existsSync(p.join(tempFolder, sha)))
	{
		files = file.returnAll(p.join(tempFolder, sha));
		compressedFiles[sha] = files;
		callback((all) ? files : file.allToFirst(files));
		return true;
	}
	else
	{
		if(inArray(fileExtension(path), compressedExtensions.zip))
		{
			if(!unzip) unzip = require('unzip2');

			fs.createReadStream(path).pipe(

				unzip.Extract({path: p.join(tempFolder, sha)}).on('close', function () {

					files = file.returnAll(p.join(tempFolder, sha));

					if(!json || json.mtime != mtime)
						cache.writeFile(cacheFile, JSON.stringify({mtime: mtime, files: files}));

					compressedFiles[sha] = files;

					callback((all) ? files : file.allToFirst(files));

				})
			);
		}
		return true;
	}
}

module.exports = {
	returnFiles: returnFiles,
};