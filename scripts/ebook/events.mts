/* eslint-disable @typescript-eslint/no-explicit-any */
declare const p: any;
declare const electronRemote: any;
declare const reading: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const xCoords: Set<string> = new Set([
	'clientX',
	'screenX',
	'pageX',
]);

const yCoords: Set<string> = new Set([
	'clientY',
	'screenY',
	'pageY',
]);

// const coords = [...xCoords, ...yCoords];

function replicateMouseEvent(iframe: HTMLIFrameElement, event: MouseEvent): void {

	const rect = iframe.getBoundingClientRect();

	const _event: object = {};

	for(const key in event)
	{
		let value = event[key];

		if(xCoords.has(key))
			value = value + rect.left;
		else if(yCoords.has(key))
			value = value + rect.top;

		_event[key] = value;
	}

	if(event.target)
	{
		const link = (event.target as Element).closest('a');

		if(link)
		{
			event.preventDefault();

			if(event.type === 'click')
				openLink(link.href);

			return;
		}
	}

	const mouseEvent = new MouseEvent(event.type, _event);
	iframe.dispatchEvent(mouseEvent);
}

function openLink(link: string)
{
	const isLocal = link.startsWith('file://') || link.startsWith('data:') || link.startsWith('/') || link.startsWith('./') || link.startsWith('../') || link.startsWith(p.sep);

	if(isLocal)
	{
		const id = link.split('#')[1]?.split('?')[0];

		const parts = link.split('/');
		const href = parts.pop()!.split('#')[0] + '#' + id;

		reading.goToEbookId(id, href);
	}
	else
	{
		electronRemote.shell.openExternal(link);
	}
}

const list = [
	'click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout',
	'touchstart', 'touchmove', 'touchend', 'touchcancel',
	'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
];

function listen(iframe: HTMLIFrameElement): void
{
	let ST: NodeJS.Timeout | null = null;
	let ST2: NodeJS.Timeout | null = null;

	iframe.addEventListener('load', function() {

		const doc = iframe.contentDocument;
		if(!doc) return;

		const win = iframe.contentWindow;
		if(!win) return;

		for(const eventName of list)
		{
			doc.addEventListener(eventName, function(event: Event) {

				replicateMouseEvent(iframe, event as MouseEvent);

			});
		}

		win.addEventListener('focus', function() {

			clearTimeout(ST!);

		});

		win.addEventListener('blur', function() {

			ST = setTimeout(function() {

				const selection = win.getSelection();
				selection?.removeAllRanges();

			}, 100);

		});

		doc.addEventListener('selectionchange', function() {

			clearTimeout(ST2!);
			const hasSelection = iframe.contentWindow?.getSelection()?.toString().length;
			if(hasSelection) iframe.focus();

			ST2 = setTimeout(async function() {

				if(reading.readingDragScroll && reading.readingDragScroll.start)
				{
					const html = doc.querySelector('html');
					if(html) html.style.userSelect = 'none';

					const selection = win.getSelection();
					selection?.removeAllRanges();

					await reading.readingDragScroll.endPromise;

					if(html) html.style.userSelect = '';

					return;
				}

				reading.ebookHasSelection = !!hasSelection;

			}, 30);

		});

	});
}

export default {
	listen,
};
