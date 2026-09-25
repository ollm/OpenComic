import { select } from "events.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const dom: any;
declare const template: any;
declare const handlebarsContext: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type ItemType = 'image' | 'folder';

export interface SelectedItem {
	type: ItemType;
	element: HTMLElement;
	path: string;
	mainPath: string;
}

export interface SelectedItems {
	type: ItemType | null;
	items: SelectedItem[];
	lastItem: SelectedItem | null;
}

export interface MarqueeSelection {
	start: boolean;
	active: boolean;
	offsetX: number;
	offsetY: number;
	startX: number;
	startY: number;
	clientX: number;
	clientY: number;
	box?: Box;
}

export interface ScrollWithMouseStatus {
	active: boolean;
	content: HTMLElement | null;
	scrollTop: number;
	startScrollTop: number;
	headerHeight: number;
}

interface Box {
	left: number;
	top: number;
	width: number;
	height: number;
}

interface Item {
	left: number;
	top: number;
	width: number;
	height: number;
	selected: boolean;
}

const selectedItems: SelectedItems = {type: null, items: [], lastItem: null};

const marqueeSelection: MarqueeSelection = {
	start: false,
	active: false,
	offsetX: 0,
	offsetY: 0,
	startX: 0,
	startY: 0,
	clientX: 0,
	clientY: 0,
};

let initialized = false;

function init(): void {

	if(initialized)
		return;

	initialized = true;

	let menuActive = false;
	let dialogActive = false;
	let marqueeSelectionClick = false;

	app.event(window, 'mousedown', (event: MouseEvent) => {

		marqueeSelectionClick = false;
		menuActive = !!document.querySelector('#index-context-menu-new > .a');
		dialogActive = !!document.querySelector('.dialog');

		const contentRight = event.target && (event.target as HTMLElement).closest('.content-right');

		if(contentRight && contentRight.querySelector('.content-view-module, .content-view-list') && event.buttons === 1)
			marqueeSelection.start = true;

		marqueeSelection.startX = app.clientX(event);
		marqueeSelection.startY = app.clientY(event);

		const firstElementChild = template._contentRight().firstElementChild;
		const rect = firstElementChild.getBoundingClientRect();

		marqueeSelection.offsetX = rect.left;
		marqueeSelection.offsetY = rect.top;

	}, {capture: true});

	app.event(window, 'mouseup', (event: MouseEvent) => {

		const element = document.querySelector('.marquee-selection') as HTMLElement;
		if(element) element.remove();

		scrollWithMouseEnd();
		selectMarqueeItems(event);
		marqueeSelectionClick = marqueeSelection.active;

		marqueeSelection.start = false;
		marqueeSelection.active = false;

	}, {capture: true});

	app.event(window, 'mousemove', (event: MouseEvent) => {

		if(event.buttons !== 1 || !marqueeSelection.start)
			return;

		const clientX = app.clientX(event);
		const clientY = app.clientY(event);
		marqueeSelection.clientX = clientX;
		marqueeSelection.clientY = clientY;

		if(!marqueeSelection.active && (Math.abs(clientX - marqueeSelection.startX) > 5 || Math.abs(clientY - marqueeSelection.startY) > 5))
		{
			marqueeSelection.active = true;
			scrollWithMouseStart();
		}

		updateMarqueeSelection();

	}, {capture: true});

	app.event(window, 'click', (event: MouseEvent) => {

		if(marqueeSelectionClick)
		{
			marqueeSelectionClick = false;
			return;
		}

		const keyPressed = event.ctrlKey || event.shiftKey;

		if(!keyPressed && selectedItems.items.length === 0)
			return;

		if(menuActive || dialogActive)
			return;

		event.preventDefault();
		event.stopPropagation();

		if(!keyPressed)
		{
			unselectAll();
			return;
		}

		const fileItem = (event.target as HTMLElement).closest('.file-item') as HTMLElement;

		if(!fileItem)
			return;

		const boxItem = (event.target as HTMLElement).closest('.box-content') as HTMLElement;
		if(boxItem) return;

		const type = fileItem.dataset.type as ItemType;
		const path = fileItem.dataset.path as string;
		const mainPath = fileItem.dataset.mainPath as string;

		if(type !== selectedItems.type && selectedItems.type !== null)
			return;

		if(event.shiftKey && selectedItems.lastItem)
		{
			const lastItem = selectedItems.lastItem;
			const parent = fileItem.parentElement as HTMLElement;
			const array = Array.from(parent.children);

			const index = array.indexOf(fileItem);
			const lastIndex = array.indexOf(lastItem.element);

			selectedItems.items = [];

			const min = Math.min(index, lastIndex);
			const max = Math.max(index, lastIndex);

			for(let i = 0, len = array.length; i < len; i++)
			{
				const element = array[i] as HTMLElement;
				const type = element.dataset.type as ItemType;

				if(i >= min && i <= max && type === selectedItems.type)
				{
					const path = element.dataset.path as string;
					const mainPath = element.dataset.mainPath as string;
					const item: SelectedItem = {type, element, path, mainPath};

					selectItem(item);
				}
				else
				{
					element.classList.remove('multi-select');
				}
			}

			selectedItems.lastItem = lastItem;

			return;
		}

		const item: SelectedItem = {type, element: fileItem, path, mainPath};

		switchItem(item);

	}, {capture: true});

}

function switchItem(item: SelectedItem): void {

	if(item.element.classList.contains('multi-select'))
		unselectItem(item);
	else
		selectItem(item);

}

function selectItem(item: SelectedItem): void {

	if(selectedItems.type !== null && selectedItems.type !== item.type)
		return;

	item.element.classList.add('multi-select');

	if(!selectedItems.items.some(selectedItem => selectedItem.element === item.element))
		selectedItems.items.push(item);

	selectedItems.lastItem = item;

	if(selectedItems.type === null)
		selectedItems.type = item.type;

}

function unselectItem(item: SelectedItem): void {

	item.element.classList.remove('multi-select');
	selectedItems.items = selectedItems.items.filter(selectedItem => selectedItem.path !== item.path);
	selectedItems.lastItem = item;

	if(selectedItems.items.length === 0)
		selectedItems.type = null;

}

function updateMarqueeSelection(): void {

	if(marqueeSelection.active)
	{
		const {clientX, clientY} = marqueeSelection;

		let element = document.querySelector('.marquee-selection') as HTMLElement;

		if(!element)
		{
			element = document.createElement('div');
			element.classList.add('marquee-selection');
			template._contentRight().firstElementChild.appendChild(element);
		}

		const startX = marqueeSelection.startX;
		let startY = marqueeSelection.startY;

		const heightOffest = scrollWithMouseStatus.scrollTop - scrollWithMouseStatus.startScrollTop;
		startY -= heightOffest;

		const offsetX = marqueeSelection.offsetX;
		const offsetY = marqueeSelection.offsetY;

		const box: Box = {
			left: Math.min(clientX, startX) - offsetX,
			top: Math.min(clientY, startY) - offsetY,
			width: Math.abs(clientX - startX),
			height: Math.abs(clientY - startY)
		};

		marqueeSelection.box = box;

		element.style.left = box.left + 'px';
		element.style.top = box.top + 'px';
		element.style.width = box.width + 'px';
		element.style.height = box.height + 'px';

		previewMarqueeSelectionItems();
	}
}

let marqueeSelectionItems: Item[] = [];

function previewMarqueeSelectionItems(): void {

	if(!marqueeSelection.box) return;
	const box = marqueeSelection.box;

	const contentRight = template._contentRight();
	const scrollTop = contentRight.firstElementChild.scrollTop;
	const itemsDistribution = dom.calculateItemsDistribution(handlebarsContext.page.view, scrollTop);
	const rect = itemsDistribution.rect;

	const view = contentRight.querySelector('.content-view-module, .content-view-list');
	if(!view) return;

	const viewRect = view.getBoundingClientRect();

	const placeholderItems: Item[] = [];
	const items = Math.ceil(((box.height + box.top + scrollTop) / itemsDistribution.height)) * itemsDistribution.itemsPerLine;

	const isSelected = (left: number, top: number, width: number, height: number): boolean => {
		return !(box.left > left + width
			|| box.left + box.width < left
			|| box.top > top + height
			|| box.top + box.height < top);
	};

	const offsetTop = viewRect.top - rect.top;

	const marginLeft = itemsDistribution.itemsPerLine > 1 ? (rect.width - (itemsDistribution.itemsPerLine * itemsDistribution.width)) / (itemsDistribution.itemsPerLine - 1) : 0;
	const marginTop = 16; // Margin top it has already been applied in itemsDistribution.height

	for(let i = 0; i < items; i++)
	{
		const lineItem = (i % itemsDistribution.itemsPerLine);
		const rowNumber = Math.floor(i / itemsDistribution.itemsPerLine);

		const left = lineItem * itemsDistribution.width + (marginLeft * lineItem);
		const top = rowNumber * itemsDistribution.height + offsetTop;

		placeholderItems.push({
			left: left,
			top: top - scrollTop,
			width: itemsDistribution.width,
			height: itemsDistribution.height - marginTop,
			selected: isSelected(left, top, itemsDistribution.width, itemsDistribution.height),
		});
	}

	const fileItems = contentRight.querySelectorAll('.file-item');

	for(const [index, fileItem] of fileItems.entries())
	{
		const placeholderItem = placeholderItems[index];

		if(placeholderItem && placeholderItem.selected)
			fileItem.classList.add('preview-select');
		else
			fileItem.classList.remove('preview-select');
	}

	marqueeSelectionItems = placeholderItems;
}

function selectMarqueeItems(event: MouseEvent): void {

	if(!marqueeSelectionItems.length || !marqueeSelection.active)
		return;

	const contentRight = template._contentRight();
	const fileItems = contentRight.querySelectorAll('.file-item');

	if(!event.ctrlKey && !event.shiftKey)
		unselectAll();

	for(const [index, element] of fileItems.entries())
	{
		const placeholderItem = marqueeSelectionItems[index];
		element.classList.remove('preview-select');

		if(!placeholderItem?.selected)
			continue;

		const type = element.dataset.type as ItemType;
		const path = element.dataset.path as string;
		const mainPath = element.dataset.mainPath as string;
		const item: SelectedItem = {type, element, path, mainPath};

		if(event.shiftKey)
		{
			if(element.classList.contains('multi-select'))
				unselectItem(item);
		}
		else
		{
			selectItem(item);
		}
	}

	marqueeSelectionItems = [];

}

const scrollWithMouseStatus: ScrollWithMouseStatus = {
	active: false,
	content: null,
	scrollTop: 0,
	startScrollTop: 0,
	headerHeight: 0,
};

function scrollWithMouseStart(): void {

	const content = template._contentRight().firstElementChild;
	const rect = template._barHeader().getBoundingClientRect();

	scrollWithMouseStatus.active = true;
	scrollWithMouseStatus.content = content as HTMLElement;
	scrollWithMouseStatus.scrollTop = content.scrollTop;
	scrollWithMouseStatus.startScrollTop = content.scrollTop;
	scrollWithMouseStatus.headerHeight = rect.height + rect.top;

	scrollWithMouse();

}

function scrollWithMouseEnd(): void {

	scrollWithMouseStatus.active = false;
	scrollWithMouseStatus.content = null;
	scrollWithMouseStatus.scrollTop = 0;
	scrollWithMouseStatus.startScrollTop = 0;
	scrollWithMouseStatus.headerHeight = 0;

}

function scrollWithMouse(): void {

	if(!scrollWithMouseStatus.active || !scrollWithMouseStatus.content) return;

	const contentScrollTop = scrollWithMouseStatus.content.scrollTop;
	let scrollTop = scrollWithMouseStatus.scrollTop;

	if(Math.abs(contentScrollTop - scrollTop) > 5)
		scrollTop = contentScrollTop;

	const clientY = marqueeSelection.clientY - scrollWithMouseStatus.headerHeight;

	const height = window.innerHeight - scrollWithMouseStatus.headerHeight;
	const zone = height / 8;

	let offset = 0;

	if(clientY < zone)
		offset = clientY - zone;
	else if(clientY > height - zone)
		offset = clientY - (height - zone);

	offset = offset / zone * 15;

	if(offset != 0)
	{
		const scrollHeight = scrollWithMouseStatus.content.scrollHeight;
		scrollTop = scrollTop + offset;

		if(scrollTop < 0)
			scrollTop = 0;
		else if(scrollTop > scrollHeight)
			scrollTop = scrollHeight;

		scrollWithMouseStatus.scrollTop = scrollTop;
		scrollWithMouseStatus.content.scrollTop = scrollTop;

		updateMarqueeSelection();
	}

	window.requestAnimationFrame(scrollWithMouse);
}

function unselectAll() {

	selectedItems.items.forEach(item => item.element.classList.remove('multi-select'));
	selectedItems.items = [];
	selectedItems.type = null;
	selectedItems.lastItem = null;

}

export default {
	init,
	switchItem,
	selectItem,
	unselectItem,
	unselectAll,
	get selectedItems() {
		return selectedItems;
	},
};
