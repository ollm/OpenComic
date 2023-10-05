const fs = require('fs'),
	p = require('path');

function loadLanguageMD(hbc, obj, onlyStructure = false)
{
	for(let key in obj)
	{
		if(Array.isArray(obj[key]))
		{
			hbc[key] = obj[key];
		}
		else if(typeof obj[key] == 'object')
		{
			if(!hbc[key])
				hbc[key] = {};

			loadLanguageMD(hbc[key], obj[key], onlyStructure);
		}
		else if(obj[key])
		{
			hbc[key] = onlyStructure ? '' : obj[key];
		}
	}
}

function fillLanguages()
{
	let base = {};
	loadLanguageMD(base, JSON.parse(fs.readFileSync('./languages/en.json', 'utf8')), true);
	loadLanguageMD(base, JSON.parse(fs.readFileSync('./languages/es.json', 'utf8')), true);

	let files = fs.readdirSync('./languages');

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];

		if(/\.json$/u.test(file) && !/languagesList/iu.test(file))
		{
			let _base = structuredClone(base);
			let path = p.join('./languages', file);

			let json = fs.readFileSync(path, 'utf8');

			loadLanguageMD(_base, JSON.parse(json), false);

			let newJson = JSON.stringify(_base, null, "\t");

			if(json !== newJson)
				fs.writeFileSync(path, newJson);
		}
	}
}

fillLanguages();