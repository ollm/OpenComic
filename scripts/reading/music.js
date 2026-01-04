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

async function read(_audios, files)
{
	audios = process(_audios, files);

	if(!audios)
		pause();
}

function process(audios, files)
{
	if(!audios || !audios.length) return false;

	const find = function(filename, files) {

		if (!filename) return false;

		return files.find(file => p.parse(file.name).name === filename) || false;

	};

	return audios.map(function(file) {

		const name = p.parse(file.name).name.replace(/bgm[\s\-_]*/iug, '');
		const split = name.split('-');

		const filenamePlay = split[0] || '';
		const filenameStop = split[1] || '';

		const filePlay = find(filenamePlay, files);
		const fileStop = find(filenameStop, files);

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

function focusIndex(index)
{
	if(!audios || !audios.length) return;

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