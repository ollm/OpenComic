var foliate = false;
var foliateFb2 = false;
var foliateMobi = false;
var foliateFflate = false;
const CONTAINER_PATH = 'META-INF/container.xml';

var epub = function(path, config = {}) {

	this.path = path;
	this.realPath = fileManager.realPath(this.path);
	this.realPathZip = fileManager.realPath(this.path, 0, {epub: 'epub-zip'});
	this.config = config;
	this.format = String(config.format || app.extname(this.path)).toLowerCase();
	this.isFoliateBook = compatible.compressed.foliate.has(this.format);

	this.zip = false;
	this.zipFiles = false;

	this.containerXml = false;
	this.opf = false;

	/* Manage Zip epub */

	this.openEpubZip = async function() {

		if(this.zip) return;
		this.zip = fileManager.file(this.path);
		this.zip.updateConfig({progress: {multiply: 0.5}});

	}

	this.readEpubZipFiles = async function() {

		if(this.zipFiles) return this.zipFiles;

		await this.openEpubZip();

		return this.zipFiles = await this.zip.read({filtered: false, forceType: '7z', prefixes: {epub: 'epub-zip'}});

	}

	this.extracted = false;

	// Extract epub files
	this.makeAvailable = async function() {

		let files = fileManager.fileCompressed('').filesToOnedimension(this.zipFiles);
		files = files.filter((file) => !file.folder);

		this.extracted = await this.zip.makeAvailable(files);

	}

	this.findContentOpf = async function() {

		if(this.opf) return this.opf;

		await this.readEpubZipFiles();
		await this.makeAvailable();

		let path = p.join(this.realPathZip, CONTAINER_PATH);

		if(fs.existsSync(path))
		{
			this.containerXml = await fsp.readFile(path, 'utf8');
			this.opf = extract(/\<rootfile\s[^>]*full-path="([^">]+)"/, this.containerXml, 1);

			if(this.opf)
			{
				this.opf = p.join(this.realPathZip, this.opf)

				if(!fs.existsSync(this.opf))
					throw new Error('Epub opf file not exists');
			}
			else
			{
				throw new Error('Epub not have opf file');
			}
		}
		else
		{
			throw new Error('Epub container file not exists');
		}

		return this.opf;
	}

	/* Manage epub */

	this.ebook = false;

	this.epub = false;
	this.epubFiles = false;
	this.epubMetadata = false;

	this.toc = false;

	this.resourcePath = function(uri) {

		uri = decodeURIComponent(String(uri).split('#')[0].split('?')[0]);
		return p.join(this.realPathZip, ...uri.split('/'));

	}

	this.openEpub = async function() {

		if(this.epub) return;

		if(this.isFoliateBook)
		{
			const file = new Blob([await fsp.readFile(this.path)]);

			if(this.format === 'fb2')
			{
				if(foliateFb2 === false)
					foliateFb2 = await import(nodeUrl.pathToFileURL(asarToAsarUnpacked(p.join(appDir, 'node_modules/foliate-js/fb2.js'))).href);

				this.epub = await foliateFb2.makeFB2(file);
			}
			else
			{
				if(foliateMobi === false)
					foliateMobi = await import(nodeUrl.pathToFileURL(asarToAsarUnpacked(p.join(appDir, 'node_modules/foliate-js/mobi.js'))).href);

				if(foliateFflate === false)
					foliateFflate = await import(nodeUrl.pathToFileURL(asarToAsarUnpacked(p.join(appDir, 'node_modules/foliate-js/vendor/fflate.js'))).href);

				this.epub = await new foliateMobi.MOBI({unzlib: foliateFflate.unzlibSync}).open(file);
			}

			this.toc = {toc: await this.normalizeToc(this.epub.toc || [])};
			return;
		}

		if(foliate === false)
			foliate = await import(nodeUrl.pathToFileURL(asarToAsarUnpacked(p.join(appDir, 'node_modules/foliate-js/epub.js'))).href);

		await this.findContentOpf();

		this.epub = new foliate.EPUB({
			loadText: async uri => {

				try
				{
					return await fsp.readFile(this.resourcePath(uri), 'utf8');
				}
				catch(error)
				{
					if(error.code === 'ENOENT') return null;
					throw error;
				}

			},
			loadBlob: uri => fsp.readFile(this.resourcePath(uri)),
			getSize: uri => fs.statSync(this.resourcePath(uri)).size,
		});

		await this.epub.init();
		this.toc = {toc: this.epub.toc || []};
	}

	this.resolveKindleLinkCache = {};

	this.resolveKindleLink = async function(kindle) {

		if(!kindle || !this.isFoliateBook || (this.format !== 'azw3' && this.format !== 'azw'))
			return false;

		if(this.resolveKindleLinkCache[kindle])
			return this.resolveKindleLinkCache[kindle];

		const target = await this.epub.resolveHref(kindle);
		const id = sha1(kindle);

		if(!target)
			return false;

		const chapter = await this.chapterHtml(target.index);
		const element = target.anchor(chapter.html);

		element?.setAttribute('oc-id', id);

		if(!element)
			return false;

		this.resolveKindleLinkCache[kindle] = {
			id: id,
			chapterIndex: target.index,
			element: element,
		};

		return this.resolveKindleLinkCache[kindle];

	}

	this.kindleLink = function(href) {

		return app.extract(/(kindle:pos:fid:\w+:off:\w+)/iu, href, 1) || '';

	}

	this.normalizeToc = async function(items) {

		if(!Array.isArray(items)) return [];

		const normalized = [];

		for(const item of items)
		{
			let href = item.href || '';
			let id = item.id || '';
			let kindle = '';

			if(this.format === 'mobi')
			{
				const [index, _id] = this.epub.splitTOCHref(href);
				id = _id;
			}
			else if(this.format === 'azw3' || this.format === 'azw')
			{
				const kindle = this.kindleLink(href);
				const kindleLink = await this.resolveKindleLink(kindle)
				id = kindleLink?.id || '';
			}
			else if(this.format === 'fb2')
			{
				if(typeof item.label !== 'undefined' && !item.label.trim())
					item.label = '...';
			}

			normalized.push({
				...item,
				id,
				href,
				kindle,
				subitems: await this.normalizeToc(item.subitems),
			});
		}

		return normalized;

	}

	this.getHrefNames = function(items, hrefNames = {}) {

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];
			let href = String(item.href || '').replace(/[#?].*/, '');

			if(!hrefNames[href])
				hrefNames[href] = item.label.trim();

			if(item.subitems)
				hrefNames = this.getHrefNames(item.subitems, hrefNames);
		}

		return hrefNames;

	}

	this.readEpubFiles = async function() {

		if(this.epubFiles) return this.epubFiles;

		await this.openEpub();

		this.epubFiles = [];

		if(this.epub.resources?.cover || (this.isFoliateBook && await this.getCoverBlob()))
			this.epubFiles.push('cover.tbn');

		let hrefNames = this.getHrefNames(this.toc.toc);

		let prevName = '';
		let prevNameNum = 2;
		let len = this.epub.sections.length;
		let leadingZeros = Math.max(String(len).length, 4);

		for(let i = 0; i < len; i++)
		{
			let item = this.epub.sections[i];

			if(!item.createDocument)
				continue;

			let name = hrefNames[item.id] || app.capitalize(app.extract(/^(.*?)\.[a-z0-9]+$/, String(item.id), 1).trim());

			if(!name)
			{
				name = prevName+' '+(prevNameNum++);
			}
			else
			{
				prevName = name;
				prevNameNum = 2;
			}

			this.epubFiles.push(String(i).padStart(leadingZeros, '0')+'_sortonly - '+fileManager.replaceReservedCharacters(name)+'.jpg');
		}

		return this.epubFiles;

	}

	this.epubImages = false;
	this.epubImagesList = false;
	this.coverBlob = false;

	this.getCoverBlob = async function() {

		if(this.coverBlob !== false) return this.coverBlob;

		await this.openEpub();

		if(typeof this.epub.getCover !== 'function')
			return this.coverBlob = null;

		try
		{
			this.coverBlob = await this.epub.getCover() || null;
		}
		catch(error)
		{
			console.warn('Failed to load ebook cover', error);
			this.coverBlob = null;
		}

		return this.coverBlob;

	}

	this.writeCover = async function(path) {

		const cover = await this.getCoverBlob();
		if(!cover) return false;

		await fsp.writeFile(path, Buffer.from(await cover.arrayBuffer()));
		return true;

	}

	this.readEpubImages = async function() {

		if(this.epubImagesList) return this.epubImagesList;
		if(this.isFoliateBook) return this.epubImagesList = [];

		await this.openEpub();

		const self = this;

		this.epubImages = [];
		this.epubImagesList = [];

		if(this.epub.resources?.cover)
		{
			this.epubImagesList.push('cover.tbn');

			this.epubImages.push({
				name: 'cover.tbn',
				src: this.resourcePath(this.epub.resources.cover.href),
				base: '/',
				num: 0,
			});
		}

		let len = this.epub.sections.length;
		let num = 1;

		const promises = [];

		for(let i = 0; i < len; i++)
		{
			const _num = num++;

			promises.push((async function() {

				let item = self.epub.sections[i];
				let chapter = await self.chapterHtml(i);

				const images = chapter.html.querySelectorAll('img, image');

				for(const image of images)
				{
					const src = image.getAttribute('src') || image.getAttribute('xlink:href');

					if(src)
					{
						self.epubImages.push({
							src,
							base: p.dirname(self.resourcePath(item.id)),
							num: _num,
						});
					}
				}

			})());
		}

		await Promise.all(promises);

		const leadingZeros = Math.max(String(num).length, 4);

		for(const image of this.epubImages)
		{
			if(image.name)
				continue;

			const ext = app.extname(image.src);
			image.name = `image-${String(image.num + 1).padStart(leadingZeros, '0')}.${ext}`;

			this.epubImagesList.push(image.name);
		}

		return this.epubImagesList;

	}

	this.extractEpubImages = async function(dest, {files, progress}) {

		await this.readEpubImages();

		const self = this;
		const set = new Set(files ?? []);

		const extractLen = files ? this.epubImages.filter(image => set.has(image.name)).length : this.epubImages.length;
		let extracted = 0;

		const promises = [];

		for(const image of this.epubImages)
		{
			if(!files || set.has(image.name))
			{
				promises.push((async function() {

					const outputPath = p.join(dest, image.name);

					const path = p.join(self.removeFileScheme(image.base), self.removeFileScheme(image.src));
					await fsp.copyFile(path, outputPath);

					if(progress)
						progress(++extracted / extractLen, image.name);

				})());
			}
		}

		await Promise.all(promises);

	}

	this.getElements = function(opf, tagName, query = false) {

		const elements = [];
		tagName = Array.isArray(tagName) ? tagName : [tagName];

		for(let i = 0, len = tagName.length; i < len; i++)
		{
			const tag = tagName[i];
			elements.push(...opf.getElementsByTagName(tag));
		}

		if(query)
			elements.push(...opf.querySelectorAll(query));

		return elements;
	}

	this.getStringMetadata = function(opf, tagName, query = false) {

		const elements = this.getElements(opf, tagName, query);
		const element = elements.length > 0 ? elements[0] : false;
		return element ? element.textContent : '';

	}

	this.getArrayMetadata = function(opf, tagName, query = false) {

		const list = [];
		const elements = this.getElements(opf, tagName, query);

		for(let i = 0, len = elements.length; i < len; i++)
		{
			list.push(elements[i].textContent);
		}

		return list.join(', ');

	}

	this.getObjectMetadata = function(opf, tagName, keys) {

		let list = [];
		let elements = opf.getElementsByTagName(tagName);

		for(let i = 0, len = elements.length; i < len; i++)
		{
			let element = elements[i];

			let _list = {
				name: element.textContent,
			};

			for(let k = 0, len2 = keys.length; k < len2; k++)
			{
				let key = keys[k];
				let property = opf.querySelector('*[property="'+key+'"][refines="#'+element.id+'"]');
				_list[key] = property ? property.textContent : '';
			}

			list.push(_list);
		}
		return list;

	}

	// https://standardebooks.org/manual/latest/9-metadata
	// https://www.w3.org/TR/epub-33/#sec-pkg-metadata
	this.readEpubMetadata = async function() {

		if(this.epubMetadata) return this.epubMetadata;

		await this.openEpub();

		let metadata = {...this.epub.metadata};

		if(this.isFoliateBook)
		{
			const authors = Array.isArray(metadata.author) ? metadata.author : [];
			const authorNames = authors.map(author => typeof author === 'string' ? author : author.name).filter(Boolean).join(', ');

			metadata.author = authorNames;
			metadata.creator = authorNames;
			metadata.pubdate = metadata.pubdate || metadata.published || '';
			metadata.modified_date = metadata.modified_date || metadata.modified || '';
			metadata.genre = Array.isArray(metadata.subject) ? metadata.subject.join(', ') : (metadata.subject || '');

			return this.epubMetadata = metadata;
		}

		let res = fs.readFileSync(this.opf, 'utf8');

		let parser = new DOMParser();
		let opf = parser.parseFromString(res, 'text/xml');

		// Author
		metadata.author = this.getArrayMetadata(opf, 'dc:creator');
		metadata.creator = metadata.author;

		// Publisher
		metadata.publisher = this.getArrayMetadata(opf, 'dc:publisher');

		// subject
		metadata.subject = this.getObjectMetadata(opf, 'dc:subject', ['authority', 'term']);

		// Genre
		metadata.genre = this.getArrayMetadata(opf, 'se:subject', '*[property="se:subject"]');

		// Identifier
		metadata.identifier = this.getArrayMetadata(opf, 'dc:identifier');

		// Source
		metadata.source = this.getArrayMetadata(opf, 'dc:source');

		// Dates
		metadata.pubdate = this.getStringMetadata(opf, 'dc:date');
		metadata.modified_date = this.getStringMetadata(opf, 'meta', '*[property="dcterms:modified"]');

		// Contributor
		metadata.contributor = this.getObjectMetadata(opf, 'dc:contributor', ['role']);

		metadata.longDescription = this.getStringMetadata(opf, 'se:long-description', '*[property="se:long-description"]');

		// Series
		metadata.series = this.getStringMetadata(opf, 'calibre:series', '*[property="belongs-to-collection"]');

		// Series index
		metadata.seriesIndex = this.getStringMetadata(opf, 'calibre:series_index', '*[property="group-position"]');

		if(Array.isArray(metadata.language))
			metadata.language = metadata.language.join(', ');

		this.epubMetadata = metadata;

		return this.epubMetadata;

	}

	this.chaptersHtml = {};
	this.chaptersHtmlQueue = Promise.resolve();

	this.request = async function(path, type = 'xml') {

		path = p.normalize(process.platform === 'win32' ? path.replace(/^file:[/\\]*/, '') : path.replace(/^file:/, ''));
		const data = await fsp.readFile(path, 'utf8');

		if(type === 'xml' || type === 'xhtml')
		{
			const parser = new DOMParser();
			return parser.parseFromString(data, 'application/xml');
		}

		return data;
	}

	this.chapterHtml = async function(index) {

		if(this.chaptersHtml[index]) return this.chaptersHtml[index];

		if(!this.isFoliateBook)
		{
			let section = this.epub.sections[index];

			if(section)
				return this.chaptersHtml[index] = {html: await section.createDocument(), section: section};
			else
				throw new Error('Epub section not exists');
		}

		const load = this.chaptersHtmlQueue.then(async function() {

			if(this.chaptersHtml[index]) return this.chaptersHtml[index];

			const section = this.epub.sections[index];

			if(!section)
				throw new Error('Epub section not exists');

			let html;

			if(this.format === 'fb2')
				html = await section.createDocument();
			else
			{
				const url = await section.load();
				const text = await fetch(url).then(response => response.text());
				html = new DOMParser().parseFromString(text, 'application/xhtml+xml');
			}

			return this.chaptersHtml[index] = {html: html, section: section};

		}.bind(this));

		this.chaptersHtmlQueue = load.catch(function(){});
		return load;

	}

	this.renderFileConfig = ebook.standarSizeConfig;

	this.renderFiles = async function(files, config, callback = false) {

		const self = this;

		await this.openEpub();

		const fixedLayout = this.epub.rendition?.layout === 'pre-paginated';

		let chapters = files.map(async function(file) {

			if(file.name == 'cover.tbn')
			{
				if(self.isFoliateBook)
					await self.writeCover(file.path);
				else
					await fsp.copyFile(self.resourcePath(self.epub.resources.cover.href), file.path);

				if(callback) callback(file.name);

				return null;
			}
			else
			{
				const index = self.getFileIndex(file.name);

				const chapter = await self.chapterHtml(index);
				const dirname = p.dirname(self.resourcePath(chapter.section.id));

				const spine = {
					...(self.epub.resources?.spine?.[index] || {}),
					href: String(chapter.section.id),
				};

				const spineFixed = spine.properties?.includes('rendition:layout-pre-paginated') ?? false;
				const chapterFixedLayout = fixedLayout || spineFixed;

				let pageSpread = '';

				if(spine.properties?.includes('rendition:page-spread-right') || spine.properties?.includes('page-spread-right'))
					pageSpread = 'right';
				else if(spine.properties?.includes('rendition:page-spread-left') || spine.properties?.includes('page-spread-left'))
					pageSpread = 'left';

				return {
					name: file.name,
					path: file.path,
					html: chapter.html,
					basePath: dirname,
					fixedLayout: chapterFixedLayout,
					...(chapterFixedLayout ? self.fixedLayoutSize(chapter.html) : {width: 0, height: 0}),
					pageSpread,
				};
			}

		});

		chapters = await Promise.all(chapters);
		chapters = chapters.filter(chapter => chapter !== null);

		if(chapters.length > 0)
		{
			this.ebook = ebook.load({chapters: chapters});
			this.ebook.resolveKindleLink = this.resolveKindleLink.bind(this);

			try
			{
				await this.ebook.chaptersImages({...this.renderFileConfig, ...{imageWidth: config.width}}, async function(index, image) {

					await fsp.writeFile(chapters[index].path, image.toJPEG(100));
					if(callback) callback(chapters[index].name);

				});
			}
			catch(error)
			{
				console.error(error);
			}
		}

		return;
	}

	this.epubPages = async function(config, callback = false, fromCache = false) {

		const self = this;

		await this.openEpub();
		let files = await this.readEpubFiles();

		const fixedLayout = this.epub.rendition?.layout === 'pre-paginated';
		
		let chapters = files.map(async function(file){

			if(file != 'cover.tbn')
			{
				const index = self.getFileIndex(file);

				const chapter = await self.chapterHtml(index);
				const dirname = p.dirname(self.resourcePath(chapter.section.id));

				const spine = {
					...(self.epub.resources?.spine?.[index] || {}),
					href: String(chapter.section.id),
				};

				const spineFixed = spine.properties?.includes('rendition:layout-pre-paginated') || spine.properties?.includes('layout-pre-paginated') || false;
				const chapterFixedLayout = fixedLayout || spineFixed;

				let pageSpread = '';

				if(spine.properties?.includes('rendition:page-spread-right') || spine.properties?.includes('page-spread-right'))
					pageSpread = 'right';
				else if(spine.properties?.includes('rendition:page-spread-left') || spine.properties?.includes('page-spread-left'))
					pageSpread = 'left';

				return {
					name: file,
					html: chapter.html,
					path: p.join(self.path, file),
					basePath: dirname,
					spine: spine,
					fixedLayout: chapterFixedLayout,
					...(chapterFixedLayout ? self.fixedLayoutSize(chapter.html) : {width: 0, height: 0}),
					pageSpread,
				};
			}

			return null;

		});

		chapters = await Promise.all(chapters);
		chapters = chapters.filter(chapter => chapter !== null);

		if(chapters.length > 0)
		{
			this.ebook = ebook.load({chapters: chapters});
			this.ebook.resolveKindleLink = this.resolveKindleLink.bind(this);

			if(fromCache)
			{
				this.ebook.updateConfig(config);
				this.ebook.chaptersPages = fromCache.chaptersPages;
				this.ebook.chaptersPagesInfo = fromCache.chaptersPagesInfo;
				this.ebook.pages = this.ebook.pagesToOnedimension(this.ebook.chaptersPages);
				this.ebook.toc = fromCache.toc;
				this.ebook.tocPages = fromCache.tocPages;
				this.ebook.hrefPage = fromCache.hrefPage;
				this.ebook.chaptersIdPage = fromCache.chaptersIdPage;

				return {pages: this.ebook.pages, toc: fromCache.toc, landmarks: false};
			}

			let pages = await this.ebook.chaptersToPages(config, async function(index, data) {

				if(callback) callback(chapters[index].name);

			});

			console.time('generateTocWithPages');

			let toc = await this.ebook.generateTocWithPages(this.toc.toc);

			console.timeEnd('generateTocWithPages');

			return {pages: pages, toc: toc, landmarks: false/*landmarks*/};
		}

		return {pages: [], toc: []};
	}

	this.fixedLayoutSize = function(html) {

		if(!html)
			return {width: 1, height: 1};

		const viewport = html.querySelector('meta[name="viewport"]');

		if(viewport)
		{
			const content = viewport.getAttribute('content');
			const width = app.extract(/width=([0-9]+)/, content, 1);
			const height = app.extract(/height=([0-9]+)/, content, 1);

			if(width && height)
			{
				return {
					width: +width || 1,
					height: +height || 1,
				}
			}
		}

		const root = html.documentElement || html;
		const viewbox = html.querySelector('svg[viewBox], svg[viewbox]') || (root.matches?.('svg[viewBox], svg[viewbox]') ? root : false)

		if(viewbox)
		{
			const viewboxValue = viewbox.getAttribute('viewBox');
			const viewboxParts = viewboxValue.split(/\s+/);

			if(viewboxParts.length === 4)
			{
				return {
					width: +viewboxParts[2] || 1,
					height: +viewboxParts[3] || 1,
				}
			}
		}

		return {width: 1, height: 1};
	}

	this.getFileIndex = function(name) {

		let chapter = +extract(/^([0-9]+)/, name, 1);

		return chapter;

	}

	this.removeFileScheme = function(path) {

		if(process.platform == 'win32' || process.platform == 'win64')
			path = path.replace(/^file:\/*/, '');
		else
			path = path.replace(/^file:/, '');

		return p.normalize(path);

	}

	this.destroy = async function() {

		if(this.zip) this.zip.destroy();

		if(this.epub && typeof this.epub.destroy === 'function')
			this.epub.destroy();

		this.epub = false;
		this.ebook = false;
		this.chaptersHtml = {};
		this.chaptersHtmlQueue = Promise.resolve();
		this.coverBlob = false;
		this.epubFiles = false;
		this.epubImages = false;
		this.epubImagesList = false;

	}

}

module.exports = {
	load: function(path, config) {
		return new epub(path, config);
	},
}