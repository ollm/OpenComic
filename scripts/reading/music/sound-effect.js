function change(soundEffect, key, value, data = false)
{
	switch (key)
	{
		case 'volume':

			value /= 100;

			break;

		case 'sound':

			dom.queryAll('.reading-sound-effect-page .text').html(data);

			break;
	}

	_config.readingSoundEffect[soundEffect][key] = value;
	reading.updateReadingPagesConfig('readingSoundEffect', _config.readingSoundEffect);
}

async function getAudioDuration(audio)
{
	await loadMetadata(audio);
	return audio.duration;
}

function loadMetadata(audioElement)
{
	return new Promise(function(resolve) {

		if(audioElement.readyState > 0)
			resolve();
		else
			audioElement.addEventListener('loadedmetadata', resolve);

	})
}

async function play(config = {})
{
	let start = performance.now();

	const audio = new Audio(config.src);
	audio.volume = config.volume;

	let duration = await getAudioDuration(audio);
	let playbackRate = duration / config.speed;

	if(config.adaptive)
	{
		if(playbackRate > 4)
			playbackRate = 4
		else if(playbackRate < 1)
			playbackRate = 1;
	}
	else
	{
		playbackRate = 1;
	}

	audio.playbackRate = playbackRate;
	duration = duration / playbackRate;

	if(config.speed > duration)
	{
		let delay = (((config.speed - duration) / 2) * 1000);
		delay = delay - Math.ceil(performance.now() - start);

		if(delay < 0)
			delay = 0;

		setTimeout(function(){

			audio.play();
			audio.onended = function(){delete audio}

		}, delay);
	}
	else
	{
		audio.play();
		audio.onended = function(){delete audio}
	}
}

async function page(force = false)
{
	const pageSoundEffect = _config.readingSoundEffect.page;

	if(pageSoundEffect.play || force)
	{
		await play({
			src: p.join(appDir, 'sounds/'+pageSoundEffect.sound+'.mov'),
			volume: pageSoundEffect.volume,
			adaptive: pageSoundEffect.adaptive,
			speed: _config.readingViewSpeed,
		});
	}
}

function getSoundName(sound)
{
	if(/^page\-([0-9]+)/.test(sound))
		return sound.replace(/^page\-([0-9]+)/, language.reading.music.soundEffect.pageTurnAndNumber);
	else if(/^other\-([0-9]+)/.test(sound))
		return sound.replace(/^other\-([0-9]+)/, language.reading.music.soundEffect.otherSoundsAndNumber);

	sound = sound.replace(/-/, ' ');
	sound = sound.charAt(0).toUpperCase() + sound.slice(1);

	return sound;
}

function pageDialog()
{
	handlebarsContext.currentSoundEffect = getSoundName(_config.readingSoundEffect.page.sound);
	handlebarsContext.volumePercent = Math.round(_config.readingSoundEffect.page.volume * 100);

	events.dialog({
		header: language.reading.music.pageSoundEffect,
		width: 500,
		height: 366,
		content: template.load('dialog.reading.sound.effect.page.html'),
		buttons: [
			{
				text: language.buttons.close,
				function: 'events.closeDialog();',
			}
		],
	});

	events.events();
}

function loadPageSounds()
{
	const soundGroups = [
		{
			name: language.reading.music.soundEffect.pageTurn,
			sounds: [
				'page-1',
				'page-2',
				'page-3',
				'page-4',
				'page-5',
				'page-6',
				'page-7',
				'page-8',
				'page-9',
				'page-10',
				'page-11',
				'page-12',
				'page-13',
				'page-14',
				'page-15',
			],
		},
		{
			name: language.reading.music.soundEffect.otherSounds,
			sounds: [
				'whoosh-1',
				'whoosh-2',
				'whoosh-3',
				'whoosh-4',
				'whoosh-5',
				'whoosh-6',
				'sliding-1',
				'sliding-2',
				'sliding-3',
				'sliding-4',
				'sliding-5',
				'sliding-6',
				'button-1',
				'sword-1',
				'sword-2',
			],
		},
	];

	const current = _config.readingSoundEffect.page.sound;
	const _soundGroups = [];

	for(let key in soundGroups)
	{
		const group = soundGroups[key];
		const sounds = [];

		for(let key2 in group.sounds)
		{
			const sound = group.sounds[key2];
			const name = getSoundName(sound);

			sounds.push({
				key: sound,
				name: name,
				select: (sound == current ? true : false),
				soundEffect: 'page',
			});
		}

		_soundGroups.push({
			name: group.name,
			sounds: sounds,
		});
	}

	handlebarsContext.soundGroups = _soundGroups;

	document.querySelector('#reading-sound-effect-page .menu-simple-content').innerHTML = template.load('reading.elements.menus.sound.effect.html');
}

module.exports = {
	change: change,
	page: page,
	pageDialog: pageDialog,
	loadPageSounds: loadPageSounds,
};