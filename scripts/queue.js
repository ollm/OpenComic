var processingTheQueue = false, queued = [];

async function processTheQueue()
{
	var current = queued[0];

	if(current)
	{
		current.callback.apply(false, current.arguments);

		queued.splice(0, 1);

		if(queued.length > 0)
		{
			process.nextTick(function() {

				processTheQueue();

			});
		}
		else
		{
			processingTheQueue = false;
		}
	}
	else
	{
		processingTheQueue = false;
	}
}

function addToQueue(key, callback)
{
	_arguments = [];

	for(let i = 2, len = arguments.length; i < len; i++)
	{
		_arguments.push(arguments[i]);
	}

	queued.push({key: key, callback: callback, arguments: _arguments});

	if(!processingTheQueue)
	{
		processingTheQueue = true;

		setTimeout(function(){

			process.nextTick(function() {
				processTheQueue();
			});

		}, 0);
	}
}

function cleanQueue(key = false)
{
	var newQueued = [];

	for(let i = 0, len = queued.length; i < len; i++)
	{
		if(i == 0 || (queued[i].key != key && key !== false))
			newQueued.push(queued[i]);
	}

	queued = newQueued;
}

module.exports = {
	add: addToQueue,
	queued: function(){return queued},
	clean: cleanQueue,
	process: processTheQueue,
};