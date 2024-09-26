let current = false, audio = false;

async function has(files, findParent = false)
{
	for(let i = 0, len = files.length; i < len; i++)
	{
		let _file = files[i];

		if(inArray(fileExtension(_file.name), audioExtensions.all))
			return _file;
	}

	if(findParent)
	{
		const file = fileManager.file(findParent);
		let files = [];

		try
		{
			files = await file.read({filtered: false});
		}
		catch(error)
		{
			console.error(error);
			dom.compressedError(error);

			return false;
		}

		file.destroy();

		return has(files);
	}

	return false;
}

async function read(file)
{
	current = file;

	if(file)
	{
		generate();

		if(config.readingMusic.play)
			play();
	}
	else
	{
		pause();
	}
}

function generate()
{
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

	audio.src = fileManager.realPath(current.path);

	current = audio;
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
	loadMenu: loadMenu,
};