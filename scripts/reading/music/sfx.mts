import {Box} from '@types';
import {Item} from '../view/distribution.mjs'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const dom: any;
declare const config: any;
declare const reading: any;
declare const fileManager: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Sfx extends Box {
	key: number;
	path: string;
	page: number;
	overlap?: number;
}

interface HTMLDivElementSfx extends HTMLDivElement {
	_sfx?: boolean;
}

let sfx: Sfx[] = [];
const sfxMap: Map<number, Sfx[]> = new Map();

let inPercentage = false;

function set(_sfx: Sfx[]) {

	inPercentage = _sfx.some((sfx: Sfx) => sfx.top > 1 || sfx.left > 1 || sfx.width > 1 || sfx.height > 1);

	if(!inPercentage)
		_sfx = _sfx.map((sfx: Sfx) => ({...sfx, top: sfx.top * 100, left: sfx.left * 100, width: sfx.width * 100, height: sfx.height * 100}));

	sfx = _sfx.map((sfx: Sfx, key: number) => ({...sfx, key}));
	sfxMap.clear();

	for(const s of sfx)
	{
		if(!sfxMap.has(s.page))
			sfxMap.set(s.page, []);

		sfxMap.get(s.page)!.push(s);
	}

}

function render(pages: number[] = []): void {

	if(!config.readingMusic.sfx.active)
		return;

	const doublePage = reading.doublePage.active();
	const index = pages[0];

	pages.push(...(doublePage ? [index - 1, index - 2] : [index - 1]));
	pages.push(...(doublePage ? [index + 2, index + 3] : [index + 1]));

	const pagesSet = new Set(pages);

	const pagesItems: Item[] = [];

	for(const item of reading.view.distribution.items as Item[])
	{
		const page = item.index;

		if(pagesSet.has(page))
			pagesItems.push(item);
	}

	for(const item of pagesItems)
	{
		const element = item.element as HTMLDivElementSfx;

		if(!element) continue;
		if(element._sfx) continue;

		element._sfx = true;

		const pageSfx = sfxMap.get(item.index);
		if(!pageSfx) continue;

		const ocImg = element.querySelector('oc-img');
		if(!ocImg) continue;

		const templateBody = document.createElement('template');

		for(const sfx of pageSfx)
		{
			const sfxElement = document.createElement('oc-sfx');
			sfxElement.style.cssText = `top: ${sfx.top.toString()}%; left: ${sfx.left.toString()}%; width: ${sfx.width.toString()}%; height: ${sfx.height.toString()}%;`;

			sfxElement.addEventListener('click', function(event) {

				event.stopPropagation();
				play(sfx.key);

			});

			templateBody.content.appendChild(sfxElement);
		}

		ocImg.appendChild(templateBody.content);
	}
}

function remove(): void {

	dom.queryAll('oc-sfx').remove();
	const images = document.querySelectorAll('.r-img');

	for(const img of images)
	{
		(img as HTMLDivElementSfx)._sfx = false;
	}

}

function play(key: number): void {

	const sound = sfx.find((sfx: Sfx) => sfx.key === key);
	if(!sound) return;

	reading.music.sound(fileManager.realPath(sound.path), {
		volume: 1,
		loop: false,
		fadeIn: config.readingMusic.sfx.fade,
		fadeOut: config.readingMusic.sfx.fade,
		play: true,
	});

}

function overlapPercent(box1: Box, box2: Box): number {

	const left = Math.max(box1.left, box2.left);
	const top = Math.max(box1.top, box2.top);
	const right = Math.min(box1.left + box1.width, box2.left + box2.width);
	const bottom = Math.min(box1.top + box1.height, box2.top + box2.height);

	const width = Math.max(0, right - left);
	const height = Math.max(0, bottom - top);

	const intersection = width * height;

	const smallerArea = Math.min(
		box1.width * box1.height,
		box2.width * box2.height,
	);

	return smallerArea === 0 ? 0 : intersection / smallerArea;

}

function playBox(page: number, box: Box): void {

	if(!config.readingMusic.sfx.active)
		return;

	const list = sfxMap.get(page);
	if(!list) return;

	const overlap = list.map((sfx: Sfx) => ({...sfx, overlap: overlapPercent(box, sfx)}));

	const filtered = overlap.filter((sfx: Sfx) => sfx.overlap! > 0.2);
	filtered.sort((a: Sfx, b: Sfx) => b.overlap! - a.overlap!);

	if(filtered.length === 0)
		return;

	play(filtered[0].key);

}

export default {
	set,
	render,
	remove,
	play,
	playBox,
};
