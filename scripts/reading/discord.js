const rpc = require('discord-rpc');
const clientId = '1387113291838525571';

var discord = {
	logged: false,
	client: false,
	promise: false,
};

function reset()
{
	discord = {
		logged: false,
		client: false,
		promise: false,
	};	
}

async function login()
{
	if(discord.promise)
		return discord.promise;

	start();

	return discord.promise = new Promise(function(resolve, reject) {

		discord.client = new rpc.Client({transport: 'ipc'});

		discord.client.on('ready', function() {

			console.log('Discord RPC ready');

			discord.logged = true;
			resolve();

		});

		discord.client.login({
			clientId: '1387113291838525571',
		}).catch(function(error){

			reset();

			console.log('Discord RPC failed:', error.message);
			resolve();
			// reject(error);

		});

	});

}

function logout()
{
	if(!discord.client || !discord.logged)
		return;

	discord.client.clearActivity();
	//discord.client.destroy();
	//reset();
}

var times = {}, currentTime = {}, cache = {};

function getState(data)
{
	const chapter = data.chapter = data.chapter ?? tracking.getChapterImage(true);
	const volume = data.volume = data.volume ?? tracking.getVolumeImage(true);

	let state = (chapter !== false ? language.reading.tracking.chapter+' '+chapter : '')+(volume !== false ? (chapter !== false ? ' · ' : '')+language.reading.tracking.volume+' '+volume : '');

	const percent = Math.round((reading.currentPage() - 1) / (reading.totalPages() - 1) * 100);
	const pages = language.global.pageAndNumber.replace(/\$1/, reading.currentPage()+' / '+reading.totalPages());

	if(!state)
		state = pages+' · '+percent+'%';
	else
		state += ' · '+pages+' · '+percent+'%';

	return state;
}

var status = false;

async function update(focused = true)
{
	if(!config.readingDiscordRcp || !electronRemote.app.hasSingleInstanceLock())
		return;

	await login();

	if(!discord.client || !discord.logged)
		return;

	const mainPath = onReading && focused ? dom.history.mainPath : false;
	const path = onReading && focused ? dom.history.path : false;
	const now = Date.now();

	const time = times[mainPath] ?? {
		elapsed: 0,
		current: 0,
	};

	const data = cache[path] ?? {};

	const title = data.title = data.title ?? (onReading ? tracking.getTitle(true) : language.global.library);
	const state = onReading ? getState(data)+'  ' : '  ';

	if(focused)
	{
		status = {
			details: title,
			state: state,
			startTimestamp: new Date(now - time.elapsed),
			largeImageKey: 'opencomic',
			largeImageText: 'OpenComic',
			instance: false,
		};

		discord.client.setActivity(status);
	}
	else
	{
		status = false;
		discord.client.clearActivity();
	}

	currentTime.elapsed += now - currentTime.current;

	time.current = now;
	currentTime = time;

	times[mainPath] = time;
}

function updateThrottle()
{
	app.setThrottle('discord', update, 2000, 5000);
}

var focused = true;

function events()
{
	const currentWindow = electronRemote.getCurrentWindow();

	currentWindow.on('focus', function() {

		focused = true;
		update(true);

	});

	currentWindow.on('blur', function() {
		
		focused = false;
		update(false);

	});
}

function interval()
{
	if(!config.readingDiscordRcp || !electronRemote.app.hasSingleInstanceLock())
		return;

	if(!discord.client || !discord.logged || !onReading || !focused)
		return;

	update();
}

var started = false;

function start()
{
	if(started)
		return;

	events();
	// setInterval(interval, 30000); // 30 seconds

	started = true;
}

async function set(value)
{
	await app.sleep(50);

	if(value)
		update();
	else
		logout();
}

module.exports = {
	update,
	updateThrottle,
	get client() {return discord.client},
	get status() {return status},
	set,
};