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

		return this.zipFiles = await this.zip.read({forceType: 'zip', prefixes: {epub: 'epub-zip'}});

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
				this.opf = p.join(this.realPathZip, this.opf);
			else
				throw new Error('Epub opf file not exists');
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

	this.toc = false;

	this.openEpub = async function() {

		if(this.epub) return;
		if(epubjs === false) epubjs = require('epubjs');

		await this.findContentOpf();

		this.epub = new epubjs.Book(this.opf);

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

		this.toc = await this.epub.loaded.navigation;
		await this.epub.opened;

		this.epubFiles = [];

		if(this.epub.cover)
			this.epubFiles.push('cover.tbn');

		let hrefNames = this.getHrefNames(this.toc.toc);

		let prevName = '';
		let prevNameNum = 2;

		for(let i = 0, len = this.epub.spine.items.length; i < len; i++)
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

			this.epubFiles.push(i+':sortonly - '+name+'.jpg');
		}

		return this.epubFiles;

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

		await this.findContentOpf();

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

		await this.findContentOpf();
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

		return p.normalize(path.replace(/^file:/, ''));

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