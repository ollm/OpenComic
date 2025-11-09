const net = require('net');
const crypto = require('crypto');

const PORT = 46599;
const HOST = '127.0.0.1';

const key = crypto.randomUUID();
let delay = 0;

const current = {
	key: key,
	time: Date.now(),
	server: false,
	client: false,
};

const clients = new Set();

var numInstances = 1;

function init()
{
	connect();
}

function calculateNumInstances()
{
	numInstances = clients.size + 1;

	sendData({
		type: 'numInstances',
		key: current.key,
		time: Date.now(),
		num: numInstances,
	});
}

function handleJsonStream(socket, callback)
{
	let buffer = '';

	socket.on('data', function(chunk) {

		buffer += chunk.toString();

		let index;

		while((index = buffer.indexOf('\n')) >= 0)
		{
			const line = buffer.slice(0, index).trim();
			buffer = buffer.slice(index + 1);

			if(!line)
				continue;

			try
			{
				const data = JSON.parse(line);
				callback(data, socket);
			}
			catch
			{
				console.warn('Invalid JSON:', line);
			}
		}

	});
}

function create()
{
	if(current.server)
		return;

	const server = net.createServer(function(socket) {

		clients.add(socket);
		calculateNumInstances();

		handleJsonStream(socket, function(data) {

			processData(data);
			sendData(data, {ignoreSocket: socket});

		});

		socket.on('close', function() {

			clients.delete(socket);
			calculateNumInstances();

		});

		socket.on('error', function(err) {

			clients.delete(socket);
			calculateNumInstances();

		});

	});

	server.on('error', async function(error) {

		delay += 1000;

		current.server = false;
		await app.sleep(500 + delay);
		connect();

	});

	server.listen(PORT, HOST, function() {

		delay = 0;
		calculateNumInstances();

	});

	current.server = server;
}

function connect()
{
	const client = new net.Socket();

	client.connect(PORT, HOST, function() {

		delay = 0;

	});

	handleJsonStream(client, function(data) {

		processData(data);

	});

	client.on('error', async function() {

		if(current.client)
			current.client.destroy();

		current.client = false;
		await app.sleep(delay);
		create();

	});

	client.on('close', async function() {

		if(current.client)
			current.client.destroy();

		current.client = false;
		await app.sleep(app.rand(200, 500) + delay);
		create();

	});

	current.client = client;
}

function sendData(data, {ignoreSocket = null} = {})
{
	data = {
		...data,
		key: current.key,
		time: Date.now(),
	};

	const json = JSON.stringify(data);

	if(current.server)
	{
		for(const socket of clients)
		{
			if(socket !== ignoreSocket)
				socket.write(json+'\n');
		}
	}
	else if(current.client && !ignoreSocket)
	{
		current.client.write(json+'\n');
	}
}

function processData(data)
{
	if(data.key === current.key)
		return;

	switch(data.type)
	{
		case 'numInstances':

			numInstances = data.num;

			break;

		case 'storageUpdated':

			storage.updatedFromOtherInstance(data.storageKey);

			break;
	}
}

function storageUpdated(storageKey)
{
	sendData({
		type: 'storageUpdated',
		storageKey,
	});
}

module.exports = {
	init,
	get num() {return numInstances},
	get main() {return current.server !== false},
	get client() {return current.client !== false},
	storageUpdated,
};