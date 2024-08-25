var file = false,
	ebook = false,
	ebookConfigChanged = false,
	renderType = 'canvas',
	renderImages = false,	
	renderCanvas = false,
	renderEbook = false,	
	imagesData = {},
	rendering = {},
	rendered = {},
	renderedMagnifyingGlass = {},
	renderedObjectsURL = [],
	renderedObjectsURLCache = {},
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

	renderImages = (renderType == 'images') ? true : false;
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

	if(renderImages)
		revokeAllObjectURL();

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

	if(renderImages)
		revokeAllObjectURL();

	return;
}

function setImagesData(_imagesData)
{
	imagesData = _imagesData;
}

function setMagnifyingGlassStatus(active = false)
{
	if(renderImages) return;

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

function getVisbleImages(doublePage = false)
{
	const isScroll = reading.readingViewIs('scroll');

	let images = doublePage ? 2 : 0;
	if(isScroll) images += 2;

	let prev = images;
	let next = images;

	if(next == 0)
		next = 1;

	return {prev: prev, next: next}; 
}

function setScale(_scale = 1, _globalZoom = false, _doublePage = false)
{
	if(!file && !renderImages) return;
	if(renderEbook) return;

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	scale = _scale;
	globalZoom = _globalZoom;
	doublePage = _doublePage;

	const visbleImages = getVisbleImages(doublePage);

	if(globalZoom)
	{
		rendered = {};
		renderedMagnifyingGlass = {};

		setRenderQueue(visbleImages.prev, visbleImages.next);

		sendToQueueST = setTimeout(function(){

			if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, _scale * scaleMagnifyingGlass, true);
			setRenderQueue(maxPrev, maxNext);

		}, 1000);
	}
	else
	{
		setRenderQueue(visbleImages.prev, visbleImages.next, _scale);

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
	if(!file && !renderImages) return;
	if(renderEbook) return; // Reset function is used

	let readingBody = template._contentRight().querySelector('.reading-body');
	if(readingBody) readingBody.classList.add('resizing');

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	if(renderImages)
		revokeAllObjectURL();

	rendered = {};
	renderedMagnifyingGlass = {};

	if(readingBody) readingBody.classList.remove('resizing');

	const visbleImages = getVisbleImages(doublePage);
	setRenderQueue(visbleImages.prev, visbleImages.next);

	sendToQueueST = setTimeout(function(){

		if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, false, true);
		setRenderQueue(maxPrev, maxNext);

	}, 400);
}

async function setEbookConfigChanged(ebookConfig)
{
	ebookConfigChanged = true;

	if(renderEbook && ebook)
		ebook.updateConfig(ebookConfig);
}

async function focusIndex(index)
{
	if(!file && !renderImages) return;

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	currentIndex = index;

	setRenderQueue(maxPrev, maxNext);

	sendToQueueST = setTimeout(function(){

		if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, false, true);

	}, 100);
}

function revokeAllObjectURL()
{
	for(let i = 0, len = renderedObjectsURL.length; i < len; i++)
	{
		renderedObjectsURL[i].img.classList.remove('blobRendered');
		URL.revokeObjectURL(renderedObjectsURL[i].data.blob);
	}

	renderedObjectsURL = [];
	renderedObjectsURLCache = {};
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
				render(prevI, scale, magnifyingGlass);
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

var onRender = false;

async function setOnRender(num = 1, callback = false)
{
	queue.clean('readingRender');

	onRender = {
		num: num,
		callback: callback,
	};
}

async function render(index, _scale = false, magnifyingGlass = false)
{
	let imageData = imagesData[index] || false;

	if(imageData)
	{
		let contentRight = template._contentRight();

		let rImg = contentRight.querySelector(magnifyingGlass ? '.reading-lens .r-img-i'+index : '.r-img-i'+index);
		if(!rImg) return;

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

			let ocImg = rImg.querySelector('oc-img');
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
				canvas.style.width = Math.round(isRendered.width)+'px';
				canvas.style.height = Math.round(isRendered.height)+'px';

				canvas.dataset.width = Math.round(isRendered.width);
				canvas.dataset.height = Math.round(isRendered.height);

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
		else if(renderImages)
		{
			if(magnifyingGlass) return;

			let cssMethods = {
				'pixelated': 'pixelated',
				'webkit-optimize-contrast': '-webkit-optimize-contrast',
			};

			let affineInterpolationMethods = {
				'bicubic': 'bicubic',
				'bilinear': 'bilinear',
				'nohalo': 'nohalo',
				'locally-bounded-bicubic': 'lbb',
				'vertex-split-quadratic-basis-spline': 'vsqbs',
			};

			_scale = (_scale || scale);

			let ocImg = rImg.querySelector('oc-img');
			if(!ocImg) return;

			let img = ocImg.querySelector('img');
			if(!img) return;

			let originalWidth = +ocImg.dataset.width;
			let originalHeight = +ocImg.dataset.height;

			if(isNaN(originalWidth) || isNaN(originalHeight)) return;

			rendered[index] = _scale;

			_scale = _scale * window.devicePixelRatio;

			let _config = {
				width: imageData?.rotated ? Math.round(originalHeight * _scale) : Math.round(originalWidth * _scale),
				height: imageData?.rotated ? Math.round(originalWidth * _scale) : Math.round(originalHeight * _scale),
				compressionLevel: 0,
				// kernel: 'lanczos3',
			};

			_config.kernel = _config.width > imageData.width ? config.readingImageInterpolationMethodUpscaling : config.readingImageInterpolationMethodDownscaling;

			let src = img.dataset.src;
			let key = src+'|'+_config.width+'x'+_config.height;

			if(_config.width !== imageData.width && _config.kernel && _config.kernel != 'chromium')
			{
				if(cssMethods[_config.kernel])
				{
					img.src = encodeSrcURI(app.shortWindowsPath(img.dataset.src, true));
					img.classList.remove('blobRendered', 'blobRender');
					img.style.imageRendering = cssMethods[_config.kernel];
				}
				else if(renderedObjectsURLCache[key])
				{
					img.src = renderedObjectsURLCache[key];
					img.classList.add('blobRendered', 'blobRender');
					img.style.imageRendering = '';
				}
				else if(!(await image.isAnimated(src)))
				{
					if(affineInterpolationMethods[_config.kernel])
					{
						_config.imageWidth = imageData?.rotated ? imageData.height : imageData.width;
						_config.imageHeight = imageData?.rotated ? imageData.width : imageData.height;
						_config.interpolator = affineInterpolationMethods[_config.kernel];

						_config.kernel = false;
					}

					try
					{
						let data = await image.resizeToBlob(src, _config);
						img.src = data.blob;
						img.classList.add('blobRendered', 'blobRender');
						img.style.imageRendering = '';

						renderedObjectsURL.push({data: data, img: img});
						renderedObjectsURLCache[key] = data.blob;
					}
					catch(error)
					{
						console.error(error);

						img.src = encodeSrcURI(app.shortWindowsPath(img.dataset.src, true));
						img.classList.remove('blobRendered', 'blobRender');
						img.style.imageRendering = '';
					}
				}
				else
				{
					img.src = encodeSrcURI(app.shortWindowsPath(img.dataset.src, true));
					img.classList.remove('blobRendered', 'blobRender');
					img.style.imageRendering = '';
				}
			}
			else
			{
				img.src = encodeSrcURI(app.shortWindowsPath(img.dataset.src, true));
				img.classList.remove('blobRendered', 'blobRender');
				img.style.imageRendering = '';
			}
		}

		if(onRender)
		{
			onRender.num--;

			if(onRender.num <= 0)
			{
				let img = rImg.querySelector('oc-img img');

				if(img && !img.complete)
				{
					await new Promise(function(resolve){

						img.onload = resolve;
						img.onerror = resolve;

					});
				}

				onRender.callback();
				onRender = false;
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
	setOnRender: setOnRender,
}