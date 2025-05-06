const requestFileAccess = require(p.join(appDir, 'scripts/file-manager/request-file-access.js'));

var unzip = false, unrar = false, un7z = false, bin7z = false, untar = false/*, unpdf = false*/, fastXmlParser = false, fileType = false, Minimatch = false;

var file = function(path, _config = false) {

	this.path = path;

	this.files = [];

	this.isCompressed = false;
	this.isFolder = false;

	this.config = {
		cache: true, // Compressed
		sort: true,
		filtered: true,
		sha: true,
		only: false,
	};

	if(_config) this.config = {...this.config, ..._config};

	this.updateConfig = function(config) {

		for(let key in config)
		{
			this.config[key] = config[key];
		}

	}

	this.getType = function() {

		if(fs.existsSync(path))
		{
			if(inArray(fileExtension(path), compressedExtensions.all))
				this.isCompressed = true;
			else if(fs.statSync(path).isDirectory())
				this.isFolder = true;
		}

		return {folder: this.isFolder, compressed: this.isCompressed};
	}

	this.alreadyRead = false;

	this.read = async function(config = {}, path = false) {

		path = path || this.path;
		let _realPath = realPath(path, -1);

		this.updateConfig(config);

		let files = [];

		if(isServer(path))
		{
			if(!containsCompressed(path))
				files = await this.readServer(path, _realPath);
			else
				files = await this.readServerCompressed(path, _realPath);
		}
		else if(containsCompressed(path))
		{
			if(inArray(fileExtension(path), compressedExtensions.all))
				files = await this.readCompressed(path, _realPath);
			else
				files = await this.readInsideCompressed(path, _realPath);
		}
		else
		{
			if(inArray(fileExtension(path), compressedExtensions.all))
				files = await this.readCompressed(path, _realPath);
			else if(fs.statSync(_realPath).isDirectory())
				files = await this.readDir(path, _realPath);
		}

		if(this.config.sort)
			files = sort(files);

		if(this.config.only && typeof this.config.only === 'number')
			files = this.only(files);

		if(this.config.sha)
			files = this.sha(files);

		if(this.path === path)
		{
			this.alreadyRead = true;
			this.files = files;
		}

		return this.config.filtered ? filtered(files, this.config.specialFiles) : files;
	}

	this.readDir = function(path = false, _realPath = false) {

		path = path || this.path;
		_realPath = _realPath || realPath(path, -1);

		let _this = this;

		this.macosStartAccessingSecurityScopedResource(_realPath);

		return fsp.readdir(_realPath, {withFileTypes: !_this.config.fastRead}).then(function(_files){

			let files = [];

			if(_files)
			{
				for(let i = 0, len = _files.length; i < len; i++)
				{
					let name = _this.config.fastRead ? _files[i] : _files[i].name;

					let filePath = fastJoin(path, name);
					let retrunPath = filePath;

					if(!_this.config.fastRead && _files[i].isDirectory())
						files.push({name: name, path: retrunPath, folder: true, compressed: false});
					else if(inArray(fileExtension(filePath), compressedExtensions.all))
						files.push({name: name, path: retrunPath, folder: false, compressed: true});
					else
						files.push({name: name, path: retrunPath, folder: false, compressed: false});
				}
			}

			return files;

		});

	}

	this.compressedOpened = {};

	this.cleanCompressedOpened = function() {

		let compressed = [];

		for(let path in this.compressedOpened)
		{
			compressed.push({path: path, lastUsage: this.compressedOpened[path].lastUsage});
		}

		compressed.sort(function(a, b) {

			if(a.lastUsage === b.lastUsage)
				return 0;

			return a.lastUsage < b.lastUsage ? 1 : -1;
		});

		let len = compressed.length;

		if(len > 10) // Max only 10 files open at the same time
		{
			for(let i = 10; i < len; i++)
			{
				let path = compressed[i].path;
				this.compressedOpened[path].compressed.destroy();
				delete this.compressedOpened[path];
			}
		}
	}

	this.openCompressed = function(path, _realPath = false, mtime = false) {

		if(this.config.prefixes)
			_realPath = _realPath || realPath(path, -1, this.config.prefixes);
		else
			_realPath = _realPath || realPath(path, -1);

		mtime = mtime || fs.statSync(firstCompressedFileRealPath(path)).mtime.getTime();

		let now = Date.now();

		if(!this.compressedOpened[path] || this.compressedOpened[path].mtimeMainCompressed != mtime) // Check if the Compressed file has been modified since the last time it was opened
		{
			this.compressedOpened[path] = {
				lastUsage: now,
				mtimeMainCompressed: mtime,
				compressed: fileManager.fileCompressed(path, _realPath, this.config.forceType, this.config.prefixes),
			};
		}
		else
		{
			this.compressedOpened[path].lastUsage = now;
		}

		this.cleanCompressedOpened();

		if(this.config.progress)
			this.compressedOpened[path].compressed.progress = this.config.progress;

		if(this.config.fromThumbnailsGeneration)
			this.compressedOpened[path].compressed.config.fromThumbnailsGeneration = true;

		return this.compressedOpened[path].compressed;

	}

	this.readCompressed = async function(path = false, _realPath = false) {

		path = path || this.path;
		_realPath = _realPath || realPath(path, -1);

		let _isServer = isServer(path);

		let mtime = !_isServer ? fs.statSync(firstCompressedFile(path)).mtime.getTime() : 1;
		let compressed = this.openCompressed(path, _realPath, mtime);

		let json = cache.readJson(compressed.cacheFile);

		if(this.config.cache)
		{
			if(json)
			{
				if(json.mtime == mtime || _isServer)
				{
					if(json.error && !this.config.fromThumbnailsGeneration && !this.config.subtask)
						dom.compressedError({message: json.error}, false, sha1(this.path));

					return json.files;
				}

				if(fs.existsSync(compressed.tmp))
					await fsp.rmdir(compressed.tmp, {recursive: true});
			}
		}

		if(this.config.cacheOnly)
			throw new Error('notCacheOnly');

		await this.extractIfInsideAnotherCompressed(path, _realPath);

		let files = await compressed.read(this.config);
		let metadata = await compressed.readMetadata(this.config);
		this.saveCompressedMetadata(path, metadata);

		if(metadata.poster)
			files = this.setPosterFromMetadata(files, metadata.poster);

		if(!json || json.mtime != mtime)
			cache.writeJson(compressed.cacheFile, {mtime: mtime, files: files, metadata: metadata});

		return files;

	}

	this.readInsideCompressed = async function(path = false, _realPath = false) {

		path = path || this.path;
		_realPath = _realPath || realPath(path, -1);

		let lastCompressed = lastCompressedFile(path);

		let files = [];

		if(lastCompressed)
		{
			let _files = await this.readCompressed(lastCompressed);
			files = this.readFromFilesList(_files, path, lastCompressed);
		}

		return files;

	}

	this.serverHasCache = function(path) {

		path = serverClient.fixPath(path || this.path);
		let sha = sha1(path);
		let cacheFile = (cache.zstd !== false) ? 'server-files-'+sha+'.json.zstd' : 'server-files-'+sha+'.json';

		return cache.existsFile(cacheFile);

	}

	this.readServer = async function(path = false, _realPath = false) {

		path = serverClient.fixPath(path || this.path);
		_realPath = _realPath || realPath(path, -1);

		let sha = sha1(path);
		let cacheFile = 'server-files-'+sha+'.json';

		if(this.config.cache && (this.config.cacheOnly || this.config.cacheServer || serverInOfflineMode))
		{
			let json = cache.readJson(cacheFile);

			if(json)
				return json.files;
		}

		if(serverInOfflineMode)
			return [];

		if(this.config.cacheOnly)
			throw new Error('notCacheOnly');

		let files = await serverClient.read(path);

		return files;

	}

	this.readServerCompressed = async function(path = false, _realPath = false) {

		path = serverClient.fixPath(path || this.path);
		_realPath = _realPath || realPath(path, -1);

		if(inArray(fileExtension(path), compressedExtensions.all))
			return this._readServerCompressed(path, _realPath);
		else
			return this.readServerInsideCompressed(path, _realPath);
	}

	this._readServerCompressed = async function(path = false, _realPath = false) {

		path = serverClient.fixPath(path || this.path);
		_realPath = _realPath || realPath(path, -1);

		if(this.config.cache && (this.config.cacheOnly || this.config.cacheServer || serverInOfflineMode))
		{
			let files = false;

			const cacheOnly = this.config.cacheOnly;
			this.updateConfig({cacheOnly: true});

			try
			{
				files = await this.readCompressed(path, _realPath);
			}
			catch(error)
			{
				if(!error.message || !/notCacheOnly/.test(error.message))
					throw new Error(error);
			}

			this.updateConfig({cacheOnly: cacheOnly});

			if(this.config.cacheOnly)
				throw new Error('notCacheOnly');

			if(files !== false)
				return files; 
		}

		let firstCompressed = firstCompressedFile(path, 0);

		if(firstCompressed)
		{
			if(!serverClient.existsSync(realPath(firstCompressed, -1)))
			{
				// Download file to tmp
				let file = await serverClient.download(path, {only: [firstCompressed]});

				if(this.config.fromThumbnailsGeneration)
					downloadedCompressedFile(firstCompressed);
			}
		}

		return this.readCompressed(path, _realPath);

	}

	this.readServerInsideCompressed = async function(path = false, _realPath = false) {

		path = path || this.path;
		_realPath = _realPath || realPath(path, -1);

		if(this.config.cache && (this.config.cacheOnly || this.config.cacheServer || serverInOfflineMode))
		{
			let files = false;

			const cacheOnly = this.config.cacheOnly;
			this.updateConfig({cacheOnly: true});

			try
			{
				files = await this.readInsideCompressed(path, _realPath);
			}
			catch(error)
			{
				if(!error.message || !/notCacheOnly/.test(error.message))
					throw new Error(error);
			}

			this.updateConfig({cacheOnly: cacheOnly});

			if(this.config.cacheOnly)
				throw new Error('notCacheOnly');

			if(files !== false)
				return files; 
		}

		let firstCompressed = firstCompressedFile(path, 0);

		if(firstCompressed)
		{
			if(!serverClient.existsSync(realPath(firstCompressed, -1)))
			{
				// Download file to tmp
				let file = await serverClient.download(path, {only: [firstCompressed]});

				if(this.config.fromThumbnailsGeneration)
					downloadedCompressedFile(firstCompressed);
			}
		}

		return this.readInsideCompressed(path, _realPath);

	}

	// If compressed is inside other compressed, decompress here others compressed files (Only compresses files ignoring others files)
	this.extractIfInsideAnotherCompressed = async function(path = false, _realPath = false) {

		path = path || this.path;
		_realPath = _realPath || realPath(path, -1);

		if(_realPath !== path && !fs.existsSync(_realPath))
		{
			let compressedFiles = allCompressedFiles(path);

			for(let i = 0, len = compressedFiles.length - 1; i < len; i++)
			{
				let path = compressedFiles[i];
				let _realPath = realPath(path, -1);
				let _realPathNext = realPath(compressedFiles[i+1], -1);
				let only = removePathPart(compressedFiles[i+1], path);

				if(!fs.existsSync(_realPathNext))
				{
					let toDecompress = this.openCompressed(path, _realPath);
					await toDecompress.extract({only: [only]});
				}
			}
		}

		return;
	}

	this._images = async function(num, files, from = false, fromReached = false, poster = false, deep = 0) {

		let images = [];
		let imagesNum = 0;

		let reverse = num < 0 ? true : false;
		let len = files.length;

		let stop = len == 0 ? true : false;
		let i = reverse ? len - 1 : 0;

		let index = 0;

		while(!stop)
		{
			let file = files[i];
			let image = false;

			if(!from || fromReached || new RegExp('^\s*'+pregQuote(file.path)).test(from))
			{
				if(file.folder || file.compressed)
				{
					let _poster = false;
					let _files = file.files || await this.read({cacheServer: true}, file.path);

					if(poster)
					{
						_poster = this._poster(files, file.path);
						if(!_poster) _poster = this._poster(_files, file.path, true);
					}

					if(_poster)
					{
						image = _poster.path;
					}
					else
					{
						image = await this._images((reverse ? -1 : 1), _files, from, fromReached, poster, deep + 1);
						fromReached = image.fromReached;
						image = image.images[0] || false;
					}
				}
				else if(inArray(mime.getType(file.name), compatibleMime))
				{
					image = file.path;
				}

				if(image && (!from || fromReached))
				{
					images.push(image);
					imagesNum++;

					if(imagesNum == Math.abs(num))
						break;
				}
			}

			if(file.path === from)
				fromReached = true;

			if(reverse)
			{
				i--;
				stop = i < 0 ? true : false;
			}
			else
			{
				i++;
				stop = i >= len ? true : false;
			}

			if(this.config.cacheOnly && index > 16 && deep > 0)
				throw new Error('notCacheOnly');

			index++;
		}

		return {images: images, fromReached: fromReached};
	}

	// Get the first images of a folder/compressed
	this.images = async function(only = 1, from = false, poster = false, _files = false, _path = false, _isCompressed = false) {

		if(poster) this.updateConfig({specialFiles: true});
		if(!this.alreadyRead) await this.read({cacheServer: true});

		_files = _files || this.files;
		_path = _path || this.path;

		_isCompressed = _isCompressed || isCompressed(_path);

		if(config.ignoreSingleFoldersLibrary && _files.length == 1 && (_files[0].folder || _files[0].compressed))
		{
			const file = _files[0];
			_files = file.files || await this.read({cacheServer: true}, file.path);

			return this.images(only, from, poster, _files, file.path, _isCompressed);
		}

		if(poster)
		{
			let _poster = await this.poster();
			if(!_poster) _poster = this._poster(_files, _path, true, _isCompressed);

			if(_poster) return _poster;
		}

		let images = (await this._images(only, _files, from, false, poster)).images;

		for(let i = 0, len = images.length; i < len; i++)
		{
			images[i] = {name: p.basename(images[i]), path: images[i], folder: false, compressed: false};
		}

		if(this.config.sha)
			images = this.sha(images);

		return (Math.abs(only) == 1) ? (images[0] || false) : images;
	}

	this._poster = function(files, path = false, inside = false, _isCompressed = false) {

		path = path || this.path;

		let name = p.parse(path).name;

		let regex = new RegExp('^(?:[\-\s0-9+])?(?:'+pregQuote(name)+'(?:[_-]?(?:cover|default|folder|series|poster|thumbnail))?'+(inside ? '|cover|default|folder|series|poster|thumbnail' : '')+')(?:[\-\s0-9+])?\.[a-z0-9]+$');
		let poster = false;

		let len = files.length
		for(let i = 0; i < len; i++)
		{
			let file = files[i];

			if(!file.folder && !file.compressed && (regex.test(file.name) || file.poster))
			{
				if(!poster && inArray(mime.getType(file.path), compatibleMime))
				{
					file.sha = sha1(file.path);
					poster = file;
				}
				else if(inArray(app.extname(file.path), compatibleSpecialExtensions)) // prioritize tbn poster
				{
					file.sha = sha1(file.path);
					poster = file;

					break;
				}
			}
		}

		if(!poster && inside && len && (config.useTheFirstImageAsPosterInFolders || config.useTheFirstImageAsPosterInFiles))
		{
			_isCompressed = _isCompressed || isCompressed(path);

			if((!_isCompressed && config.useTheFirstImageAsPosterInFolders) || (_isCompressed && config.useTheFirstImageAsPosterInFiles))
			{
				for(let i = 0; i < len; i++)
				{
					let file = files[i];

					if(!file.folder && !file.compressed)
					{
						if(inArray(mime.getType(file.path), compatibleMime))
						{
							file.sha = sha1(file.path);
							file.fromFirstImageAsPoster = true;
							poster = file;

							break;
						}
					}
					else
					{
						break;
					}
				}
			}
		}

		return poster;
	}

	this.poster = async function() {

		let dirname = p.dirname(this.path);

		try
		{
			let file = fileManager.file(dirname);
			file.updateConfig({fastRead: true, specialFiles: true, sha: false, cacheServer: true});
			let files = await file.read();

			let poster = this._poster(files);

			return poster;
		}
		catch(error)
		{
			console.error(error);

			if(!macosMAS)
				throw new Error(error);
			//else
			//	fileManager.requestFileAccess.check(this.path, error);
		}

		return false;
	}

	this.setPosterFromMetadata = function(files, poster) {

		for(let i = 0, len = files.length; i < len; i++)
		{
			if(files[i].name == poster)
			{
				files[i].poster = true;

				break;
			}
		}

		return files;

	}

	this.saveCompressedMetadata = function(path, metadata) {

		if(metadata.title || metadata.author)
		{
			storage.setVar('compressedMetadata', path, {
				title: metadata.title,
				author: metadata.author,
			});
		}

	}

	this.sha = function(files) {

		for(let i = 0, len = files.length; i < len; i++)
		{
			files[i].sha = sha1(files[i].path);
		}

		return files;
	}

	this.only = function(files) {

		let only = this.config.only;
		let _files = [];

		if(only >= 0)
		{
			let len = files.length;
			let limit = only;
			if(limit > len) limit = len;

			for(let i = 0; i < limit; i++)
			{
				_files.push(files[i]);
			}
		}
		else
		{
			let len = files.length;
			let limit = len + only;
			if(limit < 0) limit = 0;

			for(let i = len - 1; i >= limit; i--)
			{
				_files.push(files[i]);
			}
		}

		return _files;
	}

	this._readFromFilesList = function(segments, files) {

		let segment = segments.shift();
		let remaining = segments.length;

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i];

			if(file.name == segment)
			{
				if(remaining == 0)
					return file.files;
				else
					return this._readFromFilesList(segments, file.files);
			}
		}

	}

	this.readFromFilesList = function(files, path, lastCompressed) {

		let segments = splitPath(removePathPart(path, lastCompressed));

		return this._readFromFilesList(segments, files);

	}

	// Makes the files available, extracting them from the respective compressed files if necessary
	this.makeAvailable = async function(files, callbackWhenFileAvailable = false, forceCheck = false, fromThumbnailsGeneration = false) {

		let filesToDecompress = false, filesToDecompressNum = 0;

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i];

			let _path = realPath(file.path, -1, this.config.prefixes);

			if((!forceCheck || _path === file.path) && fs.existsSync(_path))
			{
				if(callbackWhenFileAvailable) callbackWhenFileAvailable(file);
			}
			else
			{
				if(!filesToDecompress) filesToDecompress = {};
			
				let compressedFile = lastCompressedFile(file.path);

				if(!compressedFile && isServer(file.path))
				{
					compressedFile = serverClient.getTypeAdress(file.path);

					if(!filesToDecompress[compressedFile]) filesToDecompress[compressedFile] = [];
					filesToDecompress[compressedFile].push(file.path);
				}
				else
				{
					if(!filesToDecompress[compressedFile]) filesToDecompress[compressedFile] = [];
					filesToDecompress[compressedFile].push(removePathPart(file.path, compressedFile));
				}

				filesToDecompressNum++;
			}

			if(_path !== file.path) // If it is different it is because it is not a compressed file
				fileManager.setTmpUsage(_path);
		}

		if(filesToDecompress)
		{
			let _this = this;

			for(let compressedFile in filesToDecompress)
			{
				if(isServer(compressedFile))
				{
					if(containsCompressed(compressedFile, 0, false))
					{
						let firstCompressed = firstCompressedFile(compressedFile, 0, false);

						// Download file to tmp
						let file = await serverClient.download(compressedFile, {only: [firstCompressed]});

						let compressed = this.openCompressed(compressedFile);

						await this.extractIfInsideAnotherCompressed(compressedFile);

						await compressed.extract({only: filesToDecompress[compressedFile]}, function(file) {

							if(_this.config.sha) file.sha = sha1(file.path);
							if(callbackWhenFileAvailable) callbackWhenFileAvailable(file);

						});

						if(fromThumbnailsGeneration || _this.config.fromThumbnailsGeneration)
							downloadedCompressedFile(firstCompressed);
					}
					else
					{
						await serverClient.download(compressedFile, {only: filesToDecompress[compressedFile]}, function(file) {

							if(_this.config.sha) file.sha = sha1(file.path);
							if(callbackWhenFileAvailable) callbackWhenFileAvailable(file);

						});
					}
				}
				else
				{
					let compressed = this.openCompressed(compressedFile);

					await this.extractIfInsideAnotherCompressed(compressedFile);

					await compressed.extract({only: filesToDecompress[compressedFile]}, function(file) {

						if(_this.config.sha) file.sha = sha1(file.path);
						if(callbackWhenFileAvailable) callbackWhenFileAvailable(file);

					});
				}
			}
		}

		return filesToDecompressNum;
	}

	this.macosScopedResources = [];

	this.macosStartAccessingSecurityScopedResource = function(path) {

		if(macosMAS)
		{
			let securityScopedBookmarks = storage.get('securityScopedBookmarks');
			let segments = splitPath(path);

			if(!segments[0])
				segments[0] = p.sep;

			for(let i = 1, len = segments.length; i < len; i++)
			{
				let _path = p.join(...segments);
				let bookmark = securityScopedBookmarks[_path] || false;

				if(bookmark)
				{
					try
					{
						this.macosScopedResources.push(electronRemote.app.startAccessingSecurityScopedResource(bookmark));
						break;
					}
					catch {}
				}

				segments.pop();
			}
		}
	}

	this.destroy = function() {

		for(let path in this.compressedOpened)
		{
			this.compressedOpened[path].compressed.destroy();
			delete this.compressedOpened[path];
		}

		// Stop accessing security scoped resources
		for(let i = 0, len = this.macosScopedResources.length; i < len; i++)
		{
			this.macosScopedResources[i]();
		}

		this.macosScopedResources = [];

	};
}

// Compressed files
var fileCompressed = function(path, _realPath = false, forceType = false, prefixes = false) {

	this.path = path;
	this.realPath = _realPath || realPath(path, -1);
	this.forceType = forceType;
	this.prefixes = prefixes;
	this.virtualPath = this.path;
	this.sha = sha1(p.normalize(path));

	if(prefixes)
	{
		let extension = fileExtension(path);

		if(extension)
		{
			for(let ext in prefixes)
			{
				if(inArray(extension, compressedExtensions[ext]))
				{
					this.sha = prefixes[ext]+'-'+this.sha;

					break;
				}
			}
		}
	}

	this.cacheFile = 'compressed-files-'+this.sha+'.json';
	this.tmp = p.join(tempFolder, this.sha);
	this.tmpPartialExtraction = p.join(this.tmp, this.sha+'-opencomic-partial-extraction.txt');
	this.tmpIsVector = p.join(this.tmp, this.sha+'-opencomic-is-vector.txt');

	this.contentRightIndex = template.contentRightIndex();

	this.fullExtracted = false;

	this.files = false;
	this.filesStatus = {};
	this.metadata = false;

	this.config = this._config = {
		// only: false,
		cache: true,
		//width: window.devicePixelRatio * (handlebarsContext.page.viewModuleSize || 150), // Vector width
		width: window.devicePixelRatio * 300, // Vector width
		height: false, // Vector height
		force: false, // Forces the extraction even if the file exists
	};

	this._features = {
		zip: {
			read: true,
			single: true,
			vector: false,
			canvas: false,
			html: false,
			ebook: false,
			progress: true,
		},
		'7z': {
			read: true,
			single: true,
			vector: false,
			canvas: false,
			html: false,
			ebook: false,
			progress: true,
		},
		rar: {
			read: true,
			single: true,
			vector: false,
			canvas: false,
			html: false,
			ebook: false,
			progress: true,
		},
		tar: {
			read: true,
			single: true,
			vector: false,
			canvas: false,
			html: false,
			ebook: false,
			progress: false,
		},
		pdf: {
			read: true,
			single: true,
			vector: true,
			canvas: true,
			html: true,
			ebook: false,
			progress: true,
		},
		epub: {
			read: true,
			single: true,
			vector: true,
			canvas: false,
			html: true,
			ebook: true,
			progress: true,
		},
	};

	this.features = false;

	this.updateConfigOnly = function(_only) {

		if(!_only)
			return this.config.only = this.config._only = _only;

		let only = {};

		for(let i = 0, len = _only.length; i < len; i++)
		{
			only[_only[i]] = true;
		}

		this.config._only = _only;
		return this.config.only = only;

	}

	this.updateConfig = function(config) {

		for(let key in this._config)
		{
			if(typeof config[key] === 'undefined')
				config[key] = this._config[key];
		}

		this.config = config;

		if(config.only)
			this.updateConfigOnly(config.only);

	}

	this.getFeatures = function(force = false) {

		if(this.features && !force) return this.features;

		force = force || this.forceType;

		if(!force)
		{
			let ext = fileExtension(this.path);

			if(inArray(ext, compressedExtensions.zip))
				force = 'zip';
			else if(inArray(ext, compressedExtensions['7z']))
				force = '7z';
			else if(inArray(ext, compressedExtensions.rar))
				force = 'rar';
			else if(inArray(ext, compressedExtensions.tar))
				force = 'tar';
			else if(inArray(ext, compressedExtensions.pdf))
				force = 'pdf';
			else if(inArray(ext, compressedExtensions.epub))
				force = 'epub';
		}

		this.features = this._features[force];
		this.features.ext = force;
		this.features[force] = true;

		return this.features;

	}

	this.setTmpUsage = function() {

		if(this.path !== this.realPath)
			fileManager.setTmpUsage(this.realPath);

	}

	this.saveErrorToCache = function(error) {

		let json = cache.readJson(this.cacheFile);

		if(json)
		{
			json.error = (error.detail || error.message);
			cache.writeJson(this.cacheFile, json);
		}

	}

	this.detectFileTypeFromBinary = async function() {

		if(fileType === false) fileType = require('file-type').fromBuffer;

		let type;

		try
		{
			const buffer = await readChunk(this.realPath, {length: 4100});
			type = await fileType(buffer);
		}
		catch(error)
		{
			fileManager.requestFileAccess.check(false, error);
			throw new Error(error);
		}

		if(inArray(type.ext, compressedExtensions.all) && type.ext != 'epub')
			return type.ext;

		return this.features.ext;

	}

	this.read = async function(config = {}) {

		this.updateConfig(config);
		this.getFeatures();

		if(this.config.cache && this.files)
			return this.files;

		return this.readCurrent();
	}

	this.readCurrent = function() {

		this.setTmpUsage();

		console.log('readCompressed... '+this.path);

		if(this.features.zip)
			return this.read7z(); // return this.readZip();
		else if(this.features['7z'])
			return this.read7z();
		else if(this.features.rar)
			return this.readRar();
		else if(this.features.tar)
			return this.readTar();
		else if(this.features.pdf)
			return this.readPdf();
		else if(this.features.epub)
			return this.readEpub();

		return false;
	}

	this.readMetadata = async function(config = {}) {

		this.updateConfig(config);
		this.getFeatures();

		if(this.config.cache && this.metadata)
			return this.metadata;

		return this.readCurrentMetadata();
	}

	this.readCurrentMetadata = function() {

		if(this.features.zip || this.features['7z'] || this.features.rar || this.features.tar)
			return this.readCompressedMetadata();
		else if(this.features.pdf)
			return this.readPdfMetadata();
		else if(this.features.epub)
			return this.readEpubMetadata();

		return {};
	}

	this.readCompressedMetadata = async function(files = false, compressedPath = '') {

		files = files || await this.read();
		let len = files.length;

		if(/*config.ignoreSingleFoldersLibrary && */len === 1 && files[0].folder && files[0].files && files[0].files.length)
			return this.readCompressedMetadata(files[0].files, p.join(compressedPath, files[0].name));

		let comicInfoFile = false;

		for(let i = 0; i < len; i++)
		{
			if(files[i].name == 'ComicInfo.xml')
			{
				comicInfoFile = files[i];

				break;
			}
		}

		if(comicInfoFile)
		{
			if(fastXmlParser === false)
			{
				fastXmlParser = require('fast-xml-parser').XMLParser;
				fastXmlParser = new fastXmlParser({ignoreAttributes: false});
			}

			if(compressedPath !== false && lastCompressedFile(this.path) === lastCompressedFile(comicInfoFile.path))
			{
				const only = this.config.only;
				await this.extract({only: [p.join(compressedPath, comicInfoFile.name)]});
				this.updateConfig({only: only});
			}
			else
			{
				const file = fileManager.file(this.path);
				await file.makeAvailable([{path: comicInfoFile.path}]);
				file.destroy();
			}

			let xml = await fsp.readFile(realPath(comicInfoFile.path, -1));
			let metadata = fastXmlParser.parse(xml);

			let comicInfo = metadata.ComicInfo || {};
			let poster = false;

			if(comicInfo.Pages && comicInfo.Pages.Page)
			{
				let _poster = false;

				for(let i = 0, len = comicInfo.Pages.Page.length; i < len; i++)
				{
					let page = comicInfo.Pages.Page[i];

					if(page['@_Type'] == 'FrontCover')
					{
						_poster = +page['@_Image'];

						break;
					}
					else if(page['@_Type'] == 'InnerCover')
					{
						_poster = +page['@_Image'];
					}
				}

				if(_poster !== false)
				{
					let index = 0;

					for(let i = 0, len = files.length; i < len; i++)
					{
						let file = files[i];

						if(!file.folder && !file.compressed && inArray(mime.getType(file.path), compatibleMime))
						{
							if(index === _poster)
							{
								poster = file.name;
								file.poster = true;

								break;
							}

							index++;
						}
					}

				}
			}

			for(let key in comicInfo)
			{
				if(comicInfo[key] instanceof Object && comicInfo[key]['#text'])
				{
					comicInfo[key] = comicInfo[key]['#text'];
				}
			}

			// https://anansi-project.github.io/docs/category/schemas
			return {
				title: comicInfo.Title || '',
				series: comicInfo.Series || '',
				localizedSeries: comicInfo.LocalizedSeries || '',
				seriesGroup: comicInfo.SeriesGroup || '',

				poster: poster,

				bookNumber: comicInfo.Number || 0,
				bookTotal: comicInfo.Count || 0,
				volume: comicInfo.Volume || 0,

				storyArc: comicInfo.StoryArc || '',
				storyArcNumber: comicInfo.StoryArcNumber || 0,

				alternateSeries: comicInfo.AlternateSeries || 0,
				alternateBookNumber: comicInfo.AlternateNumber || 0,
				alternateBookTotal: comicInfo.AlternateCount || 0,

				manga: (comicInfo.Manga == 'Yes' || comicInfo.Manga == 'YesAndRightToLeft') ? true : (comicInfo.Manga == 'No' ? false : null),

				author: comicInfo.Writer || '',
				writer: comicInfo.Writer || '',
				penciller: comicInfo.Penciller || '',
				inker: comicInfo.Inker || '',
				colorist: comicInfo.Colorist || '',
				letterer: comicInfo.Letterer || '',
				coverArtist: comicInfo.CoverArtist || '',
				editor: comicInfo.Editor || '',
				translator: comicInfo.Translator || '',
				publisher: comicInfo.Publisher || '',
				imprint: comicInfo.Imprint || '',

				ageRating: comicInfo.AgeRating || '',
				genre: comicInfo.Genre || '',
				tags: comicInfo.Tags || '',
				web: comicInfo.Web || '',
				description: comicInfo.Summary || '',

				characters: comicInfo.Characters || '',
				teams: comicInfo.Teams || '',
				locations: comicInfo.Locations || '',
				mainCharacterOrTeam: comicInfo.MainCharacterOrTeam || '',

				releaseDate: (comicInfo.Year && comicInfo.Month && comicInfo.Day) ? comicInfo.Year+'-'+comicInfo.Month+'-'+comicInfo.Day : '',
				year: comicInfo.Year || 0,
				month: comicInfo.Month || 0,
				day: comicInfo.Day || 0,

				language: comicInfo.LanguageISO || '',
				format: comicInfo.Format || '',
				scanInformation: comicInfo.ScanInformation || '',
				notes: comicInfo.Notes || '',
				GTIN: comicInfo.GTIN || '',

				metadata: metadata,
			};
		}

		return {};

	}

	this.readIfTypeFromBinaryIsDifferent = async function(error = false) {

		let _this = this;

		return new Promise(async function(resolve, reject) {

			let type = await _this.detectFileTypeFromBinary();

			if(type && type !== _this.features.ext)
			{
				_this.getFeatures(type);
				resolve(_this.readCurrent());
			}
			else
			{
				reject(error);
			}

		});

	}

	this.callbackWhenFileExtracted = false;

	this.extract = async function(config = {}, callbackWhenFileExtracted = false) {

		this.updateConfig(config);
		this.getFeatures();

		this.callbackWhenFileExtracted = callbackWhenFileExtracted;

		if(!fs.existsSync(this.tmp))
		{
			fs.mkdirSync(this.tmp);

			if(this.config.only)
				fs.writeFileSync(this.tmpPartialExtraction, '');
		}
		else if(!this.config.only)
		{
			if(fs.existsSync(this.tmpPartialExtraction))
				fs.unlinkSync(this.tmpPartialExtraction);
		}

		if(this.features.vector && !fs.existsSync(this.tmpIsVector))
			fs.writeFileSync(this.tmpIsVector, window.devicePixelRatio.toString());

		if(!this.config.force)
		{
			let only = await this.checkIfAlreadyExtracted();

			if(only === null)
				return true;
			else
				this.updateConfigOnly(only);
		}

		if(this.features.progress)
			this.setProgress(0);

		return this.extractCurrent();
	}

	this.extractCurrent = function() {

		this.setTmpUsage();

		console.log('extractCompressed...'+(this.config._only ? ' ('+this.config._only.length+' files)' : '')+' '+this.path);

		if(this.features.zip)
			return this.extract7z(); // return this.extractZip();
		else if(this.features['7z'])
			return this.extract7z();
		else if(this.features.rar)
			return this.extractRar();
		else if(this.features.tar)
			return this.extractTar();
		else if(this.features.pdf)
			return this.extractPdf();
		else if(this.features.epub)
			return this.extractEpub();

		return false;
	}

	this.extractIfTypeFromBinaryIsDifferent = async function(error = false) {

		let _this = this;

		return new Promise(async function(resolve, reject) {

			let type = await _this.detectFileTypeFromBinary();

			if(type && type !== _this.features.ext)
			{
				_this.getFeatures(type);
				resolve(_this.extractCurrent());
			}
			else
			{
				reject(error);
			}

		});

	}

	this.checkIfAlreadyExtracted = async function() {

		if(this.config.only)
		{
			let only = [];

			for(let path in this.config.only)
			{
				const _path = p.join(this.path, path);
				const globalExtracting = getGlobalExtracting(_path);

				if(globalExtracting || fs.existsSync(p.join(this.tmp, path)))
				{
					if(globalExtracting) await globalExtracting.promise;
					this.whenExtractFile(_path);
				}
				else
				{
					setGlobalExtracting(_path);
					only.push(path);
				}
			}

			if(!only.length)
				return null;
			else
				return only;
		}
		else
		{
			try
			{
				let file = fileManager.file(this.path);
				let files = await file.read({cacheOnly: true});
				files = this.filesToOnedimension(files);

				let only = [];
				let someIsExtracted = false;

				for(let i = 0, len = files.length; i < len; i++)
				{
					let file = files[i];

					const _path = p.join(this.path, file.pathInCompressed);
					const globalExtracting = getGlobalExtracting(_path);

					if(globalExtracting || fs.existsSync(p.join(this.tmp, file.pathInCompressed)))
					{
						if(globalExtracting) await globalExtracting.promise;
						this.whenExtractFile(_path);
						someIsExtracted = true;
					}
					else
					{
						setGlobalExtracting(_path);
						only.push(file.pathInCompressed);
					}
				}

				if(!only.length)
					return null;
				else if(someIsExtracted)
					return only;
				else
					return false;
			}
			catch(error)
			{
				console.error(error);

				return false;
			}
		}

	}

	this.renderCanvas = async function(file, canvas, config = {}) {

		this.updateConfig(config);
		this.getFeatures();

		if(this.features.pdf)
			return this.renderCanvasPdf(file, canvas);

	}

	this.ebookPages = async function(config = {}) {

		this.getFeatures();

		if(this.features.ebook)
			return this.ebookPagesEpub(config);

	}

	this.ebook = async function(config = {}) {

		this.updateConfig(config);
		this.getFeatures();

		if(this.features.ebook)
			return this.ebookEpub();

	}

	this.setFileStatus = function(path, data = {}) {

		if(!this.filesStatus[path])
		{
			this.filesStatus[path] = data;
		}
		else
		{
			for(let key in data)
			{
				if(key != 'extracted' || data[key])
					this.filesStatus[path][key] = data[key];
			}
		}

	}

	this.getFileStatus = function(file) {

		return this.filesStatus[file] || false;

	}

	this.removeTmp = function(name) {

		return removePathPart(name, this.tmp);

	}

	this.isCompressed = function(name) {

		let ext = fileExtension(name);

		if(inArray(ext, compressedExtensions.all))
			return true;

		return false;
	}

	this.isFolder = function(path) {

		if(fs.statSync(realPath(path, -1, this.prefixes)).isDirectory())
			return true;

		return false;
	}

	this.folderPathRegExp = false;

	this.folderPath = function(path) {

		if(!this.folderPathRegExp)
			this.folderPathRegExp = new RegExp(pregQuote(p.sep)+'[^'+pregQuote(p.sep)+']+$');

		return path.replace(this.folderPathRegExp, '');

	}

	this._filesToMultidimension = function(files, dimensions, from = false) {

		let _files = [];

		for(let key in dimensions)
		{
			let value = dimensions[key];

			if(typeof value === 'number')
			{
				let file = files[value];

				let data = {
					name: key,
					path: file.path,
					folder: file.folder ? true : false,
					compressed: this.isCompressed(file.name),
				};

				if(file.folder)
					data.files = [];

				_files.push(data);
			}
			else
			{
				let _name = from ? p.join(from, key) : key;

				_files.push({
					name: key,
					path: p.join(this.path, _name),
					folder: true,
					files: this._filesToMultidimension(files, value, _name),
				});
			}
		}

		return _files;
	}

	this.filesToMultidimension = function(files) {

		files.sort(function(a, b) {

			if(a.name === b.name) // This is technically not possible
				return 0;

			return a.name > b.name ? 1 : -1;

		});

		let dimensions = {};

		let firstFile = files[0];

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i];
			let fileIndex = i;
			let segments = splitPath(file.name);

			let dimension = dimensions;

			for(let i = 0, len = segments.length; i < len; i++)
			{
				let segment = segments[i];

				if(segment)
				{
					if(!dimension[segment] || typeof dimension[segment] === 'number') dimension[segment] = (i + 1 == len) ? fileIndex : {};
					dimension = dimension[segment];
				}
			}
		}

		let _files = this._filesToMultidimension(files, dimensions);

		return _files;
	}

	this.filesToOnedimension = function(files, _files = [], parentPath = '') {

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i];

			let _parentPath = p.join(parentPath, file.name);

			_files.push({name: file.name, path: file.path, pathInCompressed: _parentPath, folder: file.folder, compressed: file.compressed})

			if(file.files)
				_files = this.filesToOnedimension(file.files, _files, _parentPath);
		}

		return _files;
	}

	this.whenExtractFile = function(path) {

		if(this.callbackWhenFileExtracted)
		{
			let name = p.basename(path);

			let file = {
				name: name,
				path: path,
				folder: this.isFolder(path),
				compressed: this.isCompressed(name),
			};

			globalWhenExtractFile(path);
			this.callbackWhenFileExtracted(file);
		}

	};

	this.progressIndex = 0;
	this.progressPrev = false;

	this.progress = {};

	this.setProgress = function(progress, index = false) {

		index = index !== false ? index : this.contentRightIndex;

		if(!progress)
			this.progressPrev = false;

		if(this.progress && this.progress.multiply)
			progress = progress * this.progress.multiply;

		const loading = document.querySelector('.content-right .content-right-'+index+' .loading.loading96');
		events.loadingProgress(loading, progress);

	}

	this.stackOnlyInTasks = function(only, stackSize = 100) {

		const tasks = [];

		if(only)
		{
			for(let i = 0, len = Math.ceil(only.length / stackSize); i < len; i++)
			{
				tasks.push(only.slice(i * stackSize, i * stackSize + stackSize));
			}

			return tasks;
		}
		else
		{
			return [only];
		}

	}

	this.fixCorruptedName = function(name, pos = 0) {

		if(/�/.test(name))
		{
			let ext = p.extname(name);
			return pos+' - '+sha1(name)+(ext ? '.'+ext : '');
		}

		return name;

	}

	// ZIP
	this.zip = false;

	this.openZip = async function() {

		// Not support this cache
		// if(this.zip) return this.zip;

		if(unzip === false) unzip = require('unzipper');

		this.macosStartAccessingSecurityScopedResource(this.realPath);
		this.zip = await unzip.Open.file(this.realPath);

		return this.zip;

	}

	this.checkZipError = async function(extract = false) {

		let _this = this;

		return new Promise(function(resolve, reject) {

			fs.createReadStream(_this.realPath).pipe(
				unzip.Extract({path: _this.tmp}).on('close', reject).on('error', async function(error){

					if(/0xafbc7a37/.test(error.message)) // 7zip file
					{
						_this.getFeatures('7z');

						resolve(extract ? _this.extract7z() : _this.read7z());
					}
					else if(/0x21726152/.test(error.message)) // rar file
					{
						_this.getFeatures('rar');

						resolve(extract ? _this.extractRar() : _this.readRar());
					}
					else
					{
						resolve(extract ? _this.extractIfTypeFromBinaryIsDifferent(error) : _this.readIfTypeFromBinaryIsDifferent(error));
					}
					
				})
			);

		});

	}

	this.readZip = async function(callback = false) {

		let files = [];

		console.time('readZip: '+this.path);

		try
		{
			let zip = await this.openZip();

			for(let i = 0, len = zip.files.length; i < len; i++)
			{
				let entry = zip.files[i];
				let name = p.normalize(this.fixCorruptedName(entry.path, i));

				files.push({name: name, path: p.join(this.path, name), folder: (entry.type === 'Directory' ? true : false)});
				this.setFileStatus(name, {extracted: false});
			}

			files = this.filesToMultidimension(files);
		}
		catch(error)
		{
			files = await this.checkZipError();
		}

		console.timeEnd('readZip: '+this.path);

		return this.files = files;
		
	}

	this.extractZip = async function(callback = false) {

		console.time('extractZip: '+this.path);

		try
		{
			let zip = await this.openZip();

			this.progressIndex = 1;

			let _this = this;
			let only = this.config.only;

			for(let i = 0, len = zip.files.length; i < len; i++)
			{
				let entry = zip.files[i];
				let name = p.normalize(this.fixCorruptedName(entry.path, i));

				let extract = !only || only[name] ? true : false;

				if(extract)
				{
					let path = p.join(this.tmp, name);
					let virtualPath = p.join(this.path, name);

					if(entry.type === 'Directory')
					{
						if(!fs.existsSync(path))
							fs.mkdirSync(path);
					}
					else
					{
						let folderPath = this.folderPath(path);

						if(!fs.existsSync(folderPath))
							fs.mkdirSync(folderPath, {recursive: true});

						this.setFileStatus(name, {extracted: true});

						await new Promise(function(resolve, reject) {
							entry.stream().pipe(fs.createWriteStream(path)).on('error', reject).on('finish', function() {

								_this.setProgress(_this.progressIndex++ / len);
								_this.whenExtractFile(virtualPath);

								resolve();
							});
						});
					}
				}
			}
		}
		catch(error)
		{
			await this.checkZipError(true);
		}

		this.setProgress(1);

		console.timeEnd('extractZip: '+this.path);

		return;
	}




	// 7z
	this._7z = false;

	this.open7z = async function(extract = false, only = '') {

		// Not support this cache
		// if(this._7z) return this._7z;

		if(un7z === false) un7z = require('node-7z');
		if(bin7z === false) bin7z = asarToAsarUnpacked(require('7zip-bin').path7za);

		this.macosStartAccessingSecurityScopedResource(this.realPath);

		if(extract)
			this._7z = un7z.extractFull(this.realPath, this.tmp, {$bin: bin7z, $progress: true, $cherryPick: only, charset: 'UTF-8', listFileCharset: 'UTF-8'});
		else
			this._7z = un7z.list(this.realPath, {$bin: bin7z, charset: 'UTF-8', listFileCharset: 'UTF-8'});

		return this._7z;

	}

	this.read7z = async function(callback = false) {

		let files = [];

		console.time('read7z: '+this.path);
		let _this = this;

		let _7z = await this.open7z();
		let readSome = false;

		return new Promise(function(resolve, reject) {

			_7z.on('data', function(data) {

				if(data.file)
				{
					let name = _this.removeTmp(p.normalize(data.file));

					files.push({name: name, path: p.join(_this.path, name)});
					_this.setFileStatus(name, {extracted: false});

					readSome = true;
				}

			}).on('end', function(data) {

				console.timeEnd('read7z: '+_this.path);

				_this.files = _this.filesToMultidimension(files);
				resolve(_this.files);

			}).on('error', function(error){

				if(readSome)
				{
					/*_this.files = _this.filesToMultidimension(files);
					resolve(_this.files);*/

					//_this.saveErrorToCache(error);
					dom.compressedError(error, false, sha1(_this.path));
				}
				else
				{
					resolve(_this.readIfTypeFromBinaryIsDifferent(error));
				}

			});

		});
		
	}

	this.extract7z = async function(callback = false) {

		console.time('extract7z: '+this.path);

		let _this = this;

		const onlyLen = this.config._only ? this.config._only.length : false;
		const tasks = this.stackOnlyInTasks(this.config._only || false, 100);

		let result = false;
		let error = false;

		this.progressIndex = 1;

		for(let i = 0, len = tasks.length; i < len; i++)
		{
			const onlyStack = tasks[i];

			const _7z = await this.open7z(true, onlyStack);
			let extractedSome = false;

			result = await new Promise(function(resolve, reject) {

				_7z.on('data', function(data) {

					let extract = data.status == 'extracted' ? true : false;

					if(extract)
					{
						let name = _this.removeTmp(p.normalize(data.file));

						_this.setFileStatus(name, {extracted: extract});
						_this.whenExtractFile(p.join(_this.path, name));

						extractedSome = true;

						_this.setProgress(_this.progressIndex++ / onlyLen);
					}

				}).on('progress', function(progress) {

					if(!onlyLen)
						_this.setProgress(progress.percent / 100);

				}).on('end', function(data) {

					resolve();

				}).on('error', function(error) {

					if(extractedSome)
					{
						/*_this.setProgress(1);
						resolve();*/

						_this.saveErrorToCache(error);
						dom.compressedError(error, false, sha1(_this.path));
					}
					else
					{
						error = true;
						resolve(_this.extractIfTypeFromBinaryIsDifferent(error));
					}

				});

			});

			if(error) return result;
		}

		this.setProgress(1);

		console.timeEnd('extract7z: '+_this.path);

		return result;
	}


	// RAR
	this.rar = false;

	this.openRar = async function(extract = false, only = '') {

		// Also has extract issues with this cache
		// if(this.rar) return this.rar;

		if(unrar === false) unrar = require('node-unrar-js');

		this.macosStartAccessingSecurityScopedResource(this.realPath);
		let wasmBinary = fs.readFileSync(require.resolve('node-unrar-js/esm/js/unrar.wasm'));
		this.rar = await unrar.createExtractorFromFile({wasmBinary: wasmBinary, filepath: this.realPath, targetPath: this.tmp});

		return this.rar;

	}

	this.readRar = async function(callback = false) {

		let files = [];

		console.time('readRar: '+this.path);
		let _this = this;

		try
		{
			let rar = await this.openRar();
			let list = rar.getFileList();
			list = [...list.fileHeaders];

			for(let i = 0, len = list.length; i < len; i++)
			{
				let file = list[i];
				let name = _this.removeTmp(p.normalize(file.name));

				files.push({name: name, path: p.join(_this.path, name), folder: !!file.flags.directory});
				_this.setFileStatus(name, {extracted: false});
			}

			console.timeEnd('readRar: '+_this.path);

			_this.files = _this.filesToMultidimension(files);
			return _this.files;
		}
		catch(error)
		{
			return _this.readIfTypeFromBinaryIsDifferent(error);
		}
		
	}

	this.extractRar = async function(callback = false) {

		console.time('extractRar: '+this.path);

		this.progressIndex = 1;

		try
		{
			let rar = await this.openRar();
			let regexp = new RegExp(pregQuote(p.sep, '/'), 'g');

			if(!this.config._only || !this.config._only.length)
			{
				let files = await this.read();
				files = this.filesToOnedimension(files);

				this.config._only = [];

				for(let i = 0, len = files.length; i < len; i++)
				{
					this.config._only.push(files[i].pathInCompressed);
				}
			}

			for(let i = 0, len = this.config._only.length; i < len; i++)
			{
				let _name = this.config._only[i];

				let extracted = rar.extract({files: [_name.replace(regexp, '/')]});
				extracted = [...extracted.files];

				await app.setImmediate();

				let virtualPath = p.join(this.path, _name);

				this.setProgress(this.progressIndex++ / len);
				this.setFileStatus(_name, {extracted: true});
				this.whenExtractFile(virtualPath);
			}

			this.setProgress(1);

			console.timeEnd('extractRar: '+this.path);

			return;
		}
		catch(error)
		{
			return this.extractIfTypeFromBinaryIsDifferent(error);
		}
	}


	// TAR
	this.tar = false;

	this.openTar = async function() {

		// Not support this cache
		// if(this.tar) return this.tar;
		if(this.tar) this.tar.destroy();

		if(untar === false) untar = require('tar-fs');

		this.macosStartAccessingSecurityScopedResource(this.realPath);
		this.tar = fs.createReadStream(this.realPath);

		return this.tar;

	}

	this.readTar = async function(callback = false) {

		let files = [];

		let tar = await this.openTar();
		let _this = this;

		console.time('readTar: '+this.path);

		return new Promise(function(resolve, reject) {

			tar.pipe(untar.extract(_this.tmp, {
				ignore (name) {

					name = _this.removeTmp(p.normalize(name));

					files.push({name: name, path: p.join(_this.path, name)});
					_this.setFileStatus(name, {extracted: false});

					return true;
				}
			})).on('finish', function() {

				console.timeEnd('readTar: '+_this.path);

				_this.files = _this.filesToMultidimension(files);
				resolve(_this.files);

			}).on('error', function(error) {

				resolve(_this.readIfTypeFromBinaryIsDifferent(error));

			});

		});
		
	}

	this.extractTar = async function(callback = false) {

		let tar = await this.openTar();

		let only = this.config.only; 
		let _this = this;

		console.time('extractTar: '+this.path);

		let files = [];
		
		return new Promise(function(resolve, reject) {

			tar.pipe(untar.extract(_this.tmp, {
				ignore (name) {
					name = _this.removeTmp(p.normalize(name));

					let extract = !only || only[name] ? true : false;
					_this.setFileStatus(name, {extracted: extract});

					if(extract)
						files.push(p.join(_this.path, name));

					return !extract;
				}
			})).on('finish', function() {

				console.timeEnd('extractTar: '+_this.path);

				for(let i = 0, len = files.length; i < len; i++)
				{
					_this.whenExtractFile(files[i]);
				}

				resolve();

			}).on('error', function(error) {

				resolve(_this.extractIfTypeFromBinaryIsDifferent(error));

			});

		});

	}



	// PDF
	this.pdf = false;

	this.openPdf = async function() {

		if(this.pdf) return this.pdf;

		if(unpdf === false) await loadPdfjs();

		this.macosStartAccessingSecurityScopedResource(this.realPath);
		this.pdf = await unpdf.getDocument({
			url: encodeURIComponent(this.realPath).replace(/\%2F/g,'/').replace(/\%5C/g,'\\').replace(/\%3A/g, ':'),
			wasmUrl: fileManager.posixPath(asarToAsarUnpacked(p.join(appDir, 'node_modules/pdfjs-dist/wasm/'))),
			cMapUrl: fileManager.posixPath(asarToAsarUnpacked(p.join(appDir, 'node_modules/pdfjs-dist/cmaps/'))),
			cMapPacked: true,
			/*nativeImageDecoderSupport: 'none', disableFontFace: true*/
		}).promise;

		return this.pdf;

	}

	this.readPdf = async function() {

		let _this = this;

		let files = [];

		console.time('readPdf: '+this.path);

		let pdf = await this.openPdf();
		let pages = pdf.numPages;
		let leadingZeros = Math.max(String(pages).length, 4);

		for(let i = 1; i <= pages; i++)
		{
			let file = 'page-'+String(i).padStart(leadingZeros, '0')+'.jpg';

			let page = await pdf.getPage(i);
			let viewport = page.getViewport({scale: 1});

			let size = {width: viewport.width, height: viewport.height};

			files.push({name: file, path: p.join(this.path, file), folder: false, compressed: false, size: size, page: i});
			this.setFileStatus(file, {page: i, extracted: false, size: size});
		}

		console.timeEnd('readPdf: '+this.path);

		return this.files = files;

	}

	this.readPdfMetadata = async function() {

		let pdf = await this.openPdf();
		let metadata = await pdf.getMetadata();

		let map = {};

		if(metadata.metadata)
		{
			let _map = Object.fromEntries(metadata.metadata);
			map._map = _map;

			for(let key in _map)
			{
				let item = _map;

				let _key = app.extract(/([^:]+)$/, key, 1);
				if(!map[_key]) map[_key] = Array.isArray(_map[key]) ? _map[key].join(', ') : _map[key];
			}
		}

		return {
			title: metadata.info.Title || map.title || '',

			author: map.creator || metadata.info.Author || '',
			publisher: map.publisher || '',

			description: app.stripTagsWithDOM(map.description || metadata.info.Description || metadata.info.Subject || ''),

			language: map.language || metadata.info.Language || '',

			web: map.identifier ? app.extract(/^(?:url|uri):(.*)/iu, map.identifier) : '',
			identifier: map.identifier,

			releaseDate: map.metadatadate || '',
			modifiedDate: map.modifydate || '',

			creatorTool: map.creatortool || '',

			metadata: {
				info: metadata.info,
				map: map,
			},
		};

	}

	this.extractPdf = async function() {

		console.time('extractPdf: '+this.path);

		let pdf = await this.openPdf();
		let pages = pdf.numPages;
		let leadingZeros = Math.max(String(pages).length, 4);

		let only = this.config.only; 

		let totalFiles = this.config._only ? this.config._only.length : pages;
		let progressIndex = 1;

		for(let i = 1; i <= pages; i++)
		{
			let file = 'page-'+String(i).padStart(leadingZeros, '0')+'.jpg';
			let path = p.join(this.tmp, file);
			let virtualPath = p.join(this.path, file);

			let status = this.getFileStatus(file);
			
			if((!only || only[file]) && (this.config.force || !status.extracted || status.width !== this.config.width || !fs.existsSync(path)))
			{
				// Render page
				let page = await pdf.getPage(i);

				let width = (status?.size?.width || page.getViewport({scale: 1}).width);

				let scale = this.config.width / width;
				let viewport = page.getViewport({scale: scale});

				let canvas = document.createElement('canvas');
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				let context = canvas.getContext('2d');

				await page.render({canvasContext: context, viewport: viewport}).promise;

				let imageData = canvas.toDataURL('image/jpeg', 1);

				fs.writeFileSync(path, Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64'));

				this.setFileStatus(file, {page: i, extracted: true, width: this.config.width});

				this.setProgress(progressIndex++ / totalFiles);
				this.whenExtractFile(virtualPath);
			}
		}

		this.setProgress(1);

		console.timeEnd('extractPdf: '+this.path);

		return;

	}

	this.renderCanvasPdf = async function(file, canvas) {

		let pdf = await this.openPdf();
		let pages = pdf.numPages;

		let status = this.getFileStatus(file);

		if((status && (status.widthRendered !== this.config.width || status.canvasRendered !== canvas)) || this.config.force)
		{
			console.log('renderCanvasPdf');

			// Render page
			let page = await pdf.getPage(status.page);

			let scale = this.config.width / status.size.width;
			let viewport = page.getViewport({scale: scale});

			canvas.width = viewport.width = Math.round(viewport.width);
			canvas.height = viewport.height = Math.round(viewport.height);
			let context = canvas.getContext('2d');

			await page.render({canvasContext: context, viewport: viewport}).promise;

			this.setFileStatus(file, {rendered: true, widthRendered: this.config.width, canvasRendered: canvas});

			return {width: viewport.width, height: viewport.height};
		}

		return false;
	}



	// ePub
	this.epub = false;

	this.openEpub = async function() {

		if(this.epub) return this.epub;

		if(ebook.epub === false)
			ebook.epub = require(p.join(appDir, 'scripts/ebook/epub.js'));

		this.macosStartAccessingSecurityScopedResource(this.realPath);
		this.epub = ebook.epub.load(this.realPath);

		return this.epub;

	}

	this.readEpub = async function() {

		let _this = this;

		let files = [];

		console.time('readEpub: '+this.path);

		let epub = await this.openEpub();
		let _files = await epub.readEpubFiles();

		for(let i = 0, len = _files.length; i < len; i++)
		{
			let file = _files[i];

			files.push({name: file, path: p.join(this.path, file), folder: false, compressed: false});
			this.setFileStatus(file, {extracted: false});
		}

		console.timeEnd('readEpub: '+this.path);

		return this.files = files;

	}

	this.readEpubMetadata = async function() {

		let epub = await this.openEpub();
		let metadata = await epub.readEpubMetadata();

		return {
			title: metadata.title || '',

			author: metadata.creator || '',
			publisher: metadata.publisher || '',
			contributor: metadata.contributor || [],

			/*author: comicInfo.Writer || '',
			writer: comicInfo.Writer || '',
			penciller: comicInfo.Penciller || '',
			inker: comicInfo.Inker || '',
			colorist: comicInfo.Colorist || '',
			letterer: comicInfo.Letterer || '',
			coverArtist: comicInfo.CoverArtist || '',
			editor: comicInfo.Editor || '',
			translator: comicInfo.Translator || '',
			publisher: comicInfo.Publisher || '',
			imprint: comicInfo.Imprint || '',*/

			subject: metadata.subject || [],
			genre: metadata.genre || '',

			description: metadata.description || '',
			longDescription: metadata.longDescription || '',
			rights: metadata.rights || '',

			language: metadata.language || '',

			web: metadata.identifier ? app.extract(/^(?:url|uri):(.*)/iu, metadata.identifier) : '',
			identifier: metadata.identifier,
			source: metadata.source,

			releaseDate: metadata.pubdate || '',
			modifiedDate: metadata.modified_date || '',

			metadata: metadata,
		};

	}

	this.extractEpub = async function() {

		console.time('extractEpub: '+this.path);

		let epub = await this.openEpub();
		let only = this.config.only;
		let _this = this;

		let files = await this.read();
		files = this.filesToOnedimension(files);

		let filesToRender = [];

		for(let i = 0, len = files.length; i < len; i++)
		{
			let file = files[i].pathInCompressed;
			let path = p.join(this.tmp, file);
			let virtualPath = p.join(this.path, file);

			let status = this.getFileStatus(file);
			
			if((!only || only[file]) && (this.config.force || !status.extracted || status.width !== this.config.width || !fs.existsSync(path)))
			{
				filesToRender.push({
					name: file,
					path: path,
				});
			}
		}

		let totalFiles = filesToRender.length;
		let progressIndex = 1;

		if(!onReading)
		{
			if(epub.extracted)
				this.setProgress(0.5);
			else
				this.setProgress(0);
		}

		await epub.renderFiles(filesToRender, {width: this.config.width}, function(file){

			let path = p.join(_this.tmp, file);
			let virtualPath = p.join(_this.path, file);

			_this.setFileStatus(file, {extracted: true, width: _this.config.width});

			_this.setProgress(epub.extracted ? (0.5 + progressIndex++ / totalFiles / 2) : (progressIndex++ / totalFiles));
			_this.whenExtractFile(virtualPath);

		});

		if(!onReading)
			this.setProgress(1);

		console.timeEnd('extractEpub: '+this.path);

		return;

	}

	this.renderEpubPage = async function(file, canvas) {


	}

	this.ebookPagesEpub = async function(config = {}) {

		console.time('ebookPagesEpub: '+this.path);

		let epub = await this.openEpub();
		let _this = this;

		let files = await this.read();
		files = this.filesToOnedimension(files);

		let totalFiles = files.length;
		let progressIndex = 1;

		if(epub.extracted)
			this.setProgress(0.5);
		else
			this.setProgress(0);

		let pages = await epub.epubPages(config, function(){

			// _this.setFileStatus(file, {extracted: true, width: _this.config.width});
			_this.setProgress(epub.extracted ? (0.5 + progressIndex++ / totalFiles / 2) : (progressIndex++ / totalFiles));

		});

		this.setProgress(1);

		console.timeEnd('ebookPagesEpub: '+this.path);

		return pages;

	}

	this.ebookEpub = async function() {

		let epub = await this.openEpub();
		return epub.ebook;

	}

	this.macosScopedResources = [];

	this.macosStartAccessingSecurityScopedResource = function(path) {

		if(macosMAS)
		{
			let securityScopedBookmarks = storage.get('securityScopedBookmarks');
			let segments = splitPath(path);

			if(!segments[0])
				segments[0] = p.sep;

			for(let i = 1, len = segments.length; i < len; i++)
			{
				let _path = p.join(...segments);
				let bookmark = securityScopedBookmarks[_path] || false;

				if(bookmark)
				{
					try
					{
						this.macosScopedResources.push(electronRemote.app.startAccessingSecurityScopedResource(bookmark));
						break;
					}
					catch {}
				}

				segments.pop();
			}
		}

	}

	this.destroy = function() {

		if(this.tar) this.tar.destroy();
		if(this.pdf) this.pdf.destroy();
		if(this.epub) this.epub.destroy();

		delete this.zip;
		delete this._7z;
		delete this.rar;
		delete this.tar;
		delete this.pdf;
		delete this.epub;

		this.filesStatus = {};

		// Stop accessing security scoped resources
		for(let i = 0, len = this.macosScopedResources.length; i < len; i++)
		{
			this.macosScopedResources[i]();
		}

		this.macosScopedResources = [];

	}

}

var extractingPromises = {};
var extractingPromisesST = {};

function setGlobalExtracting(path)
{
	extractingPromisesST[path] = setTimeout(function(){

		globalWhenExtractFile(path);

	}, 60000);

	let _resolve = false;

	extractingPromises[path] = {
		promise: new Promise(async function(resolve, reject) {

			_resolve = resolve;

		}),
		resolve: false,
	};

	extractingPromises[path].resolve = _resolve;
}

function getGlobalExtracting(path)
{
	return extractingPromises[path] || false;
}

function globalWhenExtractFile(path)
{
	if(extractingPromisesST[path]) clearTimeout(extractingPromisesST[path]);
	
	if(extractingPromises[path])
	{
		const globalExtracting = extractingPromises[path];
		delete extractingPromises[path];
		globalExtracting.resolve();
	}
}

// Use this to remove generated vector images if window.devicePixelRatio is changed
async function removeTmpVector()
{
	let file = fileManager.file(tempFolder);
	let folders = await file.read();

	let devicePixelRatio = window.devicePixelRatio;

	for(let i = 0, len = folders.length; i < len; i++)
	{
		let folder = folders[i];
		let vector = p.join(tempFolder, folder.name, folder.name+'-opencomic-is-vector.txt');

		if(fs.existsSync(vector))
		{
			let _devicePixelRatio = +readFile(vector);

			if(devicePixelRatio !== _devicePixelRatio)
				fs.rm(p.join(tempFolder, folder.name), {recursive: true, force: true}, function(){});
		}
	}
}

var downloadedCompressedFiles = {
	list: [],
	sizes: {},
};

function downloadedCompressedFile(path)
{
	let realPath = fileManager.realPath(path, -1);

	let totalSize = 0;
	let list = [];

	for(let i = 0, len = downloadedCompressedFiles.list.length; i < len; i++)
	{
		let _realPath = downloadedCompressedFiles.list[i];

		if(fs.existsSync(_realPath) && _realPath !== realPath)
		{
			let size = downloadedCompressedFiles.sizes[_realPath] || fs.statSync(_realPath).size;

			downloadedCompressedFiles.sizes[_realPath] = size;
			list.push(_realPath);

			totalSize += size;
		}
	}

	downloadedCompressedFiles.list = list;
	downloadedCompressedFiles.list.push(realPath);

	let size = downloadedCompressedFiles.sizes[realPath] || fs.statSync(realPath).size;

	downloadedCompressedFiles.sizes[realPath] = size;
	totalSize += size;

	let maxSize = ((config.tmpMaxSize || 2) / 2) * 1000 * 1000 * 1000; // 50% of tmpMaxSize

	if(totalSize > maxSize)
	{
		let list = [];
		let sizes = {};

		for(let i = 0, len = downloadedCompressedFiles.list.length; i < len; i++)
		{
			let _realPath = downloadedCompressedFiles.list[i];
			let size = downloadedCompressedFiles.sizes[_realPath] || fs.statSync(_realPath).size;

			if(totalSize > maxSize)
			{
				if(fs.existsSync(_realPath))
				{
					totalSize -= size;
					fs.unlinkSync(_realPath);
				}
			}
			else
			{
				list.push(_realPath);
				sizes[_realPath] = size;
			}
		}

		downloadedCompressedFiles.list = list;
		downloadedCompressedFiles.sizes = sizes;
	}
}

function realPath(path, index = 0, prefixes = false)
{
	const segments = splitPath(path);
	const len = segments.length;
	const numSegments = len + index;

	let virtualPath;

	let newPath = virtualPath = (len > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';

	if(isServer(path))
	{
		let adress = p.normalize(serverClient.getAdress(path));

		newPath = p.join(tempFolder, sha1(adress));
		virtualPath = adress;
		
		if(!segments[1])
			segments[0] = segments[1] = segments[2] = '';
		else
			segments[0] = segments[1] = '';
	}

	for(let i = 1; i < len; i++)
	{
		newPath = p.join(newPath, segments[i]);
		virtualPath = p.join(virtualPath, segments[i]);

		if(i < numSegments)
		{
			let extension = fileExtension(newPath);

			if(extension)
			{
				if(inArray(extension, compressedExtensions.all) /* && fs.existsSync(newPath) && !fs.statSync(newPath).isDirectory()*/)
				{
					let sha = sha1(p.normalize(virtualPath));

					if(prefixes)
					{
						for(let ext in prefixes)
						{
							if(inArray(extension, compressedExtensions[ext]))
							{
								sha = prefixes[ext]+'-'+sha;

								break;
							}
						}
					}

					newPath = p.join(tempFolder, sha);
				}
				else if(inArray(extension, imageExtensions.convert) && i + 1 === len)
				{
					const sha = sha1(p.dirname(p.normalize(virtualPath)));

					let image = p.basename(virtualPath);
					image = image+'.png';

					newPath = p.join(tempFolder, sha, image);
				}
			}
		}
	}

	return newPath;
}

async function convertUnsupportedImages(files)
{
	const promises = [];

	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];
		const path = file.path;

		if(!file.folder && !file.compressed && inArray(fileExtension(path), imageExtensions.convert)) // Convert unsupported images
			promises.push(workers.convertImage(path));
	}

	await Promise.all(promises);

	return true;
}

async function blobUnsupportedImages(files, options = {useThreads: 1})
{
	const promises = [];

	for(let i = 0, len = files.length; i < len; i++)
	{
		const file = files[i];
		const path = file.path;

		if(!file.folder && !file.compressed && inArray(fileExtension(path), imageExtensions.blob)) // Convert unsupported images to Blob
			promises.push(workers.convertImageToBlob(path, options));
	}

	await Promise.all(promises);

	return true;
}

var tmpUsageST = false, tmpUsageQueue = [];

function setTmpUsage(path)
{
	tmpUsageQueue.push(path);

	if(tmpUsageST === false)
	{
		tmpUsageST = setTimeout(function() {

			tmpUsageST = false;

			const len = tmpUsageQueue.length;
			if(len === 0) return;

			const time = app.time();
			const tmpUsage = storage.get('tmpUsage');

			for(let i = 0; i < len; i++)
			{
				const path = tmpUsageQueue[i];

				if(!tmpUsage[path]) tmpUsage[path] = {};
				tmpUsage[path].lastAccess = time;
			}

			storage.setThrottle('tmpUsage', tmpUsage);
			tmpUsageQueue = [];

		}, 1000);
	}
}

var serverInOfflineMode = false;

function setServerInOfflineMode(value = false)
{
	serverInOfflineMode = value;
}

function isServer(path)
{
	if(/^(?:\.[\/\\]+)?(?:smb|ssh|sftp|scp|ftp|ftps|s3|webdavs?|opdsfs?)\:[\/\\]{1,2}/.test(path))
		return true;

	return false;
}

function isOpds(path)
{
	if(/^(?:\.[\/\\]+)?(?:opds)\:[\/\\]{1,2}/.test(path))
		return true;

	return false;
}

function isCompressed(name)
{
	let ext = fileExtension(name);

	if(inArray(ext, compressedExtensions.all))
		return true;

	return false;
}

function firstCompressedFile(path, index = 0, checkDirectory = true)
{
	let segments = splitPath(path);
	let len = segments.length;

	let newPath = (len > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';
	let numSegments = len + index;

	let _isServer = isServer(path);

	for(let i = 1; i < len; i++)
	{
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			let extension = fileExtension(newPath);

			if(extension && inArray(extension, compressedExtensions.all) && (!checkDirectory || _isServer || !fs.existsSync(newPath) || !fs.statSync(newPath).isDirectory()))
				return newPath;
		}
	}

	return newPath;
}

function firstCompressedFileRealPath(path, index = 0)
{
	return isServer(path) ? realPath(firstCompressedFile(path, index), -1) : firstCompressedFile(path, index);
}


function lastCompressedFile(path, index = 0)
{
	let segments = splitPath(path);
	let len = segments.length;

	let newPath = (len > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';
	let numSegments = len + index;

	let lastCompressed = false;

	for(let i = 1; i < len; i++)
	{
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			let extension = fileExtension(newPath);

			if(extension && inArray(extension, compressedExtensions.all))
				lastCompressed = newPath;
		}
	}

	return lastCompressed;
}

function allCompressedFiles(path, index = 0)
{
	let segments = splitPath(path);
	let len = segments.length;

	let newPath = (len > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';
	let numSegments = len + index;

	let lastCompressed = false;

	let files = [];

	for(let i = 1; i < len; i++)
	{
		newPath = p.join(newPath, segments[i]);

		if(i < numSegments)
		{
			let extension = fileExtension(newPath);

			if(extension && inArray(extension, compressedExtensions.all))
				files.push(newPath);
		}
	}

	return files;
}

function containsCompressed(path, index = 0)
{
	let segments = splitPath(path);
	let len = segments.length;

	var virtualPath = (len > 0) ? (isEmpty(segments[0]) ? '/' : segments[0]) : '';
	let numSegments = len + index;

	let _isServer = isServer(path);

	for(let i = 1; i < len; i++)
	{
		virtualPath = p.join(virtualPath, segments[i]);

		if(i < numSegments)
		{
			var extension = fileExtension(virtualPath);

			if(extension && inArray(extension, compressedExtensions.all) && (_isServer || !fs.statSync(virtualPath).isDirectory()))
			{
				return true;
			}
		}
	}

	return false;
}

function splitPath(path)
{
	const first = app.extract(/^([\\\/]*[^\\\/]+)[\\\/]*/, path);
	const segments = path.replace(/^([\\\/]*[^\\\/]+)[\\\/]*/, '').split(p.sep).filter(i => i);

	segments.unshift(first);

	return segments;
}

function isParentPath(parentPath, fullPath)
{
	if(new RegExp('^\s*'+pregQuote(parentPath)).test(fullPath))
		return true;

	return false;
}

function removePathPart(path, partToRemove)
{
	path = path.replace(new RegExp('^\s*'+pregQuote(partToRemove)), '');
	path = path.replace(new RegExp('^\s*'+pregQuote(p.sep)), '');

	return path;
}

function pathType(path)
{
	if(inArray(mime.getType(path), compatibleMime))
		return {folder: false, compressed: false};
	else if(inArray(fileExtension(path), compressedExtensions.all))
		return {folder: false, compressed: true};
	else if(fs.statSync(path).isDirectory())
		return {folder: true, compressed: false};
	else
		return false;
}

function posixPath(path)
{
	return path.split(p.sep).join(p.posix.sep);
}

function simpleExists(path)
{
	if(isServer(path) || isOpds(path))
	{
		return true;
	}
	else
	{
		path = firstCompressedFile(path, 0, false);

		if(fs.existsSync(path))
			return true;
	}

	return false;
}

function replaceReservedCharacters(filename)
{
	return filename.replace(/[/\\?%*:|"<>]/g, '-');
}

function genearteFilePath(saveTo, fileName)
{
	let path = p.join(saveTo, fileName);

	const extension = p.extname(fileName);
	const imageName = p.basename(fileName, extension);

	for(let i = 1; i < 100; i++)
	{
		if(!fs.existsSync(path))
			break;

		path = p.join(saveTo, imageName+' ('+i+')'+extension);
	}

	return path;
}

var _ignoreFilesRegex = false, ignoreFilesRegexCache = {};

function ignoreFilesRegex(ignoreFilesRegex = false, force = false)
{
	ignoreFilesRegex = ignoreFilesRegex || config.ignoreFilesRegex || [];

	if(!force)
	{
		if(_ignoreFilesRegex)
			return _ignoreFilesRegex;
	}

	const len = ignoreFilesRegex.length;

	if(!len)
	{
		_ignoreFilesRegex = false;

		return false;
	}

	ignoreFilesRegexCache = {};
	const list = [];

	for(let i = 0; i < len; i++)
	{
		let pattern = ignoreFilesRegex[i];
		let flags = 'iu';

		let regex = false;

		if(/\/.*\/[a-z]*/.test(pattern)) // Is Regex
		{
			flags = app.extract(/\/.*\/([a-z]*)/, pattern, 1);
			pattern = app.extract(/\/(.*)\/[a-z]*/, pattern, 1);
		
			regex = new RegExp(pattern, flags);
		}
		else // Is File Pattern
		{
			if(Minimatch === false)
				Minimatch = require('minimatch').Minimatch;

			const mm = new Minimatch(pattern, {
				// noCase: true,
				nocomment: true,
				noglobstar: true,
				optimizationLevel: 2,
			});

			regex = mm.makeRe();
		}

		list.push(regex);
	}

	let i = 0;

	_ignoreFilesRegex = {
		test: function(string) {

			if(ignoreFilesRegexCache[string] !== undefined)
				return ignoreFilesRegexCache[string];

			let match = false;

			for(i = 0; i < len; i++)
			{
				const regex = list[i];

				if(regex.test(string))
				{
					match = true;
					break;
				}
			}

			if(string.length < 1000) // Avoid cache too long strings
				ignoreFilesRegexCache[string] = match;

			return match;

		},
		list: list,
	};

	return _ignoreFilesRegex;
}

function filtered(files, specialFiles = false)
{
	const ignore = ignoreFilesRegex();
	const filtered = [];

	if(files)
	{
		for(let i = 0, len = files.length; i < len; i++)
		{
			const file = files[i];
			const specialFile = (specialFiles && !file.folder && !file.compressed && compatibleSpecialExtensions.includes(app.extname(file.path))) ? true : false;

			if(ignore && ignore.test(file.name) && !specialFile)
				continue;

			if(file.folder || file.compressed)
				filtered.push(file);
			else if(compatibleMime.includes(mime.getType(file.path)) || specialFile)
				filtered.push(file);
		}
	}

	return filtered;
}

function sort(files)
{
	if(files)
	{
		let sort = config.sort;
		let sortInvert = config.sortInvert;
		let foldersFirst = config.foldersFirst;

		let order = '';

		if(sort == 'name')
			order = 'simple';
		else if(sort == 'numeric')
			order = 'numeric';
		else
			order = 'simple-numeric';

		files.sort(function (a, b) {
			if(foldersFirst && (a.folder || a.compressed) && !(b.folder || b.compressed)) return -1; 
			if(foldersFirst && (b.folder || b.compressed) && !(a.folder || a.compressed)) return 1; 
			return (sortInvert) ? -(dom.orderBy(a, b, order, 'name')) : dom.orderBy(a, b, order, 'name');
		});

		return files;
	}
}

function macosSecurityScopedBookmarks(files)
{
	if(macosMAS && files.bookmarks && files.bookmarks[0])
	{
		let securityScopedBookmarks = storage.get('securityScopedBookmarks');

		for(let i = 0, len = files.bookmarks.length; i < len; i++)
		{
			securityScopedBookmarks[p.normalize(files.filePaths[i])] = files.bookmarks[i];
		}

		storage.set('securityScopedBookmarks', securityScopedBookmarks);
	}
}

var macosScopedResources = {};
var macosScopedResourcesST1 = false;
var macosScopedResourcesST2 = false;

function macosStartAccessingSecurityScopedResource(path) {

	if(macosMAS)
	{
		const securityScopedBookmarks = storage.get('securityScopedBookmarks');
		const segments = splitPath(path);

		if(!segments[0])
			segments[0] = p.sep;

		let start = false;

		for(let i = 1, len = segments.length; i < len; i++)
		{
			const _path = p.join(...segments);
			const bookmark = securityScopedBookmarks[_path] || false;

			if(bookmark)
			{
				try
				{
					if(macosScopedResources[_path])
					{
						macosScopedResources[_path].used = Date.now();
					}
					else
					{
						macosScopedResources[_path] = {
							used: Date.now(),
							stop: electronRemote.app.startAccessingSecurityScopedResource(bookmark),
						};
					}

					start = true;

					break;
				}
				catch {}
			}

			segments.pop();
		}

		if(start)
		{
			// Throttling
			if(macosScopedResourcesST1 === false)
			{
				macosScopedResourcesST1 = setTimeout(function(){

					macosStopAccessingSecurityScopedResource();
					macosScopedResourcesST1 = false;

				}, 500);
			}

			// Debounce
			if(macosScopedResourcesST2 !== false) clearTimeout(macosScopedResourcesST2);
			macosScopedResourcesST2 = setTimeout(function(){

				macosStopAccessingSecurityScopedResource();
				macosScopedResourcesST2 = false;

			}, 1000 * 5);
		}
	}
}

// Stop accessing security scoped resources
function macosStopAccessingSecurityScopedResource()
{
	for(let path in macosScopedResources)
	{
		const resource = macosScopedResources[path];

		if(Date.now() - resource.used > 1000 * 5)
		{
			resource.stop();
			delete macosScopedResources[path];
		}			
	}
}

// Code from https://github.com/sindresorhus/read-chunk 
async function readChunk(filePath, {length, startPosition})
{
	const fileDescriptor = await fsp.open(filePath, 'r');

	try
	{
		let {bytesRead, buffer} = await fileDescriptor.read({
			buffer: new Uint8Array(length),
			length,
			position: startPosition,
		});

		if(bytesRead < length)
			buffer = buffer.subarray(0, bytesRead);

		return buffer;
	}
	finally
	{
		await fileDescriptor?.close();
	}
}

async function dirSize(dir)
{
	let stat = await fsp.stat(dir);
	if(!stat.isDirectory())
		return stat.size;

	let files = await fsp.readdir(dir, {withFileTypes: true});
	let size = 0;

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];
		let path = p.join(dir, file.name);

		if(file.isDirectory())
			size += await dirSize(path);
		else if(file.isFile())
			size += (await fsp.stat(path)).size;
	}

	return size;
}

function dirSizeSync(dir)
{
	let stat = fs.statSync(dir);
	if(!stat.isDirectory())
		return stat.size;

	let files = fs.readdirSync(dir, {withFileTypes: true});
	let size = 0;

	for(let i = 0, len = files.length; i < len; i++)
	{
		let file = files[i];
		let path = p.join(dir, file.name);

		if(file.isDirectory())
			size += dirSizeSync(path);
		else if(file.isFile())
			size += fs.statSync(path).size;
	}

	return size;
}

function copyToTmp(path)
{
	const name = p.basename(path);
	const tmp = p.join(tempFolder, sha1(p.dirname(path)));

	const newPath = p.join(tmp, sha1(name)+p.extname(name));

	if(!fs.existsSync(tmp))
		fs.mkdirSync(tmp, {recursive: true});

	if(!fs.existsSync(newPath))
		fs.copyFileSync(path, newPath);

	const tmpUsage = storage.get('tmpUsage');

	if(!tmpUsage[newPath]) tmpUsage[newPath] = {};
	tmpUsage[newPath].lastAccess = app.time();

	storage.setThrottle('tmpUsage', tmpUsage);

	return newPath;
}

var blobObjectsURL = {};

function fileToBlob(path)
{
	if(blobObjectsURL[path]) return blobObjectsURL[path];

	const data = fs.readFileSync(path);

	const blob = new Blob([data], {type: mime.getType(path)});
	const blobURL = URL.createObjectURL(blob);

	blobObjectsURL[path] = blobURL;
	return blobObjectsURL[path];
}

function bufferToBlob(path, buffer, mime = 'image/png')
{
	if(blobObjectsURL[path]) return blobObjectsURL[path];

	const blob = new Blob([buffer], {type: mime});
	const blobURL = URL.createObjectURL(blob);

	blobObjectsURL[path] = blobURL;
	return blobObjectsURL[path];
}

function getBlob(path)
{
	if(blobObjectsURL[path]) return blobObjectsURL[path];
	return false;
}

function revokeObjectURL(path)
{
	if(!blobObjectsURL[key]) return;

	URL.revokeObjectURL(blobObjectsURL[key]);
	delete blobObjectsURL[key];
}

function revokeAllObjectURL()
{
	for(let key in blobObjectsURL)
	{
		URL.revokeObjectURL(blobObjectsURL[key]);
	}

	blobObjectsURL = {};
}

var prevDevicePixelRatio = window.devicePixelRatio;

window.addEventListener('resize', function() {

	if(prevDevicePixelRatio !== window.devicePixelRatio)
	{
		prevDevicePixelRatio = window.devicePixelRatio;

		removeTmpVector();
	}

});

module.exports = {
	file: function(path, _config = false) {
		return new file(path, _config);
	},
	fileCompressed: function(path, realPath = false, forceType = false, prefixes = false){ // This consider moving it to a separate file
		return new fileCompressed(path, realPath, forceType, prefixes);
	},
	removeTmpVector: removeTmpVector,
	removePathPart: removePathPart,
	filtered: filtered,
	ignoreFilesRegex: ignoreFilesRegex,
	sort: sort,
	realPath: realPath,
	pathType: pathType,
	posixPath: posixPath,
	isCompressed: isCompressed,
	isServer: isServer,
	isOpds: isOpds,
	setServerInOfflineMode: setServerInOfflineMode,
	serverInOfflineMode: function(){return serverInOfflineMode},
	firstCompressedFile: firstCompressedFile,
	lastCompressedFile: lastCompressedFile,
	containsCompressed: containsCompressed,
	splitPath: splitPath,
	isParentPath: isParentPath,
	simpleExists: simpleExists,
	replaceReservedCharacters: replaceReservedCharacters,
	genearteFilePath: genearteFilePath,
	convertUnsupportedImages: convertUnsupportedImages,
	blobUnsupportedImages: blobUnsupportedImages,
	setTmpUsage: setTmpUsage,
	macosScopedResources: function(){return macosScopedResources},
	macosSecurityScopedBookmarks: macosSecurityScopedBookmarks,
	macosStartAccessingSecurityScopedResource: macosStartAccessingSecurityScopedResource,
	readChunk: readChunk,
	dirSize: dirSize,
	dirSizeSync: dirSizeSync,
	copyToTmp: copyToTmp,
	fileToBlob: fileToBlob,
	bufferToBlob: bufferToBlob,
	getBlob: getBlob,
	revokeObjectURL: revokeObjectURL,
	revokeAllObjectURL: revokeAllObjectURL,
	requestFileAccess: requestFileAccess,
}
