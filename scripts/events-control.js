var buttonCancel, buttonPulsed;

function eventButton()
{

	$('.button').on('mousedown touchstart', function(e){
		$(this).removeClass('p c d').addClass('a');
		clearTimeout(eventHoverTimeout);
		buttonCancel = false;
		buttonPulsed = true;

		eventHoverTimeoutActive = false;

		eventHoverActiveTemporal = false;

		$('.global-elements .hover.a').removeClass('a').addClass('d');
	});

	$('.button').on('mouseup touchend', function(e){
		if(!buttonCancel)
		{
			$(this).removeClass('a c d').addClass('p');
		}

		buttonPulsed = false;
	});

	$('.button').on('mouseout', function(){
		if(buttonPulsed)
		{
			buttonCancel = true;
			$(this).removeClass('a p d').addClass('c');

			buttonPulsed = false;
		}
	});

	$('.floating-action-button').on('mousedown touchstart', function(e){
		$(this).removeClass('p c d').addClass('a');
		clearTimeout(eventHoverTimeout);
		buttonCancel = false;
		buttonPulsed = true;


		eventHoverTimeoutActive = false;

		eventHoverActiveTemporal = false;

		$('.global-elements .hover.a').removeClass('a').addClass('d');
	});

	$('.floating-action-button').on('mouseup touchend', function(e){
		if(!buttonCancel)
		{
			$(this).removeClass('a c d').addClass('p');
		}

		buttonPulsed = false;
	});

	$('.floating-action-button').on('mouseout', function(){
		if(buttonPulsed)
		{
			buttonCancel = true;
			$(this).removeClass('a p d').addClass('c');

			buttonPulsed = false;
		}
	});

}

var eventHoverTimeout, eventHoverTimeoutThis, eventHoverTimeoutActive, currentPageX, currentPageY;

function eventHover()
{

	$('.hover-text').on('mouseenter', function(){

		eventHoverTimeoutActive = true;

		eventHoverActiveTemporal = true;

		eventHoverTimeoutThis = this;

	});

	$('.hover-text').on('mouseout', function(){

		eventHoverTimeoutActive = false;

		eventHoverActiveTemporal = false;

		$('.global-elements .hover.a-i').removeClass('a-i').addClass('d-i');
		$('.global-elements .hover.a').removeClass('a').addClass('d');
	

	});

	$(window).on('mouseout', function(){

		eventHoverTimeoutActive = false;

		eventHoverActiveTemporal = false;

		$('.global-elements .hover.a-i').removeClass('a-i').addClass('d-i');
		$('.global-elements .hover.a').removeClass('a').addClass('d');
		clearTimeout(eventHoverTimeout);

	});

	$(window).on('mousemove', function (e){

		clearTimeout(eventHoverTimeout);

		if(eventHoverTimeoutActive)
			eventHoverTimeout = setTimeout('events.showHoverText()', 300);

	});

}

function eventSwitch()
{

	$('.switch').on('click', function(){

		if($(this).hasClass('a'))
		{
			$(this).removeClass('a');
			callbackString($(this).attr('off'));
		}
		else
		{
			$(this).addClass('a');
			callbackString($(this).attr('on'));
		}

	});
}


function eventRange()
{
	$('.range').on('change input', function(event) {

		var onrange = $(this).attr('onrange');

		var value_txt = value = $(this).val();

		var step = $(this).attr('step');

		if(typeof step != 'undefined')
		{

			var num_v = value_txt.replace(/.*?(\.|$)/, '').length;

			var num_s = step.replace(/.*?(\.|$)/, '').length;

			if(num_s != 0)
				value_txt = value_txt+(value_txt.match(/\./) ? '' : '.')+('0'.repeat(num_s - num_v));

		}

		var callback = hb.compile(onrange)({
			value: value,
			toEnd: (event.type == 'input' ? 'false' : 'true'),
		});

		callbackString(callback);

		$(this).siblings('.simple-slider-text').find('span').html(value_txt);
	});
}

function events()
{
	$('.button').off('mousedown mouseup touchstart touchend mouseout');
	$(window).off('mouseover mouseout');
	$('.hover-text').off('mousemove');
	$('.floating-action-button').off('mousedown mouseup touchstart touchend');
	$('.switch').off('click');
	$('.range').off('change input');

	eventHover();
	eventButton();
	eventSwitch();
	eventRange();
}

function showHoverText()
{
	$('.global-elements .hover > div').html($(eventHoverTimeoutThis).attr('hover-text'));

	var offset = $(eventHoverTimeoutThis).offset();

	var left = offset.left + ($(eventHoverTimeoutThis).innerWidth() / 2);
	var top = offset.top + $(eventHoverTimeoutThis).innerWidth();

	if(top + 60 > $(window).height())
	{
		$('.global-elements .hover').removeClass('d d-i').addClass('a-i').css('top', '').css('bottom', ($(window).height() - offset.top)+'px').css('left', left+'px');
	}
	else
	{
		$('.global-elements .hover').removeClass('d d-i').addClass('a').css('bottom', '').css('top', top+'px').css('left', left+'px');
	}
}

function activeMenu(query, query2, pos, pos2)
{
	var menu = $(query);

	var pos2 = pos2 || 'top'; 

	var button = $(query2);

	var top = button.offset().top;
	var left = button.offset().left;
	var height = button.outerHeight();
	var width = button.outerWidth()

	menu.children().removeClass('d').addClass('a');

	if(pos == 'auto')
	{
		if(left + (width / 2) < $(window).width() / 2)
		{
			pos = 'left';
		}
		else
		{
			pos = 'right';
		}
	}

	if(pos2 == 'auto')
	{
		if(top + (height / 2) < $(window).height() / 2)
		{
			pos2 = 'top';
		}
		else
		{
			pos2 = 'bottom';
		}
	}

	if(pos == 'left')
	{
		menu.find('.menu-simple').css('right', '').css('left', (left - 8)+'px');
	}
	else
	{
		menu.find('.menu-simple').css('left', '').css('right', (($(window).width() - left) - width)+'px');
	}

	if(pos2 == 'top')
	{
		menu.find('.menu-simple').css('bottom', '').css('top', (top+height+8)+'px');
	}
	else
	{
		menu.find('.menu-simple').css('top', '').css('bottom', (($(window).height() - top))+'px');
	}
}


function activeContextMenu(query)
{
	var menu = $(query);

	menu.children().removeClass('d').addClass('a');
	var menuSimple = menu.find('.menu-simple');

	var rect = menuSimple.get(0).getBoundingClientRect();

	if(currentPageX + rect.width + 16 < $(window).width())
		var pos = 'left';
	else
		var pos = 'right';

	if(currentPageY + rect.height + 16 < $(window).height())
		var pos2 = 'top';
	else
		var pos2 = 'bottom';

	if(pos == 'left')
		menuSimple.css({'right': '', 'left': (currentPageX + 4)+'px'});
	else
		menuSimple.css({'left': '', 'right': (($(window).width() - currentPageX) + 4)+'px'});

	if(pos2 == 'top')
		menuSimple.css({'bottom': '', 'top': (currentPageY + 4)+'px'});
	else
		menuSimple.css({'top': '', 'bottom': (($(window).height() - currentPageY) + 4)+'px'});
}

function desactiveMenu(query, query2)
{
	var menu = $(query);

	menu.children().removeClass('a').addClass('d');

	$(query2+'.p, '+query2+'.c, '+query2+'.a').removeClass('p c a').addClass('d');
}

$(window).on('mousemove touchstart touchmove', function (e){

	currentPageX = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
	currentPageY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;

});

module.exports = {
	eventButton: eventButton,
	eventHover: eventHover,
	events: events,
	showHoverText: showHoverText,
	activeMenu: activeMenu,
	activeContextMenu: activeContextMenu,
	desactiveMenu: desactiveMenu
};