//console.time('Starting time');

//console.time('Require time 1');
/*
window.onerror = function(msg, url, linenumber) {

    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;

}*/

document.addEventListener("keydown", event => {

	if(event.key == 'Escape')
	{
		if(electron.remote.getCurrentWindow().isFullScreen())
			electron.remote.getCurrentWindow().setFullScreen(false);
	}

});

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

var appDir = p.join(__dirname, '../');

var _package = $.parseJSON(readFileApp('package.json'));

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
		'application/rar',
		'application/x-cbr',
		'application/7z',
		'application/x-7z',
	],
	'zip': [
		'application/zip',
		'application/x-cbz',
	],
	'rar': [
		'application/rar',
		'application/x-cbr',
	],
	'7z': [
		'application/7z',
		'application/x-7z',
	],
};

var compressedExtensions = {
	'all': [
		'zip',
		'cbz',
		'rar',
		'cbr',
		'7z',
		'cb7',
	],
	'zip': [
		'zip',
		'cbz',
	],
	'rar': [
		'rar',
		'cbr',
	],
	'7z': [
		'7z',
		'cb7',
	],
};

// Update also in main.js
var compatibleExtensions = [
	/*jpeg*/'jpg', 'jpeg', 'jfif', 'jfif-tbnl', 'jpe', 
	/*png*/'png', 'x-png', 'apng',
	/*gif*/'gif',
	/*compressed*/'zip', 'cbz', 'rar', 'cbr', '7z', 'cb7',
];

//console.time('Require time 2');

const storage = require(p.join(appDir, 'scripts/storage.js')),
	cache = require(p.join(appDir, 'scripts/cache.js')),
	template = require(p.join(appDir, 'scripts/template.js')),
	dom = require(p.join(appDir, 'scripts/dom.js')),
	events = require(p.join(appDir, 'scripts/events.js')),
	file = require(p.join(appDir, 'scripts/file.js')),
	fileCompressed = require(p.join(appDir, 'scripts/file-compressed.js')),
	reading = require(p.join(appDir, 'scripts/reading.js'));

var tempFolder = p.join(os.tmpdir(), 'OpenComic');

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

function startApp()
{
	template.loadContentRight('index.content.right.module.html', false);
	template.loadHeader('index.header.html', false);
	template.loadContentLeft('index.content.left.html', false);
	template.loadGlobalElement('index.elements.menus.html', 'menus');

	if(electron.remote.process.argv && electron.remote.process.argv[1] && !inArray(electron.remote.process.argv[1], ['--no-sandbox', 'scripts/main.js', '.']) && fs.existsSync(electron.remote.process.argv[1]))
		openComic(electron.remote.process.argv[1], false);
	else
		dom.loadIndexPage(false);
}

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
	return fs.readFileSync(p.join(appDir, file), 'utf8');
}

function readFile(file)
{
	return fs.readFileSync(file, 'utf8');
}

function existsFileApp(file)
{
	fs.existsSync(p.join(appDir, file))
}

function existsFile(file)
{
	fs.existsSync(file)
}

function loadLanguageMD(hbc, obj)
{
	for(var key in obj)
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

function loadLanguage(lan = false)
{
	var data = readFileApp('./languages/es.json');

	language = $.parseJSON(data);
	handlebarsContext.language = language;

	if(lan)
	{
		data = readFileApp('./languages/'+lan+'.json');

		data = $.parseJSON(data);

		loadLanguageMD(handlebarsContext.language, data);

		generateAppMenu();
	}
}

function zoomIn()
{
	var factor = electron.webFrame.getZoomFactor();

	if(factor >= 3)
		factor += 1;
	else if(factor >= 2)
		factor += 1;
	else if(factor >= 1.25)
		factor += 0.25;
	else if(factor >= 1.10)
		factor += 0.15;
	else
		factor += 0.10;

	if(factor > 5)
		factor = 5;
	else if(factor < 0.50)
		factor = 0.50;

	electron.webFrame.setZoomFactor(Math.round(factor * 100) / 100);
}

function zoomOut()
{
	var factor = electron.webFrame.getZoomFactor();

	if(factor > 3)
		factor -= 1;
	else if(factor > 2)
		factor -= 1;
	else if(factor > 1.25)
		factor -= 0.25;
	else if(factor > 1.10)
		factor -= 0.15;
	else
		factor -= 0.10;

	if(factor > 5)
		factor = 5;
	else if(factor < 0.50)
		factor = 0.50;

	electron.webFrame.setZoomFactor(Math.round(factor * 100) / 100);
}

function resetZoom()
{
	electron.webFrame.setZoomLevel(0);
}

function generateAppMenu()
{
	electron.remote.globalShortcut.unregisterAll();
	electron.remote.globalShortcut.register('CmdOrCtrl+O', function(){openComicDialog()});
	electron.remote.globalShortcut.register('CmdOrCtrl+Q', function(){electron.remote.app.quit()});
	electron.remote.globalShortcut.register('CmdOrCtrl+0', function(){resetZoom(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+Shift+0', function(){resetZoom(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+Plus', function(){zoomIn(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+=', function(){zoomIn(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+-', function(){zoomOut(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+Shift+-', function(){zoomOut(); generateAppMenu();});

	var menuTemplate = [
		{
			label: handlebarsContext.language.menu.file.main,
			submenu: [
				{label: handlebarsContext.language.menu.file.openFile, click: function(){openComicDialog()}, accelerator: 'CmdOrCtrl+O'},
				{label: handlebarsContext.language.menu.file.openFolder, click: function(){openComicDialog(true)}},
				{label: handlebarsContext.language.menu.file.addFile, click: function(){addComic()}},
				{label: handlebarsContext.language.menu.file.addFolder, click: function(){addComic(true)}},
				{type: 'separator'},
				{role: 'quit', label: handlebarsContext.language.menu.file.quit},
			]
		},
		{
			label: handlebarsContext.language.menu.view.main,
			submenu: [
				{label: handlebarsContext.language.menu.view.resetZoom, enabled: (electron.webFrame.getZoomFactor() != 1 ? true : false), click: function(){resetZoom(); generateAppMenu();}, accelerator: 'CmdOrCtrl+0'},
				{label: handlebarsContext.language.menu.view.zoomIn, click: function(){zoomIn(); generateAppMenu();}, accelerator: 'CmdOrCtrl+Plus'},
				{label: handlebarsContext.language.menu.view.zoomOut, click: function(){zoomOut(); generateAppMenu();}, accelerator: 'CmdOrCtrl+-'},
				{type: 'separator'},
				{role: 'toggleFullScreen', label: handlebarsContext.language.menu.view.toggleFullScreen},
			]
		},
		{
			label: handlebarsContext.language.menu.debbug.main,
			submenu: [
				{role: 'reload', label: handlebarsContext.language.menu.debbug.reload},
				{role: 'forceReload', label: handlebarsContext.language.menu.debbug.forceReload},
				{role: 'toggleDevTools', label: handlebarsContext.language.menu.debbug.toggleDevTools},
			]
		}
	];




	var menu = electron.remote.Menu.buildFromTemplate(menuTemplate);
	electron.remote.Menu.setApplicationMenu(menu);
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
		value = value+(/\./.test(value) ? '' : '.')+('0'.repeat(num_d - num_v));

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

function pathIsSupported(path)
{
	if(fs.statSync(path).isDirectory() || inArray(mime.getType(path), compatibleMime) || inArray(fileExtension(path), compressedExtensions.all))
		return true;

	return false;
}

function openComicDialog(folders = false)
{
	if(folders)
		var properties = ['openDirectory'];
	else
		var properties = ['openFile'];

	var dialog = electron.remote.dialog;

	dialog.showOpenDialog({properties: properties, filters: [{name: language.global.comics, extensions: (folders) ? ['*'] : compatibleExtensions}]}, function (files) {

		openComic(files[0]);

	});

}

function openComic(filePath, animation = true)
{
	console.log(filePath);

	if(pathIsSupported(filePath))
	{
		var selectImage = false, path = false, mainPath = false;

		if(fs.statSync(filePath).isDirectory())
		{
			path = filePath;
		}
		else
		{
			if(inArray(mime.getType(filePath), compatibleMime))
			{
				selectImage = true;
				path = filePath;

				filePath = p.dirname(filePath);

				mainPath = filePath;
			}
			else
			{
				path = filePath;
			}
		}

		if(mainPath === false)
			mainPath = path;

		if(onReading)
			reading.saveReadingProgress();

		console.log(path, mainPath);

		if(selectImage)
			dom.openComic(animation, path, mainPath);
		else
			dom.loadIndexPage(animation, path, false, false, mainPath);
	}
}

function addComic(folders = false)
{
	if(folders)
		var properties = ['openDirectory', 'multiSelections'];
	else
		var properties = ['openFile', 'multiSelections'];

	var dialog = electron.remote.dialog;

	dialog.showOpenDialog({properties: properties, filters: [{name: language.global.comics, extensions: (folders) ? ['*'] : compatibleExtensions}]}, function (files) {

		var added = false;

		for(let i in files)
		{
			var filePath = files[i];

			if(pathIsSupported(filePath))
			{
				if(fs.statSync(filePath).isDirectory())
				{
					var name = p.basename(filePath);
					var path = filePath;
					var compressed = false;
				}
				else
				{
					if(inArray(mime.getType(filePath), compatibleMime))
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

				for(var key in comics)
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
						added: time(),
						compressed: compressed,
						folder: true,
						readingProgress: {
							path: 'Path',
							lastReading: 0,
							progress: 0,
						},
					});

					added = true;
				}
			}
		}

		if(added)
		{
			if(onReading)
				reading.saveReadingProgress();

			dom.loadIndexPage(true);
		}

	});

}

//Cheack errors

function checkError(value, error = false)
{
	if(value && typeof value.error != 'undefined')
	{
		if(error && value.error == error)
			return true;
		else if(!error)
			return true;
	}

	return false;
}

//Errors list 

const NOT_POSSIBLE_WITHOUT_DECOMPRESSING = 1;
const ERROR_UNZIPPING_THE_FILE = 2;