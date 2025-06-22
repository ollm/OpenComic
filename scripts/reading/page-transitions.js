const Bezier = require('bezier-js').Bezier;

const bottomBezier = new Bezier(0,0, 500,200, 500,200, 1000,0),
	bottomBezier2 = new Bezier(0,0, 500,300, 500,300, 1000,0),
	accelerateBezier = new Bezier(0,0, 500,200, 500,200, 1000,0),
	easeBezier = new Bezier(0,0, 250,100, 250,1000, 1000,1000),
	easeInBezier = new Bezier(0,0, 400,0, 1000,1000, 1000,1000),
	easeOutQuadBezier = new Bezier(0,0, 500,1000, 890,1000, 1000,1000);

const roughPageTurn = require(p.join(appDir, 'scripts/reading/page-transitions/rough-page-turn.js')),
	smoothPageTurn = require(p.join(appDir, 'scripts/reading/page-transitions/smooth-page-turn.js'));

var prevDirection = null, prevIndex = -1, waitTransition = false, waitTransitionResolver = false;

async function goToIndex(index, animation)
{
	if(!animation)
	{
		prevDirection = null;
		prevIndex = -1;
	}

	const readingDirection = reading.realReadingDirection();

	queue.add('pageTransitions', async function(index, animation, readingDirection) {

		if(prevDirection !== null && prevDirection != readingDirection && waitTransition)
		{
			purgeQueue(readingDirection);
			await waitTransition;
		}

		_goToIndex(index, animation);

		return;

	}, index, animation, readingDirection);
}

async function _goToIndex(index, animation)
{
	const readingView = reading.readingView();

	if(!animation) prevDirection = null;
	const readingDirection = reading.realReadingDirection();

	index = index - 1;
	let animationDuration = ((animation) ? _config.readingViewSpeed * 1000 : 0);

	if(readingView == 'fade')
		fadeGoTo(index, animationDuration);
	else if(readingView == 'rough-page-turn')
		await roughPageTurn.goTo(index, animationDuration/* * 1.5*/);
	else if(readingView == 'smooth-page-turn')
		await smoothPageTurn.goTo(index, animationDuration/* * 1.5*/);

	prevDirection = readingDirection;
	prevIndex = index;
}

// Touchmove transition
var touchStartExecuted = false;

async function touchstart(event, touchevents)
{
	touchStartExecuted = false;
}

async function _touchstart(event, touchevents)
{
	if(touchStartExecuted) return;
	touchStartExecuted = true;

	const contentRight = template._contentRight();
	const readingView = reading.readingView();

	const prev = dom.this(contentRight).find('.image-position'+(prevIndex - 1), true);
	const current = dom.this(contentRight).find('.image-position'+prevIndex, true);
	const next = dom.this(contentRight).find('.image-position'+(prevIndex + 1), true);

	prev.addClass('active').css({
		zIndex: zIndex + 1,
	});

	current.addClass('active').css({
		zIndex: zIndex,
	});

	next.addClass('active').css({
		zIndex: zIndex + 1,
	});
}

var touchmoveRunning = false;

async function touchmove(event, touchevents)
{
	if(touchmoveRunning) return;
	touchmoveRunning = true;

	const readingView = reading.readingView();

	if(!touchStartExecuted && readingView == 'fade') await _touchstart(event, touchevents);

	const contentRight = template._contentRight();

	const prev = dom.this(contentRight).find('.image-position'+(prevIndex - 1), true);
	const current = dom.this(contentRight).find('.image-position'+prevIndex, true);
	const next = dom.this(contentRight).find('.image-position'+(prevIndex + 1), true);

	const pageX = app.pageX(event);
	const pageY = app.pageY(event);
	const vertical = (pageY - touchevents.contentRect.top) / touchevents.contentRect.height;
	const startVertical = (app.pageY(touchevents) - touchevents.contentRect.top) / touchevents.contentRect.height;
	let percent = (app.pageX(touchevents) - pageX) / touchevents.contentRect.width;

	if(percent > 1)
		percent = 1;
	else if(percent < -1)
		percent = -1;

	if(readingView == 'fade')
		fadePercent(percent, prev, next);
	else if(readingView == 'rough-page-turn')
		await roughPageTurn.percent(prevIndex, percent, prev, current, next);
	else if(readingView == 'smooth-page-turn')
		await smoothPageTurn.percent(prevIndex, percent, vertical, startVertical, prev, current, next);

	touchmoveRunning = false;
}


function purgeQueue()
{
	const _queue = queue.get('pageTransitions');

	let newQueue = [];

	const last = _queue.pop();

	if(last)
		newQueue.push(last);

	queue.set('pageTransitions', newQueue);
}

var zIndex = 1, zIndexST = false, changedDirection;

function setVisibility(index, prev, current, animationDuration, reverse = false)
{
	clearTimeout(zIndexST);

	const contentRight = template._contentRight();
	
	current.addClass('active').css({
		zIndex: zIndex + 1,
	});

	if(animationDuration)
	{
		if(prev)
		{
			prev.addClass('active').css({
				zIndex: zIndex,
			});
		}

		if(!waitTransition)
		{
			waitTransition = new Promise(function(resolve, reject) {

				waitTransitionResolver = resolve;

			});
		}

		zIndex++;


		const readingView = reading.readingView();
		const currentPercent = (readingView == 'rough-page-turn') ? roughPageTurn.currentPercent() : smoothPageTurn.currentPercent();
		let duration = animationDuration;

		if(currentPercent)
		{
			const reverse = prevIndex == index ? true : false;
			duration = duration * (1 - currentPercent.percent);
		}

		zIndexST = setTimeout(function(){

			dom.this(contentRight).find('.r-flex.active:not(.image-position'+index+')', true).removeClass('active').css({
				transition: '',
				opacity: '',
				zIndex: '',
			});

			zIndex = 1;

			requestAnimationFrame(function(){

				waitTransitionResolver();
				waitTransition = false;

			});


		}, duration);
	}
	else
	{
		dom.this(contentRight).find('.r-flex.active:not(.image-position'+index+')', true).removeClass('active').css({
			transition: '',
			opacity: '',
			zIndex: '',
		});

		zIndex = 1;
	}
}

function getImageSize(element, secondPage = false)
{
	const rightSize = reading.rightSize();
	const rightSizeWidthHalf = rightSize.width / 2;

	const images = element.querySelectorAll('.r-img > *');
	const len = images.length;

	let data = {};

	if(len)
	{
		const image = secondPage && len > 1 ? images[1] : images[0];

		let top, bottom, left, right, width, height;

		height = +image.dataset.height;

		top = +image.dataset.top;
		bottom = (rightSize.height - (top + height));

		if(len > 1)
		{
			width = +image.dataset.width;

			if(secondPage)
			{
				left = (+images[0].dataset.width + +images[0].dataset.left + +image.dataset.left) - rightSizeWidthHalf;
				right = rightSizeWidthHalf - left - width;
			}
			else
			{
				left = +image.dataset.left;
				right = rightSizeWidthHalf - (left + width);
			}
		}
		else
		{
			width = +image.dataset.width / 2;

			if(secondPage)
			{
				left = 0;
				right = rightSizeWidthHalf - width;
			}
			else
			{
				left = +image.dataset.left;
				right = 0;
			}
		}

		// Offset
		if(secondPage)
			left += rightSizeWidthHalf;
		else
			right += rightSizeWidthHalf;

		data = {
			top: top,
			left: left,
			right: right,
			bottom: bottom,
			width: width,
			height: height,
			len: len,
		};
	}

	return data;
}

// Fade
function fadeGoTo(index, animationDuration)
{
	const contentRight = template._contentRight();

	const prev = dom.this(contentRight).find('.image-position'+prevIndex, true);
	const current = dom.this(contentRight).find('.image-position'+index, true);

	current.css({
		transition: 'opacity '+animationDuration+'ms',
		opacity: 1,
	});

	setVisibility(index, prev, current, animationDuration);
}

function fadePercent(percent, prev, next)
{
	const opacityPrev = percent < 0 ? -(percent) : 0;
	const opacityNext = percent > 0 ? percent : 0;

	prev.css({
		transition: '0s',
		opacity: opacityPrev,
	});

	next.css({
		transition: '0s',
		opacity: opacityNext,
	});
}

function generateClipPath(from, to, percent, secondPage = false, reverse = false)
{
	const fromSize = getImageSize(from, secondPage);
	const toSize = getImageSize(to, secondPage);

	const ease = easeOutQuadBezier.get(percent);
	const m = (ease.y / 1000);

	if(fromSize.len && toSize.len)
	{
		let right, left, top, bottom;

		if(reverse)
		{
			if(secondPage)
			{
				left = (percent > 0.55 ? toSize.left - 1 : 0);
				right = fromSize.right < toSize.right ? fromSize.right - ((fromSize.right - toSize.right) * m) : 0;
			}
			else
			{
				left = toSize.left < fromSize.left ? fromSize.left - ((fromSize.left - toSize.left) * m) : 0;
				right = (percent < 0.45 ? fromSize.right - 1 : 0);
			}
		}
		else
		{
			if(secondPage)
			{
				left = (percent < 0.45 ? fromSize.left - 1 : 0);
				right = fromSize.right > toSize.right ? fromSize.right - ((fromSize.right - toSize.right) * m) : 0;
			}
			else
			{
				left = toSize.left > fromSize.left ? fromSize.left - ((fromSize.left - toSize.left) * m) : 0;
				right = (percent > 0.55 ? toSize.right - 1 : 0);
			}
		}

		top = fromSize.top + ((toSize.top - fromSize.top) * m);
		bottom = fromSize.bottom + ((toSize.bottom - fromSize.bottom) * m);

		return top+'px '+right+'px '+bottom+'px '+left+'px';
	}
	else
	{
		return '0px 0px 0px 0px';
	}
}

// Clone pages
var zIndexPageTurnBackground = 0, zIndexPageTurnForeground = 99999, zIndexPageTurnST = false;

function createPageTurnElement(original, toInsert, zIndex)
{
	const cloned = original.cloneNode(true);
	const div = document.createElement('div');
	const shadow = document.createElement('div');
	const color = document.createElement('div');
	const svg = document.createElement('svg');

	svg.innerHTML = '<svg width="0" height="0"><defs><clipPath id="clip-path-intern-'+zIndex+'"><path fill="white"/></clipPath><clipPath id="clip-path-'+zIndex+'" clip-path="url(#clip-path-intern-'+zIndex+')"><path fill="white"/></clipPath></defs></svg>';
	svg.classList.add('clip-path-'+zIndex);

	div.style.zIndex = zIndex;
	div.dataset.zIndex = zIndex;
	div.classList.add('reading-transitions-'+zIndex);

	shadow.classList.add('reading-transitions-shadow');
	color.classList.add('reading-transitions-color');

	div.insertAdjacentElement('beforeend', cloned);
	div.insertAdjacentElement('beforeend', shadow);
	div.insertAdjacentElement('beforeend', color);
	div.insertAdjacentElement('beforeend', svg);

	toInsert.insertAdjacentElement('beforeend', div);

	return div;
}

async function preparePageTurn(index, prev, current, next, animationDuration = false, readingDirection = null, center = false)
{
	clearTimeout(zIndexPageTurnST);

	const readingView = reading.readingView();
	const currentPercent = (readingView == 'rough-page-turn') ? roughPageTurn.currentPercent() : smoothPageTurn.currentPercent();

	const contentRight = template._contentRight();

	const readingTransitions = contentRight.querySelector('.reading-transitions');
	const leftPages = contentRight.querySelector('.reading-transitions-left > div');
	const rightPages = contentRight.querySelector('.reading-transitions-right > div');
	const centerPages = contentRight.querySelector('.reading-transitions-center > div');

	centerPages.style.opacity = center ? 1 : 0;

	if(!currentPercent)
	{
		readingDirection = readingDirection !== null ? readingDirection : reading.realReadingDirection();

		let leftPrev, leftCurrent, rightPrev, rightCurrent;

		if(readingDirection)
		{
			// Left
			leftPrev = leftPages.querySelector('.reading-transitions-'+(zIndexPageTurnBackground - 1)) || centerPages.querySelector('.reading-transitions-'+(100000 + zIndexPageTurnBackground - 1)) || createPageTurnElement(prev._this[0], leftPages, zIndexPageTurnBackground);
			zIndexPageTurnBackground++;
			leftCurrent = center ? createPageTurnElement(current._this[0], centerPages, 100000 + zIndexPageTurnBackground) : createPageTurnElement(current._this[0], leftPages, zIndexPageTurnBackground);

			// Right
			rightPrev = rightPages.querySelector('.reading-transitions-'+(zIndexPageTurnForeground + 1)) || createPageTurnElement(prev._this[0], rightPages, zIndexPageTurnForeground);
			zIndexPageTurnForeground--;
			rightCurrent = createPageTurnElement(current._this[0], rightPages, zIndexPageTurnForeground);
		}
		else
		{
			// Left
			leftPrev = leftPages.querySelector('.reading-transitions-'+(zIndexPageTurnForeground + 1)) || createPageTurnElement(prev._this[0], leftPages, zIndexPageTurnForeground);
			zIndexPageTurnForeground--;
			leftCurrent = createPageTurnElement(current._this[0], leftPages, zIndexPageTurnForeground);

			// Right
			rightPrev = rightPages.querySelector('.reading-transitions-'+(zIndexPageTurnBackground - 1)) || centerPages.querySelector('.reading-transitions-'+(100000 + zIndexPageTurnBackground - 1)) || createPageTurnElement(prev._this[0], rightPages, zIndexPageTurnBackground);
			zIndexPageTurnBackground++;
			rightCurrent = center ? createPageTurnElement(current._this[0], centerPages, 100000 + zIndexPageTurnBackground) : createPageTurnElement(current._this[0], rightPages, zIndexPageTurnBackground);
		}

		zIndexPageTurnBackground++;
		zIndexPageTurnForeground--;

		if(animationDuration !== null)
		{
			zIndexPageTurnST = setTimeout(function(){

				leftPages.innerHTML = '';
				rightPages.innerHTML = '';
				centerPages.innerHTML = '';

				zIndexPageTurnBackground = 0;
				zIndexPageTurnForeground = 99999;

				readingTransitions.classList.remove('active');

			}, animationDuration);
		}

		const promises = [];
		const iframes = readingTransitions.querySelectorAll('iframe:not(.hasEvent)');

		for(let i = 0, len = iframes.length; i < len; i++)
		{
			const iframe = iframes[i];
			iframe.classList.add('hasEvent');

			promises.push(new Promise(function(resolve, reject) {

				iframe.addEventListener('load', function(){

					iframe.classList.add('active');
					resolve();

				});

			}));
		}

		await Promise.all(promises);
		readingTransitions.classList.add('active');

		return {
			leftPrev: leftPrev,
			leftCurrent: leftCurrent,
			rightPrev: rightPrev,
			rightCurrent: rightCurrent,
		};
	}
	else
	{
		if(animationDuration !== null)
		{
			zIndexPageTurnST = setTimeout(function(){

				leftPages.innerHTML = '';
				rightPages.innerHTML = '';
				centerPages.innerHTML = '';

				zIndexPageTurnBackground = 0;
				zIndexPageTurnForeground = 99999;

				readingTransitions.classList.remove('active');

			}, animationDuration);
		}

		return currentPercent;
	}
}

var perspectives = [
	1000000,
	36696,
	33360,
	30327,
	27570,
	25064,
	22785,
	20714,
	18831,
	17119,
	15563,
	14148,
	12862,
	11693,
	10630,
	9664,
	8785,
	7986,
	7260,
	6600,
	6000,
	5217,
	4537,
	3945,
	3430,
	2983,
	2594,
	2256,
	1962,
	1706,
	1483,
	1290,
	1122,
	976,
	849,
	738,
	642,
	558,
	485,
	422,
	367,
];

function change(transition, key, value)
{
	switch (key)
	{
		case 'perspective':

			value = perspectives[value];

			break;
	}

	_config.readingViewConfig[transition][key] = value;
	reading.updateReadingPagesConfig('readingViewConfig', _config.readingViewConfig);
}

function configDialog(event, transition)
{
	event.stopPropagation();

	if(transition == 'roughPageTurn')
	{
		const keys = perspectives.reduce(function(obj, value, index) {
			obj[value] = index;
			return obj;
		}, {});

		handlebarsContext.perspective = keys[_config.readingViewConfig.roughPageTurn.perspective];

		events.dialog({
			header: language.reading.pages.roughPageTurn,
			width: 500,
			height: 234,
			content: template.load('dialog.reading.transition.config.rough.html'),
			buttons: [
				{
					text: language.buttons.close,
					function: 'events.closeDialog();',
				}
			],
		});
	}
	else if(transition == 'smoothPageTurn')
	{
		handlebarsContext.angle = _config.readingViewConfig.smoothPageTurn.angle;

		events.dialog({
			header: language.reading.pages.smoothPageTurn,
			width: 500,
			height: 234,
			content: template.load('dialog.reading.transition.config.smooth.html'),
			buttons: [
				{
					text: language.buttons.close,
					function: 'events.closeDialog();',
				}
			],
		});
	}

	events.events();
}

module.exports = {
	goToIndex: goToIndex,
	touchstart: touchstart,
	touchmove: touchmove,
	setVisibility: setVisibility,
	preparePageTurn: preparePageTurn,
	getImageSize: getImageSize,
	generateClipPath: generateClipPath,
	prevIndex: function(){return prevIndex},

	bottomBezier: bottomBezier,
	bottomBezier2: bottomBezier2,
	accelerateBezier: accelerateBezier,
	easeBezier: easeBezier,
	easeInBezier: easeInBezier,
	easeOutQuadBezier: easeOutQuadBezier,

	change: change,
	configDialog: configDialog,
};