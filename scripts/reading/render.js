var file = false,
	imagesData = {},
	rendered = {},
	maxNext = 10,
	maxPrev = 5,
	currentIndex = 0,
	scale = 1,
	globalZoom = false;

async function setFile(_file)
{
	file = _file;
	if(file) await file.read(); // Try make this from cache

	rendered = {};
	scale = 1;
	globalZoom = false;

	return;
}

function setImagesData(_imagesData)
{
	imagesData = _imagesData;
}

var setScaleST = false;

function setScale(_scale = 1, _globalZoom = false, doublePage = false)
{
	if(!file) return;

	clearTimeout(setScaleST);

	globalZoom = _globalZoom;

	if(_globalZoom)
	{
		scale = _scale;
		rendered = {};

		setRenderQueue(doublePage ? 2 : 1, 0);

		setScaleST = setTimeout(function(){

			setRenderQueue(maxNext, maxPrev);

		}, 2000);
	}
	else
	{
		setRenderQueue(doublePage ? 2 : 1, 0, _scale);
	}
}

var resizedST = false;

function resized(doublePage = false)
{
	if(!file) return;

	clearTimeout(resizedST);

	rendered = {};

	setRenderQueue(doublePage ? 2 : 1, 0);

	resizedST = setTimeout(function(){

		setRenderQueue(maxNext, maxPrev);

	}, 2000);
}

async function focusIndex(index)
{
	if(!file) return;

	currentIndex = index;

	setRenderQueue(maxNext, maxPrev);
}

async function setRenderQueue(next = 1, prev = 1, scale = false)
{
	queue.clean('readingRender');
	// queue.threads('readingRender', 2);

	console.time('readingRender');

	for(let i = 0, len = Math.max(next, prev); i < len; i++)
	{
		let nextI = currentIndex + i;
		let prevI = currentIndex - i;

		// Next pages
		if(i < next && (!rendered[nextI] || (scale !== false && rendered[nextI] !== scale)) && imagesData[nextI])
		{
			queue.add('readingRender', async function() {

				return render(nextI, scale);

			});
		}

		// Prev pages
		if(i < prev && nextI != prevI && (!rendered[prevI] || (scale !== false && rendered[prevI] !== scale)) && imagesData[prevI])
		{
			queue.add('readingRender', async function() {

				return render(prevI, scale);

			});
		}
	}

	queue.end('readingRender', function() {

		console.timeEnd('readingRender');

	});
}

async function render(index, _scale = false)
{
	let imageData = imagesData[index] || false;

	if(imageData)
	{
		_scale = (_scale || scale);
		rendered[index] = _scale;

		_scale = _scale * window.devicePixelRatio * (_scale != 1 ? 1.5 : 1); // 1.5 more scale is applied to avoid blurry text due to transform if scale is not 1

		let ocImg = template.contentRight('.r-img-i'+index+' oc-img').get(0);
		let originalCanvas = ocImg.querySelector('canvas');
		let canvas = originalCanvas.cloneNode(true);

		let config = {
			width: Math.round(+ocImg.dataset.width * _scale),
		};

		let name = imageData.name;
		name = (name && !/\.jpg$/.test(name)) ? name+'.jpg' : name;

		canvas.style.transform = 'scale('+(1 / _scale)+')';
		canvas.style.transformOrigin = 'top left';

		if(canvas && name)
			await file.renderCanvas(name, canvas, config);

		ocImg.innerHTML = '';
		ocImg.appendChild(canvas);

	}

	return;
}

async function renderMagnifyingGlass(index)
{

}

module.exports = {
	setFile: setFile,
	setImagesData: setImagesData,
	setScale: setScale,
	//render: render,
	//renderMagnifyingGlass: renderMagnifyingGlass,
	focusIndex: focusIndex,
	resized: resized,
}