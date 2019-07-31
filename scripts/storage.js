var changes = 16;

var storageDefault = {
	config: {
		appVersion: _package.version,
		changes: changes,
		language: 'en',
		theme: 'material-design',
		nightMode: false,
		foldersFirst: true,
		viewIndex: 'module',
		view: 'module',
		sortIndex: 'name',
		sort: 'name-numeric',
		sortInvertIndex: false,
		sortInvert: false,
		readingView: 'slide',
		readingViewSpeed: 0.3,
		readingViewAdjustToWidth: false,
		readingMargin: {
			margin: 16,
			top: 16,
			bottom: 16,
			left: 16,
			right: 16
		},
		readingMagnifyingGlass: false,
		readingMagnifyingGlassZoom: 2,
		readingMagnifyingGlassSize: 200,
		readingMagnifyingGlassRatio: 1.25,
		readingMagnifyingGlassRadius: 4,
		readingDelayComicSkip: 1,
		readingDoublePage: false,
		readingDoNotApplyToHorizontals: true,
		readingManga: false
	},
	comics: [{
		name: 'Name',
		path: 'Files path',
		added: 0,
		compressed: false,
		bookmark: false,
		folder: true,
		readingProgress: {
			path: 'Path',
			lastReading: 0,
			progress: 0,
		},
	},
	{
		name: 'Pepper & Carrot',
		path: asarToAsarUnpacked(p.join(appDir, 'Pepper & Carrot')),
		added: 0,
		compressed: false,
		bookmark: false,
		folder: true,
		readingProgress: {
			index: 0,
			path: '',
			lastReading: 0,
			progress: 0,
		},
	}],
	bookmarks: {
		wildcard: [{
			index: 0,
			path: 'Path',
		}]
	},
	readingProgress: {
		wildcard: {
			index: 0,
			path: 'Path',
			lastReading: 0,
			progress: 0,
		}
	},
	cache: {
		wildcard: {
			lastAccess: 0,
			size: 0,
		}
	},
},
storageJson = {};

var languagesList = false, getLocaleUserLanguageCache = {};

function getLocaleUserLanguage(userLanguage = false)
{
	if(userLanguage === false)
		userLanguage = navigator.language || navigator.userLanguage;

	if(!userLanguage)
		return 'en';

	userLanguage = userLanguage.replace(/\-/g, '_');

	if(getLocaleUserLanguageCache[_userLanguage])
		return getLocaleUserLanguageCache[_userLanguage];

	var _userLanguage = userLanguage;

	if(languagesList === false)
		languagesList = $.parseJSON(readFileApp('/languages/languagesList.json'));

	var codes = [];

	for(let code in languagesList)
	{
		if(languagesList[code].active)
		{
			codes.push(code.replace(/\-/g, '_'));
		}
	}

	for(let i = 0, len = codes.length; i < len; i++)
	{
		if(codes[i] === userLanguage)
		{
			return getLocaleUserLanguageCache[_userLanguage] = codes[i];
		}
	}

	userLanguage = extract(/^([a-z]+)/iu, userLanguage, 1).toLowerCase();

	for(let i = 0, len = codes.length; i < len; i++)
	{
		if(codes[i] === userLanguage)
		{
			return getLocaleUserLanguageCache[_userLanguage] = codes[i];
		}
	}

	for(let i = 0, len = codes.length; i < len; i++)
	{
		if(extract(/^([a-z]+)/iu, codes[i], 1).toLowerCase() === userLanguage)
		{
			return getLocaleUserLanguageCache[_userLanguage] = codes[i];
		}
	}

	return getLocaleUserLanguageCache[_userLanguage] = 'en';
}

function updateStorageArrayMD(data, defaultObj)
{
	var newData = [];

	if(!isEmpty(data))
	{
		for(let index in data)
		{
			newData[index] = updateStorageMD(data[index], defaultObj[0]);
		}
	}
	else
	{
		if(defaultObj.length > 1)
		{
			newData = [];

			for(var i = 1; i < defaultObj.length; i++)
			{
				newData[i-1] = defaultObj[i];
			}
		}
	}

	return newData;
}

function updateStorageMD(data, defaultObj)
{

	if($.isArray(defaultObj))
	{
		var newData = [];

		newData = updateStorageArrayMD(data, defaultObj);
	}
	else
	{
		var newData = {};

		for(let key in defaultObj)
		{
			if(key == 'wildcard')
			{
				newData = {};

				for(let key2 in data)
				{
					newData[key2] = updateStorageMD(data[key2], defaultObj[key]);
				}
			}
			else if($.isArray(defaultObj[key]))
			{
				newData[key] = updateStorageArrayMD(data[key], defaultObj[key]);
			}
			else if(typeof defaultObj[key] == 'object')
			{
				newData[key] = updateStorageMD(data[key], defaultObj[key]);
			}
			else
			{

				if(!isEmpty(data) && typeof data[key] != 'undefined')
				{
					newData[key] = data[key];
				}
				else
				{
					newData[key] = defaultObj[key];
				}
			}
		}
	}

	return newData;
}


function updateVar(key, keyVar, value)
{

	if(typeof storageJson[key] === 'undefined')
		storageJson[key] = {};

	storageJson[key][keyVar] = value;

	ejs.set(key, storageJson[key], function(error){});

}

function update(key, value)
{
	storageJson[key] = value;

	ejs.set(key, storageJson[key], function(error){});
}

function push(key, item)
{
	storageJson[key].push(item);

	ejs.set(key, storageJson[key], function(error){});
}

var storageKeys = ['config', 'comics', 'cache', 'bookmarks', 'readingProgress'];

function start(callback)
{
	ejs.getMany(storageKeys, function(error, data) {

		if(!isEmpty(data))
		{
			var config = data.config;
		}

		for(let i in storageKeys)
		{
			var key = storageKeys[i];

			if(typeof data[key] == 'undefined')
			{
				if(key == 'config')
					storageDefault[key].language = getLocaleUserLanguage();

				var storageNew = updateStorageMD(false, storageDefault[key]);

				ejs.set(key, storageNew, function(error){});

				storageJson[key] = storageNew;
			}
			else
			{
				if(config.appVersion != _package.version || config.changes != changes)
				{
					if(key == 'config')
						storageDefault[key].language = getLocaleUserLanguage();

					if(config.changes != changes)
						var newData = updateStorageMD(data[key], storageDefault[key]);
					else
						var newData = data[key];

					if(key == 'config')
					{
						newData.appVersion = _package.version;
						newData.changes = changes;
					}

					ejs.set(key, newData, function(error){});

					storageJson[key] = newData;
				}
				else
				{
					storageJson[key] = data[key];
				}
			}
		}

		callback();
	});
}



function get(key)
{
	return storageJson[key];
}

function getKey(key, key2)
{
	return storageJson[key][key2];
}

module.exports = {
	start: start,
	get: get,
	getKey: getKey,
	updateVar: updateVar,
	setVar: updateVar,
	set: update,
	update: update,
	push: push,
	storageJson: storageJson,
	updateStorageMD: updateStorageMD,
	getLocaleUserLanguage: getLocaleUserLanguage,
};