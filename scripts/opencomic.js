//console.time('Starting time');

//console.time('Require time 1');

const electron = require('electron'),
	fs = require('fs'),
	hb = require('handlebars'),
	os = require('os'),
	ejs = require('electron-json-storage'),
	mime = require('mime'),
	sha1 = require('sha1'),
	p = require('path'),
	$ = require('jquery');


//console.timeEnd('Require time 1');

var testVar = 'test';

var handlebarsContext = new Object();
var language = new Object();
var config = false;
var onReading = false;
var readingTouchEvent = false;

var appDir = __dirname;

var package = $.parseJSON(readFileApp('/package.json'));

var compatibleMime = [
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/apng',
	'image/gif'
];

var compressedMime = {
	'all': [
		'application/zip',
		'application/x-cbz',
	],
	'zip': [
		'application/zip',
		'application/x-cbz',
	],
};

var compressedExtensions = {
	'all': [
		'zip',
		'cbz',
	],
	'zip': [
		'zip',
		'cbz',
	],
};

var compatibleExtensions = [
	/*jpeg*/'jpg', 'jpeg', 'jfif', 'jfif-tbnl', 'jpe', 
	/*png*/'png', 'x-png',
	/*gif*/'gif',
	/*compressed*/'zip', 'cbz'
];

//console.time('Require time 2');

const storage = require('./scripts/storage-control.js'),
	cache = require('./scripts/cache-control.js'),
	template = require('./scripts/template-control.js'),
	dom = require('./scripts/dom-control.js'),
	events = require('./scripts/events-control.js'),
	file = require('./scripts/file-control.js'),
	fileCompressed = require('./scripts/file-compressed-control.js'),
	reading = require('./scripts/reading-control.js');

tempFolder = p.join(os.tmpdir(), 'OpenComic');

//console.timeEnd('Require time 2');

storage.start(function(){
	config = storage.get('config');
	handlebarsContext.config = config;

	//console.time('Load language time');

	loadLanguage(config.language);

	//console.timeEnd('Load language time');

	//console.time('Load body');

	template.loadInQuery('body', 'body.html');

	//console.timeEnd('Load body');

});

/*Global functions*/

function inArray(string, array)
{
	return (array.indexOf(string) != -1) ? true : false;
}

function fileExtension(path)
{
	return p.extname(path).replace(/^\./, '').toLowerCase();
}

function pregQuote(str, delimiter = false)
{
	return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

function mousePosition(e, mode)
{
	if(mode == 'x')
		return e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
	else
		return e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);
}

function htmlEntities(str)
{
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function htmlQuote(str)
{
	return String(str).replace(/"/g, '&quot;');
}

function escapeQuotes(str, mode = false)
{
	if(mode === 'simples')
		return String(str).replace(/'/g, '\\\'');
	else if(mode === 'doubles')
		return String(str).replace(/"/g, '\\\"');
	else
		return String(str).replace(/'/g, '\\\'').replace(/"/g, '\\\"');
}

function readFileApp(file)
{
	return fs.readFileSync(p.join(__dirname, file), 'utf8');
}

function readFile(file)
{
	return fs.readFileSync(file, 'utf8');
}

function existsFileApp(file)
{
	fs.existsSync(p.join(__dirname, file))
}

function existsFile(file)
{
	fs.existsSync(file)
}

function loadLanguageMD(hbc, obj)
{
	for(key in obj)
	{
		if(typeof obj[key] == 'object')
		{
			loadLanguageMD(hbc[key], obj[key]);
		}
		else
		{
			hbc[key] = obj[key];
		}
	}
}

function time()
{
	return Math.floor(Date.now() / 1000);
}

function loadLanguage(lan)
{

	var lan = lan || false;

	var data = readFileApp('/languages/es.json');

	language = $.parseJSON(data);
	handlebarsContext.language = language;

	if(lan)
	{
		data = readFileApp('/languages/'+lan+'.json');

		data = $.parseJSON(data);

		loadLanguageMD(handlebarsContext.language, data);
	}

}

function escapeBackSlash(string)
{
	return string.replace(/\\+/g, '\\\\');
}

function invertBackslash(string)
{
	return string.replace(/\\+/g, '/');
}

function toUnixPath(string)
{
	return string.replace(/\\+/g, '/').trim().replace(/^c\:/ig, '/');
}

function isEmpty(obj)
{
	if (obj == null) return true;
	if (obj.length > 0)	return false;
	if (obj.length === 0)  return true;
	if (typeof obj !== "object") return true;


	for (var key in obj)
	{
		if (hasOwnProperty.call(obj, key)) return false;
	}

	return true;
}


function matchArray(string, array)
{
	for(var i = 0; i < array.length; i++)
	{
		if(string.match(array))
		{
			return true;
		}
	}

	return false;
}

function callbackString(callback)
{
	var func = new Function(callback);
	func();
}

/*Handlebars helpers*/

hb.registerHelper('chain', function() {

	var helpers = [], value;

	$.each(arguments, function (i, arg) {

		if(hb.helpers[arg])
		{
			helpers.push(hb.helpers[arg]);
		}
		else
		{
			value = arg;

			$.each(helpers, function (j, helper) {
				value = helper(value, arguments[i + 1]);
			});

			return false;
		}
	});

	return value;
});

hb.registerHelper('compare', function(lvalue, operator, rvalue, options) {

	var operators = {
		'==':	function(l,r) { return l == r; },
		'===':	function(l,r) { return l === r; },
		'!=':	function(l,r) { return l != r; },
		'<':	function(l,r) { return l < r; },
		'>':	function(l,r) { return l > r; },
		'<=':	function(l,r) { return l <= r; },
		'>=':	function(l,r) { return l >= r; },
		'typeof':	function(l,r) { return typeof l == r; }
	}

	var result = operators[operator](lvalue,rvalue);

	if(result)
		return options.fn(this);

});

hb.registerHelper('escapeQuotes', function(string) {

	return escapeQuotes(string);

});

hb.registerHelper('escapeQuotesSimples', function(string) {

	return escapeQuotes(string, 'simples');

});

hb.registerHelper('escapeQuotesDoubles', function(string) {

	return escapeQuotes(string, 'doubles');

});

hb.registerHelper('escapeBackSlash', function(string) {

	return escapeBackSlash(string);

});

hb.registerHelper('toUnixPath', function(string) {

	return toUnixPath(string);

});

hb.registerHelper('invertBackslash', function(string) {

	return invertBackslash(string);

});

hb.registerHelper('isEmpty', function(obj) {

	return isEmpty(obj);

});

hb.registerHelper('encodeURI', function(string) {

	return encodeURI(string);

});

hb.registerHelper('normalizeNumber', function(value, decimals) {

	value = String(value);

	var num_v = String(value).replace(/.*?(\.|$)/, '').length;

	var num_d = decimals.replace(/.*?(\.|$)/, '').length;

	if(num_d != 0)
		value = value+(value.match(/\./) ? '' : '.')+('0'.repeat(num_d - num_v));

	return value;

});

hb.registerHelper('htmlEntities', function(string) {

	return htmlEntities(string);

});

hb.registerHelper('htmlQuote', function(string) {

	return htmlQuote(string);

});

hb.registerHelper('configIsTrue', function(key, value) {

	if(config[key] == value)
	{
		return true;
	}
	else
	{
		return false;
	}

});

/*Tests functions*/

function addComic()
{

	var remote = electron.remote;
	var dialog = remote.dialog;

	dialog.showOpenDialog({properties: ['openFile'], filters: [{name: language.global.comics, extensions: compatibleExtensions}]}, function (file) {

		if(file)
		{
			filePath = file[0];

			if(fs.statSync(filePath).isDirectory())
			{
				var name = p.basename(filePath);
				var path = filePath;
				var compressed = false;
			}
			else
			{
				if(inArray(mime.lookup(filePath), compatibleMime))
				{
					filePath = p.dirname(filePath);

					var name = p.basename(filePath);
					var path = filePath;
					var compressed = false;
				}
				else
				{
					var name = p.basename(filePath).replace(/\.[^\.]*$/, '');
					var path = filePath;
					var compressed = true;
				}
			}

			var comics = storage.get('comics');

			var exists = false;

			for(key in comics)
			{
				if(comics[key].path == path)
				{
					exists = true;

					break;
				}
			}

			if(!exists)
			{
				storage.push('comics', {
					name: name,
					path: path,
					lastRead: 0,
					added: time(),
					compressed: compressed,
					folder: true,
				});

				dom.loadIndexPage(true);

			}

		}

	});

}