import crypto from 'crypto';

import {Tab} from '../tabs.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const electron: any;
declare const tabs: any;
declare const storage: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const key: string = crypto.randomUUID();

const current = {
	key: key,
	time: Date.now(),
};

const windows = {
	num: 1,
	firstWindow: true,
};

function _windows()
{
	electron.ipcRenderer.invoke('windows');
}

function sendData(data: object)
{
	data = {
		...data,
		key: current.key,
		time: Date.now(),
	};

	electron.ipcRenderer.invoke('sync-windows', data);
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function processData(data: any)
{
	if(data.key === current.key)
		return;

	switch(data.type)
	{
		case 'windows':

			windows.num = data.num;
			windows.firstWindow = data.firstWindow;

			break;

		case 'storageUpdated':

			storage.updatedFromOtherInstance(data.storageKey);

			break;

		case 'dragTab':

			tabs.drag.tabFromOtherWindow(data.tab);

			break;

		case 'attachedTab':

			tabs.drag.attachedTab(data.tab, data.attached);

			break;

		case 'startDragTab':

			tabs.drag.startDragTab(data.cursor);

			break;

		case 'moveDragTab':

			tabs.drag.moveDragTab(data.cursor);

			break;

		case 'endDragTab':

			tabs.drag.endDragTab();

			break;

		case 'forceStopFollowScreenPoint':

			tabs.drag.forceStopFollowScreenPoint();

			break;
	}
}

function storageUpdated(storageKey: string)
{
	sendData({
		type: 'storageUpdated',
		storageKey,
	});
}

function dragTab(tab: Tab)
{
	sendData({
		type: 'dragTab',
		tab,
	});
}

function attachedTab(tab: Tab, attached: boolean)
{
	sendData({
		type: 'attachedTab',
		tab,
		attached,
	});
}

function startDragTab(cursor)
{
	sendData({
		type: 'startDragTab',
		cursor: cursor,
	});
}

function moveDragTab(cursor)
{
	sendData({
		type: 'moveDragTab',
		cursor: cursor,
	});
}

function endDragTab()
{
	sendData({
		type: 'endDragTab',
	});
}

function forceStopFollowScreenPoint()
{
	sendData({
		type: 'forceStopFollowScreenPoint',
	});
}

electron.ipcRenderer.on('sync-windows', function(event: unknown, data: object) {

	processData(data);

});

_windows();

export default {
	get num() {return windows.num},
	get firstWindow() {return windows.firstWindow},
	storageUpdated,
	dragTab,
	attachedTab,
	startDragTab,
	moveDragTab,
	endDragTab,
	forceStopFollowScreenPoint,
};
