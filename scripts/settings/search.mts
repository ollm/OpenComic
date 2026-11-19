/* eslint-disable @typescript-eslint/no-explicit-any */
declare const dom: any;
declare const pregQuote: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Item	{
	text: string;
	normalizedText: string;
	node: ChildNode;
}

let items: Item[] = [];
let matchedElements: HTMLElement[] = [];

let currentHighlight = 0;

/*
function index()
{
	const tab = document.querySelector('.settings-body .tabs-content > div.active');
	if(!tab) return;

	items = [];

	const textElements = tab.querySelectorAll('.headline-small, .menu-simple-text > span, .simple-slider-text, table tbody td:first-child');

	const getFirstTextChild = function(element: Element): ChildNode | null {

		for(const child of element.childNodes)
		{
			if(child.nodeType === Node.TEXT_NODE)
			{
				const text = (child.textContent || '').replace(/\n[\s\S]* /g, '').trim();
				if(text) return child;
			}
			else
			{
				const _child = getFirstTextChild(child as Element);
				if(_child) return _child;
			}
		}

		return null;
	};

	for(const element of textElements)
	{
		const child = getFirstTextChild(element);
		const text = (child?.textContent || '').replace(/\n[\s\S]* /g, '').trim();

		if(!text || !child) continue;

		items.push({
			text,
			normalizedText: dom.search.removeDiacritics(text),
			element,
			child,
		});
	}
}
*/

function index(element: Element | null = null)
{
	if(!element)
		element = document.querySelector('.settings-body .tabs-content > div.active');

	if(!element) return;

	const walker = document.createTreeWalker(
		element,
		NodeFilter.SHOW_TEXT,
	);

	for(let node = walker.nextNode(); node; node = walker.nextNode())
	{
		const text = (node.textContent || '');
		if(!text.trim()) continue;

		items.push({
			text,
			normalizedText: dom.search.removeDiacritics(text),
			node: node as ChildNode,
		});
	}

	console.log(items);
}

function search(text: string = '')
{
	console.log(text);

	const searchText = dom.search.removeDiacritics(text).split(' ').filter(word => word.trim());
	const regexps: RegExp[] = [];

	for(const word of searchText)
	{
		const regexp = new RegExp(pregQuote(word.trim()), 'i');
		regexps.push(regexp);
	}

	matchedElements = [];
	let markIndex = 0;

	currentHighlight = 0;

	for(const item of items)
	{
		const prevMarks = item.node instanceof Element ? item.node.querySelectorAll('mark') : [];

		if(dom.search.searchText(regexps, item.normalizedText))
		{
			const element = document.createElement('span');
			element.innerHTML = item.text.replace(new RegExp(searchText.join('|'), 'gi'), match => `<mark>${match}</mark>`).replace(/<\/mark>(\s*)<mark>*/g, '$1');

			item.node.replaceWith(element);
			item.node = element;

			const marks = element.querySelectorAll('mark');

			for(const mark of marks)
			{
				matchedElements.push(mark as HTMLElement);
			}

			// Keep focus on the previously highlighted mark
			let prevMarkIndex = markIndex;

			for(const mark of prevMarks)
			{
				if(mark.classList.contains('focus'))
					currentHighlight = prevMarkIndex;

				prevMarkIndex++;
			}

			markIndex += marks.length;
		}
		else
		{
			const textNode = document.createTextNode(item.text);

			item.node.replaceWith(textNode);
			item.node = textNode;
		}
	}

	// Go and highlight the current match and scroll to it
	highlight(currentHighlight);
}

function filter(text: string = '')
{
	search(text);
}

function next()
{
	currentHighlight++;
	if(currentHighlight >= matchedElements.length) currentHighlight = 0;

	highlight(currentHighlight);
}

function highlight(index: number = 0)
{
	const element = matchedElements[index];
	if(!element) return;

	for(const el of matchedElements)
	{
		if(el === element)
			el.classList.add('focus');
		else
			el.classList.remove('focus');
	}

	const offset = 16;
	const rect = element.getBoundingClientRect();

	if(rect.top < offset || rect.bottom > window.innerHeight - offset || rect.left < offset || rect.right > window.innerWidth - offset)
		element.scrollIntoView({behavior: 'instant', block: 'center'});
}

function clean(cleanItems = true)
{
	for(const item of items)
	{
		const textNode = document.createTextNode(item.text);
		item.node.replaceWith(textNode);
		item.node = textNode;
	}

	if(cleanItems) items = [];
}

export default {
	index,
	search,
	filter,
	next,
	clean,
};
