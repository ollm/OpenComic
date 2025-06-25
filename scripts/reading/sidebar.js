var images = false, comics = false, showed = {}, active = true, status = {}, file = false;

function sizes(_images, _comics)
{
	if(file) file.destroy();
	file = fileManager.file(reading.readingCurrentPath(), {log: false});

	images = _images;
	comics = _comics;
	showed = {};
	status = {showed: 0, all: Object.keys(_images).length};

	const contentLeft = template._contentLeft();
	const imgs = contentLeft.querySelectorAll('.reading-left-images img');

	for(let i = 0, len = imgs.length; i < len; i++)
	{
		const img = imgs[i];
		const image = images[img.dataset.index];

		if(!image)
			continue;

		const size = imageSize(image);

		img.style.width = '80px';
		img.style.height = app.roundDPR(80 * size.height / size.width) + 'px';
	}

	calculateScrollPositions(contentLeft, imgs);
	event(contentLeft);
}

function imageSize(image)
{
	if(image.rotated === 1 || image.rotated === 2)
		return {width: image.height, height: image.width};
	else
		return {width: image.width, height: image.height};
}

function calculateScrollPositions(contentLeft, imgs)
{
	const scrollTop = contentLeft.firstElementChild.scrollTop;

	for(let i = 0, len = imgs.length; i < len; i++)
	{
		const img = imgs[i];
		const index = img.dataset.index;

		const top = img.getBoundingClientRect().top + scrollTop;
		images[img.dataset.index].top = top;
	}
}

function filterShowed(images)
{
	const _images = [];

	for(let i = 0, len = images.length; i < len; i++)
	{
		if(!showed[images[i].index])
		{
			const thumbnail = images[i];

			showed[images[i].index] = true;
			_images.push(images[i]);
			status.showed++;
		}
	}

	return _images;
}

function getImages(index, up = true)
{
	const windowHeight = window.innerHeight;
	const _images = [];

	let height = 0;

	while(true)
	{
		if(height > windowHeight * 2)
			break;

		const image = images[index];
		const comic = comics[index];
		index += up ? -1 : 1;

		if(!image || !comic)
		{
			height += 56;
			continue;
		}

		const size = imageSize(image);

		height += app.roundDPR(80 * size.height / size.width) + 34;
		_images.push({...image, ...comic});
	}

	return _images;
}

async function goToImage(index)
{
	const images = filterShowed([
		...getImages(index, true),
		...getImages(index + 1, false),
	]);

	const len = images.length;

	if(len === 0)
		return;

	const thumbnails = cache.returnThumbnailsImages(images, function(data) {

		dom.addImageToDom(data.sha, data.path);

	}, file);

	const contentLeft = template._contentLeft();

	for(let i = 0; i < len; i++)
	{
		const image = images[i];
		const thumbnail = thumbnails[image.sha];

		const img = contentLeft.querySelector('.sha-image-'+image.sha);
		if(!img) continue;

		if(thumbnail.cache)
		{
			img.src = thumbnail.path;
			img.parentElement.classList.add('show');
		}
		else
		{
			img.addEventListener('load', function(){
				this.parentElement.classList.add('show');
			});
		}
	}
}

var disableEventST = false;

function disableEvent(delay = 0)
{
	activeEvent = false;
	clearTimeout(disableEventST);

	disableEventST = setTimeout(function() {

		activeEvent = true;

	}, delay);
}

function scroll(event)
{
	if(!activeEvent || status.showed === status.all)
		return;

	const windowHeight = window.innerHeight;
	const scrollTop = this.scrollTop + windowHeight / 2;

	let index = 0;

	for(let key in images)
	{
		const image = images[key];
		index = key;

		if(image.top - scrollTop > 0)
			break;
	}

	goToImage(+index);
}

function event(contentLeft)
{
	app.event(contentLeft.firstElementChild, 'scroll', scroll);
}

module.exports = {
	sizes,
	goToImage,
	disableEvent,
};