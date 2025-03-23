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

templatesJs += 'hb.partials = hb.templates = templatesCache; module.exports = {templatesCacheTheme: templatesCacheTheme, templatesCache: templatesCache};';

if(!fs.existsSync(p.join(__dirname, '../scripts/builded/')))
	fs.mkdirSync(p.join(__dirname, '../scripts/builded/'));

fs.writeFileSync(p.join(__dirname, '../scripts/builded/templates.js'), templatesJs);

fs.writeFileSync(p.join(__dirname, '../scripts/installed-from-store.js'), `module.exports = {
	check: function(){return false},
};`);

// Get package lock versions
const packageLock = JSON.parse(fs.readFileSync(p.join(__dirname, '../package-lock.json'), 'utf8'));
const packageVersions = {};

for(let package in packageLock.packages)
{
	packageVersions[package] = packageLock.packages[package].version;
}

fs.writeFileSync(p.join(__dirname, '../scripts/builded/package-lock.js'), 'module.exports = '+JSON.stringify(packageVersions)+';');