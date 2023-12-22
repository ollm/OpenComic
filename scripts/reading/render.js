var file = false,
	ebook = false,
	ebookConfigChanged = false,
	renderType = 'canvas',
	renderCanvas = false,
	renderEbook = false,	
	imagesData = {},
	rendered = {},
	renderedMagnifyingGlass = {},
	maxNext = 10,
	maxPrev = 5,
	currentIndex = 0,
	scale = 1,
	scaleMagnifyingGlass = false,
	globalZoom = false,
	doublePage = false;

async function setFile(_file, _scaleMagnifyingGlass = false, _renderType = 'canvas')
{
	if(file) file.destroy();

	renderType = _renderType;

	renderCanvas = (renderType == 'canvas') ? true : false;
	renderEbook = (renderType == 'ebook') ? true : false;

	file = _file;
	if(file && !renderEbook) await file.read(); // Try make this from cache

	ebook = renderEbook ? await file.ebook() : false;
	ebookConfigChanged = false;

	rendered = {};
	renderedMagnifyingGlass = {};
	scale = 1;
	scaleMagnifyingGlass = _scaleMagnifyingGlass;
	globalZoom = false;

	return;
}

async function reset(_scaleMagnifyingGlass = false)
{
	ebook = renderEbook ? await file.ebook() : false;

	rendered = {};
	renderedMagnifyingGlass = {};
	scale = 1;
	scaleMagnifyingGlass = _scaleMagnifyingGlass;
	globalZoom = false;

	return;
}

function setImagesData(_imagesData)
{
	imagesData = _imagesData;
}

function setMagnifyingGlassStatus(active = false)
{
	if(active)
	{
		scaleMagnifyingGlass = active;
	}
	else
	{
		scaleMagnifyingGlass = false;
	}
}

var sendToQueueST = false;

function setScale(_scale = 1, _globalZoom = false, _doublePage = false)
{
	if(!file) return;
	if(renderEbook) return;

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	scale = _scale;
	globalZoom = _globalZoom;
	doublePage = _doublePage;

	if(globalZoom)
	{
		rendered = {};
		renderedMagnifyingGlass = {};

		setRenderQueue(0, doublePage ? 2 : 1);

		sendToQueueST = setTimeout(function(){

			if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, _scale * scaleMagnifyingGlass, true);
			setRenderQueue(maxPrev, maxNext);

		}, 2000);
	}
	else
	{
		setRenderQueue(0, doublePage ? 2 : 1, _scale);

		sendToQueueST = setTimeout(function(){

			if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, _scale * scaleMagnifyingGlass, true);

		}, 500);
	}
}

function setScaleMagnifyingGlass(_scale = 1)
{
	if(!file || !scaleMagnifyingGlass) return;
	if(renderEbook) return;

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	renderedMagnifyingGlass = {};
	scaleMagnifyingGlass = _scale;

	sendToQueueST = setTimeout(function(){

		if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, scale * scaleMagnifyingGlass, true);

	}, 500);
}

function resized(doublePage = false)
{
	if(!file) return;
	if(renderEbook) return; // Reset function is used

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	rendered = {};
	renderedMagnifyingGlass = {};

	sendToQueueST = setTimeout(function(){

		setRenderQueue(0, doublePage ? 2 : 1);

		sendToQueueST = setTimeout(function(){

			if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, false, true);
			setRenderQueue(maxPrev, maxNext);

		}, 800);

	}, 200);
}

async function setEbookConfigChanged(ebookConfig)
{
	ebookConfigChanged = true;

	if(renderEbook && ebook)
		ebook.updateConfig(ebookConfig);
}

async function focusIndex(index)
{
	if(!file) return;

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	currentIndex = index;

	setRenderQueue(maxPrev, maxNext);

	sendToQueueST = setTimeout(function(){

		if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, false, true);

	}, 100);
}

async function setRenderQueue(prev = 1, next = 1, scale = false, magnifyingGlass = false)
{
	//console.time('readingRender');

	let _rendered = magnifyingGlass ? renderedMagnifyingGlass : rendered;

	for(let i = 0, len = Math.max(next, prev); i < len; i++)
	{
		let nextI = currentIndex + i;
		let prevI = currentIndex - i;

		// Next pages
		if(i < next && (!_rendered[nextI] || (scale !== false && _rendered[nextI] !== scale)) && imagesData[nextI])
		{
			if(renderEbook) // Render ebook instantly
			{
				await render(nextI, scale, magnifyingGlass);
			}
			else
			{
				queue.add('readingRender', async function() {

					return render(nextI, scale, magnifyingGlass);

				});
			}
		}

		// Prev pages
		if(i < prev && nextI != prevI && (!_rendered[prevI] || (scale !== false && _rendered[prevI] !== scale)) && imagesData[prevI])
		{
			if(renderEbook) // Render ebook instantly
			{
				await render(prevI, scale, magnifyingGlass);
			}
			else
			{
				queue.add('readingRender', async function() {

					return render(prevI, scale, magnifyingGlass);

				});
			}
		}
	}

	queue.end('readingRender', function() {

		//console.timeEnd('readingRender');

	});
}

async function render(index, _scale = false, magnifyingGlass = false)
{
	let imageData = imagesData[index] || false;

	if(imageData)
	{
		let contentRight = template._contentRight();

		if(renderCanvas)
		{
			_scale = (_scale || scale);

			if(magnifyingGlass)
				_scale = scale * scaleMagnifyingGlass;

			if(magnifyingGlass)
				renderedMagnifyingGlass[index] = _scale;
			else
				rendered[index] = _scale;

			_scale = _scale * window.devicePixelRatio// * (_scale != 1 ? 1.5 : 1); // 1.5 more scale is applied to avoid blurry text due to transform if scale is not 1

			let ocImg = contentRight.querySelector(magnifyingGlass ? '.reading-lens .r-img-i'+index+' oc-img' : '.r-img-i'+index+' oc-img');
			if(!ocImg) return;

			let originalCanvas = ocImg.querySelector('canvas');
			if(!originalCanvas) return;

			let canvas = originalCanvas.cloneNode(true);

			let originalWidth = +ocImg.dataset.width;
			let originalHeight = +ocImg.dataset.height;

			let _config = {
				width: Math.round(originalWidth * _scale),
			};

			if(_config.width > config.renderMaxWidth)
			{
				_config.width = config.renderMaxWidth;
				_scale = (_config.width / originalWidth);
			}

			let name = imageData.name;
			name = (name && !/\.jpg$/.test(name)) ? name+'.jpg' : name;

			canvas.style.transform = 'scale('+(1 / _scale)+')';
			canvas.style.transformOrigin = 'top left';

			let isRendered = false;

			if(canvas && name)
				isRendered = await file.renderCanvas(name, canvas, _config);

			if(isRendered)
			{
				canvas.style.width = _config.width+'px';
				canvas.style.height = Math.round(originalHeight * _scale)+'px';
				ocImg.replaceChildren(canvas);
			}
		}
		else if(renderEbook)
		{
			rendered[index] = 1;
			renderedMagnifyingGlass[index] = 1;

			let iframe = ebook.pageToIframe(ebook.page(index - 1).html);
			let iframeMG = iframe.cloneNode(true);

			let ocImg = contentRight.querySelector('.r-img-i'+index+' oc-img');
			let ocImgMG = contentRight.querySelector('.reading-lens .r-img-i'+index+' oc-img');

			if(ocImg)
			{
				let prevIframe = ocImg.querySelector('iframe');
				if(prevIframe) prevIframe.remove();

				ocImg.appendChild(iframe);
			}

			if(ocImgMG)
			{
				let prevIframeMG = ocImgMG.querySelector('iframe');
				if(prevIframeMG) prevIframeMG.remove();

				ocImgMG.appendChild(iframeMG);
			}

			if(ebookConfigChanged)
			{
				ebook.applyConfigToHtml(iframe.contentDocument);
				ebook.applyConfigToHtml(iframeMG.contentDocument);
			}
		}
	}

	return;
}

module.exports = {
	setFile: setFile,
	reset: reset,
	setImagesData: setImagesData,
	setMagnifyingGlassStatus: setMagnifyingGlassStatus,
	setScale: setScale,
	setScaleMagnifyingGlass: setScaleMagnifyingGlass,
	render: render,
	focusIndex: focusIndex,
	resized: resized,
	setEbookConfigChanged: setEbookConfigChanged,
}