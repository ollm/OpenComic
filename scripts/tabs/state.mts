import {History, HistoryItem} from '@types'

declare const reading: any;
declare const settings: any;

function get(history: History): any
{
	const current = history.current;

	let data = {};

	if(current.isComic)
	{
		data = reading.getTabState();
	}
	else
	{
		switch (current.page)
		{
			case 'settings':

				data = settings.getTabState();

				break;
		}
	}

	return data;
}

function set(history: History, data: any): void
{
	const current = history.current;

	if(current.isComic)
	{
		reading.setTabState(data);
	}
	else
	{
		switch (current.page)
		{
			case 'settings':

				settings.setTabState(data);

				break;
		}
	}
}

export default {
	get,
	set,
}