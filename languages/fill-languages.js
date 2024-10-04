const fs = require('fs'),
	p = require('path');

var languagesPercentage = {}, percentage = {};

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

			percentage.total++;
			percentage.translated++;
		}
		else
		{
			percentage.total++;
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

			percentage = {
				total: 0,
				translated: 0,
			};

			loadLanguageMD(_base, JSON.parse(json), false);

			percentage.percentage = percentage.translated / percentage.total * 100;
			languagesPercentage[file] = percentage;

			let newJson = JSON.stringify(_base, null, "\t");

			if(json !== newJson)
				fs.writeFileSync(path, newJson);
		}
	}
}

var colors = {
	100: '#2777e7',
	80: '#009700',
	60: '#5ab900',
	40: '#f1cc09',
	20: '#ff9100',
	0: '#dc2800',
};

function getColor(percentage)
{
	if(percentage >= 100)
		return '#3388ff';
	else if(percentage >= 66)
		return '#2eccaa';
	else if(percentage >= 33)
		return '#f1cc09';
	else
		return '#f6664c';
}

function generateGraph()
{
	let languagesSVG = '';
	let index = 0;

	for(let key in languagesPercentage)
	{
		if(key !== 'empty.json')
		{
			const percentage = languagesPercentage[key].percentage;
			const color = getColor(percentage);
			const height = percentage * 1.4;

			languagesSVG += '		<text style="font-size: 11px; font-family: monospace; letter-spacing: 1.5px; fill: #888; text-anchor: end;" x="-150" y="'+(index * 18 + 16)+'" transform="rotate(-90)">'+key.replace(/\.json/, '').toUpperCase()+'</text>\n';
			languagesSVG += '		<rect style="fill: '+color+';" height="'+height+'" width="6" rx="2" y="'+(140 - height)+'" x="'+(index * 18 + 10)+'" />\n';

			index++;
		}
	}

	let svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+(index * 18 + 8)+'" height="220">\n	<g>\n'+languagesSVG+'	</g>\n</svg>';

	fs.writeFileSync('./images/translated.svg', svg);
}

function generateMD()
{
	const languagesList = JSON.parse(fs.readFileSync('./languages/languagesList.json', 'utf8'));

	let num = 0;

	for(let key in languagesPercentage)
	{
		if(key !== 'empty.json')
			num++;
	}

	let markdown = '\n\OpenComic has translations into '+num+' languages.\n\n';

	for(let key in languagesPercentage)
	{
		if(key !== 'empty.json')
		{
			const lang = key.replace(/\.json/, '');
			const percentage = Math.round(languagesPercentage[key].percentage * 10) / 10;
			const color = getColor(percentage);

			markdown += '### '+languagesList[lang].nativeName+'\n\n['+key+'](https://github.com/ollm/OpenComic/blob/master/languages/'+key+')\n\n`'+percentage+'% | Remain '+(languagesPercentage[key].total - languagesPercentage[key].translated)+' | Translated '+languagesPercentage[key].translated+'`\n\n';
			markdown += '<a href="https://github.com/ollm/OpenComic/blob/master/languages/'+key+'"><img src="https://raw.githubusercontent.com/ollm/OpenComic/master/images/translated/'+lang+'.svg" /></a>\n\n\n';

			let svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="830" height="10">\n	<g>';
			svg += '\n		<rect style="fill: #ddd;" height="10" width="830" rx="4" y="0" x="0" />';
			svg += '\n		<rect style="fill: '+color+';" height="10" width="'+(percentage * 8.3)+'" rx="4" y="0" x="0" />';
			svg += '\n	</g>\n</svg>';

			fs.writeFileSync('./images/translated/'+lang+'.svg', svg);
		}
	}


	let md = fs.readFileSync('./TRANSLATE.md', 'utf8');
	md = md.replace(/\<!-- translation --\>\<!-- translation --\>[\s\S]*/, '<!-- translation --><!-- translation -->'+markdown);
	fs.writeFileSync('./TRANSLATE.md', md);
}

fillLanguages();
generateGraph();
generateMD();