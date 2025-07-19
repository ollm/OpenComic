var threads = false;
var threadsList = {};

var queues = {default: {
	list: [],
	keys: new Set(),
	stop: false,
	onEnd: false,
}};

var stats = {};

function num()
{
	if(!threads)
		threads = os.cpus().length || 1;

	return threads;
}

async function job(key = 'default', options = {}, callback = false)
{
	if(options.delay)
		await app.sleep(options.delay);

	const _arguments = [];

	for(let i = 3, len = arguments.length; i < len; i++)
	{
		_arguments.push(arguments[i]);
	}

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

	addToQueue(key, options, callback, _arguments, _promise);

	return promise;
}

function getQueue(key)
{
	if(!queues[key])
	{
		queues[key] = {
			stop: false,
			list: [],
			keys: new Set(),
			onEnd: false,
		};
	}

	return queues[key];
}

function addToQueue(key, options, callback, _arguments, promise)
{
	if(!stats[key]) stats[key] = {done: 0};

	const queue = getQueue(key);

	if(options.key)
	{
		if(queue.keys.has(options.key))
			return;

		queue.keys.add(options.key);
	}

	if(options.priorize)
	{
		queue.list.unshift({
			options: options,
			callback: callback,
			arguments: _arguments,
			promise: promise,
		});
	}
	else
	{
		queue.list.push({
			options: options,
			callback: callback,
			arguments: _arguments,
			promise: promise,
		});
	}

	processQueue(key);
}

function processQueue(key = 'default')
{
	num();

	const queue = getQueue(key);

	if(queue.stop)
		return;

	for(let thread = 0; thread < threads; thread++)
	{
		const status = processJob(key, thread);
		if(status === null) break;
	}
}

function processJob(key = 'default', _thread = 0)
{
	const queue = getQueue(key);

	if(queue.stop)
		return;

	const thread = getThread(key, _thread);

	if(thread.busy)
		return false;

	if(!queue.list.length)
	{
		checkEnd(key);
		return null;
	}

	const job = queue.list.shift();

	if(job.options.useThreads < 1 && _thread !== 0)
	{
		const useThreads = _thread / threads;

		if(useThreads > job.options.useThreads)
		{
			queue.list.unshift(job);
			return null;
		}
	}

	thread.busy = true;
	thread.currentJob = job;
	startJob(thread);
}

async function startJob(thread)
{
	const currentJob = thread.currentJob;

	try
	{
		const result = await currentJob.callback(...currentJob.arguments);

		thread.currentJob.promise.resolve(result);
		thread.currentJob = false;
		thread.busy = false;

		stats[thread.key].done++;

		processJob(thread.key, thread.thread);
	}
	catch(error)
	{
		thread.currentJob.promise.reject(error);
		thread.currentJob = false;
		thread.busy = false;

		processJob(thread.key, thread.thread);
	}

	if(currentJob.options.key)
	{
		const queue = getQueue(thread.key);
		queue.keys.delete(currentJob.options.key);
	}

}

function getThread(key = 'default', thread = 0)
{
	if(!threadsList[key]) threadsList[key] = {};

	if(threadsList[key][thread])
		return threadsList[key][thread];

	threadsList[key][thread] = {
		key: key,
		thread: thread,
		busy: false,
		currentJob: false,
	};

	return threadsList[key][thread];
}

function stop(key = 'default')
{
	const queue = getQueue(key);
	queue.stop = true;
}

function resume(key = 'default')
{
	const queue = getQueue(key);
	queue.stop = false;
	processQueue(key);
}

function clean(key = 'default')
{
	const queue = getQueue(key);
	queue.list = [];
	queue.keys = new Set();
}

function checkEnd(key = 'default')
{
	const queue = getQueue(key);

	if(queue.onEnd)
	{
		queue.onEnd();
		queue.onEnd = false;
	}
}

function end(key, callback)
{
	const queue = getQueue(key);
	queue.onEnd = callback;
}

function getStats(key = false)
{
	const _stats = {};

	for(let key in queues)
	{
		const list = Object.values(threadsList[key] ?? {});

		_stats[key] = {
			key: key,
			done: stats[key]?.done || 0,
			busy: list.filter(thread => thread.busy).length,
			queue: queues[key],
			queueLength: queues[key]?.list?.length,
			threads: (!list.length || list.length === threads) ? list.length : list.length - 1,
		};
	}

	return key ? _stats[key] : _stats;
}

function sumStats()
{
	const sum = {
		done: 0,
		busy: 0,
		queue: 0,
		threads: 0,
	};

	const stats = getStats();

	for(let key in stats)
	{
		const stat = stats[key];

		sum.done += stat.done;
		sum.busy += stat.busy;
		sum.queue += stat.queue;
		sum.threads += stat.threads;
	}

	return sum;
}

module.exports = {
	num: num,
	job: job,
	stop: stop,
	resume: resume,
	clean: clean,
	end: end,
	stats: getStats,
	sumStats: sumStats,
}