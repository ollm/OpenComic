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

	createObserver();

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

function setMagnifyingGlassStatus(active = false, doublePage = false)
{
	scaleMagnifyingGlass = active;

	if(active)
		setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, false, true);
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

function setScaleMagnifyingGlass(_scale = 1, doublePage = false)
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

async function focusIndex(index, doublePage = false)
{
	if(!file && !renderImages) return;

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	currentIndex = index;

	setRenderQueue(maxPrev, maxNext, false, false, (doublePage ? 2 : false));

	sendToQueueST = setTimeout(function(){

		if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, false, true);

	}, 100);
}

function revokeAllObjectURL()
{
	// const total = renderedObjectsURL.reduce((acc, o) => acc + o.data.size, 0);
	// console.log(`Total blob payload megabytes: ${(total / (1024 * 1024)).toFixed(2)} MB in ${renderedObjectsURL.length} images`);

	for(let i = 0, len = renderedObjectsURL.length; i < len; i++)
	{
		renderedObjectsURL[i].img.classList.remove('blobRendered');
		URL.revokeObjectURL(renderedObjectsURL[i].data.blob);
	}

	renderedObjectsURL = [];
	renderedObjectsURLCache = {};
}

async function setRenderQueue(prev = 1, next = 1, scale = false, magnifyingGlass = false, prioritizeNext = false)
{
	//console.time('readingRender');

	let _rendered = magnifyingGlass ? renderedMagnifyingGlass : rendered;

	if(prioritizeNext)
		prev = prev + prioritizeNext;

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
				queue.add('readingRender', async function(queueIndex) {

					return render(nextI, scale, magnifyingGlass, queueIndex);

				}, queue.index('readingRender'));
			}
		}

		// Prev pages
		if(!prioritizeNext || i > prioritizeNext)
		{
			if(prioritizeNext) prevI += prioritizeNext;

			if(i < prev && nextI != prevI && (!_rendered[prevI] || (scale !== false && _rendered[prevI] !== scale)) && imagesData[prevI])
			{
				if(renderEbook) // Render ebook instantly
				{
					render(prevI, scale, magnifyingGlass);
				}
				else
				{
					queue.add('readingRender', async function(queueIndex) {

						return render(prevI, scale, magnifyingGlass, queueIndex);

					}, queue.index('readingRender'));
				}
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

async function render(index, _scale = false, magnifyingGlass = false, queueIndex = 0)
{
	let imageData = imagesData[index] || false;

	if(imageData)
	{
		let contentRight = template._contentRight();

		let rImg = contentRight.querySelector(magnifyingGlass ? '.reading-lens > div > div > div.r-flex .r-img-i'+index : '.reading-body > div > div.r-flex .r-img-i'+index);
		if(!rImg) return;

		const rotated90 = (imageData?.rotated == 1 || imageData?.rotated == 2) ? true : false;

		if(renderEbook)
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
		else if(renderImages || renderCanvas)
		{
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

			if(magnifyingGlass)
				_scale = scale * scaleMagnifyingGlass;

			_scale = _scale * window.devicePixelRatio;

			let _config = {
				width: rotated90 ? Math.round(originalHeight * _scale) : Math.round(originalWidth * _scale),
				height: rotated90 ? Math.round(originalWidth * _scale) : Math.round(originalHeight * _scale),
				compressionLevel: 0,
				// kernel: 'lanczos3',
			};

			_config.kernel = _config.width > imageData.width ? config.readingImageInterpolationMethodUpscaling : config.readingImageInterpolationMethodDownscaling;

			let src = img.dataset.src;
			let path = img.dataset.path;
			let key = src+'|'+_config.width+'x'+_config.height;

			fileManager.macosStartAccessingSecurityScopedResource(src);

			if(compatible.image.convert(path)) // Convert unsupported images
				src = await workers.convertImage(path, {priorize: true});

			if(renderCanvas)
			{
				if(_config.width > config.renderMaxWidth)
					_config.width = config.renderMaxWidth;

				if(renderedObjectsURLCache[key])
				{
					const data = renderedObjectsURLCache[key];

					img.src = data.blob;
					img.classList.add('blobRendered', 'blobRender', 'sizeFromImg');
					img.style.imageRendering = '';

					img.dataset.width = Math.round(data.width);
					img.dataset.height = Math.round(data.height);
				}
				else
				{
					try
					{
						let name = imageData.name;
						name = (name && !/\.jpg$/.test(name)) ? name+'.jpg' : name;

						let data = false;

						if(name)
						{
							data = await file.renderBlob(name, _config);

							renderedObjectsURL.push({data: data, img: img});
							renderedObjectsURLCache[key] = data;

							if(queueIndex !== queue.index('readingRender')) return; // Return if the queue is different

							img.src = data.blob;
							img.classList.add('blobRendered', 'blobRender', 'sizeFromImg');
							img.style.imageRendering = '';

							img.dataset.width = Math.round(data.width);
							img.dataset.height = Math.round(data.height);
						}
						else
						{
							await srcToImage(src, img);
						}
					}
					catch(error)
					{
						console.error(error);

						await srcToImage(src, img);
					}
				}
			}
			else if(_config.width !== imageData.width && _config.kernel && _config.kernel != 'chromium' && !magnifyingGlass)
			{
				if(cssMethods[_config.kernel])
				{
					img.src = app.encodeSrcURI(app.shortWindowsPath(src, true));
					img.classList.remove('blobRendered', 'blobRender');
					img.style.imageRendering = cssMethods[_config.kernel];
				}
				else if(renderedObjectsURLCache[key])
				{
					img.src = renderedObjectsURLCache[key].blob;
					img.classList.add('blobRendered', 'blobRender');
					img.style.imageRendering = '';
				}
				else if(!(await image.isAnimated(src)))
				{
					if(affineInterpolationMethods[_config.kernel])
					{
						_config.imageWidth = rotated90 ? imageData.height : imageData.width;
						_config.imageHeight = rotated90 ? imageData.width : imageData.height;
						_config.interpolator = affineInterpolationMethods[_config.kernel];

						_config.kernel = false;
					}

					try
					{
						let data = await image.resizeToBlob(src, _config);

						renderedObjectsURL.push({data: data, img: img});
						renderedObjectsURLCache[key] = {blob: data.blob};

						if(queueIndex !== queue.index('readingRender')) return; // Return if the queue is different

						img.src = data.blob;
						img.classList.add('blobRendered', 'blobRender');
						img.style.imageRendering = '';
					}
					catch(error)
					{
						console.error(error);

						await srcToImage(src, img);
					}
				}
				else
				{
					await srcToImage(src, img);
				}
			}
			else
			{
				await srcToImage(src, img);
			}

			if((onRender && onRender.num > 0) || _scale)
				await decodeImage(img, true);
			else
				decodeImage(img, false);

			if(magnifyingGlass)
				renderedMagnifyingGlass[index] = _scale;
			else
				rendered[index] = _scale;
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

async function srcToImage(src, img)
{
	img.src = app.encodeSrcURI(app.shortWindowsPath(src, true));
	img.classList.remove('blobRendered', 'blobRender');
	img.style.imageRendering = '';

	return true;
}

async function decodeImage(img, sync = false)
{
	if(sync)
	{
		try
		{
			await img.decode();
		}
		catch(e){}	
	}

	observer.observe(img);
}

var observer = false;

function createObserver()
{
	if(observer)
		observer.disconnect();

	observer = new IntersectionObserver(function(entries) {

		for(let i = 0, len = entries.length; i < len; i++)
		{
			const entry = entries[i];

			if(entry.isIntersecting || entry.intersectionRatio > 0)
			{				
				try
				{
					entry.target.decode();
				}
				catch(e){}	
			}
		}

	}, {
		root: template._contentRight().firstElementChild,
		rootMargin: '4000px',
		threshold: 0,
	});
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
	revokeAllObjectURL: revokeAllObjectURL,
	get rendered() {return rendered},
}