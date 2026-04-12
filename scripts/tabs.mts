import animateCssVar from './animate-css-var.mjs';
import drag from './tabs/drag.mjs';
import state from './tabs/state.mjs';
import restore from './tabs/restore.mjs';

import {History, HistoryItem} from '@types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const p: any;
declare const app: any;
declare const dom: any;
declare const config: any;
declare const template: any;
declare const compatible: any;
declare const fileManager: any;
declare const reading: any;
declare const events: any;
declare const handlebarsContext: any;
declare const onReading: boolean;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type TabType = 'normal' | 'reading';

export interface TabData {
	scrollTop: number;
	history: History;
	data?: unknown;
}

export interface Tab {
	id: number;
	title: string;
	element: HTMLElement;
	separator: HTMLElement;
	type: TabType;
	icon: string;
	active: boolean;
	position: number;
	parents: number[];
	data: TabData;
	restored?: boolean;
	dragOffset?: {
		x: number;
		y: number;
	};
}

let tabs: Tab[] = [];
let idCounter = 0;

function add(tab: Partial<Tab>, isComic: boolean = false, animation: boolean = true): number
{
	const id = idCounter++;

	const contentLeft = template._contentLeft() as HTMLElement;
	const materialIcon = contentLeft.querySelector('.menu-item.active .material-icon');

	const icon = materialIcon && !isComic ? materialIcon.innerHTML : (isComic ? 'auto_stories' : 'indeterminate_question_box');

	const activeTab = getActive();
	const parents = getTabParentsIds(activeTab, true);

	const _tab: Partial<Tab> = {
		id: id,
		title: tab.title || 'Untitled',
		type: tab.type || 'normal',
		icon: tab.icon || icon || 'book',
		active: tab.active || false,
		position: tabs.length,
		parents: parents,
		data: {
			scrollTop: 0,
			history: tab?.data?.history ?? dom.history.serialize(),
			// firstLoad: ,
		},
		restored: !animation,
	};

	const insertAfterTab = activeTab ? lastChildTab(activeTab.id, true) : false;

	if(insertAfterTab)
	{
		_tab.position = insertAfterTab.position + 1;
		tabs.map(function(tab) {

			if(tab.position > insertAfterTab.position)
				tab.position++;

			return tab;

		});
	}

	handlebarsContext.tab = _tab;

	document.querySelector('.tabs-bar > div > div')?.insertAdjacentHTML('beforeend', template.load('tabs.bar.tab.html'));

	const tabElement = document.querySelector(`.tabs-bar .tab--${id}`) as HTMLElement;
	const tabSeparator = document.querySelector(`.tabs-bar .tab-separator--${id}`) as HTMLElement;

	_tab.element = tabElement;
	_tab.separator = tabSeparator;

	tabs.push(_tab as Tab);

	setTimeout(function() {
		tabElement.classList.remove('opening');
	}, 200);

	visibility(animation);
	setTabPositions();

	window.requestAnimationFrame(function() {
		setTabWidth();
		setTabPositions();
	});

	events.eventHover();
	drag.add(id);
	setEvents(_tab as Tab);

	return id;
}

function get(tabId: number): Tab | undefined
{
	return tabs.find(t => t.id === tabId);
}

function getByPosition(position: number): Tab | undefined
{
	return tabs.find(t => t.position === position);
}

function getActive(): Tab | undefined
{
	return tabs.find(t => t.active);
}

function addCurrentTab(animation: boolean = true)
{
	add({active: true}, false, animation);
	update();
}

function getTabParentsIds(tab?: Tab, returnCurrent: boolean = false, depp: number = 0): number[]
{
	if(!tab)
		return [];

	const parents = returnCurrent ? [tab.id] : [];

	for(const parentId of tab.parents)
	{
		parents.push(parentId);
		const parentTab = get(parentId);

		if(parentTab && depp < 10)
			parents.push(...getTabParentsIds(parentTab, false, depp + 1));
	}

	return parents;

}

function lastChildTab(parent: number, consecutive: boolean = true): Tab | undefined
{
	let lastTab: Tab | undefined = undefined;
	let started = false;

	for(const tab of tabs)
	{
		if(tab.id === parent)
			started = true;

		if(!started)
			continue;

		if(tab.id === parent || tab.parents.includes(parent))
			lastTab = tab;
		else if(consecutive)
			break;
	}

	return lastTab;
}

function openPath(path: string, mainPath: string)
{
	if(tabs.length === 0)
		addCurrentTab();

	const history = dom.history.serialize();

	const file = p.basename(path);

	const data: HistoryItem = {
		file: file,
		indexLabel: {},
		isComic: compatible.image(path),
		mainPath: mainPath,
		path: path,
	};

	history.current = data;
	history.forwardHistory = [];
	history.history = [...history.history, data];

	const compressed = fileManager.isCompressed(path);

	return add({
		title: dom.metadataPathName({path: path, name: file, compressed}),
		data: {history, scrollTop: 0},
	});
}

function openTab(title: string, icon: string, historyList: HistoryItem[])
{
	if(tabs.length === 0)
		addCurrentTab();

	const history = dom.history.serialize();
	const current = historyList[historyList.length - 1];

	history.current = current;
	history.forwardHistory = [];
	history.history = [...history.history, ...historyList];

	return add({
		title,
		icon,
		data: {history, scrollTop: 0},
	});
}

function updateData(id: number, tab: Partial<Tab>, retrieveData: boolean = true): void
{
	const _tab = get(id);
	if(!_tab) return;

	if(tab.title !== undefined)
	{
		_tab.title = tab.title;
		const titleElement = _tab.element.querySelector('.tab-title');
		if(titleElement) titleElement.innerHTML = tab.title;
		_tab.element.setAttribute('hover-text', tab.title);
	}

	if(tab.icon !== undefined)
	{
		_tab.icon = tab.icon;
		const iconElement = _tab.element.querySelector('i:first-of-type');
		if(iconElement) iconElement.innerHTML = tab.icon;
	}

	if(tab.active !== undefined)
	{
		_tab.active = tab.active;

		if(tab.active)
			_tab.element.classList.add('active');
		else
			_tab.element.classList.remove('active');
	}

	if(tab.type !== undefined) _tab.type = tab.type;
	if(retrieveData) _tab.data = retrieveCurrentData();
	if(tab.data !== undefined) _tab.data = tab.data;
}

function update(retrieveData: boolean = false): void
{
	const activeTab = getActive();
	if(!activeTab) return;

	const contentLeft = template._contentLeft() as HTMLElement;
	const materialIcon = contentLeft.querySelector('.menu-item.active .material-icon');

	const icon = materialIcon && !onReading ? materialIcon.innerHTML : (onReading ? 'auto_stories' : 'indeterminate_question_box');

	const barHeader = template._barHeader();
	const title = (barHeader.querySelector('.bar-title-a:last-child') ?? barHeader.querySelector('.bar-title'))?.innerHTML.trim() || 'Untitled';

	const type = onReading ? 'reading' : 'normal';

	updateData(activeTab.id, {icon, title, type}, retrieveData);
	restore.save();
}

let lastUsedTabs: number[] = [];

async function _switch(id: number): Promise<void>
{
	const tab = get(id);
	if(!tab) return;

	if(onReading && !reading.isLoaded())
		return;

	if(tab.element.classList.contains('dragging'))
		return;

	lastUsedTabs.push(id);
	lastUsedTabs = lastUsedTabs.slice(-20);

	const activeTab = getActive();
	if(activeTab && activeTab.id === id) return;

	if(activeTab)
		updateData(activeTab.id, {active: false});

	updateData(id, {active: true}, false);
	await goTab(tab);
	restore.save();
	setTabPositions();
}

let goTabST: NodeJS.Timeout | false = false;

async function goTab(tab: Tab): Promise<void>
{
	if(goTabST)
		clearTimeout(goTabST);

	dom.queryAll('.bar-header, .content-left, .content-right').addClass('disable-transitions-and-animations');

	if(onReading) reading.progress.save();
	dom.history.load(tab.data.history);
	await dom.history.goTo(tab.data.history.current, false);

	state.set(tab.data.history, tab.data.data);

	if(!tab.data.history.current.isComic)
	{
		const contentElement = template._contentRight().firstElementChild as HTMLElement;
		if(contentElement) contentElement.scrollTop = tab.data.scrollTop;
	}

	goTabST = setTimeout(function() {

		dom.queryAll('.bar-header, .content-left, .content-right').removeClass('disable-transitions-and-animations');
		goTabST = false;

	}, 10);
}

function findLastUsedTab(): Tab | void
{
	for(let i = lastUsedTabs.length - 1; i >= 0; i--)
	{
		const tabId = lastUsedTabs[i];
		const tab = get(tabId);
		if(tab) return tab;
	}

	return;
}

async function close(id: number, force: boolean = false, animation: boolean = true): Promise<void>
{
	const tabIndex = tabs.findIndex(t => t.id === id);
	if(tabIndex === -1) return;
	const tab = tabs[tabIndex];

	if(tab.element.classList.contains('dragging') && !force)
		return;

	if(tabs.length <= 1)
		return;

	tabs.splice(tabIndex, 1);

	if(tab.active)
	{
		const lastusedTab = findLastUsedTab();

		if(lastusedTab)
			await _switch(lastusedTab.id);
		else
			await _switch(tabs[0]?.id);
	}

	tab.element.classList.add('closing');

	setTimeout(function() {

		tab.element.remove();

	}, animation ? 200 : 0);

	visibility();
	setTabPositions();

}

function middleClickOpen(event: MouseEvent, path: string, mainPath: string): void
{
	if(event.button !== 1) return;
	openPath(path, mainPath);
}

function middleClickClose(event: MouseEvent, id: number): void
{
	if(event.button !== 1) return;
	close(id);
}

function retrieveCurrentData(): TabData
{
	const contentElement = template._contentRight().firstElementChild as HTMLElement;
	const scrollTop = contentElement ? contentElement.scrollTop : 0;

	const history = dom.history.serialize();

	const data = state.get(history);

	return {
		scrollTop,
		history,
		data,
	};
}

function visibility(animation: boolean = true): void
{
	const _app = document.querySelector('.app') as HTMLElement;
	if(!_app) return;

	let diff: boolean;

	let from = 0;
	let to = 41;

	if(tabs.length <= 1 && !config.showAlwaysTabsBar)
	{
		diff = _app.classList.contains('visible-tabs-bar');
		_app.classList.remove('visible-tabs-bar');
		from = 41;
		to = 0;
	}
	else
	{
		diff = !_app.classList.contains('visible-tabs-bar');
		_app.classList.add('visible-tabs-bar');
	}

	if(!diff || !animation)
		return;

	animateCssVar({
		name: 'tabs-bar-height',
		from: from,
		to: to,
		duration: 200,
		bezier: 'easeInBezier',
		removeOnEnd: true,
	});
}

let currentTabWidth: number = 0;

function setTabWidth()
{
	const _app = document.querySelector('.app') as HTMLElement;
	if(!_app) return;

	const width = window.innerWidth;

	const len = tabs.length;
	let tabWidth = (width - (len * 6) - 6) / len;

	if(tabWidth > 220)
		tabWidth = 220;
	else if(tabWidth < 90)
		tabWidth = 90;

	currentTabWidth = tabWidth;
	_app.style.setProperty('--tabs-bar-tab-width', tabWidth + 'px');
}

function hideSeparators(mainTab: Tab | undefined = undefined)
{
	const activeTab = getActive();

	// Hide prev and next separators
	const hideSeparators: number[] = [
		...(activeTab ? [activeTab.position, activeTab.position - 1] : []),
		tabs[tabs.length - 1].position,
	];

	if(mainTab)
	{
		hideSeparators.push(mainTab.position);
		hideSeparators.push(mainTab.position - 1);
	}

	for(const tab of tabs)
	{
		tab.separator.style.opacity = hideSeparators.includes(tab.position) ? '0' : '1';
	}
}

interface SetTabPositionsOptions {
	animation?: boolean;
	tab?: Tab;
}

function setTabPositions({animation = true, tab = undefined}: SetTabPositionsOptions = {}): void
{
	tabs.sort((a, b) => a.position - b.position);
	tabs = tabs.map(function(tab, index) {

		tab.position = index;
		return tab;

	});

	for(const tab of tabs)
	{
		tab.element.style.transition = animation ? 'transform 0.2s, width 0.2s' : '';
		tab.element.style.transform = `translateX(calc((var(--tabs-bar-tab-width) + 6px) * ${tab.position}))`;
	}

	hideSeparators(tab);
	restore.save();
}

function setEvents(tab: Tab): void
{
	tab.element.addEventListener('click', function() {

		if(!drag.state.active)
			_switch(tab.id);

	});

	tab.element.addEventListener('mouseup', function(event) {

		middleClickClose(event as MouseEvent, tab.id);

	});

	tab.element.addEventListener('pointerenter', function() {

		hideSeparators(tab);

	});

	tab.element.addEventListener('pointerleave', function() {

		hideSeparators();

	});
}

function mouseLeave()
{
	setTabPositions();
	setTabWidth();
}

function start(openLastActiveTab: boolean = false, _restore: boolean = true): void
{
	if(_restore)
		restore.restore(openLastActiveTab);

	if(tabs.length === 0)
		addCurrentTab(false);
	else
		update();

	let ST: NodeJS.Timeout;

	app.event(window, 'resize', function() {

		clearTimeout(ST);

		const tabsBar = document.querySelector('.tabs-bar') as HTMLElement;
		if(!tabsBar) return;

		tabsBar.classList.add('disable-transitions');
		setTabWidth();

		ST = setTimeout(function() {

			tabsBar.classList.remove('disable-transitions');

		}, 100);

	});

	app.event('.tabs-bar > div', 'mousewheel', dom.header.wheel);
	drag.start();

}

export default {
	add,
	get,
	getByPosition,
	openPath,
	openTab,
	goTab,
	update,
	updateData,
	switch: _switch,
	middleClickOpen,
	middleClickClose,
	close,
	mouseLeave,
	get tabWidth() {return currentTabWidth},
	get activeTab(): Tab | undefined {return getActive()},

	get tabs() {return tabs},
	get idCounter() {return idCounter},
	get lastUsedTabs() {return lastUsedTabs},
	set tabs(val: Tab[]) {tabs = val},
	set idCounter(val: number) {idCounter = val},
	set lastUsedTabs(val: number[]) {lastUsedTabs = val},

	setTabPositions,
	setTabWidth,
	setEvents,
	visibility,
	start,
	restore,
	drag,
};
