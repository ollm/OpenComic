const render = require(p.join(appDir, 'scripts/reading/render.js')),
	filters = require(p.join(appDir, 'scripts/reading/filters.js')),
	music = require(p.join(appDir, 'scripts/reading/music.js')),
	pageTransitions = require(p.join(appDir, 'scripts/reading/page-transitions.js')),
	readingEbook = require(p.join(appDir, 'scripts/reading/ebook.js'));

var images = {}, imagesData = {}, imagesDataClip = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = 1, imagesPosition = {}, imagesFullPosition = {}, prevImagesFullPosition = {}, foldersPosition = {}, indexNum = 0, imagesDistribution = [], currentPageXY = {x: 0, y: 0}, currentMousePosition = {pageX: 0, pageY: 0};

//Calculates whether to add a blank image (If the reading is in double page and do not apply to the horizontals)
function blankPage(index)
{
	var key = 0;

	if(readingDoublePage() && _config.readingDoNotApplyToHorizontals)
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

	let imageClip = readingImageClip();
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

	if(readingDoublePage())
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

	let _imagesDistribution = applyMangaReading(imagesDistribution);

	let folderImages = [];

	for(let key1 in _imagesDistribution)
	{
		let distribution = [];

		for(let key2 in _imagesDistribution[key1])
		{
			let image = _imagesDistribution[key1][key2];

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
			else if(readingIsEbook)
				image.ebook = true;

			distribution.push(image);
		}

		folderImages.push({key1: key1, distribution: distribution});
	}

	handlebarsContext.folderImages = folderImages;

	let html = template.load('reading.content.right.images.html');

	let contentRight = template._contentRight();

	dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).html(html);

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
	let _margin = readingMargin(data);

	let margin = _margin.margin;
	let marginHorizontal = _margin.left;
	let marginVertical = _margin.top;
	let marginHorizontalsHorizontal = readingHorizontalsMargin(data).left;

	let contentRight = template._contentRight();
	let rect = contentRight.firstElementChild.getBoundingClientRect();

	let contentHeight = rect.height;
	let contentWidth = rect.width;

	if(readingViewIs('scroll'))
		contentWidth = contentRight.querySelector('.reading-body').getBoundingClientRect().width;

	//Width 0
	let contentWidth0 = contentWidth - (marginHorizontal * 2);
	let aspectRatio0 = contentWidth0 / (contentHeight - marginVertical * 2);

	//Width horizontals 0
	let contentWidthHorizontals0 = contentWidth - (marginHorizontalsHorizontal * 2);
	let aspectRatioHorizontals0 = contentWidthHorizontals0 / (contentHeight - marginVertical * 2);

	let _imagesDistribution = applyMangaReading(imagesDistribution);

	let imageClip = readingImageClip();

	let clipTop = imageClip.top / 100;
	let clipBottom = imageClip.bottom / 100;
	let clipVertical = clipTop + clipBottom;
	let clipLeft = imageClip.left / 100;
	let clipRight = imageClip.right / 100;
	let clipHorizontal = clipLeft + clipRight;

	let allImages = contentRight.querySelectorAll('.r-img');

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

	let readingNotEnlargeMoreThanOriginalSize = (_config.readingNotEnlargeMoreThanOriginalSize || _config.readingWebtoon) ? true : false;
	
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
			let imageHeight0, imageWidth0, marginLeft0, marginTop0, imageHeight1, imageWidth1, marginLeft1, marginTop1;

			let imageHeight = imageHeight0 = imageHeight1 = (contentHeight - marginVertical * 2);

			imageWidth0 = imageHeight0 * first.aspectRatio;
			imageWidth1 = imageHeight1 * second.aspectRatio;

			let joinWidth = imageWidth0 + imageWidth1 + marginHorizontal;

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

				let imageHeight = imageHeight0 = imageHeight1 = imageWidth0 / first.aspectRatio;

				marginLeft0 = marginLeft1 = marginHorizontal;
				marginTop0 = marginTop1 = contentHeight / 2 - imageHeight / 2;
			}

			if(readingViewIs('scroll'))
				marginTop0 = marginTop1 = marginVertical;

			let imgHeight0 = (clipVertical > 0 ? (imageHeight0 / (1 - clipVertical)) : imageHeight0);
			let imgWidth0 = (clipHorizontal > 0 ? (imageWidth0 / (1 - clipHorizontal)) : imageWidth0);

			if(image0)
			{
				let size = imagesData[first.index];
				let originalSize = false;

				if(readingNotEnlargeMoreThanOriginalSize)
				{
					let dpr = window.devicePixelRatio;
					let sizeClip = imagesDataClip[first.index];

					if(size && (imgWidth0 * dpr > size.width || imgHeight0 * dpr > size.height))
					{
						marginLeft0 += (imgWidth0 - size.width / dpr);
						if(!readingViewIs('scroll')) marginTop0 += (imgHeight0 - size.height / dpr) / 2;

						imgWidth0 = size.width / dpr;
						imgHeight0 = size.height / dpr;

						imageWidth0 = sizeClip.width / dpr;
						imageHeight0 = sizeClip.height / dpr;

						originalSize = true;
					}
				}

				for(let i = 0, len = image0.length; i < len; i++)
				{
					let image = image0[i];

					image.style.height = app.roundDPR(imageHeight0)+'px';
					image.style.width = app.roundDPR(imageWidth0)+'px';
					image.style.marginLeft = app.roundDPR(marginLeft0)+'px';
					image.style.marginTop = app.roundDPR(marginTop0)+'px';
					image.style.marginBottom = app.roundDPR((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px';
					image.style.marginRight = '0px';

					image.dataset.height = imgHeight0;
					image.dataset.width = imgWidth0;
					image.dataset.left = app.roundDPR(marginLeft0);
					image.dataset.top = app.roundDPR(marginTop0);

					let img = image.firstElementChild;

					if(img)
					{
						img.style.marginTop = -app.roundDPR(imgHeight0 * clipTop)+'px';
						img.style.marginLeft = -app.roundDPR(imgWidth0 * clipLeft)+'px';

						if(size?.rotated)
						{
							img.style.height = app.roundDPR(imgWidth0)+'px';
							img.style.width = app.roundDPR(imgHeight0)+'px';
							img.style.transform = rotateImage(true);
						}
						else
						{
							img.style.height = app.roundDPR(imgHeight0)+'px';
							img.style.width = app.roundDPR(imgWidth0)+'px';
							img.style.transform = '';
						}

						if(originalSize)
							img.classList.add('originalSize');
						else
							img.classList.remove('originalSize');
					}
				}
			}

			let imgHeight1 = (clipVertical > 0 ? (imageHeight1 / (1 - clipVertical)) : imageHeight1);
			let imgWidth1 = (clipHorizontal > 0 ? (imageWidth1 / (1 - clipHorizontal)) : imageWidth1);

			if(image1)
			{
				let size = imagesData[second.index];
				let originalSize = false;

				if(readingNotEnlargeMoreThanOriginalSize)
				{
					let dpr = window.devicePixelRatio;
					let sizeClip = imagesDataClip[second.index];

					if(size && (imgWidth1 * dpr > size.width || imgHeight1 * dpr > size.height))
					{
						marginLeft1 += 0;
						if(!readingViewIs('scroll')) marginTop1 += (imgHeight1 - size.height / dpr) / 2;

						imgWidth1 = size.width / dpr;
						imgHeight1 = size.height / dpr;

						imageWidth1 = sizeClip.width / dpr;
						imageHeight1 = sizeClip.height / dpr;

						originalSize = true;
					}
				}

				for(let i = 0, len = image1.length; i < len; i++)
				{
					let image = image1[i];

					image.style.height = app.roundDPR(imageHeight1)+'px';
					image.style.width = app.roundDPR(imageWidth1)+'px';
					image.style.marginLeft = app.roundDPR(marginLeft1)+'px';
					image.style.marginTop = app.roundDPR(marginTop1)+'px';
					image.style.marginBottom = app.roundDPR((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px';
					image.style.marginRight = '0px';

					image.dataset.height = imgHeight1;
					image.dataset.width = imgWidth1;
					image.dataset.left = app.roundDPR(marginLeft1);
					image.dataset.top = app.roundDPR(marginTop1);

					let img = image.firstElementChild;

					if(img)
					{
						img.style.marginTop = -app.roundDPR(imgHeight1 * clipTop)+'px';
						img.style.marginLeft = -app.roundDPR(imgWidth1 * clipLeft)+'px';

						if(size?.rotated)
						{
							img.style.height = app.roundDPR(imgWidth1)+'px';
							img.style.width = app.roundDPR(imgHeight1)+'px';
							img.style.transform = rotateImage(true);
						}
						else
						{
							img.style.height = app.roundDPR(imgHeight1)+'px';
							img.style.width = app.roundDPR(imgWidth1)+'px';
							img.style.transform = '';
						}

						if(originalSize)
							img.classList.add('originalSize');
						else
							img.classList.remove('originalSize');
					}
				}
			}
		}
		else
		{
			let imageHeight, imageWidth, marginLeft, marginTop;

			if(_config.readingHorizontalsMarginActive && first.aspectRatio > 1)
			{
				if(aspectRatioHorizontals0 > first.aspectRatio && !(readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
				{
					imageHeight = (contentHeight - marginVertical * 2);
					imageWidth = imageHeight * first.aspectRatio;
					marginLeft = contentWidth / 2 - imageWidth / 2;
					marginTop = marginVertical;
				}
				else
				{
					imageWidth = (contentWidth - marginHorizontalsHorizontal * 2);
					imageHeight = imageWidth / first.aspectRatio;
					marginLeft = marginHorizontalsHorizontal;
					marginTop = contentHeight / 2 - imageHeight / 2;
				}
			}
			else
			{
				if(aspectRatio0 > first.aspectRatio && !(readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
				{
					imageHeight = (contentHeight - marginVertical * 2);
					imageWidth = imageHeight * first.aspectRatio;
					marginLeft = contentWidth / 2 - imageWidth / 2;
					marginTop = marginVertical;
				}
				else
				{
					imageWidth = (contentWidth - marginHorizontal * 2);
					imageHeight = imageWidth / first.aspectRatio;
					marginLeft = marginHorizontal;
					marginTop = contentHeight / 2 - imageHeight / 2;
				}
			}

			if(readingViewIs('scroll'))
				marginTop = marginVertical;

			let imgHeight = (clipVertical > 0 ? (imageHeight / (1 - clipVertical)) : imageHeight);
			let imgWidth = (clipHorizontal > 0 ? (imageWidth / (1 - clipHorizontal)) : imageWidth);

			if(image0)
			{
				let size = imagesData[first.index];
				let originalSize = false;

				if(readingNotEnlargeMoreThanOriginalSize)
				{
					let dpr = window.devicePixelRatio;
					let sizeClip = imagesDataClip[first.index];

					if(size && (imgWidth * dpr > size.width || imgHeight * dpr > size.height))
					{
						marginLeft += (imgWidth - size.width / dpr) / 2;
						if(!readingViewIs('scroll')) marginTop += (imgHeight - size.height / dpr) / 2;

						imgWidth = size.width / dpr;
						imgHeight = size.height / dpr;

						imageWidth = sizeClip.width / dpr;
						imageHeight = sizeClip.height / dpr;

						originalSize = true;
					}
				}

				for(let i = 0, len = image0.length; i < len; i++)
				{
					let image = image0[i];

					image.style.height = app.roundDPR(imageHeight)+'px';
					image.style.width = app.roundDPR(imageWidth)+'px';
					image.style.marginLeft = app.roundDPR(marginLeft)+'px';
					image.style.marginTop = app.roundDPR(marginTop)+'px';
					image.style.marginBottom = app.roundDPR((readingViewIs('scroll') && ((+key1) + 1) == indexNum) ? marginVertical : 0)+'px';
					image.style.marginRight = '0px';

					image.dataset.height = imgHeight;
					image.dataset.width = imgWidth;
					image.dataset.left = app.roundDPR(marginLeft);
					image.dataset.top = app.roundDPR(marginTop);

					let img = image.firstElementChild;

					if(img)
					{
						img.style.marginTop = -app.roundDPR(imgHeight * clipTop)+'px';
						img.style.marginLeft = -app.roundDPR(imgWidth * clipLeft)+'px';

						if(size?.rotated)
						{
							img.style.height = app.roundDPR(imgWidth)+'px';
							img.style.width = app.roundDPR(imgHeight)+'px';
							img.style.transform = rotateImage(true);
						}
						else
						{
							img.style.height = app.roundDPR(imgHeight)+'px';
							img.style.width = app.roundDPR(imgWidth)+'px';
							img.style.transform = '';
						}

						if(originalSize)
							img.classList.add('originalSize');
						else
							img.classList.remove('originalSize');
					}
				}
			}
		}
	}

	let rFlex = contentRight.querySelectorAll('.r-flex');

	for(let i = 0, len = rFlex.length; i < len; i++)
	{
		rFlex[i].style.width = contentWidth+'px';
		rFlex[i].style.height = !readingViewIs('scroll') ? contentHeight+'px' : '';
	}
}

var rightSize = {}; // Right content size

function calculateView(first = false)
{
	let contentRight = template._contentRight();

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

	if(readingViewIs('compact'))
	{
		dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).css({
			width: rect.width+'px',
			height: rect.height+'px',
			flexDirection: '',
		}).addClass('compact', readingView());
	}
	else if(readingViewIs('slide'))
	{
		dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).css({
			width: (rect.width * indexNum)+'px',
			height: rect.height+'px',
			flexDirection: '',
		}).removeClass('compact', 'fade', 'rough-page-turn', 'smooth-page-turn');
	}
	else if(readingViewIs('scroll'))
	{
		dom.this(contentRight).find('.reading-body > div').css({
			width: '100%',
			flexDirection: 'column',
		}).removeClass('compact', 'fade', 'rough-page-turn', 'smooth-page-turn');

		dom.this(contentRight).find('.reading-lens > div > div').css({
			width: rect.width+'px',
			flexDirection: 'column',
		}).removeClass('compact', 'fade', 'rough-page-turn', 'smooth-page-turn');

		rect = content.getBoundingClientRect();

		rightSize = {
			height: rect.height,
			width: rect.width,
			top: rect.top,
			left: rect.left,
			// readingRect: content.querySelector('.reading-body').getBoundingClientRect(),
			scrollHeight: content.scrollHeight,
		};
	}

	if(readingViewIs('scroll'))
	{
		prevImagesFullPosition = imagesFullPosition;

		imagesPosition = [];
		imagesFullPosition = [];

		const scale = config.readingGlobalZoom ? scalePrevData.scale : 1;
		const margin = readingMargin();

		const scrollTop = content.scrollTop - rect.top;

		for(let key1 in imagesDistribution)
		{
			if(typeof imagesPosition[key1] === 'undefined') imagesPosition[key1] = [];
			if(typeof imagesFullPosition[key1] === 'undefined') imagesFullPosition[key1] = [];

			for(let key2 in imagesDistribution[key1])
			{
				const image = contentRight.querySelector('.image-position'+key1+'-'+key2);
				let top = 0, height = 0;

				if(image)
				{
					const ocImg = image.querySelector('oc-img');

					if(ocImg)
					{
						const rect = ocImg.getBoundingClientRect();

						top = rect.top;
						height = rect.height;
					}
					else
					{
						const rect = image.getBoundingClientRect();

						top = rect.top + (margin.top * scale);
						height = rect.height - ((margin.top) * scale);
					}
				}

				imagesPosition[key1][key2] = (top + (height / 2)) + scrollTop;
				imagesFullPosition[key1][key2] = {
					top: top + scrollTop,
					center: imagesPosition[key1][key2],
					bottom: top + height + scrollTop,
					height: height,
				};
			}
		}

		if(first)
			prevImagesFullPosition = imagesFullPosition;
	}
}

var previousScrollTop = 0, previousScrollHeight = 0, previousContentHeight = 0, stayInLineData = {scrollTop: false, scrollHeight: false, heigth: false, position: {}, setTimeout: false};

function getPreviusContentSize()
{
	if(!readingViewIs('scroll')) return;

	let contentRight = template._contentRight();
	let content = contentRight.firstElementChild;
	let rect = content.getBoundingClientRect();

	previousContentHeight = rect.height;
	previousScrollHeight = content.scrollHeight;
	previousScrollTop = content.scrollTop;
}

function stayInLine(resize = false)
{
	if(readingViewIs('compact'))
	{
		if(currentIndex < 1 && dom.previousComic())
			showPreviousComic(1, false);
		else if(currentIndex > contentNum && dom.nextComic())
			showNextComic(1, false);
		else
			pageTransitions.goToIndex(currentIndex, false);
	}
	else if(readingViewIs('slide'))
	{
		if(currentIndex < 1 && dom.previousComic())
			showPreviousComic(1, false);
		else if(currentIndex > contentNum && dom.nextComic())
			showNextComic(1, false);
		else
			goToIndex(currentIndex, false, currentPageVisibility);
	}
	else if(readingViewIs('scroll'))
	{
		let contentRight = template._contentRight();
		let content = contentRight.firstElementChild;
		let rect = content.getBoundingClientRect();
		let position = imagesFullPosition[currentIndex-1][0];

		disableOnScroll(true);

		if(stayInLineData.scrollTop === false)
			stayInLineData = {scrollTop: previousScrollTop, scrollHeight: previousScrollHeight, height: previousContentHeight, position: prevImagesFullPosition[currentIndex-1][0], setTimeout: false};

		clearTimeout(stayInLineData.setTimeout);
		stayInLineData.setTimeout = setTimeout(function(){

			stayInLineData = {scrollTop: false, scrollHeight: false, heigth: false, position: {}, setTimeout: false};

			disableOnScroll(false);

		}, 400);

		let percent = ((stayInLineData.scrollTop + stayInLineData.height / 2) - stayInLineData.position.top) / stayInLineData.position.height;

		let scrollTop = position.top + (percent * position.height) - (rect.height / 2);
		content.scrollTop = rect.height > stayInLineData.height ? app.ceilDPR(scrollTop) : app.floorDPR(scrollTop);
	}
}

let prevChangeHeaderButtons = {};

function changeHeaderButtons(scrollInStart = null, scrollInEnd = null)
{
	let canGoPrev = true, canGoNext = true, prevIsPrevComic = false, nextIsNextComic = false;

	let barHeader = template._barHeader();

	let lastPage = barHeader.querySelector('.button-last-page');
	let next = barHeader.querySelector('.button-next');
	let prev = barHeader.querySelector('.button-prev');
	let firstPage = barHeader.querySelector('.button-first-page');

	if((scrollInStart === null || scrollInStart) && currentIndex == 1 && !((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && currentPageVisibility > 0))
	{
		prevIsPrevComic = true;
		canGoPrev = dom.previousComic();
	}

	if((scrollInEnd === null || scrollInEnd) && currentIndex == indexNum && !((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && currentPageVisibility < maxPageVisibility))
	{
		nextIsNextComic = true;
		canGoNext = dom.nextComic();
	}

	let currentChangeHeaderButtons = {
		prevIsPrevComic: prevIsPrevComic,
		nextIsNextComic: nextIsNextComic,
		canGoPrev: canGoPrev,
		canGoNext: canGoNext,
	};

	if(!isEqual(prevChangeHeaderButtons, currentChangeHeaderButtons))
	{
		changeHeaderButtonsDelay = false;

		dom.this([prev, firstPage]).class(!canGoPrev, 'disable-pointer');
		dom.this([next, lastPage]).class(!canGoNext, 'disable-pointer');

		firstPage.innerHTML = prevIsPrevComic ? 'skip_previous' : 'first_page';
		firstPage.setAttribute('hover-text', prevIsPrevComic ? language.reading.prevChapter : language.reading.firstPage);

		lastPage.innerHTML = nextIsNextComic ? 'skip_next' : 'last_page';
		lastPage.setAttribute('hover-text', nextIsNextComic ? language.reading.nextChapter : language.reading.lastPage);

		if(config.readingTrackingAtTheEnd && !trackingCurrent && ((_config.readingManga && prevIsPrevComic) || (!_config.readingManga && nextIsNextComic)))
		{
			trackingCurrent = true;
			tracking.track();
		}

		prevChangeHeaderButtons = currentChangeHeaderButtons;
		changeHeaderButtonsDelayed = false;
	}
}

//Go to a specific comic image (Left menu)
function goToImageCL(index, animation = true, fromScroll = false, fromPageRange = false)
{
	if(!onReading) return;

	if(!fromPageRange)
	{
		render.focusIndex(index, readingDoublePage());
		filters.focusIndex(index);
	}

	let animationDurationMS = ((animation) ? _config.readingViewSpeed : 0) * 1000;
	let contentLeft = template._contentLeft();

	let leftScroll = contentLeft.firstElementChild;
	let leftItem;

	if(readingIsEbook)
	{
		let currentPage = index;
		let closest = 0;

		for(let i = 0, len = _ebook.tocPages.length; i < len; i++)
		{
			if(_ebook.tocPages[i] <= index && _ebook.tocPages[i] > closest)
				closest = _ebook.tocPages[i];
		}

		leftItem = contentLeft.querySelector('.reading-toc-page-'+closest+' .reading-toc-title');

		if(animation)
			dom.this(contentLeft).find('.reading-toc-title.s', true).removeClass('s');
		else
			dom.this(contentLeft).find('.reading-toc-title.s', true).removeClass('s', 'transition');

		if(leftItem)
		{
			leftItem.classList.add('s');
			if(animation && _config.readingViewSpeed > 0.2) leftItem.classList.add('transition');
		}
	}
	else
	{
		leftItem = contentLeft.querySelector('.r-l-i'+index);

		if(animation)
			dom.this(contentLeft).find('.reading-left.s', true).removeClass('s');
		else
			dom.this(contentLeft).find('.reading-left.s', true).removeClass('s', 'transition');

		if(leftItem)
		{
			leftItem.classList.add('s');
			if(animation && _config.readingViewSpeed > 0.2) leftItem.classList.add('transition');
		}
	}

	if(leftItem)
	{
		let rectItem = leftItem.getBoundingClientRect();
		let rectScroll = leftScroll.getBoundingClientRect();

		let scrollTop = (((rectItem.top + leftScroll.scrollTop) - rectScroll.top) + (rectItem.height / 2)) - (rectScroll.height / 2);
		let scrollHeight = leftScroll.scrollHeight;

		if(scrollTop > 0 && scrollTop < (scrollHeight - rectScroll.height))
		{
			if(animation)
				$(leftScroll).stop(true).animate({scrollTop: scrollTop+'px'}, animationDurationMS);
			else
				leftScroll.scrollTop = scrollTop;
		}
		else if(scrollTop > 0)
		{
			if(animation)
				$(leftScroll).stop(true).animate({scrollTop: (scrollHeight - rectScroll.height)+'px'}, animationDurationMS);
			else
				leftScroll.scrollTop = (scrollHeight - rectScroll.height);
		}
		else
		{
			if(animation)
				$(leftScroll).stop(true).animate({scrollTop: '0px'}, animationDurationMS);
			else
				leftScroll.scrollTop = 0;
		}
	}

	if(!fromPageRange)
	{
		let input = contentLeft.querySelector('.simple-slider input');
		if(input) events.goRange(input, index, false);
	}

	// Change header buttons
	if(!fromPageRange && (!readingViewIs('scroll') || !fromScroll))
		changeHeaderButtons();
}

//Go to a specific comic image
function goToImage(imageIndex, disableSave = false)
{
	if(typeof imagesData[imageIndex] !== 'undefined')
	{
		if(!disableSave)
			saveReadingProgressA = true;

		readingDirection = true;

		let newIndex = imagesData[imageIndex].position + 1;

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) + 1;

		calculateRealReadingDirection(newIndex);

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

		let newIndex = foldersPosition[folderIndex] + 1;

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) + 1;

		calculateRealReadingDirection(newIndex);

		goToIndex(newIndex);
		goToImageCL(folderIndex, true)
	}
}

//Go to a specific page
function goToPage(page)
{
	if(typeof imagesData[page] !== 'undefined')
		goToImage(page);
	else
		goToFolder(page);
}

var pageRangeHistory = [];

function pageRange(page, end)
{
	if(!end)
	{
		goToImageCL(page, false, false, true);
	}
	else
	{
		template._contentLeft().querySelector('.range input').blur();
		template._contentLeft().querySelector('.slider-reset').classList.add('active');
		pageRangeHistory.push(currentIndex);
		reading.goToPage(page);
	}
}

function goBackPageRangeHistory()
{
	let page = pageRangeHistory.pop();
	reading.goToPage(page);

	if(pageRangeHistory.length == 0)
		template._contentLeft().querySelector('.slider-reset').classList.remove('active');
}

function goPageDialog(go = false)
{
	if(go)
	{
		let input = document.querySelector('.input-goto-page');
		reading.goToPage(input.value);
	}
	else
	{
		handlebarsContext.currentIndex = currentIndex;

		events.dialog({
			header: language.dialog.pages.readingGotoPage,
			width: 400,
			height: false,
			content: template.load('dialog.pages.reading.goto.page.html'),
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.menu.goto.main,
					function: 'events.closeDialog(); reading.goPageDialog(true);',
				}
			],
		});

		events.focus('.input-goto-page');
		events.eventInput();
	}
}

//Returns the highest image
function returnLargerImage(index)
{
	if(readingDoublePage())
	{
		let image0 = template._contentRight().querySelector('.image-position'+(index)+'-0');
		let image1 = template._contentRight().querySelector('.image-position'+(index)+'-1');

		let rect0 = image0 ? image0.getBoundingClientRect() : false;
		let rect1 = image1 ? image1.getBoundingClientRect() : false;

		let imageHeight0 = rect0.height || 0;
		let imageHeight1 = rect1.height || 0;

		if(imageHeight0 >= imageHeight1)
			return {image: image0, height: imageHeight0, top: rect0.top || 0};
		else
			return {image: image1, height: imageHeight1, top: rect1.top || 0};
	}
	else
	{
		let image = template._contentRight().querySelector('.image-position'+(index)+'-0');
		let rect = image ? image.getBoundingClientRect() : false;

		return {image: image, height: rect.height || 0, top: rect.top || 0};
	}
}

var currentPageVisibility = 0, maxPageVisibility = 0, currentPageStart = true, readingDirection = true, realReadingDirection = true, disableOnScrollST = false;

function calculateRealReadingDirection(index)
{
	if(currentIndex > index)
		realReadingDirection = false;
	else
		realReadingDirection = true;
}

//Go to a specific comic index
function goToIndex(index, animation = true, nextPrevious = false, end = false)
{
	let animationDurationS = ((animation) ? _config.readingViewSpeed : 0);
	let animationDurationMS = animationDurationS * 1000;

	let _currentScale = currentScale;

	if(currentScale != 1 && animation && !(config.readingGlobalZoom && readingViewIs('scroll')))
		reading.resetZoom(true, false, true, true, (config.readingGlobalZoomSlide && !readingViewIs('scroll')));

	let content = template._contentRight().firstElementChild;
	let rect = content.getBoundingClientRect();
	let contentWidth = rect.width;
	let contentHeight = rect.height;

	let updateCurrentIndex = true;

	let eIndex = index;

	let pageVisibilityIndex = 0;

	let imgHeight = false;

	if(((nextPrevious && currentPageStart) || !nextPrevious || end) && (readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
	{
		let largerImage = returnLargerImage(eIndex-1);
		imgHeight = largerImage.height + readingMargin().top;

		if(imgHeight > contentHeight)
		{
			let pageVisibility = Math.floor(imgHeight / contentHeight)

			maxPageVisibility = pageVisibility;

			if(readingDirection && !end)
				currentPageVisibility = 0;
			else
				currentPageVisibility = pageVisibility;
		}
		else
		{
			currentPageVisibility = 0;
			maxPageVisibility = 0;
		}

		if(nextPrevious !== false && nextPrevious !== true) currentPageVisibility = nextPrevious;
		pageVisibilityIndex = currentPageVisibility;

		currentPageStart = false;
	}
	else if(nextPrevious && !currentPageStart && (readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)))
	{
		eIndex = currentIndex;

		let largerImage = returnLargerImage(eIndex-1);
		imgHeight = largerImage.height + readingMargin().top;

		if(readingDirection)
			currentPageVisibility++;
		else
			currentPageVisibility--;

		if(nextPrevious !== false && nextPrevious !== true) currentPageVisibility = nextPrevious;
		pageVisibilityIndex = currentPageVisibility;

		let pageVisibility = Math.floor(imgHeight / contentHeight);

		maxPageVisibility = pageVisibility;

		if(!((readingDirection && currentPageVisibility > pageVisibility) || (!readingDirection && currentPageVisibility < 0)))
		{
			updateCurrentIndex = false;
		}
		else
		{
			eIndex = index;

			let largerImage = returnLargerImage(eIndex-1);
			imgHeight = largerImage.height + readingMargin().top;

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

	if(readingViewIs('compact'))
	{
		pageTransitions.goToIndex(eIndex, animation);
	}
	else if(readingViewIs('slide'))
	{
		template.contentRight('.reading-body > div, .reading-lens > div > div').css({
			'transition': 'transform '+animationDurationS+'s',
			'transform': 'translate(-'+(contentWidth * (eIndex - 1))+'px, 0)',
		});
	}
	else if(readingViewIs('scroll'))
	{
		let largerImage = returnLargerImage(eIndex-1);
		let scrollTop = (largerImage.top - rect.top) + content.scrollTop;

		let scrollSum = 0;

		if((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && pageVisibilityIndex !== false)
		{
			imgHeight = largerImage.height + readingMargin().top;

			if(imgHeight > contentHeight)
			{
				let pageVisibility = Math.floor(imgHeight / contentHeight);

				maxPageVisibility = pageVisibility;

				let contentHeightRes = ((contentHeight * pageVisibility) - imgHeight) / pageVisibility;

				scrollSum = ((contentHeight - contentHeightRes) - contentHeight / pageVisibility) * pageVisibilityIndex;
			}		
		}

		clearTimeout(disableOnScrollST);

		disableOnScroll(true);

		disableOnScrollST = setTimeout(function(){

			reading.disableOnScroll(false);

		}, animationDurationMS + 200); // Add 200 of margin to avoid errors

		$(content).stop(true).animate({scrollTop: (scrollTop + scrollSum)+'px'}, animationDurationMS);
	}

	let newIndex = (eIndex - 1);

	if(_config.readingManga && !readingViewIs('scroll'))
		newIndex = (indexNum - newIndex) - 1;

	if(updateCurrentIndex)
		currentIndex = index;

	eachImagesDistribution(newIndex, ['image', 'folder'], function(image){

		goToImageCL(image.index, animation);

	}, false, false, true);

	if(_currentScale && _currentScale != 1 && config.readingGlobalZoomSlide && !readingViewIs('scroll'))
	{
		currentZoomIndex = false;
		currentScale = _currentScale;
		reading.applyScale(false, _currentScale, true, _currentScale > 1 ? false : true);
	}

	//goToImageCL(imagesDistribution[eIndex-1][0].index, animation);

	var isBookmarkTrue = false;

	eachImagesDistribution(newIndex, ['image', 'folder'], function(image){

		if(!isBookmarkTrue && images[image.index] && isBookmark(p.normalize(images[image.index].path)))
			isBookmarkTrue = true;

	});
}

// 
var nextOpenChapterProgress = false;

function setNextOpenChapterProgress(chapterIndex, chapterProgress)
{
	nextOpenChapterProgress = {
		chapterIndex: chapterIndex,
		chapterProgress: chapterProgress,
	};
}

// Go to ebook chapter progress
function goToChapterProgress(chapterIndex, chapterProgress, animation = true)
{
	nextOpenChapterProgress = false;
	let closest = false;

	for(let i = 0, len = _ebook.chaptersPages[chapterIndex].length; i < len; i++)
	{
		let diff = Math.abs(_ebook.chaptersPages[chapterIndex][i].chapterProgress - chapterProgress);

		if(closest === false || diff < closest.diff)
		{
			closest = {
				page: _ebook.chaptersPages[chapterIndex][i],
				diff: diff,
			};
		}
	}

	if(closest.page)
	{
		let index = closest.page.index + 1;

		if(readingDoublePage())
			index = Math.ceil(index / 2);

		if(_config.readingManga && !readingViewIs('scroll'))
			index = (indexNum - closest.page.index);

		reading.goToIndex(index, animation);
	}
}

//Go to the next comic page
function goNext()
{
	saveReadingProgressA = true;

	var nextIndex = currentIndex + 1;

	readingDirection = realReadingDirection = true;

	if(currentIndex < 1)
	{
		showPreviousComic(2, true);
	}
	else if(nextIndex <= indexNum || ((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && currentPageVisibility < maxPageVisibility))
	{
		goToIndex(nextIndex, true, true);
		music.soundEffect.page();
	}
	else if(currentIndex == indexNum && dom.nextComic() && (!_config.readingManga || readingViewIs('scroll')))
	{
		showNextComic(1, true);
	}
	else if(currentIndex == indexNum && dom.previousComic() && _config.readingManga && !readingViewIs('scroll'))
	{
		showNextComic(1, true, true);
	}
}

//Go to the previous comic page
function goPrevious()
{
	saveReadingProgressA = true;

	var previousIndex = currentIndex - 1;

	readingDirection = realReadingDirection = false;

	if(currentIndex > indexNum)
	{
		showNextComic(2, true);
	}
	else if(previousIndex > 0 || ((readingViewIs('scroll') && (_config.readingViewAdjustToWidth || _config.readingWebtoon)) && currentPageVisibility > 0))
	{
		goToIndex(previousIndex, true, true);
		music.soundEffect.page();
	}
	else if(previousIndex == 0 && dom.previousComic() && (!_config.readingManga || readingViewIs('scroll')))
	{
		showPreviousComic(1, true);
	}
	else if(previousIndex == 0 && dom.nextComic() && _config.readingManga && !readingViewIs('scroll'))
	{
		showPreviousComic(1, true, true);
	}
}

//Go to the start of the comic
function goStart(force = false)
{
	if(force || !_config.readingManga || readingViewIs('scroll'))
	{
		saveReadingProgressA = true;

		if((currentIndex > indexNum || (currentIndex - 1 == 0 && dom.previousComic())) && (!maxPageVisibility || currentPageVisibility == 0))
		{
			goPrevious();

			return false;
		}
		else
		{
			readingDirection = true;
			realReadingDirection = false;

			goToIndex(1, true);

			return true;
		}
	}
	else
	{
		return goEnd(true);
	}
}

function goPrevComic()
{
	if(dom.previousComic())
	{
		let speed = _config.readingViewSpeed;
		_config.readingViewSpeed = 0;

		let double = goStart();
		if(double) goStart();

		_config.readingViewSpeed = speed;
	}
}

//Go to the end of the comic
function goEnd(force = false)
{
	if(force || !_config.readingManga || readingViewIs('scroll'))
	{
		saveReadingProgressA = true;

		if((currentIndex < 1 || (currentIndex == indexNum && dom.nextComic())) && (!maxPageVisibility || maxPageVisibility == currentPageVisibility))
		{
			goNext();

			return false;
		}
		else
		{
			readingDirection = false;
			realReadingDirection = true;

			goToIndex(indexNum, true, true, true);

			return true;
		}
	}
	else
	{
		return goStart(true);
	}
}

function goNextComic()
{
	if(dom.nextComic())
	{
		let speed = _config.readingViewSpeed;
		_config.readingViewSpeed = 0;

		let double = goEnd();
		if(double) goEnd();

		_config.readingViewSpeed = speed;
	}
}

var scrollNextOrPrevComicDelayed = false, scrollNextOrPrevComicST = false;

function scrollNextOrPrevComic(prev = false, delay = false)
{
	if(!config.readingGoNextPrevChapterWithScroll) return;

	if(delay && !scrollNextOrPrevComicDelayed && ((prev && scrollInStart) || (!prev && scrollInEnd)))
	{
		if(scrollNextOrPrevComicST) return;

		scrollNextOrPrevComicST = setTimeout(function(){

			scrollNextOrPrevComicDelayed = true;
			scrollNextOrPrevComicST = false;

		}, 500);

		return;
	}

	scrollNextOrPrevComicDelayed = false;

	if(prev && (scrollInStart || currentIndex == indexNum + 1))
	{
		if(currentIndex != 0)
			reading.goPrev();

		return true;
	}
	else if(!prev && (scrollInEnd || currentIndex == 0))
	{	
		if(currentIndex != indexNum + 1)
			reading.goNext();

		return true;
	}

	return false;
}

function onScroll(event)
{
	if(!isLoaded || !onReading) return;

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

		let imgHeight = imagesFullPosition[selIndex][0].bottom - imagesFullPosition[selIndex][0].top + (readingMargin().top * 2);

		let pageVisibility = Math.floor(imgHeight / rightSize.height);

		maxPageVisibility = pageVisibility;

		let contentHeightRes = pageVisibility > 0 ? ((rightSize.height * pageVisibility) - imgHeight) / pageVisibility : 0;

		scrollPart = ((rightSize.height - contentHeightRes) - rightSize.height / pageVisibility);

		currentPageVisibility = Math.round((previousScrollTop - (imagesFullPosition[selIndex][0].top - readingMargin().top)) / scrollPart);
		if(currentPageVisibility < 0) currentPageVisibility = 0;

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

			currentIndex = selIndex + 1;

			if(imageIndex)
			{
				saveReadingProgressA = true;

				goToImageCL(imageIndex, true, true);
			}
		}

		previousScrollTop = scrollTop;

		scrollInStart = scrollTop <= 1 ? true : false;
		scrollInEnd = scrollTop >= availableScroll - 1 ? true : false;

		changeHeaderButtons(scrollInStart, scrollInEnd, true);
	}

	if(onReading && config.readingMagnifyingGlass)
		magnifyingGlassControlPrev();
}

function abortClick(event)
{
	if(event.target.classList.contains('folder') || event.target.closest('.folder'))
		return true;

	const pageX = app.pageX(event);
	const pageY = app.pageY(event);

	const maxDiff = Math.max(Math.abs(pageX - zoomMoveData.x), Math.abs(pageY - zoomMoveData.y));
	const isTouch = (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) ? true : false;

	if((!reading.haveZoom() || config.readingMoveZoomWithMouse || maxDiff < 10) && (!readingDragScroll || !readingDragScroll.start) && (!isTouch || !config.readingMagnifyingGlass))
		return false;

	return true;
}

function leftClick(event)
{
	if(event.target.classList.contains('folder') || event.target.closest('.folder')) return;

	let pageX = app.pageX(event);
	let pageY = app.pageY(event);

	let maxDiff = Math.max(Math.abs(pageX - zoomMoveData.x), Math.abs(pageY - zoomMoveData.y));

	let isTouch = (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) ? true : false;

	if((!reading.haveZoom() || config.readingMoveZoomWithMouse || maxDiff < 10) && (!readingDragScroll || !readingDragScroll.start) && (!isTouch || !config.readingMagnifyingGlass))
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

	let pageX = app.pageX(event);
	let pageY = app.pageY(event);

	let maxDiff = Math.max(Math.abs(pageX - zoomMoveData.x), Math.abs(pageY - zoomMoveData.y));

	let isTouch = (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) ? true : false;

	if((!reading.haveZoom() || config.readingMoveZoomWithMouse || maxDiff < 10) && (!readingDragScroll || !readingDragScroll.start) && (!isTouch || !config.readingMagnifyingGlass))
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
			if(readingViewIs('scroll'))
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
			else
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
					'transform': 'scale('+scale+') translate(-'+(contentWidth * (readingViewIs('slide') ? (indexNum - 1) : 0))+'px, 0px)',
				});
			}

			skip.find('circle').css('animation-duration', _config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('reading.setFromSkip(); dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true, false, true);', _config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('reading.setFromSkip(); dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", false, false, true);', _config.readingDelayComicSkip * 1000);

		currentIndex = indexNum + 1;
	}
	else
	{
		if(readingViewIs('scroll'))
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
		else
		{
			var skip = template.contentRight('.reading-skip-right').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'translate(0px, 0px)',
			});

			template.contentRight('.reading-body > div, .reading-lens > div > div').css({
				'transition': 'transform '+_config.readingViewSpeed+'s, background-color 0.2s, box-shadow 0.2s',
				'transform': 'scale(1) translate(-'+(contentWidth * (readingViewIs('slide') ? (indexNum - 1) : 0))+'px, 0px)',
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
			if(readingViewIs('scroll'))
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
			else
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

			skip.find('circle').css('animation-duration', _config.readingDelayComicSkip+'s').removeClass('a').delay(10).queue(function(next){$(this).addClass('a');next();});
		}

		if(invert)
			showComicSkip = setTimeout('reading.setFromSkip(); dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.nextComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", false, false, true);', _config.readingDelayComicSkip * 1000);
		else
			showComicSkip = setTimeout('reading.setFromSkip(); dom.openComic(true, "'+escapeQuotes(escapeBackSlash(dom.previousComic()), 'doubles')+'", "'+escapeQuotes(escapeBackSlash(dom.indexMainPathA()), 'doubles')+'", true, false, true);', _config.readingDelayComicSkip * 1000);

		currentIndex = 0;
	}
	else
	{
		if(readingViewIs('scroll'))
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
		else
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

		currentIndex = 1;
	}
}

var currentScale = 1, scalePrevData = {tranX: 0, tranX2: 0, tranY: 0, tranY2: 0, scale: 1, scrollTop: 0}, originalRect = false, originalRectReadingBody = false, originalRect2 = false, originalRectReadingBody2 = false, haveZoom = false, currentZoomIndex = false, applyScaleST = false, zoomingIn = false, prevAnime = false;

function applyScale(animation = true, scale = 1, center = false, zoomOut = false, delayed = false)
{
	let animationDurationS = ((animation) ? _config.readingViewSpeed : 0);

	if(currentZoomIndex === false)
	{
		if(center || !readingViewIs('scroll'))
		{
			currentZoomIndex = (currentIndex - 1);
		}
		else
		{
			let currentRect = template.contentRight('.image-position'+(currentIndex - 1)).get(0).getBoundingClientRect();

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

		let contentRight = template._contentRight();

		contentRight.querySelector('.reading-body').classList.add('zooming');
		dom.this(contentRight).find('img.zoomOriginalSize', true).removeClass('zoomOriginalSize');
		if(scale == 1) dom.this(contentRight).find('img.zoomed', true).removeClass('zoomed');

		let content = contentRight.firstElementChild;
		$(content).stop(true);

		clearTimeout(applyScaleST);

		if(config.readingGlobalZoom && readingViewIs('scroll'))
		{
			zoomingIn = true;
			disableOnScroll(true);

			if(originalRect === false)
			{
				originalRect = originalRect2 = contentRight.querySelector('.reading-body').getBoundingClientRect();
				originalRectReadingBody = content.getBoundingClientRect();
			}
			else if(originalRect2 === false)
			{
				originalRect2 = contentRight.querySelector('.reading-body').getBoundingClientRect();
			}

			scrollTop = content.scrollTop;
			scrollHeight = content.scrollHeight;

			let _scale = scalePrevData._scale ? scale / scalePrevData._scale : scale;

			let scaleOffset = 1 / scale;

			let pageX = currentPageXY.x - originalRect2.left;
			let pageY = currentPageXY.y - originalRectReadingBody.top;

			let addX = (0.5 - (pageX / originalRect2.width)) * originalRect2.width;
			let addY = pageY;

			if(center)
			{
				addX = 0;
				addY = originalRectReadingBody.height / 2;
			}

			translateX = (scalePrevData.tranX / scalePrevData.scale * scale) + (addX / scalePrevData.scale * (scale - scalePrevData.scale));

			if(zoomOut)
				translateX = scalePrevData.tranX * (scale - 1) / (scalePrevData.scale - 1);

			let scaleOffsetY = (originalRect2.height * _scale - originalRect2.height);

			translateY = -(scaleOffsetY * (scrollTop / scrollHeight));
			translateY = translateY - (addY * (scaleOffsetY / originalRect2.height));

			if(translateY > scrollTop)
				translateY = scrollTop;
			else if(originalRect2.height * _scale + translateY < scrollTop + originalRectReadingBody.height)
				translateY = (scrollTop + originalRectReadingBody.height) - originalRect2.height * _scale;

			if(scale <= 1)
			{
				translateX = 0;
				haveZoom = false;
			}
			else
			{
				haveZoom = true;
			}

			let withLimits = notCrossZoomLimits(translateX, translateY, scale);
			translateX = withLimits.x;

			dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).css({
				transition: 'transform '+animationDurationS+'s, z-index '+animationDurationS+'s',
				transform: 'translateX('+app.roundDPR(translateX)+'px) translateY('+app.roundDPR(translateY)+'px) scale('+scale+')',
				transformOrigin: 'top center',
				zIndex: 1,
			});

			if(scale != 1) dom.this(contentRight).find('.reading-body > div img.originalSize', true).addClass('zoomed');

			applyScaleST = setTimeout(function() {

				let scrollTop = content.scrollTop;

				let translateY = 0;

				dom.this(contentRight).find('.reading-body').css({
					height: (scale == 1 ? '' : (originalRect.height * scale)+'px'),
				});

				dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).css({
					transition: 'transform 0s, z-index 0s',
					transform: 'translateX('+app.roundDPR(scalePrevData.tranX)+'px) translateY('+app.roundDPR(translateY)+'px) scale('+scale+')',
				});

				content.scrollTop = scrollTop + (translateY - scalePrevData.tranY);

				scalePrevData.tranY = translateY;

				calculateView();
				disableOnScroll(false);

				originalRect2 = false;

				if(scale == 1)
				{
					originalRect = false;
					currentZoomIndex = false;
				}

				scalePrevData._scale = scale;

				fixBlurOnZoom(scale);

				contentRight.querySelector('.reading-body').classList.remove('zooming');

				applyScaleST = false;
				zoomingIn = false;

			}, animationDurationS * 1000 + 100);
		}
		else
		{
			zoomingIn = true;

			if(originalRect === false)
			{
				originalRect = contentRight.querySelector('.image-position'+currentZoomIndex).getBoundingClientRect();
				originalRectReadingBody = content.getBoundingClientRect();
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

			let withLimits = notCrossZoomLimits(translateX, translateY, scale);

			translateX = withLimits.x;
			translateY = withLimits.y;

			let imagePosition = dom.this(contentRight).find('.image-position'+currentZoomIndex, true);

			if(delayed)
			{
				setTimeout(function(){

					imagePosition.css({
						transition: 'transform 0s, z-index 0s',
						transform: 'translateX('+app.roundDPR(translateX)+'px) translateY('+app.roundDPR(translateY)+'px) scale('+scale+')',
						transformOrigin: 'center center',
						zIndex: scale == 1 ? 1 : 3,
					});

				}, _config.readingViewSpeed * 1000);
			}
			else
			{
				imagePosition.css({
					transition: 'transform '+animationDurationS+'s, z-index '+animationDurationS+'s',
					transform: 'translateX('+app.roundDPR(translateX)+'px) translateY('+app.roundDPR(translateY)+'px) scale('+scale+')',
					transformOrigin: 'center center',
					zIndex: scale == 1 ? 1 : 3,
				});
			}

			if(scale == 1)
			{
				originalRect = false;
				currentZoomIndex = false;
			}
			else
			{
				dom.this(imagePosition._this).find('img.originalSize', true).addClass('zoomed');
			}

			applyScaleST = setTimeout(function() {

				fixBlurOnZoom(scale, currentZoomIndex);

				contentRight.querySelector('.reading-body').classList.remove('zooming');

				applyScaleST = false;
				zoomingIn = false;

			}, animationDurationS * 1000 + 100);
		}

		if(center)
		{
			zoomMoveData.x = (originalRect.left + originalRect.width / 2) - (translateX / scale);
			zoomMoveData.y = (originalRect.top + originalRect.height / 2) - (translateY / scale);
		}
		else
		{
			zoomMoveData.x = currentPageXY.x;
			zoomMoveData.y = currentPageXY.y;
		}

		scalePrevData = {
			tranX: translateX,
			tranX2: translateX,
			tranY: translateY,
			tranY2: translateY,
			scale: scale,
			_scale: scalePrevData._scale,
			scrollTop: scrollTop,
		};

		render.setScale(scale, ((config.readingGlobalZoom && readingViewIs('scroll')) || (config.readingGlobalZoomSlide && !readingViewIs('scroll'))), readingDoublePage());
	}
}

function zoomScrollHeight()
{
	if(scalePrevData.scale != 1 && config.readingGlobalZoom && readingViewIs('scroll'))
	{
		let contentRight = template._contentRight();
		let readingBody = contentRight.querySelector('.reading-body');
		let readingBodyChild = readingBody.firstElementChild;

		let content = contentRight.firstElementChild;

		let newRect = readingBody.getBoundingClientRect();
		let childRect = readingBodyChild.getBoundingClientRect();
		originalRectReadingBody = content.getBoundingClientRect();

		let diff = childRect.height / originalRect2.height;

		originalRect = {
			width: diff * originalRect.width,
			height: diff * originalRect.height,
			left: newRect.left,
			top: newRect.top,
		};

		originalRect2 = {
			width: originalRect.width,
			height: childRect.height,
			left: newRect.left,
			top: newRect.top,
		};

		if(!readingBody.classList.contains('zooming'))
		{
			dom.this(contentRight).find('.reading-body').css({
				height: childRect.height+'px',
			});
		}
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

function zoomUp()
{
	zoomMove(0, 20);
}

function zoomDown()
{
	zoomMove(0, -20);
}

function zoomLeft()
{
	zoomMove(-20, 0);
}

function zoomRight()
{
	zoomMove(20, 0);
}

function zoomMove(x = 0, y = 0)
{
	if(!haveZoom) return;

	dragZoom(x, y);
	dragZoomEnd(true);
}

// Reset zoom or show in original size if is current in 1 scale
function resetZoom(animation = true, index = false, apply = true, center = true, delayed = false)
{
	var animationDurationS = ((animation) ? _config.readingViewSpeed : 0);

	if(currentScale == 1) // Show current image in original size
	{
		let _image = imagesDistribution[currentIndex - 1][0];
		if(_image.folder || _image.blank) _image = imagesDistribution[currentIndex - 1][1] || false;

		if(_image && !_image.folder && !_image.blank)
		{
			let image = imagesData[_image.index] || [];
			let img = template._contentRight().querySelector('.r-img-i'+_image.index+' oc-img');

			if(img)
			{
				if(zoomMoveData.active)
					return;

				let width = +img.dataset.width;
				let height = +img.dataset.height;

				currentScale = ((image.width / width + image.height / height) / 2) / window.devicePixelRatio;

				if(apply)
					applyScale(animation, currentScale, center, (currentScale < 1) ? true : false);

				let _img = img.querySelector('img');
				if(_img) _img.classList.add('zoomOriginalSize');

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
			applyScale(animation, currentScale, true, false, delayed);

			originalRect = false;
			scalePrevData = {tranX: 0, tranX2: 0, tranY: 0, tranY2: 0, scale: 1, scrollTop: 0};
			haveZoom = false;
			zoomMoveData.active = false;
			currentZoomIndex = false;

			render.setScale(1, ((config.readingGlobalZoom && readingViewIs('scroll')) || (config.readingGlobalZoomSlide && !readingViewIs('scroll'))), readingDoublePage());
		}
	}
}

// Fix blur on zoom cause by tranform scale, still happening in vertical reader in some conditions
function fixBlurOnZoom(scale = 1, index = false)
{
	let _scale = 1 / scale;

	let contentRight = template._contentRight();
	let images = index !== false ? contentRight.querySelectorAll('.image-position'+index+' oc-img img, .image-position'+index+' oc-img canvas') : contentRight.querySelectorAll('.r-img oc-img img, .r-img oc-img canvas');

	for(let i = 0, len = images.length; i < len; i++)
	{
		let img = images[i];
		let image = imagesData[+img.dataset.index] || [];

		let ocImg = img.parentElement;

		if(img.tagName != 'CANVAS')
		{
			let width = image?.rotated ? +ocImg.dataset.height : +ocImg.dataset.width;
			let height = image?.rotated ? +ocImg.dataset.width : +ocImg.dataset.height;

			let _width = Math.round(width * scale * window.devicePixelRatio);
			let _height = Math.round(height * scale * window.devicePixelRatio);

			img.style.width = (_width / window.devicePixelRatio)+'px';
			img.style.height = (_height / window.devicePixelRatio)+'px';
		}

		if(img.tagName == 'CANVAS')
			img.style.transform = 'scale('+(_scale / window.devicePixelRatio)+') '+rotateImage(image?.rotated, 0.001, 0.001);
		else if(img.classList.contains('blobRender') || img.classList.contains('zoomOriginalSize') || img.classList.contains('originalSize'))
			img.style.transform = 'scale('+_scale+') '+rotateImage(image?.rotated, 0.001, 0.001);
		else
			img.style.transform = 'scale('+_scale+') '+rotateImage(image?.rotated);
	}

	if(_scale == 1)
		return;

	window.requestAnimationFrame(function(){

		window.requestAnimationFrame(function(){

			for(let i = 0, len = images.length; i < len; i++)
			{
				let img = images[i];
				let image = imagesData[+img.dataset.index] || [];

				if(img.tagName != 'CANVAS' && !img.classList.contains('blobRender') && !img.classList.contains('zoomOriginalSize') && !img.classList.contains('originalSize'))
				{
					let rect = img.getBoundingClientRect();

					let left = -(rect.left - app.floorDPR(rect.left));
					let top = -(rect.top - app.floorDPR(rect.top));

					if(left < -0.5) left++;
					if(top < -0.5) top++;

					img.style.transform = 'scale('+_scale+') '+rotateImage(image?.rotated, left, top);
				}
			}

		});
	});

}

function getIndexImagesSize(index)
{
	let contentRight = template._contentRight();

	let width = 0;
	let height = 0;

	let images = contentRight.querySelectorAll('.reading-body .image-position'+index+' .r-img > *');

	let len = images.length;

	if(len == 1)
		width += readingMargin().left * 2;

	for(let i = 0; i < len; i++)
	{
		let img = images[i];

		width += +img.dataset.width;

		if(i > 0)
		{
			if(i == 1)
				width += +img.dataset.left * 3;
			else
				width += +img.dataset.left;
		}

		let _height = +img.dataset.height + (readingMargin().top * 2);

		if(_height > height) height = _height;
	}

	return {
		width: width,
		height: height,
	};
}

function notCrossZoomLimits(x, y, scale = false)
{
	scale = scale !== false ? scale : scalePrevData.scale;

	let indexSize = getIndexImagesSize((config.readingGlobalZoom && readingViewIs('scroll')) ? (currentIndex - 1) : currentZoomIndex);

	let maxX = indexSize.width * 0.5 * scale - originalRect.width * 0.5;
	let minX = indexSize.width * -0.5 * scale - originalRect.width * -0.5;

	if(maxX < 0) maxX = 0;
	if(minX > 0) minX = 0;

	let maxDiff = readingViewIs('scroll') ? ((originalRect.top + originalRect.height) - (originalRectReadingBody.top + originalRectReadingBody.height)) : 0;
	let minDiff = readingViewIs('scroll') ? (originalRect.top - originalRectReadingBody.top) : 0;

	let maxY = (indexSize.height * 0.5 * scale - originalRect.height * 0.5) - (minDiff < 0 ? minDiff : 0);
	let minY = (indexSize.height * -0.5 * scale - originalRect.height * -0.5) - (maxDiff > 0 ? maxDiff + readingMargin().top : 0);

	if(maxY < 0) maxY = 0;
	if(minY > 0) minY = 0;

	if(x > maxX)
		x = maxX;
	else if(x < minX)
		x = minX;

	if(y > maxY)
		y = maxY;
	else if(y < minY)
		y = minY;

	return {x: x, y: y, maxX: maxX, maxY: maxY, height: indexSize.height, width: indexSize.width};
}

// Drag zoom
function dragZoom(x, y)
{
	let withLimits = notCrossZoomLimits(scalePrevData.tranX2 + x, scalePrevData.tranY2 + y);

	const diff = {
		x: (scalePrevData.tranX2 + x) - withLimits.x,
		y: (scalePrevData.tranY2 + y) - withLimits.y,
	};

	x = withLimits.x;
	y = withLimits.y;

	let contentRight = template._contentRight();

	if(config.readingGlobalZoom && readingViewIs('scroll'))
	{
		scalePrevData.tranX = zoomMoveData.tranX = x;
		zoomMoveData.tranY = scalePrevData.tranY;

		dom.this(contentRight).find('.reading-body > div').css({
			transition: 'transform 0s, z-index 0s',
			transform: 'translateX('+app.roundDPR(x)+'px) translateY('+app.roundDPR(scalePrevData.tranY)+'px) scale('+scalePrevData.scale+')',
			transformOrigin: 'top center',
		});
	}
	else
	{
		zoomMoveData.tranX = x;
		zoomMoveData.tranY = y;

		dom.this(contentRight).find('.image-position'+currentZoomIndex, true).css({
			transition: 'transform 0s, z-index 0s',
			transform: 'translateX('+app.roundDPR(x)+'px) translateY('+app.roundDPR(y)+'px) scale('+scalePrevData.scale+')',
			transformOrigin: 'center center',
		});
	}

	return diff;
}

function dragZoomEnd(force = false)
{
	if(zoomMoveData.active || force)
	{
		if(typeof zoomMoveData.tranX !== 'undefined')
		{
			scalePrevData.tranX = scalePrevData.tranX2 = zoomMoveData.tranX;
			scalePrevData.tranY = scalePrevData.tranY2 = zoomMoveData.tranY;
		}

		zoomMoveData.active = false;
	}
}

// Move scroll whit mouse
var scrollWithMouseStatus = {};

function startScrollWithMouse()
{
	if(config.readingScrollWithMouse)
	{
		let content = template._contentRight().firstElementChild;
		let rect = template._barHeader().getBoundingClientRect();

		scrollWithMouseStatus = {
			active: true,
			content: content,
			scrollTop: content.scrollTop,
			headerHeight: rect.height + rect.top,
		};

		scrollWithMouse();
	}
	else
	{
		scrollWithMouseStatus = {};
	}
}

function scrollWithMouse()
{
	if(!scrollWithMouseStatus.active) return;

	if(onReading && isLoaded && readingViewIs('scroll'))
	{
		let contentScrollTop = scrollWithMouseStatus.content.scrollTop;
		let scrollTop = scrollWithMouseStatus.scrollTop;

		if(Math.abs(contentScrollTop - scrollTop) > 5)
			scrollTop = contentScrollTop;

		let pageY = currentMousePosition.pageY;
		let pageX = currentMousePosition.pageX;

		let height = window.innerHeight;
		let zone = height / 4;

		let width = window.innerWidth;
		let zoneWidth = width / 4;

		let offset = 0;

		if(pageY < zone)
			offset = pageY - zone;
		else if(pageY > height - zone)
			offset = pageY - (height - zone);

		offset = offset / zone * 15;

		if(offset != 0 && pageY > scrollWithMouseStatus.headerHeight && pageX > zoneWidth && pageX < width - zoneWidth && isMouseenter.document)
		{
			let scrollHeight = scrollWithMouseStatus.content.scrollHeight;
			scrollTop = scrollTop + offset;

			if(scrollTop < 0)
				scrollTop = 0;
			else if(scrollTop > scrollHeight)
				scrollTop = scrollHeight;

			scrollWithMouseStatus.scrollTop = scrollTop;
			scrollWithMouseStatus.content.scrollTop = scrollTop;
		}
	}

	window.requestAnimationFrame(scrollWithMouse);
}

function rotateImage(rotate = false, x = 0, y = 0)
{
	if(rotate)
		return 'rotate('+(_config.readingRotateHorizontalsAnticlockwise ? '-' : '')+'90deg) '+(_config.readingRotateHorizontalsAnticlockwise ? 'translate(calc(-100% + '+x+'px), '+y+')' : 'translate('+x+'px, calc(-100% + '+y+'px))');
	else if(x || y)
		return 'translate('+x+'px, '+y+'px)';

	return '';
}

//Turn the magnifying glass on and off
function activeMagnifyingGlass(active = null, gamepad = false)
{
	// Toggle magnifying glass
	if(active === null) active = !config.readingMagnifyingGlass;

	if(active)
	{
		storage.updateVar('config', 'readingMagnifyingGlass', true);
		render.setMagnifyingGlassStatus(config.readingMagnifyingGlassZoom, readingDoublePage());
	
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
		render.setMagnifyingGlassStatus(false);
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

		render.setScaleMagnifyingGlass(value, readingDoublePage());
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

var magnifyingGlassView = false, magnifyingGlassPosition = {x: false, y: false, mode: false};

function magnifyingGlassControlPrev()
{
	if(magnifyingGlassPosition.mode !== false)
		magnifyingGlassControl(magnifyingGlassPosition.mode, {pageX: magnifyingGlassPosition.x, pageY: magnifyingGlassPosition.y, originalEvent: {touches: false}});
}

//Magnifying glass control
var magnifyingGlassControlST = false;

function magnifyingGlassControl(mode, e = false, lensData = false)
{
	let x = 0, y = 0;

	if(e)
	{
		x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX || !e.clientX ? e.pageX : e.clientX);
		y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY || !e.clientY ? e.pageY : e.clientY);
	}

	let contentRight = template._contentRight();

	if(mode == 1)
	{
		if(mode !== magnifyingGlassPosition.mode)
			clearTimeout(magnifyingGlassControlST);

		let ratio = lensData?.ratio ? lensData.ratio : config.readingMagnifyingGlassRatio;
		let zoom = lensData?.zoom ? lensData.zoom : config.readingMagnifyingGlassZoom;
		let lensWidth = lensData?.size ? lensData.size : config.readingMagnifyingGlassSize;
		let lensHeight = Math.round(lensWidth * ratio);

		let lensHeightM = Math.round(lensHeight / 2);
		let lensWidthM = Math.round(lensWidth / 2);

		let top = (y - lensHeightM);
		let left = (x - (lensWidth / 2));

		let rect = contentRight.querySelector('.reading-body').getBoundingClientRect();

		let topLens = y - rect.top - (lensHeightM / zoom);
		let leftLens = x - rect.left - lensWidthM;

		dom.this(contentRight).find('.reading-lens').css({
			display: 'block',
			contentVisibility: 'visible',
			transform: 'translate('+left+'px, '+top+'px)',
			width: lensWidth+'px',
			height: lensHeight+'px',
			borderRadius: ((lensData && typeof lensData.radius != 'undefined') ? lensData.radius : config.readingMagnifyingGlassRadius)+'px'
		}).removeClass('d', 'h').addClass('a');

		dom.this(contentRight).find('.reading-lens > div').css({
			transform: ' scale('+zoom+') translate(' + (-(leftLens)) + 'px, ' + (-(topLens)) + 'px)'
		});

		magnifyingGlassView = true;

		magnifyingGlassPosition = {
			x: x,
			y: y,
			mode: mode,
		};
	}
	else
	{
		if(mode !== magnifyingGlassPosition.mode)
		{
			magnifyingGlassControlST = setTimeout(function(){

				dom.this(contentRight).find('.reading-lens').css({display: 'none', contentVisibility: 'hidden'});

			}, 300);
		}

		dom.this(contentRight).find('.reading-lens').removeClass('a').addClass('d');
		magnifyingGlassView = false;
		magnifyingGlassPosition.mode = mode;
	}

	//calculateView();
}

async function resized()
{
	if(onLoadPromise) await onLoadPromise.promise;

	originalRect = false;
	originalRectReadingBody = false;
	originalRect2 = false;
	originalRectReadingBody2 = false;
	contentLeftRect = false;
	contentRightRect = false;
	barHeaderRect = false;
	
	if((onReading || _onReading) && isLoaded)
	{
		if(!readingIsEbook)
		{
			disposeImages();
			zoomScrollHeight();
			calculateView();
			stayInLine(true);
		}

		render.resized(readingDoublePage());
		fastUpdateEbookPages(false, true);
		generateEbookPagesDelayed();
	}

	// getPreviusContentSize();
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
		resized();
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

	if((_config.readingView == value || (value == 'compact' && _config.readingView != 'scroll' && _config.readingView != 'slide')) && !_config.readingWebtoon)
		return true;

	return false;
}

function readingView()
{
	if(_config.readingWebtoon)
		return 'scroll';

	return _config.readingView;
}

function readingDoublePage()
{
	return (_config.readingDoublePage && !_config.readingWebtoon);
}

var activeOnScroll = true;

function disableOnScroll(disable = true)
{
	activeOnScroll = !disable;
	if(!disable) getPreviusContentSize();
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
		let selectTab = document.querySelector('#reading-pages .tabs > div > div.active').dataset.name;
		loadReadingPages(false, false, selectTab);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 1) // Set the scroll mode
	{
		updateReadingPagesConfig('readingView', value);

		dom.queryAll('.reading-view .chip.active').removeClass('active');
		dom.query('.reading-view-'+value).addClass('active');

		if(value != 'scroll')
			template.globalElement('.reading-ajust-to-width').addClass('disable-pointer');
		else
			template.globalElement('.reading-ajust-to-width').removeClass('disable-pointer');

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 2) // Sets the margin of the pages
	{
		disposeImages({margin: value});
		calculateView();
		stayInLine();

		if(save) updateReadingPagesConfig('readingMargin', {margin: value, top: value, bottom: value, left: value, right: value});
		updateEbook(save);
	}
	else if(mode == 3) // Set width adjustment
	{
		updateReadingPagesConfig('readingViewAdjustToWidth', value);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
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

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 7) // Disables double-page reading in horizontal images
	{
		updateReadingPagesConfig('readingDoNotApplyToHorizontals', value);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		console.log(imageIndex);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 8) // Manga reading, invert the direction and double pages
	{
		updateReadingPagesConfig('readingManga', value);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 9) // Webtoon reading, scroll reading and adjust to width
	{
		updateReadingPagesConfig('readingWebtoon', value);

		if(value)
		{
			template.globalElement('.reading-view, .reading-reading-manga, .reading-double-page, .reading-do-not-apply-to-horizontals, .reading-blank-page, .reading-ajust-to-width, .reading-not-enlarge-more-than-original-size, .reading-margin-vertical').addClass('disable-pointer');
		}
		else
		{
			if(_config.readingView == 'scroll')
				template.globalElement('.reading-ajust-to-width').removeClass('disable-pointer');
			
			if(_config.readingDoublePage)
				template.globalElement('.reading-do-not-apply-to-horizontals, .reading-blank-page').removeClass('disable-pointer');

			template.globalElement('.reading-view, .reading-reading-manga, .reading-double-page, .reading-not-enlarge-more-than-original-size, .reading-margin-vertical').removeClass('disable-pointer');
		}

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 10) // Set horizontal margin of the pages
	{
		disposeImages({left: value, right: value});
		calculateView();
		stayInLine();

		render.resized(readingDoublePage());

		if(save) updateReadingPagesConfig('readingMargin', {margin: _config.readingMargin.margin, top: _config.readingMargin.top, bottom: _config.readingMargin.bottom, left: value, right: value});
		updateEbook(save);
	}
	else if(mode == 11) // Set vertical margin of the pages
	{
		disposeImages({top: value, bottom: value});
		calculateView();
		stayInLine();

		render.resized(readingDoublePage());

		if(save) updateReadingPagesConfig('readingMargin', {margin: _config.readingMargin.margin, top: value, bottom: value, left: _config.readingMargin.left, right: _config.readingMargin.right});
		updateEbook(save);
	}
	else if(mode == 12) // Add blank page at first
	{
		updateReadingPagesConfig('readingBlankPage', value);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 13) // Set width adjustment
	{
		updateReadingPagesConfig('readingHorizontalsMarginActive', value);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		if(value)
			template.globalElement('.reading-horizontals-margin').removeClass('disable-pointer');
		else
			template.globalElement('.reading-horizontals-margin').addClass('disable-pointer');

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 14) // Set horizontal margin of the horizontals pages
	{
		disposeImages({horizontalsLeft: value, horizontalsRight: value});
		calculateView();
		stayInLine();

		render.resized(readingDoublePage());

		if(save) updateReadingPagesConfig('readingHorizontalsMargin', {margin: _config.readingHorizontalsMargin.margin, top: _config.readingHorizontalsMargin.top, bottom: _config.readingHorizontalsMargin.bottom, left: value, right: value});
		updateEbook(save);
	}
	/*else if(mode == 15) // Set vertical margin of the horizontals pages
	{
		disposeImages({horizontalsTop: value, horizontalsBottom: value});
		calculateView();
		stayInLine();

		if(save) updateReadingPagesConfig('readingHorizontalsMargin', {margin: _config.readingHorizontalsMargin.margin, top: value, bottom: value, left: _config.readingHorizontalsMargin.left, right: _config.readingHorizontalsMargin.right});
	}*/
	else if(mode == 16) // Clip horizontal images
	{
		updateReadingPagesConfig('readingImageClip', {top: _config.readingImageClip.top, bottom: _config.readingImageClip.bottom, left: value, right: value});

		if(readingIsEbook) return;

		addHtmlImages();
		disposeImages();
		calculateView();
		stayInLine();

		render.resized(readingDoublePage());
		filters.cleanIsBlackAndWhiteCurrent();
	}
	else if(mode == 17) // Clip vertical images
	{
		updateReadingPagesConfig('readingImageClip', {top: value, bottom: value, left: _config.readingImageClip.left, right: _config.readingImageClip.right});

		if(readingIsEbook) return;

		addHtmlImages();
		disposeImages();
		calculateView();
		stayInLine();

		render.resized(readingDoublePage());
		filters.cleanIsBlackAndWhiteCurrent();
	}
	else if(mode == 18) // Do not enlarge images more than its original size
	{
		updateReadingPagesConfig('readingNotEnlargeMoreThanOriginalSize', value);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
	else if(mode == 19) // Rotate horizontal images
	{
		updateReadingPagesConfig('readingRotateHorizontals', value);

		if(readingIsEbook) handlebarsContext.loading = true;
		template.loadContentRight('reading.content.right.html', true);

		read(readingCurrentPath, imageIndex, false, readingIsCanvas, readingIsEbook);
	}
}

function change(key, value)
{
	/*switch (key)
	{
		case 'pageSoundEffect':

			_config.readingSoundEffect.page.play = value;
			updateReadingPagesConfig('readingSoundEffect', _config.readingSoundEffect);

			break;
	}*/
}

//Change the bookmark icon
function activeBookmark(active = false)
{
	if(active)
		template.barHeader('.button-bookmark').addClass('fill').attr('hover-text', language.reading.removeBookmark);
	else
		template.barHeader('.button-bookmark').removeClass('fill').attr('hover-text', language.reading.addBookmark);
}

//Check if a path is a bookmarks
function isBookmark(path, _return = false)
{
	let i = false;

	if(readingIsEbook)
	{
		let _path = path.replace(/\?page=[0-9]+$/, '');
		let page = app.extract(/\?page=([0-9]+)$/, path, 1);

		page = _ebook.pages[page];

		let min = page.chapterProgressSize == page.chapterProgress ? 0 : page.chapterProgress - (page.chapterProgressSize / 2);
		let max = page.chapterProgress + (page.chapterProgressSize / 2);

		for(let key in readingCurrentBookmarks)
		{
			let bookmark = readingCurrentBookmarks[key];

			if(bookmark.path === _path && bookmark.chapterProgress >= min && bookmark.chapterProgress < max)
			{
				i = key;
				break;
			}
		}
	}
	else
	{
		for(let key in readingCurrentBookmarks)
		{
			if(readingCurrentBookmarks[key].path === path)
			{
				i = key;
				break;
			}
		}
	}

	if(_return)
		return i;

	if(i !== false)
	{
		activeBookmark(true);
		return true;
	}
	else
	{
		activeBookmark(false);
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

		let newIndex = (currentIndex - 1);

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
		let path = p.normalize(images[imageIndex].path);

		let progress = 0;
		let chapterProgress = 0;

		if(readingIsEbook)
		{
			let page = _ebook.pages[imageIndex - 1];

			progress = page.progress;
			chapterProgress = page.chapterProgress;
		}

		let newBookmark = {
			path: path.replace(/\?page=[0-9]+$/, ''),
			index: imagesPath[path],
			ebook: readingIsEbook,
			progress: progress,
			chapterProgress: chapterProgress,
		};

		if(typeof readingCurrentBookmarks !== 'undefined')
		{
			let i = isBookmark(path, true);

			if(i !== false)
			{
				readingCurrentBookmarks.splice(i, 1);
				activeBookmark(false);
			}
			else
			{
				readingCurrentBookmarks.push(newBookmark);
				activeBookmark(true);
			}
		}
		else
		{
			readingCurrentBookmarks = [newBookmark];
			activeBookmark(true);
		}

		storage.updateVar('bookmarks', dom.indexMainPathA(), readingCurrentBookmarks);
	}
}

function deleteBookmark(key)
{
	readingCurrentBookmarks.splice(key, 1);
	storage.updateVar('bookmarks', dom.indexMainPathA(), readingCurrentBookmarks);

	loadBookmarks(true);
}

var saveReadingProgressA = false, fromSkip = false;

function setFromSkip()
{
	fromSkip = true;
}

//Save current reading progress
function saveReadingProgress(path = false, mainPath = false)
{
	if(!onReading || !isLoaded)
		return;

	if(!saveReadingProgressA)
		return;

	if(!path)
	{
		let imageIndex = false;

		let newIndex = (currentIndex - 1);

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

	if(mainPath === false)
	{
		mainPath = dom.indexMainPathA();

		// Save also the current folder progress
		if(mainPath !== p.dirname(path))
			saveReadingProgress(path, p.dirname(path));
	}

	let progress = 0;
	let chapterIndex = 0;
	let chapterProgress = 0;

	if(readingIsEbook)
	{
		let imageIndex = imagesDistribution[currentIndex - 1][0].index;
		let page = _ebook.pages[imageIndex - 1];

		progress = page.progress;
		chapterIndex = page.chapterIndex;
		chapterProgress = page.chapterProgress;
	}

	storage.updateVar('readingProgress', mainPath, {
		index: imagesPath[path],
		path: path.replace(/\?page=[0-9]+$/, ''),
		lastReading: +new Date(),
		ebook: readingIsEbook,
		progress: progress,
		chapterIndex: chapterIndex,
		chapterProgress: chapterProgress,
	});

	dom.indexPathControlUpdateLastComic(path);

	return true;
}

var saveReadingProgressSI = false;

function startSaveReadingProgressSI()
{
	clearTimeout(saveReadingProgressSI);

	saveReadingProgressSI = setInterval(saveReadingProgress, 60 * 2 * 1000); // Save every 2 minutes
}

//Load the bookmarks in the current directory
function loadBookmarks(bookmarksChild = false)
{
	var bookmarksPath = {}, mainPath = dom.indexMainPathA();

	let images = [];

	for(let key in readingCurrentBookmarks)
	{
		if(typeof readingCurrentBookmarks[key].path != 'undefined')
		{
			let bookmark = readingCurrentBookmarks[key];

			let bookmarkDirname = p.dirname(bookmark.path);

			if(typeof bookmarksPath[bookmarkDirname] === 'undefined') bookmarksPath[bookmarkDirname] = [];

			let sha = sha1(bookmark.path);
			images.push({path: bookmark.path, sha: sha});

			let name = p.basename(bookmark.path);
			let chapterIndex = app.extract(/^([0-9]+)\_sortonly/, name, 1);

			bookmarksPath[bookmarkDirname].push({
				key: key,
				name: dom.translatePageName(decodeURI(p.basename(bookmark.path).replace(/\.[^\.]*$/, ''))),
				index: (bookmarkDirname !== readingCurrentPath) ? bookmark.index : imagesPath[bookmark.path],
				sha: sha,
				mainPath: mainPath,
				path: bookmark.path,
				chapterIndex: chapterIndex,
				ebook: bookmark.ebook,
				progress: bookmark.progress,
				chapterProgress: bookmark.chapterProgress,
			});
		}
	}

	let bookmarks = [];

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
			name: dom.metadataPathName({path: path, name: p.basename(path)}, true),
			bookmarks: bookmarksPath[path],
		});
	}

	let readingProgress = storage.getKey('readingProgress', dom.indexMainPathA());

	if(readingProgress)
	{
		let bookmarkDirname = p.dirname(readingProgress.path);

		let sha = sha1(readingProgress.path);
		images.push({path: readingProgress.path, sha: sha});

		bookmarks.push({
			continueReading: true,
			current: (bookmarkDirname === readingCurrentPath) ? true : false,
			path: bookmarkDirname,
			name: dom.metadataPathName({path: bookmarkDirname, name: p.basename(bookmarkDirname)}, true),
			bookmarks: [{
				name: dom.translatePageName(decodeURI(p.basename(readingProgress.path).replace(/\.[^\.]*$/, ''))),
				index: readingProgress.index,
				sha: sha,
				mainPath: readingProgress.mainPath,
				path: readingProgress.path,
				ebook: readingProgress.ebook,
				progress: readingProgress.progress,
				chapterIndex: readingProgress.chapterIndex,
				chapterProgress: readingProgress.chapterProgress,
			}],
		});
	}

	let thumbnails = cache.returnThumbnailsImages(images, function(data) {

		dom.addImageToDom(data.sha, data.path);

	}, readingFile);

	for(let i = 0, len = bookmarks.length; i < len; i++)
	{
		for(let i2 = 0, len2 = bookmarks[i].bookmarks.length; i2 < len2; i2++)
		{
			let thumbnail = thumbnails[bookmarks[i].bookmarks[i2].sha] || {};
			bookmarks[i].bookmarks[i2].thumbnail = (thumbnail.cache) ? thumbnail.path : '';
		}
	}

	bookmarks.sort(function (a, b) {

		if(a.current || a.continueReading) return -1;

		if(b.current && !a.continueReading) return 1;

		return dom.orderBy(a, b, 'simple', 'path');
	});

	handlebarsContext.bookmarks = bookmarks;
	handlebarsContext.bookmarksChild = bookmarksChild;

	dom.query(!bookmarksChild ? '#collections-bookmark .menu-simple' : '#collections-bookmark .menu-simple > div').html(template.load('reading.elements.menus.collections.bookmarks.html'));
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

function loadReadingPages(key = false, edit = false, tab = 'page-layout')
{
	loadReadingConfig(key);

	handlebarsContext.readingPagesTab = tab;

	handlebarsContext.readingGlobalConfigName = config.readingConfigName ? config.readingConfigName : language.reading.pages.readingGlobal;

	handlebarsContext.readingShortcutPagesConfig = storage.get('readingShortcutPagesConfig');

	handlebarsContext.editReadingShortcutPagesConfig = edit;

	filters.processContext();
	readingEbook.processContext();

	let menuSimpleContent = document.querySelector('#reading-pages .menu-simple-content');
	menuSimpleContent.innerHTML = template.load('reading.elements.menus.pages.html');

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
		events.desactiveMenu('#reading-pages', '.bar-right-buttons .button-page-layout, .bar-right-buttons .button-filters');
}

function editReadingShortcutPagesConfig(event, key = 0)
{
	event.stopPropagation();

	let selectTab = document.querySelector('#reading-pages .tabs > div > div.active').dataset.name;

	loadReadingPages(key, true, selectTab);

	reading.changePagesView(0);

	loadReadingPages(key, true, selectTab);

	filters.apply();
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

			let selectTab = document.querySelector('#reading-pages .tabs > div > div.active').dataset.name;

			loadReadingPages(key, true, selectTab);
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
					text: language.buttons.save,
					function: 'events.closeDialog(); reading.editReadingShortcutPagesConfigName('+key+', true);',
				}
			],
		});

		events.focus('.input-config-name');
		events.eventInput();
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

			events.closeDialog();
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
					text: language.buttons.save,
					function: 'reading.newReadingShortcutPagesConfig(true);',
				}
			],
		});

		events.focus('.input-config-name');
		events.eventInput();
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
		let selectTab = document.querySelector('#reading-pages .tabs > div > div.active').dataset.name;
		reading.loadReadingPages(false, false, selectTab);
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

	$('#tracking-sites .menu-simple-content').html(template.load('reading.elements.menus.tracking.sites.html'));
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

var generateEbookPagesDelayedST = false, generateEbookPagesCancel = false;

function generateEbookPagesDelayed()
{
	if(!readingIsEbook) return;

	clearTimeout(generateEbookPagesDelayedST);
	generateEbookPagesCancel = true;

	ebook.createRenders(_ebook.chaptersPages ? _ebook.chaptersPages.length : 1);

	generateEbookPagesDelayedST = setTimeout(function(){

		generateEbookPagesCancel = false;
		generateEbookPages(false, true);

	}, 300);
}

function readingMargin(data = false)
{
	if(readingIsEbook && _config.readingEbook.integrated)
	{
		return {
			margin: 0,
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		};
	}
	else
	{
		return {
			margin: data && data.margin !== undefined ? data.margin : _config.readingMargin.margin,
			top: _config.readingWebtoon ? 0 : (data && data.top !== undefined ? data.top : _config.readingMargin.top),
			bottom: _config.readingWebtoon ? 0 : (data && data.bottom !== undefined ? data.bottom : _config.readingMargin.bottom),
			left: data && data.left !== undefined ? data.left : _config.readingMargin.left,
			right: data && data.right !== undefined ? data.right : _config.readingMargin.right,
		};
	}
}

function readingHorizontalsMargin(data = false)
{
	if(readingIsEbook && _config.readingEbook.integrated)
	{
		return {
			margin: 0,
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		};
	}
	else
	{
		return {
			margin: data && data.horizontalsMargin !== undefined ? data.horizontalsMargin : _config.readingHorizontalsMargin.margin,
			top: _config.readingWebtoon ? 0 : (data && data.horizontalsTop !== undefined ? data.horizontalsTop : _config.readingHorizontalsMargin.top),
			bottom: _config.readingWebtoon ? 0 : (data && data.horizontalsBottom !== undefined ? data.horizontalsBottom : _config.readingHorizontalsMargin.bottom),
			left: data && data.horizontalsLeft !== undefined ? data.horizontalsLeft : _config.readingHorizontalsMargin.left,
			right: data && data.horizontalsRight !== undefined ? data.horizontalsRight : _config.readingHorizontalsMargin.right,
		};
	}
}

function readingImageClip()
{
	if(readingIsEbook)
	{
		return {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0
		};
	}
	else
	{
		return _config.readingImageClip;
	}
}

var onLoadCallback = false, onLoadPromise = false, isLoaded = false;

async function isLoad()
{
	let readingHeaderLoading = template._barHeader().querySelector('.reading-header-loading');
	if(readingHeaderLoading) readingHeaderLoading.classList.remove('reading-header-loading');

	if(onLoadCallback) onLoadCallback();
	onLoadCallback = false;

	if(onLoadPromise)
		onLoadPromise.resolve();

	onLoadPromise = false;
	isLoaded = true;
}

function onLoad(callback)
{
	onLoadCallback = callback;
}

var _ebook = false;

async function getEbookConfig(configReadingEbook = false)
{
	configReadingEbook = configReadingEbook || _config.readingEbook;

	let rect = template._contentRight().getBoundingClientRect();

	if(rect.width == 0 || rect.height == 0)
	{
		for(let i = 0; i < 100; i++)
		{
			await app.sleep(20);

			rect = template._contentRight().getBoundingClientRect();

			if(rect.width != 0 && rect.height != 0)
				break;
		}
	}

	let renderZone = {
		width: ((rect.width - (readingMargin().left * (readingDoublePage() ? 3 : 2))) / (readingDoublePage() ? 2 : 1)) - (readingViewIs('scroll') ? 12 : 0),
		height: (rect.height - (readingMargin().top * 2)),
	};

	let width = 0;
	let height = 0;

	let integratedMode = configReadingEbook.integrated;
	let ratio = configReadingEbook.ratio;

	if(!integratedMode && ratio > 0.4)
	{
		if(renderZone.height / renderZone.width > ratio)
		{
			width = renderZone.width;
			height = renderZone.width * ratio;
		}
		else
		{
			width = renderZone.height / ratio;
			height = renderZone.height;
		}
	}
	else
	{
		width = renderZone.width;
		height = renderZone.height;
	}

	let maxWidth = configReadingEbook.maxWidth;
	let minMargin = configReadingEbook.minMargin;
	let verticalMargin = (readingViewIs('scroll') && !readingDoublePage()) ? 0 : configReadingEbook.verticalMargin;

	let horizontalMargin = Math.round((width - maxWidth) / 2);

	if(horizontalMargin < minMargin)
		horizontalMargin = minMargin;

	return {
		width: width,
		height: height,
		colors: readingEbook.getThemeColors(configReadingEbook.colorsTheme),
		fontFamily: configReadingEbook.fontFamily,
		fontSize: configReadingEbook.fontSize,
		fontWeight: configReadingEbook.fontWeight,
		italic: configReadingEbook.italic,
		textAlign: configReadingEbook.textAlign,
		margin: {
			top: verticalMargin,
			right: horizontalMargin,
			bottom: verticalMargin,
			left: horizontalMargin,
		},
		letterSpacing: configReadingEbook.letterSpacing,
		wordSpacing: configReadingEbook.wordSpacing,
		pSpacing: configReadingEbook.pSpacing,
		pLineHeight: configReadingEbook.pLineHeight,
		lineHeight: configReadingEbook.lineHeight,
	};
}

async function updateEbook(save)
{
	if(save)
		generateEbookPagesDelayed();
}

async function fastUpdateEbookPages(readingEbook = false, resize = false)
{
	if(!readingIsEbook) return;

	let ebookConfig = await getEbookConfig(readingEbook);

	for(let index in imagesData)
	{
		imagesData[index].width = ebookConfig.width;
		imagesData[index].height = ebookConfig.height;
		imagesData[index].aspectRatio = ebookConfig.width / ebookConfig.height;
	}

	if(resize)
	{
		disposeImages();
		calculateView();
		stayInLine();
	}

	if(_ebook)
	{
		_ebook.updateConfig(ebookConfig);
		render.setEbookConfigChanged(ebookConfig);

		let iframes = template._contentRight().querySelectorAll('oc-img iframe');

		for(let i = 0, len = iframes.length; i < len; i++)
		{
			let iframe = iframes[i];
			await _ebook.applyConfigToHtml(iframe.contentDocument);
		}
	}
}

var hasGenerateEbookPages = false;

async function generateEbookPages(end = false, reset = false, fast = false, imagePath = false, first = false)
{
	// Avoid running multiple times at the same time
	if(hasGenerateEbookPages)
	{
		hasGenerateEbookPages = 1;

		return;
	}
	else if(!nextOpenChapterProgress && imagesDistribution && imagesDistribution[0] && !imagePath)
	{
		const doublePage = imagesDistribution[0].length > 1 ? true : false;

		let index = currentIndex;

		if(doublePage && !readingDoublePage())
			index = Math.ceil(index / 2);

		let imageIndex = imagesDistribution[index - 1][0].index;
		let page = _ebook.pages[imageIndex - 1];

		let chapterIndex = page.chapterIndex;
		let chapterProgress = page.chapterProgress;

		setNextOpenChapterProgress(chapterIndex, chapterProgress);
	}

	hasGenerateEbookPages = true;

	let ebookConfig = await getEbookConfig();
	let ebookPages = await readingFileC.ebookPages(ebookConfig);

	if(hasGenerateEbookPages === 1) // Priorize last generateEbookPages request
	{
		hasGenerateEbookPages = false;
		generateEbookPages(end, reset, fast);
	}
	else if(!generateEbookPagesCancel)
	{
		images = {}, imagesData = {}, imagesDataClip = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, pageRangeHistory = [];

		let comics = [];

		for(let i = 0, len = ebookPages.pages.length; i < len; i++)
		{
			let page = ebookPages.pages[i];
			let index = i + 1;
			let path = page.path+'?page='+i;

			images[index] = {index: index, path: path};
			imagesPath[path] = index;

			imagesData[index] = {width: ebookConfig.width, height: ebookConfig.height, aspectRatio: (ebookConfig.width / ebookConfig.height), name: page.name};

			comics.push({
				index: i + 1,
				sha: sha1(path),
				name: ''.replace(/\.[^\.]*$/, ''),
				image: '',
				path: path,
				mainPath: '', // mainPath,
				size: false,
				canvas: false,
				ebook: true,
				folder: false,
			});
		}

		_ebook = await readingFileC.ebook();

		if(reset)
			await render.reset();
		else
			await render.setFile(readingFileC, false, 'ebook');

		render.setImagesData(imagesData);
		filters.setImagesPath(imagesPath, readingCurrentPath);

		setCurrentComics(comics);

		imagesNum = contentNum = ebookPages.pages.length;

		addHtmlImages();
		disposeImages();
		calculateView(first);

		handlebarsContext.ebookLandmarks = ebookPages.landmarks;
		handlebarsContext.ebookToc = ebookPages.toc;
		handlebarsContext.ebookPages = imagesNum;
		template.loadContentLeft('reading.content.left.ebook.html', true);
		template._contentLeft().firstElementChild.style.height = 'calc(100% - 66px)';
		events.eventRange();

		// await render.render(currentIndex);

		if(imagePath)
		{
			let imageName = p.basename(imagePath);
			let chapterIndex = app.extract(/^([0-9]+)\_sortonly/, imageName, 1);

			currentIndex = _ebook.chaptersPagesInfo[chapterIndex].startPage + 1;
		}

		currentIndex = imagesData[currentIndex].position + 1;

		let newIndex = currentIndex;

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) + 1;

		if(nextOpenChapterProgress)
			goToChapterProgress(nextOpenChapterProgress.chapterIndex, nextOpenChapterProgress.chapterProgress, false);
		else
			goToIndex(newIndex, false, end, end);

		if(readingViewIs('scroll'))
			getPreviusContentSize();

		setTimeout(function(){onScroll.call(template._contentRight().firstElementChild)}, 500);

		reading.isLoad();
	}

	hasGenerateEbookPages = false;
}

// Events functions

var contentLeftRect = false, contentRightRect = false, barHeaderRect = false, touchevents = {active: false, start: false, distance: 0, scale: 0, maxTouches: 0, numTouches: 0, touches: [], touchesXY: [], type: 'move'};

function pointermove(event)
{
	let pageX = app.pageX(event);
	let pageY = app.pageY(event);

	currentMousePosition = {
		pageX: pageX,
		pageY: pageY,
	};

	if(haveZoom) // Drag Image zoom
	{
		if(contentRightRect === false)
		{
			contentRightRect = template._contentRight().getBoundingClientRect();
			let _contentRightRect = template._contentRight().firstElementChild.firstElementChild.getBoundingClientRect();
			contentRightRect.width = _contentRightRect.width;
		}

		if(config.readingMoveZoomWithMouse && (!readingViewIs('scroll') || config.readingScrollWithMouse) && event instanceof PointerEvent)
		{
			if(pageX > contentRightRect.left && pageY > contentRightRect.top)
			{
				event.preventDefault();

				let withLimits = notCrossZoomLimits(0, 0);

				let widthM = contentRightRect.width / 2;
				let heightM = contentRightRect.height / 2;

				// Calculate multipler (1.5) from withLimits.height and withLimits.width
				let x = -(pageX - zoomMoveData.x) * (withLimits.maxX / widthM * 1.5);
				let y = -(pageY - zoomMoveData.y) * (withLimits.maxY / heightM * 1.5);

				dragZoom(x, y);

				scalePrevData.tranX = zoomMoveData.tranX;
				scalePrevData.tranY = zoomMoveData.tranY;
			}
		}
		else if(zoomMoveData.active && !(event instanceof TouchEvent))
		{
			event.preventDefault();

			let x = pageX - zoomMoveData.x;
			let y = pageY - zoomMoveData.y;

			dragZoom(x, y);
		}
	}

	if(touchevents.active && event instanceof TouchEvent)
	{
		let touches = event.touches;

		// Simulate touch with 2 fingers
		//if(event.ctrlKey)
		//	touches = [event.touches[0], touchevents.touches[1] || touchevents.touches[0]];

		let numTouches = touches.length;

		if(numTouches > touchevents.maxTouches)
			touchevents.maxTouches = numTouches;

		if(!touchevents.start)
		{
			let touchesXY = app.touchesXY(event);
			let maxDiff = Math.max(...app.touchesDiff(touchevents.touchesXY, touchesXY));

			if(maxDiff > 10)
			{
				let content = template._contentRight().firstElementChild;
				let rect = content.getBoundingClientRect();

				touchevents.start = true;
				touchevents.type = numTouches > 1 || haveZoom || readingViewIs('scroll') ? 'zoom' : 'move';
				touchevents.touches = touches;
				touchevents.numTouches = numTouches;
				touchevents.contentRect = rect;
				touchevents.distance = numTouches > 1 ? app.distance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY) : 0;

				touchevents.speed = [{
					time: performance.now(),
					pageX: app.pageX(event),
				}];

				if(readingViewIs('compact'))
					pageTransitions.touchstart(event, touchevents);
			}
		}

		if(touchevents.start)
		{
			let contentRight = template._contentRight();

			if(touchevents.type == 'move')
			{
				let pageX = app.pageX(event);

				let left = (touchevents.contentRect.width * (currentIndex - 1));
				left = left - (pageX - app.pageX(touchevents));

				if(left < 0)
					left = 0;
				else if(left > (contentNum - 1) * touchevents.contentRect.width)
					left = (contentNum - 1) * touchevents.contentRect.width;

				if(readingViewIs('compact'))
				{
					if(left != 0 && left != (contentNum - 1) * touchevents.contentRect.width)
						pageTransitions.touchmove(event, touchevents);
				}
				else
				{
					dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).css({
						transition: '0s',
						transform: 'translate('+(-left)+'px, 0)',
					});
				}

				if(touchevents.speed.length > 2)
					touchevents.speed.shift();

				touchevents.speed.push({
					time: performance.now(),
					pageX: pageX,
				});
			}
			else if(touchevents.type == 'zoom')
			{
				if(numTouches > 1 && touchevents.numTouches > 1)
				{
					let distance = app.distance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);

					let scale = distance / touchevents.distance * currentScale;
					touchevents.scale = scale;

					let pageX = ((touches[0].pageX - touches[1].pageX) / 2) + touches[1].pageX;
					let pageY = ((touches[0].pageY - touches[1].pageY) / 2) + touches[1].pageY;

					currentPageXY.x = pageX;
					currentPageXY.y = pageY;

					//x = pageX - ((touchevents.touches[0].pageX - touchevents.touches[1].pageX) + touchevents.touches[0].pageX);
					//y = pageY - ((touchevents.touches[0].pageY - touchevents.touches[1].pageY) + touchevents.touches[0].pageY);

					//dragZoom(x, y);
					applyScale(false, scale);
				}
				else if(touchevents.numTouches == 1 && haveZoom)
				{
					let x = app.pageX(event) - app.pageX(touchevents);
					let y = app.pageY(event) - app.pageY(touchevents);

					dragZoom(x, y);
				}
			}
		}

		contentLeftRect = false;
		contentRightRect = false;
		barHeaderRect = false;
	}

	if(readingDragScroll) // Drag to scroll
	{
		event.preventDefault();

		if(!readingDragScroll.start)
		{
			readingDragScroll.start = true;

			dom.query('body').addClass('dragging');
		}

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
		if(pageY < 96)
		{
			if(hiddenBarHeader && !shownBarHeader && !shownContentLeft && !hideContentRunningST)
			{
				hideContentST = setTimeout(function(){

					dom.query('.bar-header').addClass('show');
					reading.setShownBarHeader(true);

				}, 300);

				hideContentRunningST = true;
			}
		}
		else if(pageX < 96)
		{
			if(hiddenContentLeft && !shownContentLeft && !shownBarHeader && !hideContentRunningST)
			{
				hideContentST = setTimeout(function(){

					dom.query('.content-left').addClass('show');
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

		if(contentLeftRect === false)
		{
			barHeaderRect = template._barHeader().getBoundingClientRect();
			contentLeftRect = template._contentLeft().getBoundingClientRect();
		}

		if(shownBarHeader && pageY > barHeaderRect.height + titleBar.height() + 48 && !document.querySelector('.menu-simple.a'))
		{
			clearTimeout(hideContentST);

			dom.query('.bar-header').removeClass('show');
			reading.setShownBarHeader(false);

			hideContentRunningST = false;
		}

		if(shownContentLeft && pageX > contentLeftRect.width + 48)
		{
			clearTimeout(hideContentST);

			dom.query('.content-left').removeClass('show');
			reading.setShownContentLeft(false);

			hideContentRunningST = false;
		}
	}
}

function mousedown(event)
{
	if(haveZoom)
	{
		if((!config.readingMoveZoomWithMouse || !(event instanceof MouseEvent)) || (readingViewIs('scroll') && !config.readingScrollWithMouse))
		{
			if(!(event instanceof TouchEvent))
				event.preventDefault();

			zoomMoveData = {
				x: app.pageX(event),
				y: app.pageY(event),
				active: true,
			};

			dom.query('body').addClass('dragging');
		}
	}

	if(event instanceof TouchEvent)
	{
		if(!event.target.closest('.reading-lens'))
		{
			if(!touchevents.active)
			{
				touchevents.active = true;
				touchevents.start = false;
				touchevents.touches = event.touches;
				touchevents.touchesXY = app.touchesXY(event);
				touchevents.maxTouches = event.touches.length;
			}
			else
			{
				let len = event.touches.length;

				if(len > touchevents.maxTouches)
				{
					let touches = [];

					for(let i = 0, _len = touchevents.touches.length; i < _len; i++)
					{
						touches.push(touchevents.touches[i]);
					}

					for(let i = touchevents.touches.length; i < len; i++)
					{
						touches.push(event.touches[i]);
					}

					touchevents.touchesXY = app.touchesXY({touches: touches});
					touchevents.touches = touches;
					touchevents.maxTouches = len;
				}
			}
		}
	}
}

function mouseenter()
{
	isMouseenter.document = true;
}

function mouseleave()
{
	isMouseenter.document = false;
}

var touchTimeout, mouseout = {lens: false, body: false, window: false}, isMouseenter = {document: true}, touchStart = false, magnifyingGlassOffset = false, readingCurrentPath = false, readingCurrentBookmarks = undefined, zoomMoveData = {}, magnifyingGlassScroll = {scrollTop: false, time: 0}, readingDragScroll = false, gamepadScroll = false, readingIsCanvas = false, readingIsEbook = false, readingFile = false, readingFileC = false, gamepadAxesNow = 0, scrollInStart = false, scrollInEnd = false, trackingCurrent = false;

//It starts with the reading of a comic, events, argar images, counting images ...
async function read(path, index = 1, end = false, isCanvas = false, isEbook = false, imagePath = false)
{
	images = {}, imagesData = {}, imagesDataClip = {}, imagesPath = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = index, foldersPosition = {}, currentScale = 1, currentZoomIndex = false, previousScrollTop = 0, scalePrevData = {tranX: 0, tranX2: 0, tranY: 0, tranY2: 0, scale: 1, scrollTop: 0}, originalRect = false, scrollInStart = false, scrollInEnd = false, prevChangeHeaderButtons = {}, trackingCurrent = false, pageRangeHistory = [];

	isLoaded = false;
	magnifyingGlassPosition.mode = false;

	loadReadingConfig(currentReadingConfigKey);

	if(!fromSkip)
		saveReadingProgressA = false;

	fromSkip = false;

	readingCurrentPath = path;

	if(typeof storage.get('bookmarks') !== 'undefined' && typeof storage.get('bookmarks')[dom.indexMainPathA()] !== 'undefined')
		readingCurrentBookmarks = storage.get('bookmarks')[dom.indexMainPathA()];
	else
		readingCurrentBookmarks = undefined;

	filters.setImagesPath(false);

	if(!isEbook)
		goToImageCL(index, false);

	$(window).off('keydown touchstart touchend mouseup mousemove touchmove mouseout click');
	template.contentRight().off('mousewheel');
	$('.reading-body, .reading-lens').off('mousemove');
	$('.reading-lens').off('mousemove');
	$('.reading-body').off('mouseout mouseenter mousedown touchstart touchmove');
	$('.content-right > div > div').off('scroll');

	events.eventHover();

	onReading = _onReading = true;

	let resolve = false;
	let promise = new Promise(function(_resolve){
		resolve = _resolve;
	});
	onLoadPromise = {promise: promise, resolve: resolve};

	template.contentRight().on('mousewheel', function(e) {

		if(onReading && isLoaded)
		{
			if(e.originalEvent.ctrlKey || !readingViewIs('scroll'))
			{
				e.preventDefault();

				if(e.originalEvent.wheelDelta / 120 > 0)
					reading.zoomIn();
				else
					reading.zoomOut();
			}
			else
			{
				if(reading.scrollNextOrPrevComic(e.originalEvent.wheelDelta / 120 > 0, true))
					e.preventDefault();
			}
		}

	});

	template.contentRight('.reading-lens').on('mousewheel', function(e) {

		if(onReading && isLoaded && (!haveZoom || !e.originalEvent.ctrlKey) && readingViewIs('scroll'))
		{
			e.preventDefault();

			var content = template.contentRight().children();

			if(Date.now() - magnifyingGlassScroll.time < 300)
				var scrollTop = magnifyingGlassScroll.scrollTop;
			else
				var scrollTop = content.scrollTop();

			if(e.originalEvent.wheelDelta / 120 > 0)
				scrollTop -= 120;
			else
				scrollTop += 120;

			magnifyingGlassScroll = {
				scrollTop: scrollTop,
				time: Date.now(),
			};

			content.stop(true).animate({scrollTop: scrollTop+'px'}, 200);
		}

	});

	template.contentRight('.reading-body, .reading-lens').on('pointerdown', function(e) {

		if(onReading && isLoaded && (!haveZoom || config.readingGlobalZoom) && !config.readingScrollWithMouse && readingViewIs('scroll'))
		{
			if(e.originalEvent.pointerType != 'touch' && e.originalEvent.button >= 0 && e.originalEvent.button <= 2)
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

	let afterZoomingIn = false;

	gamepad.setAxesEvent('reading', function(axes, status, now) {

		if(onReading && isLoaded && !document.querySelector('.menu-simple.a'))
		{
			if(status == 'start')
				gamepadAxesNow = 0;

			if(haveZoom)
			{
				if(!zoomingIn)
				{
					if(status == 'start' || afterZoomingIn)
					{
						zoomMoveData = {
							x: 0,
							y: 0,
							active: true,
						};

						afterZoomingIn = false;
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

						const diff = dragZoom(x, y);

						zoomMoveData.x -= diff.x;
						zoomMoveData.y -= diff.y;
					}
					else // status == 'end'
					{
						dragZoomEnd();
					}
				}
				else
				{
					afterZoomingIn = true;
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

					reading.scrollNextOrPrevComic(y < 0 ? true : false, true);
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

		if(onReading && isLoaded && !document.querySelector('.menu-simple.a'))
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

	app.event(document, 'mouseenter', mouseenter);
	app.event(document, 'mouseleave', mouseleave);

	$(window).on('touchstart', function(e) {

		if(onReading && isLoaded && config.readingMagnifyingGlass)
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

		if(onReading && isLoaded && config.readingMagnifyingGlass && !readingTouchEvent)
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

	});

	template.contentRight('.reading-body').on('mouseout', function(e) {

		if(onReading && isLoaded && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseout.body = true;

			if(mouseout.lens) magnifyingGlassControl(0, e);
		}

	});

	template.contentRight('.reading-body').on('mouseenter', function(e) {

		if(onReading && isLoaded && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseout.body = false;
		}

	});

	$(window).on('mouseout', function(e) {

		if(onReading && isLoaded && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseout.lens = true;

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

	});

	template.contentRight('.reading-lens').on('mouseenter', function(e) {

		if(onReading && isLoaded && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseout.lens = false;
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

		if(onReading && isLoaded && config.readingMagnifyingGlass && !haveZoom)
		{
			let readingLens = template.contentRight('.reading-lens');

			let xLess = x - (magnifyingGlassOffset.left + (readingLens.width() / 2));
			let yLess = y - (magnifyingGlassOffset.top + (readingLens.height() / 2));

			pageX = pageX - xLess;
			pageY = pageY - yLess;

			magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}});
		}

	});

	app.event('.reading-body, .reading-lens', 'mousedown touchstart', mousedown);
	app.event(window, 'pointermove touchmove', pointermove);

	$(window).on('mouseup touchend', function(e) {

		if(e.originalEvent instanceof TouchEvent)
		{
			if(e.originalEvent.touches.length == 0)
			{
				if(touchevents.active)
				{
					if(touchevents.start)
					{
						if(touchevents.type == 'move')
						{
							let first = touchevents.speed[0];
							let last = touchevents.speed[touchevents.speed.length-1];

							let dragSpeed = (first.pageX - last.pageX) / ((performance.now() - first.time) / 1000);

							if(Math.abs(dragSpeed) > 120)
							{
								if(dragSpeed > 0)
									reading.goNext();
								else
									reading.goPrev();
							}
							else
							{
								let diff = app.pageX(touchevents) - last.pageX;

								if(Math.abs(diff) > touchevents.contentRect.width / 2)
								{
									if(diff > 0)
										reading.goNext();
									else
										reading.goPrev();
								}
								else
								{
									goToIndex(currentIndex, true);
								}
							}
						}
						else if(touchevents.type == 'zoom' && touchevents.scale)
						{
							currentScale = touchevents.scale;
						}
					}
					else if(touchevents.maxTouches > 1)
					{
						let pageX = ((touchevents.touches[0].pageX - touchevents.touches[1].pageX) / 2) + touchevents.touches[1].pageX;
						let pageY = ((touchevents.touches[0].pageY - touchevents.touches[1].pageY) / 2) + touchevents.touches[1].pageY;

						currentPageXY.x = pageX;
						currentPageXY.y = pageY;

						reading.resetZoom(true, false, true, false);
					}
				}

				touchevents.start = false;
				touchevents.active = false;
			}
		}

		if(haveZoom && zoomMoveData.active)
			dragZoomEnd();
		
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
			}

			setTimeout(function(){reading.setReadingDragScroll(false)}, 10);
		}

		let dragging = document.querySelector('body.dragging');

		if(dragging)
			dragging.classList.remove('dragging');

	});

	$(window).on('click', function(e) {

		if(onReading && isLoaded && config.readingMagnifyingGlass && readingTouchEvent)
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

	app.event(window, 'resize', resized);

	$(window).on('mousewheel touchstart', function(e) {

		if(!zoomingIn)
			disableOnScroll(false);

	});

	template.contentRight().children('div').on('scroll', onScroll);

	const _images = handlebarsContext.comics;
	const len = _images.length;
	contentNum = len;

	imagesNum = 0;

	for(let i = 0; i < len; i++)
	{
		if(!_images[i].folder)
			imagesNum++;
	}

	readingIsCanvas = isCanvas;
	readingIsEbook = isEbook;

	if(readingFile) readingFile.destroy();
	if(readingFileC) readingFileC.destroy();

	readingFile = fileManager.file();
	readingFileC = false;

	render.setOnRender((readingDoublePage() ? 2 : 1), function(){

		const contentRight = template._contentRight();

		dom.this(contentRight).find('.loading').remove();
		dom.this(contentRight).find('.reading-body').css({opacity: 1});

	});

	if(isCanvas)
	{
		readingFileC = fileManager.fileCompressed(path);
		await render.setFile(readingFileC, (config.readingMagnifyingGlass ? config.readingMagnifyingGlassZoom : false));

		for(let i = 0; i < len; i++)
		{
			let image = _images[i];
			let index = +image.index;
			let width = +image.size.width;
			let height = +image.size.height;
			let path = image.path;

			images[index] = {index: index, path: path};
			imagesPath[path] = index;

			imagesData[index] = {width: width, height: height, aspectRatio: (width / height), name: image.name};
		}

		render.setImagesData(imagesData);
		filters.setImagesPath(imagesPath, readingCurrentPath);

		addHtmlImages();
		disposeImages();
		calculateView(true);

		currentIndex = imagesData[currentIndex].position + 1;

		var newIndex = currentIndex;

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) + 1;

		goToIndex(newIndex, false, end, end);

		if(readingViewIs('scroll'))
			getPreviusContentSize();

		setTimeout(function(){onScroll.call(template._contentRight().firstElementChild)}, 500);

		reading.isLoad();
	}
	else if(isEbook)
	{
		readingFileC = fileManager.fileCompressed(path);
		await generateEbookPages(end, false, false, imagePath, true);
	}
	else
	{
		render.setFile(false, (config.readingMagnifyingGlass ? config.readingMagnifyingGlassZoom : false), 'images');

		const sizes = await image.getSizes(_images);

		for(let i = 0; i < len; i++)
		{
			const image = _images[i];
			const size = sizes[i];

			if(size)
			{
				if(_config.readingRotateHorizontals && size.width > size.height)
					imagesData[image.index] = {width: size.height, height: size.width, aspectRatio: (size.height / size.width), rotated: true};
				else
					imagesData[image.index] = {width: size.width, height: size.height, aspectRatio: (size.width / size.height), rotated: false};

				images[image.index] = {index: image.index, path: image.path};
				imagesPath[image.path] = image.index;
			}
		}

		render.setImagesData(imagesData);
		filters.setImagesPath(imagesPath, readingCurrentPath);

		addHtmlImages();
		disposeImages();
		calculateView(true);

		currentIndex = imagesData[currentIndex] ? (imagesData[currentIndex].position + 1) : currentIndex;

		var newIndex = currentIndex;

		if(_config.readingManga && !readingViewIs('scroll'))
			newIndex = (indexNum - newIndex) + 1;

		goToIndex(newIndex, false, end, end);

		if(readingViewIs('scroll'))
			getPreviusContentSize();

		setTimeout(function(){onScroll.call(template._contentRight().firstElementChild)}, 500);

		reading.isLoad();
	}

	template.contentRight().children('div').css({scrollbarGutter: readingViewIs('scroll') ? '' : 'initial'});
	
	if(!config.readingTrackingAtTheEnd)
	{
		trackingCurrent = true;
		tracking.track();
	}

	startScrollWithMouse();

	filters.apply();

	startSaveReadingProgressSI();
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
	goToPage: goToPage,
	goToImage: goToImage,
	goToFolder: goToFolder,
	goToIndex: function(v1, v2, v3, v4){readingDirection = true; calculateRealReadingDirection(v1); goToIndex(v1, v2, v3, v4)},
	goToChapterProgress: goToChapterProgress,
	setNextOpenChapterProgress: setNextOpenChapterProgress,
	goStart: goStart,
	goPrevious: goPrevious,
	goPrev: goPrevious,
	goPrevComic: goPrevComic,
	goNext: goNext,
	goEnd: goEnd,
	goNextComic: goNextComic,
	pageRange: pageRange,
	goBackPageRangeHistory: goBackPageRangeHistory,
	goPageDialog: goPageDialog,
	abortClick: abortClick,
	leftClick: leftClick,
	rightClick: rightClick,
	zoomIn: zoomIn,
	zoomOut: zoomOut,
	zoomUp: zoomUp,
	zoomDown: zoomDown,
	zoomLeft: zoomLeft,
	zoomRight: zoomRight,
	resetZoom: resetZoom,
	dragZoom: dragZoom,
	fixBlurOnZoom: fixBlurOnZoom,
	applyScale: applyScale,
	activeMagnifyingGlass: activeMagnifyingGlass,
	changeMagnifyingGlass: changeMagnifyingGlass,
	changePagesView: changePagesView,
	change: change,
	magnifyingGlassControl: magnifyingGlassControl,
	addHtmlImages: addHtmlImages,
	disposeImages: disposeImages,
	calculateView: calculateView,
	stayInLine: stayInLine,
	setCurrentComics: setCurrentComics,
	currentComics: function(){return currentComics},
	readingView: readingView,
	readingViewIs: readingViewIs,
	readingDirection: function(){return readingDirection},
	realReadingDirection: function(){return realReadingDirection},
	disableOnScroll: disableOnScroll,
	activeOnScroll: function(){return activeOnScroll},
	saveReadingProgress: saveReadingProgress,
	saveReadingProgressA: function(){return saveReadingProgressA},
	setFromSkip: setFromSkip,
	createAndDeleteBookmark: createAndDeleteBookmark,
	deleteBookmark: deleteBookmark,
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
	scrollNextOrPrevComic: scrollNextOrPrevComic,
	hideContent: hideContent,
	hideContentLeft: hideContentLeft,
	hideBarHeader: hideBarHeader,
	setShownContentLeft: function(value){shownContentLeft = value},
	setShownBarHeader: function(value){shownBarHeader = value},
	loadReadingMoreOptions: loadReadingMoreOptions,
	currentScale: function(){return currentScale},
	rightSize: function(){return rightSize},
	zoomingIn: function(){return zoomingIn},
	updateReadingPagesConfig: updateReadingPagesConfig,
	readingFile: function(){return readingFile},
	fastUpdateEbookPages: fastUpdateEbookPages,
	generateEbookPagesDelayed: generateEbookPagesDelayed,
	isEbook: function(){return readingIsEbook},
	isCanvas: function(){return readingIsCanvas},
	setIsLoaded: function(value){isLoaded=value},
	isLoaded: function(value){return isLoaded},
	isLoad: isLoad,
	onLoad: onLoad,
	ebook: readingEbook,
	filters: filters,
	music: music,
	pageTransitions: pageTransitions,
	render: render,
};