
var images = {}, imagesData = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = 1, imagesPosition = {}, indexNum = 0, imagesDistribution = [];

function blankPage(index)
{
	var key = 0;

	if(config.readingDoublePage && config.readingDoNotApplyToHorizontals)
	{
		for(let i = index; i < (contentNum + 1); i++)
		{
			if(typeof imagesData[i] !== 'undefined')
			{

				if(imagesData[i].aspectRatio > 1)
				{
					return key % 2;
				}
				else
				{
					key++;
				}
			}
			else
			{
				key++;
			}
		}
	}
}

function calculateImagesDistribution()
{

	imagesDistribution = [];
	indexNum = 0;

	if(config.readingDoublePage)
	{
		var data = [];

		start = true;

		for(let i = 1; i < (contentNum + 1); i++)
		{

			if(typeof imagesData[i] !== 'undefined')
			{

				if(config.readingDoublePage && config.readingDoNotApplyToHorizontals && imagesData[i].aspectRatio > 1)
				{

					if(data.length > 0)
					{
						data.push({index: false, folder: false, blank: true, width: 2});
						imagesDistribution.push(data);
						data = [];
						indexNum++;
					}

					data.push({index: i, folder: false, blank: false, width: 1});
					imagesData[i].position = indexNum; 
					imagesDistribution.push(data);
					indexNum++;
					data = [];
					start = true;
				}
				else
				{

					if(config.readingDoNotApplyToHorizontals && start && blankPage(i))
						data.push({index: false, folder: false, blank: true, width: 2});

					data.push({index: i, folder: false, blank: false, width: 2});
					imagesData[i].position = indexNum; 
					start = false;
				}
			}
			else
			{
				data.push({index: i, folder: true, blank: false, width: 2});
				start = true;
			}

			if(data.length > 1)
			{
				imagesDistribution.push(data);
				data = [];
				indexNum++;
			}
		}

		if(data.length > 0)
		{
			imagesDistribution.push(data);
			indexNum++;
		}
	}
	else
	{
		for(i = 1; i < (contentNum + 1); i++)
		{
			if(typeof imagesData[i] !== 'undefined')
			{
				imagesDistribution.push([{index: i, folder: false, blank: false, width: 1}]);
				imagesData[i].position = indexNum;
				indexNum++;
			}
			else
			{
				imagesDistribution.push([{index: i, folder: true, blank: false, width: 1}]);
				imagesData[i].position = indexNum;
				indexNum++;
			}
		}
	}
}

function addImagesDistribution()
{

	previous = false;

	for(key1 in imagesDistribution)
	{
		for(key2 in imagesDistribution[key1])
		{
			image = imagesDistribution[key1][key2];

			if(image.blank)
			{
				if(template.contentRight('.image-position'+key1+'-'+key2).length == 0)
				{
					if(previous)
						previous.after('<div class="r-img blank image-position'+key1+'-'+key2+'"><div></div></div>');
					else
						template.contentRight('.reading-body > div, .reading-lens > div > div').prepend('<div class="r-img blank image-position'+key1+'-'+key2+'"><div></div></div>');
				}
			}
			else
			{
				previous = template.contentRight('.r-img-i'+image.index);
				previous.addClass('image-position'+key1+'-'+key2);
			}
		}
	}
}

function disposeImages(data = false)
{

	calculateImagesDistribution();
	addImagesDistribution();

	if(data && typeof data.margin !== 'undefined')
		var margin = data.margin;
	else
		var margin = config.readingMargin.margin;

	var content = template.contentRight().children('div');
	var contentHeight = content.height() - (margin + margin);

	//Width 1
	var contentWidth1 = template.contentRight().width() - (margin + margin);
	var aspectRatio1 = contentWidth1 / contentHeight;

	//Width 2
	var contentWidth2 = (template.contentRight().width() / 2) - (margin + (margin / 2));
	var aspectRatio2 = contentWidth2 / contentHeight;

	for(key1 in imagesDistribution)
	{
		for(key2 in imagesDistribution[key1])
		{
			image = imagesDistribution[key1][key2];

			if(!image.folder)
			{
				if(image.blank)
					imageData = imagesData[imagesDistribution[key1][(key2 == 0) ? 1 : 0].index];
				else
					imageData = imagesData[image.index];


				if(image.width == 1)
					aspectRatio = aspectRatio1;
				else
					aspectRatio = aspectRatio2;


				if(image.width == 1)
					contentWidth = contentWidth1;
				else
					contentWidth = contentWidth2;


				if(aspectRatio > imageData.aspectRatio && !config.readingViewAdjustToWidth)
				{
					if(image.width == 2 && key2 == 1)
						var marginLeft = margin / 2;
					else if(image.width == 2)
						var marginLeft = ((contentWidth - contentHeight * imageData.aspectRatio) + margin);
					else
						var marginLeft = ((contentWidth - contentHeight * imageData.aspectRatio) / 2 + margin);

					template.contentRight('.image-position'+key1+'-'+key2+' img, .image-position'+key1+'-'+key2+' div').css({
						'height': contentHeight+'px',
						'width': (contentHeight * imageData.aspectRatio)+'px',
						'margin-left': marginLeft+'px',
						'margin-top': margin+'px',
						'margin-bottom': ((config.readingView == 'scroll' && (parseInt(key1) + 1) == indexNum) ? margin : 0)+'px'
					});
				}
				else
				{
					template.contentRight('.image-position'+key1+'-'+key2+' img, .image-position'+key1+'-'+key2+' div').css({
						'height': (contentWidth / imageData.aspectRatio)+'px',
						'width': contentWidth+'px',
						'margin-top': ((config.readingView == 'scroll') ? margin : ((contentHeight - contentWidth / imageData.aspectRatio) / 2 + margin))+'px',
						'margin-left': ((image.width == 2 && key2 == 1) ? (margin / 2) : margin) + 'px',
						'margin-bottom': ((config.readingView == 'scroll' && (parseInt(key1) + 1) == indexNum) ? margin : 0)+'px'
					});
				}
			}
		}
	}
}

function calculateView()
{
	var content = template.contentRight().children('div');
	var contentWidth = template.contentRight().width();

	if(config.readingView == 'slide')
	{
		template.contentRight('.reading-body > div, .reading-lens > div > div').css({
			'width': (contentWidth * indexNum)+'px',
			'height': content.height(),
		});

		float = 'left';
		height = content.height()+'px';
		contentWidth1 = contentWidth+'px';
		contentWidth2 = (contentWidth / 2)+'px';
	}
	else if(config.readingView == 'scroll')
	{
		template.contentRight('.reading-body > div').css({
			'width': '100%',
		});

		template.contentRight('.reading-lens > div > div').css({
			'width': ($('.content-right').width())+'px',
		});

		float = 'none';
		height = 'initial';
		contentWidth1 = '100%';
		contentWidth2 = '50%';
	}

	for(key1 in imagesDistribution)
	{
		for(key2 in imagesDistribution[key1])
		{
			image = imagesDistribution[key1][key2];

			if(image.width == 1)
				contentWidth = contentWidth1;
			else
				contentWidth = contentWidth2;

			template.contentRight('.image-position'+key1+'-'+key2).css({
				'width': contentWidth,
				'height': (config.readingView == 'scroll' && image.folder) ? (content.height() - config.readingMargin.margin) +'px' : height,
				'float': 'left',
			});
		}
	}

	if(config.readingView == 'scroll')
	{
		imagesPosition = [];

		for(key1 in imagesDistribution)
		{
			if(typeof imagesPosition[key1] === 'undefined') imagesPosition[key1] = [];

			for(key2 in imagesDistribution[key1])
			{
				image = template.contentRight('.image-position'+key1+'-'+key2);

				imagesPosition[key1][key2] = image.position().top + (image.height() / 2);
			}
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
		goToImageCL(currentIndex, false);

		var scrollTop = template.contentRight().children('div').scrollTop();
		var contentHeight = template.contentRight().children('div').children('div').height();

		var newScrollTop = (previousScrollTop * (1 - (previousContentHeight / contentHeight))) + previousScrollTop

		disableOnScroll(1);

		template.contentRight().children('div').scrollTop(newScrollTop);

	}
}

function goToImageCL(index, animation = true)
{
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

function goToImage(imageIndex)
{
	if(typeof imagesData[imageIndex] !== 'undefined')
	{
		readingDirection = true; 
		goToIndex(imagesData[imageIndex].position + 1);
		goToImageCL(imageIndex, true)
	}
}

function returnLargerImage(index)
{
	if(config.readingDoublePage)
	{
		imageHeight0 = template.contentRight('.image-position'+(index)+'-0').height();
		imageHeight1 = template.contentRight('.image-position'+(index)+'-1').height();

		if(imageHeight1 === undefined || imageHeight0 >= imageHeight1)
		{
			image = template.contentRight('.image-position'+(index)+'-0');
		}
		else
		{
			image = template.contentRight('.image-position'+(index)+'-1');
		}
	}
	else
	{
		image = template.contentRight('.image-position'+(index)+'-0');
	}

	return image;
}

var currentPageVisibility = 0, maxPageVisibility = 0; currentPageStart = true, readingDirection = true, previousReadingDirection = true, readingDirection = true;

function goToIndex(index, animation = true, nextPrevious = false, end = false)
{

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

		image = returnLargerImage(eIndex-1);

		imgHeight = image.height() + config.readingMargin.margin;

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

		image = returnLargerImage(eIndex-1);

		imgHeight = image.height() + config.readingMargin.margin;

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

			image = returnLargerImage(eIndex-1);

			imgHeight = image.height() + config.readingMargin.margin;

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

		image = returnLargerImage(eIndex-1);

		var scrollTop = (image.offset().top - content.offset().top) + content.scrollTop();

		scrollSum = 0;

		if(config.readingViewAdjustToWidth && pageVisibilityIndex !== false)
		{
			imgHeight = image.height() + config.readingMargin.margin;

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

	eachImagesDistribution((eIndex - 1), ['image', 'folder'], function(image){

		goToImageCL(image.index, animation);

	}, true);

	//goToImageCL(imagesDistribution[eIndex-1][0].index, animation);

	if(updateCurrentIndex)
		currentIndex = index;

	isBookmarkTrue = false;

	eachImagesDistribution((eIndex - 1), ['image', 'folder'], function(image){

		if(!isBookmarkTrue && isBookmark(p.normalize(images[image.index].path)))
			isBookmarkTrue = true;

	});

	previousReadingDirection = readingDirection;

}

function goNext()
{

	var nextIndex = currentIndex + 1;

	readingDirection = true;

	if(currentIndex < 1)
		showPreviousComic(2, true);
	else if(nextIndex <= indexNum || (config.readingViewAdjustToWidth && currentPageVisibility < maxPageVisibility))
		goToIndex(nextIndex, true, true);
	else if(nextIndex - 1 == indexNum && dom.nextComic())
		showNextComic(1, true);
}

function goPrevious()
{
	var previousIndex = currentIndex - 1;

	readingDirection = false;

	if(currentIndex > indexNum)
		showNextComic(2, true);
	else if(previousIndex > 0 || (config.readingViewAdjustToWidth && currentPageVisibility > 0))
		goToIndex(previousIndex, true, true)
	else if(previousIndex == 0 && dom.previousComic())
		showPreviousComic(1, true);
}

function goStart()
{
	if(currentIndex < 1)
		showPreviousComic(2, true);
	else if(currentIndex > indexNum)
		showNextComic(2, true);

	readingDirection = true;

	goToIndex(1, true);
}

function goEnd()
{
	if(currentIndex < 1)
		showPreviousComic(2, true);
	else if(currentIndex > indexNum)
		showNextComic(2, true);

	readingDirection = false;

	goToIndex(indexNum, true, true, true);
}

var showComicSkip;

function showNextComic(mode, animation = true)
{
	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	clearTimeout(showComicSkip);

	if(mode == 1)
	{
		var transition = config.readingViewSpeed < config.readingDelayComicSkip ? config.readingViewSpeed : config.readingDelayComicSkip;

		if(config.readingDelayComicSkip != 0)
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
					'transform': 'scale('+scale+') translate(-'+(contentWidth * (indexNum - 1))+'px, 0px)',
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

		showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'");', config.readingDelayComicSkip * 1000);

		currentIndex = indexNum + 1;
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
				'transform': 'scale(1) translate(-'+(contentWidth * (indexNum - 1))+'px, 0px)',
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

		currentIndex = indexNum;
	}
}


function showPreviousComic(mode, animation = true)
{
	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	clearTimeout(showComicSkip);

	if(mode == 1)
	{

		var transition = config.readingViewSpeed < config.readingDelayComicSkip ? config.readingViewSpeed : config.readingDelayComicSkip;

		if(config.readingDelayComicSkip != 0)
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

		showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true);', config.readingDelayComicSkip * 1000);

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

function magnifyingGlassControl(mode, e = false, lensData = false)
{

	if(e)
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
	else if(mode == 4)
	{
		if(save) storage.updateVar('config', 'readingViewSpeed', value);
	}
	else if(mode == 5)
	{
		if(save) storage.updateVar('config', 'readingDelayComicSkip', value);
	}
	else if(mode == 6)
	{
		if(value == 1)
			$('.reading-do-not-apply-to-horizontals').removeClass('disable-pointer');
		else
			$('.reading-do-not-apply-to-horizontals').addClass('disable-pointer');

		storage.updateVar('config', 'readingDoublePage', value);

		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, currentIndex);
	}
	else if(mode == 7)
	{
		storage.updateVar('config', 'readingDoNotApplyToHorizontals', value);

		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, currentIndex);
	}
}

function activeBookmark(mode)
{
	if(mode == 1)
	{
		template.barHeader('.button-bookmark-border').removeClass('button-bookmark-border').addClass('button-bookmark').attr('hover-text', language.reading['remove-bookmark']);
	}
	else
	{
		template.barHeader('.button-bookmark').removeClass('button-bookmark').addClass('button-bookmark-border').attr('hover-text', language.reading['add-bookmark']);
	}
}

function isBookmark(path)
{
	if($.inArray(path, readingCurrentBookmarks) !== -1)
	{
		activeBookmark(1);
		return true;
	}
	else
	{
		activeBookmark(2);
		return false;
	}
}

function createAndDeleteBookmark(index = false)
{
	let imageIndex = false;

	if(!index)
	{
		let imageBookmark = false;

		eachImagesDistribution((currentIndex - 1), ['image'], function(image){

			if(!imageIndex)
				imageIndex = image.index;


			if(isBookmark(p.normalize(images[image.index].path)))
			{
				if(imageBookmark)
				{
					createAndDeleteBookmark(image.index);
				}
				else
				{
					imageBookmark = true;
					imageIndex = image.index;
				}	
			}
		});
	}
	else
	{
		imageIndex = index;
	}

	if(currentIndex <= contentNum && currentIndex > 0 && imageIndex)
	{
		var path = p.normalize(images[imageIndex].path);

		if(typeof readingCurrentBookmarks !== 'undefined')
		{
			i = readingCurrentBookmarks.indexOf(path);

			if(i !== -1)
			{
				readingCurrentBookmarks.splice(i, 1);
				activeBookmark(2);
			}
			else
			{
				readingCurrentBookmarks.push(path);
				activeBookmark(1);
			}
		}
		else
		{
			readingCurrentBookmarks = [path];
			activeBookmark(1);
		}

		storage.updateVar('bookmarks', dom.indexMainPathA(), readingCurrentBookmarks);
	}
}

function loadBookmarks()
{
	var bookmarks = [];

	for(key in readingCurrentBookmarks)
	{
		if(p.dirname(readingCurrentBookmarks[key]) === readingCurrentPath)
		{
			bookmarks.push({
				name: decodeURI(p.basename(readingCurrentBookmarks[key]).replace(/\.[^\.]*$/, '')),
				index: imagesPath[readingCurrentBookmarks[key]],
			});
		}
	}

	bookmarks.sort(function (a, b) {

		if (parseInt(a['index']) > parseInt(b['index'])) return 1;

		if (parseInt(a['index']) < parseInt(b['index'])) return -1;

		return 0;
	});

	handlebarsContext.bookmarks = bookmarks;

	$('#collections-bookmark .menu-simple').html(template.load('reading.elements.menus.collections.bookmarks.html'));
}

function eachImagesDistribution(index, contains, callback, first = false, notFound = false)
{
	img = false;
	if(contains && contains.indexOf('image') !== -1)
		img = true;

	folder = false;
	if(contains && contains.indexOf('folder') !== -1)
		folder = true;

	blank = false;
	if(contains && contains.indexOf('blank') !== -1)
		blank = true;

	if(typeof imagesDistribution[index] !== 'undefined')
	{
		each:
		for(key in imagesDistribution[index])
		{
			if(!contains || (img && !imagesDistribution[index][key].folder && !imagesDistribution[index][key].blank) || (folder && imagesDistribution[index][key].folder) || (blank && imagesDistribution[index][key].blank))
				callback(imagesDistribution[index][key]);

			if(first)
				break each;
		}
	}
	else if(notFound)
	{
		notFound();
	}
}

var touchTimeout, mouseOut = {lens: false, body: false}, touchStart = false, magnifyingGlassOffset = false, readingCurrentPath = false, readingCurrentBookmarks = undefined;

function read(path, index = 1, end = false)
{
	images = {}, imagesData = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = index;

	readingCurrentPath = path;

	if(typeof storage.get('bookmarks') !== 'undefined' && typeof storage.get('bookmarks')[dom.indexMainPathA()] !== 'undefined')
		readingCurrentBookmarks = storage.get('bookmarks')[dom.indexMainPathA()];

	goToImageCL(index, false);

	$(window).off('keydown touchstart mouseout click resize');
	$('.reading-body, .reading-lens').off('mousemove');
	$('.reading-body').off('mouseout mouseenter touchmove');
	$('.content-right > div > div').off('scroll');

	events.eventHover();

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
			let contentHeight = template.contentRight().children('div').height();
			let contentPosition = (previousScrollTop + (contentHeight / 2));

			let selIndex = false, selPosition = false;

			for(key1 in imagesPosition)
			{
				for(key2 in imagesPosition[key1])
				{
					if(!selIndex || Math.abs(contentPosition - imagesPosition[key1][key2]) < selPosition)
					{
						selIndex = key1;
						selPosition = Math.abs(contentPosition - imagesPosition[key1][key2]);
					}
				}
			}

			if(currentIndex != (selIndex + 1))
			{

				isBookmarkTrue = false;

				eachImagesDistribution(selIndex, ['image', 'folder'], function(image){

					if(!isBookmarkTrue && isBookmark(p.normalize(images[image.index].path)))
						isBookmarkTrue = true;

				});

				imageIndex = false;

				eachImagesDistribution(selIndex, ['image', 'folder'], function(image){
					if(!imageIndex)
						imageIndex = image.index
				});

				if(imageIndex)
					goToImageCL(imageIndex, true);

				currentIndex = parseInt(selIndex) + 1;
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

				currentIndex = imagesData[currentIndex].position + 1;

				goToIndex(currentIndex, false, end, end);
				if(config.readingView == 'scroll')
				{
					previousContentHeight = template.contentRight().children('div').children('div').height();
				}
			}

		}
		images[index].src = $(this).attr('src');
		images[index].path = $(this).attr('path');
		imagesPath[$(this).attr('path')] = index;


	});

}

module.exports = {
	read: read,
	images: function(){return images},
	imagesNum: imagesNum,
	contentNum: contentNum,
	imagesNumLoad: imagesNumLoad,
	imagesData: function(){return imagesData},
	goToImage: goToImage,
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
	createAndDeleteBookmark: createAndDeleteBookmark,
	currentIndex: function(){return currentIndex},
	loadBookmarks: loadBookmarks,
};