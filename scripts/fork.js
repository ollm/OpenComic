const p = require('path'),
	fs = require('fs');

global.inChildFork = true;
global.app = require(p.join(__dirname, '../.dist/app.js'));

const image = require(p.join(__dirname, '../.dist/image.js'));

process.on('message', async function(data) {

	const job = data.job;
	let message = {};

	switch (job)
	{
		case '_resize':

			message = {
				index: data.index,
				result: false,
				error: false,
			};

			try
			{
				const result = await image._resize(...data.args);
				message.result = result;
			}
			catch(error)
			{
				message.error = error.message;
			}

			process.send(message);

			break;

		case 'resizeToBlob':

			message = {
				index: data.index,
				result: false,
				error: false,
			};

			try
			{
				const result = await image.resizeToBlob(...data.args);
				message.result = result;
			}
			catch(error)
			{
				console.log(error);
				message.error = error.message;
			}

			process.send(message);

			break;
	}

});