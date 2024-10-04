const pageTurn = require(p.join(appDir, 'scripts/reading/page-transitions/page-turn.js'));

var currentPageTurnDirection = null;

async function pageTurnGoTo(index, animationDuration)
{
	const prevIndex = reading.pageTransitions.prevIndex();

	currentPageTurnDirection = null;
	if(prevIndex == index && !currentPageTurnPercent) return;

	const readingDirection = reading.realReadingDirection();
	const contentRight = template._contentRight();

	const prev = dom.this(contentRight).find('.image-position'+prevIndex, true);
	const current = dom.this(contentRight).find('.image-position'+index, true);

	if(!animationDuration)
	{
		reading.pageTransitions.setVisibility(index, prev, current, animationDuration);
	}
	else
	{
		let now = performance.now();
		let duration = animationDuration;
		let reverse = prevIndex == index ? true : false;

		if(currentPageTurnPercent)
		{
			duration = duration * (1 - currentPageTurnPercent.percent);
			now = now - (animationDuration - duration);
		}

		const pages = await reading.pageTransitions.preparePageTurn(index, prev, current, false, duration);

		current.css({
			transition: 'opacity 0ms',
			opacity: 1,
		});

		reading.pageTransitions.setVisibility(index, prev, current, animationDuration);
		pageTurnAnimation(animationDuration, now, currentPageTurnPercent.percent || 0, (reverse ? currentPageTurnPercent.direction : readingDirection), pages.leftPrev, pages.rightPrev, pages.leftCurrent, pages.rightCurrent, reverse);

		currentPageTurnPercent = false;
	}
}

function generateBoxShadow(percent)
{
	const rightSize = reading.rightSize();
	const size = Math.min(rightSize.width, rightSize.height) / 500;

	bBezier = reading.pageTransitions.bottomBezier2.get(percent);
	percentBezier = bBezier.y / 225;

	return '0px 2px '+(6 + 120 * percent * size)+'px '+(2 + 20 * percent * size)+'px rgba(0, 0, 0, '+(0.15 + 0.5 * percent)+'), 0px 1px '+(2 + 1200 * percent * size)+'px rgba(0, 0, 0,  '+(0.1 + 0.9 * percentBezier)+')';
}

function generateShadow(element, percent)
{
	const rightSize = reading.rightSize();
	const shadow = element.querySelector('.reading-transitions-shadow');

	shadow.style.filter = 'blur('+(rightSize.width / 24 * percent)+'px)';
	shadow.style.backgroundColor = 'rgba(0, 0, 0, '+(0.7 * percent)+')';
}

async function preparePageTurnPercent(index, prev, current, next, pageTurnDirection, directionChanged = false)
{
	let prevTransitions = false;

	if(directionChanged)
	{
		const contentRight = template._contentRight();

		//const leftPages = contentRight.querySelector('.reading-transitions-left > div');
		//const rightPages = contentRight.querySelector('.reading-transitions-right > div');

		prevTransitions = dom.this(contentRight).find('.reading-transitions-left > div > div, .reading-transitions-right > div > div', true);

		zIndexPageTurnBackground = 0;
		zIndexPageTurnForeground = 99999;
	}

	const pages = await reading.pageTransitions.preparePageTurn(index, current, (pageTurnDirection ? next : prev), false, null, pageTurnDirection);

	if(prevTransitions)
		prevTransitions.css({zIndex: -1}).setAttribute('class', '');

	// reading.pageTransitions.setVisibility(index, prev, current, animationDuration);

	return pages;
}

var currentPageTurnPercent = false;

async function pageTurnPercent(index, percent, prev, current, next)
{
	const pageTurnDirection = percent >= 0 ? true : false;

	if(currentPageTurnDirection === null || currentPageTurnDirection != pageTurnDirection || currentPageTurnPercent === false)
	{
		const directionChanged = (currentPageTurnDirection !== null ? currentPageTurnDirection : reading.realReadingDirection()) != pageTurnDirection ? true : false;

		currentPageTurnPercent = false;
		currentPageTurnPercent = await preparePageTurnPercent(index, prev, current, next, pageTurnDirection, directionChanged);

		currentPageTurnDirection = pageTurnDirection;
	}

	currentPageTurnPercent.percent = Math.abs(percent);
	currentPageTurnPercent.direction = pageTurnDirection;
	_pageTurnPercent(Math.abs(percent), pageTurnDirection, currentPageTurnPercent.leftPrev, currentPageTurnPercent.rightPrev, currentPageTurnPercent.leftCurrent, currentPageTurnPercent.rightCurrent, false, false);
}

function _pageTurnPercent(percent, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent)
{
	const percentFirst = percent > 0.5 ? 1 : (percent * 2);
	const percentLast = percent < 0.5 ? 0 : (1 - (percent - 0.5) * 2);

	const bBezier = reading.pageTransitions.bottomBezier2.get(percent);
	const percentBezier = bBezier.y / 225;

	const perspective = _config.readingViewConfig.roughPageTurn.perspective;

	if(readingDirection)
	{
		rightCurrent.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(rightPrev, rightCurrent, percent, true)+')';
		leftPrev.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(leftPrev, leftCurrent, percent, false)+')';

		rightPrev.firstElementChild.style.clipPath = '';
		leftCurrent.firstElementChild.style.clipPath = '';

		if(percent >= 0 && percent < 0.5)
		{
			rightPrev.style.transform = 'perspective('+perspective+'px) rotateY(-'+(90 * percentFirst)+'deg)';
			leftCurrent.style.transform = 'perspective('+perspective+'px) rotateY(-90deg)';

			dom.this(rightPrev).find('oc-img', true).css({boxShadow: generateBoxShadow(percentFirst)});
		}
		else if(percent >= 0.5)
		{
			rightPrev.style.transform = 'perspective('+perspective+'px) rotateY(-90deg)';
			leftCurrent.style.transform = 'perspective('+perspective+'px) rotateY('+(90 * percentLast)+'deg)';

			dom.this(leftCurrent).find('oc-img', true).css({boxShadow: generateBoxShadow(percentLast)});
		}
	}
	else
	{
		rightPrev.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(rightPrev, rightCurrent, percent, true, true)+')';
		leftCurrent.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(leftPrev, leftCurrent, percent, false, true)+')';

		rightCurrent.firstElementChild.style.clipPath = '';
		leftPrev.firstElementChild.style.clipPath = '';

		if(percent >= 0 && percent < 0.5)
		{
			leftPrev.style.transform = 'perspective('+perspective+'px) rotateY('+(90 * percentFirst)+'deg)';
			rightCurrent.style.transform = 'perspective('+perspective+'px) rotateY(90deg)';

			dom.this(leftPrev).find('oc-img', true).css({boxShadow: generateBoxShadow(percentFirst)});
		}
		else if(percent >= 0.5)
		{
			leftPrev.style.transform = 'perspective('+perspective+'px) rotateY(90deg)';
			rightCurrent.style.transform = 'perspective('+perspective+'px) rotateY(-'+(90 * percentLast)+'deg)';

			dom.this(rightCurrent).find('oc-img', true).css({boxShadow: generateBoxShadow(percentLast)});
		}
	}

	generateShadow(rightCurrent, percentBezier);
	generateShadow(rightPrev, percentBezier);
	generateShadow(leftCurrent, percentBezier);
	generateShadow(leftPrev, percentBezier);	
}

function pageTurnAnimation(animationDuration, startNow, startPercent, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent, reverse = false)
{
	const now = performance.now();
	let percent = (now - startNow) / animationDuration;

	if(percent > 1)
		percent = 1;

	if(reverse)
	{
		const ease = reading.pageTransitions.easeBezier.get((percent - startPercent) / (1 - startPercent));
		percent = startPercent - ((startPercent) * (ease.y / 1000));
	}
	else
	{
		const ease = reading.pageTransitions.easeBezier.get((percent - startPercent) / (1 - startPercent));
		percent = startPercent + ((1 - startPercent) * (ease.y / 1000));
	}

	_pageTurnPercent(percent, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent);

	if((percent < 1 && !reverse) || (percent > 0 && reverse))
	{
		requestAnimationFrame(function(){
			pageTurnAnimation(animationDuration, startNow, startPercent, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent, reverse);
		});
	}
	else
	{
		leftPrev.style.opacity = 0;
		rightPrev.style.opacity = 0;
	}
}


module.exports = {
	goTo: pageTurnGoTo,
	percent: pageTurnPercent,
	animation: pageTurnAnimation,
	currentPercent: function(){return currentPageTurnPercent}
};