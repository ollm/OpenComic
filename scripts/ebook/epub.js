var epubjs = false;
const CONTAINER_PATH = 'META-INF/container.xml';

var epub = function(path, config = {}) {

	this.path = path;
	this.realPath = fileManager.realPath(this.path);
	this.realPathZip = fileManager.realPath(this.path, 0, {epub: 'epub-zip'});
	this.config = config;

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

	this.openEpub = async function() {

		if(this.epub) return;
		if(epubjs === false) epubjs = require('epubjs');

		await this.findContentOpf();

		this.epub = new epubjs.Book(this.opf);
		this.toc = await this.epub.loaded.navigation;

		await this.epub.opened;
	}

	this.getHrefNames = function(items, hrefNames = {}) {

		for(let i = 0, len = items.length; i < len; i++)
		{
			let item = items[i];
			let href = item.href.replace(/[#?].*/, '');

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

		if(this.epub.cover)
			this.epubFiles.push('cover.tbn');

		let hrefNames = this.getHrefNames(this.toc.toc);

		let prevName = '';
		let prevNameNum = 2;
		let len = this.epub.spine.items.length;
		let leadingZeros = Math.max(String(len).length, 4);

		for(let i = 0; i < len; i++)
		{
			let item = this.epub.spine.items[i];

			let name = hrefNames[item.href] || app.capitalize(app.extract(/^(.*?)\.[a-z0-9]+$/, item.idref, 1).trim());

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

		let metadata = await this.epub.loaded.metadata;

		let res = fs.readFileSync(this.opf, 'utf8');

		let parser = new DOMParser();
		let opf = parser.parseFromString(res, 'text/xml');

		// Author
		metadata.author = this.getArrayMetadata(opf, 'dc:creator');

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

		// Contributor
		metadata.contributor = this.getObjectMetadata(opf, 'dc:contributor', ['role']);

		metadata.longDescription = this.getStringMetadata(opf, 'se:long-description', '*[property="se:long-description"]');

		// Series
		metadata.series = this.getStringMetadata(opf, 'calibre:series', '*[property="belongs-to-collection"]');

		// Series index
		metadata.seriesIndex = this.getStringMetadata(opf, 'calibre:series_index', '*[property="group-position"]');

		this.epubMetadata = metadata;

		return this.epubMetadata;

	}

	this.chaptersHtml = {};

	this.chapterHtml = async function(index) {

		if(this.chaptersHtml[index]) return this.chaptersHtml[index];

		let section = this.epub.spine.get(index);

		if(section)
			return this.chaptersHtml[index] = {html: await section.load(), section: section};
		else
			throw new Error('Epub section not exists');

	}

	this.renderFileConfig = ebook.standarSizeConfig;

	this.renderFiles = async function(files, config, callback = false) {

		await this.openEpub();

		let chapters = [];

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i];

			if(file.name == 'cover.tbn')
			{
				await fsp.copyFile(this.removeFileScheme(this.epub.cover), file.path);
				if(callback) callback(file.name);
			}
			else
			{
				let index = this.getFileIndex(file.name);
				let chapter = await this.chapterHtml(index);

				let dirname = p.dirname(this.removeFileScheme(chapter.section.url));

				chapters.push({
					name: file.name,
					path: file.path,
					html: chapter.html,
					basePath: dirname,
				});
			}
		}

		if(chapters.length > 0)
		{
			this.ebook = ebook.load({chapters: chapters});

			await this.ebook.chaptersImages({...this.renderFileConfig, ...{imageWidth: config.width}}, async function(index, image) {

				await fsp.writeFile(chapters[index].path, image.toJPEG(100));
				if(callback) callback(chapters[index].name);

			});
		}

		return;
	}

	this.epubPages = async function(config, callback = false) {

		await this.openEpub();
		let files = await this.readEpubFiles();

		let chapters = [];

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i];

			if(file != 'cover.tbn')
			{
				let index = this.getFileIndex(file);

				let chapter = await this.chapterHtml(index);
				let dirname = p.dirname(this.removeFileScheme(chapter.section.url));

				chapters.push({
					name: file,
					html: chapter.html,
					path: p.join(this.path, file),
					basePath: dirname,
					spine: this.epub.spine.items[index] || {},
				});
			}
		}

		if(chapters.length > 0)
		{
			this.ebook = ebook.load({chapters: chapters});
			let pages = await this.ebook.chaptersToPages(config, async function(index, data) {

				if(callback) callback(chapters[index].name);

			});

			let res = fs.readFileSync(this.opf, 'utf8');
			let parser = new DOMParser();
			let opf = parser.parseFromString(res, 'text/xml');

			console.time('generateTocWithPages');

			let toc = this.ebook.generateTocWithPages(this.toc.toc);

			console.timeEnd('generateTocWithPages');

			return {pages: pages, toc: toc, landmarks: false/*landmarks*/};
		}

		return {pages: [], tox: []};
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

	}

}




module.exports = {
	load: function(path, config) {
		return new epub(path, config);
	},
}