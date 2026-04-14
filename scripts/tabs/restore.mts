import tabs, {Tab, TabType} from '../tabs.mjs';
import drag from './drag.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const dom: any;
declare const config: any;
declare const storage: any;
declare const template: any;
declare const handlebarsContext: any;
declare const emptyNewWindow: boolean;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface TabSaved {
	id: number;
	title: string;
	type: TabType;
	icon: string;
	active: boolean;
	position: number;
	parents: number[];
	data: string;
}

function save(throttle: boolean = true, updateActive: boolean = false): void {

	if(!config.restoreTabsFromLastSession)
		return;

	if(updateActive)
		tabs.update(true);

	const _tabs: Tab[] = tabs.tabs;
	const idCounter = tabs.idCounter;
	const lastUsedTabs = tabs.lastUsedTabs;

	const list: TabSaved[] = _tabs.map(function(tab): TabSaved {

		return {
			id: tab.id,
			title: tab.title,
			type: tab.type,
			icon: tab.icon,
			active: tab.active,
			position: tab.position,
			parents: tab.parents,
			data: JSON.stringify(tab.data),
		};

	});

	const set = throttle ? storage.setThrottle : storage.set;

	set('tabs', {
		idCounter,
		lastUsedTabs,
		list: list.length > 1 || config.showAlwaysTabsBar ? list : [],
	});
}

function restore(openLastActiveTab: boolean = false): void {

	if(!config.restoreTabsFromLastSession || emptyNewWindow)
		return;

	const data = storage.get('tabs');
	if(!data?.list?.length || (data.list.length === 1 && !config.showAlwaysTabsBar))
		return;

	let idCounter = data.idCounter;

	const _tabs: Partial<Tab>[] = data.list.map(function(tab: TabSaved): Partial<Tab> {

		return {
			...tab,
			data: JSON.parse(tab.data),
			restored: true,
		};

	});

	const first = _tabs[0];

	if(first.data && !rootPage(first.data.history.current) && !openLastActiveTab)
	{
		const id = idCounter++;

		_tabs.unshift({
			id: id,
			title: 'Untitled',
			type: 'normal',
			icon: 'book',
			active: true,
			position: data.list.length,
			parents: [],
			data: {
				scrollTop: 0,
				history: dom.history.serialize(),
			},
			restored: true,
		});
	}
	else if(!openLastActiveTab)
	{
		first.active = true;
	}

	tabs.idCounter = idCounter;
	tabs.lastUsedTabs = data.lastUsedTabs;

	handlebarsContext.tabs = _tabs;

	const tabsBarElement = document.querySelector('.tabs-bar > div > div');
	if(tabsBarElement) tabsBarElement.innerHTML = template.load('tabs.bar.html');

	const tabsElements = document.querySelectorAll('.tabs-bar .tab') as NodeListOf<HTMLElement>;
	const separatorElements = document.querySelectorAll('.tabs-bar .tab-separator') as NodeListOf<HTMLElement>;

	tabs.tabs = _tabs.map(function(tab: Partial<Tab>, index: number): Tab {

		return {
			...tab,
			element: tabsElements[index] as HTMLElement,
			separator: separatorElements[index] as HTMLElement,
		} as Tab;

	});

	tabs.visibility(false);

	if(openLastActiveTab)
		tabs.goTab(tabs.activeTab!);

	for(const tab of tabs.tabs)
	{
		drag.add(tab.id);
		tabs.setEvents(tab);
	}

	tabs.setTabWidth();
	tabs.setTabPositions();

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rootPage(current: any): boolean {

	if(!current.root || current.recentlyOpened || current.page)
		return false;

	const hasLabelsAndFilters = function(object: unknown): boolean {

		for(const key in object!)
		{
			const value = object![key];

			if(typeof value === 'object')
			{
				if(hasLabelsAndFilters(value))
					return true;
			}
			else if(value)
			{
				return true;
			}
		}

		return false;

	};

	const hlaf = hasLabelsAndFilters(current.indexLabel);

	if(hlaf)
		return false;

	return true;

}

export default {
	save,
	restore,
};
