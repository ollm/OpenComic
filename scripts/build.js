const hb = require('handlebars'),
	fs = require('fs'),
	p = require('path');


// Precompile templates
var templatesJs = 'var templatesCache = {}, templatesCacheTheme = {};';

var templates = fs.readdirSync(p.join(__dirname, '../templates'));

for(let i = 0, len = templates.length; i < len; i++)
{
	if(/\.html$/.test(templates[i]))
	{
		var html = fs.readFileSync(p.join(__dirname, '../templates', templates[i]), 'utf8');

		templatesJs += 'templatesCache[\''+templates[i]+'\'] = hb.template('+hb.precompile(html)+');\n\n';
	}
}

// Precompile templates in theme
var themes = fs.readdirSync(p.join(__dirname, '../themes'));

for(let i = 0, len = themes.length; i < len; i++)
{
	if(fs.existsSync(p.join(__dirname, '../themes', themes[i], 'templates')))
	{
		var templates = fs.readdirSync(p.join(__dirname, '../themes', themes[i], 'templates'));

		templatesJs += 'templatesCacheTheme[\''+themes[i]+'\'] = {};\n\n';

		for(let i2 = 0, len2 = templates.length; i2 < len2; i2++)
		{
			if(/\.html$/.test(templates[i]))
			{
				var html = fs.readFileSync(p.join(__dirname, '../themes', themes[i], 'templates', templates[i2]), 'utf8');

				templatesJs += 'templatesCacheTheme[\''+themes[i]+'\'][\''+templates[i2]+'\'] = hb.template('+hb.precompile(html)+');\n\n';
			}
		}
	}
}

templatesJs += 'module.exports = {templatesCacheTheme: templatesCacheTheme, templatesCache: templatesCache};';

fs.writeFileSync(p.join(__dirname, '../scripts/templates.js'), templatesJs);