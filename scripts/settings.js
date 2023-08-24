function start()
{
	events.events();
}

function setMaxMargin(value, save = false)
{
	if(save) storage.updateVar('config', 'readingMaxMargin', value);
}

function setGlobalZoom(value)
{
	storage.updateVar('config', 'readingGlobalZoom', value);
}

function setShowFullPathLibrary(value)
{
	storage.updateVar('config', 'showFullPathLibrary', value);
}

function setShowFullPathOpened(value)
{
	storage.updateVar('config', 'showFullPathOpened', value);
}

function setStartInFullScreen(value)
{
	storage.updateVar('config', 'startInFullScreen', value);
}

function setCheckReleases(value)
{
	storage.updateVar('config', 'checkReleases', value);

	dom.query('.settings-check-prereleases').class(!value, 'disable-pointer');
}

function setCheckPreReleases(value)
{
	storage.updateVar('config', 'checkPreReleases', value);
}


module.exports = {
	start: start,
	setMaxMargin: setMaxMargin,
	setGlobalZoom: setGlobalZoom,
	setShowFullPathLibrary: setShowFullPathLibrary,
	setShowFullPathOpened: setShowFullPathOpened,
	setStartInFullScreen: setStartInFullScreen,
	setCheckReleases: setCheckReleases,
	setCheckPreReleases: setCheckPreReleases,
};