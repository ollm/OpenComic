const soundEffect = require(p.join(appDir, '.dist/reading/music/sound-effect.js'));

let audios = false, audio = false;

async function has(files, findParent = false)
{
	const audios = [];

	for(let i = 0, len = files.length; i < len; i++)
	{
		let _file = files[i];

		if(compatible.audio(_file.name))
			audios.push(_file);
	}

	if(audios.length)
		return audios;

	if(findParent)
	{
		const lastCompressedFile = fileManager.lastCompressedFile(findParent);
		const file = fileManager.file(p.dirname(lastCompressedFile || findParent));

		let files = [];

		try
		{
			files = await file.read({filtered: false});
		}
		catch(error)
		{
			console.error(error);

			if(!macosMAS)
				dom.compressedError(error);

			return false;
		}

		file.destroy();

		return has(files);
	}

	return false;
}

let makingAvailable = false;

async function read(_audios, files)
{
	audios = process(_audios, files);

	if(audios)
	{
		const {promise, resolve} = Promise.withResolvers();
		makingAvailable = promise;

		const file = fileManager.file();
		await file.makeAvailable(_audios);
		file.destroy();

		resolve();
	}
	else
	{
		pause();
	}
}

function process(audios, files)
{
	if(!audios || !audios.length) return false;

	const findExact = function(name) {

		name = name.replace(/bgm[^\p{L}\p{N}]*/iug, '');

		let split = name.split('-');

		if(split.length === 1)
			split = name.split(/[^\p{L}\p{N}]+/u);

		const filenamePlay = split[0] || '';
		const filenameStop = split[1] || '';

		const filePlay = files.find(file => p.parse(file.name).name === filenamePlay) || false;
		const fileStop = files.find(file => p.parse(file.name).name === filenameStop) || false;

		return {filenamePlay, filenameStop, filePlay, fileStop};

	};

	const find = function(name) {

		const [, playNumber, stopNumber] = name.match(/bgm[^\p{L}\p{N}]*([0-9]+)[^\p{L}\p{N}]+([0-9]+)/iu) || [];

		const findFileByNumber = function(number) {

			if(!number) return false;

			const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${number}(?:[^\\p{L}\\p{N}]|$)`, 'u');
			return files.find(file => regex.test(file.name)) || false;

		}

		const filePlay = findFileByNumber(playNumber);
		const fileStop = findFileByNumber(stopNumber);

		const filenamePlay = filePlay ? p.parse(filePlay.name).name : '';
		const filenameStop = fileStop ? p.parse(fileStop.name).name : '';

		return {filenamePlay, filenameStop, filePlay, fileStop};

	};

	return audios.map(function(file) {

		const name = p.parse(file.name).name;

		let {filenamePlay, filenameStop, filePlay, fileStop} = findExact(name);

		if(!filePlay && !fileStop)
			({filenamePlay, filenameStop, filePlay, fileStop} = find(name));

		return {
			indexPlay: 0,
			indexStop: 0,
			filenamePlay,
			filenameStop,
			filePlay,
			fileStop,
			file,
		};

	});

}

async function focusIndex(index)
{
	if(!audios || !audios.length) return;

	if(makingAvailable)
		await makingAvailable;

	for(let i = 0, len = audios.length; i < len; i++)
	{
		const audio = audios[i];

		audio.indexPlay = audio.filePlay ? (reading.getImageByName(audio.filePlay.name)?.index ?? 0) : 0;
		audio.indexStop = audio.fileStop ? (reading.getImageByName(audio.fileStop.name)?.index ?? 0) : 0;
	}

	let path = false;

	for(let i = audios.length - 1; i >= 0; i--)
	{
		const {indexPlay, indexStop, file} = audios[i];

		if(indexStop && index > indexStop)
			continue;

		if(indexPlay && index > indexPlay)
		{
			path = file.path;
			break;
		}
	}

	if(!path)
	{
		for(const audio of audios)
		{
			if(audio.indexStop === 0 && audio.indexPlay === 0)
			{
				path = audio.file.path;
				break;
			}
		}
	}

	if(audios && path)
	{
		generate(path);

		if(config.readingMusic.play)
			play();
	}
	else
	{
		pause();
	}

}

let currentPath = false;

function generate(path)
{
	if(currentPath === path) return;

	let globalElement = template._globalElement();

	audio = globalElement.querySelector('.reading-music');

	if(!audio)
	{
		audio = document.createElement('audio');
		audio.className = 'reading-music';
		audio.autoplay = false;
		audio.controls = false;
		audio.loop = true;
		audio.style.display = 'none';
		audio.volume = config.readingMusic.volume;
		globalElement.appendChild(audio);
	}

	audio.src = fileManager.realPath(path);
	currentPath = path;
}

function play()
{
	if(!audio || !audio.paused) return;
	audio.play();
}

function pause()
{
	if(!audio || audio.paused) return;
	audio.pause();
}

function volume(volume, save = false)
{
	volume /= 100;

	config.readingMusic.volume = volume;
	if(save) storage.setVar('config', 'readingMusic', config.readingMusic);

	if(!audio) return;
	audio.volume = volume;
}

function setPlay(_play = true)
{
	config.readingMusic.play = _play;
	storage.setVar('config', 'readingMusic', config.readingMusic);

	if(_play)
		play();
	else
		pause();
}

function loadMenu()
{
	handlebarsContext.volumePercent = Math.round(config.readingMusic.volume * 100);

	dom.query('#reading-music .menu-simple').html(template.load('reading.elements.menus.music.html'));

	events.events();
}

module.exports = {
	has: has,
	read: read,
	play: play,
	pause: pause,
	volume: volume,
	setPlay: setPlay,
	focusIndex: focusIndex,
	loadMenu: loadMenu,
	soundEffect: soundEffect,
};