
var images = {}, imagesData = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = 1, imagesPosition = {}, foldersPosition = {}, indexNum = 0, imagesDistribution = [];

//Calculates whether to add a blank image (If the reading is in double page and do not apply to the horizontals)
function blankPage(index)
{
	var key = 0;

	if(config.readingDoublePage && config.readingDoNotApplyToHorizontals)
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

	if(config.readingDoublePage)
	{
		var data = [];

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
				}
				else
				{
					if(config.readingDoNotApplyToHorizontals && data.length == 0 && blankPage(i))
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

	if(config.readingManga)
	{
		if(config.readingView != 'scroll')
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
			first.aspectRatio = imagesData[second.index].folder ? 1 : imagesData[second.index].aspectRatio;
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
	if(data && typeof data.margin !== 'undefined')
		var margin = data.margin;
	else
		var margin = config.readingMargin.margin;

	var contentHeight = template.contentRight().children('div').height();

	if(config.readingView == 'scroll')
		var contentWidth = template.contentRight('.reading-body').width();
	else
		var contentWidth = template.contentRight().width();

	//Width 0
	var contentWidth0 = contentWidth - (margin * 2);
	var aspectRatio0 = contentWidth0 / (contentHeight - margin * 2);
	
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

			var imageHeight = imageHeight0 = imageHeight1 = (contentHeight - margin * 2);

			imageWidth0 = imageHeight0 * first.aspectRatio;
			imageWidth1 = imageHeight1 * second.aspectRatio;

			var joinWidth = imageWidth0 + imageWidth1 + margin;

			if(joinWidth < contentWidth0 && !(config.readingView == 'scroll' && config.readingViewAdjustToWidth))
			{
				marginLeft0 = contentWidth / 2 - (imageWidth0 + imageWidth1 + margin) / 2;
				marginLeft1 = margin;
				marginTop0 = marginTop1 = margin;
			}
			else
			{
				imageWidth0 = (first.aspectRatio / (first.aspectRatio + second.aspectRatio)) * (contentWidth0 - margin);
				imageWidth1 = (second.aspectRatio / (second.aspectRatio + first.aspectRatio)) * (contentWidth0 - margin);

				var imageHeight = imageHeight0 = imageHeight1 = imageWidth0 / first.aspectRatio;

				marginLeft0 = marginLeft1 = margin;
				marginTop0 = marginTop1 = contentHeight / 2 - imageHeight / 2;
			}

			if(config.readingView == 'scroll')
				marginTop0 = marginTop1 = margin;

			template.contentRight('.image-position'+key1+'-0 img, .image-position'+key1+'-0 > div').css({
				'height': imageHeight0+'px',
				'width': imageWidth0+'px',
				'margin-left': marginLeft0+'px',
				'margin-top': marginTop0+'px',
				'margin-bottom': ((config.readingView == 'scroll' && ((+key1) + 1) == indexNum) ? margin : 0)+'px',
				'margin-right': '0px',
			});

			template.contentRight('.image-position'+key1+'-1 img, .image-position'+key1+'-1 > div').css({
				'height': imageHeight1+'px',
				'width': imageWidth1+'px',
				'margin-left': marginLeft1+'px',
				'margin-top': marginTop1+'px',
				'margin-bottom': ((config.readingView == 'scroll' && ((+key1) + 1) == indexNum) ? margin : 0)+'px',
				'margin-right': '0px',
			});
		}
		else
		{
			if(aspectRatio0 > first.aspectRatio && !(config.readingView == 'scroll' && config.readingViewAdjustToWidth))
			{
				var imageHeight = (contentHeight - margin * 2);
				var imageWidth = imageHeight * first.aspectRatio;
				var marginLeft = contentWidth / 2 - imageWidth / 2;
				var marginTop = margin;
			}
			else
			{
				var imageWidth = (contentWidth - margin * 2);
				var imageHeight = imageWidth / first.aspectRatio;
				var marginLeft = margin;
				var marginTop = contentHeight / 2 - imageHeight / 2;
			}

			if(config.readingView == 'scroll')
				marginTop = margin;

			template.contentRight('.image-position'+key1+'-0 img, .image-position'+key1+'-0 > div').css({
				'height': imageHeight+'px',
				'width': imageWidth+'px',
				'margin-left': marginLeft+'px',
				'margin-top': marginTop+'px',
				'margin-bottom': ((config.readingView == 'scroll' && ((+key1) + 1) == indexNum) ? margin : 0)+'px',
				'margin-right': '0px',
			});
		}

		template.contentRight('.image-position'+key1).css({
			'width': contentWidth+'px',
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
			'width': (contentWidth * indexNum)+'px',
			'height': content.height(),
		});
	}
	else if(config.readingView == 'scroll')
	{
		template.contentRight('.reading-body > div').css({
			'width': '100%',
		});

		template.contentRight('.reading-lens > div > div').css({
			'width': ($('.content-right').width())+'px',
		});
	}

	if(config.readingView == 'scroll')
	{
		imagesPosition = [];

		for(var key1 in imagesDistribution)
		{
			if(typeof imagesPosition[key1] === 'undefined') imagesPosition[key1] = [];

			for(var key2 in imagesDistribution[key1])
			{
				var image = template.contentRight('.image-position'+key1+'-'+key2);

				imagesPosition[key1][key2] = image.position().top + (image.height() / 2);
			}
		}
	}
}

var previousScrollTop = 0, previousContentHeight = 0;

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

//Go to a specific comic image
function goToImage(imageIndex, bookmarks = false)
{
	if(typeof imagesData[imageIndex] !== 'undefined')
	{
		if(!bookmarks)
			saveReadingProgressA = true;

		readingDirection = true;

		var newIndex = imagesData[imageIndex].position + 1;

		if(config.readingManga && config.readingView != 'scroll')
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

		if(config.readingManga && config.readingView != 'scroll')
			newIndex = (indexNum - newIndex) + 1;

		goToIndex(newIndex);
		goToImageCL(folderIndex, true)
	}
}

//Returns the highest image
function returnLargerImage(index)
{
	if(config.readingDoublePage)
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

	var animationDurationS = ((animation) ? config.readingViewSpeed : 0);
	var animationDurationMS = animationDurationS * 1000;

	var content = template.contentRight().children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	var updateCurrentIndex = true;

	var eIndex = index;

	var pageVisibilityIndex = 0;

	var imgHeight = false;

	if(((nextPrevious && currentPageStart) || !nextPrevious || end) && (config.readingView == 'scroll' && config.readingViewAdjustToWidth))
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
	else if(nextPrevious && !currentPageStart && (config.readingView == 'scroll' && config.readingViewAdjustToWidth))
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
		var image = returnLargerImage(eIndex-1);

		var scrollTop = (image.offset().top - content.offset().top) + content.scrollTop();

		var scrollSum = 0;

		if((config.readingView == 'scroll' && config.readingViewAdjustToWidth) && pageVisibilityIndex !== false)
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

	var newIndex = (eIndex - 1);

	if(config.readingManga && config.readingView != 'scroll')
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
	else if(nextIndex <= indexNum || ((config.readingView == 'scroll' && config.readingViewAdjustToWidth) && currentPageVisibility < maxPageVisibility))
		goToIndex(nextIndex, true, true);
	else if(currentIndex == indexNum && dom.nextComic() && (!config.readingManga || config.readingView == 'scroll'))
		showNextComic(1, true);
	else if(currentIndex == indexNum && dom.previousComic() && config.readingManga && config.readingView != 'scroll')
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
	else if(previousIndex > 0 || ((config.readingView == 'scroll' && config.readingViewAdjustToWidth) && currentPageVisibility > 0))
		goToIndex(previousIndex, true, true)
	else if(previousIndex == 0 && dom.previousComic() && (!config.readingManga || config.readingView == 'scroll'))
		showPreviousComic(1, true);
	else if(previousIndex == 0 && dom.nextComic() && config.readingManga && config.readingView != 'scroll')
		showPreviousComic(1, true, true);
}

//Go to the start of the comic
function goStart(force = false)
{
	if(force || !config.readingManga || config.readingView == 'scroll')
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
	if(force || !config.readingManga || config.readingView == 'scroll')
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
		var transition = config.readingViewSpeed < config.readingDelayComicSkip ? config.readingViewSpeed : config.readingDelayComicSkip;

		if(config.readingDelayComicSkip != 0)
		{
			if(config.readingView == 'slide')
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
			else if(config.readingView == 'scroll')
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

			skip.find('circle').css('animation-duration', config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true);', config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'");', config.readingDelayComicSkip * 1000);

		currentIndex = indexNum + 1;
	}
	else
	{
		if(config.readingView == 'slide')
		{
			var skip = template.contentRight('.reading-skip-right').css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(-'+(contentWidth * (indexNum - 1))+'px, 0px)',
			});
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-bottom').css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
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

		var transition = config.readingViewSpeed < config.readingDelayComicSkip ? config.readingViewSpeed : config.readingDelayComicSkip;

		if(config.readingDelayComicSkip != 0)
		{
			if(config.readingView == 'slide')
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
			else if(config.readingView == 'scroll')
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

			skip.find('circle').css('animation-duration', config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'");', config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true);', config.readingDelayComicSkip * 1000);

		currentIndex = 0;
	}
	else
	{
		if(config.readingView == 'slide')
		{
			var skip = template.contentRight('.reading-skip-left');

			skip.css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-top');

			skip.css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}

		currentIndex = 1;
	}
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

var activeOnScroll = true;

function disableOnScroll(mode)
{
	if(mode == 1)
		activeOnScroll = false;
	else
		activeOnScroll = true;
}

//Controls the page view
function changePagesView(mode, value, save)
{
	var imageIndex = false;

	var newIndex = (currentIndex - 1);

	if(config.readingManga && config.readingView != 'scroll')
		newIndex = (indexNum - newIndex) - 1;

	eachImagesDistribution(newIndex, ['image'], function(image){

		if(!imageIndex)
			imageIndex = image.index;

	});

	if(!imageIndex) imageIndex = currentIndex;

	if(mode == 1) // Set the scroll mode
	{
		storage.updateVar('config', 'readingView', value);

		dom.selectElement('.pages-'+value);	

		if(value == 'slide' && config.readingViewAdjustToWidth)
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

		if(save) storage.updateVar('config', 'readingMargin', {margin: value, top: value, bottom: value, left: value, right: value});
	}
	else if(mode == 3) // Set width adjustment
	{
		storage.updateVar('config', 'readingViewAdjustToWidth', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 4) // Set the speed of the animation when changing pages
	{
		if(save) storage.updateVar('config', 'readingViewSpeed', value);
	}
	else if(mode == 5) // Set the delay when skip from comic
	{
		if(save) storage.updateVar('config', 'readingDelayComicSkip', value);
	}
	else if(mode == 6) // Set the reading to double page
	{
		if(value == 1)
			$('.reading-do-not-apply-to-horizontals').removeClass('disable-pointer');
		else
			$('.reading-do-not-apply-to-horizontals').addClass('disable-pointer');

		storage.updateVar('config', 'readingDoublePage', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 7) // Disables double-page reading in horizontal images
	{
		storage.updateVar('config', 'readingDoNotApplyToHorizontals', value);

		template.loadContentRight('reading.content.right.html', true);
		addHtmlImages();

		read(readingCurrentPath, imageIndex);
	}
	else if(mode == 8) // Manga reading, invert the direction and double pages
	{
		storage.updateVar('config', 'readingManga', value);

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

		if(config.readingManga && config.readingView != 'scroll')
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

				addImageToDom(data.sha, data.path);

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

			addImageToDom(data.sha, data.path);

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

var touchTimeout, mouseOut = {lens: false, body: false}, touchStart = false, magnifyingGlassOffset = false, readingCurrentPath = false, readingCurrentBookmarks = undefined;

//It starts with the reading of a comic, events, argar images, counting images ...
function read(path, index = 1, end = false)
{
	images = {}, imagesData = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = index, foldersPosition = {};

	saveReadingProgressA = false;

	readingCurrentPath = path;

	if(typeof storage.get('bookmarks') !== 'undefined' && typeof storage.get('bookmarks')[dom.indexMainPathA()] !== 'undefined')
		readingCurrentBookmarks = storage.get('bookmarks')[dom.indexMainPathA()];
	else
		readingCurrentBookmarks = undefined;

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

				if(config.readingManga && config.readingView != 'scroll')
					newIndex = (indexNum - newIndex) + 1;

				goToIndex(newIndex, false, end, end);

				if(config.readingView == 'scroll')
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

				if(config.readingManga && config.readingView != 'scroll')
					newIndex = (indexNum - newIndex) + 1;

				goToIndex(newIndex, false, end, end);

				if(config.readingView == 'scroll')
					previousContentHeight = template.contentRight().children('div').children('div').height();
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
	onReading: function(){return onReading},
	calculateImagesDistribution: calculateImagesDistribution,
	imagesDistribution: function(){return imagesDistribution},
	applyMangaReading: applyMangaReading,
};