var cpus = false;
var workers = {};
var promisses = {};
var queue = [];

async function addToQueue(options, promise)
{
	queue.push({
		options: options,
		promise: promise,
	});

	processQueue();
}

function processQueue()
{
	if(!cpus)
		cpus = os.cpus().length || 1;

	for(let cpu = 0; cpu < cpus; cpu++)
	{
		const status = processJob(cpu);
		if(status === null) break;
	}
}

function processJob(cpu = 0)
{
	const worker = getWorker(cpu);

	if(worker.busy)
		return false;

	if(!queue.length)
	{
		if(!worker.setTimeout)
		{
			worker.setTimeout = setTimeout(function(){

				closeWorker(cpu);

			}, 10000);
		}

		return null;
	}

	if(worker.setTimeout)
		clearTimeout(worker.setTimeout);

	const job = queue.shift();

	worker.busy = true;
	worker.currentJob = job;
	worker.worker.postMessage(job.options);
}

function getWorker(cpu = 0)
{
	if(workers[cpu])
		return workers[cpu];

	const worker = new Worker(p.join(appDir, 'scripts/worker.js'));

	worker.addEventListener('message', function(result) {

		workerMessage(cpu, result);

	});

	workers[cpu] = {
		cpu: cpu,
		worker: worker,
		busy: false,
		currentJob: false,
		setTimeout: false,
	};

	return workers[cpu];
}

function closeWorker(cpu = 0)
{
	if(!workers[cpu])
		return;

	console.log('Closing worker', cpu);

	workers[cpu].worker.terminate();
	delete workers[cpu];
}

function workerMessage(cpu, result)
{
	const worker = workers[cpu];

	delete promisses[worker.currentJob.options.key];
	worker.currentJob.promise.resolve(result.data);
	worker.currentJob = false;
	worker.busy = false;

	processJob(cpu);
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

async function convertImage(path)
{
	const webpPath = fileManager.realPath(path);
	const realPath = fileManager.realPath(path, -1);

	fileManager.setTmpUsage(webpPath);

	if(fs.existsSync(webpPath))
		return webpPath;

	const result = await work({
		job: 'convertImage',
		key: 'convertImage-'+realPath,
		path: realPath,
		mime: mime.getType(realPath),
	});

	if(result.buffer)
	{
		const parentPath = p.dirname(webpPath);

		if(!fs.existsSync(parentPath))
			fs.mkdirSync(parentPath);

		await image.rawToPng(result.buffer, webpPath, result.width, result.height, result.channels, {
			compressionLevel: 2,
		});

		return webpPath;
	}

	if(result.error)
	{
		console.error(result.error);
		return false;
	}

	return true;
}

module.exports = {
	convertImage: convertImage,
}