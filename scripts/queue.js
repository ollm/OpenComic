var processingTheQueue = {}, queued = {};

async function processTheQueue(key)
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

	return;
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

	if(!processingTheQueue[key])
	{
		processingTheQueue[key] = true;

		process.nextTick(function() {

			processTheQueue(key).catch(function(error){

				//if(key == 'folderThumbnails')
				//	dom.compressedError(error);

				//console.error(error);

			});

		});
	}
}

function cleanQueue(key = false)
{
	queued[key] = [];
}

module.exports = {
	add: addToQueue,
	queued: function(){return queued},
	clean: cleanQueue,
	process: processTheQueue,
};