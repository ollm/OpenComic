function change(key, value)
{
	_config.readingDoublePageShadow[key] = value;
	reading.updateReadingPagesConfig('readingDoublePageShadow', _config.readingDoublePageShadow);

	apply();
}

function apply(options = false)
{
	const shadow = _config.readingDoublePageShadow;
	const contentRight = template._contentRight();
	const contentRightIndex = template.contentRightIndex();
	const style = contentRight.querySelector('.reading-double-page-shadow-style');

	if(!style)
		return;

	if(!shadow.active)
	{
		style.innerHTML = '';
		return;
	}

	const left = options ? options.left : _config.readingMargin.left;
	const translate = left ? 0 : -1;

	style.innerHTML = `
	<style>
		.content-right-${contentRightIndex} .r-img:not(:only-child) > oc-img:after,
		.content-right-${contentRightIndex} .r-img:not(:only-child) > div:after
		{
			content: '';
			display: block;
			position: absolute;
			z-index: 2;
			height: 100%;
			width: ${shadow.size}%;
			top: 0px;
			right: 0px;
			background: linear-gradient(to left, rgba(0, 0, 0, ${shadow.opacity}%), ${shadow.displacement}%, transparent);
		}

		.content-right-${contentRightIndex} .r-img:not(:only-child):last-child > oc-img:after,
		.content-right-${contentRightIndex} .r-img:not(:only-child):last-child > div:after
		{
			right: initial;
			left: 0px;
			background: linear-gradient(to right, rgba(0, 0, 0, ${shadow.opacity}%), ${shadow.displacement}%, transparent);
			transform: translate(${translate}px, 0px);
		}
	</style>`;
}

function shadowDialog()
{
	events.dialog({
		header: language.reading.doublePage.shadow.main,
		width: 500,
		height: 390,
		content: template.load('dialog.reading.double.page.shadow.html'),
		buttons: [
			{
				text: language.buttons.close,
				function: 'events.closeDialog();',
			}
		],
	});

	events.events();
}

function active()
{
	return (_config.readingDoublePage && !_config.readingWebtoon);
}

module.exports = {
	change,
	apply,
	shadowDialog,
	active,
};