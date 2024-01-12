
function compressJsonCache()
{
	console.time('Migration: compressJsonCache');

	let files = fs.readdirSync(cache.folder);

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];

		if(/\.json$/.test(file))
		{
			let json = fs.readFileSync(p.join(cache.folder, file));
			json = JSON.parse(json);

			cache.writeJsonSync(file, json);
			fs.unlinkSync(p.join(cache.folder, file));
		}
	}

	console.timeEnd('Migration: compressJsonCache');
}

function start(data)
{
	let changes = data.config.changes;

	if(changes < 75)
		compressJsonCache();

	return data;
}

module.exports = {
	start: start,
	compressJsonCache: compressJsonCache,
};