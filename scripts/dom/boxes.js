
async function box(_comics, title, order, orderKey = false, orderKey2 = false)
{
	let comics = [];

	for(let i = 0, len = _comics.length; i < len; i++)
	{
		comics.push(_comics[i]);
	}

	comics.sort(function(a, b){
		return -(dom.orderBy(a, b, order, orderKey, orderKey2));
	});

	const maxItems = Math.floor((window.innerWidth - 16) / 116);

	comics = comics.slice(0, maxItems);
	const len = comics.length;

	// Find images here
	for(let i = 0; i < len; i++)
	{
		if(comics[i].addToQueue === 2)
		{
			const images = await dom.getFolderThumbnails(comics[i].path);

			comics[i].poster = images.poster;
			comics[i].images = images.images;
		}

		console.log(comics[i].added);
	}

	const box = {
		title: title,
		comics: comics,
	};

	if(len)
		handlebarsContext.boxes.push(box);
}

function continueReading(comics)
{
	return box(comics, language.comics.continueReading, 'real-numeric', 'readingProgress', 'lastReading');
}

function recentlyAdded(comics)
{
	return box(comics, language.comics.recentlyAdded, 'real-numeric', 'added');
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