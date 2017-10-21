var changes = 10;

var storageDefault = {
	config: {
		appVersion: package.version,
		changes: changes,
		language: 'es',
		theme: 'material-design',
		nightMode: false,
		foldersFirst: true,
		viewIndex: 'module',
		view: 'module',
		sortIndex: 'name',
		sort: 'name',
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
		readingMagnifyingGlassRadius: 2,
		readingDelayComicSkip: 1,
		readingDoublePage: false,
		readingDoNotApplyToHorizontals: true
	},
	comics: [{
		name: 'Name',
		path: 'Files path',
		lastReading: 0,
		added: 0,
		compressed: false,
		bookmark: false,
		folder: true,
	},
	{
		name: 'Pepper & Carrot',
		path: p.join(appDir, 'Pepper & Carrot'),
		lastReading: 0,
		added: 0,
		compressed: false,
		bookmark: false,
		folder: true,
	}],
	bookmarks: {
		wildcard: ['Path']
	},
	cache: {wildcard: {
			lastAccess: 0,
			size: 0,
		}
	},
},
storageJson = {};


function updateStorageArrayMD(data, defaultObj)
{
	var newData = [];

	if(!isEmpty(data))
	{
		for(index in defaultObj)
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

var storageKeys = ['config', 'comics', 'cache', 'bookmarks'];

function start(callback)
{
	ejs.getMany(storageKeys, function(error, data) {

		if(!isEmpty(data))
		{
			var config = data.config;
		}

		for(let key in storageKeys)
		{
			key = storageKeys[key];

			if(typeof data[key] == 'undefined')
			{
				var storageNew = updateStorageMD(false, storageDefault[key]);

				ejs.set(key, storageNew, function(error){});

				storageJson[key] = storageNew;
			}
			else
			{
				if(config.appVersion != package.version || config.changes != changes)
				{
					newData = updateStorageMD(data[key], storageDefault[key]);

					if(key == 'config')
					{
						newData.appVersion = package.version;
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
	storageJson: storageJson
};