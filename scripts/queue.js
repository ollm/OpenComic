var processingTheQueue = {}, queued = {}, onEnd = {}, queueIsStop = {};

async function processTheQueue(key)
{
	let _error = false;

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
					dom.compressedError(error, false);
				else
					_error = error;

				console.error(error);
			}

			if(queued[key].length > 0)
			{
				process.nextTick(function() {

					processTheQueue(key);

				});

				return;
			}
		}
	}

	processingTheQueue[key] = false;

	checkEnd(key);

	if(_error)
	{
		console.log('Error');
		throw new Error(_error);
	}

	return;
}

function startProcessTheQueue(key)
{
	if(queueIsStop[key]) return;

	if(!processingTheQueue[key])
	{
		processingTheQueue[key] = true;

		process.nextTick(function() {

			processTheQueue(key).catch(function(error){

				if(key != 'folderThumbnails')
					throw new Error(error);

				console.error(error);

			});

		});
	}
}

async function addToQueue(key, callback)
{
	_arguments = [];

	for(let i = 2, len = arguments.length; i < len; i++)
	{
		_arguments.push(arguments[i]);
	}

	if(!queued[key]) queued[key] = [];
	queued[key].push({key: key, callback: callback, arguments: _arguments});

	startProcessTheQueue(key);
}

function cleanQueue(key = false)
{
	queued[key] = [];
}

function checkEnd(key)
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

function stop(key)
{
	queueIsStop[key] = true;
}

function resume(key)
{
	queueIsStop[key] = false;

	startProcessTheQueue(key);
}

module.exports = {
	add: addToQueue,
	queued: function(){return queued},
	clean: cleanQueue,
	process: processTheQueue,
	end: end,
	stop: stop,
	resume: resume,
};