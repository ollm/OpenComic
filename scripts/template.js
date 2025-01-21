//Load template

function loadTemplate(file)
{
	if(templates.templatesCacheTheme[config.theme] && templates.templatesCacheTheme[config.theme][file])
		return templates.templatesCacheTheme[config.theme][file](handlebarsContext);
	else if(templates.templatesCache[file])
		return templates.templatesCache[file](handlebarsContext);
}

function loadTemplateQuery(querySelector, file)
{
	let element = document.querySelector(querySelector);
	if(element) element.innerHTML = loadTemplate(file);
}

function loadTemplateFunction(file, functionVar)
{
	functionVar(loadTemplate(file));
}

//Control template

var contentLeft = false, contentRight = false, barHeader = false, globalElement = false;
var _contentLeft = false, _contentRight = false, _barHeader = false, _globalElement = false;

var contentLeftZindex = 1;

function changeContentLeft(html, animation = true)
{
	dom.query('.content-left > div.to-remove').remove();
	dom.query('.content-left > div').addClass('to-remove');

	document.querySelector('.content-left').insertAdjacentHTML('beforeend', '<div class="content-left-'+contentLeftZindex+(animation ? ' a' : '')+'" style="z-index: ' + contentLeftZindex + ';"><div>'+html+'</div></div>');

	_contentLeft = document.querySelector('.content-left .content-left-'+contentLeftZindex);
	contentLeft = $(_contentLeft);

	setTimeout(function(zIndex){

		dom.query('.content-left-'+(zIndex-1)).remove();
		dom.query('.content-left-'+zIndex).removeClass('a')

	}, 300, contentLeftZindex);

	contentLeftZindex++;
}

function loadContentLeft(template, animation)
{
	changeContentLeft(loadTemplate(template), animation);
}

var contentRightZindex = 1;

function changeContentRight(html, animation = true, keepScroll = false)
{
	dom.query('.content-right > div.to-remove').remove();
	dom.query('.content-right > div').addClass('to-remove');

	let scroll;

	if(keepScroll && keepScroll < 2)
	{
		let previous = document.querySelector('.content-right > div:last-child > div');
		scroll = (previous.scrollTop / (previous.scrollHeight - previous.getBoundingClientRect().height));
	}

	document.querySelector('.content-right').insertAdjacentHTML('beforeend', '<div class="content-right-'+contentRightZindex+(animation ? ' a' : '')+'" style="z-index: ' + contentRightZindex + ';"><div>'+html+'</div></div>');

	if(keepScroll)
	{
		let current = document.querySelector('.content-right > div:last-child > div');

		if(keepScroll > 1)
			current.scrollTop = keepScroll;
		else
			current.scrollTop = (current.scrollHeight - current.getBoundingClientRect().height) * scroll;
	}

	_contentRight = document.querySelector('.content-right .content-right-'+contentRightZindex);
	contentRight = $(_contentRight);

	setTimeout(function(zIndex){

		dom.query('.content-right-'+(zIndex-1)).remove();
		dom.query('.content-right-'+zIndex).removeClass('a')

	}, 300, contentRightZindex);

	contentRightZindex++;
}

function loadContentRight(template, animation, keepScroll)
{
	changeContentRight(loadTemplate(template), animation, keepScroll);
}

var headerZindex = 1;

function changeHeader(html, animation = true)
{
	dom.query('.bar-header > div.to-remove').remove();
	dom.query('.bar-header > div').addClass('to-remove');

	document.querySelector('.bar-header').insertAdjacentHTML('beforeend', '<div class="bar-header-'+headerZindex+(animation ? ' a' : '')+'" style="z-index: ' + headerZindex + ';"><div>'+html+'</div></div>');

	_barHeader = document.querySelector('.bar-header .bar-header-'+headerZindex);
	barHeader = $(_barHeader);

	setTimeout(function(zIndex){

		dom.query('.bar-header-'+(zIndex-1)).remove();
		dom.query('.bar-header-'+zIndex).removeClass('a');

	}, 300, headerZindex);

	headerZindex++;

	dom.header.event();
}

function loadHeader(template, animation)
{
	changeHeader(loadTemplate(template), animation);

	let barTitle = _barHeader.querySelector('.bar-title');
	if(barTitle) barTitle.scrollLeft = barTitle.scrollWidth;
}

function changeGlobalElement(html, element)
{
	element = document.querySelector('.global-elements .'+element);
	if(element) element.innerHTML = html;

	if(globalElement === false)
	{
		_globalElement = document.querySelector('.global-elements');
		globalElement = $(_globalElement);
	}
}

function loadGlobalElement(template, element)
{
	changeGlobalElement(loadTemplate(template), element);
}

function selectContentLeft(query)
{
	if(typeof query !== 'undefined')
		return contentLeft.find(query);
	else
		return contentLeft;
}

function selectContentRight(query)
{
	if(typeof query !== 'undefined')
		return contentRight.find(query);
	else
		return contentRight;
}

function selectBarHeader(query)
{
	if(typeof query !== 'undefined')
		return barHeader.find(query);
	else
		return barHeader;
}

function selectGlobalElement(query)
{
	if(typeof query !== 'undefined')
		return globalElement.find(query);
	else
		return globalElement;
}

module.exports = {
	load: loadTemplate,
	loadInFunction: loadTemplateFunction,
	loadInQuery: loadTemplateQuery,
	changeContentLeft: changeContentLeft,
	loadContentLeft: loadContentLeft,
	changeContentRight: changeContentRight,
	loadContentRight: loadContentRight,
	changeHeader: changeHeader,
	loadHeader: loadHeader,
	changeGlobalElement: changeGlobalElement,
	contentLeft: selectContentLeft,
	contentRight: selectContentRight,
	barHeader: selectBarHeader,
	globalElement: selectGlobalElement,
	loadGlobalElement: loadGlobalElement,
	contentRightIndex: function(){return contentRightZindex - 1},
	contentLeftIndex: function(){return contentLeftZindex - 1},
	_contentLeft: function(){return _contentLeft},
	_contentRight: function(){return _contentRight},
	_barHeader: function(){return _barHeader},
	_globalElement: function(){return _globalElement},
};