function start()
{
	events.events();
}

function setMaxMargin(value, save = false)
{
	if(save) storage.updateVar('config', 'readingMaxMargin', value);
}

module.exports = {
	start: start,
	setMaxMargin: setMaxMargin,
};