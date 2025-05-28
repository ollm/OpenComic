var threads = false;
var threadsList = {};
var queue = {default: []};
var queueIsStop = {default: false};
var stats = {};
var onEnd = {};

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

function addToQueue(key, options, callback, _arguments, promise)
{
	if(!queue[key]) queue[key] = [];
	if(!stats[key]) stats[key] = {done: 0};

	if(options.priorize)
	{
		queue[key].unshift({
			options: options,
			callback: callback,
			arguments: _arguments,
			promise: promise,
		});
	}
	else
	{
		queue[key].push({
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

	if(queueIsStop[key])
		return;

	for(let thread = 0; thread < threads; thread++)
	{
		const status = processJob(key, thread);
		if(status === null) break;
	}
}

function processJob(key = 'default', _thread = 0)
{
	if(queueIsStop[key])
		return;

	const thread = getThread(key, _thread);

	if(thread.busy)
		return false;

	const _queue = queue[key] || [];

	if(!_queue.length)
	{
		checkEnd(key);
		return null;
	}

	const job = _queue.shift();

	if(job.options.useThreads < 1 && _thread !== 0)
	{
		const useThreads = _thread / threads;

		if(useThreads > job.options.useThreads)
		{
			_queue.unshift(job);
			return null;
		}
	}

	thread.busy = true;
	thread.currentJob = job;
	startJob(thread);
}

async function startJob(thread)
{
	try
	{
		const result = await thread.currentJob.callback(...thread.currentJob.arguments);

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
	queueIsStop[key] = true;
}

function resume(key = 'default')
{
	queueIsStop[key] = false;
	processQueue(key);
}

function clean(key = 'default')
{
	queue[key] = [];
}

function checkEnd(key = 'default')
{
	if(onEnd[key])
	{
		onEnd[key]();
		onEnd[key] = false;
	}
}

function end(key, callback)
{
	onEnd[key] = callback;
}

function getStats(key = false)
{
	const _stats = {};

	for(let key in queue)
	{
		const list = Object.values(threadsList[key] ?? {});

		_stats[key] = {
			key: key,
			done: stats[key]?.done || 0,
			busy: list.filter(thread => thread.busy).length,
			queue: queue[key]?.length,
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