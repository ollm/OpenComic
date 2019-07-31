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
	var element = document.querySelector(querySelector);
	if(element) element.innerHTML = loadTemplate(file);
}

function loadTemplateFunction(file, functionVar)
{
	functionVar(loadTemplate(file));
}

//Control template

var contentLeft = false, contentRight = false, barHeader = false, globalElement = false;

var contentLeftZindex = 1;

function changeContentLeft(html, animation = true)
{
	$('.content-left > div.to-remove').remove();
	$('.content-left > div').addClass('to-remove');
	document.querySelector('.content-left').insertAdjacentHTML('beforeend', '<div class="content-left-'+contentLeftZindex+(animation ? ' a' : '')+'" style="z-index: ' + contentLeftZindex + ';"><div>'+html+'</div></div>');

	contentLeft = $('.content-left .content-left-'+contentLeftZindex);
	setTimeout('$(\'.content-left-'+(contentLeftZindex-1)+'\').remove(); $(\'.content-left-'+contentLeftZindex+'\').removeClass(\'a\')', 300);

	contentLeftZindex++;
}

function loadContentLeft(template, animation)
{
	changeContentLeft(loadTemplate(template), animation);
}

var contentRightZindex = 1;

function changeContentRight(html, animation = true, keepScroll = false)
{
	$('.content-right > div.to-remove').remove();
	$('.content-right > div').addClass('to-remove');

	if(keepScroll)
	{
		var previous = $('.content-right > div > div').last();
		var scroll = (previous.scrollTop() / (previous.prop('scrollHeight') - previous.height()));
	}

	document.querySelector('.content-right').insertAdjacentHTML('beforeend', '<div class="content-right-'+contentRightZindex+(animation ? ' a' : '')+'" style="z-index: ' + contentRightZindex + ';"><div>'+html+'</div></div>');

	if(keepScroll)
	{
		var current = $('.content-right > div > div').last();
		current.scrollTop((current.prop('scrollHeight') - current.height()) * scroll);
	}

	contentRight = $('.content-right .content-right-'+contentRightZindex);
	setTimeout('$(\'.content-right-'+(contentRightZindex-1)+'\').remove(); $(\'.content-right-'+contentRightZindex+'\').removeClass(\'a\')', 300);

	contentRightZindex++;
}

function loadContentRight(template, animation, keepScroll)
{
	changeContentRight(loadTemplate(template), animation, keepScroll);
}

var headerZindex = 1;

function changeHeader(html, animation = true)
{
	$('.bar-header > div.to-remove').remove();
	$('.bar-header > div').addClass('to-remove');
	document.querySelector('.bar-header').insertAdjacentHTML('beforeend', '<div class="bar-header-'+headerZindex+(animation ? ' a' : '')+'" style="z-index: ' + headerZindex + ';"><div>'+html+'</div></div>');

	barHeader = $('.bar-header .bar-header-'+headerZindex);
	setTimeout('$(\'.bar-header-'+(headerZindex-1)+'\').remove(); $(\'.bar-header-'+headerZindex+'\').removeClass(\'a\')', 300);

	headerZindex++;
}

function loadHeader(template, animation)
{
	changeHeader(loadTemplate(template), animation);
}

function changeGlobalElement(html, element)
{
	var element = document.querySelector('.global-elements .'+element);
	if(element) element.innerHTML = html;

	if(globalElement === false)
		globalElement = $('.global-elements');
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
	contentRightZindex: function(){return contentRightZindex - 1}
};