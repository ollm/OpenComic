import tabs, {Tab} from '../tabs.mjs';
import SimpleEvent, {CallbackData} from '../simple-event.mjs';
import syncWindows from '../storage/sync-windows.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const dom: any;
declare const config: any;
declare const template: any;
declare const reading: any;
declare const titleBar: any;
declare const onReading: boolean;
declare const electronRemote: any;
declare const handlebarsContext: any;
declare const openPathInNewWindow: any;
declare const useScreenPointTabs: boolean;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface WindowPos {
	wx: number;
	wy: number;
};

interface TabFromOtherWindow {
	first: boolean;
	event?: SimpleEvent;
}

type DragType = 'drag' | 'pointer' | 'screen-follow' | 'external-screen-follow';

interface DragState {
	type: DragType;
	hasControl: boolean;
	active: boolean;
	simpleEvent?: SimpleEvent;
	tabFromOtherWindow: TabFromOtherWindow;
	attachedInOtherWindow: boolean;
	detachedWindowId: number | null;
};

interface ScreenFollow {
	active: boolean;
	first: boolean;
	pointerDown: boolean;
	windowPos: WindowPos;
	current: {
		x: number;
		y: number;
	};
};

const dragState: DragState = {
	type: 'drag',
	hasControl: true,
	active: false,
	simpleEvent: undefined,
	tabFromOtherWindow: {
		first: true,
	},
	attachedInOtherWindow: false,
	detachedWindowId: null,
};

const screenFollow: ScreenFollow = {
	active: false,
	first: true,
	pointerDown: false,
	windowPos: {
		wx: 0,
		wy: 0,
	},
	current: {
		x: 0,
		y: 0,
	},
};

const MACOS = process.platform === 'darwin';
const USE_SCREEN_POINT_TABS = useScreenPointTabs;

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
		...(goTo > 0 && mainTab.position === lastTab.position ? [prevLastTab?.position] : []),
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

function add(id: number, _detachedTab: boolean = false): SimpleEvent | undefined {

	const tab = tabs.get(id);
	const tabsBar = document.querySelector('.tabs-bar') as HTMLElement;

	let prevDragging = false;
	let detachedTab = _detachedTab;
	let singleTab = false;

	const getTab = function(): Tab | undefined {

		return tab;

	};

	const width = function() {

		return tabs.tabWidth + 6;

	};

	const listener = USE_SCREEN_POINT_TABS ? undefined : {
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

		dragState.type = ['screen-follow', 'external-screen-follow'].includes(event.type) ? event.type as DragType : (event.type.startsWith('drag') ? 'drag' : 'pointer');
		dragState.hasControl = event.type !== 'external-screen-follow' ? true : false;
		dragState.active = true;

		if(!dragState.tabFromOtherWindow.first)
		{
			const rect = tab.element.getBoundingClientRect();

			tab.dragOffset = {
				x: app.clientX(event) - rect.left,
				y: app.clientY(event) - rect.top,
			};
		}

		singleTab = !dragState.tabFromOtherWindow.event && tabs.tabs.length === 1 ? true : false;

	};

	const move = async function(event: PointerEvent, data: CallbackData, goToX: number) {

		const tab = getTab();
		if(!tab) return;

		if(prevDragging/* || detachedTab */) return;

		const clientX = app.clientX(event);
		const clientY = app.clientY(event);
		let addedTab = false;

		if(clientX === 0 && clientY === 0 && !USE_SCREEN_POINT_TABS) // This can occur in drag events when the cursor is still on the tab bar
			return;

		const bounds = MACOS ? {
			left: 15 + 80,
			right: window.innerWidth - 15,
			top: 5,
			bottom: 60,
		} : {
			left: 15 + titleBar.controls.left,
			right: window.innerWidth - 15 + titleBar.controls.right,
			top: 5,
			bottom: 60,
		};

		if(clientX < bounds.left || clientX > bounds.right || clientY > bounds.bottom || clientY < bounds.top || (singleTab && USE_SCREEN_POINT_TABS))
		{
			if(detachedTab) return;

			if(tabs.activeTab?.id === tab.id)
			{
				if(onReading) reading.progress.save();
				tabs.updateData(tab.id, {}, true);
			}

			await end(event, data, goToX, true);
			detachedTab = true;

			if(!dragState.tabFromOtherWindow.event)
				sendTabToOtherWindows(tab);

			sendAttachedTab(tab, false);

			if(singleTab && tabs.tabs.length === 1 && !dragState.tabFromOtherWindow.event)
			{
				if(USE_SCREEN_POINT_TABS)
				{
					tab.dragOffset = {
						x: app.clientX(event),
						y: app.clientY(event),
					};

					dragState.detachedWindowId = electronRemote.getCurrentWindow().id as number;
					followScreenPoint(dragState.detachedWindowId, tab);
					return;
				}

				electronRemote.getCurrentWindow().setOpacity(0);
				tabs.tabs.pop();
				return;
			}

			await app.sleep(1);
			tabs.close(tab.id, true, false);

			tabs.visibility();

			if(USE_SCREEN_POINT_TABS && !dragState.tabFromOtherWindow.event)
			{
				if(dragState.detachedWindowId !== null)
				{
					followScreenPoint(dragState.detachedWindowId, tab);
					return;
				}

				const history = tab.data.history;
				dragState.detachedWindowId = await openPathInNewWindow(history.current.path, history.current.mainPath, history, {showInactive: false}) as number;

				followScreenPoint(dragState.detachedWindowId, tab);
			}

			return;
		}
		else if(detachedTab && !dragState.attachedInOtherWindow && !singleTab)
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

			if(dragState.detachedWindowId && dragState.detachedWindowId !== null)
			{
				const win = electronRemote.BrowserWindow.fromId(dragState.detachedWindowId);
				if(win) win.setOpacity(0);
			}

			electronRemote.getCurrentWindow().focus();
		}

		// Calculate tab position with clamping to bounds
		{
			const offset = tabs.offset;

			const tabWidth = tabs.tabWidth;
			const gap = 6;
			const containerWidth = window.innerWidth - offset.titleBar - offset.current.controls - offset.newTab;

			const baseX = (tabWidth + gap) * tab.position + data.diffX;

			const minX = 0;
			const maxX = containerWidth - tabWidth - gap * 2;

			const clampedX = Math.max(minX, Math.min(baseX, maxX));

			tab.element.style.transform = `translateX(${clampedX}px)`;
		}

		if(!detachedTab)
			moveTabs(tab, goToX, !addedTab);

	};

	const end = async function(event: PointerEvent, data: CallbackData, goToX: number, fromDetaching: boolean = false) {

		const tab = getTab();
		if(!tab) return;

		if(!fromDetaching)
		{
			sendedTabToOtherWindows = false;
			dragState.simpleEvent = undefined;
			tabsBar.classList.remove('dragging-tabs');
			dom.queryAll('.tab.dragging').removeClass('dragging');

			syncWindows.endDragTab();

			if(screenFollow.active)
			{
				forceStopFollowScreenPoint();
				syncWindows.forceStopFollowScreenPoint();
			}

			setTimeout(function() {

				dragState.active = false;

			}, 10);
		}

		if(detachedTab)
		{
			if(dragState.tabFromOtherWindow.event)
				return;

			if(dragState.attachedInOtherWindow)
			{
				if(tabs.tabs.length === 0 || singleTab)
					electronRemote.getCurrentWindow().close();

				if(!fromDetaching)
				{
					if(USE_SCREEN_POINT_TABS && dragState.detachedWindowId && dragState.detachedWindowId !== null)
					{
						const win = electronRemote.BrowserWindow.fromId(dragState.detachedWindowId);
						if(win) win.close();
					}

					dragState.detachedWindowId = null;
				}

				return;
			}

			if(singleTab)
			{
				if(!tabs.tabs.includes(tab))
					tabs.tabs.push(tab);

				const win = electronRemote.getCurrentWindow();
				win.setOpacity(1);
				win.show();
				detachedTab = false;
				return;
			}

			dragState.detachedWindowId = null;

			if(USE_SCREEN_POINT_TABS)
				return;

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

		if(fromDetaching && len > 1)
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

		if(!fromDetaching)
		{
			if(USE_SCREEN_POINT_TABS && dragState.detachedWindowId && dragState.detachedWindowId !== null)
			{
				const win = electronRemote.BrowserWindow.fromId(dragState.detachedWindowId);
				if(win) win.close();
			}

			dragState.detachedWindowId = null;
		}

	};

	const element = tab?.element;
	if(!element) return;

	simpleEvent = new SimpleEvent(element);
	simpleEvent.all({min: -999999999, max: 999999999, size: width, speed: false, multiple: true, listener, callbackStart, offset: 4}, async function(event, data) {

		dragState.simpleEvent = simpleEvent;
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

	const event = dragState.simpleEvent ?? simpleEvent;

	if(event)
	{
		const startX = (tabs.tabWidth + 6) * currentLen + (tab.dragOffset?.x ?? 0);
		event.startX = startX;
		event.initStartX = startX;
	}

	return simpleEvent;

}

function dragover(event: DragEvent, force: boolean = false) {

	if(!force && !event.dataTransfer?.types.includes('application/x-opencomic-tab'))
		return;

	event.preventDefault();

	if(!dragState.tabFromOtherWindow.event) return;

	if(dragState.tabFromOtherWindow.first) dragState.tabFromOtherWindow.event.down(event as unknown as PointerEvent);
	dragState.tabFromOtherWindow.event.move(event as unknown as PointerEvent);

	dragState.tabFromOtherWindow.first = false;

}

function dragleave(event: DragEvent) {

	if(!event.dataTransfer?.types.includes('application/x-opencomic-tab'))
		return;

	const x = app.clientX(event);
	const y = app.clientY(event);

	if(x !== 0 && y !== 0)
		return;

	event.preventDefault();

	if(!dragState.tabFromOtherWindow.event) return;
	dragState.tabFromOtherWindow.event.move(event as unknown as PointerEvent);

}

function pointerdown() {

	screenFollow.pointerDown = true;

}

function pointermove(event: PointerEvent) {

	if(event.buttons === 0 && screenFollow.active)
		pointerup(event);

}

function pointerup(event: PointerEvent) {

	if(screenFollow.active && dragState.simpleEvent)
		dragState.simpleEvent.up(event);

	screenFollow.pointerDown = false;

	syncWindows.forceStopFollowScreenPoint();

}

function fakeEvent(type: string, x: number, y: number, wx: number, wy: number) {

	const clientX = x - wx;
	const clientY = y - wy;

	const event = {
		type: type,
		clientX,
		clientY,
		pageX: clientX,
		pageY: clientY,
		screenX: x,
		screenY: y,
		pointerId: dragState.simpleEvent?.lastEvent?.pointerId || undefined,
		preventDefault: ()	=> {},
		stopPropagation: ()	=> {},
	};

	return event as PointerEvent;

}

function eventFromScreenPoint(x: number, y: number, wx: number, wy: number) {

	if(!dragState.simpleEvent)
		return;

	const event = fakeEvent('screen-follow', x, y, wx, wy);
	dragState.simpleEvent.move(event);

	if(screenFollow.first)
		syncWindows.startDragTab({x, y});
	else
		syncWindows.moveDragTab({x, y});

}

function followScreenPoint(winId: number, tab: Tab) {

	const offset = tab.dragOffset ?? (MACOS ? {x: 110 + 80, y: 15} : {x: 110, y: 15});
	const win = electronRemote.BrowserWindow.fromId(winId);
	if(!win) return;

	win.setOpacity(1);
	win.show();

	const currentWin = electronRemote.getCurrentWindow();
	const [wx, wy] = currentWin.getPosition();

	screenFollow.current = {
		x: 0,
		y: 0,
	};

	const loop = function() {

		window.requestAnimationFrame(function() {

			const cursor = electronRemote.screen.getCursorScreenPoint();

			const x = cursor.x - offset.x;
			const y = cursor.y - (config.showAlwaysTabsBar ? offset.y : (offset.y <= 28 ? offset.y : 15));

			if(screenFollow.current.x !== cursor.x || screenFollow.current.y !== cursor.y)
			{
				win.setBounds({x, y});
				eventFromScreenPoint(cursor.x, cursor.y, wx, wy);
			}

			screenFollow.current = cursor;

			if(screenFollow.pointerDown)
			{
				screenFollow.first = false;
				loop();
			}
			else
			{
				screenFollow.active = false;
				screenFollow.first = true;

				if(dragState.simpleEvent?.lastEvent)
					dragState.simpleEvent.up(dragState.simpleEvent.lastEvent);
			}

		});

	};

	screenFollow.active = true;
	loop();

}

function forceStopFollowScreenPoint() {

	if(screenFollow.active && dragState.simpleEvent?.lastEvent)
		dragState.simpleEvent.up(dragState.simpleEvent.lastEvent);

	screenFollow.pointerDown = false;

}

function drop(event: DragEvent) {

	event.preventDefault();

	const data = event.dataTransfer?.getData('application/x-opencomic-tab');
	if(!data) return;

	if(!dragState.tabFromOtherWindow.event) return;
	dragState.tabFromOtherWindow.event.up(event as unknown as PointerEvent);

	dragState.tabFromOtherWindow.event = undefined;

}

let sendedTabToOtherWindows = false;

function sendTabToOtherWindows(tab: Tab) {

	if(sendedTabToOtherWindows) return;

	syncWindows.dragTab(tab);
	sendedTabToOtherWindows = true;

}

function tabFromOtherWindow(tab: Tab) {

	dragState.tabFromOtherWindow.event = addTabDrag(tab, true);
	dragState.tabFromOtherWindow.first = true;

}

function sendAttachedTab(tab: Tab, attached: boolean = false) {

	syncWindows.attachedTab(tab, attached);

}

function attachedTab(tab: Tab, attached: boolean = false) {

	dragState.attachedInOtherWindow = attached;

	if(dragState.detachedWindowId && dragState.detachedWindowId !== null)
	{
		const win = electronRemote.BrowserWindow.fromId(dragState.detachedWindowId);
		if(!win) return;

		if(attached)
			win.setOpacity(0);
		else
			win.setOpacity(1);
	}
}

function startDragTab({x, y}) {

	const currentWin = electronRemote.getCurrentWindow();
	const [wx, wy] = currentWin.getPosition();

	screenFollow.windowPos = {wx, wy};
	const event = fakeEvent('external-screen-follow', x, y, wx, wy) as unknown as DragEvent;
	dragover(event, true);

}

function moveDragTab({x, y}) {

	const {wx, wy} = screenFollow.windowPos;
	const event = fakeEvent('external-screen-follow', x, y, wx, wy) as unknown as DragEvent;
	dragover(event, true);

}

function endDragTab() {

	if(!dragState.tabFromOtherWindow.event || !dragState.tabFromOtherWindow.event.lastEvent) return;
	dragState.tabFromOtherWindow.event.up(dragState.tabFromOtherWindow.event.lastEvent);

	dragState.tabFromOtherWindow.event = undefined;

}

function start() {

	app.event(document, 'dragend', function(event) {

		if(dragState.simpleEvent)
			dragState.simpleEvent.up(event as unknown as PointerEvent);

	});

	app.event(window, 'dragleave', dragleave);
	app.event(window, 'pointerdown', pointerdown);
	app.event(window, 'pointermove', pointermove);
	app.event(window, 'pointerup', pointerup);

}

export default {
	add,
	dragover,
	dragleave,
	drop,
	tabFromOtherWindow,
	attachedTab,
	startDragTab,
	moveDragTab,
	endDragTab,
	forceStopFollowScreenPoint,
	get state() {return dragState},
	start,
};
