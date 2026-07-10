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
declare const fileManager: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface RightSize {
	height: number;
	width: number;
	top: number;
	left: number;
	scrollHeight: number;
}

export interface FullPosition {
	i: number;
	j: number;
	top: number;
	center: number;
	bottom: number;
	left: number;
	height: number;
	width: number;
	original: {
		top: number;
		center: number;
		bottom: number;
		left: number;
		height: number;
		width: number;
	};
}

export function viewSize(isScroll: boolean = false)
{
	let width = window.innerWidth;
	let height = window.innerHeight;
	let top = 0;
	let left = 0;

	const {hideContentLeft, hideBarHeader, hideTabsBar} = reading.getHideContent();

	if(isScroll)
		width -= 12;

	if(!hideContentLeft)
		left = 192; // content left width

	if(!hideBarHeader)
		top += 48; // header height

	if(!hideTabsBar)
		top += 41; // tabs bar height

	width -= left;
	height -= top;

	return {
		width,
		height,
		left,
		top,
	};
}

export function leftSize(range: boolean = true)
{
	let height = window.innerHeight;
	let top = 0;

	const {hideContentLeft, hideBarHeader, hideTabsBar} = reading.getHideContent();

	if(!hideBarHeader)
		top += 48; // header height

	if(!hideTabsBar)
		top += 41; // tabs bar height

	if(hideContentLeft)
		top = 0;

	height -= top;
	if(!range) height -= 66; // range height

	return {
		width: 192,
		height,
		left: 0,
		top,
	};
}

let rightSize: RightSize; // Right content size

let pagesPosition: FullPosition[];
let imagesPosition: number[][];
let imagesFullPosition: FullPosition[][];
let prevImagesFullPosition: FullPosition[][];

function calculateView(first: boolean = false)
{
	if(!distribution) return;

	const contentRight = template._contentRight() as HTMLDivElement;

	const isCompact = reading.viewIs('compact');
	const isSlide = reading.viewIs('slide');
	const isScroll = reading.viewIs('scroll');
	const removeClasses = ['compact', 'fade', 'rough-page-turn', 'smooth-page-turn'];

	const rect = viewSize(isScroll);

	rightSize = {
		height: rect.height,
		width: rect.width,
		top: rect.top,
		left: rect.left,
		scrollHeight: rect.height,
	};

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

		// Calculate images full position
		prevImagesFullPosition = imagesFullPosition;

		pagesPosition = [];
		imagesPosition = [];
		imagesFullPosition = [];

		const scale = config.readingGlobalZoom ? reading.scalePrevData().scale : 1;
		let scrollHeight = 0;

		for(let i = 0, len = distribution.distribution.length; i < len; i++)
		{
			const group = distribution.distribution[i];

			if(!imagesPosition[i]) imagesPosition[i] = [];
			if(!imagesFullPosition[i]) imagesFullPosition[i] = [];

			let maxHeight = 0;
			let left = 0;

			for(let j = 0, len2 = group.length; j < len2; j++)
			{
				const item = group[j];
				const rendered = item.rendered!;

				const sumHeight = (rendered.height + rendered.top + rendered.bottom) * scale;
				if(maxHeight < sumHeight) maxHeight = sumHeight;

				const height = rendered.height * scale;

				const position = {
					i,
					j,
					top: scrollHeight,
					center: scrollHeight + height / 2,
					bottom: scrollHeight + height,
					left: (rendered.left + left) * scale,
					height,
					width: rendered.width * scale,
				} satisfies Omit<FullPosition, 'original'>;

				const fullPosition: FullPosition = {
					...position,
					original: {
						top: position.top / scale,
						center: position.center / scale,
						bottom: position.bottom / scale,
						left: position.left / scale,
						height: position.height / scale,
						width: position.width / scale,
					},
				};

				pagesPosition[item.index] = fullPosition;
				imagesPosition[i][j] = fullPosition.center;
				imagesFullPosition[i][j] = fullPosition;

				left += rendered.left + rendered.width;
			}

			scrollHeight += maxHeight;
		}

		if(first)
			prevImagesFullPosition = imagesFullPosition;

		rightSize = {
			height: rect.height,
			width: rect.width,
			top: rect.top,
			left: rect.left,
			scrollHeight,
		};
	}
}

function requiredImages(index: number, extra: boolean = true)
{
	const current = index - 1;

	const isScroll = reading.viewIs('scroll');
	const isDoublePage = reading.doublePage.active();

	const extraSingle = extra ? 1 : 0; // Render previous and next image
	const extraDouble = extra ? 2 : 0; // Render previous and next double pages

	let start = 0;
	let end;

	if(isScroll || (isDoublePage && _config.readingDoNotApplyToHorizontals))
	{
		if(isDoublePage && _config.readingDoNotApplyToHorizontals && _config.readingAlignWithNextHorizontal)
			end = 9999999;
		else
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
		let size = sizes[i];

		if(!size)
		{
			if(!item.folder && !item.blank)
				console.error(`Size not found for item ${item.index}`, item, sizes, items);

			continue;
		}

		const rotated = (size.width > size.height) ? _config.readingRotateHorizontals : _config.readingRotate;
		size.rotated = rotated;

		if(rotated == 1 || rotated == 2)
		{
			const {width, height} = size;
			size = {...size, width: height, height: width};
		}

		if(item.width !== size.width || item.height !== size.height)
			diff = true;

		if(item.folder)
			continue;

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
		reading.render.focusIndex(null, reading.doublePage.active());
		return;
	}

	// Avoid continue if another comic has been opened
	if(contentRightIndex != template.contentRightIndex())
		return;

	// reading.render.resetRendered();

	distribution.htmlItems();
	disposeImages();
	calculateView();
	stayInLine.recalculate();

	reading.sidebar.sizes(reading.imagesData(), reading.currentComics());
	reading.render.focusIndex(null, reading.doublePage.active());

}

async function getRequiredSizes(index: number, items: Item[]): Promise<Item[]>
{
	fetchedAllSizes = false;
	const contentRightIndex = template.contentRightIndex();

	let {start, end} = requiredImages(index, true);
	let required = items.slice(start, end + 1);

	console.log(`--- Load only required sizes (${required.length}) ---`);

	if(!required.length)
	{
		start = 0;
		end = items.length;
		required = items;
	}

	if(required.length < 10)
	{
		console.time('makeAvailable');
		const file = fileManager.file(false, {log: false, progress: false});
		await file.makeAvailable(required);
		file.destroy();
		console.timeEnd('makeAvailable');
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

		if(item.folder)
			continue;

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

function start(first = true)
{
	stayInLine.reset();

	if(first)
		distribution = new Distribution();
	else if(distribution)
		distribution.update();
}

export default {
	viewSize,
	leftSize,
	requiredImages,
	getRequiredSizes,
	getAllSizes,
	calculateView,
	disposeImages,
	stayInLine,
	start,
	get distribution() {return distribution},
	get rightSize() {return rightSize},
	get pagesPosition() {return pagesPosition},
	get imagesPosition() {return imagesPosition},
	get imagesFullPosition() {return imagesFullPosition},
	get prevImagesFullPosition() {return prevImagesFullPosition},
	Distribution,
};
