const sanitizeHtml = require('sanitize-html'),
	url = require('url');

const events = require('./ebook/events.mjs').default;

const DEBUG = false;

var ebook = function(book, config = {}) {

	this.book = book;
	this.config = config;

	this.updateConfig = function(config) {

		for(let key in config)
		{
			this.config[key] = config[key];
		}

	}

	this.chaptersPages = [];
	this.chaptersPagesInfo = [];
	this.pages = [];

	this.chaptersToPages = async function(config = {}, callback = false) {

		this.updateConfig(config);

		this.chaptersPages = [];

		let _this = this;
		let promises = [];

		const chapters = this.book.chapters;

		for(let i = 0, len = chapters.length; i < len; i++)
		{
			promises.push(new Promise(async function(resolve){

				const chapter = chapters[i];
				let htmlString = chapters[i].html;

				if(typeof htmlString !== 'string')
				{
					let serializer = new XMLSerializer();
					htmlString = _this.fixCss(serializer.serializeToString(htmlString));
				}

				const _chapter = {
					fixedLayout: chapter.fixedLayout,
					width: chapter.width,
					height: chapter.height,
					pageSpread: chapter.pageSpread,
				};

				// Only for debug splitInPages
				if(DEBUG)
				{
					console.log('Split in pages chapter '+i);
					const html = new DOMParser().parseFromString(htmlString, 'application/xhtml+xml');
					const data = await _this.splitInPages(html.documentElement, chapter.basePath, chapter.path, _chapter);
					resolve(data);
					return;
				}

				addToQueue(async function(data){

					if(callback) await callback(i, data);
					resolve(data);

				}, len, 'split-in-pages', _this.config, htmlString, chapter.basePath, chapter.path, _chapter);

			}));

			if(DEBUG)
				await promises[i];
		}

		this.chaptersPages = await Promise.all(promises);
		this.pages = this.pagesToOnedimension(this.chaptersPages);

		return this.pages;

	}

	this.chaptersImages = async function(config = {}, callback = false) {

		this.updateConfig(config);

		let _this = this;
		let promises = [];

		for(let i = 0, len = this.book.chapters.length; i < len; i++)
		{
			const chapter = _this.book.chapters[i];

			promises.push(new Promise(function(resolve){

				let htmlString = _this.book.chapters[i].html;

				if(typeof htmlString !== 'string')
				{
					let serializer = new XMLSerializer();
					htmlString = _this.fixCss(serializer.serializeToString(htmlString));
				}

				const _chapter = {
					fixedLayout: chapter.fixedLayout,
					width: chapter.width,
					height: chapter.height,
					pageSpread: chapter.pageSpread,
				};

				let _config = {};

				if(chapter.fixedLayout)
				{
					_config.width = chapter.width;
					_config.height = chapter.height;
				}

				addToQueue(async function(data){

					if(callback) await callback(i, data);
					resolve(data);

				}, len, 'render-page', {..._this.config, ..._config}, htmlString, _this.book.chapters[i].basePath, false, _chapter);

			}));
		}

		return Promise.all(promises);

	}

	this.sanitizeHtmlHead = {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			'meta',
			'title',
			'link'
		]),
		allowedAttributes: {
			link: ['href', 'type', 'rel'],
			meta: ['charset'],
		}
	};

	this.sanitizeHtmlBody = {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			'img',
		])
	};

	this.allowElements = []; //;new Sanitizer().getConfiguration().allowElements;

	this.allowElements = [...this.allowElements, ...[
		// MathML
		'math', 'maction', 'annotation', 'annotation-xml', 'menclose', 'merror', 'mfenced', 'mfrac', 'mi', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mprescripts', 'mroot', 'mrow', 'ms', 'semantics', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover',
	]];

	this.notSplitElements = {
		'm:math': true,
		math: true,
		svg: true,
	};

	this.splitInPages = async function(html, basePath, path = false, chapter = {}) {

		html = html.cloneNode(true);
		html = await this.removeScripts(html); // This is unsafe, later the Sanitizer API would have to be applied
		html = await this.resolvePaths(html, basePath);
		html = await this.applyConfigToHtml(html, chapter);

		const body = html.body || html.querySelector('body');
		body.classList.add('opencomic-split-in-pages');

		const width = chapter.fixedLayout ? chapter.width : this.config.width;
		const height = chapter.fixedLayout ? chapter.height : this.config.height;

		//console.time('Load iframe');

		let iframe = document.createElement('iframe');
		iframe.style.width = width+'px';
		iframe.style.height = height+'px';
		iframe.style.position = 'absolute';
		iframe.style.zIndex = '1000';
		iframe.style.backgroundColor = 'white';
		iframe.style.visibility = 'hidden';
		iframe.sandbox = 'allow-same-origin';

		// Sanitizer API is not support yet and has a bug in MathML: https://bugs.chromium.org/p/chromium/issues/detail?id=1225606&q=Sanitizer%20API&can=2
		//let sanitizer = new Sanitizer({allowCustomElements: true, allowElements: this.allowElements});
		//let htmlSanatized = sanitizer.sanitize(html);
		//iframe.contentDocument.head.setHTML(html.querySelector('head').innerHTML, {sanitizer: new Sanitizer({allowCustomElements: true, allowElements: this.allowElements})});
		//iframe.contentDocument.body.setHTML(html.querySelector('body').innerHTML, {sanitizer: new Sanitizer({allowCustomElements: true, allowElements: this.allowElements})});

		let serializer = new XMLSerializer();
		let htmlString = this.fixCss(serializer.serializeToString(html));

		//console.time('convertStringMathML');
		htmlString = await this.convertStringMathML(htmlString);
		//console.timeEnd('convertStringMathML');

		iframe.srcdoc = htmlString;

		let _this = this;

		return new Promise(async function(resolve, reject) {

			iframe.addEventListener('load', async function(event) {

				//console.timeEnd('Load iframe');
				resolve(await _this.calculateAndSplit(iframe, path, chapter));

			});

			document.body.appendChild(iframe);

		});

	}

	this._chaptersPages = [];
	this.calculateAndSplitParents = [];

	this.cornerPage = function({top, left}) {

		//top++;
		//left++;

		const config = this.config;
		const margin = config.margin || {top: 0, left: 0, right: 0, bottom: 0};

		const vertical = Math.ceil((top - margin.top) / (config.height - margin.top - margin.bottom));
		const horizontal = Math.ceil((left - margin.left) / (config.width - margin.left - margin.right));

		return Math.max(vertical, horizontal);

	}

	this.calculateNodePages = function(node) {

		const rects = node.getClientRects();
		const corners = [];

		for(let i = 0, len = rects.length; i < len; i++)
		{
			const rect = rects[i];
			const {top, left, right, bottom} = rect;

			corners.push(this.cornerPage({top: top + 1, left: left + 1}));
			corners.push(this.cornerPage({top: top + 1, left: right}));
			corners.push(this.cornerPage({top: bottom, left: left + 1}));
			corners.push(this.cornerPage({top: bottom, left: right}));
		}

		const pages = [...new Set(corners.filter(Boolean))];
		return pages.sort(function(a, b){return a - b;});

	}

	this.lastSetPage = 1;

	this.setNodeInPage = function(page, node, index, deepClone = true) {

		this.lastSetPage = page;
		const pageIndex = page - 1;
		const chaptersPages = this._chaptersPages;

		let currentPage = chaptersPages[pageIndex];

		if(!currentPage)
		{
			currentPage = chaptersPages[pageIndex] = [];
			const parents = this.calculateAndSplitParents;

			for(let i = 0, len = parents.length; i < len; i++)
			{
				const parentNode = parents[i].cloneNode(false);
				parentNode.style.textIndent = 'initial';

				if(parentNode.classList.contains('opencomic-separate-words'))
					parentNode.classList.remove('opencomic-separate-words');

				currentPage.push({
					index: i,
					node: parentNode,
				});
 			}
		}

		if(!node)
			return;

		const clonedNode = node.cloneNode(deepClone);

		currentPage.push({
			index: index,
			node: clonedNode,
		});

	}

	this._calculateAndSplit = async function({parent, childs, len, index = 0, currentPage = 0, fixedLayout = false}) {

		this.setNodeInPage(currentPage, parent, index, false);
		this.calculateAndSplitParents.push(parent);

		let elementI = 0;

		for(let i = 0; i < len; i++)
		{
			const child = childs[i];
			const nodeType = child.nodeType;

			if(nodeType == Node.TEXT_NODE)
			{
				let textContent = child.textContent;

				if(textContent.trim())
				{
					const pages = [];

					const text = child.textContent;
					const range = document.createRange();

					let start = 0;
					let lastRectCount = 0;

					for(let i = 1; i <= text.length; i++)
					{
						range.setStart(child, start);
						range.setEnd(child, i);

						const rects = range.getClientRects();

						const isBreak = rects.length > lastRectCount;
						const isEnd = i === text.length;

						if(isBreak || isEnd)
						{
							const end = isBreak ? i - 1 : i;
							const fragment = text.slice(start, end);

							const rectIndex = Math.max(0, rects.length - (isBreak ? 2 : 1));
							const rect = rects[rectIndex];

							const page = !rect ? this.lastSetPage : this.cornerPage({top: rect.top + 1, left: rect.left + 1});

							if(!pages[page]) pages[page] = '';
							pages[page] += fragment;

							start = end;
						}

						lastRectCount = rects.length;
					}

					for(let page = 0, _len = pages.length; page < _len; page++)
					{
						const text = pages[page];

						if(text)
						{
							let _index = index;
							const style = getComputedStyle(parent);

							let justify = false;

							if(style.textAlign === 'justify')
								justify = true;

							if(page !== currentPage)
							{
								const pageIndex = page - 1;

								const chapterPage = this._chaptersPages[pageIndex] || [];
								const lastNode = chapterPage ? chapterPage[chapterPage.length - 1] : false;

								if(lastNode && _index === lastNode.index)
								{
									this.setNodeInPage(page, parent, _index + 1, false);

									_index++;
								}
							}

							let span = document.createElement('span');
							span.className = 'opencomic-separate-words'+(justify ? ' last-opencomic-separate-words-justify' : '');
							span.innerHTML = text;
							this.setNodeInPage(page, span, _index + 1);

							currentPage = page;
						}
					}
				}
			}
			else if(nodeType != Node.COMMENT_NODE) // Not process this nodes
			{
				const pages = this.calculateNodePages(child);
				const pagesLenght = pages.length;
				const tag = child.tagName.toLowerCase();

				const page = fixedLayout ? 1 : (pages[0] && tag !== 'br' ? pages[0] : this.lastSetPage);

				if(pagesLenght === 1 || pagesLenght === 0 || fixedLayout)
				{
					this.setNodeInPage(page, child, index + 1);
				}
				else
				{
					let _childs = child.childNodes;
					let _len = _childs.length;

					if(_len === 0 || this.notSplitElements[tag])
					{
						this.setNodeInPage(page, child, index + 1, false);
					}
					else
					{
						await this._calculateAndSplit({parent: child, childs: _childs, len: _len, index: index + 1, currentPage: page});
					}
				}
			}
		}

		this.calculateAndSplitParents.pop();

	}

	this.calculateAndSplit = async function(iframe, path, chapter = {}) {

		this._chaptersPages = [];
		this.calculateAndSplitParents = [];

		const parent = iframe.contentDocument.body;
		const childs = parent.childNodes;
		const len = childs.length;

		await this._calculateAndSplit({parent, childs, len, fixedLayout: chapter.fixedLayout});

		this.chapterIds = {};
		this._chaptersPages = this._chaptersPages.filter(Boolean);
		const chaptersPages = this._chaptersPages;

		for(let i = 0, len = chaptersPages.length; i < len; i++)
		{
			const pages = chaptersPages[i]; // || ;

			chaptersPages[i] = {
				path: path,
				ids: await this.getPageIds(pages),
				html: await this.arrayBodyToHtml(iframe.contentDocument, pages, i, len),
				chapter,
			};
		}

		if(!DEBUG)
			iframe.remove();

		return this._chaptersPages;

	}

	this.chapterIds = {};

	this.getPageIds = async function(arrayBody) {

		let ids = [];

		for(let i = 0, len = arrayBody.length; i < len; i++)
		{
			let node = arrayBody[i].node;

			if(node.hasAttribute)
			{
				if(node.hasAttribute('id'))
				{
					let id = node.getAttribute('id');
					
					if(!this.chapterIds[id])
					{
						this.chapterIds[id] = true;
						ids.push(id);
					}
				}

				let childsIds = node.querySelectorAll('[id]');

				for(let i2 = 0, len2 = childsIds.length; i2 < len2; i2++)
				{
					let id = childsIds[i2].getAttribute('id');

					if(!this.chapterIds[id])
					{
						this.chapterIds[id] = true;
						ids.push(id);
					}
				}
			}
		}

		return ids;
	}

	this.arrayBodyToHtml = async function(contentDocument, arrayBody, index, length) {

		const attributes = contentDocument.documentElement.attributes;

		const head = contentDocument.head;
		let doc = document.implementation.createHTMLDocument();

		for(let attr of attributes)
		{
			doc.documentElement.setAttribute(attr.name, attr.value);
		}

		doc.head.innerHTML = head.innerHTML// .replace(/column-width:\s*[0-9]+px;\s*/, '');

		let base = false;
		let parents = [];

		for(let i = 0, len = arrayBody.length; i < len; i++)
		{
			let node = arrayBody[i];

			if(i == 0)
			{
				doc.body.outerHTML = node.node.outerHTML;
				doc.body.classList.remove('opencomic-split-in-pages');
				if(index !== 0) doc.body.classList.add('opencomic-not-first-page');
				if(index === length - 1) doc.body.classList.add('opencomic-last-page');
				base = doc.body;
			}
			else
			{
				base.appendChild(node.node);

				let next = arrayBody[i+1] || false;

				if(next)
				{
					if(next.index > node.index)
					{
						parents.push(base);
						base = node.node;
					}
					else if(next.index < node.index)
					{
						let len2 = node.index - next.index;

						for(let r = 0; r < len2; r++)
						{
							base = parents.pop();
						}
					}
				}
			}

			if(i == len - 1)
			{
				if(node.node.classList && node.node.classList.contains('opencomic-separate-words'))
				{
					node.node.classList.add('last-opencomic-separate-words');
				}
				else if(node.node.closest)
				{
					let parent = node.node.closest('.opencomic-separate-words');
					if(parent) parent.classList.add('last-opencomic-separate-words');
				}
			}
		}

		// Remove opencomic-separate-words
		let osw = doc.querySelectorAll('.opencomic-separate-words');

		for(let i = 0, len = osw.length; i < len; i++)
		{
			let node = osw[i];
			let textNode = document.createTextNode(node.textContent);

			if(node.classList.contains('last-opencomic-separate-words'))
			{
				node.innerHTML = '';
				node.appendChild(textNode);
			}
			else
			{
				node.parentNode.replaceChild(textNode, node);
			}
		}

		// doc = this.applyConfigToHtml(doc);

		let serializer = new XMLSerializer();
		return this.fixCss(serializer.serializeToString(doc));

	}

	this.applyConfigToHtml = function(doc, chapter = {}) {

		let body = doc.body || doc.querySelector('body');
		let head = doc.head || doc.querySelector('head');

		if(!body || !head)
			return doc;

		body.style.overflow = 'hidden';

		let epubType = body.getAttribute('epub:type') || '';
		epubType = app.extract(/^\s*([^\s]+)/, epubType, 1).toLowerCase();

		if(chapter.fixedLayout)
			this.applyFixedLayoutStyle(head, chapter);
		else if(epubType == 'cover')
			this.applyCoverStyle(head);
		else
			this.applyGeneralStyle(head);

		return doc;

	}

	this.fixCss = function(htmlString) {

		htmlString = htmlString.replace(/\*\:has\(&gt; \.last-opencomic-separate-words/, '*:has(> .last-opencomic-separate-words')
		return htmlString;

	}

	this.applyFixedLayoutStyle = function(head, chapter) {

		let css = `
			body
			{
				transform: scale(calc(100vw / ${chapter.width}px)) !important;
				transform-origin: top left !important;
				width: ${chapter.width}px;
				height: ${chapter.height}px;
			}
		`;

		let style = head.querySelector('.opencomic-style') || document.createElement('style')
		style.className = 'opencomic-style';
		style.type = 'text/css';
		style.innerHTML = '';
		style.appendChild(document.createTextNode(css))
		head.appendChild(style);
	}

	this.applyCoverStyle = function(head) {

		let css = `
			body {
				display: flex !important;
				align-items: center
				!important; height: 100vh !important;
				width: 100vw !important;
				justify-content: center !important;
			}
			body img {
				width: 100%;
				height: 100%;
				object-fit: contain;
				object-position: center;
			}
		`;

		let style = head.querySelector('.opencomic-style') || document.createElement('style')
		style.className = 'opencomic-style';
		style.type = 'text/css';
		style.innerHTML = '';
		style.appendChild(document.createTextNode(css))
		head.appendChild(style);
	}

	// Apply here margin, letter space, font size, justify, etc
	this.applyGeneralStyle = function(head) {

		const allCss = [];
		const bodyCss = [];
		const bodyCssNotSplit = [];

		const config = this.config;

		if(config.colors && config.colors.background)
		{
			bodyCss.push('background-color: '+config.colors.background+' !important');
			bodyCss.push('color: '+config.colors.text+' !important');
		}

		if(config.fontFamily)
			allCss.push('font-family: "'+config.fontFamily+'" !important');

		if(config.fontSize > 10)
			bodyCss.push('font-size: '+config.fontSize+'px !important');

		if(config.fontWeight > 0)
			allCss.push('font-weight: '+config.fontWeight+' !important');

		if(config.italic)
			allCss.push('font-style: italic !important');

		if(config.textAlign)
			bodyCssNotSplit.push('text-align: '+config.textAlign+' !important');

		if(config.margin !== false)
			bodyCss.push('margin: '+config.margin.top+'px '+config.margin.right+'px '+config.margin.bottom+'px '+config.margin.left+'px !important');

		if(config.letterSpacing > -0.1)
			allCss.push('letter-spacing: '+config.letterSpacing+'em !important');

		if(config.wordSpacing > -0.4)
			allCss.push('word-spacing: '+config.wordSpacing+'em !important');

		if(config.lineHeight > 0.3)
			bodyCss.push('line-height: '+config.lineHeight+'em !important');

		if(config.forceLeftToRight)
		{
			bodyCss.push('direction: ltr !important');
			bodyCss.push('writing-mode: horizontal-tb !important');
		}

		let horizontalMargin = (config.margin !== false ? config.margin.left : 0);
		let verticalMargin = (config.margin !== false ? config.margin.top : 0);

		let pSpacing = (config.pSpacing !== false ? config.pSpacing : 0);

		let css = `

			body {
				word-break: break-word;
				column-fill: auto;
				column-width: ${(config.width - horizontalMargin * 2)}px;
				column-gap: 0px;
				/*column-wrap: wrap;*/
				width: ${(config.width - horizontalMargin * 2)}px;
				height: ${(config.height - verticalMargin * 2)}px;
				`+(bodyCss.join('; '))+`
			}

			body.opencomic-split-in-pages {
				direction: ltr !important;
			}

			body:not(.opencomic-split-in-pages) {
				width: auto;
				height: auto;
			}

			body.opencomic-not-first-page {
				column-width: initial;
			}

			body:not(.opencomic-split-in-pages) {
				`+(bodyCssNotSplit.join('; '))+`
			}

			body:not(.opencomic-split-in-pages) * {
				`+(config.textAlign ? 'text-align: '+config.textAlign+' !important;' : '')+`
			}

			body * {
				`+(allCss.join('; '))+`
			}

			body p {
				`+(config.pSpacing > -1 ? 'margin: '+config.pSpacing+'px 0px !important;' : '')+`
				`+(config.pLineHeight > 0.3 ? 'line-height: '+config.pLineHeight+'em !important;' : '')+`
			}

			body img {
				max-width: calc(100vw - `+(horizontalMargin * 2)+`px) !important;
				max-height: calc(100vh - `+(verticalMargin * 2)+`px) !important;
				width: initial !important;
			}

			body p img {
				max-height: calc(100vh - `+(pSpacing > verticalMargin ? (pSpacing * 2) : (verticalMargin * 2))+`px) !important;
			}

			body a {
				`+(config.colors && config.colors.links ? 'color: '+config.colors.links+' !important;' : '')+`
			}

			/* Fix justified content */
			${(!config.textAlign ? `body:not(.opencomic-split-in-pages):not(.opencomic-last-page) *:has(> .last-opencomic-separate-words.last-opencomic-separate-words-justify) {
				text-align-last: justify !important;
			}` : ``)}

			${(config.textAlign === 'justify' ? `body:not(.opencomic-split-in-pages):not(.opencomic-last-page) *:has(> .last-opencomic-separate-words) {
				text-align-last: justify !important;
			}` : ``)}

			/*body .last-opencomic-separate-words:after {
				content: '';
				display: inline-block;
				width: 100%;
				visibility: hidden
			}*/
		`;

		let style = head.querySelector('.opencomic-style') || document.createElement('style')
		style.className = 'opencomic-style';
		style.type = 'text/css';
		style.innerHTML = '';
		style.appendChild(document.createTextNode(css));
		head.appendChild(style);
	}

	this.removeScripts = async function(html) {

		let items = html.querySelectorAll('script');

		for(let i = 0, len = items.length; i < len; i++)
		{
			items[i].remove();
		}

		return html;

	}

	this._convertMathML = async function(parent, math) {

		let template = document.createElement('template');
		template.innerHTML = math.outerHTML.replace(/(<\/?)m:([a-z0-9]+)/ug, '$1$2');
		parent.replaceChild(template.content, math);

		return;

	}

	this.convertMathML = async function(html) {

		let items = html.querySelectorAll('m\\:math');

		for(let i = 0, len = items.length; i < len; i++)
		{
			let math = items[i];

			let template = document.createElement('template');
			template.innerHTML = math.outerHTML.replace(/(<\/?)m:([a-z0-9]+)/ug, '$1$2');
			math.parentElement.replaceChild(template.content, math);
		}

		return html;

	}

	this.convertStringMathML = async function(html) {

		return html.replace(/(<\/?)m:([a-z0-9]+)/ug, '$1$2');

	}

	this.removeFileScheme = function(path) {

		return p.normalize(path.replace(/^file:/, ''));

	}

	this.resolvePath = function(path, basePath) {

		if(/^file:/.test(path))
			return this.removeFileScheme(path);
		else
			return p.join(basePath, path);

	}

	this.resolvePaths = async function(html, basePath) {

		const svg = [...html.querySelectorAll('svg *')].filter(element => element.hasAttribute('xlink:href'));
		const elements = [...html.querySelectorAll('[href], [src]'), ...svg];

		for(const item of elements)
		{
			if(item.hasAttribute('href'))
				item.setAttribute('href', this.resolvePath(item.getAttribute('href'), basePath));

			if(item.hasAttribute('src'))
				item.setAttribute('src', this.resolvePath(item.getAttribute('src'), basePath));

			if(item.hasAttribute('xlink:href'))
				item.setAttribute('xlink:href', this.resolvePath(item.getAttribute('xlink:href'), basePath));
		}

		return html;

	}

	this.page = function(index) {

		return this.pages[index];

	}

	this.pageToIframe = function(html, chapter = {}, configSize = false) {

		const iframe = document.createElement('iframe');

		const width = chapter.fixedLayout ? chapter.width : this.config.width;
		const height = chapter.fixedLayout ? chapter.height : this.config.height;

		iframe.style.width = configSize ? this.config.width+'px' : '100%';
		iframe.style.height = configSize ? this.config.height+'px' : '100%';
		iframe.style.backgroundColor = this.config.colors && this.config.colors.background ? this.config.colors.background : 'white';
		// iframe.style.pointerEvents = 'none';
		iframe.sandbox = 'allow-same-origin';
		iframe.srcdoc = html;
		iframe.dataset.chapter = JSON.stringify(chapter);

		events.listen(iframe);

		return iframe;

	}

	this.pagesToOnedimension = function(pages) {

		this.chaptersPagesInfo = [];

		let _pages = [];
		let index = 0;

		for(let i = 0, len = pages.length; i < len; i++)
		{
			const startPage = index;

			for(let i2 = 0, len2 = pages[i].length; i2 < len2; i2++)
			{
				let page = pages[i][i2];

				page.chapterProgressSize = 1 / len2 * 100;
				page.chapterProgress = (i2 + 1) / len2 * 100;
				page.chapterIndex = i;
				_pages.push(page);
				index++;
			}

			this.chaptersPagesInfo.push({
				startPage: startPage,
				endPage: index,
			});
		}

		for(let i = 0, len = _pages.length; i < len; i++)
		{
			_pages[i].index = i;
			_pages[i].progress = (i + 1) / len * 100;
		}

		return _pages;

	}

	this._generateTocWithPages = function(items, hrefPage) {

		const toc = [];

		for(let i = 0, len = items.length; i < len; i++)
		{
			const item = items[i];
			const href = item.href || '';
			const _href = href.replace(/^\.+[\/\\]/, '');

			const page = hrefPage[href] !== undefined ? hrefPage[href] : (hrefPage[_href] !== undefined ? hrefPage[_href] : false);

			this.tocPages.push(page);

			toc.push({
				name: item.label.trim(),
				page: page,
				subitems: item.subitems ? this._generateTocWithPages(item.subitems, hrefPage) : false,
			});
		}

		return toc;

	}

	this.toc = false;
	this.tocPages = [];
	this.chaptersIdPage = [];
	this.hrefPage = {};

	// This is slow, it should be optimized
	this.generateTocWithPages = function(toc) {

		this.tocPages = [];

		let chaptersIdPage = this.chaptersIdPage = [];
		let index = 1;

		const chaptersPages = this.chaptersPages;

		for(let i = 0, len = chaptersPages.length; i < len; i++)
		{
			const pages = chaptersPages[i];
			const ids = {'': index};

			for(let i2 = 0, len2 = pages.length; i2 < len2; i2++)
			{
				const page = pages[i2];
				const idsArray = page.ids;

				for(let i3 = 0, len3 = idsArray.length; i3 < len3; i3++)
				{
					const id = idsArray[i3];

					if(!ids[id])
						ids[id] = index;
				}

				index++;
			}

			chaptersIdPage.push(ids);
		}

		const hrefPage = this.hrefPage = {};

		for(let i = 0, len = this.book.chapters.length; i < len; i++)
		{
			const spine = this.book.chapters[i].spine;
			const href = spine.href;

			for(let id in chaptersIdPage[i])
			{
				const page = chaptersIdPage[i][id];
				const _href = href+(id ? '#'+id : '');

				if(!hrefPage[_href])
					hrefPage[_href] = page;
			}
		}

		for(let href in hrefPage)
		{
			const page = hrefPage[href];
			const sections = href.split('/'); // p.sep, check seperator in windows

			const len = sections.length;
			let _href = sections[len - 1];

			if(!hrefPage[_href])
				hrefPage[_href] = page;

			for(let i = len - 2; i >= 0; i--)
			{
				_href = sections[i]+'/'+_href;

				if(!hrefPage[_href])
					hrefPage[_href] = page;
			}
		}

		this.hrefPage = hrefPage;
		this.chaptersIdPage = chaptersIdPage;

		return this.toc = this._generateTocWithPages(toc, hrefPage);

	}

}

let renderQueue = [], renderQueueNum = 1;

async function addToQueue(callback, maxThreads, type, config, html, basePath, path = false, chapter = {})
{
	renderQueue.push({
		type: type,
		callback: callback,
		config: config,
		html: html,
		path: path,
		basePath: basePath,
		chapter: chapter,
		num: renderQueueNum++,
	});

	nextJobToRender(false, maxThreads);
}

var renders = false;
var averageJobTimes = [];
var averageJobTimesStatus = {};

async function nextJobToRender(index = false, maxThreads = false)
{
	createRenders(maxThreads, function(){

		if(index === false)
		{
			for(let i = 0, len = renders.length; i < len; i++)
			{
				index = i;

				if(renders[i].job === false && renders[i].load === true)
					break;
			}
		}

		if(index !== false && renders[index].job === false && renders[index].load === true)
		{
			let job = renderQueue.shift();

			if(job)
			{
				console.log('Job Render['+index+']: '+job.num);

				let data = {
					index: index,
					type: job.type,
					config: job.config,
					html: job.html,
					path: job.path,
					basePath: job.basePath,
					chapter: job.chapter,
				};

				renders[index].job = job;
				renders[index].data = data;
				renders[index].render.webContents.send('render', data);

				averageJobTimesStatus[index] = performance.now();

				restartRenderIfNotResponding(index);
			}
			else
			{
				let allJobsEnded = true;

				for(let i = 0, len = renders.length; i < len; i++)
				{
					if(renders[i].job !== false)
					{
						allJobsEnded = false;
						break;
					}
				}

				if(allJobsEnded)
				{
					renderQueueNum = 1;

					let averageJobTime = 0;
					let len = averageJobTimes.length;

					for(let i = 0; i < len; i++)
					{
						averageJobTime += averageJobTimes[i];
					}

					averageJobTimes = [];

					if(len > 0)
						console.log('Average Job Time: '+(averageJobTime / len));

					closeAllRendersDelayed();
				}
			}
		}

	});
}

var renderNotRespondingST = {};
var renderNotRespondingIntents = {};

async function restartRenderIfNotResponding(index)
{
	renderNotRespondingST[index] = setTimeout(function() {

		renders[index].render.webContents.send('pong', index);

		renderNotRespondingST[index] = setTimeout(function() {

			restartRender(index);

		}, 1000);

	}, 4000);
}

async function renderPong(event, index)
{
	renderHasResponded(index);
	restartRenderIfNotResponding(index);
}

async function renderHasResponded(index)
{
	renderNotRespondingIntents[index] = 0;
	clearTimeout(renderNotRespondingST[index]);
}

async function restartRender(index)
{
	console.log('Restarting render: '+index);

	clearTimeout(renderNotRespondingST[index]);

	if(!renderNotRespondingIntents[index]) renderNotRespondingIntents[index] = 0;
	renderNotRespondingIntents[index]++;

	renders[index].render.close();

	if(renderNotRespondingIntents[index] > 2)
		throw new Error('Ebook render not responding');

	renders[index].load = false;
	renders[index].render = await createRender(function(){

		renders[index].load = true;

		let data = renders[index].data;
		renders[index].render.webContents.send('render', data);

		restartRenderIfNotResponding(index);

	});

} 

async function jobEndedRenderedEbook(event, index, pages)
{
	averageJobTimes.push(performance.now() - averageJobTimesStatus[index]);

	renderHasResponded(index);

	await renders[index].job.callback(pages);
	renders[index].job = false;
	nextJobToRender(index);
}

async function jobEndedRenderedPage(event, index, pages)
{
	averageJobTimes.push(performance.now() - averageJobTimesStatus[index]);

	renderHasResponded(index);

	let job = renders[index].job;

	let width = Math.round(job.config.imageWidth);
	let height = Math.round(job.config.imageWidth / job.config.width * job.config.height);

	renders[index].render.setSize(width, height, false);
	let image = await renders[index].render.capturePage({x: 0, y: 0, width: width, height: height}, {stayHidden: true});

	await renders[index].job.callback(image);
	renders[index].job = false;
	nextJobToRender(index);
}

var cpus = false, currentRenders = 0;

async function createRenders(maxThreads = false, callback = false)
{
	if(cpus === false)
		cpus = os.cpus().length || 1;

	clearTimeout(closeAllRendersST);

	if(currentRenders > 0 && (maxThreads === false || !(currentRenders < maxThreads && currentRenders < cpus)))
	{
		if(callback)
			callback();
		
		return;
	}

	console.time('createRenders');

	if(renders === false)
		renders = [];

	let threads = cpus;

	if(maxThreads !== false && threads > maxThreads)
		threads = maxThreads;

	let _currentRenders = currentRenders;
	currentRenders = threads;

	for(let i = _currentRenders; i < threads; i++)
	{
		let render = await createRender(function(){

			renders[i].load = true;
			nextJobToRender(i);

		});

		renders.push({render: render, job: false, data: false, load: false});

		if(callback && i === _currentRenders)
			callback();

		await app.setImmediate();
	}

	console.timeEnd('createRenders');
}

async function createRender(callback)
{
	let win = new electronRemote.BrowserWindow({
		width: 10,
		height: 10,
		show: false,
		frame: false,

		/*width: 900,
		height: 700,
		show: true,
		frame: true,*/

		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			enableRemoteModule: false,
		},
	});

	win.loadURL(url.format({
		pathname: p.join(appDir, './templates/ebook.render.html'),
		protocol: 'file:',
		slashes: true,
	}));

	win.webContents.on('console-message', function(event, level, message, line, sourceId) {
		
		if(!/Electron Security Warning/iu.test(message))
			console.error(`Error in render: ${message} ${sourceId}:${line}`);

	});

	// win.webContents.openDevTools()

	win.webContents.on('did-finish-load', callback);

	return win;
}

async function showRenders()
{
	for(let i = 0, len = renders.length; i < len; i++)
	{
		renders[i].render.show();
		renders[i].render.setPosition(i * 100, 0);
	}
}

var closeAllRendersST = false;

function closeAllRendersDelayed()
{
	closeAllRendersST = setTimeout(function(){

		closeAllRenders();

	}, 10000);
}

function closeAllRenders()
{
	if(renders === false) return;

	for(let i = 0, len = renders.length; i < len; i++)
	{
		clearTimeout(renderNotRespondingST[i]);
		renders[i].render.close();
	}

	renders = false;
	currentRenders = 0;
}

if(typeof electronRemote !== 'undefined') // electronRemote is undefined in redner.js
{
	electronRemote.ipcMain.on('rendered-ebook', jobEndedRenderedEbook);
	electronRemote.ipcMain.on('rendered-page', jobEndedRenderedPage);
	electronRemote.ipcMain.on('pong', renderPong);
}

var standarSizeConfig = {
	height: 1050,
	width: 700,
	fontSize: 20,
	fontFamily: false,
	textAlign: false,
	margin: {
		top: 40,
		right: 40,
		bottom: 40,
		left: 40,
	},
	letterSpacing: 0,
	wordSpacing: 0,
	pSpacing: 4,
	pLineHeight: 1.3,
	lineHeight: false,
	colorsTheme: false,
	colors: {
		text: '',
		links: '',
		background: '',
		negative: false,
	},
};

module.exports = {
	load: function(book, config) {
		return new ebook(book);
	},
	standarSizeConfig: standarSizeConfig,
	createRenders: createRenders,
	closeAllRenders: closeAllRenders,
	renders: function(){return renders},
	renderQueue: function(){return renderQueue},
	showRenders: showRenders,
	epub: false,
}