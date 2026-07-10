var images = false, comics = false, showed = {}, active = true, status = {}, file = false;

function sizes(_images, _comics)
{
	if(file) file.destroy();

	if(config.readingDisableThumbnails)
		return;

	file = fileManager.file(reading.readingCurrentPath(), {log: false, progress: false});

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

let positions = {};
let scrollHeight = 0;

function calculateScrollPositions(contentLeft, imgs)
{
	positions = {};
	const result = images;
	const round = app.roundDPR;
	const items = reading.items;

	let top = 0;

	for(const item of items)
	{
		if(result[item.index]) result[item.index].top = top + 16; // 16 is the padding of the image

		if(item.folder)
		{
			top += 56; // Height of folders in sidebar
			continue;
		}

		const size = imageSize(item);
		const height = round(80 * size.height / size.width) + 34; // 34 is the sum of padding (16px) and image border (1px)

		positions[item.index] = {
			top: top,
			height: height,
		};

		top += height;
	}

	scrollHeight = top;
}

function disableThumbnailsHeight(end = false)
{
	const items = end ? reading.items.slice(0, end) : reading.items;
	return items.reduce((sum, item) => sum + (item.folder ? 56 : 52), 0); // 56 for folders and 52 for images
}

function calcScrollHeight()
{
	if(config.readingDisableThumbnails)
		return disableThumbnailsHeight();

	return scrollHeight;
}

function getPosition(page = 0)
{
	if(config.readingDisableThumbnails)
		return {top: disableThumbnailsHeight(page - 1), height: images[page] ? 52 : 56};

	return positions[page] || {top: 0, height: 0};
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
	const images = filterShowed(app.interleave(
		getImages(index, true),
		getImages(index + 1, false),
	));

	const len = images.length;

	if(len === 0)
		return;

	const thumbnails = cache.returnThumbnailsImages(images, function(data) {}, false);
	const imagesToGenerate = [];

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
			// img.style.height = '';
		}
		else
		{
			img.addEventListener('load', function(){
				this.parentElement.classList.add('show');
			});

			imagesToGenerate.push(image);
		}
	}

	if(imagesToGenerate.length === 0)
		return;

	cache.returnThumbnailsImages(imagesToGenerate, function(data) {

		dom.addImageToDom(data.sha, data.path);

	}, file);
}

var disableEventST = false;
var activeEvent = false;

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
	if(!activeEvent || status.showed === status.all || config.readingDisableThumbnails)
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
	getPosition,
	get scrollHeight() {return calcScrollHeight()},
};