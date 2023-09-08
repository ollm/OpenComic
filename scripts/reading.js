const readingRender = require(p.join(appDir, 'scripts/reading/render.js'));

var images = {}, imagesData = {}, imagesDataClip = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = 1, imagesPosition = {}, imagesFullPosition = {}, foldersPosition = {}, indexNum = 0, imagesDistribution = [], currentPageXY = {x: 0, y: 0};

//Calculates whether to add a blank image (If the reading is in double page and do not apply to the horizontals)
function blankPage(index)
{
	var key = 0;

	if(_config.readingDoublePage && !_config.readingWebtoon && _config.readingDoNotApplyToHorizontals)
	{
		for(let i = index; i < (imagesNum + 1); i++)
		{
			if(typeof imagesDataClip[i] !== 'undefined')
			{
				if(imagesDataClip[i].aspectRatio > 1)
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

function calculateImagesDataWithClip()
{
	imagesDataClip = {};

	let imageClip = _config.readingImageClip;
	let clipVertical = (imageClip.top + imageClip.bottom) / 100;
	let clipHorizontal = (imageClip.left + imageClip.right) / 100;

	if(clipVertical === 0 && clipHorizontal === 0)
		return imagesDataClip = imagesData;

	for(let i = 1; i < (contentNum + 1); i++)
	{
		if(typeof imagesData[i] !== 'undefined')
		{
			let width = Math.round(imagesData[i].width * (1 - clipHorizontal));
			let height = Math.round(imagesData[i].height * (1 - clipVertical));

			imagesDataClip[i] = {
				width: width,
				height: height,
				aspectRatio: (width / height),
			};
		}
	}

	return imagesDataClip;
}

//Calculates the distribution of the images depending on the user's configuration
function calculateImagesDistribution()
{
	imagesDistribution = [];
	indexNum = 0;

	if(_config.readingDoublePage && !_config.readingWebtoon)
	{
		var data = [];

		if(_config.readingBlankPage && (!_config.readingDoNotApplyToHorizontals || (typeof imagesDataClip[1] !== 'undefined' && imagesDataClip[1].aspectRatio <= 1)))
			data.push({index: false, folder: false, blank: true, width: 2});

		for(let i = 1; i < (contentNum + 1); i++)
		{
			if(typeof imagesDataClip[i] !== 'undefined')
			{
				if(_config.readingDoNotApplyToHorizontals && imagesDataClip[i].aspectRatio > 1)
				{
					if(data.length > 0)
					{
						data.push({index: false, folder: false, blank: true, width: 2});
						imagesDistribution.push(data);
						data = [];
						indexNum++;
					}

					data.push({index: i, folder: false, blank: false, width: 1});
					imagesDataClip[i].position = imagesData[i].position = indexNum;
					imagesDistribution.push(data);
					indexNum++;
					data = [];
				}
				else
				{
					if(_config.readingDoNotApplyToHorizontals && data.length == 0 && blankPage(i))
						data.push({index: false, folder: false, blank: true, width: 2});

					data.push({index: i, folder: false, blank: false, width: 2});
					imagesDataClip[i].position = imagesData[i].position = indexNum;
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
			if(typeof imagesDataClip[i] !== 'undefined')
			{
				imagesDistribution.push([{index: i, folder: false, blank: false, width: 1}]);
				imagesDataClip[i].position = imagesData[i].position = indexNum;
				indexNum++;
			}
			else
			{
				imagesDistribution.push([{index: i, folder: true, blank: false, width: 1}]);
				foldersPosition[i] = indexNum;
				indexNum++;
			}
		}
	}

	if(_config.invisibleFirstBlankPage)
	{
		if(imagesDistribution[0])
		{
			for(let key2 in imagesDistribution[0])
			{
				if(imagesDistribution[0][key2].blank)
					imagesDistribution[0].splice(key2, 1);
			}		
		}
	}
	else if(_config.invisibleBlankPages)
	{
		for(let key in imagesDistribution)
		{
			for(let key2 in imagesDistribution[key])
			{
				if(imagesDistribution[key][key2].blank)
					imagesDistribution[key].splice(key2, 1);
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
	calculateImagesDataWithClip();
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
				image.name = currentComics[image.index].name;
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

			if(readingIsCanvas)
				image.canvas = true;

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
			first.aspectRatio = second.folder ? 1 : imagesDataClip[second.index].aspectRatio;
		else
			first.aspectRatio = imagesDataClip[first.index].aspectRatio;
	}
	else
	{
		if(first.folder)
			first.aspectRatio = 1;
		else
			first.aspectRatio = imagesDataClip[first.index].aspectRatio;
	}

	return first;
}

function disposeImages(data = false)
{
	var margin = (data && typeof data.margin !== 'undefined') ? data.margin : _config.readingMargin.margin;
	var marginHorizontal = (data && typeof data.left !== 'undefined') ? data.left : _config.readingMargin.left;
	var marginVertical = (data && typeof data.top !== 'undefined') ? data.top : _config.readingMargin.top;
	var marginHorizontalsHorizontal = (data && typeof data.horizontalsLeft !== 'undefined') ? data.horizontalsLeft : _config.readingHorizontalsMargin.left;
	//var marginHorizontalsVertical = (data && typeof data.horizontalsTop !== 'undefined') ? data.horizontalsTop : _config.readingHorizontalsMargin.top;

	var contentHeight = template.contentRight().children('div').height();

	if(readingViewIs('scroll'))
		var contentWidth = template.contentRight('.reading-body').width();
	else
		var contentWidth = template.contentRight().width();

	//Width 0
	var contentWidth0 = contentWidth - (marginHorizontal * 2);
	var aspectRatio0 = contentWidth0 / (contentHeight - marginVertical * 2);

	//Width horizontals 0
	var contentWidthHorizontals0 = contentWidth - (marginHorizontalsHorizontal * 2);
	var aspectRatioHorizontals0 = contentWidthHorizontals0 / (contentHeight - marginVertical * 2);

	var _imagesDistribution = applyMangaReading(imagesDistribution);

	let imageClip = _config.readingImageClip;

	let clipTop = imageClip.top / 100;
	let clipBottom = imageClip.bottom / 100;
	let clipVertical = clipTop + clipBottom;
	let clipLeft = imageClip.left / 100;
	let clipRight = imageClip.right / 100;
	let clipHorizontal = clipLeft + clipRight;

	let allImages = template.contentRight('.r-img').get();

	let imageElements = {};

	for(let i = 0, len = allImages.length; i < len; i++)
	{
		let image = allImages[i];

		let key1 = +image.dataset.key1;
		let key2 = +image.dataset.key2;

		if(!imageElements[key1]) imageElements[key1] = {};
		if(!imageElements[key1][key2]) imageElements[key1][key2] = [];

		imageElements[key1][key2].push(image.firstElementChild);
	}

	for(let key1 in _imagesDistribution)
	{
		if(!imageElements[key1])
			continue;

		let image0 = imageElements[key1][0] || false;
		let image1 = imageElements[key1][1] || false;

		let first = _imagesDistribution[key1][0];
		let second = _imagesDistribution[key1][1];

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

			let imgHeight0 = (clipVertical > 0 ? (imageHeight0 / (1 - clipVertical)) : imageHeight0);
			let imgWidth0 = (clipHorizontal > 0 ? (imageWidth0 / (1 - clipHorizontal)) : imageWidth0);

			if(image0)
			{
				for(let i = 0, len = image0.length; i < len; i++)
				{
					let image = image0[i];

					image.style.height = imageHeight0+'px';
					image.style.width = imageWidth0+'px';
					image.style.marginLeft = marginLeft0+'px';
					image.style.marginTop = marginTop0+'px';
					image.style.marginBottom = ((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px';
					image.style.marginRight = '0px';

					image.dataset.height = imgHeight0;
					image.dataset.width = imgWidth0;

					let img = image.firstElementChild;

					if(img)
					{
						img.style.marginTop = -(imgHeight0 * clipTop)+'px';
						img.style.marginLeft = -(imgWidth0 * clipLeft)+'px';

						//if(img.tagName == 'IMG')
						//{
							img.style.height = imgHeight0+'px';
							img.style.width = imgWidth0+'px';
						//}
					}
				}
			}

			let imgHeight1 = (clipVertical > 0 ? (imageHeight1 / (1 - clipVertical)) : imageHeight1);
			let imgWidth1 = (clipHorizontal > 0 ? (imageWidth1 / (1 - clipHorizontal)) : imageWidth1);

			if(image1)
			{
				for(let i = 0, len = image1.length; i < len; i++)
				{
					let image = image1[i];

					image.style.height = imageHeight1+'px';
					image.style.width = imageWidth1+'px';
					image.style.marginLeft = marginLeft1+'px';
					image.style.marginTop = marginTop1+'px';
					image.style.marginBottom = ((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px';
					image.style.marginRight = '0px';

					image.dataset.height = imgHeight1;
					image.dataset.width = imgWidth1;

					let img = image.firstElementChild;

					if(img)
					{
						img.style.marginTop = -(imgHeight1 * clipTop)+'px';
						img.style.marginLeft = -(imgWidth1 * clipLeft)+'px';

						//if(img.tagName == 'IMG')
						//{
							img.style.height = imgHeight1+'px';
							img.style.width = imgWidth1+'px';
						//}
					}
				}
			}
		}
		else
		{
			if(_config.readingHorizontalsMarginActive && first.aspectRatio > 1)
			{
				if(aspectRatioHorizontals0 > first.aspectRatio && !(readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
				{
					var imageHeight = (contentHeight - marginVertical * 2);
					var imageWidth = imageHeight * first.aspectRatio;
					var marginLeft = contentWidth / 2 - imageWidth / 2;
					var marginTop = marginVertical;
				}
				else
				{
					var imageWidth = (contentWidth - marginHorizontalsHorizontal * 2);
					var imageHeight = imageWidth / first.aspectRatio;
					var marginLeft = marginHorizontalsHorizontal;
					var marginTop = contentHeight / 2 - imageHeight / 2;
				}
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
			}

			if(readingViewIs('scroll'))
				marginTop = marginVertical;

			let imgHeight = (clipVertical > 0 ? (imageHeight / (1 - clipVertical)) : imageHeight);
			let imgWidth = (clipHorizontal > 0 ? (imageWidth / (1 - clipHorizontal)) : imageWidth);

			if(image0)
			{
				for(let i = 0, len = image0.length; i < len; i++)
				{
					let image = image0[i];

					image.style.height = imageHeight+'px';
					image.style.width = imageWidth+'px';
					image.style.marginLeft = marginLeft+'px';
					image.style.marginTop = marginTop+'px';
					image.style.marginBottom = ((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px';
					image.style.marginRight = '0px';

					image.dataset.height = imgHeight;
					image.dataset.width = imgWidth;

					let img = image.firstElementChild;

					if(img)
					{
						img.style.marginTop = -(imgHeight * clipTop)+'px';
						img.style.marginLeft = -(imgWidth * clipLeft)+'px';

						//if(img.tagName == 'IMG')
						//{
							img.style.height = imgHeight+'px';
							img.style.width = imgWidth+'px';
						//}
					}
				}
			}
		}
	}

	let rFlex = template.contentRight('.r-flex').get();

	for(let i = 0, len = rFlex.length; i < len; i++)
	{
		rFlex[i].style.width = contentWidth+'px';
		rFlex[i].style.height = !readingViewIs('scroll') ? contentHeight+'px' : '';
	}
}

var rightSize = {}; // Right content size

function calculateView()
{
	let contentRight = template.contentRight().get(0);

	let content = contentRight.firstElementChild;
	let rect = content.getBoundingClientRect();

	rightSize = {
		height: rect.height,
		width: rect.width,
		top: rect.top,
		left: rect.left,
		// readingRect: content.querySelector('.reading-body').getBoundingClientRect(),
		scrollHeight: content.scrollHeight,
	};

	if(readingViewIs('slide'))
	{
		dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).css({
			width: (rect.width * indexNum)+'px',
			height: rect.height,
			flexDirection: '',
		});
	}
	else if(readingViewIs('scroll'))
	{
		dom.this(contentRight).find('.reading-body > div').css({
			width: '100%',
			flexDirection: 'column',
		});

		dom.this(contentRight).find('.reading-lens > div > div').css({
			width: rect.width+'px',
			flexDirection: 'column',
		});
	}

	if(readingViewIs('scroll'))
	{
		imagesPosition = [];
		imagesFullPosition = [];

		let scrollTop = content.scrollTop - rect.top;

		for(let key1 in imagesDistribution)
		{
			if(typeof imagesPosition[key1] === 'undefined') imagesPosition[key1] = [];
			if(typeof imagesFullPosition[key1] === 'undefined') imagesFullPosition[key1] = [];

			for(let key2 in imagesDistribution[key1])
			{
				let image = contentRight.querySelector('.image-position'+key1+'-'+key2);
				let top = 0, height = 0;

				if(image)
				{
					let rect = image.getBoundingClientRect();
					let scale = config.readingGlobalZoom ? scalePrevData.scale : 1;

					top = rect.top + (_config.readingMargin.top * scale);
					height = rect.height - (_config.readingMargin.top * scale);
				}

				imagesPosition[key1][key2] = (top + (height / 2)) + scrollTop;
				imagesFullPosition[key1][key2] = {
					top: top + scrollTop,
					center: imagesPosition[key1][key2],
					bottom: top + height + scrollTop,
				};
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
			goToIndex(currentIndex, false, currentPageVisibility);
	}
	else if(readingViewIs('scroll'))
	{
		if(currentIndex < 1)
			showPreviousComic(1, false);
		else if(currentIndex > contentNum)
			showNextComic(1, false);
		else
			goToIndex(currentIndex, false, currentPageVisibility);
	}
}

//Go to a specific comic image (Left menu)
function goToImageCL(index, animation = true)
{
	readingRender.focusIndex(index);

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

var currentPageVisibility = 0, maxPageVisibility = 0, currentPageStart = true, readingDirection = true, disableOnScrollST = false;

//Go to a specific comic index
function goToIndex(index, animation = true, nextPrevious = false, end = false)
{
	var animationDurationS = ((animation) ? _config.readingViewSpeed : 0);
	var animationDurationMS = animationDurationS * 1000;

	if(currentScale != 1 && animation && !(config.readingGlobalZoom && readingViewIs('scroll')))
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

		if(nextPrevious !== false && nextPrevious !== true) currentPageVisibility = nextPrevious;
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

		if(nextPrevious !== false && nextPrevious !== true) currentPageVisibility = nextPrevious;
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

			if(nextPrevious !== false && nextPrevious !== true) currentPageVisibility = nextPrevious;
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

		clearTimeout(disableOnScrollST);

		disableOnScroll(true);

		disableOnScrollST = setTimeout(function(){

			reading.disableOnScroll(false);

		}, animationDurationMS + 200); // Add 200 of margin to avoid errors

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

	eachImagesDistribution(newIndex, ['image', 'folder'], function(image){

		if(!isBookmarkTrue && images[image.index] && isBookmark(p.normalize(images[image.index].path)))
			isBookmarkTrue = true;

	});
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

function leftClick(event)
{
	if(event.target.classList.contains('folder') || event.target.closest('.folder')) return;

	let isTouch = (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) ? true : false;

	if(!reading.haveZoom() && (!readingDragScroll || !readingDragScroll.start) && (!isTouch || !config.readingMagnifyingGlass))
	{
		if(isTouch)
			reading.goNext();
		else
			reading.goPrevious();

		return true;
	}

	return false;
}

function rightClick(e)
{
	if(event.target.classList.contains('folder') || event.target.closest('.folder')) return;

	let isTouch = (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) ? true : false;

	if(!reading.haveZoom() && (!readingDragScroll || !readingDragScroll.start) && (!isTouch || !config.readingMagnifyingGlass))
	{
		if(isTouch)
			reading.goPrevious();
		else
			reading.goNext();

		return true;
	}

	return false;
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

				template.contentRight('.reading-body, .reading-lens > div').css({
					'transform-origin': 'center '+(template.contentRight('.reading-body').height() - contentHeight)+'px',
					'transition': 'transform '+((animation) ? transition : 0)+'s, background-color 0.2s, box-shadow 0.2s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});
			}

			skip.find('circle').css('animation-duration', _config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true, false, true);', _config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", false, false, true);', _config.readingDelayComicSkip * 1000);

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

			template.contentRight('.reading-body, .reading-lens > div').css({
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

				template.contentRight('.reading-body, .reading-lens > div').css({
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

				template.contentRight('.reading-body, .reading-lens > div').css({
					'transform-origin': 'center '+contentHeight+'px',
					'transition': 'transform '+((animation) ? transition : 0)+'s, background-color 0.2s, box-shadow 0.2s',
					'transition-property': 'transform',
					'transform': 'scale('+scale+')',
				});
			}

			skip.find('circle').css('animation-duration', _config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", false, false, true);', _config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true, false, true);', _config.readingDelayComicSkip * 1000);

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

			template.contentRight('.reading-body, .reading-lens > div').css({
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

			template.contentRight('.reading-body, .reading-lens > div').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(0px, 0px)',
			});
		}

		currentIndex = 1;
	}
}

var currentScale = 1, scalePrevData = {tranX: 0, tranX2: 0, tranY: 0, tranY2: 0, scale: 1, scrollTop: 0}, originalRect = false, originalRectReadingBody = false, haveZoom = false, currentZoomIndex = false, applyScaleST = false, zoomingIn = false, prevAnime = false;

function applyScaleScrollAndHeight()
{

}

function applyScale(animation = true, scale = 1, center = false, zoomOut = false, round = true)
{
	let animationDurationS = ((animation) ? _config.readingViewSpeed : 0);

	if(round) scale = Math.round(scale * 100) / 100;

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

	let scrollTop = 0, translateX = 0, translateY = 0;

	if(scale != scalePrevData.scale)
	{
		if(scale == 1)
			template.barHeader('.button-reset-zoom').attr('hover-text', language.menu.view.originalSize).html('aspect_ratio');
		else
			template.barHeader('.button-reset-zoom').attr('hover-text', language.menu.view.resetZoom).html('zoom_out_map');

		let content = template.contentRight().children();
		content.stop(true);

		if(config.readingGlobalZoom && readingViewIs('scroll'))
		{
			zoomingIn = true;
			disableOnScroll(true);

			if(originalRect === false)
			{
				originalRect = template.contentRight('.reading-body').get(0).getBoundingClientRect();
				originalRectReadingBody = template.contentRight().children().get(0).getBoundingClientRect();
			}

			scrollTop = content.scrollTop();

			let pageX = currentPageXY.x - originalRect.left;
			let pageY = currentPageXY.y + scrollTop - originalRectReadingBody.top;

			let addX = (0.5 - (pageX / originalRect.width)) * originalRect.width;
			let addY = (0.5 - (pageY / originalRect.height)) * originalRect.height;

			if(center)
			{
				addX = 0;
				addY = (originalRect.height / 2 - originalRectReadingBody.height / 2) - scrollTop;

				//if(addY > 0)
				//	addY = 0;
			}

			translateX = (scalePrevData.tranX / scalePrevData.scale * scale) + (addX / scalePrevData.scale * (scale - scalePrevData.scale));
			translateY = (scalePrevData.tranY / scalePrevData.scale * scale) + (addY / scalePrevData.scale * (scale - scalePrevData.scale));

			if(zoomOut)
				translateX = scalePrevData.tranX * (scale - 1) / (scalePrevData.scale - 1);

			if(scale <= 1)
			{
				translateX = 0;
				if(scale < 1) translateY = 0;
				haveZoom = false;
			}
			else
			{
				haveZoom = true;
			}

			template.contentRight('.reading-body > div').css({
				transition: 'transform '+animationDurationS+'s, z-index '+animationDurationS+'s',
				transform: 'translateX('+translateX+'px) translateY('+translateY+'px) scale('+scale+')',
				transformOrigin: 'center center',
				zIndex: 1,
				// willChange: scale == 1 ? '' : 'transform',
			});

			clearTimeout(applyScaleST);

			applyScaleST = setTimeout(function() {

				let scrollTop = content.scrollTop();

				let translateY = (originalRect.height * scale - originalRect.height) / 2;

				template.contentRight('.reading-body').css({
					height: (scale == 1 ? '' : (originalRect.height * scale)+'px'),
				});

				template.contentRight('.reading-body > div').css({
					transition: 'transform 0s, z-index 0s',
					transform: 'translateX('+scalePrevData.tranX+'px) translateY('+translateY+'px) scale('+scale+')',
				});

				content.scrollTop(scrollTop + (translateY - scalePrevData.tranY));

				scalePrevData.tranY = translateY;

				calculateView();
				disableOnScroll(false);
				zoomingIn = false;

				if(scale == 1)
				{
					originalRect = false;
					currentZoomIndex = false;
				}

			}, animationDurationS * 1000);
		}
		else
		{
			if(originalRect === false)
			{
				originalRect = template.contentRight('.image-position'+currentZoomIndex).get(0).getBoundingClientRect();
				originalRectReadingBody = template.contentRight().children().get(0).getBoundingClientRect();
			}

			if(!zoomOut)
			{
				let pageX = currentPageXY.x - originalRect.left;
				let pageY = currentPageXY.y - originalRect.top;

				let addX = (0.5 - (pageX / originalRect.width)) * originalRect.width;
				let addY = (0.5 - (pageY / originalRect.height)) * originalRect.height;

				if(center)
				{
					addX = 0;
					addY = 0;
				}

				translateX = (scalePrevData.tranX / scalePrevData.scale * scale) + (addX / scalePrevData.scale * (scale - scalePrevData.scale));
				translateY = (scalePrevData.tranY / scalePrevData.scale * scale) + (addY / scalePrevData.scale * (scale - scalePrevData.scale));
			}
			else
			{
				translateX = scalePrevData.tranX * (scale - 1) / (scalePrevData.scale - 1);
				translateY = scalePrevData.tranY * (scale - 1) / (scalePrevData.scale - 1);
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
				transition: 'transform '+animationDurationS+'s, z-index '+animationDurationS+'s',
				transform: 'translateX('+(translateX)+'px) translateY('+(translateY)+'px) scale('+scale+')',
				transformOrigin: 'center center',
				zIndex: scale == 1 ? 1 : 2,
				// willChange: scale == 1 ? '' : 'transform',
			});

			if(scale == 1)
			{
				originalRect = false;
				currentZoomIndex = false;
			}
		}

		scalePrevData = {
			tranX: translateX,
			tranX2: translateX,
			tranY: translateY,
			tranY2: translateY,
			scale: scale,
			scrollTop: scrollTop,
		};

		readingRender.setScale(scale, (config.readingGlobalZoom && readingViewIs('scroll')), _config.readingDoublePage);
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


// Reset zoom or show in original size if is current in 1 scale
function resetZoom(animation = true, index = false, apply = true, center = true)
{
	var animationDurationS = ((animation) ? _config.readingViewSpeed : 0);

	if(currentScale == 1) // Show current image in original size
	{
		let first = imagesDistribution[currentIndex - 1][0];

		if(!first.folder && !first.blank)
		{
			let image = imagesData[first.index] || [];
			let img = template._contentRight().querySelector('.r-img-i'+first.index+' oc-img img, .r-img-i'+first.index+' oc-img canvas');

			if(img)
			{
				if(zoomMoveData.active)
					return;

				let rect = img.getBoundingClientRect();

				currentScale = (image.width / rect.width + image.height / rect.height) / 2;

				if(apply)
					applyScale(animation, currentScale, center, (currentScale < 1) ? true : false, false);

				return;
			}
		}
	}

	currentScale = 1;

	if(apply)
	{
		if(config.readingGlobalZoom && readingViewIs('scroll'))
		{
			applyScale(animation, currentScale, true);
		}
		else
		{
			applyScale(animation, currentScale, true);

			originalRect = false;
			scalePrevData = {tranX: 0, tranX2: 0, tranY: 0, tranY2: 0, scale: 1, scrollTop: 0};
			haveZoom = false;
			zoomMoveData.active = false;
			currentZoomIndex = false;

			readingRender.setScale(1, (config.readingGlobalZoom && readingViewIs('scroll')), _config.readingDoublePage);
		}
	}
}

// Drag zoom
function dragZoom(x, y)
{
	x = scalePrevData.tranX2 + x;
	y = scalePrevData.tranY2 + y;

	let maxX = originalRect.width * 0.5 * scalePrevData.scale - originalRect.width * 0.5;
	let minX = originalRect.width * -0.5 * scalePrevData.scale - originalRect.width * -0.5;

	let maxDiff = readingViewIs('scroll') ? ((originalRect.top + originalRect.height) - (originalRectReadingBody.top + originalRectReadingBody.height)) : 0;
	let minDiff = readingViewIs('scroll') ? (originalRect.top - originalRectReadingBody.top) : 0;

	let maxY = (originalRect.height * 0.5 * scalePrevData.scale - originalRect.height * 0.5) - (minDiff < 0 ? minDiff : 0);
	let minY = (originalRect.height * -0.5 * scalePrevData.scale - originalRect.height * -0.5) - (maxDiff > 0 ? maxDiff + _config.readingMargin.top : 0);

	if(x > maxX)
		x = maxX;
	else if(x < minX)
		x = minX;

	if(y > maxY)
		y = maxY;
	else if(y < minY)
		y = minY;

	if(config.readingGlobalZoom && readingViewIs('scroll'))
	{
		scalePrevData.tranX = zoomMoveData.tranX = x;
		zoomMoveData.tranY = scalePrevData.tranY;

		template.contentRight('.reading-body > div').css({
			transition: 'transform 0s, z-index 0s',
			transform: 'translateX('+(x)+'px) translateY('+scalePrevData.tranY+'px) scale('+scalePrevData.scale+')',
			transformOrigin: 'center center',
		});
	}
	else
	{
		zoomMoveData.tranX = x;
		zoomMoveData.tranY = y;

		template.contentRight('.image-position'+currentZoomIndex).css({
			transition: 'transform 0s, z-index 0s',
			transform: 'translateX('+(x)+'px) translateY('+(y)+'px) scale('+scalePrevData.scale+')',
			transformOrigin: 'center center',
		});
	}
}

function dragZoomEnd()
{
	if(zoomMoveData.active)
	{
		if(typeof zoomMoveData.tranX !== 'undefined')
		{
			scalePrevData.tranX = scalePrevData.tranX2 = zoomMoveData.tranX;
			scalePrevData.tranY = scalePrevData.tranY2 = zoomMoveData.tranY;
		}

		zoomMoveData.active = false;
	}
}

//Turn the magnifying glass on and off
function activeMagnifyingGlass(active = null, gamepad = false)
{
	// Toggle magnifying glass
	if(active === null) active = !config.readingMagnifyingGlass;

	if(active)
	{
		storage.updateVar('config', 'readingMagnifyingGlass', true);
		readingRender.setMagnifyingGlassStatus(config.readingMagnifyingGlassZoom);
	
		if(gamepad)
		{
			let contentRight = template._contentRight();
			let rect = contentRight.getBoundingClientRect();

			let pageX = (rect.width / 2) + rect.left;
			let pageY = (rect.height / 2) + rect.top;

			magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}});
		}
	}
	else
	{
		storage.updateVar('config', 'readingMagnifyingGlass', false);
		magnifyingGlassControl(0);
		readingRender.setMagnifyingGlassStatus(false);
	}
}

//Magnifying glass settings
function changeMagnifyingGlass(mode, value, save)
{
	let contentRight = template._contentRight();
	let rect = contentRight.getBoundingClientRect();

	let pageX = (rect.width / 2) + rect.left;
	let pageY = (rect.height / 2) + rect.top;

	if(mode == 1) //Set the zoom
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {zoom: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassZoom', value);

		readingRender.setScaleMagnifyingGlass(value);
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

var magnifyingGlassView = false, magnifyingGlassPosition = {x: false, y: false};

//Magnifying glass control
function magnifyingGlassControl(mode, e = false, lensData = false)
{
	if(e)
	{
		var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX || !e.clientX ? e.pageX : e.clientX);
		var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY || !e.clientY ? e.pageY : e.clientY);
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

		magnifyingGlassPosition = {
			x: x,
			y: y,
		};
	}
	else
	{
		template.contentRight('.reading-lens').removeClass('a').addClass('d');
		magnifyingGlassView = false;
	}

	//calculateView();
}

function resizedWindow()
{
	if(onReading)
	{
		disposeImages();
		calculateView();
		stayInLine();

		readingRender.resized(_config.readingDoublePage);
	}

	previousContentHeight = template.contentRight().children('div').children('div').height();
}

var hiddenContentLeft = false, hiddenBarHeader = false, hideContentDisableTransitionsST = false, hideContentST = false, hideContentRunningST = false, shownContentLeft = false, shownBarHeader = false;

function hideContent(fullScreen = false, first = false)
{
	if(!onReading)
	{
		var _hideContentLeft = false;
		var _hideBarHeader = false;
	}
	else if(fullScreen)
	{
		var _hideContentLeft = config.readingHideContentLeftFullScreen;
		var _hideBarHeader = config.readingHideBarHeaderFullScreen;
	}
	else
	{
		var _hideContentLeft = config.readingHideContentLeft;
		var _hideBarHeader = config.readingHideBarHeader;
	}

	clearTimeout(hideContentDisableTransitionsST);

	$('.bar-header, .content-left').css('transition', '0s');

	hideContentDisableTransitionsST = setTimeout(function(){

		$('.bar-header, .content-left').css('transition', '');

	});

	var app = $('.app');

	if(_hideContentLeft)
	{
		app.addClass('hide-content-left');
		hiddenContentLeft = true;
	}
	else
	{
		app.removeClass('hide-content-left');
		$('.content-left').removeClass('show');
		hiddenContentLeft = false;
	}

	if(_hideBarHeader)
	{
		app.addClass('hide-bar-header');
		hiddenBarHeader = true;
	}
	else
	{
		app.removeClass('hide-bar-header');
		$('.bar-header').removeClass('show');
		hiddenBarHeader = false;
	}

	if(!first && onReading)
		resizedWindow();
}

function hideBarHeader(value = null)
{
	let isFullScreen = electronRemote.getCurrentWindow().isFullScreen();

	if(value === null) value = !(isFullScreen ? config.readingHideBarHeaderFullScreen : config.readingHideBarHeader);

	if(isFullScreen)
		storage.updateVar('config', 'readingHideBarHeaderFullScreen', value);
	else
		storage.updateVar('config', 'readingHideBarHeader', value);

	hideContent(isFullScreen);
}

function hideContentLeft(value = null)
{
	let isFullScreen = electronRemote.getCurrentWindow().isFullScreen();

	if(value === null) value = !(isFullScreen ? config.readingHideContentLeftFullScreen : config.readingHideContentLeft);

	if(isFullScreen)
		storage.updateVar('config', 'readingHideContentLeftFullScreen', value);
	else
		storage.updateVar('config', 'readingHideContentLeft', value);

	hideContent(isFullScreen);
}

function loadReadingMoreOptions()
{
	var isFullScreen = electronRemote.getCurrentWindow().isFullScreen();

	handlebarsContext.hideContent = {
		barHeader: isFullScreen ? config.readingHideBarHeaderFullScreen : config.readingHideBarHeader,
		contentLeft: isFullScreen ? config.readingHideContentLeftFullScreen : config.readingHideContentLeft,
	};

	$('#reading-more-options .menu-simple').html(template.load('reading.elements.menus.more.options.html'));

	events.events();
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

function disableOnScroll(disable = true)
{
	activeOnScroll = !disable;
}

function setReadingDragScroll(dragScroll)
{
	readingDragScroll = dragScroll;
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

		readingPagesConfig.configKey = false;
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

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
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

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
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

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
	}
	else if(mode == 4) // Set the speed of the animation when changing pages
	{
		if(save) updateReadingPagesConfig('readingViewSpeed', value);
	}
	else if(mode == 5) // Set the delay when skip from comic
	{
		if(save) updateReadingPagesConfig('readingDelayComicSkip', value);
	}
	else if(mode == 6) // Set the reading to double page
	{
		if(value)
			$('.reading-do-not-apply-to-horizontals, .reading-blank-page').removeClass('disable-pointer');
		else
			$('.reading-do-not-apply-to-horizontals, .reading-blank-page').addClass('disable-pointer');

		updateReadingPagesConfig('readingDoublePage', value);

		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
	}
	else if(mode == 7) // Disables double-page reading in horizontal images
	{
		updateReadingPagesConfig('readingDoNotApplyToHorizontals', value);

		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
	}
	else if(mode == 8) // Manga reading, invert the direction and double pages
	{
		updateReadingPagesConfig('readingManga', value);

		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
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

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
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

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
	}
	else if(mode == 13) // Set width adjustment
	{
		updateReadingPagesConfig('readingHorizontalsMarginActive', value);

		template.loadContentRight('reading.content.right.html', true);

		if(value)
			template.globalElement('.reading-horizontals-margin').removeClass('disable-pointer');
		else
			template.globalElement('.reading-horizontals-margin').addClass('disable-pointer');

		read(readingCurrentPath, imageIndex, false, readingIsCanvas);
	}
	else if(mode == 14) // Set horizontal margin of the horizontals pages
	{
		disposeImages({horizontalsLeft: value, horizontalsRight: value});
		stayInLine();

		if(save) updateReadingPagesConfig('readingHorizontalsMargin', {margin: _config.readingHorizontalsMargin.margin, top: _config.readingHorizontalsMargin.top, bottom: _config.readingHorizontalsMargin.bottom, left: value, right: value});
	}
	/*else if(mode == 15) // Set vertical margin of the horizontals pages
	{
		disposeImages({horizontalsTop: value, horizontalsBottom: value});
		stayInLine();

		if(save) updateReadingPagesConfig('readingHorizontalsMargin', {margin: _config.readingHorizontalsMargin.margin, top: value, bottom: value, left: _config.readingHorizontalsMargin.left, right: _config.readingHorizontalsMargin.right});
	}*/
	else if(mode == 16) // Clip horizontal images
	{
		updateReadingPagesConfig('readingImageClip', {top: _config.readingImageClip.top, bottom: _config.readingImageClip.bottom, left: value, right: value});

		addHtmlImages();
		disposeImages();
		calculateView();
		stayInLine();
	}
	else if(mode == 17) // Clip vertical images
	{
		updateReadingPagesConfig('readingImageClip', {top: value, bottom: value, left: _config.readingImageClip.left, right: _config.readingImageClip.right});

		addHtmlImages();
		disposeImages();
		calculateView();
		stayInLine();
	}
}

//Change the bookmark icon
function activeBookmark(mode)
{
	if(mode == 1)
	{
		template.barHeader('.button-bookmark').addClass('fill').attr('hover-text', language.reading.removeBookmark);
	}
	else
	{
		template.barHeader('.button-bookmark').removeClass('fill').attr('hover-text', language.reading.addBookmark);
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

		var newIndex = (currentIndex - 1);

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) - 1;

		eachImagesDistribution(newIndex, ['image'], function(image){

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

	dom.indexPathControlUpdateLastComic(path);

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
			let bookmark = readingCurrentBookmarks[key];

			let bookmarkDirname = p.dirname(bookmark.path);

			if(typeof bookmarksPath[bookmarkDirname] === 'undefined') bookmarksPath[bookmarkDirname] = [];

			let sha = sha1(bookmark.path);

			let thumbnail = cache.returnThumbnailsImages({path: bookmark.path, sha: sha}, function(data) {

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

	let readingProgress = storage.getKey('readingProgress', dom.indexMainPathA());

	if(readingProgress)
	{
		let bookmarkDirname = p.dirname(readingProgress.path);

		let sha = sha1(readingProgress.path);

		let thumbnail = cache.returnThumbnailsImages({path: readingProgress.path, sha: sha}, function(data){

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

var touchTimeout, mouseOut = {lens: false, body: false}, touchStart = false, magnifyingGlassOffset = false, readingCurrentPath = false, readingCurrentBookmarks = undefined, zoomMoveData = {}, magnifyingGlassScroll = {scrollTop: false, time: 0}, readingDragScroll = false, gamepadScroll = false, readingIsCanvas = false, readingFile = false, gamepadAxesNow = 0;

//It starts with the reading of a comic, events, argar images, counting images ...
async function read(path, index = 1, end = false, isCanvas = false)
{
	images = {}, imagesData = {}, imagesDataClip = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = index, foldersPosition = {}, currentScale = 1, previousScrollTop = 0, scalePrevData = {tranX: 0, tranX2: 0, tranY: 0, tranY2: 0, scale: 1, scrollTop: 0}, originalRect = false;

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

	template.contentRight('.reading-body, .reading-lens').on('pointerdown', function(e) {

		if(onReading && (!haveZoom || config.readingGlobalZoom) && readingViewIs('scroll'))
		{
			if(e.originalEvent.pointerType != 'touch')
			{
				// e.preventDefault();

				var content = template.contentRight().children();

				var pageY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

				readingDragScroll = {
					start: false,
					pageY: pageY,
					content: content,
					scrollTop: content.scrollTop(),
					speed: [{
						time: performance.now(),
						pageY: pageY,
					}],
				};

				content.stop(true);
			}
		}

	});

	gamepad.setAxesEvent('reading', function(axes, status, now) {

		if(onReading && !document.querySelector('.menu-simple.a'))
		{
			if(status == 'start')
				gamepadAxesNow = 0;

			if(haveZoom)
			{
				if(status == 'start')
				{
					zoomMoveData = {
						x: 0,
						y: 0,
						active: true,
					};
				}

				if(status == 'start' || status == 'move')
				{
					let x = 0;
					let y = 0;

					if(axes[0] || axes[1])
					{
						x = axes[0];
						y = axes[1];
					}
					else if(!config.readingMagnifyingGlass)
					{
						x = axes[2];
						y = axes[3];
					}

					let speed = gamepadAxesNow ? now - gamepadAxesNow : 16;

					x = zoomMoveData.x = zoomMoveData.x + -(x * speed);
					y = zoomMoveData.y = zoomMoveData.y + -(y * speed);

					dragZoom(x, y);
				}
				else // status == 'end'
				{
					dragZoomEnd();
				}
			}

			if(config.readingMagnifyingGlass)
			{
				if(axes[2] || axes[3])
				{
					let speed = gamepadAxesNow ? now - gamepadAxesNow : 16;

					if(magnifyingGlassPosition.x === false)
					{
						let contentRight = template._contentRight();
						let rect = contentRight.getBoundingClientRect();

						magnifyingGlassPosition.x = (rect.width / 2) + rect.left;
						magnifyingGlassPosition.y = (rect.height / 2) + rect.top;
					}

					let x = magnifyingGlassPosition.x + (axes[2] * speed / 2);
					let y = magnifyingGlassPosition.y + (axes[3] * speed / 2);

					reading.magnifyingGlassControl(1, {pageX: x, pageY: y, originalEvent: {touches: false}});
				}
			}
			
			if(readingViewIs('scroll'))
			{
				if(status == 'start')
				{
					let content = template.contentRight().children();

					gamepadScroll = {
						y: 0,
						content: content,
						scrollTop: content.scrollTop(),
						prevNow: 0,
					};

					content.stop(true);
				}

				let y = 0;

				if(axes[1])
					y = axes[1];
				else if(!config.readingMagnifyingGlass)
					y = axes[3];

				if(status == 'start' || status == 'move')
				{
					let speed = (gamepadAxesNow ? now - gamepadAxesNow : 16) * (haveZoom ? 1 : 2);

					y = gamepadScroll.y = gamepadScroll.y + (y * speed);

					gamepadScroll.content.scrollTop(gamepadScroll.scrollTop + y);
				}
				else // status == 'end'
				{
					gamepadScroll = false;
				}
			}

			gamepadAxesNow = now;
		}
		
	});

	gamepad.setAxesStepsEvent('reading', [0, 1], function(key, axes) {

		if(onReading && !document.querySelector('.menu-simple.a'))
		{
			if(!haveZoom && !readingViewIs('scroll'))
			{
				if(key == 0 && (axes[0] < 0 || (axes[2] < 0 && !config.readingMagnifyingGlass)))
					goPrevious();
				else if(key == 1 && (axes[0] > 0|| (axes[2] > 0 && !config.readingMagnifyingGlass)))
					goNext();
			}
		}
		
	});

	/*gamepad.setButtonEvent('reading', [4, 5, 6, 7, 12, 13, 14, 15], function(key, button) {

		if(onReading)
		{
			if(key == 4 || key == 6 || key ==  14)
			{
				goPrevious();
			}
			else if(key == 12)
			{
				if(!readingViewIs('scroll'))
					goStart();
				else
					goPrevious();
			}
			else if(key == 5 || key == 7 || key ==  15)
			{
				goNext();
			}
			else if(key == 13)
			{
				if(!readingViewIs('scroll'))
					goEnd();
				else
					goNext();
			}
		}
		
	});*/

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

		var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
		var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

		if(haveZoom && zoomMoveData.active) // Drag Image zoom
		{
			e.preventDefault();

			x = x - zoomMoveData.x;
			y = y - zoomMoveData.y;

			dragZoom(x, y);
		}
		
		if(readingDragScroll) // Drag to scroll
		{
			e.preventDefault();

			if(!readingDragScroll.start)
			{
				readingDragScroll.start = true;

				$('body').addClass('dragging');
			}

			var pageY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

			if(readingDragScroll.speed.length > 2)
				readingDragScroll.speed.shift();

			readingDragScroll.speed.push({
				time: performance.now(),
				pageY: pageY,
			});

			readingDragScroll.content.scrollTop(readingDragScroll.scrollTop - (pageY - readingDragScroll.pageY));
		}

		if(hiddenContentLeft || hiddenBarHeader) // Show content left and header bar when they are hidden
		{
			if(y < 48)
			{
				if(hiddenBarHeader && !shownBarHeader && !shownContentLeft && !hideContentRunningST)
				{
					hideContentST = setTimeout(function(){

						$('.bar-header').addClass('show');
						reading.setShownBarHeader(true);

					}, 300);

					hideContentRunningST = true;
				}
			}
			else if(x < 48)
			{
				if(hiddenContentLeft && !shownContentLeft && !shownBarHeader && !hideContentRunningST)
				{
					hideContentST = setTimeout(function(){

						$('.content-left').addClass('show');
						reading.setShownContentLeft(true);

					}, 300);

					hideContentRunningST = true;
				}
			}
			else
			{
				clearTimeout(hideContentST);

				hideContentRunningST = false;
			}

			if(shownBarHeader && y > template.barHeader().height() + 48)
			{
				clearTimeout(hideContentST);

				$('.bar-header').removeClass('show');
				reading.setShownBarHeader(false);

				hideContentRunningST = false;
			}

			if(shownContentLeft && x > template.contentLeft().width() + 48)
			{
				clearTimeout(hideContentST);

				$('.content-left').removeClass('show');
				reading.setShownContentLeft(false);

				hideContentRunningST = false;
			}
		}

	});

	$(window).on('mouseup touchend', function(e) {

		if(haveZoom && zoomMoveData.active)
		{
			dragZoomEnd();

			$('body').removeClass('dragging');
		}
		
		if(readingDragScroll)
		{
			if(readingDragScroll.start)
			{
				var first = readingDragScroll.speed[0];
				var last = readingDragScroll.speed[readingDragScroll.speed.length-1];

				var dragSpeed = (first.pageY - last.pageY) / ((performance.now() - first.time) / 1000);

				if(Math.abs(dragSpeed) > 120)
				{
					var duration = Math.abs(dragSpeed) / 1000;

					if(duration > 2)
						duration = 2;
					else if(duration < 0.4)
						duration = 0.4;

					var moreScroll = Math.round((dragSpeed * duration) * 0.366);

					readingDragScroll.content.stop(true).animate({scrollTop: (readingDragScroll.content.scrollTop() + moreScroll)+'px'}, duration * 1000, $.bez([0.22, 0.6, 0.3, 1]));
				}

				$('body').removeClass('dragging');
			}

			setTimeout(function(){reading.setReadingDragScroll(false)}, 10);
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

	$(window).on('resize', resizedWindow);

	$(window).on('mousewheel touchstart', function(e) {

		if(!zoomingIn)
			disableOnScroll(false);

	});

	template.contentRight().children('div').on('scroll', function(e) {

		if(activeOnScroll && readingViewIs('scroll'))
		{
			let scrollTop = this.scrollTop;

			let center = 0;

			let availableScroll = rightSize.scrollHeight - rightSize.height;
			let centerOffset = (availableScroll < rightSize.height ? availableScroll : rightSize.height) / 2;

			if(scrollTop < centerOffset)
				center = scrollTop + (centerOffset * (scrollTop / centerOffset));
			else if(scrollTop + centerOffset > availableScroll)
				center = scrollTop + centerOffset + (centerOffset * (1 - (availableScroll - scrollTop) / centerOffset));
			else
				center = scrollTop + centerOffset;

			let selIndex = false;
			let closest = false;

			toBreak:
			for(let key1 in imagesFullPosition)
			{
				for(let key2 in imagesFullPosition[key1])
				{
					let position = imagesFullPosition[key1][key2];

					if(position.top < center && position.bottom > center)
					{
						selIndex = +key1;
						break toBreak;
					}
					else
					{
						let diff = Math.abs(position.center - center);

						if(closest === false || diff < closest.diff)
						{
							selIndex = +key1;
							closest = {center: position.center, diff: diff};
						}
					}
				}
			}

			let imgHeight = imagesFullPosition[selIndex][0].bottom - imagesFullPosition[selIndex][0].top + (_config.readingMargin.top * 2);

			let pageVisibility = Math.floor(imgHeight / rightSize.height);

			maxPageVisibility = pageVisibility;

			let contentHeightRes = pageVisibility > 0 ? ((rightSize.height * pageVisibility) - imgHeight) / pageVisibility : 0;

			scrollPart = ((rightSize.height - contentHeightRes) - rightSize.height / pageVisibility);

			currentPageVisibility = Math.round((previousScrollTop - (imagesFullPosition[selIndex][0].top - _config.readingMargin.top)) / scrollPart);

			if(currentIndex != selIndex + 1)
			{
				if(currentScale != 1 && !(config.readingGlobalZoom && readingViewIs('scroll')))
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

				currentIndex = selIndex + 1;
			}

			previousScrollTop = scrollTop;
		}

	});

	imagesNum = template.contentRight('.reading-body oc-img').length;
	contentNum = template.contentRight('.reading-body .r-img:not(.blank)').length;

	readingIsCanvas = isCanvas;

	if(isCanvas)
	{
		readingFile = fileManager.fileCompressed(path);
		await readingRender.setFile(readingFile, (config.readingMagnifyingGlass ? config.readingMagnifyingGlassZoom : false));

		let _images = template.contentRight('.reading-body oc-img canvas').get();

		for(let i = 0, len = _images.length; i < len; i++)
		{
			let image = _images[i];
			let index = +image.dataset.index;
			let width = +image.dataset.width;
			let height = +image.dataset.height;
			let path = image.dataset.path;

			images[index] = {index: index, path: path};
			imagesPath[path] = index;

			imagesData[index] = {width: width, height: height, aspectRatio: (width / height), name: image.dataset.name};
		}

		readingRender.setImagesData(imagesData);

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
	else
	{
		readingFile = false;
		readingRender.setFile(false);

		template.contentRight('.reading-body img').each(function() {

			var index = +this.dataset.index;

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
			images[index].path = this.dataset.path;
			imagesPath[this.dataset.path] = index;

		});
	}

	template.contentRight().children('div').css({scrollbarGutter: readingViewIs('scroll') ? '' : 'initial'});
	
	tracking.track();
}

module.exports = {
	read: read,
	images: function(){return images},
	imagesNum: imagesNum,
	contentNum: function(){return contentNum},
	imagesNumLoad: imagesNumLoad,
	imagesData: function(){return imagesData},
	imagesDataClip: function(){return imagesDataClip},
	scalePrevData: function(){return scalePrevData},
	goToImage: goToImage,
	goToFolder: goToFolder,
	goToIndex: function(v1, v2, v3, v4){readingDirection = true; goToIndex(v1, v2, v3, v4)},
	goStart: goStart,
	goPrevious: goPrevious,
	goPrev: goPrevious,
	goNext: goNext,
	goEnd: goEnd,
	leftClick: leftClick,
	rightClick: rightClick,
	zoomIn: zoomIn,
	zoomOut: zoomOut,
	resetZoom: resetZoom,
	applyScale: applyScale,
	activeMagnifyingGlass: activeMagnifyingGlass,
	changeMagnifyingGlass: changeMagnifyingGlass,
	changePagesView: changePagesView,
	magnifyingGlassControl: magnifyingGlassControl,
	addHtmlImages: addHtmlImages,
	disposeImages: disposeImages,
	calculateView: calculateView,
	stayInLine: stayInLine,
	setCurrentComics: setCurrentComics,
	currentComics: function(){return currentComics},
	readingViewIs: readingViewIs,
	disableOnScroll: disableOnScroll,
	activeOnScroll: function(){return activeOnScroll},
	saveReadingProgress: saveReadingProgress,
	saveReadingProgressA: function(){return saveReadingProgressA},
	createAndDeleteBookmark: createAndDeleteBookmark,
	currentIndex: function(){return currentIndex},
	currentPageVisibility: function(){return currentPageVisibility},
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
	imagesFullPosition: function(){return imagesFullPosition},
	readingCurrentPath: function () {return readingCurrentPath},
	setReadingDragScroll: setReadingDragScroll,
	hideContent: hideContent,
	hideContentLeft: hideContentLeft,
	hideBarHeader: hideBarHeader,
	setShownContentLeft: function(value){shownContentLeft = value},
	setShownBarHeader: function(value){shownBarHeader = value},
	loadReadingMoreOptions: loadReadingMoreOptions,
	currentScale: function(){return currentScale},
	rightSize: function(){return rightSize},
	zoomingIn: function(){return zoomingIn},
};