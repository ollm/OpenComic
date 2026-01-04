const Bezier = require('bezier-js').Bezier;
const pageTurn = require(p.join(appDir, '.dist/reading/page-transitions/page-turn.js'));

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

		const pages = await reading.pageTransitions.preparePageTurn(index, prev, current, false, duration, null, true);

		current.css({
			transition: 'opacity 0ms',
			opacity: 1,
		});

		reading.pageTransitions.setVisibility(index, prev, current, animationDuration);
		pageTurnAnimation(animationDuration, now, currentPageTurnPercent.percent || 0, (reverse ? currentPageTurnPercent.direction : readingDirection), pages.leftPrev, pages.rightPrev, pages.leftCurrent, pages.rightCurrent, reverse, currentPageTurnPercent.vertical, currentPageTurnPercent.startVertical);

		currentPageTurnPercent = false;
	}
}

function generateBoxShadow(percent)
{
	const rightSize = reading.rightSize();
	const size = Math.min(rightSize.width, rightSize.height) / 500;

	return '0px 2px '+(6 + 120 * percent * size)+'px '+(2 + 20 * percent * size)+'px rgba(0, 0, 0, '+(0.15 + 0.5 * percent)+'), 0px 1px '+(2 + 1200 * percent * size)+'px rgba(0, 0, 0,  '+(0.3 + 0.7 * percent)+')';
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
	if(directionChanged)
	{
		const contentRight = template._contentRight();

		//const leftPages = contentRight.querySelector('.reading-transitions-left > div');
		//const rightPages = contentRight.querySelector('.reading-transitions-right > div');

		dom.this(contentRight).find('.reading-transitions-left > div > div, .reading-transitions-right > div > div, .reading-transitions-center > div > div', true).css({zIndex: -1}).setAttribute('class', '');

		zIndexPageTurnBackground = 0;
		zIndexPageTurnForeground = 99999;
	}

	const pages = await reading.pageTransitions.preparePageTurn(index, current, (pageTurnDirection ? next : prev), false, null, pageTurnDirection, true);

	// reading.pageTransitions.setVisibility(index, prev, current, animationDuration);

	return pages;
}

var currentPageTurnPercent = false;

async function pageTurnPercent(index, percent, vertical, startVertical, prev, current, next)
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
	currentPageTurnPercent.vertical = vertical;
	currentPageTurnPercent.startVertical = startVertical;

	_pageTurnPercent(Math.abs(percent), vertical, startVertical, pageTurnDirection, currentPageTurnPercent.leftPrev, currentPageTurnPercent.rightPrev, currentPageTurnPercent.leftCurrent, currentPageTurnPercent.rightCurrent, false, false);
}

function _pageTurnPercent(percent, vertical, startVertical, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent)
{
	if(percent > 1)
		percent = 1;
	else if(percent < 0)
		percent = 0;

	vertical = 0.5 + ((startVertical - vertical) / 2) + ((startVertical - 0.5) / 5);

	if(vertical > 1)
		vertical = 1;
	else if(vertical < 0)
		vertical = 0;
	else if(vertical == 0.5)
		vertical = 0.50001;

	const verticalFlip = vertical < 0.5 ? true : false;

	const rightSize = reading.rightSize();
	const rightSizeWidthHalf = rightSize.width / 2;

	const percentFirst = percent > 0.5 ? 1 : (percent * 2);
	const percentLast = percent < 0.5 ? 0 : (1 - (percent - 0.5) * 2);

	const bBezier = reading.pageTransitions.bottomBezier2.get(percent);
	const percentBezier = bBezier.y / 225;

	const size = reading.pageTransitions.getImageSize(leftPrev, true);
	const sizeRight = reading.pageTransitions.getImageSize(rightPrev, true);
	const sizeLeftCurrent = reading.pageTransitions.getImageSize(leftCurrent, false);
	const sizeRightCurrent = reading.pageTransitions.getImageSize(rightCurrent, false);

	const width = readingDirection ? sizeRight.width : size.width;
	const height = readingDirection ? sizeRight.height : size.height;

	const p = (2 - (percent * 2)) - 1;
	let transition;

	if(readingDirection)
	{
		if(verticalFlip)
			transition = flipPageTransition(generatePageTransition(width, height, 1 - vertical, p), {vertical: true, size: size});
		else
			transition = generatePageTransition(width, height, vertical, p);
	}
	else
	{
		if(verticalFlip)
			transition = flipPageTransition(generatePageTransition(width, height, 1 - vertical, p), {horizontal: true, vertical: true, size: sizeRightCurrent});
		else
			transition = flipPageTransition(generatePageTransition(width, height, vertical, p), {horizontal: true, size: sizeRightCurrent});
	}

	if(!transition) return;

	if(readingDirection)
	{
		rightCurrent.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(rightPrev, rightCurrent, percent, true)+')';
		leftPrev.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(leftPrev, leftCurrent, percent, false)+')';
		rightPrev.firstElementChild.style.clipPath = '';
		leftCurrent.firstElementChild.style.clipPath = '';

		const leftTranslateX = transition.reverse.img.translate.x + intermediateValue((rightSizeWidthHalf - sizeLeftCurrent.left), width + 1, percent);
		const offsetX = leftTranslateX - (transition.reverse.img.translate.x + (rightSizeWidthHalf - sizeLeftCurrent.left));

		rightPrev.style.clipPath = 'path(\''+processClipPath(transformClipPath(transition.path, {top: size.top, left: offsetX}))+'\')';
		rightPrev.style.transformOrigin = (verticalFlip ? 'top' : 'bottom')+' right';
		rightPrev.firstElementChild.style.transform = 'scaleX('+transition.firstImageX+')';

		const clipPath = leftCurrent.querySelectorAll('svg > defs > clipPath > path');
		clipPath[0].setAttribute('d', processClipPath(transformClipPath(transition.pathReverse, {top: size.top, left: rightSizeWidthHalf + offsetX})));
		clipPath[1].setAttribute('d', processClipPath(transformClipPath(transition.pathReverse2, {top: size.top, left: rightSizeWidthHalf + offsetX})));

		leftCurrent.style.clipPath = 'url(#clip-path-'+leftCurrent.dataset.zIndex+')';
		leftCurrent.firstElementChild.style.transform = 'translate('+leftTranslateX+'px, '+transition.reverse.img.translate.y+'px) rotate('+transition.reverse.img.rotate+'deg) matrix3d(1, '+transition.reverse.img.matrix.y+', 0.0, 0, '+transition.reverse.img.matrix.x+', 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) scaleX('+transition.reverse.img.scale+')';
		leftCurrent.firstElementChild.style.transformOrigin = (sizeLeftCurrent.left)+'px '+(verticalFlip ? size.top+'px' : (rightSize.height - size.bottom)+'px');

		const shadow = leftCurrent.querySelector('.reading-transitions-shadow');
		shadow.style.transform = 'translate('+(transition.reverse.shadow.translate.x + rightSizeWidthHalf + offsetX)+'px, '+transition.reverse.shadow.translate.y+'px) rotate('+transition.reverse.shadow.rotate+'deg)';
		shadow.style.boxShadow = '0px 0px '+transition.reverse.shadow.blur+'px rgba(0, 0, 0, '+transition.reverse.shadow.color+')';
		shadow.style.transformOrigin = (verticalFlip ? 'top' : 'bottom')+' left';

		const color = leftCurrent.querySelector('.reading-transitions-color');
		color.style.backgroundColor = 'rgba(0, 0, 0, '+transition.reverse.color+')';

		const shadowBackground = rightCurrent.querySelector('.reading-transitions-shadow');
		shadowBackground.style.transform = 'translate('+(transition.backgroundShadow.translate.x + size.width)+'px, '+(transition.backgroundShadow.translate.y/* - size.top*/)+'px) rotate('+transition.backgroundShadow.rotate+'deg)';
		shadowBackground.style.filter = 'blur('+transition.backgroundShadow.blur+'px)';
		shadowBackground.style.backgroundColor = 'blur('+transition.backgroundShadow.color+')';
		shadowBackground.style.transformOrigin = (verticalFlip ? 'top' : 'bottom')+' right';

		/*drawPoints([
			{
				color: 'red',
				points: transformClipPath(app.copy(transition.path), {left: rightSizeWidthHalf}),
			},
			{
				color: 'blue',
				points: transformClipPath([transition.points], {left: rightSizeWidthHalf, top: size.top}),
			},
		]);*/
	}
	else
	{
		rightPrev.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(rightPrev, rightCurrent, percent, true, true)+')';
		leftCurrent.firstElementChild.style.clipPath = 'inset('+pageTurn.generateClipPath(leftPrev, leftCurrent, percent, false, true)+')';
		rightCurrent.firstElementChild.style.clipPath = '';
		leftPrev.firstElementChild.style.clipPath = '';

		//let leftTranslateX = transition.reverse.img.translate.x + intermediateValue((rightSizeWidthHalf - sizeLeftCurrent.left), width + 1, percent);
		//const offsetX = leftTranslateX - (transition.reverse.img.translate.x + (rightSizeWidthHalf - sizeLeftCurrent.left));
		const leftTranslateX = transition.reverse.img.translate.x - sizeRightCurrent.width;
		const offsetX = size.right;

		leftPrev.style.clipPath = 'path(\''+processClipPath(transformClipPath(transition.path, {top: sizeRight.top, left: offsetX}))+'\')';
		leftPrev.style.transformOrigin = (verticalFlip ? 'top' : 'bottom')+' left';
		leftPrev.firstElementChild.style.transform = 'scaleX('+transition.firstImageX+')';

		const clipPath = rightCurrent.querySelectorAll('svg > defs > clipPath > path');
		clipPath[0].setAttribute('d', processClipPath(transformClipPath(transition.pathReverse, {top: sizeRight.top, left: offsetX})));
		clipPath[1].setAttribute('d', processClipPath(transformClipPath(transition.pathReverse2, {top: sizeRight.top, left: offsetX})));

		rightCurrent.style.clipPath = 'url(#clip-path-'+rightCurrent.dataset.zIndex+')';
		rightCurrent.firstElementChild.style.transform = 'translate('+leftTranslateX+'px, '+transition.reverse.img.translate.y+'px) rotate('+transition.reverse.img.rotate+'deg) matrix3d(1, '+transition.reverse.img.matrix.y+', 0.0, 0, '+transition.reverse.img.matrix.x+', 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) scaleX('+transition.reverse.img.scale+')';
		rightCurrent.firstElementChild.style.transformOrigin = (rightSizeWidthHalf + sizeRightCurrent.width)+'px '+(verticalFlip ? sizeRight.top+'px' : (rightSize.height - sizeRight.bottom)+'px');

		const shadow = rightCurrent.querySelector('.reading-transitions-shadow');
		shadow.style.transform = 'translate('+(transition.reverse.shadow.translate.x - rightSizeWidthHalf)+'px, '+transition.reverse.shadow.translate.y+'px) rotate('+transition.reverse.shadow.rotate+'deg)';
		shadow.style.boxShadow = '0px 0px '+transition.reverse.shadow.blur+'px rgba(0, 0, 0, '+transition.reverse.shadow.color+')';
		shadow.style.transformOrigin = (verticalFlip ? 'top' : 'bottom')+' right';

		const color = rightCurrent.querySelector('.reading-transitions-color');
		color.style.backgroundColor = 'rgba(0, 0, 0, '+transition.reverse.color+')';

		const shadowBackground = leftCurrent.querySelector('.reading-transitions-shadow');
		shadowBackground.style.transform = 'translate('+(transition.backgroundShadow.translate.x - sizeRight.width)+'px, '+(transition.backgroundShadow.translate.y)+'px) rotate('+transition.backgroundShadow.rotate+'deg)';
		shadowBackground.style.filter = 'blur('+transition.backgroundShadow.blur+'px)';
		shadowBackground.style.backgroundColor = 'blur('+transition.backgroundShadow.color+')';
		shadowBackground.style.transformOrigin = (verticalFlip ? 'top' : 'bottom')+' left';
	}
}

function pageTurnAnimation(animationDuration, startNow, startPercent, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent, reverse = false, vertical = false, startVertical = false)
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

	if(vertical === false)
	{
		let angle = _config.readingViewConfig.smoothPageTurn.angle;
		angle = ((angle + 45) / 90);

		if(angle == 0.5) angle = 0.505;

		startVertical = angle;
		vertical = 0.5;
	}

	_pageTurnPercent(percent, vertical, startVertical, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent);

	if((percent < 1 && !reverse) || (percent > 0 && reverse))
	{
		requestAnimationFrame(function(){
			pageTurnAnimation(animationDuration, startNow, startPercent, readingDirection, leftPrev, rightPrev, leftCurrent, rightCurrent, reverse, vertical, startVertical);
		});
	}
	else
	{
		leftPrev.style.opacity = 0;
		rightPrev.style.opacity = 0;
	}
}

































function drawPoints(points)
{
	const contentRightChild = template._contentRight().firstElementChild.firstElementChild;

	let num = 0;

	for(let i = 0, len = points.length; i < len; i++)
	{
		for(let i2 = 0, len2 = points[i].points.length; i2 < len2; i2++)
		{
			for(let i3 = 0, len3 = points[i].points[i2].length; i3 < len3; i3++)
			{
				const point = points[i].points[i2][i3];

				let element = contentRightChild.querySelector('.point-'+num);

				if(!element)
				{
					element = document.createElement('div');
					element.classList.add('point-'+num, 'test-point-draw');

					contentRightChild.insertAdjacentElement('beforeend', element);
				}

				element.style.transform = 'translate('+point.x+'px, '+point.y+'px)';
				element.style.backgroundColor = points[i].color;

				num++;
			}
		}
	}
}


function transformClipPath(path, transform = {})
{
	for(let i = 0, len = path.length; i < len; i++)
	{
		for(let i2 = 0, len2 = path[i].length; i2 < len2; i2++)
		{
			if(transform.top)
				path[i][i2].y += transform.top;

			if(transform.left)
				path[i][i2].x += transform.left;
		}
	}

	return path;
}

function flipClipPath(path, flip = {})
{
	const rightSize = reading.rightSize();

	for(let i = 0, len = path.length; i < len; i++)
	{
		for(let i2 = 0, len2 = path[i].length; i2 < len2; i2++)
		{
			if(flip.horizontal)
			{
				path[i][i2].x = flip.size.width - path[i][i2].x;
			}
			else if(flip.vertical)
			{
				path[i][i2].y = flip.size.height - path[i][i2].y;
			}
		}
	}

	return path;
}

function flipPageTransition(transition, flip = {})
{
	if(flip.horizontal)
	{
		transition.path = flipClipPath(app.copy(transition.path), {horizontal: true, size: flip.size});
		transition.pathReverse = flipClipPath(app.copy(transition.pathReverse), {horizontal: true, size: flip.size});
		transition.pathReverse2 = flipClipPath(app.copy(transition.pathReverse2), {horizontal: true, size: flip.size});

		transition.reverse.img.rotate = 360 - (transition.reverse.img.rotate - 360);
		transition.reverse.shadow.rotate = 360 - (transition.reverse.shadow.rotate - 360);
		transition.backgroundShadow.rotate = 360 - (transition.backgroundShadow.rotate - 360);

		transition.reverse.img.translate.x = -(transition.reverse.img.translate.x);
		transition.reverse.shadow.translate.x = -(transition.reverse.shadow.translate.x);
		transition.backgroundShadow.translate.x = -(transition.backgroundShadow.translate.x);

		transition.reverse.img.matrix.y = -(transition.reverse.img.matrix.y);
		transition.reverse.img.matrix.x = -(transition.reverse.img.matrix.x);
	}

	if(flip.vertical)
	{
		transition.path = flipClipPath(app.copy(transition.path), {vertical: true, size: flip.size});
		transition.pathReverse = flipClipPath(app.copy(transition.pathReverse), {vertical: true, size: flip.size});
		transition.pathReverse2 = flipClipPath(app.copy(transition.pathReverse2), {vertical: true, size: flip.size});

		transition.reverse.img.rotate = 360 - (transition.reverse.img.rotate - 360);
		transition.reverse.shadow.rotate = 360 - (transition.reverse.shadow.rotate - 360);
		transition.backgroundShadow.rotate = 360 - (transition.backgroundShadow.rotate - 360);

		transition.reverse.img.translate.y = -(transition.reverse.img.translate.y);
		transition.reverse.shadow.translate.y = -(transition.reverse.shadow.translate.y);
		transition.backgroundShadow.translate.y = -(transition.backgroundShadow.translate.y);

		transition.reverse.img.matrix.y = -(transition.reverse.img.matrix.y);
		transition.reverse.img.matrix.x = -(transition.reverse.img.matrix.x);
	}

	return transition;
}


function processClipPath(path)
{
	let _path = '';

	for(let i = 0, len = path.length; i < len; i++)
	{
		const point = path[i];
		const len2 = point.length;

		let _point = '';

		for(let i2 = 0; i2 < len2; i2++)
		{
			_point += point[i2].x+' '+point[i2].y+' ';
		}

		if(i == 0)
			_path += 'M '+_point;
		else if(len2 == 1)
			_path += 'L '+_point;
		else
			_path += 'C '+_point;
	}

	return _path+' Z';
}

function intermediateValue(v0, v1, power, minDistance = false, maxDistance = false, maxPower = 1)
{
	if(power > maxPower)
		power = maxPower;

	let v = (v1 - v0);

	if(minDistance !== false)
	{
		if(v * power < minDistance)
		{
			power = minDistance / v;

			if(power > maxPower)
				return v1;
		}
	}

	if(maxDistance !== false)
	{
		if(v * power > maxDistance)
			power = maxDistance / v;
	}

	return v0 + v * power;
}


function intermediatePoint(p0, p1, power, minDistance = false, maxDistance = false, maxPower = 1)
{
	if(power > maxPower)
		power = maxPower;

	let x = (p1.x - p0.x);
	let y = (p1.y - p0.y);

	if(minDistance !== false)
	{
		const max = Math.max(Math.abs(x), Math.abs(y));

		if(max * power < minDistance)
		{
			power = minDistance / max;

			if(power > maxPower)
				return p1;
		}
	}

	if(maxDistance !== false)
	{
		const max = Math.max(Math.abs(x), Math.abs(y));

		if(max * power > maxDistance)
			power = maxDistance / max;
	}

	x = p0.x + x * power;
	y = p0.y + y * power;

	return {x: x, y: y};
}

function increasePoint(p0, p1, power, minDistance = false, maxDistance = false)
{
	return intermediatePoint(p0, p1, power, minDistance, maxDistance, power);
}

function generatePageTransition(width, height, top = 0.5, left = 1)
{
	const rightSize = reading.rightSize();

	const scaleW = width / 1000;
	const scaleH = height / 1000;
	const scaleM = Math.min(width, height) / 1000;
	const scaleD = scaleW / scaleH;

	const topCenter = (top - 0.5) * 2;

	const leftP = (2 - (left + 1)) / 2;

	let bBezier = reading.pageTransitions.bottomBezier.get((1 + left) / 2);
	bBezier.yP = bBezier.y / 150;

	let tip = {
		y: 1000,
		x: 1000,
	};

	let sth = {
		top: {
			y: 1000,
			x: 1000,
		},
		point: {
			y: 1000,
			x: 1000,
		},
		bottom: {
			y: 1000,
			x: 1000,
		},
	};

	let curve = {
		point: {
			y: 1000,
			x: 1000,
		},
		right: {
			y: 1000,
			x: 1000,
		},
	};

	let centerTop = {
		top: {
			y: 100,
			x: 1000,
		},
		point: {
			y: 300,
			x: 1000,
		},
		bottom: {
			y: 500,
			x: 1000,
		},
	};

	let centerBottom = {
		top: {
			y: 500,
			x: 1000,
		},
		point: {
			y: 700,
			x: 1000,
		},
		bottom: {
			y: 900,
			x: 1000,
		},
	};

	const _left = (1000 - 1000 * left);
	const leftW = _left * scaleW;

	tip = {
		y: 1000 - (300 * topCenter * bBezier.yP),
		x: 1000 - (300 * topCenter * bBezier.yP) - _left,
	};

	curve = {
		point: {
			y: 1000,
			x: 900 - (150 * topCenter * bBezier.yP) - (_left / (2000 / 900)),
		},
		right: {
			y: 1000 - (30 * topCenter * bBezier.yP),
			x: 950 + (0 * topCenter * bBezier.yP) - (_left / (2000 / 950)),
		},
	};

	centerBottom = {
		top: {
			y: 300,
			x: 1000 - _left,
		},
		point: {
			y: 500 + (450 * topCenter) - (_left * 1),
			x: 1000 - (_left * 0.8),
		},
		bottom: {
			y: 700,
			x: 1000 - _left,
		},
	}

	centerBottom.point = intermediatePoint(centerBottom.point, increasePoint(tip, changePointsAngle(tip, curve.right, scaleD), 1.5), leftP * 4);
	if(topCenter < 0.2) centerBottom.point.x = intermediateValue(tip.x, centerBottom.point.x, topCenter / 0.2);
	centerBottom.bottom = intermediatePoint(centerBottom.point, tip, 0.5);

	centerBottom.top = intermediatePoint(centerBottom.point, centerBottom.bottom, -1);

	let centerTopPointY = centerBottom.top.y - ((centerBottom.point.y - centerBottom.top.y) / (centerBottom.top.x - centerBottom.point.x + 0.00001)) * (1000 - centerBottom.top.x);
	centerTopPointY -= 200 + 200 * leftP;

	centerTop = {
		top: intermediatePoint({y: 870, x: 1000}, {y: centerTopPointY - (100 + 500 * leftP), x: 1000}, leftP * 2000000),
		point: intermediatePoint({y: 900, x: 1000}, {y: centerTopPointY, x: 1000}, leftP * 2000000),
		bottom: intermediatePoint({y: 930, x: 1000}, {y: centerTopPointY + (100 + 500 * leftP), x: 1000}, leftP * 2000000),
	}

	if(centerTop.top.y === Infinity || centerTop.top.y > 100000000) centerTop.top.y = 100000000;
	if(centerTop.point.y === Infinity || centerTop.point.y > 100000000) centerTop.point.y = 100000000;
	if(centerTop.bottom.y === Infinity || centerTop.bottom.y > 100000000) centerTop.bottom.y = 100000000;

	if(centerTop.top.y === -Infinity || centerTop.top.y < -100000000) centerTop.top.y = -100000000;
	if(centerTop.point.y === -Infinity || centerTop.point.y < -100000000) centerTop.point.y = -100000000;
	if(centerTop.bottom.y === -Infinity || centerTop.bottom.y < -100000000) centerTop.bottom.y = -100000000;

	sth = {
		top: intermediatePoint(curve.right, tip, 0.4, 150, 150),
		point: intermediatePoint(curve.right, tip, 0.4, 150, 150),
		bottom: intermediatePoint(curve.right, tip, 0.4, 150, 150),
	};

	const points = [
		// Up page tip
		{x: 900, y: 0, left: 0},
		{x: 1000, y: 0, left: 0},
		{x: 1000, y: 0, left: 0},

		// Center Top Path
		{x: centerTop.top.x, y: centerTop.top.y, left: 0},
		{x: centerTop.point.x, y: centerTop.point.y, left: 0},
		{x: centerTop.bottom.x, y: centerTop.bottom.y, left: 0},

		// Center Bottom Path
		{x: centerBottom.top.x, y: centerBottom.top.y, left: 0},
		{x: centerBottom.point.x, y: centerBottom.point.y, left: 0},
		{x: centerBottom.bottom.x, y: centerBottom.bottom.y, left: 0},

		// Bottom page tip
		{x: tip.x, y: tip.y, left: 0},
		{x: tip.x, y: tip.y, left: 0},
		{x: tip.x, y: tip.y, left: 0},

		// Straighten bottom page tip
		{x: sth.top.x, y: sth.top.y, left: 0},
		{x: sth.point.x, y: sth.point.y, left: 0},
		{x: sth.bottom.x, y: sth.bottom.y, left: 0},

		// Bottom page start of curve
		{x: curve.right.x, y: curve.right.y, left: 0},
		{x: curve.point.x, y: curve.point.y, left: 0},

		// Left page tip
		{x: 0, y: 1000},
		{x: 0, y: 0},
	];

	points.reverse();

	let p = {};
	let ps = {};

	for(let i in points)
	{
		const x = (points[i].x * scaleW - (points[i].left !== undefined ? points[i].left : leftW));
		const y = (points[i].y * scaleH);

		p['p'+i] = x+' '+y;
		ps[i] = {x: x, y: y};
	}


	const bottomCurve = new Bezier(ps[2].x,ps[2].y, ps[3].x,ps[3].y, ps[4].x,ps[4].y, ps[5].x,ps[5].y);
	const topCurve = new Bezier(ps[11].x,ps[11].y, ps[12].x,ps[12].y, ps[13].x,ps[13].y, ps[14].x,ps[14].y);

	let extrema = bottomCurve.extrema();

	let rightmostValue = false;

	for(let i = 0, len = extrema.values.length; i < len; i++)
	{
		const value = bottomCurve.get(extrema.values[i]);

		if(rightmostValue === false || rightmostValue.x < value.x)
			rightmostValue = value;
	}

	let topIntersection, bottomIntersection;

	if(rightmostValue)
	{
		topIntersection = findBezierIntersection(topCurve, rightmostValue, app.copy(ps[13]));

		if(topIntersection)
		{
			bottomIntersection = findBezierIntersection(bottomCurve, topIntersection, increasePoint(topIntersection, rightmostValue, 1.5));
			topIntersection = findBezierIntersection(topCurve, bottomIntersection, increasePoint(bottomIntersection, topIntersection, 1.5));
		}
	}

	if(!topIntersection) topIntersection = app.copy(rightmostValue);
	if(!bottomIntersection) bottomIntersection = app.copy(rightmostValue);

	const path = `M ${p.p0}
		L ${p.p1}
		L ${p.p2}
		C ${p.p3} ${p.p4} ${p.p5}
		C ${p.p6} ${p.p7} ${p.p8}
		C ${p.p9} ${p.p10} ${p.p11}
		C ${p.p12} ${p.p13} ${p.p14}
		C ${p.p15} ${p.p16} ${p.p17} Z`;

	const _path = [
		[ps[0]],
		[ps[1]],
		[ps[2]],
		[ps[3], ps[4], ps[5]],
		[ps[6], ps[7], ps[8]],
		[ps[9], ps[10], ps[11]],
		[ps[12], ps[13], ps[14]],
		[ps[15], ps[16], ps[17]],
	];

	let firstImageScale = ((1 + 0.08 * topCenter) - (0.5 * leftP));
	if(firstImageScale > 1) firstImageScale = 1;

	let firstImageBezier = reading.pageTransitions.easeInBezier.get(firstImageScale);
	firstImageScale = (firstImageBezier.y / 1000);

	const angle = getAngle(bottomIntersection, topIntersection) + 90;
	const angleTip = getAngle(ps[8], ps[11]) + 90;

	const leftShadow = leftP > 0.9 ? (1 - leftP) / 0.1 : 1;
	const leftColor = leftP > 0.9 ? (1 - leftP) / 0.1 : 1;

	const pathReverse = [
		[{x: ps[8].x - 0, y: ps[8].y}],
		[{x: bottomIntersection.x, y: bottomIntersection.y}],
		[{x: topIntersection.x, y: topIntersection.y}],
	];

	const _pathReverse = [
		[{x: width, y: ps[0].y}],
		[{x: width, y: ps[1].y}],
		[ps[2]],
		[ps[3], ps[4], ps[5]],
		[ps[6], ps[7], ps[8]],
		[ps[9], ps[10], ps[11]],
		[ps[12], ps[13], ps[14]],
		[ps[15], ps[16], ps[17]],
	];

	let intersectsY = findLinesIntersection(ps[8], changePointsAngle(ps[8], ps[10], 1, true), bottomIntersection, topIntersection);
	let intersectsX = findLinesIntersection(ps[8], ps[10], topIntersection, changePointsAngle(bottomIntersection, topIntersection, 1, true));

	const matrixY = intersectsY ? ((width / getDistance(ps[8], intersectsY)) * getDistance(intersectsY, bottomIntersection)) / width : 0;
	const matrixX = intersectsX ? ((height / getDistance(ps[8], intersectsX)) * getDistance(intersectsX, topIntersection)) / height : 0;

	const reverseImgScale = 1 - (0.4 * (1 - reading.pageTransitions.easeInBezier.get(leftP).y / 1000));

	const reachedEnd = leftP == 1 ? true : false;

	return {
		path: _path,
		pathReverse: pathReverse,
		pathReverse2: app.copy(_pathReverse),
		firstImageX: reachedEnd ? 1 : firstImageScale,
		reverse: {
			img: {
				translate: {
					x: (ps[8].x - 1),
					y: (-(height - ps[8].y)),
				},
				rotate: reachedEnd ? 0 : angleTip,
				matrix: {
					x: reachedEnd ? 0 : matrixX,
					y: reachedEnd ? 0 : matrixY,
				},
				scale: reachedEnd ? 1 : reverseImgScale,
			},
			color: (0.05 * leftColor),
			shadow: {
				translate: {
					x: bottomIntersection.x,
					y: (-(height - bottomIntersection.y)),
				},
				blur: (width / 6 * leftShadow),
				color: (0.5 * leftColor),
				rotate: reachedEnd ? 0 : angle,
			}
		},
		backgroundShadow: {
			translate: {
				x: (bottomIntersection.x - width),
				y: (-(height - bottomIntersection.y)),
			},
			rotate: reachedEnd ? 0 : angle,
			blur: (width / 24 * leftShadow),
			color: (0.7 * leftColor),
		},
		points: [
			topIntersection,
			bottomIntersection,
		],
	};

}

function getAngle(p0, p1)
{
	const originX = p0.x,
		originY = p0.y,
		targetX = p1.x,
		targetY = p1.y;

	var dx = originX - targetX;
	var dy = originY - targetY;

	var theta = Math.atan2(-dy, -dx);
	theta *= 180 / Math.PI;
	if (theta < 0) theta += 360;

	return theta;
}

function changePointsAngle(p0, p1, scale = 1, reverse = false)
{
	let y = 0;
	let x = 0;

	if(reverse)
	{
		y = p0.y + ((p1.x - p0.x) * scale);
		x = p0.x - ((p1.y - p0.y) / scale);
	}
	else
	{
		y = p0.y - ((p1.x - p0.x) * scale);
		x = p0.x + ((p1.y - p0.y) / scale);
	}

	return {x: x, y: y};
}

function findLinesIntersection(p0, p1, p2, p3)
{
	const A1 = p1.y - p0.y;
	const B1 = p0.x - p1.x;
	const C1 = A1 * p0.x + B1 * p0.y;

	const A2 = p3.y - p2.y;
	const B2 = p2.x - p3.x;
	const C2 = A2 * p2.x + B2 * p2.y;

	const determinant = A1 * B2 - A2 * B1;

	if(determinant === 0)
		return null;

	const x = (C1 * B2 - C2 * B1) / determinant;
	const y = (A1 * C2 - A2 * C1) / determinant;

	return {x: x, y: y};
}

function getDistance(p0, p1)
{
	return Math.hypot(p0.x - p1.x, p0.y - p1.y);
}

function findBezierIntersection(curve, line0, line1)
{
	let lastIntersects = false;
	let lastNegative = false;
	let prevIsIntersects = false;

	let minX = Math.min(curve.points[0].x, curve.points[3].x);
	let maxX = line1.x;

	let offset = 5;
	let _i = 0;

	let direction = 0;

	for(let i = 0; i < 200; i++)
	{
		let line = {
			p1: line0,
			p2: line1,
		};

		let intersects = curve.intersects(line);
		let intersectsL = intersects.length;

		if(!lastIntersects)
		{
			if(intersectsL)
			{
				offset /= 2;
				line1.x += offset;

				lastIntersects = intersects;
				prevIsIntersects = true;
			}
			else if(direction)
			{
				if(line1.x > maxX)
				{
					offset /= 2;
					direction = 0;

					line1.x -= offset;
				}
				else
				{
					line1.x += offset;
				}
			}
			else
			{
				if(line1.x < minX)
				{
					offset /= 2;
					direction = 1;

					line1.x += offset;
				}
				else
				{
					line1.x -= offset;
				}
			}
		}
		else
		{
			if(intersectsL)
			{
				if(!prevIsIntersects) offset /= 2;
				line1.x += offset;

				lastIntersects = intersects;
				prevIsIntersects = true;
			}
			else
			{
				if(prevIsIntersects) offset /= 2;
				line1.x -= offset;

				prevIsIntersects = false;
			}
		}

		if(offset < 0.001)
			break;

		_i++;
	}

	if(lastIntersects.length)
	{
		let average = 0;

		let len = lastIntersects.length;

		for(let i = 0; i < len; i++)
		{
			average += lastIntersects[i];
		}

		return curve.get(average / len);
	}
}




























































module.exports = {
	goTo: pageTurnGoTo,
	percent: pageTurnPercent,
	animation: pageTurnAnimation,
	currentPercent: function(){return currentPageTurnPercent}
};