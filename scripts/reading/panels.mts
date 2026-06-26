import p from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import sharp from 'sharp';
import {setProperty} from 'dot-prop';
import OpenComicAI, {Yolo, Detection, Box} from 'opencomic-ai-bin';

import view from './view.mjs';
import corners from './panels/corners.mjs';

import {PanelsConfig, Point} from '@types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const dom: any;
declare const sha1: any;
declare const image: any;
declare const events: any;
declare const _config: any;
declare const reading: any;
declare const threads: any;
declare const language: any;
declare const template: any;
declare const tempFolder: any;
declare const compatible: any;
declare const handlebarsContext: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface HTMLDivElementMask extends HTMLDivElement {
	path?: string;
}

let panelsCache: Record<string, Detection> = {};
let currentPannel: number = 0;
let currentPage: number = 0;

function focusPage(page: number, fromScroll = false)
{
	if(!reading.viewIs('panels'))
		return;

	if(!fromScroll)
	{
		if(page !== currentPage)
			currentPannel = -1;

		currentPage = page;
		goToPanel();
	}
}

async function _getPanels(src: string): Promise<Detection>
{
	OpenComicAI.yolo.setSharp(sharp);

	// For test only
	const model = '/home/llopart/Documentos/github/panel-detection/oc-ai-panel-detection-test2.onnx';

	const _yolo: Yolo = {
		model,
		labels: ['panel'],
		providers: ['cpu'],
		inputShape: [1, 3, 640, 640],
		topk: 1000,
		scoreThreshold: 0.7,
		mask: {
			threshold: 0.5,
			minArea: 0,
			scale: 1,
			baseScale: 'model',
			cropToBox: 4,
			maxComponents: 1,
		},
	};

	// TODO, this has an error, its closing the session ignore idle timeout restart
	OpenComicAI.yolo.setIdleTimeout(5000); // (500);

	const folderSha = sha1(p.dirname(src));
	const imageSha = sha1(`${src}|panels`);

	const ext = app.extname(src);
	let imagePath: string = src, convertPath: string = '';

	// Images that are not jpg, png or webp are not supported by OpenComicAI
	if(!compatible.image.jpg.has(ext) && !compatible.image.png.has(ext) && !compatible.image.webp.has(ext))
	{
		const folderPath = p.join(tempFolder, 'ai', folderSha);
		convertPath = p.join(folderPath, imageSha + '.png');
		await fsp.mkdir(folderPath, {recursive: true});
		await image.toPng(src, convertPath);
		imagePath = convertPath;
	}

	// console.time('Detection');
	const _detection = await OpenComicAI.yolo.image(imagePath, _yolo);
	// console.timeEnd('Detection');

	if(convertPath)
		fs.rmSync(convertPath, {force: true});

	const detection = await OpenComicAI.yolo.path(_detection);

	return detection;
}

async function getPanels(src: string, page: number)
{
	if(!reading.viewIs('panels'))
		return;

	if(panelsCache[page])
		return;

	const threadsId = threads.id('panels');

	threads.job('panels', {useThreads: threads.SINGLE, delay: 100}, async function() {

		if(panelsCache[page])
			return;

		const panels = await _getPanels(src);
		if(threadsId !== threads.id('panels')) return;

		if(panels.boxes.length === 0)
		{
			const image = reading.getImage(page);

			panels.boxes = [
				{
					box: [0, 0, image.width, image.height],
					mask: [],
					width: image.width,
					height: image.height,
					label: 'panel',
					score: 1,
				},
			];
		}

		for(let i = 0; i < panels.boxes.length; i++)
		{
			const box = panels.boxes[i];
			panels.boxes[i].corners = corners(box.mask, box.width, box.height);
		}

		panels.boxes = sortBoxes(panels.boxes);
		panelsCache[page] = panels;

		if(currentPannel === -1 && page === currentPage)
			goToPanel();

	});
}

function closest(a: Point[], b: Point[]): [Point, Point]
{
	let bestA: Point = a[0];
	let bestB: Point = b[0];
	let bestDist = Infinity;

	for(let i = 0; i < a.length; i++)
	{
		const ax = a[i].x;
		const ay = a[i].y;

		for(let j = 0; j < b.length; j++)
		{
			const bx = b[j].x;
			const by = b[j].y;

			const dx = ax - bx;
			const dy = ay - by;
			const d = dx * dx + dy * dy;

			if(d < bestDist)
			{
				bestDist = d;
				bestA = a[i];
				bestB = b[j];
			}
		}
	}

	return [bestA, bestB];
}

function sortBoxes(boxes: Box[]): Box[]
{
	const first = boxes[0];
	const threshold = 0.05 * first.width;

	const invertX = function(point: Point): Point {

		if(!_config.readingManga)
			return point;

		point = {...point};
		point.x = -point.x;
		return point;

	};

	const compare = (a: Box, b: Box) => {

		const [aBottom, bBottom] = closest([invertX(a.corners.bottomLeft), invertX(a.corners.bottomRight)], [invertX(b.corners.bottomLeft), invertX(b.corners.bottomRight)]);
		const [aTop, bTop] = closest([invertX(a.corners.topLeft), invertX(a.corners.topRight)], [invertX(b.corners.topLeft), invertX(b.corners.topRight)]);

		// Same row
		if(
			Math.abs(aBottom.y - bBottom.y) < threshold // Bottom
			|| Math.abs(aTop.y - bTop.y) < threshold // Top
			|| (aTop.y + threshold > bTop.y && aBottom.y < bBottom.y + threshold) // a is inside b (b is bigger)
			|| (bTop.y + threshold > aTop.y && bBottom.y < aBottom.y + threshold) // b is inside a (a is bigger)
		)
			return invertX(a.corners.bottomRight).x - invertX(b.corners.bottomRight).x;

		return invertX(a.corners.topLeft).y - invertX(b.corners.topLeft).y;

	};

	// boxes.sort(compare);

	for(const box of boxes)
	{
		box.score = 0;
	}

	for(let i = 0; i < boxes.length; i++)
	{
		for(let j = 0; j < boxes.length; j++)
		{
			if(i !== j)
				boxes[j].score += compare(boxes[i], boxes[j]);
		}
	}

	boxes.sort((a, b) => b.score - a.score);

	return boxes;
}

function getPanel(page: number): Box[] | null
{
	if(page > reading.totalPages() || page < 1)
		return null;

	const panels = panelsCache[page];

	if(!panels || panels.boxes.length === 0)
		return [];

	return panels.boxes;
}

function updateCurrent()
{
	removeAllMasks();

	const animation = false;

	const boxes = getPanel(currentPage);
	if(!boxes) return false;

	const box = boxes[currentPannel];

	if(currentPannel === boxes.length && _config.readingViewConfig.panels.showFullPage.afterLastPanel)
	{
		focusFullPage(currentPage, animation);
		return true;
	}
	else if(currentPannel === -1 && _config.readingViewConfig.panels.showFullPage.beforeFirstPanel)
	{
		focusFullPage(currentPage, animation);
		return true;
	}

	if(!box)
		return false;

	focusPanel(box, currentPannel, currentPage, animation);
	return true;
}

function goToPanel()
{
	if(!panelsCache[currentPage])
		return;

	if(reading.readingDirection())
	{
		currentPannel = -1;
		goNext();
	}
	else
	{
		const boxes = getPanel(currentPage);
		if(!boxes) return false;

		currentPannel = boxes.length;
		goPrev();
	}
}

function goNext(animation: boolean = true): boolean
{
	if(!reading.viewIs('panels'))
		return false;

	let boxes = getPanel(currentPage);
	if(!boxes) return false;

	currentPannel++;

	if(currentPannel >= boxes.length)
	{
		if(currentPannel === boxes.length && _config.readingViewConfig.panels.showFullPage.afterLastPanel)
		{
			focusFullPage(currentPage, animation);
			return true;
		}

		currentPage++;
		currentPannel = -2;

		boxes = getPanel(currentPage);
		if(!boxes) return false;
	}

	if(currentPannel === -2 && _config.readingViewConfig.panels.showFullPage.beforeFirstPanel)
	{
		currentPannel++;
		focusFullPage(currentPage, animation);
		return true;
	}

	if(currentPannel < 0) currentPannel = 0;

	const box = boxes[currentPannel];

	if(!box)
		return false;

	focusPanel(box, currentPannel, currentPage, animation);
	return true;
}

function goPrev(animation: boolean = true): boolean
{
	if(!reading.viewIs('panels'))
		return false;

	let boxes = getPanel(currentPage);
	if(!boxes) return false;

	currentPannel--;

	if(currentPannel < 0)
	{
		if(currentPannel === -1 && _config.readingViewConfig.panels.showFullPage.beforeFirstPanel)
		{
			focusFullPage(currentPage, animation);
			return true;
		}

		currentPage--;

		boxes = getPanel(currentPage);
		if(!boxes) return false;

		currentPannel = boxes.length + 1;
	}

	if(currentPannel === boxes.length + 1 && _config.readingViewConfig.panels.showFullPage.afterLastPanel)
	{
		currentPannel--;
		focusFullPage(currentPage, animation);
		return true;
	}

	if(currentPannel > boxes.length - 1) currentPannel = boxes.length - 1;

	const box = boxes[currentPannel];

	if(!box)
		return false;

	focusPanel(box, currentPannel, currentPage, animation);
	return true;
}

function focusFullPage(page: number, animation: boolean = true)
{
	const box: Box = {
		box: [0, 0, 1, 1],
		width: 1,
		height: 1,
		label: 'panel',
		path: 'M0,0 L1,0 L1,1 L0,1 Z',
		score: 1,
	};

	focusPanel(box, -1, page, animation);
}

function focusPanel(box: Box, panel: number, page: number, animation: boolean = true)
{
	// Page position
	const position = view.pagesPosition[page];
	const original = position.original;
	const image = reading.getImage(page);

	// Viewport
	const {width, height} = view.viewSize(true);
	const center = width / 2;

	// const viewAspectRatio = width / height;

	// Config
	const panelsConfig = _config.readingViewConfig.panels as PanelsConfig;

	// Margin
	const {top} = reading.margin();

	const diff = Math.max(original.width, original.height) / box.width;

	const panels: Box[] = [box];

	const boxes = getPanel(page);
	if(!boxes) return false;

	// Focus in the prev panels
	if(panelsConfig.focus.prevPanels > 0)
	{
		const start = (panel - panelsConfig.focus.prevPanels);
		const prevPanels = boxes.slice(start < 0 ? 0 : start, panel);
		panels.unshift(...prevPanels);
	}

	// Focus in the next panels
	if(panelsConfig.focus.nextPanels > 0)
	{
		const nextPanels = boxes.slice(panel + 1, (panel + 1) + panelsConfig.focus.nextPanels);
		panels.push(...nextPanels);
	}

	const normalized: [number, number, number, number][] = panels.map(panel => panel.box.map(v => v * diff) as [number, number, number, number]);

	let x1 = Math.min(...normalized.map(v => v[0]));
	let y1 = Math.min(...normalized.map(v => v[1]));
	let x2 = Math.max(...normalized.map(v => v[2]));
	let y2 = Math.max(...normalized.map(v => v[3]));

	// let [x1, y1, x2, y2] = box.box.map(v => v * diff);

	let boxWidth = x2 - x1;
	let boxHeight = y2 - y1;

	// DEBUG BOX
	{
		if(!view.distribution) return;
		const item = view.distribution.currentDistribution[position.i][position.j];

		const test = item.element?.querySelector('.test');
		if(test) test.remove();

		const path = item.element?.querySelector('.path');
		if(path) path.remove();

		const ocImg = item.element?.querySelector('oc-img');

		if(ocImg)
		{
			// const scaleX = (1 / original.width) * 100;
			// const scaleY = (1 / original.height) * 100;

			// ocImg.insertAdjacentHTML('beforeend', `<div class="test" style="position: absolute; left: ${x1 * scaleX}%; top: ${y1 * scaleY}%; width: ${boxWidth * scaleX}%; height: ${boxHeight * scaleY}%; border: 2px solid red; z-index: 5; background: transparent; box-sizing: border-box;"></div>`);
			/*
			ocImg.insertAdjacentHTML('beforeend', `
			<div class="path" style="position: absolute; left: 0%; top: 0%; width: 100%; height: 100%; z-index: 5; background: transparent; box-sizing: border-box; fill: transparent;">
				<svg width="640" height="640">
					<path d="${box.path}" stroke="#FFB21D" stroke-width="2"/>
				</svg>
			</div>
			`);
			*/
		}
	}

	applyHideMasks(box, panel, page, animation);

	{
		const topBox = (panelsConfig.margin * (boxHeight / height));
		y1 = y1 - topBox;
		y2 = y2 + topBox;
	}
	{
		const leftBox = (panelsConfig.margin * (boxWidth / width));
		x1 = x1 - leftBox;
		x2 = x2 + leftBox;
	}

	boxWidth = x2 - x1;
	boxHeight = y2 - y1;

	// const boxAspectRatio = boxWidth / boxHeight;

	// Scale / Zoom
	const scaleX = (original.width / boxWidth) * (width / original.width);
	const scaleY = (original.height / boxHeight) * (height / original.height);

	let scale = Math.min(scaleX, scaleY);

	if(_config.readingViewConfig.panels.maxZoom.active)
	{
		const size = reading.ai.size(image) || [];
		scale = Math.min(scale, (size.width / original.width * _config.readingViewConfig.panels.maxZoom.value) / window.devicePixelRatio);
	}

	// Position
	const xCentrate = (width - boxWidth * scale) / 2 / scale;
	const yCentrate = (height - boxHeight * scale) / 2 / scale;

	/*
	if(boxAspectRatio < viewAspectRatio)
		xCentrate = (width - boxWidth * scale) / 2 / scale;
	else
		yCentrate = (height - boxHeight * scale) / 2 / scale;
	*/

	const goToX = (x1 - xCentrate) / original.width;
	const goToY = (y1 - yCentrate) / original.height;

	// X works from center of the view
	const _center = center / scale;

	const availableX = original.width; // - width / scale;
	const availableY = original.height; // - height / scale;

	const baseX = (center - original.left) - _center;
	const baseY = original.top + top;

	const tranX = baseX + (availableX * -goToX);
	let tranY = baseY + (availableY * goToY);

	// TODO: Limitate tranY to min scroll and max scroll, and tranX to min and max scroll
	if(tranY < 0) tranY = 0;

	reading.applyScale(animation, scale, false, false, false, {
		// force: true,
		tranX: tranX * scale,
		tranY: -(tranY * scale),
		crossZoomLimits: true, // TODO: Use this or not?
	});
}

function applyHideMasks(box: Box, panel: number, page: number, animation: boolean = true): void
{
	if(_config.readingViewConfig.panels.type === 'focus')
		return;

	// Config
	const panelsConfig = _config.readingViewConfig.panels as PanelsConfig;

	const animationDurationS = ((animation) ? _config.readingViewSpeed : 0);

	const position = view.pagesPosition[page];
	const original = position.original;
	// const image = reading.getImage(page);

	// Margin
	const {top} = reading.margin();

	const diff = Math.max(original.width, original.height) / box.width;

	const path = function(_string: string, original: {top: number; left: number} = {top: 0, left: 0}): {path: string; width: number; height: number} {

		const split = _string.split(/(-?[0-9]+(?:\.[0-9]+)?\s+-?[0-9]+(?:\.[0-9]+)?)/).map(v => v.trim()).filter(v => v.length > 0);

		let width = 0;
		let height = 0;

		for(let i = 0; i < split.length; i++)
		{
			const v = split[i];

			if(/(-?[0-9]+(?:\.[0-9]+)?\s+-?[0-9]+(?:\.[0-9]+)?)/.test(v))
			{
				let [x, y] = v.split(/\s+/).map(v => parseFloat(v));

				x = x * diff + original.left;
				y = y * diff + original.top + top;

				if(x > width) width = x;
				if(y > height) height = y;

				split[i] = `${x} ${y}`;
			}
		}

		return {path: split.join(' '), width, height};

	};

	const expandPanel = panelsConfig.expandPanel;

	if(panelsConfig.type === 'hide')
	{
		let index = 0;
		let currentIndex = 0;

		interface HidePanels {
			panel: number;
			page: number;
			box: Box;
		};

		const panels: HidePanels[] = [];

		for(let _page = page - 2; _page <= page + 2; _page++)
		{
			const boxes = getPanel(_page);
			if(!boxes) continue;

			for(panel = 0; panel < boxes.length; panel++)
			{
				panels.push({panel, page: _page, box: boxes[panel]});

				if(_page === page && panel === currentPannel)
					currentIndex = index;

				index++;
			}
		}

		const prevPanels = panelsConfig.visibility.prevPanels;
		const nextPanels = panelsConfig.visibility.nextPanels;

		const toHide: HidePanels[] = [];
		const toShow: HidePanels[] = [];

		for(let i = 0; i < panels.length; i++)
		{
			const panel = panels[i];

			if(i === currentIndex)
			{
				toShow.push(panel);
			}
			else if(i < currentIndex && (prevPanels === -1 || (currentIndex - i) <= prevPanels))
			{
				toShow.push(panel);
			}
			else if(i > currentIndex && (nextPanels === -1 || (i - currentIndex) <= nextPanels))
			{
				toShow.push(panel);
			}
			else
			{
				toHide.push(panel);
			}
		}

		const contentRight = template._contentRight();
		const bodies = contentRight.querySelectorAll('.reading-body > div, .reading-lens > div > div');

		for(const body of bodies)
		{
			const masks = body.querySelectorAll('.reading-panels-hide-mask');
			const isset = new Map<string, HTMLDivElement>();

			for(let i = 0; i < masks.length; i++)
			{
				const mask = masks[i] as HTMLDivElement;

				const panel = +mask.dataset.panel!;
				const page = +mask.dataset.page!;

				isset.set(`${panel},${page}`, mask);
			}

			for(const {panel, page} of toShow)
			{
				const mask = isset.get(`${panel},${page}`);

				if(mask)
				{
					mask.classList.add('hide');
					mask.dataset.panel = '';
					mask.dataset.page = '';

					setTimeout(() => {
						mask.remove();
					}, animationDurationS * 1000);
				}
			}

			for(const {panel, page, box} of toHide)
			{
				const mask = isset.get(`${panel},${page}`);

				if(!mask)
				{
					const position = view.pagesPosition[page];
					const original = position.original;

					const {path: pathM/* , width, height */} = path(box.path);

					const mask = document.createElement('div') as HTMLDivElementMask;
					mask.className = `reading-panels-hide-mask reading-panels-mask-${panelsConfig.hideEffect} animate`;
					mask.style.maskImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><path stroke='white' stroke-width='${expandPanel}' d='${pathM}' fill='white'/></svg>")`;
					mask.style.top = `${original.top}px`;
					mask.style.left = `${original.left}px`;
					// mask.style.width = `${width}px`;
					// mask.style.height = `${height}px`;
					mask.style.width = `${original.width}px`;
					mask.style.height = `${original.height}px`;
					mask.style.animationDelay = `${animationDurationS / 8}s`;
					mask.style.animationDuration = `${animationDurationS / 2}s`;
					mask.dataset.panel = `${panel}`;
					mask.dataset.page = `${page}`;
					mask.path = pathM;
					body.appendChild(mask);

					setTimeout(() => {
						mask.classList.remove('animate');
					}, animationDurationS * 1000);
				}
			}
		}
	}
	else if(panelsConfig.type === 'immersive')
	{
		const contentRight = template._contentRight();
		const bodies = contentRight.querySelectorAll('.reading-body > div, .reading-lens > div > div');

		for(const body of bodies)
		{
			const prevMasks = body.querySelectorAll('.reading-panels-immersive-mask');

			const paths: string[] = [];
			const pathsHide: string[] = [];

			for(const mask of prevMasks)
			{
				paths.push(mask.path || '');
				pathsHide.push(mask.path || '');
				mask.remove();
			}

			const pathM = path(box.path, original).path;
			paths.push(pathM);

			const mask = document.createElement('div') as HTMLDivElementMask;
			mask.className = `reading-panels-immersive-mask reading-panels-mask-${panelsConfig.hideEffect} ${!prevMasks.length ? 'animate' : ''}`;
			mask.style.maskImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><path stroke='white' stroke-width='${expandPanel}' d='${pathM}' fill='white'/></svg>"), linear-gradient(#000 0 0)`;
			mask.style.animationDuration = prevMasks.length ? '0s' : `${animationDurationS}s`;
			mask.style.opacity = (pathsHide.length && animationDurationS) ? '0' : '1';
			mask.path = pathM;
			body.appendChild(mask);

			if(pathsHide.length && animationDurationS)
			{
				const masks = document.createElement('div') as HTMLDivElementMask;
				masks.className = `reading-panels-immersive-mask reading-panels-mask-${panelsConfig.hideEffect}`;
				masks.style.maskImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>${paths.map(path => `<path stroke='white' stroke-width='${expandPanel}' d='${path}' fill='white'/>`)}</svg>"), linear-gradient(#000 0 0)`;
				masks.style.animationDuration = prevMasks.length ? '0s' : `${animationDurationS}s`;
				body.appendChild(masks);

				const showMaskUrl = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><path stroke='white' stroke-width='${expandPanel + 2}' d='${pathM}' fill='white'/></svg>")`;

				const hideMask = document.createElement('div') as HTMLDivElementMask;
				hideMask.className = `reading-panels-immersive-hide-mask reading-panels-mask-${panelsConfig.hideEffect} animate`;
				hideMask.style.maskImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>${pathsHide.map(path => `<path stroke='white' stroke-width='${expandPanel + 2}' d='${path}' fill='white'/>`)}</svg>"), ${showMaskUrl}`;
				hideMask.style.animationDelay = '0s'; // `${animationDurationS / 8}s`;
				hideMask.style.animationDuration = `${animationDurationS}s`; // `${animationDurationS / 2}s`;
				body.appendChild(hideMask);

				const showMask = document.createElement('div') as HTMLDivElementMask;
				showMask.className = `reading-panels-immersive-show-mask reading-panels-mask-${panelsConfig.hideEffect} animate`;
				showMask.style.maskImage = showMaskUrl;
				showMask.style.animationDelay = '0s'; // `${animationDurationS / 8}s`;
				showMask.style.animationDuration = `${animationDurationS}s`; // `${animationDurationS / 2}s`;
				body.appendChild(showMask);

				setTimeout(() => {
					masks.remove();
					hideMask.remove();
					showMask.remove();
					mask.classList.remove('animate');
					mask.style.opacity = '1';
				}, animationDurationS * 1000);
			}
		}
	}
}

function removeAllMasks()
{
	const contentRight = template._contentRight();
	dom.this(contentRight).find('.reading-panels-hide-mask, .reading-panels-immersive-mask, .reading-panels-immersive-hide-mask, .reading-panels-immersive-show-mask', true).remove();
}

function reset()
{
	threads.clean('panels');
	currentPannel = -1;
	panelsCache = {};
}

function configDialog(event: PointerEvent): PanelsConfig | void
{
	event.stopPropagation();

	handlebarsContext.angle = _config.readingViewConfig.smoothPageTurn.angle;

	events.dialog({
		header: language.reading.pages.panels,
		width: 500,
		// height: 234,
		height: false,
		content: template.load('dialog.reading.transition.config.panels.html'),
		buttons: [
			{
				text: language.buttons.close,
				function: 'events.closeDialog();',
			},
		],
	});

	events.events();
}

function change(key: string, value: unknown)
{
	let element: HTMLElement | null;
	let current: unknown;

	switch(key)
	{
		case 'type':

			element = document.querySelector('.reading-panels-type');
			current = _config.readingViewConfig.panels.hideEffect;

			if(current != value)
			{
				dom.this(element).find('.chip.active', true).removeClass('active');
				dom.this(element).find(`.chip.reading-panels-${value}`, true).addClass('active');

				removeAllMasks();
			}

			dom.queryAll('.reading-panels-hide-effect-title, .reading-panels-hide-effect, .reading-panels-expand-panel').class((value === 'focus'), 'disable-pointer');
			dom.queryAll('.reading-panels-visibility-prev, .reading-panels-visibility-next').class((value !== 'hide'), 'disable-pointer');

			break;

		case 'hideEffect':

			element = document.querySelector('.reading-panels-hide-effect');
			current = _config.readingViewConfig.panels.hideEffect;

			if(current != value)
			{
				dom.this(element).find('.chip.active', true).removeClass('active');
				dom.this(element).find(`.chip.reading-panels-hide-effect-${value}`, true).addClass('active');
			}

			break;

		case 'maxZoom.active':

			element = document.querySelector('.reading-panels-zoom');
			dom.this(element).class(!value, 'disable-pointer');

			break;
	}

	setProperty(_config.readingViewConfig.panels, key, value);
	reading.updateReadingPagesConfig('readingViewConfig', _config.readingViewConfig);

	updateCurrent();
}

export default {
	focusPage,
	getPanels,
	reset,
	goNext,
	goPrev,
	configDialog,
	change,
	updateCurrent,
	get panelsCache() {return panelsCache},
};
