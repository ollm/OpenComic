let wheelST = false;

function wheel(event)
{
	const self = this;

	event.preventDefault();
	event.stopPropagation();

	let scrollLeft = (+this.dataset.scrollLeft || this.scrollLeft);

	if(event.wheelDelta / 120 > 0)
		scrollLeft -= 120;
	else
		scrollLeft += 120;

	this.dataset.scrollLeft = scrollLeft;

	clearTimeout(wheelST);
	wheelST = setTimeout(function(){

		self.dataset.scrollLeft = '';

	}, 160);

	$(this).stop(true).animate({scrollLeft: scrollLeft+'px'}, 160, 'linear');

	/*this.scrollTo({
		top: 0,
		left: scrollLeft,
		behavior: 'smooth',
	});*/
}

async function event()
{
	await app.sleep(100);

	app.event('.bar-title, .bar-right-buttons', 'mousewheel', wheel);
}

module.exports = {
	event: event,
};