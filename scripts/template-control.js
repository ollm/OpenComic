//Load template

var templatesCache = new Object();

function loadTemplate(file)
{
	if(typeof templatesCache[file] === 'undefined')
	{
		if(existsFileApp('/themes/'+config.theme+'/templates/'+file))
		{
			templatesCache[file] = hb.compile(readFileApp('/themes/'+config.theme+'/templates/'+file));
			return templatesCache[file](handlebarsContext);
		}
		else
		{
			templatesCache[file] = hb.compile(readFileApp('/templates/'+file));
			return templatesCache[file](handlebarsContext);	
		}
	}
	else
	{
		return templatesCache[file](handlebarsContext);
	}
}

function registerPartial(name, file)
{
	if(existsFileApp('/themes/'+config.theme+'/templates/'+file))
	{
		hb.registerPartial(name, readFileApp('/themes/'+config.theme+'/templates/'+file));
	}
	else
	{
		hb.registerPartial(name, readFileApp('/templates/'+file));
	}
}


function loadTemplateQuery(querySelector, file)
{
	$(querySelector).html(loadTemplate(file));
}

function loadTemplateFunction(file, functionVar)
{
	functionVar(loadTemplate(file));
}

//Control template

var contentLeft = false, contentRight = false, barHeader = false;

var contentLeftZindex = 1;

function changeContentLeft(html, animation)
{
	animation = typeof animation === 'undefined' ? true : animation;

	$('.content-left > div.to-remove').remove();
	$('.content-left > div').addClass('to-remove');
	$('.content-left').append('<div '+(animation ? 'class="a"' : '')+'style="z-index: ' + contentLeftZindex + ';"><div>'+html+'</div></div>');
	contentLeftZindex++;

	contentLeft = $('.content-left .a').not('.to-remove');
}

function loadContentLeft(template, animation)
{
	changeContentLeft(loadTemplate(template), animation);
}

var contentRightZindex = 1;

function changeContentRight(html, animation, keepScroll)
{
	animation = typeof animation === 'undefined' ? true : animation;
	keepScroll = typeof keepScroll === 'undefined' ? false : keepScroll;

	$('.content-right > div.to-remove').remove();
	$('.content-right > div').addClass('to-remove');

	if(keepScroll)
	{
		var previous = $('.content-right > div > div').last();
		var scroll = (previous.scrollTop() / (previous.prop('scrollHeight') - previous.height()));
	}

	$('.content-right').append('<div '+(animation ? 'class="a"' : '')+'style="z-index: ' + contentRightZindex + ';"><div>'+html+'</div></div>');

	if(keepScroll)
	{
		var current = $('.content-right > div > div').last();
		current.scrollTop((current.prop('scrollHeight') - current.height()) * scroll);
	}

	contentRightZindex++;

	contentRight = $('.content-right > div').not('.to-remove');
}

function loadContentRight(template, animation, keepScroll)
{
	changeContentRight(loadTemplate(template), animation, keepScroll);
}


var headerZindex = 1;

function changeHeader(html, animation)
{
	animation = typeof animation === 'undefined' ? true : animation;

	$('.bar-header > div.to-remove').remove();
	$('.bar-header > div').addClass('to-remove');
	$('.bar-header').append('<div '+(animation ? 'class="a"' : '')+'style="z-index: ' + headerZindex + ';"><div>'+html+'</div></div>');
	headerZindex++;

	barHeader = $('.bar-header .a').not('.to-remove');
}

function loadHeader(template, animation)
{
	changeHeader(loadTemplate(template), animation);
}

function changeGlobalElement(html, element)
{
	$('.global-elements .'+element).html(html);
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
	loadGlobalElement: loadGlobalElement,
	registerPartial: registerPartial,
};