var buttonCancel, buttonPulsed;

function eventsTab()
{
	app.event('.big-tabs > div > div', 'click', _eventsTab, {capture: false});

	let tabs = document.querySelectorAll('.big-tabs > div > div');

	for(let i = 0, len = tabs.length; i < len; i++)
	{
		tabs[i].dataset.index = i;
	}
}

var eventsTabST = false;

function _eventsTab(event)
{
	if(!this.classList.contains('active') && !eventsTabST)
	{
		let current = this.parentElement.querySelector('.active');
		let currentIndex = +current.dataset.index;
		let currentName = current.dataset.name;

		let index = +this.dataset.index;
		let name = this.dataset.name;
		let onEndAnimation = this.dataset.onEndAnimation;

		current.classList.remove('active');
		this.classList.add('active');


		let contentRight = template._contentRight();

		let currentContent = contentRight.querySelector('.big-tabs-content .big-tabs-'+currentName);
		let content = contentRight.querySelector('.big-tabs-content .big-tabs-'+name);

		let classShow = currentIndex > index ? 'show-from-left' : 'show-from-right';
		let classRemove = currentIndex > index ? 'hide-to-right' : 'hide-to-left';

		currentContent.classList.add(classRemove, 'show');
		currentContent.classList.remove('active');

		eventsTabST = setTimeout(function(){

			content.classList.add(classShow, 'active');

			eventsTabST = setTimeout(function(){

				content.classList.remove(classShow);
				currentContent.classList.remove(classRemove, 'show');

				if(onEndAnimation)
					eval(onEndAnimation);

				eventsTabST = false;

			}, 250);

		}, 250);
	}
}

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

switchRemoveAnimeST = false;

function switchRemoveAnime()
{
	clearTimeout(switchRemoveAnimeST);

	switchRemoveAnimeST = setTimeout(function(){

		let switchs = document.querySelectorAll('.switch.animeOn, .switch.animeOff');

		for(let i = 0, len = switchs.length; i < len; i++)
		{
			switchs[i].classList.remove('animeOn', 'animeOff');
		}

	}, 1000);
}

function eventSwitch()
{
	$('.switch').on('click.events', function(){

		let _this = $(this);

		if(_this.hasClass('a'))
		{
			_this.addClass('animeOff').removeClass('a animeOn');
			callbackString(_this.attr('off'));
		}
		else
		{
			_this.addClass('a animeOn').removeClass('animeOff');
			callbackString(_this.attr('on'));
		}

		switchRemoveAnime();

	});
}

var rangeMoveStepST = false;

function rangeMoveStep(This, stepToSum = 1)
{
	clearTimeout(rangeMoveStepST);

	let range = This.querySelector('input[type="range"]');

	if(range)
	{
		let value = +range.value;
		let step = +range.getAttribute('step') || 1;

		range.value = value + (step * stepToSum);

		_eventRange.call(range, {type: 'gamepad'});
	}

	rangeClipPath(range.closest('.simple-slider'), true)

	rangeMoveStepST = setTimeout(function(){

		rangeRemoveClipPath(range.closest('.simple-slider'))

	}, 1000);
}

function rangePosition(input, range)
{
	let value = +input.value;
	let min = +input.getAttribute('min') || 0;
	let max = +input.getAttribute('max');
	let step = input.getAttribute('step');

	let percent = (value - min) / (max - min) * 100;

	range.querySelector('.range-line').style.width = percent+'%';
	range.querySelector('.range-point').style.left = percent+'%';

	if(step && (max - min) / step < 60) // Only show steps if has less 60
	{
		let rangeSteps = range.querySelectorAll('.range-steps > div');
		let len = rangeSteps.length;

		let total = Math.round((max - min) / step);

		if(len > 0)
		{
			for(let i = 0; i < len; i++)
			{
				if(i * step > (value - min))
					rangeSteps[i].classList.remove('active');
				else
					rangeSteps[i].classList.add('active');
			}
		}
		else
		{
			let steps = '';

			for(let i = 0; i <= total; i++)
			{
				steps += '<div'+(i * step > (value - min) ? '' : ' class="active"')+' style="left: '+(i / total * 100)+'%"></div>';
			}

			range.querySelector('.range-steps').innerHTML = steps;
		}
	}
}

function _eventRange(event)
{
	let range = $(this).closest('.range');

	let onrange = this.getAttribute('onrange');

	let value;
	let value_txt = value = this.value;

	let step = this.getAttribute('step');

	rangePosition(this, range.get(0));

	if(step)
	{
		let num_v = value_txt.replace(/.*?(\.|$)/, '').length;

		let num_s = step.replace(/.*?(\.|$)/, '').length;

		if(num_s != 0)
			value_txt = value_txt+(value_txt.match(/\./) ? '' : '.')+('0'.repeat(num_s - num_v));
	}

	let callback = hb.compile(onrange)({
		value: value,
		toEnd: (event.type == 'input' ? 'false' : 'true'),
	});

	callbackString(callback);

	range.siblings('.simple-slider-text').find('span').html(value_txt);
}

function eventRange()
{
	$('.range input').on('change.events input.events', _eventRange);
	$('.range input').on('touchstart mousedown', function(){rangeClipPath(this.closest('.simple-slider'))});
	$('.range input').on('touchend mouseup', function(){rangeRemoveClipPath(this.closest('.simple-slider'))});

	let ranges = document.querySelectorAll('.range');

	for(let i = 0, len = ranges.length; i < len; i++)
	{
		let range = ranges[i];
		let input = range.querySelector('input');

		rangePosition(input, range);
	}
}

function rangeClipPath(range, moveToTop = false)
{
	let menu = range.closest('.menu');
	let menuSimple = range.closest('.menu-simple');

	if(menuSimple && !menuSimple.dataset.clipPath)
	{
		let menuGamepad = menu.classList.contains('menu-gamepad');

		let rect = menuSimple.getBoundingClientRect();
		let _rectRange = range.getBoundingClientRect();

		let rectRange = {
			left: _rectRange.left + (menuGamepad ? 0 : 12),
			right: _rectRange.right - (menuGamepad ? 0 : 13),
			top: _rectRange.top - 6,
			bottom: _rectRange.bottom - 6,
			width: _rectRange.width - (menuGamepad ? 0 : 25),
			height: _rectRange.height,
		};

		let left = rectRange.left - rect.left;
		let right = rect.right - rectRange.right;
		let top = rectRange.top - rect.top;
		let bottom = rect.bottom - rectRange.bottom;

		// if(moveToTop) menu.style.transform = 'translateY(-'+(rectRange.top - 56)+'px)';
		menuSimple.dataset.clipPath = '1';
		menuSimple.style.clipPath = 'inset('+top+'px '+right+'px '+bottom+'px '+left+'px round 14px)';

		dom.this(menuSimple).siblings('.menu-close').css({cssText: 'opacity: 0 !important'});

		dom.this(menuSimple).siblings('.menu-clip-path-shadow').css({
			opacity: 1,
			left: rectRange.left+'px',
			top: rectRange.top+'px',
			width: rectRange.width+'px',
			height: rectRange.height+'px',
		});
	}
}

function rangeRemoveClipPath(range)
{
	let menu = range.closest('.menu');
	let menuSimple = range.closest('.menu-simple');

	if(menuSimple)
	{
		menu.style.transform = '';
		menuSimple.dataset.clipPath = '';
		menuSimple.style.clipPath = '';

		dom.this(menuSimple).siblings('.menu-close, .menu-clip-path-shadow', true).css({opacity: ''});
	}
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
	eventsTab();
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

var fromGamepadMenu = false;

function activeMenu(query, query2 = false, posX = 'left', posY = 'top')
{
	let menu = document.querySelector(query);
	let menuSimple = document.querySelector(query+' .menu-simple');

	let top = 0,
		left = 0,
		height = 0,
		width = 0;

	if(query2)
	{
		let button = document.querySelector(query2);
		let rect = button.getBoundingClientRect();

		top = rect.top;
		left = rect.left;
		height = rect.height;
		width = rect.width;
	}

	for(let i = 0, len = menu.children.length; i < len; i++)
	{
		menu.children[i].classList.remove('d');
		menu.children[i].classList.add('a');
	}

	if(posX == 'auto')
	{
		if(left + (width / 2) < window.innerWidth / 2)
			posX = 'left';
		else
			posX = 'right';
	}

	if(posY == 'auto')
	{
		if(top + (height / 2) < window.innerHeight / 2)
			posY = 'top';
		else
			posY = 'bottom';
	}

	if(posX == 'left')
	{
		menuSimple.style.right = '';
		menuSimple.style.left = (left - 8)+'px';
	}
	else
	{
		menuSimple.style.right = ((window.innerWidth - left) - width)+'px';
		menuSimple.style.left = '';
	}

	if(posY == 'top' || posY == 'gamepad')
	{
		menuSimple.style.bottom = '';
		menuSimple.style.top = (top + height + 8)+'px';
	}
	else
	{
		menuSimple.style.bottom = ((window.innerHeight - top))+'px';
		menuSimple.style.top = '';
	}

	if(posX == 'gamepad')
		menu.classList.add('menu-gamepad');
	else
		menu.classList.remove('menu-gamepad');

	fromGamepadMenu = (posX == 'gamepad' && posY == 'gamepad') ? true : false;

	shortcuts.pause();
	gamepad.updateBrowsableItems('menu');
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

	menu.removeClass('menu-gamepad');
}

function desactiveMenu(query, query2 = false)
{
	var menu = $(query);

	menu.children().removeClass('a').addClass('d');

	if(query2) $(query2+'.p, '+query2+'.c, '+query2+'.a').removeClass('p c a').addClass('d');

	if(!onReading)
		gamepad.updateBrowsableItemsPrevKey();
	else
		gamepad.cleanBrowsableItems();

	shortcuts.play();

	if(fromGamepadMenu)
		gamepad.showMenu();
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
	rangeMoveStep: rangeMoveStep,
};