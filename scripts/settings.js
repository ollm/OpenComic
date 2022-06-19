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

module.exports = {
	start: start,
	setMaxMargin: setMaxMargin,
	setGlobalZoom: setGlobalZoom,
};