
var images = {}, imagesData = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = 1;

function disposeImages(data)
{
	data = typeof data === 'undefined' ? false : data;

	var content = template.contentRight().children('div');
	var contentWidth = content.width() - (config.readingMargin.left + config.readingMargin.right + (data && typeof data.marginLeft !== 'undefined' ? data.marginLeft : 0));
	var contentHeight = content.height() - (config.readingMargin.bottom + config.readingMargin.top + (data && typeof data.marginTop !== 'undefined' ? data.marginTop : 0));
	var aspectRatio = contentWidth / contentHeight;

	if(config.readingViewAdjust == 'contain')
	{
		for(index in imagesData)
		{
			var image = imagesData[index];

			if(aspectRatio > image.aspectRatio)
			{
				$('.r-img-i'+index+' img').css({
					'height': contentHeight+'px',
					'width': (contentHeight * image.aspectRatio)+'px',
					'margin-left': ((contentWidth - contentHeight * image.aspectRatio) / 2 + config.readingMargin.left)+'px',
					'margin-top': config.readingMargin.top+'px'
				});
			}
			else
			{
				$('.r-img-i'+index+' img').css({
					'height': (contentWidth / image.aspectRatio)+'px',
					'width': contentWidth+'px',
					'margin-top': ((contentHeight - contentWidth / image.aspectRatio) / 2 + config.readingMargin.top)+'px',
					'margin-left': config.readingMargin.left+'px'
				});
			}
		}
	}
}

function calculateView()
{
	var content = $('.content-right .a').not('.to-remove').children('div');
	var contentWidth = content.width();

	if(config.readingView == 'slide')
	{
		$('.reading-body > div, .reading-lens > div > div').css({
			'width': (contentWidth * contentNum)+'px',
			'height': content.height(),
		});

		$('.r-img').css({
			'width': contentWidth+'px',
			'height': content.height(),
			'float': 'left',
		});

		/*for(index in imagesData)
		{
			var image = imagesData[index];

			$('.r-img-i'+index).css({
				'width': contentWidth+'px',
				'float': 'left',
			});
		}*/
	}
	else if(config.readingView == 'scroll')
	{
		$('.reading-body > div, .reading-lens > div > div').css({
			'width': '100%',
		});

		for(index in imagesData)
		{
			var image = imagesData[index];

			$('.r-img-i'+index).css({
				'width': contentWidth+'px',
				'float': 'none',
			});
		}
	}
}

function goToIndex(index, animation)
{
	animation = typeof animation === 'undefined' ? true : animation;

	var content = $('.content-right .a').not('.to-remove').children('div');
	var contentWidth = content.width();
	var contentHeight = content.height();

	if(config.readingView == 'slide')
	{
		$('.reading-body > div, .reading-lens > div > div').css({
			'transition': ((animation) ? config.readingViewSpeed : 0)+'s',
			'transform': 'translate(-'+(contentWidth * (index - 1))+'px, 0)',
		});
	}
	else if(config.readingView == 'scroll')
	{
		$('.reading-body > div, .reading-lens > div > div').scrollTop((contentHeight * (index - 1)));
	}

	var leftScroll = $('.r-l-i'+index).parent();
	var leftImg = $('.r-l-i'+index);

	$('.reading-left').removeClass('s');
	leftImg.addClass('s');

	var scrollTop = (((leftImg.offset().top + leftScroll.scrollTop()) - leftScroll.offset().top) + (leftImg.outerHeight() / 2)) - (leftScroll.height() / 2);

	if(scrollTop > 0 && scrollTop < (leftScroll[0].scrollHeight - leftScroll.height()))
	{
		leftScroll.scrollTop(scrollTop);
	}
	else if(scrollTop > 0)
	{
		leftScroll.scrollTop((leftScroll[0].scrollHeight - leftScroll.height()));
	}
	else
	{
		leftScroll.scrollTop(0);
	}

	currentIndex = index;
}

function goNext()
{
	var nextIndex = currentIndex + 1;

	if(currentIndex < 1)
		showPreviousComic(2);
	if(nextIndex <= contentNum)
		goToIndex(nextIndex, true)
	else if(nextIndex - 1 == contentNum && dom.nextComic())
		showNextComic(1);
}

function goPrevius()
{
	var previusIndex = currentIndex - 1;

	if(currentIndex > contentNum)
		showNextComic(2);
	else if(previusIndex > 0)
		goToIndex(previusIndex, true)
	else if(previusIndex == 0 && dom.previousComic())
		showPreviousComic(1);
}

function goStart()
{
	goToIndex(1, true)
}

function goEnd()
{
	goToIndex(contentNum, true)
}

function showNextComic(mode)
{
	if(mode == 1)
	{
		if(config.readingView == 'slide')
		{
			var skip = template.contentRight('.reading-skip-right');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(-100px, 0px)',
			});
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-bottom');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, -100px)',
			});
		}

		currentIndex++;
	}
	else
	{
		if(config.readingView == 'slide')
		{
			var skip = template.contentRight('.reading-skip-right');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 0px)',
			});
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-bottom');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 0px)',
			});
		}

		currentIndex--;
	}
}


function showPreviousComic(mode)
{
	if(mode == 1)
	{
		if(config.readingView == 'slide')
		{
			var skip = template.contentRight('.reading-skip-left');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(100px, 0px)',
			});
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-top');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 100px)',
			});
		}

		currentIndex--;
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
		}
		else if(config.readingView == 'scroll')
		{
			var skip = template.contentRight('.reading-skip-top');

			skip.css({
				'transition': config.readingViewSpeed+'s',
				'transform': 'translate(0px, 0px)',
			});
		}

		currentIndex++;
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

	var readingBody = $('.reading-body');

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
	else
	{
		magnifyingGlassControl(1, {pageX: pageX, pageY: pageY, originalEvent: {touches: false}}, {size: value});

		if(save) storage.updateVar('config', 'readingMagnifyingGlassSize', value);
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

		if(lensData && typeof lensData.size != 'undefined')
		{
			var lensWidth = lensData.size;
			var lensHeight = parseInt(lensData.size * 0.8);
		}
		else
		{
			var lensWidth = config.readingMagnifyingGlassSize;
			var lensHeight = parseInt(config.readingMagnifyingGlassSize * 0.8);
		}

		if(lensData && typeof lensData.zoom != 'undefined')
			var zoom = lensData.zoom;
		else
			var zoom = config.readingMagnifyingGlassZoom;

		var lensHeightM = parseInt(lensHeight / 2);
		var lensWidthM = parseInt(lensWidth / 2);

		var top = (y - lensHeightM);
		var left = (x - (lensWidth / 2));

		var topLens = y - $('.reading-body').offset().top - (lensHeightM / zoom);
		var leftLens = x - $('.reading-body').offset().left - lensWidthM;

		$('.reading-lens').css({
			'top': top+'px',
			'left': left+'px',
			'width': lensWidth+'px',
			'height': lensHeight+'px'
		}).removeClass('d').addClass('a');

		$('.reading-lens > div').css({
			'transform': ' scale('+zoom+') translate(' + (-(leftLens)) + 'px, ' + (-(topLens)) + 'px)'
		});

		magnifyingGlassView = true;

	}
	else
	{
		$('.reading-lens').removeClass('a').addClass('d');
		magnifyingGlassView = false;
	}

}

var touchTimeout, mouseOut = {lens: false, body: false};

function read(path, index = 1)
{

	images = {}, imagesData = {}, imagesNum = 0, contentNum = 0, imagesNumLoad = 0, currentIndex = index;

	$(window).off('keydown touchstart mouseout click');
	$('.reading-body, .reading-lens').off('mousemove');
	$('.reading-body').off('mouseout mouseenter touchmove');

	onReading = true;

	$(window).on('keydown', function(e){
		if(onReading)
		{
			if(e.keyCode == 37)
			{
				goPrevius();
			}
			else if(e.keyCode == 38)
			{
				goStart();
			}
			else if(e.keyCode == 39)
			{
				goNext();
			}
			else if(e.keyCode == 40)
			{
				goEnd();
			}
		}
	})

	$(window).on('touchstart', function(e){
		if(onReading && config.readingMagnifyingGlass)
		{
			clearTimeout(touchTimeout);
			readingTouchEvent = true;
			touchTimeout = setTimeout('readingTouchEvent = false;', 500);
		}
	})

	$(/*window*/'.reading-body, .reading-lens').on('mousemove', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
			var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

			var rbHeight = $('.reading-body').height();
			var rbWidth = $('.reading-body').width();
			var rbOffsetTop = $('.reading-body').offset().top;
			var rbOffsetLeft = $('.reading-body').offset().left;

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

	$('.reading-body').on('mouseout', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['body'] = true;

			if(mouseOut['lens'] == true) magnifyingGlassControl(0, e);
		}
	})

	$('.reading-body').on('mouseenter', function(e){
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

			var rbHeight = $('.reading-body').height();
			var rbWidth = $('.reading-body').width();
			var rbOffsetTop = $('.reading-body').offset().top;
			var rbOffsetLeft = $('.reading-body').offset().left;

			if(!(x > rbOffsetLeft && y > rbOffsetTop && x < (rbWidth + rbOffsetLeft) && y < (rbHeight + rbOffsetTop)))
			{
				magnifyingGlassControl(0, e);
			}
		}
	})

	$('.reading-lens').on('mouseenter', function(e){
		if(onReading && config.readingMagnifyingGlass && !readingTouchEvent)
		{
			mouseOut['lens'] = false;
		}
	})

	$('.reading-lens').on('touchmove', function(e){
		if(onReading && config.readingMagnifyingGlass)
		{
			magnifyingGlassControl(1, e);
		}
	})

	$(window).on('click', function(e){
		if(onReading && config.readingMagnifyingGlass && readingTouchEvent)
		{
			var x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
			var y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);

			var rbHeight = $('.reading-body').height();
			var rbWidth = $('.reading-body').width();
			var rbOffsetTop = $('.reading-body').offset().top;
			var rbOffsetLeft = $('.reading-body').offset().left;

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

	imagesNum = $('.reading-body img').length;
	contentNum = $('.reading-body .r-img').length;

	$('.reading-body img').each(function() {

		var index = parseInt($(this).attr('index'));

		images[index] = new Image();
		images[index].index = index;
		images[index].onload = function() {

			imagesData[this.index] = {width: this.width, height: this.height, aspectRatio: (this.width / this.height)};

			imagesNumLoad++;

			if(imagesNumLoad == imagesNum)
			{
				console.log('show');
				$('.reading-body').css('display', 'block');
				disposeImages();
				calculateView();
			}

		}
		images[index].src = $(this).attr('src');

	});

}

$(window).off('resize');

$(window).on('resize', function(){
	if(onReading)
	{
		disposeImages();
		calculateView();
		goToIndex(currentIndex, false);
	}
})

module.exports = {
	read: read,
	images: images,
	imagesNum: imagesNum,
	contentNum: contentNum,
	imagesNumLoad: imagesNumLoad,
	imagesData: imagesData,
	goToIndex: goToIndex,
	activeMagnifyingGlass: activeMagnifyingGlass,
	changeMagnifyingGlass: changeMagnifyingGlass,
	magnifyingGlassControl: magnifyingGlassControl,
	disposeImages: disposeImages,
};