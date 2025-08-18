var smb2 = false, basicFtp = false, ssh2 = false, nodeScp = false, s3c = false, webdav = false;

var servers = [];

function getHost(path)
{
	path = posixPath(path);

	return app.extract(/^[a-z0-9]+\:\/\/?([^\/\\:]+)(:[0-9]+)?/, path, 1);
}

function getBaseUrl(path)
{
	path = posixPath(path);

	return app.extract(/^([a-z0-9]+\:\/\/?[^\/\\:]+)(:[0-9]+)?/, path, 1);
}

function getShare(path)
{
	path = posixPath(path);

	return app.extract(/^[a-z0-9]+\:\/\/?[^\/\\]+\/([^\/\\]+)/, path, 1);
}

function getPath(path)
{
	path = posixPath(path);

	return app.extract(/^[a-z0-9]+\:\/\/?[^\/\\]+\/(.+)/, path, 1);
}

function getPathWithoutShare(path)
{
	path = posixPath(path);

	return app.extract(/^[a-z0-9]+\:\/\/?[^\/\\]+\/[^\/\\]+\/(.+)/, path, 1);
}

function getPort(path)
{
	path = posixPath(path);

	return +app.extract(/^[a-z0-9]+\:\/\/?[^\/\\]+:([0-9]+)\//, path, 1);
}

function getAdress(path)
{
	path = posixPath(path);

	if(/^(?:smb|ftps?|sftp|ssh|scp|s3|webdavs?|opdsfs?)\:\//.test(path))
		return app.extract(/^((?:smb|ftps?|sftp|ssh|scp|s3|webdavs?|opdsfs?)\:\/\/[^\/\\]+)/, path, 1);

	return '';
}

function getTypeAdress(path)
{
	path = posixPath(path);

	if(/^(?:smb|s3)\:\//.test(path))
		return app.extract(/^((?:smb|s3)\:\/\/[^\/\\]+\/[^\/\\]+)/, path, 1);
	else if(/^(?:ftps?|sftp|ssh|scp|webdavs?|opdsfs?)\:\//.test(path))
		return app.extract(/^((?:ftps?|sftp|ssh|scp|webdavs?|opdsfs?)\:\/\/[^\/\\]+)/, path, 1);

	return '';
}

function posixPath(path)
{
	path = path.split(p.sep).join(p.posix.sep);
	return path.replace(/^(?:\.[\/\\]+)?([a-z0-9]+)\:[\/\\]{1,2}/, '$1://');
}

function fixPath(path)
{
	path = p.normalize(path).replace(/\/+$/, '');
	return path.replace(/^(?:\.[\/\\]+)?([a-z0-9]+)\:[\/\\]{1,2}/, '$1:'+p.sep+p.sep);
}

// Windows only
function fixStart(path)
{
	return path.replace(/^(?:\.[\/\\]+)/, '');
}

function isDomain(host)
{
	return /\./.test(host) ? true : false;
}

var serverLastError = false;

function _serverLastError(original = true, error = false)
{
	error = error || serverLastError;
	if(!error) return false;

	let message = error.message || error || 'Server Error';

	if(/connection/.test(message))
		message = language.servers.error.connection+(original ? '<br>'+message : '');
	if(/folder_not_found/.test(message))
		message = language.servers.error.folderNotFound+(original ? '<br>'+message : '');

	return message;
}

function existsSync(path)
{
	if(!fs.existsSync(path))
		return false;

	const stat = fs.statSync(path);

	if(stat.size === 0)
		return false;

	const isDownloading = p.join(p.dirname(path), sha1(path)+'-is-downloading.txt');

	if(fs.existsSync(isDownloading))
		return false;

	return true;
}

var closeServersST = {};

function closeServerST(adress)
{
	closeServersST[adress] = setTimeout(async function(adress) {

		console.log('Closing server: '+adress);

		await servers[adress].destroy();
		delete servers[adress];

	}, 60 * 10 * 1000, adress); // Close server connection after 10 minutes without using
}

async function read(path, _realPath)
{
	_realPath = _realPath || fileManager.realPath(path, -1);

	let adress = getTypeAdress(path);

	clearTimeout(closeServersST[adress]);
	closeServerST(adress);

	if(servers[adress])
		return servers[adress].read(path);

	servers[adress] = new client(adress);
	return servers[adress].read(path);
}

async function download(path, config = {}, callbackWhenFileDownload = false)
{
	let adress = getTypeAdress(path);

	clearTimeout(closeServersST[adress]);
	closeServerST(adress);

	if(servers[adress])
		return servers[adress].download(path, config, callbackWhenFileDownload);

	servers[adress] = new client(adress);
	return servers[adress].download(path, config, callbackWhenFileDownload);
}

var globalIsDownloading = {};

function existsOrDownloading(filePath)
{
	if(!globalIsDownloading[filePath] && !serverClient.existsSync(filePath))
		return false;

	return true;
}

var client = function(path) {

	this.path = path;

	this.sha = sha1(getAdress(path));
	this.tmp = p.join(tempFolder, this.sha);

	this.file = fileManager.fileCompressed(path);

	this.config = {

	};

	this._features = {
		smb: {
			read: true,
			single: true,
			progress: true,
			secure: false, // ??
		},
		ftp: {
			read: true,
			single: true,
			progress: true,
			secure: false,
		},
		ftps: {
			read: true,
			single: true,
			progress: true,
			secure: true,
		},
		ssh: {
			read: true,
			single: true,
			progress: true,
			secure: true,
		},
		scp: {
			read: true,
			single: true,
			progress: true,
			secure: true,
		},
		s3: {
			read: true,
			single: true,
			progress: true,
			secure: true,
		},
		webdav: {
			read: true,
			single: true,
			progress: true,
			secure: false,
		},
		webdavs: {
			read: true,
			single: true,
			progress: true,
			secure: true,
		},
		opdsf: {
			read: false,
			single: true,
			progress: true,
			secure: false,
		}
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
			if(/^(?:smb)\:\//.test(this.path))
				force = 'smb';
			else if(/^(?:ftp)\:\//.test(this.path))
				force = 'ftp';
			else if(/^(?:ftps)\:\//.test(this.path))
				force = 'ftps';
			else if(/^(?:sftp|ssh)\:\//.test(this.path))
				force = 'ssh';
			else if(/^(?:scp)\:\//.test(this.path))
				force = 'scp';
			else if(/^(?:s3)\:\//.test(this.path))
				force = 's3';
			else if(/^(?:webdav)\:\//.test(this.path))
				force = 'webdav';
			else if(/^(?:webdavs)\:\//.test(this.path))
				force = 'webdavs';
			else if(/^(?:opdsfs?)\:\//.test(this.path))
				force = 'opdsf';
		}

		this.features = this._features[force];
		this.features.ext = force;
		this.features[force] = true;

		return this.features;

	}

	this.snackbarError = function(key, error) {

		console.error(error);

		let message = _serverLastError(false, error);

		events.snackbar({
			key: key,
			text: message,
			duration: 2,
			buttons: [
				{
					text: language.buttons.dismiss,
					function: 'events.closeSnackbar();',
				},
			],
		});

	}

	this.cacheData = {};

	this.read = async function(path, config = {}) {

		this.updateConfig(config);
		this.getFeatures();

		let sha = sha1(serverClient.fixPath(path));
		let cacheFile = 'server-files-'+sha+'.json';

		let files = [];

		try
		{
			files = await this.readCurrent(path);

			let data = {time: app.time(), files: files};

			this.cacheData[cacheFile] = data;
			cache.writeJsonSync(cacheFile, data);

			serverLastError = false;
		}
		catch(error)
		{
			if(error.body)
			{
				console.error(error);
				error = 'folder_not_found';
			}
			else if(/request_timeout/.test(error.message))
			{
				console.error(error);
				error = 'connection';
			}

			this.snackbarError('serverReadError', error);

			serverLastError = error;
		}

		return files;
	}

	this.readCurrent = function(path) {

		if(this.features.smb)
			return this.readSmb(path);
		else if(this.features.ftp || this.features.ftps)
			return this.readFtp(path);
		else if(this.features.ssh)
			return this.readSsh(path);
		else if(this.features.scp)
			return this.readScp(path);
		else if(this.features.s3)
			return this.readS3(path);
		else if(this.features.webdav || this.features.webdavs)
			return this.readWebdav(path);
		else if(this.features.opdsf)
			return this.readOpds(path);

		return false;
	}

	this.queue = [];

	this.download = async function(path, config = {}, callbackWhenFileDownload = false) {

		if(fileManager.serverInOfflineMode()) return false;

		this.updateConfig(config);
		this.getFeatures();

		if(!fs.existsSync(this.tmp))
			fs.mkdirSync(this.tmp);

		if(!this.config.force)
		{
			let only = await this.checkIfAlreadyDownload();

			if(only === null)
				return true;
			else
				this.updateConfigOnly(only);
		}

		if(this.features.progress)
			this.file.setProgress(0);

		return this.downloadCurrent(path, callbackWhenFileDownload, template.contentRightIndex());
	}

	this.downloadCurrent = function(path, callbackWhenFileDownload = false, index = false) {

		if(this.features.smb)
			return this.downloadSmb(path, callbackWhenFileDownload, index);
		else if(this.features.ftp || this.features.ftps)
			return this.downloadFtp(path, callbackWhenFileDownload, index);
		else if(this.features.ssh)
			return this.downloadSsh(path, callbackWhenFileDownload, index);
		else if(this.features.scp)
			return this.downloadScp(path, callbackWhenFileDownload, index);
		else if(this.features.s3)
			return this.downloadS3(path, callbackWhenFileDownload, index);
		else if(this.features.webdav || this.features.webdavs)
			return this.downloadWebdav(path, callbackWhenFileDownload, index);
		else if(this.features.opdsf)
			return this.downloadOpds(path, callbackWhenFileDownload, index);

		return false;
	}

	this.whenDownloadFile = function(path, filePath, callbackWhenFileDownload = false) {

		globalIsDownloading[filePath] = false;
		const isDownloading = p.join(p.dirname(filePath), sha1(filePath)+'-is-downloading.txt');

		if(fs.existsSync(isDownloading))
			fs.rmSync(isDownloading);

		if(callbackWhenFileDownload)
		{
			let name = p.basename(path);

			let file = {
				name: name,
				path: path,
				folder: this.file.isFolder(path),
				compressed: this.file.isCompressed(name),
			};

			callbackWhenFileDownload(file);
		}

	}

	this.higherMtime = function(path, realPath) {

		let sha = sha1(serverClient.fixPath(p.dirname(path)));
		let cacheFile = 'server-files-'+sha+'.json';

		if(!this.cacheData[cacheFile])
			this.cacheData[cacheFile] = cache.readJson(cacheFile);

		if(!this.cacheData[cacheFile] || !this.cacheData[cacheFile].files) return true;

		let basename = p.basename(path);

		let file = false;

		for(let i = 0, len = this.cacheData[cacheFile].files.length; i < len; i++)
		{
			let _file = this.cacheData[cacheFile].files[i];

			if(_file.name == basename)
			{
				file = _file;
				break;
			}
		}

		if(file.mtime > fs.statSync(realPath).mtime.getTime())
		{
			fs.unlinkSync(realPath);

			return true;
		}

		return false;

	}

	this.checkIfAlreadyDownload = async function() {

		if(this.config.only)
		{
			let only = [];

			for(let path in this.config.only)
			{
				let realPath = fileManager.realPath(path, -1);

				if(!serverClient.existsSync(realPath) || this.higherMtime(path, realPath))
					only.push(path);
				else
					this.whenDownloadFile(path, realPath);
			}

			if(!only.length)
				return null;
			else
				return only;
		}
		else
		{
			return null;
		}

	}

	this.tasks = [];
	this.doingTask = 0;

	this.inTask = function(limit = 1) {

		if(this.doingTask >= limit)
		{
			let promiseResolve = false;

			let promise = new Promise(function(resolve, reject) {

				promiseResolve = resolve;

			});

			this.tasks.push({
				promise: promise,
				resolve: promiseResolve,
			});

			return promise;
		}

		return false;
	}

	this.setTask = function(fromPromise = false) {

		if(!fromPromise)
			this.doingTask++;

		let _this = this;

		return {resolve: function(){

			if(_this.tasks.length)
			{
				let task = _this.tasks.shift();
				task.resolve();
			}
			else
			{
				_this.doingTask--;
			}

		}}
	}

	this.downloading = {};

	this.isDownloading = function() {

		for(let path in this.downloading)
		{
			return this.downloading[path];
		}

		return false;
	}

	this.isDownloadingPath = function(path) {

		if(this.downloading[path])
			return this.downloading[path];

		return false;
	}

	this.setDownloading = function(path, filePath) {

		globalIsDownloading[filePath] = true;
		const isDownloading = p.join(p.dirname(filePath), sha1(filePath)+'-is-downloading.txt');

		fs.writeFileSync(isDownloading, '');

		let promiseResolve = false;

		let promise = new Promise(function(resolve, reject) {

			promiseResolve = resolve;

		});

		this.downloading[path] = promise;

		let _this = this;

		return {resolve: function(){

			delete _this.downloading[path];

			promiseResolve();

		}}
	}

	this.getServerInfo = function() {

		const self = this;
		const servers = storage.get('servers');

		let server = servers.find((server) => server.path === self.path);

		if(!server)
			server = servers.find((server) => server.path.startsWith(self.path));

		if(!server)
			throw new Error('server_not_found');

		return {
			host: getHost(server.path),
			port: getPort(server.path),
			domain: server.domain,
			user: server.user,
			pass: storage.safe.decrypt(server.pass),
			share: getShare(server.path),
			path: server.path,
		};

	}

	// SMB
	this.smb = false;

	this.connectSmb = async function() {

		if(this.smb) return this.smb;

		if(smb2 === false) smb2 = require('@awo00/smb2');

		this.smb = {
			client: false,
			session: false,
			tree: false,
		};

		let serverInfo;

		try
		{
			serverInfo = this.getServerInfo();
		}
		catch(error)
		{
			this.smb = false;

			throw new Error(error);
		}

		let client = {
			connectTimeout: 2000 * config.serverTimeoutMultiplier,
			//requestTimeout: 5000,
		};

		if(serverInfo.port) client.port = serverInfo.port;

		try
		{
			this.smb.client = new smb2.Client(serverInfo.host, client);

			let auth = {
				domain: serverInfo.domain || 'WORKGROUP',
			};

			if(serverInfo.user) auth.username = serverInfo.user;
			if(serverInfo.pass) auth.password = serverInfo.pass;

			this.smb.session = await this.smb.client.authenticate(auth);
			this.smb.tree = await this.smb.session.connectTree(serverInfo.share);
		}
		catch(error)
		{
			if(this.smb.client)
				await this.smb.client.close();

			this.smb = false;

			throw new Error('connection | '+error.message);
		}

		return this.smb;

	}

	this.readSmb = async function(path) {

		let files = [];

		console.time('readSmb');

		let smb = await this.connectSmb();

		let entries = await smb.tree.readDirectory(getPathWithoutShare(path));

		for(let i = 0, len = entries.length; i < len; i++)
		{
			let entry = entries[i];
			let name = p.normalize(entry.filename);

			files.push({name: name, path: p.join(path, name), folder: (entry.type === 'Directory' ? true : false), compressed: fileManager.isCompressed(name), mtime: entry.lastWriteTime.getTime()});
		}

		console.timeEnd('readSmb');

		return files;

	}

	this.downloadSmb = async function(_path, callbackWhenFileDownload, contentRightIndex) {

		let files = [];

		console.time('downloadSmb');

		let _this = this;
		let _only = this.config._only;

		let smb = await this.connectSmb();

		let promises = [];

		let progressIndex = 0;

		for(let i = 0, len = _only.length; i < len; i++)
		{
			let inTask = this.inTask(5);
			if(inTask) await inTask;

			let task = this.setTask(inTask);

			promises.push(new Promise(async function(resolve, reject) {

				let path = _only[i];

				let filePath = fileManager.realPath(path, -1);
				let folderPath = p.dirname(filePath);

				if(!fs.existsSync(folderPath))
					fs.mkdirSync(folderPath, {recursive: true});

				// Avoid downloading the same files at the same time
				if(!serverClient.existsOrDownloading(filePath))
				{
					let isDownloading = _this.isDownloadingPath(path);

					if(isDownloading)
					{
						await isDownloading;
					}
					else
					{
						let downloading = _this.setDownloading(path, filePath);

						let buffer = await smb.tree.readFile(getPathWithoutShare(path));
						await fsp.writeFile(filePath, buffer);

						downloading.resolve();
					}
				}

				progressIndex++;

				_this.file.setProgress(progressIndex / len, contentRightIndex);
				_this.whenDownloadFile(path, filePath, callbackWhenFileDownload);

				task.resolve();
				resolve();

			}));
		}

		await Promise.all(promises);

		this.file.setProgress(1, contentRightIndex);

		console.timeEnd('downloadSmb');

		return;

	}

	// FTP
	this.ftp = false;

	this.connectFtp = async function() {

		if(this.ftp) return this.ftp;

		if(basicFtp === false) basicFtp = require('basic-ftp');

		this.ftp = new basicFtp.Client(timeout = 5000 * config.serverTimeoutMultiplier);
		// this.ftp.ftp.verbose = true

		let serverInfo;

		try
		{
			serverInfo = this.getServerInfo();
		}
		catch(error)
		{
			this.ftp = false;

			throw new Error(error);
		}

		try
		{
			let client = {
				host: serverInfo.host,
				secure: this.features.secure,
				/*secureOptions: {
					host: serverInfo.host
				}*/
			};

			if(serverInfo.user) client.user = serverInfo.user;
			if(serverInfo.pass) client.password = serverInfo.pass;
			if(serverInfo.port) client.port = serverInfo.port;

			await this.ftp.access(client);
		}
		catch(error)
		{
			if(this.ftp)
				await this.ftp.close();

			this.ftp = false;

			throw new Error('connection | '+error.message);
		}

		return this.ftp;

	}

	this.readFtp = async function(path) {

		let files = [];

		console.time('readFtp');

		let ftp = await this.connectFtp();

		let inTask = this.inTask();
		if(inTask) await inTask;

		// Avoid reading multiples files at the same time
		let task = this.setTask(inTask);
		let entries = await ftp.list(getPath(path));
		task.resolve();

		for(let i = 0, len = entries.length; i < len; i++)
		{
			let entry = entries[i];
			let name = p.normalize(entry.name);

			if(entry.type === basicFtp.FileType.File || entry.type === basicFtp.FileType.Directory)
				files.push({name: name, path: p.join(path, name), folder: (entry.type === basicFtp.FileType.Directory ? true : false), compressed: fileManager.isCompressed(name), mtime: entry.modifiedAt.getTime()});
		}

		console.timeEnd('readFtp');

		return files;

	}

	this.downloadFtp = async function(_path, callbackWhenFileDownload, contentRightIndex) {

		let files = [];

		console.time('downloadFtp');

		let _only = this.config._only;

		let ftp = await this.connectFtp();

		for(let i = 0, len = _only.length; i < len; i++)
		{
			let inTask = this.inTask();
			if(inTask) await inTask;

			let task = this.setTask(inTask);

			this.file.setProgress(i / len, contentRightIndex);

			let path = _only[i];

			let filePath = fileManager.realPath(path, -1);
			let folderPath = p.dirname(filePath);

			if(!fs.existsSync(folderPath))
				fs.mkdirSync(folderPath, {recursive: true});

			// Avoid downloading multiples files at the same time
			if(!serverClient.existsOrDownloading(filePath))
			{
				let isDownloading = this.isDownloadingPath(path);

				if(isDownloading)
				{
					await isDownloading;
				}
				else
				{
					let downloading = this.setDownloading(path, filePath);

					await ftp.downloadTo(filePath, getPath(path))

					downloading.resolve();
				}
			}

			this.whenDownloadFile(path, filePath, callbackWhenFileDownload);

			task.resolve();
		}

		this.file.setProgress(1, contentRightIndex);

		console.timeEnd('downloadFtp');

		return;

	}


	// SSH
	this.ssh = false;

	this.connectSsh = async function() {

		if(this.ssh) return this.ssh;

		if(ssh2 === false) ssh2 = require('ssh2-sftp-client');

		this.ssh = new ssh2();

		let serverInfo;

		try
		{
			serverInfo = this.getServerInfo();
		}
		catch(error)
		{
			this.ssh = false;

			throw new Error(error);
		}

		try
		{
			let client = {
				host: serverInfo.host,
				readyTimeout: 5000 * config.serverTimeoutMultiplier,
				keepalive: 15 * 60 * 1000,
				// debug: function(debug){console.log(debug)}
			};

			if(serverInfo.user) client.username = serverInfo.user;
			if(serverInfo.pass) client.password = serverInfo.pass;
			if(serverInfo.port) client.port = serverInfo.port;

			await this.ssh.connect(client);
		}
		catch(error)
		{
			if(this.ssh)
				await this.ssh.end();

			this.ssh = false;

			throw new Error('connection | '+error.message);
		}

		return this.ssh;

	}

	this.readSsh = async function(path) {

		let files = [];

		console.time('readSsh');

		let ssh = await this.connectSsh();

		let entries = await ssh.list('/'+getPath(path));

		for(let i = 0, len = entries.length; i < len; i++)
		{
			let entry = entries[i];
			let name = p.normalize(entry.name);

			files.push({name: name, path: p.join(path, name), folder: (entry.type === 'd' ? true : false), compressed: fileManager.isCompressed(name), mtime: entry.modifyTime});
		}

		console.timeEnd('readSsh');

		return files;

	}

	this.downloadSsh = async function(_path, callbackWhenFileDownload, contentRightIndex) {

		let files = [];

		let _this = this;
		let _only = this.config._only;

		let ssh = await this.connectSsh();

		let promises = [];

		let progressIndex = 0;

		for(let i = 0, len = _only.length; i < len; i++)
		{
			let inTask = this.inTask(20);
			if(inTask) await inTask;

			let task = this.setTask(inTask);

			promises.push(new Promise(async function(resolve, reject) {

				let path = _only[i];

				let filePath = fileManager.realPath(path, -1);
				let folderPath = p.dirname(filePath);

				if(!fs.existsSync(folderPath))
					fs.mkdirSync(folderPath, {recursive: true});

				// Avoid downloading the same files at the same time
				if(!serverClient.existsOrDownloading(filePath))
				{
					let isDownloading = _this.isDownloadingPath(path);

					if(isDownloading)
					{
						await isDownloading;
					}
					else
					{
						let downloading = _this.setDownloading(path, filePath);

						await ssh.fastGet('/'+getPath(path), filePath, {
							step: function(transferred, chunk, total) {

								progressIndex += chunk / total;

								_this.file.setProgress(progressIndex / len, contentRightIndex);

							}
						});

						downloading.resolve();
					}
				}

				_this.file.setProgress(progressIndex / len, contentRightIndex);
				_this.whenDownloadFile(path, filePath, callbackWhenFileDownload);

				task.resolve();
				resolve();

			}));
		}

		await Promise.all(promises);

		this.file.setProgress(1, contentRightIndex);

		console.timeEnd('downloadSsh');

		return;

	}


	// SCP
	this.scp = false;

	this.connectScp = async function() {

		if(this.scp) return this.scp;

		if(nodeScp === false) nodeScp = require('node-scp');

		let serverInfo;

		try
		{
			serverInfo = this.getServerInfo();
		}
		catch(error)
		{
			this.scp = false;

			throw new Error(error);
		}

		try
		{
			let client = {
				host: serverInfo.host,
				readyTimeout: 5000 * config.serverTimeoutMultiplier,
				keepalive: 15 * 60 * 1000,
			};

			if(serverInfo.user) client.username = serverInfo.user;
			if(serverInfo.pass) client.password = serverInfo.pass;
			if(serverInfo.port) client.port = serverInfo.port;

			this.scp = nodeScp.Client(client);
			await this.scp;
		}
		catch(error)
		{
			if(this.scp)
				await this.scp.close();

			this.scp = false;

			throw new Error('connection | '+error.message);
		}

		return this.scp;

	}

	this.readScp = async function(path) {

		let files = [];

		console.time('readScp');

		let scp = await this.connectScp();

		let entries = await scp.list('/'+getPath(path));

		for(let i = 0, len = entries.length; i < len; i++)
		{
			let entry = entries[i];
			let name = p.normalize(entry.name);

			files.push({name: name, path: p.join(path, name), folder: (entry.type === 'd' ? true : false), compressed: fileManager.isCompressed(name), mtime: entry.modifyTime});
		}

		console.timeEnd('readScp');

		return files;

	}

	this.downloadScp = async function(_path, callbackWhenFileDownload, contentRightIndex) {

		let files = [];

		console.time('downloadScp');

		let _this = this;
		let _only = this.config._only;

		let scp = await this.connectScp();

		let promises = [];

		let progressIndex = 0;

		for(let i = 0, len = _only.length; i < len; i++)
		{
			let inTask = this.inTask(20);
			if(inTask) await inTask;

			let task = this.setTask(inTask);

			promises.push(new Promise(async function(resolve, reject) {

				let path = _only[i];

				let filePath = fileManager.realPath(path, -1);
				let folderPath = p.dirname(filePath);

				if(!fs.existsSync(folderPath))
					fs.mkdirSync(folderPath, {recursive: true});

				// Avoid downloading the same files at the same time
				if(!serverClient.existsOrDownloading(filePath))
				{
					let isDownloading = _this.isDownloadingPath(path);

					if(isDownloading)
					{
						await isDownloading;
					}
					else
					{
						let downloading = _this.setDownloading(path, filePath);

						await scp.downloadFile('/'+getPath(path), filePath);

						downloading.resolve();
					}
				}

				progressIndex++;

				_this.file.setProgress(progressIndex / len, contentRightIndex);
				_this.whenDownloadFile(path, filePath, callbackWhenFileDownload);

				task.resolve();
				resolve();

			}));
		}

		await Promise.all(promises);

		this.file.setProgress(1, contentRightIndex);

		console.timeEnd('downloadScp');

		return;

	}


	// S3
	this.s3 = false;

	this.connectS3 = async function() {

		if(this.s3) return this.s3;

		if(s3c === false)
		{
			let {S3Client, ListObjectsV2Command, GetObjectCommand} = require('@aws-sdk/client-s3');

			s3c = {
				Client: S3Client,
				List: ListObjectsV2Command,
				Get: GetObjectCommand,
			};
		}

		this.s3 = {
			client: false,
			bucket: false,
		};

		let serverInfo;

		try
		{
			serverInfo = this.getServerInfo();
		}
		catch(error)
		{
			this.s3 = false;

			throw new Error(error);
		}

		try
		{
			let client = {};

			if(isDomain(serverInfo.host))
			{
				client.endpoint = 'https://'+serverInfo.host;
				client.forcePathStyle = true;
				client.s3BucketEndpoint = true;
				client.region = app.extract(/^([^\/\\:\.]{3,})/, serverInfo.host) || app.extract(/^[^\/\\:\.]+\.([^\/\\:\.]{3,})/, serverInfo.host);
			}
			else
			{
				client.region = serverInfo.host;
			}

			if(serverInfo.user || serverInfo.pass) client.credentials = {}
			if(serverInfo.user) client.credentials.accessKeyId = serverInfo.user;
			if(serverInfo.pass) client.credentials.secretAccessKey = serverInfo.pass;

			this.s3 = {
				client: new s3c.Client(client),
				bucket: serverInfo.share,
			};
		}
		catch(error)
		{
			if(this.s3)
				delete this.s3;

			this.s3 = false;

			throw new Error('connection | '+error.message);
		}

		return this.s3;

	}

	this.readS3 = async function(path) {

		let files = [];

		console.time('readS3');

		let s3 = await this.connectS3();

		let base = posixPath(getPathWithoutShare(path));
		let nextContinuationToken = false;

		for(let page = 0; page < 10; page++) // Get max 10000 files
		{
			let params = {
				Bucket: s3.bucket,
				Prefix: base ? base+'/' : '',
				Delimiter: '/',
			};

			if(nextContinuationToken)
				params.ContinuationToken = nextContinuationToken;

			let entries = await s3.client.send(new s3c.List(params));

			if(entries.Contents)
			{
				for(let i = 0, len = entries.Contents.length; i < len; i++)
				{
					let entry = entries.Contents[i];
					let name = fileManager.removePathPart(entry.Key, base).replace(/\/$/, '').replace(/^\//, '');

					let folder = /\/$/.test(entry.Key);

					if(name && !/\/./.test(name))
					{
						name = p.normalize(name);
						files.push({name: name, path: p.join(path, name), folder: folder, compressed: fileManager.isCompressed(name), mtime: entry.LastModified.getTime()});
					}
				}
			}

			if(entries.CommonPrefixes)
			{
				for(let i = 0, len = entries.CommonPrefixes.length; i < len; i++)
				{
					let entry = entries.CommonPrefixes[i];
					let name = fileManager.removePathPart(entry.Prefix, base).replace(/\/$/, '').replace(/^\//, '');

					if(name && !/\/./.test(name))
					{
						name = p.normalize(name);
						files.push({name: name, path: p.join(path, name), folder: true, compressed: false, mtime: 0});
					}
				}
			}

			if(!entries.NextContinuationToken)
				break;

			nextContinuationToken = entries.NextContinuationToken;
		}

		console.timeEnd('readS3');

		return files;

	}

	this.downloadS3 = async function(_path, callbackWhenFileDownload, contentRightIndex) {

		let files = [];

		console.time('downloadS3');

		let _this = this;
		let _only = this.config._only;

		let s3 = await this.connectS3();

		let promises = [];

		let progressIndex = 0;

		for(let i = 0, len = _only.length; i < len; i++)
		{
			let inTask = this.inTask(5);
			if(inTask) await inTask;

			let task = this.setTask(inTask);

			promises.push(new Promise(async function(resolve, reject) {

				let path = _only[i];

				let filePath = fileManager.realPath(path, -1);
				let folderPath = p.dirname(filePath);

				if(!fs.existsSync(folderPath))
					fs.mkdirSync(folderPath, {recursive: true});

				// Avoid downloading the same files at the same time
				if(!serverClient.existsOrDownloading(filePath))
				{
					let isDownloading = _this.isDownloadingPath(path);

					if(isDownloading)
					{
						await isDownloading;
					}
					else
					{
						let downloading = _this.setDownloading(path, filePath);

						let params = {
							Bucket: s3.bucket,
							Key: posixPath(getPathWithoutShare(path)),
						};

						let response = await s3.client.send(new s3c.Get(params));
						let fileStream = fs.createWriteStream(filePath);
						response.Body.pipe(fileStream);

						await new Promise(function(resolve, reject) {

							fileStream.on('finish', resolve);
							fileStream.on('error', reject);

						});

						downloading.resolve();
					}
				}

				progressIndex++;

				_this.file.setProgress(progressIndex / len, contentRightIndex);
				_this.whenDownloadFile(path, filePath, callbackWhenFileDownload);

				task.resolve();
				resolve();

			}));
		}

		await Promise.all(promises);

		this.file.setProgress(1, contentRightIndex);

		console.timeEnd('downloadS3');

		return;

	}

	// webdav
	this.webdav = false;

	this.connectWebdav = async function() {

		if(this.webdav) return this.webdav;

		if(webdav === false)
			webdav = await loadWebdav();

		let serverInfo;

		try
		{
			serverInfo = this.getServerInfo();
		}
		catch(error)
		{
			this.webdav = false;

			throw new Error(error);
		}

		try
		{
			let client = {};

			client.authType = webdav.AuthType.Auto;
			if(serverInfo.user) client.username = serverInfo.user;
			if(serverInfo.pass) client.password = serverInfo.pass;

			this.webdav = webdav.createClient('http'+(this.features.secure ? 's' : '')+'://'+serverInfo.host+(serverInfo.port ? ':'+serverInfo.port : ''), client);
		}
		catch(error)
		{
			this.webdav = false;

			throw new Error('connection | '+error.message);
		}

		return this.webdav;

	}

	this.readWebdav = async function(path) {

		let files = [];

		console.time('readWebdav');

		let webdav = await this.connectWebdav();

		let entries = await webdav.getDirectoryContents('/'+getPath(path));

		for(let i = 0, len = entries.length; i < len; i++)
		{
			let entry = entries[i];
			let name = p.normalize(entry.basename);

			files.push({name: name, path: p.join(path, name), folder: (entry.type === 'directory' ? true : false), compressed: fileManager.isCompressed(name), mtime: Date.parse(entry.lastmod)});
		}

		console.timeEnd('readWebdav');

		return files;

	}

	this.downloadWebdav = async function(_path, callbackWhenFileDownload, contentRightIndex) {

		let files = [];

		console.time('downloadWebdav');

		let _this = this;
		let _only = this.config._only;

		let webdav = await this.connectWebdav();

		let promises = [];

		let progressIndex = 0;

		for(let i = 0, len = _only.length; i < len; i++)
		{
			let inTask = this.inTask(5);
			if(inTask) await inTask;

			let task = this.setTask(inTask);

			promises.push(new Promise(async function(resolve, reject) {

				let path = _only[i];

				let filePath = fileManager.realPath(path, -1);
				let folderPath = p.dirname(filePath);

				if(!fs.existsSync(folderPath))
					fs.mkdirSync(folderPath, {recursive: true});

				// Avoid downloading the same files at the same time
				if(!serverClient.existsOrDownloading(filePath))
				{
					let isDownloading = _this.isDownloadingPath(path);

					if(isDownloading)
					{
						await isDownloading;
					}
					else
					{
						let downloading = _this.setDownloading(path, filePath);

						const fileContents = await webdav.getFileContents('/'+posixPath(getPath(path)), {format: 'binary'});
						await fsp.writeFile(filePath, Buffer.from(fileContents));

						downloading.resolve();
					}
				}

				progressIndex++;

				_this.file.setProgress(progressIndex / len, contentRightIndex);
				_this.whenDownloadFile(path, filePath, callbackWhenFileDownload);

				task.resolve();
				resolve();

			}));
		}

		await Promise.all(promises);

		this.file.setProgress(1, contentRightIndex);

		console.timeEnd('downloadWebdav');

		return;

	}


	// opds
	this.readOpds = async function(path) {

		return [];

	}

	this.downloadOpds = async function(_path, callbackWhenFileDownload, contentRightIndex) {

		const files = [];
		const _this = this;
		const _only = this.config._only;

		const promises = [];

		let progressIndex = 0;

		console.time('downloadOpds');

		for(let i = 0, len = _only.length; i < len; i++)
		{
			const inTask = this.inTask(20);
			if(inTask) await inTask;

			const task = this.setTask(inTask);

			promises.push(new Promise(async function(resolve, reject) {

				const path = _only[i];

				const filePath = fileManager.realPath(path, -1);
				const folderPath = p.dirname(filePath);

				if(!fs.existsSync(folderPath))
					fs.mkdirSync(folderPath, {recursive: true});

				// Avoid downloading the same files at the same time
				if(!serverClient.existsOrDownloading(filePath))
				{
					const isDownloading = _this.isDownloadingPath(path);

					if(isDownloading)
					{
						await isDownloading;
					}
					else
					{
						const downloading = _this.setDownloading(path, filePath);

						const dirname = p.dirname(path);
						const basename = p.basename(path).replace(/\.[^\.]*$/, '');

						let url = p.join(dirname, opds.opds.atob(basename));
						url = posixPath(url).replace(/^opdsf/, 'http');

						const response = await opds.auth.fetch(url);

						if(response.ok)
						{
							const fileContents = await response.arrayBuffer();
							await fsp.writeFile(filePath, Buffer.from(fileContents));
						}

						downloading.resolve();
					}
				}

				progressIndex++;

				_this.file.setProgress(progressIndex / len, contentRightIndex);
				_this.whenDownloadFile(path, filePath, callbackWhenFileDownload);

				task.resolve();
				resolve();

			}));
		}

		await Promise.all(promises);

		this.file.setProgress(1, contentRightIndex);

		console.timeEnd('downloadOpds');

		return;

	}

	this.destroy = async function() {

		if(this.file) this.file.destroy();
		if(this.smb) await this.smb.client.close();
		if(this.ftp) await this.ftp.close();
		if(this.ssh) await this.ssh.end();
		if(this.scp) await this.scp.close();
		if(this.s3) delete this.s3;
		if(this.webdav) delete this.webdav;
		//if(this.opds) delete this.opds;

	}

}

module.exports = {
	read: read,
	download: download,
	getHost: getHost,
	getBaseUrl: getBaseUrl,
	getShare: getShare,
	getPath: getPath,
	getPathWithoutShare: getPathWithoutShare,
	getPort: getPort,
	getAdress: getAdress,
	getTypeAdress: getTypeAdress,
	fixPath: fixPath,
	fixStart: fixStart,
	posixPath: posixPath,
	servers: function(){return servers},
	serverLastError: _serverLastError,
	existsOrDownloading: existsOrDownloading,
	existsSync: existsSync,
}