import tabs, {Tab} from '../tabs.mjs'
import SimpleEvent from '../simple-event.mjs';

declare const app: any;

function moveTabs(mainTab: Tab, goTo: number) {

	const _tabs = tabs.tabs;
	const width = tabs.tabWidth + 6;

	const activeTab = tabs.activeTab;

	// Hide prev and next separators
	const hideSeparators: number[] = [
		mainTab.position - goTo,
		mainTab.position - 1 - goTo,
		...(activeTab ? [activeTab.position, activeTab.position - 1] : []),
		_tabs[_tabs.length - 1].position,
	];

	for(const tab of _tabs)
	{
		if(tab.id === mainTab.id) continue;

		let ofsetX = 0;
		const diff = mainTab.position - tab.position;

		if(goTo < 0 && diff < 0 && diff >= goTo)
			ofsetX = -width;
		else if(goTo > 0 && diff > 0 && diff <= goTo)
			ofsetX = width;

		tab.element.style.transition = 'transform 0.2s';
		tab.element.style.transform = 'translate('+ofsetX+'px, 0px)';

		tab.separator.style.transition = 'transform 0.2s, opacity 0.2s';
		tab.separator.style.transform = 'translate('+ofsetX+'px, 0px)';
		tab.separator.style.opacity = hideSeparators.includes(tab.position) ? '0' : '1';
	}

}

function resetTabs() {

	const _tabs = tabs.tabs;

	for(const tab of _tabs)
	{
		tab.element.style.transition = '';
		tab.element.style.transform = '';

		tab.separator.style.transition = '';
		tab.separator.style.transform = '';
		tab.separator.style.opacity = '';
	}

}

function add(id: number) {

	const tab = tabs.get(id);
	if(!tab) return;

	const tabsBar = document.querySelector('.tabs-bar') as HTMLElement;

	let prevDragging = false;

	const width = function() {

		return tabs.tabWidth + 6;

	}

	const simpleEvent = new SimpleEvent(tab.element);
	simpleEvent.horizontal({min: -999999999, max: 999999999, size: width, speed: false, multiple: true}, async function(event, data) {

		const goToX = data.goToX ?? 0;

		if(data.type === 'start')
		{
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
		}
		else if(data.type === 'move')
		{
			if(prevDragging) return;

			tab.element.style.transform = 'translate('+data.diffX+'px, 0px)';

			moveTabs(tab, goToX);
		}
		else if(data.type === 'end')
		{
			if(prevDragging) return;

			const len = tabs.tabs.length;

			let _goToX = goToX;

			if(tab.position - goToX >= len)
				_goToX = tab.position - (len - 1);
			else if(tab.position - goToX < 0)
				_goToX = tab.position;

			tab.element.style.transition = 'transform 0.2s';
			tab.element.style.transform = 'translate('+(-_goToX * width())+'px, 0px)';
			tab.element.style.zIndex = '';

			await app.sleep(200);
			tab.element.classList.remove('dragging');
			tabsBar.classList.remove('dragging-tabs');

			const siblingTab = tabs.getByPosition(tab.position - _goToX);

			if(siblingTab)
			{
				if(_goToX > 0)
					siblingTab.element.before(tab.element, tab.separator);
				else
					siblingTab.separator.after(tab.element, tab.separator);
			}

			resetTabs();
			tabs.setTabPositions();

		}

	});

}

export default {
	add,
};