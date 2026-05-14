import view from '../view.mjs';
import {Item} from './distribution.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const _config: any;
declare const reading: any;
declare const template: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Margin {
	margin: number;
	left: number;
	right: number;
	top: number;
	bottom: number;
	horizontalsLeft: number;
	horizontalsRight: number;
};

interface Clip {
	top: number;
	bottom: number;
	left: number;
	right: number;
	vertical: number;
	horizontal: number;
}

interface CalcSizes {
	width: number;
	height: number;
	aspectRatio: number;
	horizontal: number;
	vertical: number;
	horizontals: {
		width: number;
		height: number;
		aspectRatio: number;
		horizontal: number;
		vertical: number;
	};
}

interface Sizes {
	estimated: boolean;
	width: number;
	height: number;
	left: number;
	top: number;
	originalSize: boolean;
	offset: {
		top: number;
		left: number;
	};
	size: {
		width: number;
		height: number;
		rotated: number;
	};
	img: {
		width: number;
		height: number;
	};
}

interface Join {
	width: number;
	margin: number;
	sum: number;
	length: number;
}

// Calculates the size and position of the images
function calcAspectRatio(first: Item, second?: Item)
{
	if(first.folder)
		first.calcAspectRatio = 1;
	else if(second && first.blank)
		first.calcAspectRatio = second.folder || second.blank ? (first.aspectRatio || 1) : (second?.clip?.aspectRatio || first.aspectRatio || 1);
	else
		first.calcAspectRatio = first.clip?.aspectRatio || first.aspectRatio || 1;
}

function calcSizes(item: Item, cSizes: CalcSizes, clip: Clip, join: Join, isScroll: boolean, prevSize: Sizes | null): Sizes
{
	const dpr = window.devicePixelRatio;
	const type = item.groupType;
	const index = item.key2 as number;

	const isDouble = type === 'double';
	const isHorizontalMargin = !isDouble && _config.readingHorizontalsMarginActive && item.aspectRatio > 1;
	const forceSinglePage = _config.readingForceSinglePage && !_config.readingWebtoon;

	const aspectRatio = isHorizontalMargin ? cSizes.horizontals.aspectRatio : cSizes.aspectRatio;
	const marginHorizontal = isHorizontalMargin ? cSizes.horizontals.horizontal : cSizes.horizontal;

	const fitHeight = (((isDouble && join.sum < cSizes.width) || (!isDouble && aspectRatio > item.aspectRatio)) && !(isScroll && (_config.readingViewAdjustToWidth || _config.readingWebtoon)));

	const calcWidth = () => {

		if(fitHeight)
			return cSizes.height * item.aspectRatio;

		if(isDouble)
		{
			const width = cSizes.height * item.aspectRatio;
			const restAspectRatio = (join.width - width) / cSizes.height;

			return (item.aspectRatio / (item.aspectRatio + restAspectRatio)) * (cSizes.width - cSizes.horizontal);
		}

		return cSizes.width;

	};

	const calcHeight = () => {

		return width / item.aspectRatio;

	};

	const calcLeft = () => {

		if(fitHeight)
		{
			if(isDouble)
			{
				if(index === 0)
					return cSizes.horizontal + (cSizes.width / 2 - join.sum / 2);
				else
					return cSizes.horizontal;
			}

			return cSizes.horizontal + (cSizes.width / 2 - width / 2);
		}

		return marginHorizontal;

	};

	const calcTop = () => {

		if(fitHeight)
			return cSizes.vertical;

		return cSizes.vertical + (cSizes.height / 2 - height / 2);

	};

	let width = calcWidth();
	let height = calcHeight();
	let left = calcLeft() + (prevSize?.offset.left || 0);
	let top = calcTop();

	if(isScroll && !forceSinglePage)
		top = cSizes.vertical;

	const img = {
		height: clip.vertical > 0 ? (height / (1 - clip.vertical)) : height,
		width: clip.horizontal > 0 ? (width / (1 - clip.horizontal)) : width,
	};

	let originalSize = false;
	let size = {width: 0, height: 0, rotated: 0};

	const offset = {
		top: 0,
		left: 0,
	};

	if(item.image)
	{
		size = reading.ai.size(item);

		if(_config.readingNotEnlargeMoreThanOriginalSize)
		{
			const sizeClip = reading.ai.size(item.clip);

			if(size && (img.width * dpr > size.width || img.height * dpr > size.height))
			{
				offset.left = (img.width - size.width / dpr) / 2;
				offset.top = (img.height - size.height / dpr) / 2;

				if(!isDouble || index === 0) left += offset.left;
				if(!isScroll) top += offset.top;

				img.width = size.width / dpr;
				img.height = size.height / dpr;

				width = sizeClip.width / dpr;
				height = sizeClip.height / dpr;

				originalSize = true;
			}
		}
	}

	return {
		estimated: item.estimated,
		width,
		height,
		left,
		top,
		originalSize,
		offset,
		size,
		img,
	};
}

function applySizes(item: Item, cSizes: CalcSizes, sizes: Sizes, clip: Clip, last: boolean, isScroll: boolean)
{
	const round = app.roundDPR;

	const size = sizes.size;
	const imgSize = sizes.img;

	const height = round(sizes.height);
	const width = round(sizes.width);
	const top = round(sizes.top);
	const left = round(sizes.left);

	const marginBottom = round((isScroll && last) ? cSizes.vertical : 0);

	const rotated90 = size?.rotated == 1 || size?.rotated == 2;

	const imgMarginTop = -round(imgSize.height * clip.top);
	const imgMarginLeft = -round(imgSize.width * clip.left);
	const imgHeight = round(rotated90 ? imgSize.width : imgSize.height);
	const imgWidth = round(rotated90 ? imgSize.height : imgSize.width);

	const transform = size?.rotated ? reading.rotateImage(size.rotated) : '';

	const originalSize = sizes.originalSize;

	const apply = (image: HTMLDivElement) => {

		/*
		image.style.height = `${height}px`;
		image.style.width = `${width}px`;
		image.style.margin = `${top}px 0px ${marginBottom}px ${left}px`;

		image.dataset.height = String(imgSize.height);
		image.dataset.width = String(imgSize.width);
		image.dataset.left = String(left);
		image.dataset.top = String(top);

		const img = image.firstElementChild as HTMLImageElement;

		if(img)
		{
			img.style.marginTop = `${imgMarginTop}px`;
			img.style.marginLeft = `${imgMarginLeft}px`;
			img.style.height = `${imgHeight}px`;
			img.style.width = `${imgWidth}px`;
			img.style.transform = transform;

			img.classList.toggle('originalSize', originalSize);
		}
		*/

		const style = `height: ${height}px; width: ${width}px; margin: ${top}px 0px ${marginBottom}px ${left}px;`;

		image.setAttribute('style', style);
		// image.style.cssText = style;

		image.dataset.estimated = sizes.estimated ? '1' : '0';
		image.dataset.height = String(imgSize.height);
		image.dataset.width = String(imgSize.width);
		image.dataset.left = String(left);
		image.dataset.top = String(top);

		const img = image.firstElementChild as HTMLImageElement;

		if(img)
		{
			const style = `margin-top: ${imgMarginTop}px; margin-left: ${imgMarginLeft}px; height: ${imgHeight}px; width: ${imgWidth}px;${transform ? ` transform: ${transform};` : ''}`;

			img.setAttribute('style', style);
			// img.style.cssText = style;
			img.classList.toggle('originalSize', originalSize);
		}

	};

	if(item.element?.firstElementChild) apply(item.element.firstElementChild as HTMLDivElement);
	if(item.elementLens?.firstElementChild) apply(item.elementLens.firstElementChild as HTMLDivElement);

}

export default function disposeImages(data: Margin | boolean = false)
{
	const _margin = reading.margin(data) as Margin;

	const marginHorizontal = _margin.left;
	const marginVertical = _margin.top;
	const marginHorizontalsHorizontal = reading.horizontalsMargin(data).left;

	const contentRight = template._contentRight() as HTMLDivElement;
	const rect = contentRight.firstElementChild!.getBoundingClientRect();

	let contentWidth = rect.width;
	const contentHeight = rect.height;

	const isScroll = reading.viewIs('scroll') as boolean;

	if(isScroll)
		contentWidth = contentRight.querySelector('.reading-body')!.getBoundingClientRect().width;

	const width = contentWidth - (marginHorizontal * 2);
	const widthHorizontal = contentWidth - (marginHorizontalsHorizontal * 2);
	const height = contentHeight - (marginVertical * 2);

	const cSizes: CalcSizes = {
		width,
		height,
		aspectRatio: width / height,
		horizontal: marginHorizontal,
		vertical: marginVertical,
		horizontals: {
			width: widthHorizontal,
			height: height,
			aspectRatio: widthHorizontal / height,
			horizontal: marginHorizontalsHorizontal,
			vertical: marginVertical,
		},
	};

	const distribution = view.distribution!.currentDistribution;
	const imageClip = reading.imageClip();

	const clip = {
		top: imageClip.top / 100,
		bottom: imageClip.bottom / 100,
		left: imageClip.left / 100,
		right: imageClip.right / 100,
		vertical: (imageClip.top + imageClip.bottom) / 100,
		horizontal: (imageClip.left + imageClip.right) / 100,
	};

	for(let i = 0, len = distribution.length; i < len; i++)
	{
		const group = distribution[i];
		const last = i === len - 1;

		const joinLen = group.length;
		const joinWidth = group.reduce((total, item) => total + (cSizes.height * item.aspectRatio), 0);
		const joinMargin = (joinLen - 1) * cSizes.horizontal;

		const join: Join = {
			width: joinWidth,
			margin: joinMargin,
			sum: joinWidth + joinMargin,
			length: joinLen,
		};

		let prevSize: Sizes | null = null;
		const sizes: Sizes[] = new Array(joinLen);
		let maxHeight = 0;

		for(let i = joinLen - 1; i >= 0; i--)
		{
			const item = group[i];
			const referenceItem = i === 0 ? group[1] : group[0];

			calcAspectRatio(item, referenceItem);

			const size = calcSizes(item, cSizes, clip, join, isScroll, prevSize);

			sizes[i] = size;
			prevSize = size;

			if(isScroll && size.height > maxHeight)
				maxHeight = size.height;
		}

		for(let i = joinLen - 1; i >= 0; i--)
		{
			const item = group[i];
			const size = sizes[i];

			if(isScroll)
				size.top += (maxHeight - size.height) / 2;

			applySizes(item, cSizes, size, clip, last, isScroll);
		}
	}

	const rFlex = contentRight.querySelectorAll('.r-flex');

	for(let i = 0, len = rFlex.length; i < len; i++)
	{
		const flex = rFlex[i] as HTMLDivElement;

		flex.style.width = `${contentWidth}px`;
		flex.style.height = !isScroll ? `${contentHeight}px` : '';
	}
}
