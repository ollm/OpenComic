import tabs, {Tab} from '../tabs.mjs';
import SimpleEvent, {CallbackData} from '../simple-event.mjs';
import syncWindows from '../storage/sync-windows.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const dom: any;
declare const template: any;
declare const reading: any;
declare const onReading: boolean;
declare const electronRemote: any;
declare const handlebarsContext: any;
declare const openPathInNewWindow: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

function moveTabs(mainTab: Tab, goTo: number, animation: boolean = true) {

	const _tabs = tabs.tabs;

	const activeTab = tabs.activeTab;

	const lastTab = _tabs[_tabs.length - 1];
	const prevLastTab = _tabs[_tabs.length - 2];

	// Hide prev and next separators
	const hideSeparators: number[] = [
		mainTab.position - goTo,
		mainTab.position - 1 - goTo,
		...(activeTab ? [activeTab.position, activeTab.position - 1] : []),
		lastTab.position,
		...(goTo > 0 && mainTab.position === lastTab.position ? [prevLastTab.position] : []),
	];

	for(const tab of _tabs)
	{
		if(tab.id === mainTab.id) continue;

		let offset = 0;
		const diff = mainTab.position - tab.position;

		if(goTo < 0 && diff < 0 && diff >= goTo)
			offset = -1;
		else if(goTo > 0 && diff > 0 && diff <= goTo)
			offset = 1;

		tab.element.style.transition = animation ? 'transform 0.2s' : '';
		tab.element.style.transform = `translateX(calc(((var(--tabs-bar-tab-width) + 6px) * ${tab.position + offset})))`;

		tab.separator.style.opacity = hideSeparators.includes(tab.position) ? '0' : '1';
	}

}

function invisibleGhost() {

	let invisibleGhost = document.querySelector('.invisible-ghost') as HTMLElement;

	if(!invisibleGhost)
	{
		invisibleGhost = document.createElement('div');
		invisibleGhost.classList.add('invisible-ghost');
		invisibleGhost.style.width = '1px';
		invisibleGhost.style.height = '1px';
		invisibleGhost.style.opacity = '0';
		invisibleGhost.style.position = 'absolute';
		invisibleGhost.style.zIndex = '-9999';
		document.body.appendChild(invisibleGhost);
	}

	return invisibleGhost;

}

function callbackStart(event: PointerEvent) {

	if(event.type === 'dragstart')
	{
		const dragEvent = event as unknown as DragEvent;
		if(!dragEvent.dataTransfer)
			return;

		const tabId = +((dragEvent.target as HTMLElement).dataset.id ?? tabs?.activeTab?.id ?? 0);
		const tab = tabs.get(tabId);

		dragEvent.dataTransfer.setDragImage(invisibleGhost(), 0, 0);
		dragEvent.dataTransfer.setData('application/x-opencomic-tab', JSON.stringify(tab?.data?.history));
	}

}

let currentSimpleEvent: SimpleEvent | undefined;

function add(id: number, _detachedTab: boolean = false, fromTitleBar: boolean = false): SimpleEvent | undefined {

	const tab = tabs.get(id);
	const tabsBar = document.querySelector('.tabs-bar') as HTMLElement;
	const titleBar = fromTitleBar ? document.querySelector('.title-bar .title-bar-menu') as HTMLElement : null;

	let prevDragging = false;
	let detachedTab = _detachedTab;

	const getTab = function(): Tab | undefined {

		if(titleBar)
		{
			if(tabs.tabs.length > 1)
				return;

			return tabs.getByPosition(0);
		}

		return tab;

	};

	const width = function() {

		return tabs.tabWidth + 6;

	};

	const listener = {
		start: 'dragstart touchstart',
		move: 'drag touchmove',
		end: 'dragend touchend',
	};

	let simpleEvent: SimpleEvent | undefined = undefined;

	const start = async function(event: PointerEvent) {

		const tab = getTab();
		if(!tab) return;

		if(tabsBar.classList.contains('dragging-tabs'))
		{
			prevDragging = true;
			return;
		}

		event.stopPropagation();

		prevDragging = false;

		tab.element.style.zIndex = '20';
		tab.element.style.transition = '';
		tab.element.classList.add('dragging');
		tabsBar.classList.add('dragging-tabs');

		if(!firstDragFromOtherWindow)
		{
			const rect = tab.element.getBoundingClientRect();

			tab.dragOffset = {
				x: app.clientX(event) - rect.left,
				y: app.clientY(event) - rect.top,
			};
		}

	};

	const move = async function(event: PointerEvent, data: CallbackData, goToX: number) {

		const tab = getTab();
		if(!tab) return;

		if(prevDragging/* || detachedTab */) return;

		const clientY = app.clientY(event);
		const clientX = app.clientX(event);
		let addedTab = false;

		if(clientY > 90 || clientY < 15 || clientX < 15 || clientX > window.innerWidth - 15)
		{
			if(detachedTab) return;

			if(tabs.activeTab?.id === tab.id)
			{
				if(onReading) reading.progress.save();
				tabs.updateData(tab.id, {}, true);
			}

			await end(event, data, goToX, true);
			detachedTab = true;

			if(!tabFromOtherWindowEvent)
				sendTabToOtherWindows(tab);

			sendAttachedTab(tab, false);

			if(tabs.tabs.length === 1)
			{
				electronRemote.getCurrentWindow().hide();
				tabs.tabs.pop();
				return;
			}

			await app.sleep(1);
			tabs.close(tab.id, true, false);

			tabs.visibility();

			return;
		}
		else if(detachedTab)
		{
			addTabDrag(tab);
			detachedTab = false;
			addedTab = true;
			sendAttachedTab(tab, true);

			tabs.visibility();

			if(simpleEvent)
			{
				const recalculated = simpleEvent.calculate(event);
				data = recalculated;
				goToX = data.goToX ?? 0;
			}
		}

		tab.element.style.transform = `translateX(calc(((var(--tabs-bar-tab-width) + 6px) * ${tab.position}) + ${data.diffX}px))`;

		if(!detachedTab)
			moveTabs(tab, goToX, !addedTab);

	};

	const end = async function(event: PointerEvent, data: CallbackData, goToX: number, detached: boolean = false) {

		const tab = getTab();
		if(!tab) return;

		if(!detached)
		{
			sendedTabToOtherWindows = false;
			currentSimpleEvent = undefined;
			tabsBar.classList.remove('dragging-tabs');
			dom.queryAll('.tab.dragging').removeClass('dragging');
		}

		if(!detached)
			syncWindows.endDragTab();

		if(detachedTab)
		{
			if(tabFromOtherWindowEvent)
				return;

			if(tabIsAttached)
			{
				if(tabs.tabs.length === 0)
					electronRemote.getCurrentWindow().close();

				return;
			}

			if(tabs.tabs.length === 1)
			{
				electronRemote.getCurrentWindow().show();
				detachedTab = false;
				return;
			}

			const history = tab.data.history;

			openPathInNewWindow(history.current.path, history.current.mainPath, history);

			return;
		}

		if(prevDragging) return;

		const len = tabs.tabs.length;

		let _goToX = goToX;

		if(tab.position - goToX >= len)
			_goToX = tab.position - (len - 1);
		else if(tab.position - goToX < 0)
			_goToX = tab.position;

		if(detached && len > 1)
		{
			tab.element.style.transition = 'opacity 0s';
			tab.element.style.opacity = '0';
			tab.element.style.zIndex = '';
		}
		else
		{
			tab.element.style.zIndex = '';
		}

		const diff = tab.position - _goToX;

		for(const _tab of tabs.tabs)
		{
			if(_goToX > 0)
			{
				if(_tab.position >= diff && _tab.position < tab.position)
					_tab.position++;
			}
			else
			{
				if(_tab.position <= diff && _tab.position > tab.position)
					_tab.position--;
			}
		}

		tab.position = Math.min(Math.max(diff, 0), len - 1);
		tabs.setTabPositions({animation: true, tab});

	};

	const element = fromTitleBar ? titleBar : tab?.element;
	if(!element) return;

	simpleEvent = new SimpleEvent(element);
	simpleEvent.all({min: -999999999, max: 999999999, size: width, speed: false, multiple: true, listener, callbackStart, offset: 4}, async function(event, data) {

		currentSimpleEvent = simpleEvent;
		const goToX = data.goToX ?? 0;

		if(data.type === 'start')
		{
			await start(event);
		}
		else if(data.type === 'move')
		{
			await move(event, data, goToX);
		}
		else if(data.type === 'end')
		{
			await end(event, data, goToX);
		}

	});

	return simpleEvent;

}

function addTabDrag(tab: Tab, ghostTab: boolean = false): SimpleEvent | undefined {

	const id = tabs.idCounter++;

	const currentLen = tabs.tabs.length;

	tab.id = id;
	tab.restored = true;
	tab.active = false;
	tab.position = currentLen;

	handlebarsContext.tab = tab;

	const div = ghostTab ? document.createElement('div') : document.querySelector('.tabs-bar > div > div');

	div?.insertAdjacentHTML('beforeend', template.load('tabs.bar.tab.html'));

	const tabElement = div?.querySelector(`.tab--${id}`) as HTMLElement;
	const tabSeparator = div?.querySelector(`.tab-separator--${id}`) as HTMLElement;

	tab.element = tabElement;
	tab.separator = tabSeparator;

	tab.element.style.zIndex = '20';
	tab.element.style.transition = '';
	tab.element.classList.add('dragging');

	tabs.tabs.push(tab);

	const simpleEvent = add(tab.id, ghostTab);
	tabs.setEvents(tab);

	if(!ghostTab)
		tabs.setTabPositions({animation: false, tab});
	else
		tabs.tabs.pop();

	const event = currentSimpleEvent ?? simpleEvent;

	if(event)
	{
		const startX = (tabs.tabWidth + 6) * currentLen + (tab.dragOffset?.x ?? 0);
		event.startX = startX;
		event.initStartX = startX;
	}

	return simpleEvent;

}

let tabFromOtherWindowEvent: SimpleEvent | undefined;
let firstDragFromOtherWindow = false;

function dragover(event: DragEvent) {

	if(!event.dataTransfer?.types.includes('application/x-opencomic-tab'))
		return;

	event.preventDefault();

	if(!tabFromOtherWindowEvent) return;

	if(firstDragFromOtherWindow) tabFromOtherWindowEvent.down(event as unknown as PointerEvent);
	tabFromOtherWindowEvent.move(event as unknown as PointerEvent);

	firstDragFromOtherWindow = false;

}

function dragleave(event: DragEvent) {

	if(!event.dataTransfer?.types.includes('application/x-opencomic-tab'))
		return;

	const x = app.clientX(event);
	const y = app.clientY(event);

	if(x !== 0 && y !== 0)
		return;

	event.preventDefault();

	if(!tabFromOtherWindowEvent) return;
	tabFromOtherWindowEvent.move(event as unknown as PointerEvent);

}

function drop(event: DragEvent) {

	event.preventDefault();

	const data = event.dataTransfer?.getData('application/x-opencomic-tab');
	if(!data) return;

	if(!tabFromOtherWindowEvent) return;
	tabFromOtherWindowEvent.up(event as unknown as PointerEvent);

	tabFromOtherWindowEvent = undefined;

}

let sendedTabToOtherWindows = false;

function sendTabToOtherWindows(tab: Tab) {

	if(sendedTabToOtherWindows) return;

	syncWindows.dragTab(tab);
	sendedTabToOtherWindows = true;

}

function tabFromOtherWindow(tab: Tab) {

	tabFromOtherWindowEvent = addTabDrag(tab, true);
	firstDragFromOtherWindow = true;

}

function sendAttachedTab(tab: Tab, attached: boolean = false) {

	syncWindows.attachedTab(tab, attached);

}

let tabIsAttached = false;

function attachedTab(tab: Tab, attached: boolean = false) {

	tabIsAttached = attached;

}

function endDragTab() {

	if(!tabFromOtherWindowEvent || !tabFromOtherWindowEvent.lastEvent) return;
	tabFromOtherWindowEvent.up(tabFromOtherWindowEvent.lastEvent);

	tabFromOtherWindowEvent = undefined;

}

function start() {

	app.event(document, 'dragend', function(event) {

		if(currentSimpleEvent)
			currentSimpleEvent.up(event as unknown as PointerEvent);

	});

	app.event(window, 'dragleave', dragleave);

}

export default {
	add,
	dragover,
	dragleave,
	drop,
	tabFromOtherWindow,
	attachedTab,
	endDragTab,
	start,
};
