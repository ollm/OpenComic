const sanitizeHtml = require('sanitize-html'),
	url = require('url');

var html2canvas = false;

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

		for(let i = 0, len = this.book.chapters.length; i < len; i++)
		{
			promises.push(new Promise(function(resolve){

				let htmlString = _this.book.chapters[i].html;

				if(typeof htmlString !== 'string')
				{
					let serializer = new XMLSerializer();
					htmlString = serializer.serializeToString(htmlString);
				}

				addToQueue(async function(data){

					if(callback) await callback(i, data);
					resolve(data);

				}, len, 'split-in-pages', _this.config, htmlString, _this.book.chapters[i].basePath, _this.book.chapters[i].path)

			}));
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
			promises.push(new Promise(function(resolve){

				let htmlString = _this.book.chapters[i].html;

				if(typeof htmlString !== 'string')
				{
					let serializer = new XMLSerializer();
					htmlString = serializer.serializeToString(htmlString);
				}

				addToQueue(async function(data){

					if(callback) await callback(i, data);
					resolve(data);

				}, len, 'render-page', _this.config, htmlString, _this.book.chapters[i].basePath)

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

	this.splitInPagesIframe = async function(html, basePath) {

		html = html.cloneNode(true);
		html = await this.removeScripts(html); // This is unsafe, later the Sanitizer API would have to be applied
		html = await this.resolvePaths(html, basePath);
		html = await this.addOptimizations(html);

		let iframe = document.createElement('iframe');
		iframe.style.width = this.config.width+'px';
		iframe.style.height = this.config.height+'px';
		iframe.style.position = 'absolute';
		iframe.style.zIndex = '1000';
		iframe.style.backgroundColor = 'white';
		iframe.style.visibility = 'hidden';
		iframe.sandbox = 'allow-same-origin';

		let serializer = new XMLSerializer();
		let htmlString = serializer.serializeToString(html);

		htmlString = await this.convertStringMathML(htmlString);

		iframe.srcdoc = htmlString;

		let _this = this;

		return iframe;

	}

	this.splitInPages = async function(html, basePath, path = false) {

		html = html.cloneNode(true);
		html = await this.removeScripts(html); // This is unsafe, later the Sanitizer API would have to be applied
		html = await this.resolvePaths(html, basePath);
		html = await this.applyConfigToHtml(html);

		//console.time('Load iframe');

		let iframe = document.createElement('iframe');
		iframe.style.width = this.config.width+'px';
		iframe.style.height = this.config.height+'px';
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
		let htmlString = serializer.serializeToString(html);

		//console.time('convertStringMathML');
		htmlString = await this.convertStringMathML(htmlString);
		//console.timeEnd('convertStringMathML');

		iframe.srcdoc = htmlString;

		let _this = this;

		return new Promise(async function(resolve, reject) {

			iframe.addEventListener('load', async function(event) {

				//console.timeEnd('Load iframe');
				resolve(await _this.calculateAndSplit(iframe, path));

			});

			document.body.appendChild(iframe);

		});

	}

	this._chaptersPage = false;
	this._chaptersPageFirst = false;
	this._chaptersPages = [];
	this._chaptersPagesPage = 0;
	this._currentPageTop = 0;
	this.calculateAndSplitParents = [];

	this.splitDocumentHere = async function(newTop = false) {

		this._chaptersPages.push(this._chaptersPage);

		this._chaptersPage = [];
		this._chaptersPageFirst = true;

		let highMarginTop = 0;

		for(let i = 0, len = this.calculateAndSplitParents.length; i < len; i++)
		{
			let style = window.getComputedStyle(this.calculateAndSplitParents[i]);
			let marginTop = parseInt(style.marginTop);

			if(marginTop > highMarginTop)
				highMarginTop = marginTop;

			let node = this.calculateAndSplitParents[i].cloneNode(false);
			node.style.textIndent = 'initial';
			node.classList.remove('opencomic-separate-words');

			/*let osw = node.querySelectorAll('.opencomic-separate-words');

			for(let i2 = 0, len2 = osw.length; i2 < len2; i2++)
			{
				osw[i2].classList.remove('opencomic-separate-words');
			}*/

			this._chaptersPage.push({
				index: i,
				node: node,
			});
		}

		this._currentPageTop = newTop - highMarginTop;

		return true;

	}

	this.checkIfNodeHasToSplit = function(node) {

		let rect = node.getBoundingClientRect();

		if(rect.top + rect.height > this._currentPageTop + (this.config.height - this.config.margin.bottom))
			return rect.top;

		return false;
	}

	this._calculateAndSplit = async function(parent, childs, len, hasToSplit = false, isSeparateWords = false, index = 0) {

		this._chaptersPage.push({
			index: index,
			node: parent.cloneNode(false),
		});

		this.calculateAndSplitParents.push(parent);

		let elementI = 0;

		for(let i = 0; i < len; i++)
		{
			if(elementI !== 0)
				this._chaptersPageFirst = false;

			let child = childs[i];
			let nodeType = child.nodeType;

			if(nodeType == Node.TEXT_NODE)
			{
				let textContent = child.textContent;

				if(textContent.trim())
				{
					if(isSeparateWords || !hasToSplit)
					{
						if(hasToSplit)
							await this.splitDocumentHere(hasToSplit);

						this._chaptersPage.push({
							index: index + 1,
							node: child.cloneNode(false),
						});
					}
					else
					{
						let span = document.createElement('span');
						span.className = 'opencomic-separate-words';
						span.innerHTML = textContent.replace(/(\s*[^\s]+\s*)/ug, '<span>$1</span>');
						child.parentElement.replaceChild(span, child);

						let _childs = span.childNodes;
						let _len = _childs.length;

						await this._calculateAndSplit(span, _childs, _len, hasToSplit, true, index + 1, true);
					}
				}
			}
			else if(nodeType != Node.COMMENT_NODE) // Not process this nodes
			{
				let _hasToSplit = hasToSplit ? this.checkIfNodeHasToSplit(child) : false;

				let _childs = child.childNodes;
				let _len = _childs.length;

				if(_len === 0)
				{
					if(_hasToSplit && !this._chaptersPageFirst)
						await this.splitDocumentHere(_hasToSplit);

					this._chaptersPage.push({
						index: index + 1,
						node: child.cloneNode(false),
					});

					//if(_hasToSplit && this._chaptersPageFirst)
					//	await this.splitDocumentHere(_hasToSplit);
				}
				else
				{
					if(_hasToSplit && !this.notSplitElements[child.tagName.toLowerCase()])
					{
						await this._calculateAndSplit(child, _childs, _len, _hasToSplit, isSeparateWords, index + 1);
					}
					else
					{
						if(_hasToSplit && !this._chaptersPageFirst)
							await this.splitDocumentHere(_hasToSplit);

						this._chaptersPage.push({
							index: index + 1,
							node: child.cloneNode(true),
						});

						//if(_hasToSplit && this._chaptersPageFirst)
						//	await this.splitDocumentHere(_hasToSplit);
					}
				}

				elementI++;
			}
		}

		this.calculateAndSplitParents.pop();

		return this._chaptersPage;

	}

	this.calculateAndSplit = async function(iframe, path) {

		this._chaptersPage = [];
		this._chaptersPageFirst = true;
		this._chaptersPages = [];
		this._chaptersPagesPage = 0;
		this._currentPageTop = 0;
		this.calculateAndSplitParents = [];

		let parent = iframe.contentDocument.body;
		let childs = parent.childNodes;
		let len = childs.length;

		let hasToSplit = this.checkIfNodeHasToSplit(parent);

		await this._calculateAndSplit(parent, childs, len, hasToSplit);
		this._chaptersPages.push(this._chaptersPage);

		this.chapterIds = {};

		for(let i = 0, len = this._chaptersPages.length; i < len; i++)
		{
			this._chaptersPages[i] = {
				path: path,
				ids: await this.getPageIds(this._chaptersPages[i]),
				html: await this.arrayBodyToHtml(iframe.contentDocument.head, this._chaptersPages[i]),
			};
		}

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

	this.arrayBodyToHtml = async function(head, arrayBody) {

		let doc = document.implementation.createHTMLDocument();

		doc.head.innerHTML = head.innerHTML;

		let base = false;
		let parents = [];

		for(let i = 0, len = arrayBody.length; i < len; i++)
		{
			let node = arrayBody[i];

			if(i == 0)
			{
				doc.body.outerHTML = node.node.outerHTML;
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
		return serializer.serializeToString(doc);

	}

	this.applyConfigToHtml = function(doc) {

		let body = doc.body || doc.querySelector('body');
		let head = doc.head || doc.querySelector('head');

		body.style.overflow = 'hidden';

		let epubType = body.getAttribute('epub:type') || '';
		epubType = app.extract(/^\s*([^\s]+)/, epubType, 1).toLowerCase();

		if(epubType == 'cover')
			this.applyCoverStyle(head);
		else
			this.applyGeneralStyle(head);

		return doc;

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

		let bodyCss = [];

		if(this.config.colors && this.config.colors.background)
		{
			bodyCss.push('background-color: '+this.config.colors.background+' !important');
			bodyCss.push('color: '+this.config.colors.text+' !important');
		}

		if(this.config.fontFamily)
			bodyCss.push('font-family: "'+this.config.fontFamily+'" !important');

		if(this.config.fontSize > 10)
			bodyCss.push('font-size: '+this.config.fontSize+'px !important');

		if(this.config.fontWeight > 0)
			bodyCss.push('font-weight: '+this.config.fontWeight+' !important');

		if(this.config.italic)
			bodyCss.push('font-style: italic !important');

		if(this.config.textAlign)
			bodyCss.push('text-align: '+this.config.textAlign+' !important');

		if(this.config.margin !== false)
			bodyCss.push('margin: '+this.config.margin.top+'px '+this.config.margin.right+'px '+this.config.margin.bottom+'px '+this.config.margin.left+'px !important');

		if(this.config.letterSpacing > -0.1)
			bodyCss.push('letter-spacing: '+this.config.letterSpacing+'em !important');

		if(this.config.wordSpacing > -0.4)
			bodyCss.push('word-spacing: '+this.config.wordSpacing+'em !important');

		if(this.config.lineHeight > 0.3)
			bodyCss.push('line-height: '+this.config.lineHeight+'em !important');

		let horizontalMargin = (this.config.margin !== false ? this.config.margin.left : 0);
		let verticalMargin = (this.config.margin !== false ? this.config.margin.top : 0);

		let pSpacing = (this.config.pSpacing !== false ? this.config.pSpacing : 0);

		let css = `
			body {
				word-break: break-word;
				`+(bodyCss.join('; '))+`
			}

			body * {
				`+(this.config.textAlign ? 'text-align: '+this.config.textAlign+' !important;' : '')+`
			}

			body p {
				`+(this.config.pSpacing > -1 ? 'margin: '+this.config.pSpacing+'px 0px !important;' : '')+`
				`+(this.config.pLineHeight > 0.3 ? 'line-height: '+this.config.pLineHeight+'em !important;' : '')+`
			}

			body img {
				max-width: calc(100vw - `+(horizontalMargin * 2)+`px) !important;
				max-height: calc(100vh - `+(verticalMargin * 2)+`px) !important;
			}

			body p img {
				max-height: calc(100vh - `+(pSpacing > verticalMargin ? (pSpacing * 2) : (verticalMargin * 2))+`px) !important;
			}

			body a {
				`+(this.config.colors && this.config.colors.links ? 'color: '+this.config.colors.links+' !important;' : '')+`
			}

			/* Fix justified content */
			body .last-opencomic-separate-words:after {
				content: '';
				display: inline-block;
				width: 100%;
				visibility: hidden
			}
		`;

		let style = head.querySelector('.opencomic-style') || document.createElement('style')
		style.className = 'opencomic-style';
		style.type = 'text/css';
		style.innerHTML = '';
		style.appendChild(document.createTextNode(css))
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

	this._separateWords = async function(parent, childs) {

		for(let i = 0, len = childs.length; i < len; i++)
		{
			let child = childs[i];

			if(child.nodeType == Node.TEXT_NODE)
			{
				let textContent = child.textContent;

				if(!/^\s*([^\s]+)\s*$/.test(textContent))
				{
					let template = document.createElement('template');
					template.innerHTML = textContent.replace(/([^\s]+)/ug, '<span>$1</span>');
					parent.replaceChild(template.content, child);
				}
			}
			else
			{
				let tagName = child.tagName;

				if(tagName !== 'm:math' && tagName !== 'math' && tagName !== 'M:MATH' && tagName !== 'MATH')
				{
					await this._separateWords(child, child.childNodes);
				}
				else if(tagName === 'm:math' || tagName === 'M:MATH')
				{
					let newMath = document.createElement('math');
					newMath.innerHTML = child.innerHTML.replace(/(<\/?)m:([a-z0-9]+)/ug, '$1$2');
					parent.replaceChild(newMath, child);
				}
			}
		}

		return;

	}

	this.separateWords = async function(html) {

		console.time('separateWords');

		let body = html.querySelector('body');
		await this._separateWords(body, body.childNodes);

		/*let items = html.querySelectorAll('body *:not(:empty)');

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];

			for(let c = 0, len2 = item.childNodes.length; c < len2; c++)
			{
				let child = item.childNodes[c];

				if(child.nodeType == Node.TEXT_NODE)
				{
					let textContent = child.textContent;

					if(!/^\s*([^\s]+)\s*$/.test(textContent))
					{
						let template = document.createElement('template');
						template.innerHTML = textContent.replace(/([^\s]+)/ug, '<span>$1</span>');
						item.replaceChild(template.content, child);
					}
				}
			}
		}*/
	
		console.timeEnd('separateWords');

		return html;
	}

	this.addOptimizations = async function(html) {

		html.style.overflow = 'hidden';
		/*let style = document.createElement('style')
		style.className = 'opencomic-optimizations';
		style.type = 'text/css';
		style.appendChild(document.createTextNode('body {visibility: hidden;opacity: 0;}'))
		html.querySelector('head').appendChild(style);*/

		return html;
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

		let href = html.querySelectorAll('[href]');

		for(let i = 0, len = href.length; i < len; i++)
		{
			let item = href[i];
			item.setAttribute('href', this.resolvePath(item.getAttribute('href'), basePath));
		}
	
		let src = html.querySelectorAll('[src]');

		for(let i = 0, len = src.length; i < len; i++)
		{
			let item = src[i];
			item.setAttribute('src', this.resolvePath(item.getAttribute('src'), basePath));
		}

		return html;

	}

	this.page = function(index) {

		return this.pages[index];

	}

	this.pageToIframe = function(html) {

		let iframe = document.createElement('iframe');

		iframe.style.width = this.config.width+'px';
		iframe.style.height = this.config.height+'px';
		iframe.style.backgroundColor = this.config.colors && this.config.colors.background ? this.config.colors.background : 'white';
		iframe.style.pointerEvents = 'none';
		iframe.sandbox = 'allow-same-origin';
		iframe.srcdoc = html;

		return iframe;

	}

	this.renderHtmlToCanvas = async function(html, scale) {

		if(!html2canvas) html2canvas = require('html2canvas');

		console.time('Load iframe');

		let iframe = document.createElement('iframe');

		iframe.style.width = this.config.width+'px';
		iframe.style.height = this.config.height+'px';
		iframe.style.position = 'absolute';
		iframe.style.zIndex = '1000';
		iframe.style.backgroundColor = 'white';
		iframe.style.visibility = 'hidden';
		iframe.sandbox = 'allow-same-origin';
		iframe.srcdoc = html;

		return new Promise(async function(resolve, reject) {

			iframe.addEventListener('load', async function(event) {

				console.timeEnd('Load iframe');
				console.time('html2canvas');

				// Make a capture using https://stackoverflow.com/questions/62565587/how-do-i-capture-an-image-from-a-electron-window

				let canvas = await html2canvas(iframe.contentDocument.body, {
					useCORS: false,
					logging: false,
					backgroundColor: '#ffffff',
					scale: scale,
					x: 0,
					y: 0,
					scrollX: 0,
					scrollY: 0,
				});

				console.timeEnd('html2canvas');

				iframe.remove();

				resolve(canvas);

			});

			document.body.appendChild(iframe);

		});
	}

	this.pagesToOnedimension = function(pages) {

		this.chaptersPagesInfo = [];

		let _pages = [];
		let index = 0;

		for(let i = 0, len = pages.length; i < len; i++)
		{
			startPage = index;

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

		let toc = [];

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];

			let page = hrefPage[item.href] !== undefined ? hrefPage[item.href] : false;

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

	// This is slow, it should be optimized
	this.generateTocWithPages = function(toc) {

		this.tocPages = [];

		let chaptersIdPage = [];
		let index = 1;

		for(let i = 0, len = this.chaptersPages.length; i < len; i++)
		{
			let pages = this.chaptersPages[i];

			let ids = {'': index};

			for(let i2 = 0, len2 = pages.length; i2 < len2; i2++)
			{
				let page = pages[i2];

				for(let i3 = 0, len3 = page.ids.length; i3 < len3; i3++)
				{
					let id = page.ids[i3];

					if(!ids[id])
						ids[id] = index;
				}

				index++;
			}

			chaptersIdPage.push(ids);
		}

		let hrefPage = {};

		for(let i = 0, len = this.book.chapters.length; i < len; i++)
		{
			let spine = this.book.chapters[i].spine;
			let href = spine.href;

			for(let id in chaptersIdPage[i])
			{
				let page = chaptersIdPage[i][id];
				let _href = href+(id ? '#'+id : '');

				if(!hrefPage[_href])
					hrefPage[_href] = page;
			}
		}

		for(let href in hrefPage)
		{
			let page = hrefPage[href];
			let sections = href.split('/'); // p.sep, check seperator in windows

			let len = sections.length;
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

		return this.toc = this._generateTocWithPages(toc, hrefPage);

	}

}

let renderQueue = [], renderQueueNum = 1;

async function addToQueue(callback, maxThreads, type, config, html, basePath, path = false)
{
	renderQueue.push({
		type: type,
		callback: callback,
		config: config,
		html: html,
		path: path,
		basePath: basePath,
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

					// For check performance only
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

	let width = job.config.imageWidth;
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
	epub: false,
}