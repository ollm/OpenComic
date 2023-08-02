var buttonCancel, buttonPulsed;

function eventButton()
{

	$('.button').on('mousedown.events touchstart.events', function(e){

		$(this).removeClass('p c d').addClass('a');
		clearTimeout(eventHoverTimeout);

		buttonCancel = false;
		buttonPulsed = true;

	});

	$('.button').on('mouseup.events touchend.events', function(e){

		if(!buttonCancel)
		{
			$(this).removeClass('a c d').addClass('p');
		}

		buttonPulsed = false;

	});

	$('.button').on('mouseout.events', function(){

		if(buttonPulsed)
		{
			buttonCancel = true;
			$(this).removeClass('a p d').addClass('c');

			buttonPulsed = false;
		}

	});

	$('.floating-action-button').on('mousedown.events touchstart.events', function(e){

		$(this).removeClass('p c d').addClass('a');
		clearTimeout(eventHoverTimeout);
		buttonCancel = false;
		buttonPulsed = true;

	});

	$('.floating-action-button').on('mouseup.events touchend.events', function(e){

		if(!buttonCancel)
		{
			$(this).removeClass('a c d').addClass('p');
		}

		buttonPulsed = false;

	});

	$('.floating-action-button').on('mouseleave.events', function(){

		if(buttonPulsed)
		{
			buttonCancel = true;
			$(this).removeClass('a p d').addClass('c');

			buttonPulsed = false;
		}

	});

}

var eventHoverTimeout, eventHoverTimeoutThis, eventHoverTimeoutActive = false, showedHoverText = false, currentPageX, currentPageY;

function eventHover()
{

	$('.hover-text').on('mouseenter', function(){

		eventHoverTimeoutActive = true;

		eventHoverTimeoutThis = this;

		//eventHoverTimeout = setTimeout('events.showHoverText()', 300);

	});

	$('.hover-text').on('mouseleave.events', function(){

		hideHoverText();

	});

	$(document).on('mouseleave.events', function(){

		hideHoverText();

		clearTimeout(eventHoverTimeout);

	});

	$(window).on('mousedown.events touchstart.events', function(){

		hideHoverText();

	});

	$(window).on('mousemove.events', function(e){

		clearTimeout(eventHoverTimeout);

		if(eventHoverTimeoutActive)
			eventHoverTimeout = setTimeout('events.showHoverText()', 300);
		else
			hideHoverText();

	});

	$(window).on('mousemove.events touchstart.events touchmove', function(e){

		currentPageX = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
		currentPageY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;

	});

}

function eventSwitch()
{

	$('.switch').on('click.events', function(){

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
	$('.range').on('change.events input.events', function(event) {

		var onrange = $(this).attr('onrange');

		var value;
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

		if(value != this.dataset.prevValue)
			callbackString(callback);

		this.dataset.prevValue = value;

		$(this).siblings('.simple-slider-text').find('span').html(value_txt);
	});
}

function events()
{
	$('.button').off('mousedown.events mouseup.events touchstart.events touchend.events mouseout.events');
	$(window).off('mouseleave.events mousedown.events mousemove.events');
	$(document).off('mouseleave.events');
	$('.hover-text').off('mousemove.events');
	$('.floating-action-button').off('mousedown.events mouseup.events touchstart.events touchend.events');
	$('.switch').off('click.events');
	$('.range').off('change.events input.events');

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

	showedHoverText = true;
}

function hideHoverText()
{
	eventHoverTimeoutActive = false;

	if(showedHoverText)
	{
		eventHoverTimeoutActive = false;

		$('.global-elements .hover.a-i').removeClass('a-i').addClass('d-i');
		$('.global-elements .hover.a').removeClass('a').addClass('d');

		showedHoverText = false;
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

// Dialogs
var closeDialogST = false;

function dialog(config)
{
	clearTimeout(closeDialogST);

	config.width = (config.width) ? config.width : 280;
	config.buttonsInNewLine = config.buttonsInNewLine;

	handlebarsContext.dialog = config;

	$('.dialogs').html(template.load('dialog.html'));

	onReading = false;
	generateAppMenu();
}

function closeDialog()
{
	clearTimeout(closeDialogST);

	$('.dialogs .dialog, .dialogs .dialog-close').addClass('hide');

	closeDialogST = setTimeout(function(){

		$('.dialogs .dialog, .dialogs .dialog-close').remove();

	}, 150);

	onReading = _onReading;
	generateAppMenu();
}

// Snackbar
var snackbarQueue = [],
	snackbarCurrent = false,
	snackbarST = false;

function snackbar(config)
{
	if(!snackbarCurrent)
	{
		clearTimeout(snackbarST);

		snackbarCurrent = config;

		var duration = config.duration;

		if(duration > 10)
			duration = 10;
		else if(duration < 4)
			duration = 4;

		handlebarsContext.snackbar = config;

		$('.snackbars').html(template.load('snackbar.html'));

		snackbarST = setTimeout(function() {

			$('.snackbars .snackbar').addClass('hide');

			snackbarST = setTimeout(function() {

				$('.snackbars .snackbar').remove();

				snackbarCurrent = false;

				if(snackbarQueue.length > 0)
				{
					var config = snackbarQueue.shift();

					snackbar(config);
				}

			}, 300);

		}, duration * 1000);
	}
	else	
	{
		var isset = false;

		for(let key in snackbarQueue)
		{
			if(config.key == snackbarQueue[key].key)
			{
				isset = true;

				if(config.update)
					snackbarQueue[key] = config;
			}
		}

		if(!isset && (!snackbarCurrent || (snackbarCurrent.key != config.key || config.update)))
		{
			snackbarQueue.push(config);
		}
	}
}

function closeSnackbar()
{
	clearTimeout(snackbarST);

	$('.snackbars .snackbar').addClass('hide');

	snackbarST = setTimeout(function() {

		$('.snackbars .snackbar').remove();

		snackbarCurrent = false;

		if(snackbarQueue.length > 0)
		{
			var config = snackbarQueue.shift();

			snackbar(config);
		}

	}, 300);

}

module.exports = {
	eventButton: eventButton,
	eventHover: eventHover,
	events: events,
	showHoverText: showHoverText,
	hideHoverText: hideHoverText,
	activeMenu: activeMenu,
	activeContextMenu: activeContextMenu,
	desactiveMenu: desactiveMenu,
	dialog: dialog,
	closeDialog: closeDialog,
	snackbar: snackbar,
	closeSnackbar: closeSnackbar,
};