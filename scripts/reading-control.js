
var images = {}, imagesData = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = 1, imagesPosition = {};

function disposeImages(data, margin)
{
	data = typeof data === 'undefined' ? false : data;

	if(data && typeof data.margin !== 'undefined')
		var margin = data.margin;
	else
		var margin = config.readingMargin.margin;

	var content = template.contentRight().children('div');
	var contentWidth = template.contentRight().width() - (margin + margin);
	var contentHeight = content.height() - (margin + margin);
	var aspectRatio = contentWidth / contentHeight;

	if(!config.readingViewAdjustToWidth)
	{

		for(index in imagesData)
		{
			var image = imagesData[index];

			if(aspectRatio > image.aspectRatio)
			{
				template.contentRight('.r-img-i'+index+' img').css({
					'height': contentHeight+'px',
					'width': (contentHeight * image.aspectRatio)+'px',
					'margin-left': ((contentWidth - contentHeight * image.aspectRatio) / 2 + margin)+'px',
					'margin-top': margin+'px',
					'margin-bottom': ((config.readingView == 'scroll' && index == imagesNum) ? margin : 0)+'px'
				});
			}
			else
			{
				template.contentRight('.r-img-i'+index+' img').css({
					'height': (contentWidth / image.aspectRatio)+'px',
					'width': contentWidth+'px',
					'margin-top': ((config.readingView == 'scroll') ? margin : ((contentHeight - contentWidth / image.aspectRatio) / 2 + margin))+'px',
					'margin-left': margin+'px',
					'margin-bottom': ((config.readingView == 'scroll' && index == imagesNum) ? margin : 0)+'px'
				});
			}
		}
	}
	else if(config.readingViewAdjustToWidth && config.readingView == 'scroll')
	{
		for(index in imagesData)
		{
			var image = imagesData[index];

			template.contentRight('.r-img-i'+index+' img').css({
				'height': (contentWidth / image.aspectRatio)+'px',
				'width': contentWidth+'px',
				'margin-top': margin+'px',
				'margin-left': margin+'px',
				'margin-bottom': ((index == imagesNum) ? margin : 0)+'px'
			});
		}
	}

	if(config.readingView == 'scroll')
	{
		template.contentRight('.reading-body .r-img').each(function(index){

			imagesPosition[index+1] = $(this).position().top + ($(this).height() / 2);

		});
	}
}

function calculateView()
{
	var content = template.contentRight().children('div');
	var contentWidth = template.contentRight().width();

	if(config.readingView == 'slide')
	{
		template.contentRight('.reading-body > div, .reading-lens > div > div').css({
			'width': (contentWidth * contentNum)+'px',
			'height': content.height(),
		});

		template.contentRight('.r-img').css({
			'width': contentWidth+'px',
			'height': content.height(),
			'float': 'left',
		});
	}
	else if(config.readingView == 'scroll')
	{
		template.contentRight('.reading-body > div, .reading-lens > div > div').css({
			'width': '100%',
		});

		for(index in imagesData)
		{
			var image = imagesData[index];

			template.contentRight('.r-img-i'+index).css({
				'width': contentWidth+'px',
				'float': 'none',
			});
		}
	}
}

var previousScrollTop = 0; previousContentHeight = 0;

function stayInLine()
{
	if(config.readingView == 'slide' || (config.readingView == 'scroll' && !config.readingViewAdjustToWidth))
	{
		if(currentIndex < 1)
			showPreviousComic(1, false);
		else if(currentIndex > contentNum)
			showNextComic(1, false);
		else
			goToIndex(currentIndex, false);
	}
	else if(config.readingView == 'scroll')
	{
		goToIndexCL(currentIndex, false);

		var scrollTop = template.contentRight().children('div').scrollTop();
		var contentHeight = template.contentRight().children('div').children('div').height();

		var newScrollTop = (previousScrollTop * (1 - (previousContentHeight / contentHeight))) + previousScrollTop

		disableOnScroll(1);

		template.contentRight().children('div').scrollTop(newScrollTop);

	}
}

function goToIndexCL(index, animation)
{
	animation = typeof animation === 'undefined' ? true : animation;

	var animationDurationMS = ((animation) ? config.readingViewSpeed : 0) * 1000;

	var leftScroll = template.contentLeft('.r-l-i'+index).parent();
	var leftImg = template.contentLeft('.r-l-i'+index);

	template.contentLeft('.reading-left').removeClass('s');
	leftImg.addClass('s');

	var scrollTop = (((leftImg.offset().top + leftScroll.scrollTop()) - leftScroll.offset().top) + (leftImg.outerHeight() / 2)) - (leftScroll.height() / 2);

	if(scrollTop > 0 && scrollTop < (leftScroll[0].scrollHeight - leftScroll.height()))
	{
		leftScroll.stop(true).animate({scrollTop: scrollTop+'px'}, animationDurationMS);
	}
	else if(scrollTop > 0)
	{
		leftScroll.stop(true).animate({scrollTop: (leftScroll[0].scrollHeight - leftScroll.height())+'px'}, animationDurationMS);
	}
	else
	{
		leftScroll.stop(true).animate({scrollTop: 0+'px'}, animationDurationMS);
	}
}

var currentPageVisibility = 0, maxPageVisibility = 0; currentPageStart = true, readingDirection = true, previousReadingDirection = true, readingDirection = true;

function goToIndex(index, animation, nextPrevious, end)
{
	animation = typeof animation === 'undefined' ? true : animation;
	nextPrevious = typeof nextPrevious === 'undefined' ? false : nextPrevious;
	end = typeof end === 'undefined' ? false : end;

	var animationDurationS = ((animation) ? config.readingViewSpeed : 0);
	var animationDurationMS = animationDurationS * 1000;

	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	var updateCurrentIndex = true;

	var eIndex = index;

	var pageVisibilityIndex = 0;

	var imgHeight = false;

	if(((nextPrevious && currentPageStart) || !nextPrevious || end) && config.readingViewAdjustToWidth)
	{
		imgHeight = template.contentRight('.r-img-i'+eIndex).height() + config.readingMargin.margin + config.readingMargin.margin;

		if(imgHeight > contentHeight)
		{
			var pageVisibility = Math.floor(imgHeight / contentHeight)

			maxPageVisibility = pageVisibility;

			if(readingDirection && !end)
				currentPageVisibility = 0;
			else
				currentPageVisibility = pageVisibility;
		}
		else
		{
			currentPageVisibility = 0;
		}

		pageVisibilityIndex = currentPageVisibility;

		currentPageStart = false;

	}
	else if(nextPrevious && !currentPageStart && config.readingViewAdjustToWidth)
	{
		eIndex = currentIndex;

		imgHeight = template.contentRight('.r-img-i'+eIndex).height() + config.readingMargin.margin + config.readingMargin.margin;

		if(readingDirection)
			currentPageVisibility++;
		else
			currentPageVisibility--;

		pageVisibilityIndex = currentPageVisibility;

		var pageVisibility = Math.floor(imgHeight / contentHeight);

		maxPageVisibility = pageVisibility;

		if(!((readingDirection && currentPageVisibility > pageVisibility) || (!readingDirection && currentPageVisibility < 0)))
		{
			updateCurrentIndex = false;
		}
		else
		{
			eIndex = index;

			imgHeight = template.contentRight('.r-img-i'+eIndex).height() + config.readingMargin.margin + config.readingMargin.margin;

			if(imgHeight > contentHeight)
			{
				pageVisibility = Math.floor(imgHeight / contentHeight)

				if(readingDirection)
					currentPageVisibility = 0;
				else
					currentPageVisibility = pageVisibility;
			}
			else
			{
				currentPageVisibility = 0;
			}
			pageVisibilityIndex = currentPageVisibility;
			currentPageStart = false;
		}
	}
	else
	{
		currentPageStart = true;
	}

	if(config.readingView == 'slide')
	{
		template.contentRight('.reading-body > div, .reading-lens > div > div').css({
			'transition': animationDurationS+'s',
			'transform': 'translate(-'+(contentWidth * (eIndex - 1))+'px, 0)',
		});
	}
	else if(config.readingView == 'scroll')
	{
		var scrollTop = ((template.contentRight('.r-img-i'+eIndex).offset().top - config.readingMargin.margin) - content.offset().top) + content.scrollTop();

		scrollSum = 0;

		if(config.readingViewAdjustToWidth && pageVisibilityIndex !== false)
		{
			imgHeight = template.contentRight('.r-img-i'+eIndex).height() + config.readingMargin.margin + config.readingMargin.margin;

			if(imgHeight > contentHeight)
			{
				var pageVisibility = Math.floor(imgHeight / contentHeight);

				maxPageVisibility = pageVisibility;

				var contentHeightRes = ((contentHeight * pageVisibility) - imgHeight) / pageVisibility;

				scrollSum = ((contentHeight - contentHeightRes) - contentHeight / pageVisibility) * pageVisibilityIndex;
			}		
		}

		disableOnScroll(1)

		content.stop(true).animate({scrollTop: (scrollTop + scrollSum)+'px'}, animationDurationMS);
	}

	goToIndexCL(eIndex, animation);

	if(updateCurrentIndex)
		currentIndex = index;

	previousReadingDirection = readingDirection;
}

function goNext()
{
	var nextIndex = currentIndex + 1;

	readingDirection = true;

	if(currentIndex < 1)
		showPreviousComic(2, true);
	else if(nextIndex <= contentNum || (config.readingViewAdjustToWidth && currentPageVisibility < maxPageVisibility))
		goToIndex(nextIndex, true, true);
	else if(nextIndex - 1 == contentNum && dom.nextComic())
		showNextComic(1, true);
}

function goPrevious()
{
	var previousIndex = currentIndex - 1;

	readingDirection = false;

	if(currentIndex > contentNum)
		showNextComic(2, true);
	else if(previousIndex > 0 || (config.readingViewAdjustToWidth && currentPageVisibility > 0))
		goToIndex(previousIndex, true, true)
	else if(previousIndex == 0 && dom.previousComic())
		showPreviousComic(1, true);
}

function goStart()
{
	var nextIndex = currentIndex + 1;
	var previousIndex = currentIndex - 1;

	if(currentIndex < 1)
		showPreviousComic(2, true);
	else if(currentIndex > contentNum)
		showNextComic(2, true);

	readingDirection = true;

	goToIndex(1, true);
}

function goEnd()
{
	var nextIndex = currentIndex + 1;
	var previousIndex = currentIndex - 1;

	if(currentIndex < 1)
		showPreviousComic(2, true);
	else if(currentIndex > contentNum)
		showNextComic(2, true);

	readingDirection = false;

	goToIndex(contentNum, true, true, true);
}

var showComicSkip;

function showNextComic(mode, animation)
{
	animation = typeof animation === 'undefined' ? true : animation;
	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	clearTimeout(showComicSkip);

	if(mode == 1)
	{
		var transition = config.readingViewSpeed < config.readingDelayComicSkip ? config.readingViewSpeed : config.readingDelayComicSkip;

		if(transition != 0)
		{
			if(config.readingView == 'slide')
			{
				var skip = template.contentRight('.reading-skip-right');

				skip.css({
					'transition': transition+'s',
					'transform': 'translate(-100px, 0px)',
				});

				var scale = ((contentWidth - 100) / contentWidth);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': '0px center',
					'transition': ((animation) ? transition : 0)+'s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+') translate(-'+(contentWidth * (contentNum - 1))+'px, 0px)',
				});
			}
			else if(config.readingView == 'scroll')
			{
				var skip = template.contentRight('.reading-skip-bottom');

				skip.css({
					'transition': transition+'s',
					'transform': 'translate(0px, -100px)',
				});

				var scale = ((contentHeight - 100) / contentHeight);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': 'center '+(template.contentRight('.reading-body').height() - contentHeight)+'px',
					'transition': ((animation) ? transition : 0)+'s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});
			}

			skip.find('circle').css('animation-duration', config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(dom.nextComic(), 'doubles')+'", "'+escapeQuotes(dom.indexMainPathA(), 'doubles')+'");', config.readingDelayComicSkip * 1000);

		currentIndex = contentNum + 1;
	}
	else
	{
		if(config.readingView == 'slide')
		{
			var skip = template.contentRight('.reading-skip-right').css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'scale(1) translate(-'+(contentWidth * (contentNum - 1))+'px, 0px)',
			});
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-bottom').css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}

		currentIndex = contentNum;
	}
}


function showPreviousComic(mode, animation)
{
	animation = typeof animation === 'undefined' ? true : animation;
	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	clearTimeout(showComicSkip);

	if(mode == 1)
	{

		var transition = config.readingViewSpeed < config.readingDelayComicSkip ? config.readingViewSpeed : config.readingDelayComicSkip;

		if(transition != 0)
		{
			if(config.readingView == 'slide')
			{
				var skip = template.contentRight('.reading-skip-left');

				skip.css({
					'transition': transition+'s',
					'transform': 'translate(100px, 0px)',
				});

				var scale = ((contentWidth - 100) / contentWidth);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': contentWidth+'px center',
					'transition': ((animation) ? transition : 0)+'s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});

			}
			else if(config.readingView == 'scroll')
			{
				var skip = template.contentRight('.reading-skip-top');

				skip.css({
					'transition': transition+'s',
					'transform': 'translate(0px, 100px)',
				});

				var scale = ((contentHeight - 100) / contentHeight);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': 'center '+contentHeight+'px',
					'transition': ((animation) ? transition : 0)+'s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});
			}

			skip.find('circle').css('animation-duration', config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(dom.previousComic(), 'doubles')+'", "'+escapeQuotes(dom.indexMainPathA(), 'doubles')+'", true);', config.readingDelayComicSkip * 1000);

		currentIndex = 0;
	}
	else
	{
		if(config.readingView == 'slide')
		{
			var skip = template.contentRight('.reading-skip-left');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-top');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}

		currentIndex = 1;
	}
}

function activeMagnifyingGlass(active)
{
	if(active)
	{
		storage.updateVar('config', 'readingMagnifyingGlass', true);
	}
	else
	{
		storage.updateVar('config', 'readingMagnifyingGlass', false);
		magnifyingGlassControl(0);
	}
}

function changeMagnifyingGlass(mode, value, save)
{

	var readingBody = template.contentRight('.reading-body');

	var width = readingBody.width(),
		height = readingBody.height(),
		offset = readingBody.offset();

	var pageX = (width / 2) + offset.left;
	var pageY = (height / 2) + offset.top;


	if(mode == 1)
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {zoom: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassZoom', value);
	}
	else if(mode == 2)
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {size: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassSize', value);
	}
	else if(mode == 3)
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {ratio: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassRatio', value);
	}
	else if(mode == 4)
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {radius: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassRadius', value);
	}
}

var magnifyingGlassView = false;

function magnifyingGlassControl(mode, e, lensData)
{

	if(typeof lensData == 'undefined') lensData = false;

	if(typeof e != 'undefined')
	{
		var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
		var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);
	}

	if(mode == 1)
	{

		if(lensData && typeof lensData.ratio != 'undefined')
			var ratio = 1 / lensData.ratio;
		else
			var ratio = 1 / config.readingMagnifyingGlassRatio;

		if(lensData && typeof lensData.size != 'undefined')
		{
			var lensWidth = lensData.size;
			var lensHeight = parseInt(lensData.size * ratio);
		}
		else
		{
			var lensWidth = config.readingMagnifyingGlassSize;
			var lensHeight = parseInt(config.readingMagnifyingGlassSize * ratio);
		}

		if(lensData && typeof lensData.zoom != 'undefined')
			var zoom = lensData.zoom;
		else
			var zoom = config.readingMagnifyingGlassZoom;

		var lensHeightM = parseInt(lensHeight / 2);
		var lensWidthM = parseInt(lensWidth / 2);

		var top = (y - lensHeightM);
		var left = (x - (lensWidth / 2));

		var topLens = y - template.contentRight('.reading-body').offset().top - (lensHeightM / zoom);
		var leftLens = x - template.contentRight('.reading-body').offset().left - lensWidthM;

		template.contentRight('.reading-lens').css({
			'top': top+'px',
			'left': left+'px',
			'width': lensWidth+'px',
			'height': lensHeight+'px',
			'border-radius': ((lensData && typeof lensData.radius != 'undefined') ? lensData.radius : config.readingMagnifyingGlassRadius)+'px'
		}).removeClass('d').addClass('a');

		template.contentRight('.reading-lens > div').css({
			'transform': ' scale('+zoom+') translate(' + (-(leftLens)) + 'px, ' + (-(topLens)) + 'px)'
		});

		magnifyingGlassView = true;

	}
	else
	{
		template.contentRight('.reading-lens').removeClass('a').addClass('d');
		magnifyingGlassView = false;
	}

}

var activeOnScroll = true;

function disableOnScroll(mode)
{
	if(mode == 1)
		activeOnScroll = false;
	else
		activeOnScroll = true;
}

function changePagesView(mode, value, save)
{
	if(mode == 1)
	{
		storage.updateVar('config', 'readingView', value);

		dom.selectElement('.pages-'+value);	

		if(value == 'slide' && config.readingViewAdjustToWidth)
		{
			storage.updateVar('config', 'readingViewAdjustToWidth', false);
			template.globalElement('.reading-ajust-to-width .switch').removeClass('a');
		}

		if(value == 'slide')
			template.globalElement('.reading-ajust-to-width').addClass('disable-pointer');
		else
			template.globalElement('.reading-ajust-to-width').removeClass('disable-pointer');

		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, currentIndex);
	}
	else if(mode == 2)
	{
		disposeImages({margin: value})

		if(save) storage.updateVar('config', 'readingMargin', {margin: value, top: value, bottom: value, left: value, right: value});
	}
	else if(mode == 3)
	{
		storage.updateVar('config', 'readingViewAdjustToWidth', value);

		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, currentIndex);
	}
}

function createBookmark()
{
	if(currentIndex <= contentNum && currentIndex > 0 && !template.contentRight('.r-img-i'+currentIndex).hasClass('floder'))
	{

		var path = p.normalize(images[currentIndex].src);
		var sha = sha1(path);

		if(typeof readingCurrentBoockmarks[sha1] != 'undefined')
		{
			delete readingCurrentBoockmarks[sha1];
		}
		else
		{
			readingCurrentBoockmarks[sha1] = true;
		}

		storage.updateVar('bookmarks', readingCurrentSha, readingCurrentBoockmarks);
	}
}

var touchTimeout, mouseOut = {lens: false, body: false}, touchStart = false, magnifyingGlassOffset = false, readingCurrentPath = false,  readingCurrentSha = false, readingCurrentBoockmarks = {};

function read(path, index = 1, end)
{
	end = typeof end === 'undefined' ? false : end;
	images = {}, imagesData = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = index;

	readingCurrentPath = path;
	readingCurrentSha = sha1(p.dirname(path));

	if(typeof storage.get('bookmarks') != 'undefined' && typeof storage.get('bookmarks')[readingCurrentSha] != 'undefined')
		readingCurrentBoockmarks = storage.get('bookmarks')[readingCurrentSha];

	goToIndexCL(index, false);

	$(window).off('keydown touchstart mouseout click resize');
	$('.reading-body, .reading-lens').off('mousemove');
	$('.reading-body').off('mouseout mouseenter touchmove');
	$('.content-right > div > div').off('scroll');

	onReading = true;

	$(window).on('keydown', function(e){
		if(onReading)
		{
			if(e.keyCode == 37)
			{
				goPrevious();
			}
			else if(e.keyCode == 38 && config.readingView != 'scroll')
			{
				goStart();
			}
			else if(e.keyCode == 39)
			{
				goNext();
			}
			else if(e.keyCode == 40 && config.readingView != 'scroll')
			{
				goEnd();
			}
		}
	})

	$(window).on('touchstart', function(e){
		if(onReading && config.readingMagnifyingGlass)
		{
			touchStart = e;

			magnifyingGlassOffset = template.contentRight('.reading-lens').offset();

			clearTimeout(touchTimeout);
			readingTouchEvent = true;
			touchTimeout = setTimeout('readingTouchEvent = false;', 500);
		}
	})

	template.contentRight(/*window*/'.reading-body, .reading-lens').on('mousemove', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
			var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

			var rbHeight = template.contentRight('.reading-body').height();
			var rbWidth = template.contentRight('.reading-body').width();
			var rbOffsetTop = template.contentRight('.reading-body').offset().top;
			var rbOffsetLeft = template.contentRight('.reading-body').offset().left;

			if(x > rbOffsetLeft && y > rbOffsetTop && x < (rbWidth + rbOffsetLeft) && y < (rbHeight + rbOffsetTop))
			{
				magnifyingGlassControl(1, e);
			}
			else
			{
				magnifyingGlassControl(0, e);
			}
		}
	})

	template.contentRight('.reading-body').on('mouseout', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['body'] = true;

			if(mouseOut['lens'] == true) magnifyingGlassControl(0, e);
		}
	})

	template.contentRight('.reading-body').on('mouseenter', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['body'] = false;
		}
	})

	$(window).on('mouseout', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['lens'] = true;

			var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
			var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

			var rbHeight = template.contentRight('.reading-body').height();
			var rbWidth = template.contentRight('.reading-body').width();
			var rbOffsetTop = template.contentRight('.reading-body').offset().top;
			var rbOffsetLeft = template.contentRight('.reading-body').offset().left;

			if(!(x > rbOffsetLeft && y > rbOffsetTop && x < (rbWidth + rbOffsetLeft) && y < (rbHeight + rbOffsetTop)))
			{
				magnifyingGlassControl(0, e);
			}
		}
	})

	template.contentRight('.reading-lens').on('mouseenter', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['lens'] = false;
		}
	})

	template.contentRight('.reading-lens').on('touchmove', function(e){
		if(onReading && config.readingMagnifyingGlass)
		{

			let x = mousePosition(touchStart, 'x'), y = mousePosition(touchStart, 'y');

			let readingLens = template.contentRight('.reading-lens');

			let xLess = x - (magnifyingGlassOffset.left + (readingLens.width() / 2));
			let yLess = y - (magnifyingGlassOffset.top + (readingLens.height() / 2));

			let pageX = e.originalEvent.touches[0].pageX - xLess;
			let pageY = e.originalEvent.touches[0].pageY - yLess;

			magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}});
		}
	})

	$(window).on('click', function(e){
		if(onReading && config.readingMagnifyingGlass && readingTouchEvent)
		{
			var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
			var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

			var rbHeight = template.contentRight('.reading-body').height();
			var rbWidth = template.contentRight('.reading-body').width();
			var rbOffsetTop = template.contentRight('.reading-body').offset().top;
			var rbOffsetLeft = template.contentRight('.reading-body').offset().left;

			if(x > rbOffsetLeft && y > rbOffsetTop && x < (rbWidth + rbOffsetLeft) && y < (rbHeight + rbOffsetTop))
			{
				if(!magnifyingGlassView)
				{
					magnifyingGlassControl(1, e);
				}
				else
				{
					magnifyingGlassControl(0, e);
				}
			}
			else
			{
				magnifyingGlassControl(0, e);
			}
		}
	})

	$(window).on('resize', function(){
		if(onReading)
		{
			disposeImages();
			calculateView();
			stayInLine();
		}

		previousContentHeight = template.contentRight().children('div').children('div').height();
	});

	$(window).on('mousewheel touchstart keydown', function(e)
	{
		if(e.type != 'keydown' || (e.type == 'keydown' && (e.keyCode == 38 || e.keyCode == 40)))
			disableOnScroll(2);
	});

	template.contentRight().children('div').on('scroll', function(e){

		if(activeOnScroll && config.readingView == 'scroll')
		{
			previousScrollTop = $(this).scrollTop();
			let contentHeight = template.contentRight().children('div').height(), contentPosition = (previousScrollTop + (contentHeight / 2));

			let selIndex = false, selPosition = false;

			for(index in imagesPosition)
			{
				if(!selIndex || Math.abs(contentPosition - imagesPosition[index]) < selPosition)
				{
					selIndex = index;
					selPosition = Math.abs(contentPosition - imagesPosition[index]);
				}
			}

			if(currentIndex != selIndex)
			{
				goToIndexCL(selIndex, true);

				currentIndex = parseInt(selIndex);
			}
		}

	});

	imagesNum = template.contentRight('.reading-body img').length;
	contentNum = template.contentRight('.reading-body .r-img').length;

	template.contentRight('.reading-body img').each(function() {

		var index = parseInt($(this).attr('index'));

		images[index] = new Image();
		images[index].index = index;
		images[index].onload = function() {

			imagesData[this.index] = {width: this.width, height: this.height, aspectRatio: (this.width / this.height)};

			imagesNumLoad++;

			if(imagesNumLoad == imagesNum)
			{
				console.log('show');
				template.contentRight('.reading-body').css('display', 'block');
				disposeImages();
				calculateView();
				goToIndex(currentIndex, false, end, end);
				if(config.readingView == 'scroll')
				{
					previousContentHeight = template.contentRight().children('div').children('div').height();
				}
			}

		}
		images[index].src = $(this).attr('src');

	});

}

module.exports = {
	read: read,
	images: images,
	imagesNum: imagesNum,
	contentNum: contentNum,
	imagesNumLoad: imagesNumLoad,
	imagesData: imagesData,
	goToIndex: function(v1, v2, v3, v4){readingDirection = true; goToIndex(v1, v2, v3, v4)},
	goStart: goStart,
	goPrevious: goPrevious,
	goNext: goNext,
	goEnd: goEnd,
	activeMagnifyingGlass: activeMagnifyingGlass,
	changeMagnifyingGlass: changeMagnifyingGlass,
	changePagesView: changePagesView,
	magnifyingGlassControl: magnifyingGlassControl,
	disposeImages: disposeImages,
	disableOnScroll: disableOnScroll,
	createBookmark: createBookmark,
	currentIndex: function(){return currentIndex},
};