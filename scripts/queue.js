var queued = {}, threads = {}, onEnd = {};

async function processTheQueue(key, thread = 0)
{
	if(queued[key])
	{
		let current = queued[key].shift();

		if(current)
		{
			try
			{
				await current.callback.apply(false, current.arguments);
			}
			catch(error)
			{
				if(key == 'folderThumbnails')
					dom.compressedError(error);

				console.error(error);
			}

			if(queued[key].length > 0 && threads[key][thread])
			{
				threads[key][thread]++;

				process.nextTick(function(){

					processTheQueue(key, thread);

				});

				return;
			}
		}
	}

	threads[key][thread] = null;

	checkEnd(key);

	return;
}

function processTheQueueThreads(key)
{
	for(let i = 0, len = threads[key].length; i < len; i++)
	{
		if(threads[key][i] === null)
		{
			threads[key][i] = 1;
			processTheQueue(key, i);

			break;
		}
	}
}

async function addToQueue(key, callback)
{
	_arguments = [];

	for(let i = 2, len = arguments.length; i < len; i++)
	{
		_arguments.push(arguments[i]);
	}

	if(!threads[key]) threads[key] = [null];

	if(!queued[key]) queued[key] = [];
	queued[key].push({key: key, callback: callback, arguments: _arguments});

	processTheQueueThreads(key);
}

function cleanQueue(key = false)
{
	queued[key] = [];
}

function setThreads(key, num = 1)
{
	if(!threads[key]) threads[key] = [null];

	let _threads = [];

	for(let i = 0; i < num; i++)
	{
		_threads.push(threads[key][i] || null);
	}

	threads[key] = _threads;
}

function checkEnd(key)
{
	if(onEnd[key])
	{
		let allNull = true;

		for(let i = 0, len = threads[key].length; i < len; i++)
		{
			if(threads[key][i] !== null)
				allNull = false;
		}

		if(allNull)
		{
			onEnd[key]();
			onEnd[key] = false;
		}
	}
}

function end(key, callback)
{
	onEnd[key] = callback;
}

module.exports = {
	add: addToQueue,
	queued: function(){return queued},
	clean: cleanQueue,
	threads: setThreads,
	end: end,
	process: processTheQueue,
};