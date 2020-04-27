
var images = {}, imagesData = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = 1, imagesPosition = {}, foldersPosition = {}, indexNum = 0, imagesDistribution = [], currentPageXY = {x: 0, y: 0};

//Calculates whether to add a blank image (If the reading is in double page and do not apply to the horizontals)
function blankPage(index)
{
	var key = 0;

	if(_config.readingDoublePage && !_config.readingWebtoon && _config.readingDoNotApplyToHorizontals)
	{
		for(let i = index; i < (imagesNum + 1); i++)
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

//Calculates the distribution of the images depending on the user's configuration
function calculateImagesDistribution()
{
	imagesDistribution = [];
	indexNum = 0;

	if(_config.readingDoublePage && !_config.readingWebtoon)
	{
		var data = [];

		if(_config.readingBlankPage && (!_config.readingDoNotApplyToHorizontals || (typeof imagesData[1] !== 'undefined' && imagesData[1].aspectRatio <= 1)))
			data.push({index: false, folder: false, blank: true, width: 2});

		for(let i = 1; i < (contentNum + 1); i++)
		{
			if(typeof imagesData[i] !== 'undefined')
			{
				if(_config.readingDoNotApplyToHorizontals && imagesData[i].aspectRatio > 1)
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
				}
				else
				{
					if(_config.readingDoNotApplyToHorizontals && data.length == 0 && blankPage(i))
						data.push({index: false, folder: false, blank: true, width: 2});

					data.push({index: i, folder: false, blank: false, width: 2});
					imagesData[i].position = indexNum; 
				}
			}
			else
			{
				data.push({index: i, folder: true, blank: false, width: 2});
				foldersPosition[i] = indexNum;
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
			if(data.length == 1 && data[0].width == 2)
				data.push({index: false, folder: false, blank: true, width: 2});

			imagesDistribution.push(data);
			indexNum++;
		}
	}
	else
	{
		for(let i = 1; i < (contentNum + 1); i++)
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
				indexNum++;
			}
		}
	}
}

var currentComics = [];

function setCurrentComics(comics)
{
	currentComics = {};

	for(let key in comics)
	{
		currentComics[comics[key].index] = comics[key];
	}
}

function applyMangaReading(distribution)
{
	_distribution = JSON.parse(JSON.stringify(distribution));

	if(_config.readingManga)
	{
		if(!readingViewIs('scroll'))
			_distribution.reverse();

		for(let i = 0, len = _distribution.length; i < len; i++)
		{
			_distribution[i].reverse();
		}
	}

	return _distribution;
}

// Add images distribution to html
function addHtmlImages()
{
	calculateImagesDistribution();

	var _imagesDistribution = applyMangaReading(imagesDistribution);

	var folderImages = [];

	for(let key1 in _imagesDistribution)
	{
		var distribution = [];

		for(let key2 in _imagesDistribution[key1])
		{
			var image = _imagesDistribution[key1][key2];

			image.key1 = key1;
			image.key2 = key2;

			if(!image.folder && !image.blank)
			{
				image.path = currentComics[image.index].path;
				image.image = currentComics[image.index].image;
			}
			else if(image.folder)
			{
				image.name = currentComics[image.index].name;
				image.path = currentComics[image.index].path;
				image.image = currentComics[image.index].image;
				image.mainPath = currentComics[image.index].mainPath;
				image.fristImage = currentComics[image.index].fristImage;
			}

			distribution.push(image);
		}

		folderImages.push({key1: key1, distribution: distribution});
	}

	handlebarsContext.folderImages = folderImages;

	var html = template.load('reading.content.right.images.html');

	template.contentRight('.loading').remove();
	template.contentRight('.reading-body > div').html(html);
	template.contentRight('.reading-lens > div > div').html(html);

}

//Calculates the size and position of the images
function calcAspectRatio(first, second)
{
	if(!first)
		return false;

	if(second)
	{
		if(first.folder)
			first.aspectRatio = 1;
		else if(first.blank)
			first.aspectRatio = second.folder ? 1 : imagesData[second.index].aspectRatio;
		else
			first.aspectRatio = imagesData[first.index].aspectRatio;
	}
	else
	{
		if(first.folder)
			first.aspectRatio = 1;
		else
			first.aspectRatio = imagesData[first.index].aspectRatio;
	}

	return first;
}

function disposeImages(data = false)
{
	var margin = (data && typeof data.margin !== 'undefined') ? data.margin : _config.readingMargin.margin;
	var marginHorizontal = (data && typeof data.left !== 'undefined') ? data.left : _config.readingMargin.left;
	var marginVertical = (data && typeof data.top !== 'undefined') ? data.top : _config.readingMargin.top;

	var contentHeight = template.contentRight().children('div').height();

	if(readingViewIs('scroll'))
		var contentWidth = template.contentRight('.reading-body').width();
	else
		var contentWidth = template.contentRight().width();

	//Width 0
	var contentWidth0 = contentWidth - (marginHorizontal * 2);
	var aspectRatio0 = contentWidth0 / (contentHeight - marginVertical /*dd*/ * 2);
	
	var _imagesDistribution = applyMangaReading(imagesDistribution);

	for(let key1 in _imagesDistribution)
	{
		var first = _imagesDistribution[key1][0];
		var second = _imagesDistribution[key1][1];

		first = calcAspectRatio(first, second);
		second = calcAspectRatio(second, first);

		if(second)
		{
			var imageHeight0, imageWidth0, marginLeft0, marginTop0, imageHeight1, imageWidth1, marginLeft1, marginTop1;

			var imageHeight = imageHeight0 = imageHeight1 = (contentHeight - marginVertical * 2);

			imageWidth0 = imageHeight0 * first.aspectRatio;
			imageWidth1 = imageHeight1 * second.aspectRatio;

			var joinWidth = imageWidth0 + imageWidth1 + marginHorizontal;

			if(joinWidth < contentWidth0 && !(readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
			{
				marginLeft0 = contentWidth / 2 - (imageWidth0 + imageWidth1 + marginHorizontal) / 2;
				marginLeft1 = marginHorizontal;
				marginTop0 = marginTop1 = marginVertical;
			}
			else
			{
				imageWidth0 = (first.aspectRatio / (first.aspectRatio + second.aspectRatio)) * (contentWidth0 - marginHorizontal);
				imageWidth1 = (second.aspectRatio / (second.aspectRatio + first.aspectRatio)) * (contentWidth0 - marginHorizontal);

				var imageHeight = imageHeight0 = imageHeight1 = imageWidth0 / first.aspectRatio;

				marginLeft0 = marginLeft1 = marginHorizontal;
				marginTop0 = marginTop1 = contentHeight / 2 - imageHeight / 2;
			}

			if(readingViewIs('scroll'))
				marginTop0 = marginTop1 = marginVertical;

			template.contentRight('.image-position'+key1+'-0 img, .image-position'+key1+'-0 > div').css({
				'height': imageHeight0+'px',
				'width': imageWidth0+'px',
				'margin-left': marginLeft0+'px',
				'margin-top': marginTop0+'px',
				'margin-bottom': ((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px',
				'margin-right': '0px',
			});

			template.contentRight('.image-position'+key1+'-1 img, .image-position'+key1+'-1 > div').css({
				'height': imageHeight1+'px',
				'width': imageWidth1+'px',
				'margin-left': marginLeft1+'px',
				'margin-top': marginTop1+'px',
				'margin-bottom': ((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px',
				'margin-right': '0px',
			});
		}
		else
		{
			if(aspectRatio0 > first.aspectRatio && !(readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
			{
				var imageHeight = (contentHeight - marginVertical * 2);
				var imageWidth = imageHeight * first.aspectRatio;
				var marginLeft = contentWidth / 2 - imageWidth / 2;
				var marginTop = marginVertical;
			}
			else
			{
				var imageWidth = (contentWidth - marginHorizontal * 2);
				var imageHeight = imageWidth / first.aspectRatio;
				var marginLeft = marginHorizontal;
				var marginTop = contentHeight / 2 - imageHeight / 2;
			}

			if(readingViewIs('scroll'))
				marginTop = marginVertical;

			template.contentRight('.image-position'+key1+'-0 img, .image-position'+key1+'-0 > div').css({
				'height': imageHeight+'px',
				'width': imageWidth+'px',
				'margin-left': marginLeft+'px',
				'margin-top': marginTop+'px',
				'margin-bottom': ((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px',
				'margin-right': '0px',
			});
		}

		template.contentRight('.image-position'+key1).css({
			'width': contentWidth+'px',
			'height': !readingViewIs('scroll') ? contentHeight+'px' : '',
		});
	}
}

function calculateView()
{
	var content = template.contentRight().children('div');
	var contentWidth = template.contentRight().width();

	if(readingViewIs('slide'))
	{
		template.contentRight('.reading-body > div, .reading-lens > div > div').css({
			'width': (contentWidth * indexNum)+'px',
			'height': content.height(),
		});
	}
	else if(readingViewIs('scroll'))
	{
		template.contentRight('.reading-body > div').css({
			'width': '100%',
		});

		template.contentRight('.reading-lens > div > div').css({
			'width': ($('.content-right').width())+'px',
		});
	}

	if(readingViewIs('scroll'))
	{
		imagesPosition = [];
		var element = template.contentRight().children('div');
		var scrollTop = element.scrollTop() + element.offset().top;

		for(var key1 in imagesDistribution)
		{
			if(typeof imagesPosition[key1] === 'undefined') imagesPosition[key1] = [];

			for(var key2 in imagesDistribution[key1])
			{
				var image = template.contentRight('.image-position'+key1+'-'+key2);

				imagesPosition[key1][key2] = (image.offset().top + (image.height() / 2)) - scrollTop;
			}
		}
	}
}

var previousScrollTop = 0, previousContentHeight = 0;

function stayInLine()
{
	if(readingViewIs('slide') || (readingViewIs('scroll') && !_config.readingViewAdjustToWidth && !_config.readingWebtoon))
	{
		if(currentIndex < 1)
			showPreviousComic(1, false);
		else if(currentIndex > contentNum)
			showNextComic(1, false);
		else
			goToIndex(currentIndex, false);
	}
	else if(readingViewIs('scroll'))
	{
		if(currentIndex < 1)
			showPreviousComic(1, false);
		else if(currentIndex > contentNum)
			showNextComic(1, false);
		else
			goToIndex(currentIndex, false);
	}
}

//Go to a specific comic image (Left menu)
function goToImageCL(index, animation = true)
{
	var animationDurationMS = ((animation) ? _config.readingViewSpeed : 0) * 1000;

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

//Go to a specific comic image
function goToImage(imageIndex, bookmarks = false)
{
	if(typeof imagesData[imageIndex] !== 'undefined')
	{
		if(!bookmarks)
			saveReadingProgressA = true;

		readingDirection = true;

		var newIndex = imagesData[imageIndex].position + 1;

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) + 1;

		goToIndex(newIndex);
		goToImageCL(imageIndex, true)
	}
}

//Go to a specific comic folder
function goToFolder(folderIndex)
{
	if(typeof foldersPosition[folderIndex] !== 'undefined')
	{
		readingDirection = true;

		var newIndex = foldersPosition[folderIndex] + 1;

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) + 1;

		goToIndex(newIndex);
		goToImageCL(folderIndex, true)
	}
}

//Returns the highest image
function returnLargerImage(index)
{
	if(_config.readingDoublePage && !_config.readingWebtoon)
	{
		var imageHeight0 = template.contentRight('.image-position'+(index)+'-0').height();
		var imageHeight1 = template.contentRight('.image-position'+(index)+'-1').height();

		if(imageHeight1 === undefined || imageHeight0 >= imageHeight1)
		{
			var image = template.contentRight('.image-position'+(index)+'-0');
		}
		else
		{
			var image = template.contentRight('.image-position'+(index)+'-1');
		}
	}
	else
	{
		var image = template.contentRight('.image-position'+(index)+'-0');
	}

	return image;
}

var currentPageVisibility = 0, maxPageVisibility = 0, currentPageStart = true, readingDirection = true, previousReadingDirection = true, readingDirection = true;

//Go to a specific comic index
function goToIndex(index, animation = true, nextPrevious = false, end = false)
{
	var animationDurationS = ((animation) ? _config.readingViewSpeed : 0);
	var animationDurationMS = animationDurationS * 1000;

	if(currentScale != 1 && animation)
		reading.resetZoom();

	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	var updateCurrentIndex = true;

	var eIndex = index;

	var pageVisibilityIndex = 0;

	var imgHeight = false;

	if(((nextPrevious && currentPageStart) || !nextPrevious || end) && (readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
	{
		image = returnLargerImage(eIndex-1);

		imgHeight = image.height() + _config.readingMargin.top;

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
	else if(nextPrevious && !currentPageStart && (readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
	{
		eIndex = currentIndex;

		image = returnLargerImage(eIndex-1);

		imgHeight = image.height() + _config.readingMargin.top;

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

			imgHeight = image.height() + _config.readingMargin.top;

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

	if(readingViewIs('slide'))
	{
		template.contentRight('.reading-body > div, .reading-lens > div > div').css({
			'transition': animationDurationS+'s',
			'transform': 'translate(-'+(contentWidth * (eIndex - 1))+'px, 0)',
		});
	}
	else if(readingViewIs('scroll'))
	{
		var image = returnLargerImage(eIndex-1);

		var scrollTop = (image.offset().top - content.offset().top) + content.scrollTop();

		var scrollSum = 0;

		if((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && pageVisibilityIndex !== false)
		{
			imgHeight = image.height() + _config.readingMargin.top;

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

	var newIndex = (eIndex - 1);

	if(_config.readingManga && !readingViewIs('scroll'))
		newIndex = (indexNum - newIndex) - 1;

	eachImagesDistribution(newIndex, ['image', 'folder'], function(image){

		goToImageCL(image.index, animation);

	}, false, false, true);

	//goToImageCL(imagesDistribution[eIndex-1][0].index, animation);

	if(updateCurrentIndex)
		currentIndex = index;

	var isBookmarkTrue = false;

	eachImagesDistribution((eIndex - 1), ['image', 'folder'], function(image){

		if(!isBookmarkTrue && images[image.index] && isBookmark(p.normalize(images[image.index].path)))
			isBookmarkTrue = true;

	});

	previousReadingDirection = readingDirection;
}

//Go to the next comic page
function goNext()
{
	saveReadingProgressA = true;

	var nextIndex = currentIndex + 1;

	readingDirection = true;

	if(currentIndex < 1)
		showPreviousComic(2, true);
	else if(nextIndex <= indexNum || ((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && currentPageVisibility < maxPageVisibility))
		goToIndex(nextIndex, true, true);
	else if(currentIndex == indexNum && dom.nextComic() && (!_config.readingManga || readingViewIs('scroll')))
		showNextComic(1, true);
	else if(currentIndex == indexNum && dom.previousComic() && _config.readingManga && !readingViewIs('scroll'))
		showNextComic(1, true, true);
}

//Go to the previous comic page
function goPrevious()
{
	saveReadingProgressA = true;

	var previousIndex = currentIndex - 1;

	readingDirection = false;

	if(currentIndex > indexNum)
		showNextComic(2, true);
	else if(previousIndex > 0 || ((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && currentPageVisibility > 0))
		goToIndex(previousIndex, true, true)
	else if(previousIndex == 0 && dom.previousComic() && (!_config.readingManga || readingViewIs('scroll')))
		showPreviousComic(1, true);
	else if(previousIndex == 0 && dom.nextComic() && _config.readingManga && !readingViewIs('scroll'))
		showPreviousComic(1, true, true);
}

//Go to the start of the comic
function goStart(force = false)
{
	if(force || !_config.readingManga || readingViewIs('scroll'))
	{
		saveReadingProgressA = true;

		if(currentIndex > indexNum || (currentIndex - 1 == 0 && dom.previousComic()))
		{
			goPrevious();
		}
		else
		{
			readingDirection = true;

			goToIndex(1, true);
		}
	}
	else
	{
		goEnd(true);
	}
}

//Go to the end of the comic
function goEnd(force = false)
{
	if(force || !_config.readingManga || readingViewIs('scroll'))
	{
		saveReadingProgressA = true;

		if(currentIndex < 1 || (currentIndex == indexNum && dom.nextComic()))
		{
			goNext();
		}
		else
		{
			readingDirection = false;

			goToIndex(indexNum, true, true, true);
		}
	}
	else
	{
		goStart(true);
	}
}

function leftClick(e)
{
	var isTouch = (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) ? true : false;

	if(!reading.haveZoom() && (!isTouch || !config.readingMagnifyingGlass))
	{
		if(isTouch)
			reading.goNext();
		else
			reading.goPrevious();
	}
}

function rightClick(e)
{
	var isTouch = (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) ? true : false;

	if(!reading.haveZoom() && (!isTouch || !config.readingMagnifyingGlass))
	{
		if(isTouch)
			reading.goPrevious();
		else
			reading.goNext();
	}
}

var showComicSkip;

//Begins to show the next comic
function showNextComic(mode, animation = true, invert = false)
{	
	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	clearTimeout(showComicSkip);

	if(mode == 1)
	{
		var transition = _config.readingViewSpeed < _config.readingDelayComicSkip ? _config.readingViewSpeed : _config.readingDelayComicSkip;

		if(_config.readingDelayComicSkip != 0)
		{
			if(readingViewIs('slide'))
			{
				var skip = template.contentRight('.reading-skip-right');

				skip.css({
					'transition': 'transform '+transition+'s, background-color 0.2s, box-shadow 0.2s',
					'transform': 'translate(-100px, 0px)',
				});

				var scale = ((contentWidth - 100) / contentWidth);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': '0px center',
					'transition': 'transform '+((animation) ? transition : 0)+'s, background-color 0.2s, box-shadow 0.2s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+') translate(-'+(contentWidth * (indexNum - 1))+'px, 0px)',
				});
			}
			else if(readingViewIs('scroll'))
			{
				var skip = template.contentRight('.reading-skip-bottom');

				skip.css({
					'transition': 'transform '+transition+'s, background-color 0.2s, box-shadow 0.2s',
					'transform': 'translate(0px, -100px)',
				});

				var scale = ((contentHeight - 100) / contentHeight);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': 'center '+(template.contentRight('.reading-body').height() - contentHeight)+'px',
					'transition': 'transform '+((animation) ? transition : 0)+'s, background-color 0.2s, box-shadow 0.2s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});
			}

			skip.find('circle').css('animation-duration', _config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true);', _config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'");', _config.readingDelayComicSkip * 1000);

		currentIndex = indexNum + 1;
	}
	else
	{
		if(readingViewIs('slide'))
		{
			var skip = template.contentRight('.reading-skip-right').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(-'+(contentWidth * (indexNum - 1))+'px, 0px)',
			});
		}
		else if(readingViewIs('scroll'))
		{
			var skip = template.contentRight('.reading-skip-bottom').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}

		currentIndex = indexNum;
	}
}

//Begins to show the previous comic
function showPreviousComic(mode, animation = true, invert = false)
{
	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	clearTimeout(showComicSkip);

	if(mode == 1)
	{

		var transition = _config.readingViewSpeed < _config.readingDelayComicSkip ? _config.readingViewSpeed : _config.readingDelayComicSkip;

		if(_config.readingDelayComicSkip != 0)
		{
			if(readingViewIs('slide'))
			{
				var skip = template.contentRight('.reading-skip-left');

				skip.css({
					'transition': 'transform '+transition+'s, background-color 0.2s, box-shadow 0.2s',
					'transform': 'translate(100px, 0px)',
				});

				var scale = ((contentWidth - 100) / contentWidth);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': contentWidth+'px center',
					'transition': 'transform '+((animation) ? transition : 0)+'s, background-color 0.2s, box-shadow 0.2s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});

			}
			else if(readingViewIs('scroll'))
			{
				var skip = template.contentRight('.reading-skip-top');

				skip.css({
					'transition': 'transform '+transition+'s, background-color 0.2s, box-shadow 0.2s',
					'transform': 'translate(0px, 100px)',
				});

				var scale = ((contentHeight - 100) / contentHeight);

				template.contentRight('.reading-body > div, .reading-lens > div > div').css({
					'transform-origin': 'center '+contentHeight+'px',
					'transition': 'transform '+((animation) ? transition : 0)+'s, background-color 0.2s, box-shadow 0.2s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});
			}

			skip.find('circle').css('animation-duration', _config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'");', _config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true);', _config.readingDelayComicSkip * 1000);

		currentIndex = 0;
	}
	else
	{
		if(readingViewIs('slide'))
		{
			var skip = template.contentRight('.reading-skip-left');

			skip.css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}
		else if(readingViewIs('scroll'))
		{
			var skip = template.contentRight('.reading-skip-top');

			skip.css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}

		currentIndex = 1;
	}
}

var currentScale = 1, scalePrevData = {tranX: 0, tranY: 0, scale: 1}, originalRect = false, originalRectReadingBody = false, haveZoom = false, currentZoomIndex = false;

function applyScale(animation = true, scale = 1, center = false, zoomOut = false)
{
	var animationDurationS = ((animation) ? _config.readingViewSpeed : 0);

	scale = Math.round(scale * 100) / 100;

	if(currentZoomIndex === false)
	{
		if(center || !readingViewIs('scroll'))
		{
			currentZoomIndex = (currentIndex - 1);
		}
		else
		{
			var currentRect = template.contentRight('.image-position'+(currentIndex - 1)).get(0).getBoundingClientRect();

			if(currentRect.top > currentPageXY.y && (currentIndex - 2) >= 0)
			{
				currentZoomIndex = (currentIndex - 2);
			}
			else if(currentRect.top + currentRect.height < currentPageXY.y && currentIndex <= indexNum)
			{
				currentZoomIndex = currentIndex;
			}
			else
			{
				currentZoomIndex = (currentIndex - 1);
			}			
		}
	}

	if(scale != scalePrevData.scale)
	{
		if(originalRect === false)
		{
			originalRect = template.contentRight('.image-position'+currentZoomIndex).get(0).getBoundingClientRect();
			originalRectReadingBody = template.contentRight().children().get(0).getBoundingClientRect();
		}

		var scaleDiff = (scale - (scalePrevData.scale - 1));

		if(!zoomOut)
		{
			var pageX = currentPageXY.x - originalRect.left;
			var pageY = currentPageXY.y - originalRect.top;

			var addX = (0.5 - (pageX / originalRect.width)) * originalRect.width;
			var addY = (0.5 - (pageY / originalRect.height)) * originalRect.height;

			if(center)
			{
				addX = 0;
				addY = 0;
			}

			var translateX = (scalePrevData.tranX / scalePrevData.scale * scale) + (addX / scalePrevData.scale * (scale - scalePrevData.scale));
			var translateY = (scalePrevData.tranY / scalePrevData.scale * scale) + (addY / scalePrevData.scale * (scale - scalePrevData.scale));
		}
		else
		{
			var translateX = scalePrevData.tranX - (scalePrevData.tranX * ((scalePrevData.scale - scale) / (scalePrevData.scale - 1)));
			var translateY = scalePrevData.tranY - (scalePrevData.tranY * ((scalePrevData.scale - scale) / (scalePrevData.scale - 1)));
		}

		if(scale <= 1)
		{
			translateX = 0;
			translateY = 0;
			haveZoom = false;
		}
		else
		{
			haveZoom = true;
		}

		template.contentRight('.image-position'+currentZoomIndex).css({
			'transition': 'transform '+animationDurationS+'s, z-index '+animationDurationS+'s',
			'transform': 'translate('+(translateX)+'px, '+(translateY)+'px) scale('+scale+')',
			'transform-origin': 'center center',
			'z-index': scale == 1 ? 1 : 2,
			'will-change': scale == 1 ? '' : 'transform',
		});

		if(scale == 1)
		{
			originalRect = false;
			currentZoomIndex = false;
		}

		scalePrevData = {
			tranX: translateX,
			tranY: translateY,
			scale: scale,
		};
	}
}

// Zoom in
function zoomIn(animation = true, center = false)
{
	if(zoomMoveData.active)
		return;

	if(currentScale < 8)
		currentScale *= 1.25;

	applyScale(animation, currentScale, center);
}

// Zoom out
function zoomOut(animation = true, center = false)
{
	if(zoomMoveData.active)
		return;

	if(currentScale > 0.2)
		currentScale /= 1.25;

	applyScale(animation, currentScale, center, true);
}


// Reset zoom
function resetZoom(animation = true, index = false, apply = true)
{
	var animationDurationS = ((animation) ? _config.readingViewSpeed : 0);

	currentScale = 1;

	if(apply)
	{
		template.contentRight('.image-position'+currentZoomIndex).css({
			'transition': 'transform '+animationDurationS+'s, z-index '+animationDurationS+'s',
			'transform': 'scale('+currentScale+')',
			'transform-origin': 'center center',
			'z-index': 1,
			'will-change': '',
		});
	}

	originalRect = false;
	scalePrevData = {tranX: 0, tranY: 0, scale: 1};
	haveZoom = false;
	zoomMoveData.active = false;
	currentZoomIndex = false;
}


//Turn the magnifying glass on and off
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

//Magnifying glass settings
function changeMagnifyingGlass(mode, value, save)
{

	var contentRight = template.contentRight();

	var paddingTop = parseInt(contentRight.css('padding-top'), 10);
	if(!paddingTop) paddingTop = 0;


	var width = contentRight.width(),
	height = contentRight.height(),
	offset = contentRight.offset();

	var pageX = (width / 2) + offset.left;
	var pageY = (height / 2) + offset.top + paddingTop;


	if(mode == 1) //Set the zoom
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {zoom: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassZoom', value);
	}
	else if(mode == 2) //Set the size
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {size: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassSize', value);
	}
	else if(mode == 3) //Set the ratio
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {ratio: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassRatio', value);
	}
	else if(mode == 4) //Set the radius
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {radius: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassRadius', value);
	}
}

var magnifyingGlassView = false;

//Magnifying glass control
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

		var offset = template.contentRight('.reading-body').offset();

		var topLens = y - offset.top - (lensHeightM / zoom);
		var leftLens = x - offset.left - lensWidthM;

		template.contentRight('.reading-lens').css({
			'transform': 'translate('+left+'px, '+top+'px)',
			'width': lensWidth+'px',
			'height': lensHeight+'px',
			'border-radius': ((lensData && typeof lensData.radius != 'undefined') ? lensData.radius : config.readingMagnifyingGlassRadius)+'px'
		}).removeClass('d h').addClass('a');

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

	//calculateView();

}

function readingViewIs(value)
{
	if(value == 'scroll' && _config.readingWebtoon)
		return true;

	if(_config.readingView == value && !_config.readingWebtoon)
		return true;

	return false;
}

var activeOnScroll = true;

function disableOnScroll(mode)
{
	if(mode == 1)
		activeOnScroll = false;
	else
		activeOnScroll = true;
}

function updateReadingPagesConfig(key, value)
{
	_config[key] = value; 

	if(currentReadingConfigKey === false)
	{
		var readingPagesConfig = storage.getKey('readingPagesConfig', dom.indexMainPathA());
		if(!readingPagesConfig || readingPagesConfig.configKey > 0)
		{
			if(readingPagesConfig && readingPagesConfig.configKey > 0)
			{
				var readingShortcutPagesConfig = storage.getKey('readingShortcutPagesConfig', readingPagesConfig.configKey);

				if(readingShortcutPagesConfig)
					readingPagesConfig = copy(readingShortcutPagesConfig);
				else
					readingPagesConfig = copy(config);
			}
			else
			{
				readingPagesConfig = copy(config);
			}
		}

		template.globalElement('.reading-shortcut-pages-config .menu-simple-element-icon-select').removeClass('active');

		readingPagesConfig[key].configKey = false;
		readingPagesConfig[key] = value;

		storage.updateVar('readingPagesConfig', dom.indexMainPathA(), readingPagesConfig);
	}
	else if(currentReadingConfigKey > 0)
	{
		var readingShortcutPagesConfig = storage.getKey('readingShortcutPagesConfig', currentReadingConfigKey);

		if(readingShortcutPagesConfig)
		{		
			readingShortcutPagesConfig[key] = value;

			storage.updateVar('readingShortcutPagesConfig', currentReadingConfigKey, readingShortcutPagesConfig);
		}
	}
	else if(currentReadingConfigKey == 0)
	{
		storage.updateVar('config', key, value);
	}
}

//Controls the page view
function changePagesView(mode, value, save)
{
	if(currentScale != 1)
		reading.resetZoom(true, false, false);

	var imageIndex = false;

	var newIndex = (currentIndex - 1);

	if(_config.readingManga && !readingViewIs('scroll'))
		newIndex = (indexNum - newIndex) - 1;

	eachImagesDistribution(newIndex, ['image'], function(image){

		if(!imageIndex)
			imageIndex = image.index;

	});

	if(!imageIndex) imageIndex = currentIndex;

	if(mode == 0)
	{
		loadReadingPages();

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 1) // Set the scroll mode
	{
		updateReadingPagesConfig('readingView', value);

		dom.selectElement('.pages-'+value);

		if(value == 'slide' && (_config.readingViewAdjustToWidth || _config.readingWebtoon))
		{
			//storage.updateVar('config', 'readingViewAdjustToWidth', false);
			//template.globalElement('.reading-ajust-to-width .switch').removeClass('a');
		}

		if(value == 'slide')
			template.globalElement('.reading-ajust-to-width').addClass('disable-pointer');
		else
			template.globalElement('.reading-ajust-to-width').removeClass('disable-pointer');

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 2) // Sets the margin of the pages
	{
		disposeImages({margin: value});

		if(save) updateReadingPagesConfig('readingMargin', {margin: value, top: value, bottom: value, left: value, right: value});
	}
	else if(mode == 3) // Set width adjustment
	{
		updateReadingPagesConfig('readingViewAdjustToWidth', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 4) // Set the speed of the animation when changing pages
	{
		if(save) updateReadingPagesConfig('readingViewSpeed', value);
	}
	else if(mode == 5) // Set the delay when skip from comic
	{
		if(save) updateReadingPagesConfig('config', 'readingDelayComicSkip', value);
	}
	else if(mode == 6) // Set the reading to double page
	{
		if(value)
			$('.reading-do-not-apply-to-horizontals, .reading-blank-page').removeClass('disable-pointer');
		else
			$('.reading-do-not-apply-to-horizontals, .reading-blank-page').addClass('disable-pointer');

		updateReadingPagesConfig('readingDoublePage', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 7) // Disables double-page reading in horizontal images
	{
		updateReadingPagesConfig('readingDoNotApplyToHorizontals', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 8) // Manga reading, invert the direction and double pages
	{
		updateReadingPagesConfig('readingManga', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 9) // Webtoon reading, scroll reading and adjust to width
	{
		updateReadingPagesConfig('readingWebtoon', value);

		if(value)
		{
			template.globalElement('.pages-slide, .pages-scroll, .reading-reading-manga, .reading-double-page, .reading-do-not-apply-to-horizontals, .reading-blank-page, .reading-ajust-to-width').addClass('disable-pointer');
		}
		else
		{
			if(_config.readingView == 'scroll')
				template.globalElement('.reading-ajust-to-width').removeClass('disable-pointer');
			
			if(_config.readingDoublePage)
				template.globalElement('.reading-do-not-apply-to-horizontals, .reading-blank-page').removeClass('disable-pointer');

			template.globalElement('.pages-slide, .pages-scroll, .reading-reading-manga, .reading-double-page').removeClass('disable-pointer');
		}

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 10) // Set horizontal margin of the pages
	{
		disposeImages({left: value, right: value});
		stayInLine();

		if(save) updateReadingPagesConfig('readingMargin', {margin: _config.readingMargin.margin, top: _config.readingMargin.top, bottom: _config.readingMargin.bottom, left: value, right: value});
	}
	else if(mode == 11) // Set vertical margin of the pages
	{
		disposeImages({top: value, bottom: value});
		stayInLine();

		if(save) updateReadingPagesConfig('readingMargin', {margin: _config.readingMargin.margin, top: value, bottom: value, left: _config.readingMargin.left, right: _config.readingMargin.right});
	}
	else if(mode == 12) // Add blank page at first
	{
		updateReadingPagesConfig('readingBlankPage', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
}

//Change the bookmark icon
function activeBookmark(mode)
{
	if(mode == 1)
	{
		template.barHeader('.button-bookmark').html('bookmark').attr('hover-text', language.reading.removeBookmark);
	}
	else
	{
		template.barHeader('.button-bookmark').html('bookmark_border').attr('hover-text', language.reading.addBookmark);
	}
}

//Check if a path is a marker
function isBookmark(path)
{
	let i = false;

	for(let key in readingCurrentBookmarks)
	{
		if(readingCurrentBookmarks[key].path === path)
		{
			i = key;
			break;
		}
	}

	if(i !== false)
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

//Create and delete bookmarks
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
			let i = false;

			for(let key in readingCurrentBookmarks)
			{
				if(readingCurrentBookmarks[key].path === path)
				{
					i = key;
					break;
				}
			}

			if(i !== false)
			{
				readingCurrentBookmarks.splice(i, 1);
				activeBookmark(2);
			}
			else
			{
				readingCurrentBookmarks.push({path: path, index: imagesPath[path]});
				activeBookmark(1);
			}
		}
		else
		{
			readingCurrentBookmarks = [{path: path, index: imagesPath[path]}];
			activeBookmark(1);
		}

		storage.updateVar('bookmarks', dom.indexMainPathA(), readingCurrentBookmarks);
	}
}

var saveReadingProgressA = false;

//Save current reading progress
function saveReadingProgress(path = false)
{
	if(!onReading)
		return;

	if(!saveReadingProgressA)
		return;

	var mainPath = dom.indexMainPathA();

	if(!path)
	{
		let imageIndex = false;

		var newIndex = (currentIndex - 1);

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) - 1;

		eachImagesDistribution(newIndex, ['image'], function(image){

			if(!imageIndex)
				imageIndex = image.index;

		});

		if(imageIndex === false)
			imageIndex = Object.keys(images)[0];

		path = p.normalize(images[imageIndex].path);
	}

	var comic = false, comicIndex = 0, comics = storage.get('comics');

	for(let i in comics)
	{
		if(comics[i].path == mainPath)
		{
			comic = comics[i];
			comicIndex = i;
			break;
		}
	}
	storage.updateVar('readingProgress', dom.indexMainPathA(), {
		index: imagesPath[path],
		path: path,
		lastReading: +new Date(),
		progress: 0,
	});

	if(comic && path)
	{
		comic.readingProgress.path = imagesPath[path];
		comic.readingProgress.path = path;
		comic.readingProgress.lastReading = +new Date();
		comic.readingProgress.progress = 0;

		storage.updateVar('comics', comicIndex, comic);
	}
	return true;
}

//Load the bookmarks in the current directory
function loadBookmarks()
{
	var bookmarksPath = {}, mainPath = dom.indexMainPathA();

	for(let key in readingCurrentBookmarks)
	{
		if(typeof readingCurrentBookmarks[key].path != 'undefined')
		{
			var bookmark = readingCurrentBookmarks[key];

			var bookmarkDirname = p.dirname(bookmark.path);

			if(typeof bookmarksPath[bookmarkDirname] === 'undefined') bookmarksPath[bookmarkDirname] = [];

			let sha = sha1(bookmark.path);

			var thumbnail = cache.returnCacheImage(file.realPath(bookmark.path), sha, function(data){

				dom.addImageToDom(data.sha, data.path);

			});

			bookmarksPath[bookmarkDirname].push({
				name: decodeURI(p.basename(bookmark.path).replace(/\.[^\.]*$/, '')),
				index: (bookmarkDirname !== readingCurrentPath) ? bookmark.index : imagesPath[bookmark.path],
				sha: sha,
				mainPath: mainPath,
				thumbnail: (thumbnail.cache) ? thumbnail.path : '',
				path: bookmark.path,
			});
		}
	}

	var bookmarks = [];

	for(let path in bookmarksPath)
	{
		bookmarksPath[path].sort(function (a, b) {

			if (parseInt(a['index']) > parseInt(b['index'])) return 1;

			if (parseInt(a['index']) < parseInt(b['index'])) return -1;

			return 0;
		});

		bookmarks.push({
			continueReading: false,
			current: (path === readingCurrentPath) ? true : false,
			path: path,
			name: p.basename(path),
			bookmarks: bookmarksPath[path],
		});
	}

	var readingProgress = storage.getKey('readingProgress', dom.indexMainPathA());

	if(readingProgress)
	{
		var bookmarkDirname = p.dirname(readingProgress.path);

		let sha = sha1(readingProgress.path);

		var thumbnail = cache.returnCacheImage(file.realPath(readingProgress.path), sha, function(data){

			dom.addImageToDom(data.sha, data.path);

		});

		bookmarks.push({
			continueReading: true,
			current: (bookmarkDirname === readingCurrentPath) ? true : false,
			path: bookmarkDirname,
			name: p.basename(bookmarkDirname),
			bookmarks: [{
				name: decodeURI(p.basename(readingProgress.path).replace(/\.[^\.]*$/, '')),
				index: readingProgress.index,
				sha: sha,
				mainPath: readingProgress.mainPath,
				thumbnail: (thumbnail.cache) ? thumbnail.path : '',
				path: readingProgress.path,
			}],
		});
	}

	bookmarks.sort(function (a, b) {

		if(a.current || a.continueReading) return -1;

		if(b.current && !a.continueReading) return 1;

		return dom.orderBy(a, b, 'simple', 'path');
	});

	handlebarsContext.bookmarks = bookmarks;

	$('#collections-bookmark .menu-simple').html(template.load('reading.elements.menus.collections.bookmarks.html'));
}

var currentReadingConfigKey = false;

function loadReadingConfig(key = false)
{
	_config = copy(config);

	currentReadingConfigKey = key;

	if(key === false)
	{
		var readingPagesConfig = storage.getKey('readingPagesConfig', dom.indexMainPathA());

		if(readingPagesConfig)
		{
			if(readingPagesConfig.configKey)
				key = readingPagesConfig.configKey;
			else
				_config = {..._config, ...readingPagesConfig, key: readingPagesConfig.configKey};
		}
		else
		{
			_config.key = 0;
		}
	}

	if(key > 0)
	{
		var readingShortcutPagesConfig = storage.getKey('readingShortcutPagesConfig', key);

		if(readingShortcutPagesConfig)
			_config = {..._config, ...readingShortcutPagesConfig};

		_config.key = key;
	}
	else if(key === 0)
	{
		_config.key = 0;
	}

	_config = copy(_config);

	handlebarsContext._config = _config;
}

function loadReadingPages(key = false, edit = false)
{
	loadReadingConfig(key);

	handlebarsContext.readingGlobalConfigName = config.readingConfigName ? config.readingConfigName : language.reading.pages.readingGlobal;

	handlebarsContext.readingShortcutPagesConfig = storage.get('readingShortcutPagesConfig');

	handlebarsContext.editReadingShortcutPagesConfig = edit;

	$('#reading-pages .menu-simple').html(template.load('reading.elements.menus.pages.html'));

	events.events();
}

function setReadingShortcutPagesConfig(key = 0, desactiveMenu = true)
{
	if(key == 0)
	{
		storage.updateVar('readingPagesConfig', dom.indexMainPathA(), null);
	}
	else
	{
		var readingPagesConfig = storage.getKey('readingPagesConfig', dom.indexMainPathA());

		if(!readingPagesConfig) readingPagesConfig = {};
		readingPagesConfig.configKey = key;

		storage.updateVar('readingPagesConfig', dom.indexMainPathA(), readingPagesConfig);
	}

	changePagesView(0);

	if(desactiveMenu)
		events.desactiveMenu('#reading-pages', '.bar-right-buttons .button-book-open-page-variant');
}

function editReadingShortcutPagesConfig(event, key = 0)
{
	event.stopPropagation();

	loadReadingPages(key, true);

	reading.changePagesView(0);

	loadReadingPages(key, true);
}

function editReadingShortcutPagesConfigName(key = 0, save = false)
{
	if(save)
	{
		var name = $('.input-config-name').val();

		if(isEmpty(name.trim()))
		{
			events.snackbar({
				key: 'newReadingShortcutPagesConfig',
				text: language.global.valueCannotBeEmpty,
				duration: 6,
				buttons: [
					{
						text: language.buttons.dismiss,
						function: 'events.closeSnackbar();',
					},
				],
			});
		}
		else
		{
			if(key === 0)
			{
				storage.updateVar('config', 'readingConfigName', name);
			}
			else
			{			
				var readingShortcutPagesConfig = storage.getKey('readingShortcutPagesConfig', key);

				if(readingShortcutPagesConfig)
				{			
					readingShortcutPagesConfig['readingConfigName'] = name;

					storage.updateVar('readingShortcutPagesConfig', key, readingShortcutPagesConfig);

				}
			}

			loadReadingPages(key, true);
		}
	}
	else
	{
		if(key === 0)
		{
			handlebarsContext.readingShortcutConfigName = config.readingConfigName ? config.readingConfigName : language.reading.pages.readingGlobal;
		}
		else
		{
			var readingShortcutPagesConfig = storage.getKey('readingShortcutPagesConfig', key);

			handlebarsContext.readingShortcutConfigName = readingShortcutPagesConfig ? readingShortcutPagesConfig.readingConfigName : '';
		}

		events.dialog({
			header: language.dialog.pages.readingConfigEditHeader,
			width: 400,
			height: false,
			content: template.load('dialog.pages.reading.config.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.ok,
					function: 'events.closeDialog(); reading.editReadingShortcutPagesConfigName('+key+', true);',
				}
			],
		});
	}
}

function newReadingShortcutPagesConfig(save = false)
{
	if(save)
	{
		var name = $('.input-config-name').val();

		if(isEmpty(name.trim()))
		{
			events.snackbar({
				key: 'newReadingShortcutPagesConfig',
				text: language.global.valueCannotBeEmpty,
				duration: 6,
				buttons: [
					{
						text: language.buttons.dismiss,
						function: 'events.closeSnackbar();',
					},
				],
			});
		}
		else
		{
			var readingShortcutPagesConfig = storage.get('readingShortcutPagesConfig');

			var newKey = 0;

			for(let key in readingShortcutPagesConfig)
			{
				if(key > newKey)
					newKey = key;
			}

			newKey++;

			readingShortcutPagesConfig[newKey] = {
				...storage.readingPagesConfig,
				key: newKey,
				readingConfigName: name,
			};

			storage.update('readingShortcutPagesConfig', readingShortcutPagesConfig);

			reading.setReadingShortcutPagesConfig(newKey, false);
		}
	}
	else
	{
		handlebarsContext.readingShortcutConfigName = '';

		events.dialog({
			header: language.dialog.pages.readingConfigNewHeader,
			width: 400,
			height: false,
			content: template.load('dialog.pages.reading.config.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.ok,
					function: 'events.closeDialog(); reading.newReadingShortcutPagesConfig(true);',
				}
			],
		});
	}
}

function removeReadingShortcutPagesConfig(key, confirm = false)
{
	if(confirm)
	{
		// Remove from shortcut config
		var readingShortcutPagesConfig = storage.get('readingShortcutPagesConfig');

		delete readingShortcutPagesConfig[key];

		storage.update('readingShortcutPagesConfig', readingShortcutPagesConfig);

		// Remove from comic config
		var readingPagesConfig = storage.get('readingPagesConfig');

		for(let path in readingPagesConfig)
		{
			if(readingPagesConfig[path].configKey && readingPagesConfig[path].configKey === key)
				delete readingPagesConfig[path];
		}

		storage.update('readingShortcutPagesConfig', readingShortcutPagesConfig);

		// Reload
		reading.loadReadingPages();
		reading.changePagesView(0);
	}
	else
	{
		handlebarsContext.readingShortcutConfigName = '';

		events.dialog({
			header: language.dialog.pages.readingConfigRemoveHeader,
			width: 400,
			height: false,
			content: language.dialog.pages.readingConfigRemove,
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.remove,
					function: 'events.closeDialog(); reading.removeReadingShortcutPagesConfig('+key+', true);',
				}
			],
		});
	}
}

// Load supported tracking sites and favorite tracking sites
function loadTrackigSites()
{
	handlebarsContext.trackingProblem = $('.bar-right-buttons .button-tracking-sites').hasClass('tracking-problem') ? true : false;
	handlebarsContext.trackingSites = trackingSites.list(true);
	handlebarsContext.favoriteTrackingSites = trackingSites.listFavorite(true);

	$('#tracking-sites .menu-simple').html(template.load('reading.elements.menus.tracking.sites.html'));
}

function trackingSiteToFavorite(site = '')
{
	var siteData = trackingSites.site(site);

	if(siteData)
	{
		if(siteData.config.favorite)
			siteData.config.favorite = false;
		else
			siteData.config.favorite = true;

		var configSites = storage.getKey('config', 'trackingSites');

		configSites[site] = siteData.config;

		storage.updateVar('config', 'trackingSites', configSites);

		loadTrackigSites()
	}
}

//Returns an image depending on the type (Image, folder, blank)
function eachImagesDistribution(index, contains, callback, first = false, notFound = false, onlyFirstMeet = false)
{
	var img = false;
	if(contains && contains.indexOf('image') !== -1)
		img = true;

	var folder = false;
	if(contains && contains.indexOf('folder') !== -1)
		folder = true;

	var blank = false;
	if(contains && contains.indexOf('blank') !== -1)
		blank = true;

	if(typeof imagesDistribution[index] !== 'undefined')
	{
		each:
		for(let key in imagesDistribution[index])
		{
			if(!contains || (img && !imagesDistribution[index][key].folder && !imagesDistribution[index][key].blank) || (folder && imagesDistribution[index][key].folder) || (blank && imagesDistribution[index][key].blank))	
			{
				callback(imagesDistribution[index][key]);

				if(onlyFirstMeet)
					break each;
			}

			if(first)
				break each;
		}
	}
	else if(notFound)
	{
		notFound();
	}
}

var touchTimeout, mouseOut = {lens: false, body: false}, touchStart = false, magnifyingGlassOffset = false, readingCurrentPath = false, readingCurrentBookmarks = undefined, zoomMoveData = {}, magnifyingGlassScroll = {scrollTop: false, time: 0};

//It starts with the reading of a comic, events, argar images, counting images ...
function read(path, index = 1, end = false)
{
	images = {}, imagesData = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = index, foldersPosition = {}, currentScale = 1;

	loadReadingConfig(currentReadingConfigKey);

	saveReadingProgressA = false;

	readingCurrentPath = path;

	if(typeof storage.get('bookmarks') !== 'undefined' && typeof storage.get('bookmarks')[dom.indexMainPathA()] !== 'undefined')
		readingCurrentBookmarks = storage.get('bookmarks')[dom.indexMainPathA()];
	else
		readingCurrentBookmarks = undefined;

	goToImageCL(index, false);

	$(window).off('keydown touchstart touchend mouseup mousemove touchmove mouseout click resize');
	template.contentRight().off('mousewheel');
	$('.reading-body, .reading-lens').off('mousemove');
	$('.reading-lens').off('mousemove');
	$('.reading-body').off('mouseout mouseenter mousedown touchstart touchmove');
	$('.content-right > div > div').off('scroll');

	events.eventHover();

	onReading = _onReading = true;

	template.contentRight().on('mousewheel', function(e) {

		if(onReading && (e.originalEvent.ctrlKey || !readingViewIs('scroll')))
		{
			e.preventDefault();

			if(e.originalEvent.wheelDelta / 120 > 0)
				reading.zoomIn();
			else
				reading.zoomOut();
		}

	});

	template.contentRight('.reading-lens').on('mousewheel', function(e) {

		if(onReading && !haveZoom && readingViewIs('scroll'))
		{
			e.preventDefault();

			var content = template.contentRight().children();

			if(Date.now() - magnifyingGlassScroll.time < 300)
				var scrollTop = magnifyingGlassScroll.scrollTop;
			else
				var scrollTop = content.scrollTop();

			if(e.originalEvent.wheelDelta / 120 > 0)
				scrollTop -= 62;
			else
				scrollTop += 62;

			magnifyingGlassScroll = {
				scrollTop: scrollTop,
				time: Date.now(),
			};

			content.stop(true).animate({scrollTop: scrollTop+'px'}, 200);
		}

	});

	$(window).on('keydown', function(e) {

		if(onReading)
		{
			if(e.keyCode == 37)
			{
				goPrevious();
			}
			else if(e.keyCode == 38 && !readingViewIs('scroll'))
			{
				goStart();
			}
			else if(e.keyCode == 39)
			{
				goNext();
			}
			else if(e.keyCode == 40 && !readingViewIs('scroll'))
			{
				goEnd();
			}
		}
		
	})

	$(window).on('touchstart', function(e) {

		if(onReading && config.readingMagnifyingGlass)
		{
			touchStart = e;

			magnifyingGlassOffset = template.contentRight('.reading-lens').offset();

			clearTimeout(touchTimeout);
			readingTouchEvent = true;
			touchTimeout = setTimeout('readingTouchEvent = false;', 500);
		}

	});

	template.contentRight(/*window*/'.reading-body, .reading-lens').on('mousemove', function(e) {

		var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
		var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

		currentPageXY = {
			x: x,
			y: y,
		};

		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			var readingBody = template.contentRight('.reading-body');

			var rbHeight = readingBody.height();
			var rbWidth = readingBody.width();
			var offset = readingBody.offset();
			var rbOffsetTop = offset.top;
			var rbOffsetLeft = offset.left;

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

	template.contentRight('.reading-body').on('mouseout', function(e) {

		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['body'] = true;

			if(mouseOut['lens'] == true) magnifyingGlassControl(0, e);
		}

	})

	template.contentRight('.reading-body').on('mouseenter', function(e) {

		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['body'] = false;
		}

	})

	$(window).on('mouseout', function(e) {

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

	template.contentRight('.reading-lens').on('mouseenter', function(e) {

		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['lens'] = false;
		}

	})

	template.contentRight('.reading-lens').on('touchmove', function(e) {

		let pageX = e.originalEvent.touches[0].pageX;
		let pageY = e.originalEvent.touches[0].pageY;

		let x = touchStart.originalEvent.touches[0].pageX;
		let y = touchStart.originalEvent.touches[0].pageY;

		currentPageXY = {
			x: pageX,
			y: pageY,
		};

		if(onReading && config.readingMagnifyingGlass && !haveZoom)
		{
			let readingLens = template.contentRight('.reading-lens');

			let xLess = x - (magnifyingGlassOffset.left + (readingLens.width() / 2));
			let yLess = y - (magnifyingGlassOffset.top + (readingLens.height() / 2));

			pageX = pageX - xLess;
			pageY = pageY - yLess;

			magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}});
		}

	});

	template.contentRight('.reading-body, .reading-lens').on('mousedown touchstart', function(e) {

		if(haveZoom)
		{
			e.preventDefault();

			zoomMoveData = {
				x: e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX),
				y: e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY),
				active: true,
			};

			$('body').addClass('dragging');
		}

	});

	$(window).on('mousemove touchmove', function(e) {

		if(haveZoom && zoomMoveData.active)
		{
			e.preventDefault();

			var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
			var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

			x = scalePrevData.tranX + (x - zoomMoveData.x);
			y = scalePrevData.tranY + (y - zoomMoveData.y);

			var maxX = originalRect.width * 0.5 * scalePrevData.scale - originalRect.width * 0.5;
			var minX = originalRect.width * -0.5 * scalePrevData.scale - originalRect.width * -0.5;

			var maxDiff = readingViewIs('scroll') ? ((originalRect.top + originalRect.height) - (originalRectReadingBody.top + originalRectReadingBody.height)) : 0;
			var minDiff = readingViewIs('scroll') ? (originalRect.top - originalRectReadingBody.top) : 0;

			var maxY = (originalRect.height * 0.5 * scalePrevData.scale - originalRect.height * 0.5) - (minDiff < 0 ? minDiff : 0);
			var minY = (originalRect.height * -0.5 * scalePrevData.scale - originalRect.height * -0.5) - (maxDiff > 0 ? maxDiff + _config.readingMargin.top : 0);

			if(x > maxX)
				x = maxX;
			else if(x < minX)
				x = minX;

			if(y > maxY)
				y = maxY;
			else if(y < minY)
				y = minY;

			zoomMoveData.tranX = x;
			zoomMoveData.tranY = y;

			template.contentRight('.image-position'+currentZoomIndex).css({
				'transition': 'transform 0s, z-index 0s',
				'transform': 'translate('+(x)+'px, '+(y)+'px) scale('+scalePrevData.scale+')',
				'transform-origin': 'center center',
			});
		}

	});

	$(window).on('mouseup touchend', function(e) {

		if(haveZoom && zoomMoveData.active)
		{
			if(typeof zoomMoveData.tranX !== 'undefined')
			{
				scalePrevData.tranX = zoomMoveData.tranX;
				scalePrevData.tranY = zoomMoveData.tranY;
			}

			zoomMoveData.active = false;

			$('body').removeClass('dragging');
		}

	});

	$(window).on('click', function(e) {

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

	$(window).on('resize', function() {

		if(onReading)
		{
			disposeImages();
			calculateView();
			stayInLine();
		}

		previousContentHeight = template.contentRight().children('div').children('div').height();

	});

	$(window).on('mousewheel touchstart keydown', function(e) {

		if(e.type != 'keydown' || (e.type == 'keydown' && (e.keyCode == 38 || e.keyCode == 40)))
			disableOnScroll(2);

	});

	template.contentRight().children('div').on('scroll', function(e) {

		if(activeOnScroll && readingViewIs('scroll'))
		{
			previousScrollTop = $(this).scrollTop();
			let contentHeight = template.contentRight().children('div').height();
			let contentPosition = (previousScrollTop + (contentHeight / 2));

			let selIndex = false, selPosition = false;

			for(let key1 in imagesPosition)
			{
				for(let key2 in imagesPosition[key1])
				{
					if(!selIndex || Math.abs(contentPosition - imagesPosition[key1][key2]) < selPosition)
					{
						selIndex = key1;
						selPosition = Math.abs(contentPosition - imagesPosition[key1][key2]);
					}
				}
			}

			if(currentIndex != (parseInt(selIndex) + 1))
			{
				if(currentScale != 1)
					reading.resetZoom();

				var isBookmarkTrue = false;

				eachImagesDistribution(selIndex, ['image'], function(image){

					if(!isBookmarkTrue && images[image.index] && isBookmark(p.normalize(images[image.index].path)))
						isBookmarkTrue = true;

				});

				var imageIndex = false;

				eachImagesDistribution(selIndex, ['image', 'folder'], function(image){

					if(!imageIndex)
						imageIndex = image.index

				});

				if(imageIndex)
				{
					saveReadingProgressA = true;

					goToImageCL(imageIndex, true);
				}

				currentIndex = parseInt(selIndex) + 1;
			}
		}

	});

	imagesNum = template.contentRight('.reading-body img').length;
	contentNum = template.contentRight('.reading-body .r-img:not(.blank)').length;

	template.contentRight('.reading-body img').each(function() {

		var index = parseInt($(this).attr('index'));

		images[index] = new Image();
		images[index].index = index;
		images[index].onload = function() {

			imagesData[this.index] = {width: this.width, height: this.height, aspectRatio: (this.width / this.height)};

			imagesNumLoad++;

			if(imagesNumLoad == imagesNum)
			{
				template.contentRight('.reading-body').css('display', 'block');
				addHtmlImages();
				disposeImages();
				calculateView();

				currentIndex = imagesData[currentIndex].position + 1;

				var newIndex = currentIndex;

				if(_config.readingManga && !readingViewIs('scroll'))
					newIndex = (indexNum - newIndex) + 1;

				goToIndex(newIndex, false, end, end);

				if(readingViewIs('scroll'))
					previousContentHeight = template.contentRight().children('div').children('div').height();
			}

		}
		images[index].onerror = function() {

			imagesData[this.index] = {width: 0, height: 0, aspectRatio: 0};

			imagesNumLoad++;

			if(imagesNumLoad == imagesNum)
			{
				template.contentRight('.reading-body').css('display', 'block');
				addHtmlImages();
				disposeImages();
				calculateView();

				currentIndex = imagesData[currentIndex].position + 1;

				var newIndex = currentIndex;

				if(_config.readingManga && !readingViewIs('scroll'))
					newIndex = (indexNum - newIndex) + 1;

				goToIndex(newIndex, false, end, end);

				if(readingViewIs('scroll'))
					previousContentHeight = template.contentRight().children('div').children('div').height();
			}

		}
		images[index].src = $(this).attr('src');
		images[index].path = $(this).attr('path');
		imagesPath[$(this).attr('path')] = index;


	});
	
	tracking.track();
}

module.exports = {
	read: read,
	images: function(){return images},
	imagesNum: imagesNum,
	contentNum: function(){return contentNum},
	imagesNumLoad: imagesNumLoad,
	imagesData: function(){return imagesData},
	goToImage: goToImage,
	goToFolder: goToFolder,
	goToIndex: function(v1, v2, v3, v4){readingDirection = true; goToIndex(v1, v2, v3, v4)},
	goStart: goStart,
	goPrevious: goPrevious,
	goNext: goNext,
	goEnd: goEnd,
	leftClick: leftClick,
	rightClick: rightClick,
	zoomIn: zoomIn,
	zoomOut: zoomOut,
	resetZoom: resetZoom,
	activeMagnifyingGlass: activeMagnifyingGlass,
	changeMagnifyingGlass: changeMagnifyingGlass,
	changePagesView: changePagesView,
	magnifyingGlassControl: magnifyingGlassControl,
	disposeImages: disposeImages,
	calculateView: calculateView,
	stayInLine: stayInLine,
	setCurrentComics: setCurrentComics,
	currentComics: function(){return currentComics},
	disableOnScroll: disableOnScroll,
	saveReadingProgress: saveReadingProgress,
	saveReadingProgressA: function(){return saveReadingProgressA},
	createAndDeleteBookmark: createAndDeleteBookmark,
	currentIndex: function(){return currentIndex},
	loadBookmarks: loadBookmarks,
	loadTrackigSites: loadTrackigSites,
	loadReadingPages: loadReadingPages,
	trackingSiteToFavorite: trackingSiteToFavorite,
	setReadingShortcutPagesConfig: setReadingShortcutPagesConfig,
	editReadingShortcutPagesConfig: editReadingShortcutPagesConfig,
	editReadingShortcutPagesConfigName: editReadingShortcutPagesConfigName,
	newReadingShortcutPagesConfig: newReadingShortcutPagesConfig,
	removeReadingShortcutPagesConfig: removeReadingShortcutPagesConfig,
	currentReadingConfigKey: function(){return currentReadingConfigKey},
	onReading: function(){return onReading},
	calculateImagesDistribution: calculateImagesDistribution,
	imagesDistribution: function(){return imagesDistribution},
	applyMangaReading: applyMangaReading,
	haveZoom: function(){return haveZoom},
	imagesPosition: function(){return imagesPosition},
	readingCurrentPath: function () {return readingCurrentPath},
};