const soundEffect = require(p.join(appDir, 'scripts/reading/music/sound-effect.js'));

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

function process(_audios, files)
{
	const audios = [];

	const find = function(filename, files) {

		if(!filename) return false;

		for(let i = 0, len = files.length; i < len; i++)
		{
			const file = files[i];
			const name = p.parse(file.name).name;

			if(name === filename)
				return file;
		}

		return false;

	}

	for(let i = 0, len = _audios.length; i < len; i++)
	{
		const file = _audios[i];
		const name = p.parse(file.name).name.replace(/bgm[\s\-_]*/iug, '');
		const split = name.split('-');

		const filenamePlay = split[0] || '';
		const filenameStop = split[1] || '';

		const filePlay = find(filenamePlay, files);
		const fileStop = find(filenameStop, files);

		audios.push({
			indexPlay: 0,
			indexStop: 0,
			filenamePlay,
			filenameStop,
			filePlay,
			fileStop,
			file,
		});
	}

	return audios.length ? audios : false;

}

function focusIndex(index)
{
	if(!audios || !audios.length) return;

	for(let i = 0, len = audios.length; i < len; i++)
	{
		const audio = audios[i];

		const indexPlay = audio.filePlay ? (reading.getImageByName(audio.filePlay.name)?.index ?? 0) : 0;
		const indexStop = audio.fileStop ? (reading.getImageByName(audio.fileStop.name)?.index ?? 0) : 0;

		audio.indexPlay = indexPlay;
		audio.indexStop = indexStop;
	}

	let path = false;

	for(let i = audios.length - 1; i >= 0; i--)
	{
		const audio = audios[i];

		if(audio.indexStop && index > audio.indexStop)
			continue;

		if(audio.indexPlay && index > audio.indexPlay)
		{
			path = audio.file.path;
			break;
		}
	}

	if(!path)
	{
		for(let i = 0, len = audios.length; i < len; i++)
		{
			const audio = audios[i];

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
	if(!audio) return;
	audio.play();
}

function pause()
{
	if(!audio) return;
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