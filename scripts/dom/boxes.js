
async function box(_comics, single, title, order, orderKey = false, orderKey2 = false)
{
	const viewModuleSize = handlebarsContext.page.viewModuleSize || 150;

	let comics = [];

	for(let i = 0, len = _comics.length; i < len; i++)
	{
		comics.push(_comics[i]);
	}

	comics.sort(function(a, b){
		return -(dom.orderBy(a, b, order, orderKey, orderKey2));
	});

	const maxItems = Math.floor((window.innerWidth - 16) / 116);

	comics = app.copy(comics.slice(0, maxItems));
	const len = comics.length;

	// Find images here
	for(let i = 0; i < len; i++)
	{
		if(comics[i].addToQueue === 2 || (viewModuleSize !== 100 && viewModuleSize !== 150))
		{
			const images = await dom.getFolderThumbnails(comics[i].path, (viewModuleSize === 100 ? 100 : 150));

			comics[i].poster = images.poster;
			comics[i].images = images.images;
			comics[i].progress = images.progress;
		}
	}

	if(len)
	{
		comics[0] = app.copy(comics[0]);
		comics[0].noHighlight = true;
	}

	const box = {
		title: title,
		boxes: true,
		size: 100,
		comics: comics,
	};

	if(len > 1 || (single && len > 0))
		handlebarsContext.boxes.push(box);
}

function continueReading(comics, single = false)
{
	return box(comics, single, language.comics.continueReading, 'real-numeric', 'readingProgress', 'lastReading');
}

function recentlyAdded(comics, single = false)
{
	return box(comics, single, language.comics.recentlyAdded, 'real-numeric', 'added');
}

function reset()
{
	handlebarsContext.boxes = [];
}

module.exports = {
	continueReading: continueReading,
	recentlyAdded: recentlyAdded,
	reset: reset,
};