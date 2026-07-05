import p from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const dom: any;
declare const _config: any;
declare const reading: any;
declare const storage: any;
declare const template: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type GroupType = 'single' | 'double';

// Images and Folders
export interface Item {
	index: number;
	position: number;

	name?: string;
	path?: string;
	image?: string;

	blank: boolean;
	folder: boolean;
	canvas?: boolean;
	ebook?: boolean;

	width: number;
	height: number;
	estimated: boolean;
	clip?: {
		width: number;
		height: number;
		aspectRatio: number;
	};
	rendered?: {
		width: number;
		height: number;
		top: number;
		bottom: number;
		left: number;
		right: number;
	};
	aspectRatio: number;
	calcAspectRatio?: number;
	auto?: boolean; // If the blank page is automatically added by the distribution or if it's a custom blank page added by the user

	element?: HTMLDivElement;
	elementLens?: HTMLDivElement;

	groupType?: GroupType;
	calculated: boolean;
	group: {
		element?: HTMLDivElement;
		elementLens?: HTMLDivElement;
	};

	key1?: number;
	key2?: number;
}

interface Compare {
	key1: number;
	element?: HTMLDivElement;
	elementLens?: HTMLDivElement;
	items: {
		prev: Item | null;
		new: Item | null;
	}[];
}

interface Group {
	key1: number;
	items: Item[];
}

export default class Distribution
{
	constructor(/* items: Item[] */) {

		// console.log(items);
		this.items = reading.items as Item[]; // Object.values(items);

	}

	update(/* items: Item[] */) {

		// console.log(items);
		this.items = reading.items as Item[]; // Object.values(items);

	}

	items: Item[] = [];

	distribution: Item[][] = [];

	nextHorizontalIndex: (number | null)[] = [];
	useBlankPage: boolean = false;

	total: number = 0;

	calculateImagesDataWithClip() {

		const imageClip = reading.imageClip();
		const clipVertical = (imageClip.top + imageClip.bottom) / 100;
		const clipHorizontal = (imageClip.left + imageClip.right) / 100;

		this.items = this.items.map(function(item: Item): Item {

			if(item.image)
			{
				const width = Math.round(item.width * (1 - clipHorizontal));
				const height = Math.round(item.height * (1 - clipVertical));

				item.clip = {
					width: width,
					height: height,
					aspectRatio: (width / height),
				};
			}
			else
			{
				item.clip = {
					width: item.width,
					height: item.height,
					aspectRatio: (item.width / item.height),
				};
			}

			return item;

		});
	}

	// Calculates whether to add a blank image (If the reading is in double page and do not apply to the horizontals)
	precalculateBlankPage() {

		this.useBlankPage = _config.readingAlignWithNextHorizontal && _config.readingDoNotApplyToHorizontals;
		if(!this.useBlankPage) return false;

		const len = this.items.length;
		this.nextHorizontalIndex = new Array(len).fill(null);

		let next: number | null = null;

		for(let i = len - 1; i >= 0; i--)
		{
			const item = this.items[i];

			if(item && item.aspectRatio > 1)
				next = i;

			this.nextHorizontalIndex[i] = next;
		}
	}

	blankPage(index: number) {

		if(!this.useBlankPage) return false;

		const next = this.nextHorizontalIndex[index];
		if(next === null) return false;

		const distance = next - index;
		return (distance % 2) === 1;
	}

	shouldAddInitialBlank() {

		if(!_config.readingBlankPage) return false;

		if(!_config.readingDoNotApplyToHorizontals)
			return true;

		const first = this.items[0];
		return first && first.aspectRatio <= 1;
	}

	blank: Item = {
		index: 0,
		position: 0,

		blank: true,
		folder: false,

		estimated: false,
		width: 0,
		height: 0,

		group: {},

		aspectRatio: 1,

		calculated: false,
	};

	calculateImagesDistribution() {

		const doublePage = reading.doublePage.active();

		this.distribution = [];
		let position: number = 0;

		let lastAspectRatio = doublePage ? (this.items.find(item => item.image && item.aspectRatio <= 1)?.aspectRatio || 1) : 1;

		const createBlank = (groupType: GroupType, index: number, auto: boolean = true) => ({...this.blank, index, blank: true, groupType, aspectRatio: lastAspectRatio, auto});
		const createImage = (item: Item, groupType: GroupType) => (Object.assign(item, {blank: false, groupType}));
		const createFolder = (item: Item, groupType: GroupType) => (Object.assign(item, {blank: false, groupType}));

		const SINGLE = 'single'; // Used when the image is in single page group
		const DOUBLE = 'double'; // Used when the image is in double page group

		if(doublePage)
		{
			const flushGroup = () => {

				this.distribution.push(pageGroup);
				pageGroup = [];
				position++;

			};

			const customBlankPages = storage.getKey('customBlankPages', p.dirname(dom.history.path)) ?? {};

			const customBlankPage = (index: number) => {

				if(customBlankPages[index])
				{
					const pages = customBlankPages[index];

					for(let i = 0; i < pages; i++)
					{
						pageGroup.push(createBlank(DOUBLE, index, false));
						const isDoublePageReady = pageGroup.length > 1;

						if(isDoublePageReady)
							flushGroup();
					}

					return pages;
				}

				return 0;

			};

			this.precalculateBlankPage();

			let pageGroup: Item[] = [];
			let blankPagesPrevHorizontal = 0;

			const initialBlank = this.shouldAddInitialBlank();

			if(initialBlank)
				pageGroup.push(createBlank(DOUBLE, 1));

			const firstBlankPages = customBlankPage(0);
			blankPagesPrevHorizontal += (initialBlank ? 1 : 0) + firstBlankPages;

			for(let i = 0, len = this.items.length; i < len; i++)
			{
				const item = this.items[i];
				const clip = item.clip || item;

				if(item.image)
				{
					const isHorizontal = clip.aspectRatio > 1;
					const skipDoublePage = _config.readingDoNotApplyToHorizontals && isHorizontal;

					if(skipDoublePage)
					{
						if(pageGroup.length > 0)
						{
							pageGroup.push(createBlank(DOUBLE, item.index));
							flushGroup();
						}

						pageGroup.push(createImage(item, SINGLE));
						item.position = position;
						flushGroup();

						blankPagesPrevHorizontal = 0;
					}
					else
					{
						if(_config.readingDoNotApplyToHorizontals && pageGroup.length === 0 && !blankPagesPrevHorizontal && this.blankPage(i)) // Align with next horizontal if there is no previous blank page and the current page should be blank
							pageGroup.push(createBlank(DOUBLE, item.index));

						pageGroup.push(createImage(item, DOUBLE));
						item.position = position;
					}

					if(!isHorizontal)
						lastAspectRatio = clip.aspectRatio;
				}
				else
				{
					pageGroup.push(createFolder(item, DOUBLE));
					item.position = position;
				}

				const isDoublePageReady = pageGroup.length > 1;

				if(isDoublePageReady)
					flushGroup();

				const blankPages = customBlankPage(item.index);
				blankPagesPrevHorizontal += blankPages;

			}

			if(pageGroup.length)
			{
				const lastIndex = pageGroup[pageGroup.length - 1].index;

				if(pageGroup.length === 1 && pageGroup[0].groupType == DOUBLE) // If the last page is a single page and not horizontal, add a blank page
					pageGroup.push(createBlank(DOUBLE, lastIndex));

				flushGroup();
			}
		}
		else
		{
			for(const item of this.items)
			{
				this.distribution.push([item.image ? createImage(item, SINGLE) : createFolder(item, SINGLE)]);
				item.position = position;
				position++;
			}
		}

		if(_config.invisibleFirstBlankPage)
		{
			if(this.distribution[0])
				this.distribution[0] = this.distribution[0].filter(item => !item.blank);
		}
		else if(_config.invisibleBlankPages)
		{
			this.distribution = this.distribution.map(distribution => distribution.filter(item => !item.blank));
		}

		this.total = position;
	}

	applyMangaReading(distribution: Item[][]): Item[][] {

		const _distribution = [...distribution];

		if(_config.readingManga)
		{
			if(!reading.viewIs('scroll'))
				_distribution.reverse();

			for(let i = 0, len = _distribution.length; i < len; i++)
			{
				_distribution[i].reverse();
			}
		}

		return _distribution;
	}

	calculate() {

		this.calculateImagesDataWithClip();
		this.calculateImagesDistribution();

	}

	currentDistribution: Item[][] = [];

	htmlItems() {

		this.calculateImagesDataWithClip();
		this.calculateImagesDistribution();

		const distribution: Item[][] = this.applyMangaReading(this.distribution);

		// Compare difference between the new distribution and the previous distribution to apply only the necessary changes to the DOM
		const compare: Compare[] = [];

		for(let i = 0, len = distribution.length; i < len; i++)
		{
			const newGroup = distribution[i];
			const prevGroup = this.currentDistribution[i] ?? [];

			const compareGroup: Compare = {key1: i, items: []};
			const maxLen = Math.max(newGroup.length, prevGroup.length);

			for(let j = 0; j < maxLen; j++)
			{
				if(newGroup[j]) newGroup[j].key1 = i;
				if(newGroup[j]) newGroup[j].key2 = j;

				compareGroup.items.push({
					prev: prevGroup[j] || null,
					new: newGroup[j] || null,
				});

				if(prevGroup?.[j]?.group)
				{
					compareGroup.element = prevGroup[j].group!.element;
					compareGroup.elementLens = prevGroup[j].group!.elementLens;
				}
			}

			compare.push(compareGroup);
		}

		const toRemove = this.currentDistribution.filter((group, i) => !distribution[i]);

		for(const group of toRemove)
		{
			for(const item of group)
			{
				if(item.group?.element) item.group.element.remove();
				if(item.group?.elementLens) item.group.elementLens.remove();
			}
		}

		this.currentDistribution = distribution;

		const same = function(item1: Item | null, item2: Item | null): boolean {

			if(item1 === null || item2 === null)
				return false;

			if(item1.path !== item2.path)
				return false;

			return true;

		};

		// Get the items to add and remove from the DOM based on the comparison
		const toAdd: Compare[] = [];
		let add = false;

		for(const group of compare)
		{
			for(const item of group.items)
			{
				if(!same(item.prev, item.new))
					add = true;
			}

			if(!add)
				continue;

			if(group.element) group.element.remove();
			if(group.elementLens) group.elementLens.remove();

			toAdd.push(group);
		}

		console.log('toAdd', toAdd.length);

		// Add base html
		const contentRight = template._contentRight() as HTMLDivElement;

		if(!contentRight.querySelector('.reading-transitions'))
		{
			const html = template.load('reading.content.right.transitions.html');
			dom.this(contentRight).find('.reading-body > div, .reading-lens > div > div', true).html(html);
		}

		// Add new elements
		const readingBody = contentRight.querySelector('.reading-body > div');
		const readingLens = contentRight.querySelector('.reading-lens > div > div');

		// const fragmentBody = document.createDocumentFragment();
		// const fragmentLens = document.createDocumentFragment();

		const groups: Group[] = toAdd.map(function(group) {

			const items = group.items.map(item => item.new).filter(item => item !== null) as Item[];

			return {
				key1: group.key1,
				items,
			};

		});

		const html = template.load('reading.content.right.items.html', {groups});

		const templateBody = document.createElement('template');
		templateBody.innerHTML = html;

		const fragmentBody = templateBody.content;
		const fragmentLens = fragmentBody.cloneNode(true) as DocumentFragment;

		if(readingBody) readingBody.appendChild(fragmentBody);
		if(readingLens) readingLens.appendChild(fragmentLens);

		const setElements = function(base: Element, key: string = 'element') {

			const elements = base.querySelectorAll('.r-flex');

			for(let i = 0, len = elements.length; i < len; i++)
			{
				const element = elements[i] as HTMLDivElement;

				for(let j = 0, len2 = element.children.length; j < len2; j++)
				{
					const children = element.children[j] as HTMLDivElement;
					const item = distribution[i][j];

					if(!item.group)
						item.group = {};

					item[key] = children;
					item.group[key] = element;
				}
			}
		};

		if(readingBody) setElements(readingBody, 'element');
		if(readingLens) setElements(readingLens, 'elementLens');

		return compare;

	}
}
