var file = false,
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

async function setFile(_file, _scaleMagnifyingGlass = false)
{
	file = _file;
	if(file) await file.read(); // Try make this from cache

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

	clearTimeout(sendToQueueST);

	queue.clean('readingRender');

	rendered = {};
	renderedMagnifyingGlass = {};

	setRenderQueue(0, doublePage ? 2 : 1);

	sendToQueueST = setTimeout(function(){

		if(scaleMagnifyingGlass) setRenderQueue(doublePage ? 3 : 2, doublePage ? 4 : 2, false, true);
		setRenderQueue(maxPrev, maxNext);

	}, 2000);
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
	console.time('readingRender');

	let _rendered = magnifyingGlass ? renderedMagnifyingGlass : rendered;

	for(let i = 0, len = Math.max(next, prev); i < len; i++)
	{
		let nextI = currentIndex + i;
		let prevI = currentIndex - i;

		// Next pages
		if(i < next && (!_rendered[nextI] || (scale !== false && _rendered[nextI] !== scale)) && imagesData[nextI])
		{
			queue.add('readingRender', async function() {

				return render(nextI, scale, magnifyingGlass);

			});
		}

		// Prev pages
		if(i < prev && nextI != prevI && (!_rendered[prevI] || (scale !== false && _rendered[prevI] !== scale)) && imagesData[prevI])
		{
			queue.add('readingRender', async function() {

				return render(prevI, scale, magnifyingGlass);

			});
		}
	}

	queue.end('readingRender', function() {

		console.timeEnd('readingRender');

	});
}

async function render(index, _scale = false, magnifyingGlass = false)
{
	let imageData = imagesData[index] || false;

	if(imageData)
	{
		_scale = (_scale || scale);

		if(magnifyingGlass)
			_scale = scale * scaleMagnifyingGlass;

		if(magnifyingGlass)
			renderedMagnifyingGlass[index] = _scale;
		else
			rendered[index] = _scale;

		_scale = _scale * window.devicePixelRatio * (_scale != 1 ? 1.5 : 1); // 1.5 more scale is applied to avoid blurry text due to transform if scale is not 1

		let ocImg = template.contentRight(magnifyingGlass ? '.reading-lens .r-img-i'+index+' oc-img' : '.r-img-i'+index+' oc-img').get(0);
		let originalCanvas = ocImg.querySelector('canvas');
		let canvas = originalCanvas.cloneNode(true);

		let originalWidth = +ocImg.dataset.width

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
			ocImg.innerHTML = '';
			ocImg.appendChild(canvas);
		}
	}

	return;
}

module.exports = {
	setFile: setFile,
	setImagesData: setImagesData,
	setMagnifyingGlassStatus: setMagnifyingGlassStatus,
	setScale: setScale,
	setScaleMagnifyingGlass: setScaleMagnifyingGlass,
	//render: render,
	focusIndex: focusIndex,
	resized: resized,
}