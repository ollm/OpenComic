import Distribution, {Item} from './view/distribution.mjs';
import disposeImages from './view/dispose-images.mjs';
import stayInLine from './view/stay-in-line.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const dom: any;
declare const image: any;
declare const config: any;
declare const reading: any;
declare const _config: any;
declare const template: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface RightSize {
	height: number;
	width: number;
	top: number;
	left: number;
	scrollHeight: number;
}

export interface FullPosition {
	top: number;
	center: number;
	bottom: number;
	height: number;
}

let rightSize: RightSize; // Right content size

let imagesPosition: number[][];
let imagesFullPosition: FullPosition[][];
let prevImagesFullPosition: FullPosition[][];

function calculateView(first: boolean = false)
{
	if(!distribution) return;

	const contentRight = template._contentRight() as HTMLDivElement;
	const content = contentRight.firstElementChild!;
	let rect = content.getBoundingClientRect();

	rightSize = {
		height: rect.height,
		width: rect.width,
		top: rect.top,
		left: rect.left,
		scrollHeight: content.scrollHeight,
	};

	const isCompact = reading.viewIs('compact');
	const isSlide = reading.viewIs('slide');
	const isScroll = reading.viewIs('scroll');
	const removeClasses = ['compact', 'fade', 'rough-page-turn', 'smooth-page-turn'];

	if(isCompact || isSlide)
	{
		const elements = dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true);

		elements.css({
			width: `${isSlide ? (rect.width * distribution.total) : rect.width}px`,
			height: `${rect.height}px`,
			flexDirection: '',
		});

		if(isCompact)
		{
			elements.addClass('compact', reading.readingView());
		}
		else
		{
			elements.removeClass(...removeClasses);
		}
	}
	else if(isScroll)
	{
		dom.this(contentRight).find('.reading-body > div').css({
			width: '100%',
			flexDirection: 'column',
		}).removeClass(...removeClasses);

		dom.this(contentRight).find('.reading-lens > div > div').css({
			width: `${rect.width}px`,
			flexDirection: 'column',
		}).removeClass(...removeClasses);

		rect = content.getBoundingClientRect();

		rightSize = {
			height: rect.height,
			width: rect.width,
			top: rect.top,
			left: rect.left,
			scrollHeight: content.scrollHeight,
		};
	}

	if(reading.viewIs('scroll'))
	{
		prevImagesFullPosition = imagesFullPosition;

		imagesPosition = [];
		imagesFullPosition = [];

		const scale = config.readingGlobalZoom ? reading.scalePrevData().scale : 1;
		const margin = reading.margin();

		const scrollTop = content.scrollTop - rect.top;

		for(let i = 0, len = distribution.distribution.length; i < len; i++)
		{
			const group = distribution.distribution[i];

			if(typeof imagesPosition[i] === 'undefined') imagesPosition[i] = [];
			if(typeof imagesFullPosition[i] === 'undefined') imagesFullPosition[i] = [];

			for(let j = 0, len2 = group.length; j < len2; j++)
			{
				const image = contentRight.querySelector(`.image-position${i}-${j}`);
				let top = 0, height = 0;

				if(image)
				{
					const ocImg = image.querySelector('oc-img');

					if(ocImg)
					{
						const rect = ocImg.getBoundingClientRect();

						top = rect.top;
						height = rect.height;
					}
					else
					{
						const rect = image.getBoundingClientRect();

						top = rect.top + (margin.top * scale);
						height = rect.height - ((margin.top) * scale);
					}
				}

				imagesPosition[i][j] = (top + (height / 2)) + scrollTop;
				imagesFullPosition[i][j] = {
					top: top + scrollTop,
					center: imagesPosition[i][j],
					bottom: top + height + scrollTop,
					height: height,
				};
			}
		}

		if(first)
			prevImagesFullPosition = imagesFullPosition;
	}
}

function requiredImages(index: number)
{
	const current = index - 1;

	const isScroll = reading.viewIs('scroll');
	const isDoublePage = reading.doublePage.active();
	const ignoreDoublePage = _config.readingDoNotApplyToHorizontals;

	const extraSingle = 1; // Render previous and next image
	const extraDouble = 2; // Render previous and next double pages

	let start = 0;
	let end;

	if(isScroll || (isDoublePage && ignoreDoublePage))
	{
		end = current + (isDoublePage ? 3 + extraDouble : 1 + extraSingle);
	}
	else if(isDoublePage)
	{
		start = current - 1 - extraDouble;
		end = current + 1 + extraDouble;
	}
	else
	{
		start = current - extraSingle;
		end = current + extraSingle;
	}

	if(start < 0)
		start = 0;

	return {start, end};
}

let currentItems: Item[];
let fetchedAllSizes: boolean = false;

async function getAllSizes(contentRightIndex: number)
{
	if(!currentItems) return;
	const items = currentItems;

	if(fetchedAllSizes)
		return;

	fetchedAllSizes = true;

	console.log('--- Load all sizes ---');

	console.time('getAllSizes');
	const sizes = await image.getSizes(items);
	console.timeEnd('getAllSizes');

	let diff = false;

	for(let i = 0, len = items.length; i < len; i++)
	{
		const item = items[i];
		const size = sizes[i];

		if(item.width !== size.width || item.height !== size.height)
			diff = true;

		item.width = size.width;
		item.height = size.height;
		item.estimated = false;
		item.aspectRatio = size.width / size.height;
	}

	if(!distribution)
		return;

	if(!diff)
	{
		distribution.htmlItems();
		disposeImages();
		calculateView();

		reading.sidebar.sizes(reading.imagesData(), reading.currentComics());
		return;
	}

	// Avoid continue if another comic has been opened
	if(contentRightIndex != template.contentRightIndex())
		return;

	distribution.htmlItems();
	disposeImages();
	calculateView();
	stayInLine.recalculate();

	reading.sidebar.sizes(reading.imagesData(), reading.currentComics());

}

async function getRequiredSizes(index: number, items: Item[]): Promise<Item[]>
{
	console.log('--- Load only required sizes ---');

	fetchedAllSizes = false;
	const contentRightIndex = template.contentRightIndex();

	let {start, end} = requiredImages(index);
	let required = items.slice(start, end + 1);

	if(!required.length)
	{
		start = 0;
		end = items.length;
		required = items;
	}

	console.time('getRequiredSizes');
	const sizes = await image.getSizes(required);
	console.timeEnd('getRequiredSizes');

	const first = sizes[0];
	const last = sizes[sizes.length - 1];

	for(let i = 0, len = items.length; i < len; i++)
	{
		const item = items[i];
		let estimated = (i < start || i > end) ? true : false;
		let size = (i < start) ? first : (i > end) ? last : sizes[i - start];

		if(estimated)
		{
			const _size = image.getSizeFromCache(item);

			if(_size)
			{
				size = _size;
				estimated = false;
			}
		}

		item.width = size.width;
		item.height = size.height;
		item.estimated = estimated;
		item.aspectRatio = size.width / size.height;
	}

	// Just in case render.setOnRender does not dispatch
	setTimeout(function() {

		getAllSizes(contentRightIndex);

	}, 2000);

	currentItems = items;
	return items;
}

let distribution: Distribution | null = null;

function start()
{
	stayInLine.reset();
	distribution = new Distribution();
}

export default {
	requiredImages,
	getRequiredSizes,
	getAllSizes,
	calculateView,
	disposeImages,
	stayInLine,
	start,
	get distribution() {return distribution},
	get rightSize() {return rightSize},
	get imagesPosition() {return imagesPosition},
	get imagesFullPosition() {return imagesFullPosition},
	get prevImagesFullPosition() {return prevImagesFullPosition},
	Distribution,
};
