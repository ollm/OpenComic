var threads = false;
var workers = {};
var promisses = {};
var queue = [];

function clean(job = false)
{
	if(job)
	{
		for(let i = 0, len = queue.length; i < len; i++)
		{
			const item = queue[i];

			if(item.options.job === job)
			{
				queue.splice(i, 1);
				promisses[item.options.key].resolve(false);
				delete promisses[item.options.key];

				i--;
				len--;
			}
		}
	}
	else
	{
		queue = [];
		promisses = {};
	}
}

async function addToQueue(options, promise)
{
	if(options.priorize)
	{
		queue.unshift({
			options: options,
			promise: promise,
		});
	}
	else
	{
		queue.push({
			options: options,
			promise: promise,
		});
	}

	processQueue();
}

function processQueue()
{
	if(!threads)
		threads = os.cpus().length || 1;

	for(let thread = 0; thread < threads; thread++)
	{
		const status = processJob(thread);
		if(status === null) break;
	}
}

function processJob(thread = 0)
{
	const worker = getWorker(thread);

	if(worker.busy)
		return false;

	if(!queue.length)
	{
		if(!worker.setTimeout)
		{
			worker.setTimeout = setTimeout(function(){

				closeWorker(thread);

			}, 10000);
		}

		return null;
	}

	if(worker.setTimeout)
		clearTimeout(worker.setTimeout);

	const job = queue.shift();

	if(job.options.useThreads < 1 && thread !== 0)
	{
		const useThreads = thread / threads;

		if(useThreads > job.options.useThreads)
		{
			queue.unshift(job);
			return null;
		}
	}

	if(job.options.prework)
	{
		job.options.prework(job.options);
		delete job.options.prework;
	}

	worker.busy = true;
	worker.currentJob = job;
	worker.worker.postMessage(job.options);
}

function getWorker(thread = 0)
{
	if(workers[thread])
		return workers[thread];

	const worker = new Worker(p.join(appDir, 'scripts/worker.js'));

	worker.addEventListener('message', function(result) {

		workerMessage(thread, result);

	});

	workers[thread] = {
		thread: thread,
		worker: worker,
		busy: false,
		currentJob: false,
		setTimeout: false,
	};

	return workers[thread];
}

function closeWorker(thread = 0)
{
	if(!workers[thread])
		return;

	console.log('Closing worker', thread);

	workers[thread].worker.terminate();
	delete workers[thread];
}

function workerMessage(thread, result)
{
	const worker = workers[thread];

	delete promisses[worker.currentJob.options.key];
	worker.currentJob.promise.resolve(result.data);
	worker.currentJob = false;
	worker.busy = false;

	processJob(thread);
}

function work(options = {})
{
	if(promisses[options.key])
		return promisses[options.key].promise;

	let resolve = false;
	let reject = false;

	const promise = new Promise(function(_resolve, _reject) {

		resolve = _resolve;
		reject = _reject;

	});

	const _promise = {
		promise: promise,
		resolve: resolve,
		reject: reject,
	};

	promisses[options.key] = _promise;

	addToQueue(options, _promise);

	return promise;

}

/*function float32To16Array(uint8Buffer)
{
	const floatData = new Float32Array(uint8Buffer.buffer);
	const uint16Data = new Uint16Array(floatData.length);

	let max = 1;
	let min = 0;

	for(let i = 0, len = floatData.length; i < len; i++)
	{
		if(floatData[i] > max)
			max = floatData[i];
		else if(floatData[i] < min)
			min = floatData[i];
	}

	const multiplier = 65535 / (max - min);

	for(let i = 0, len = floatData.length; i < len; i++)
	{
		uint16Data[i] = Math.round((floatData[i] - min) * multiplier);
	}

	return uint16Data;
}*/

function float32To16Array(uint8Buffer)
{
	const floatData = new Float32Array(uint8Buffer.buffer);
	const uint16Data = new Uint16Array(floatData.length);

	for(let i = 0, len = floatData.length; i < len; i++)
	{
		const clamped = Math.max(0, Math.min(1, floatData[i]));
		uint16Data[i] = Math.round(clamped * 65535);
	}

	return uint16Data;
}

function convertBuffer(buffer, bits, bitsString = false)
{
	if(bits >= 32 && bitsString.toLowerCase() === '32float')
		buffer = float32To16Array(buffer);
	else if(bits >= 32)
		buffer = new Uint16Array(new Uint32Array(buffer.buffer));
	else if(bits >= 16)
		buffer = new Uint16Array(buffer.buffer);

	return buffer;
}

async function convertImage(path, options = {})
{
	const pngPath = fileManager.realPath(path);
	const realPath = fileManager.realPath(path, -1);

	fileManager.setTmpUsage(pngPath);

	if(fs.existsSync(pngPath))
		return pngPath;

	const result = await work({
		job: 'convertImage',
		key: 'convertImage-'+realPath,
		path: realPath,
		mime: mime.getType(realPath),
		priorize: options.priorize || false,
		useThreads: options.useThreads || 1,
		prework: function(options){

			fileManager.macosStartAccessingSecurityScopedResource(options.path);

		}
	});

	const parentPath = p.dirname(pngPath);

	if(!fs.existsSync(parentPath))
		fs.mkdirSync(parentPath);

	if(result.buffer)
	{
		const bits = result.bits;

		if(bits > 8 && (result.buffer instanceof Uint8Array || result.buffer instanceof Uint8ClampedArray))
			result.buffer = convertBuffer(result.buffer, bits, result.bitsString);

		const raw = {
			width: result.width,
			height: result.height,
			channels: result.channels,
			rgb16: bits > 8 ? true : false,
			premultiplied: result.premultiplied || false,
		};

		await image.rawToPng(result.buffer, pngPath, raw, {
			compressionLevel: 2,
			removeAlpha: result.removeAlpha,
		});

		return pngPath;
	}
	else if(result.png && result.png instanceof Uint8Array)
	{
		fs.writeFileSync(pngPath, Buffer.from(result.png), function(){});

		return pngPath;
	}

	if(result.error)
	{
		console.error(result.error);
		return false;
	}

	return false;
}

async function convertImageToBlob(path, options = {})
{
	const realPath = fileManager.realPath(path, -1);
	const blob = fileManager.getBlob(realPath);

	if(blob)
		return blob;

	const result = await work({
		job: 'convertImageToBlob',
		key: 'convertImageToBlob-'+realPath,
		path: realPath,
		mime: mime.getType(realPath),
		priorize: options.priorize || false,
		useThreads: options.useThreads || 1,
		prework: function(options){

			fileManager.macosStartAccessingSecurityScopedResource(options.path);

		}
	});

	if(result.buffer)
	{
		const bits = result.bits;

		if(bits > 8 && (result.buffer instanceof Uint8Array || result.buffer instanceof Uint8ClampedArray))
			result.buffer = convertBuffer(result.buffer, bits, result.bitsString);

		const raw = {
			width: result.width,
			height: result.height,
			channels: result.channels,
			rgb16: bits > 8 ? true : false,
			premultiplied: result.premultiplied || false,
		};

		const buffer = await image.rawToBuffer(result.buffer, raw, {
			compressionLevel: 0,
			removeAlpha: result.removeAlpha,
		});

		return fileManager.bufferToBlob(realPath, buffer, 'image/png');
	}
	else if(result.png && result.png instanceof Uint8Array)
	{
		return fileManager.bufferToBlob(realPath, result.png, 'image/png');
	}

	return false;
}

module.exports = {
	convertImage: convertImage,
	convertImageToBlob: convertImageToBlob,
	clean: clean,
}