const {setProperty} = require('dot-prop');

const soundEffect = require(p.join(appDir, '.dist/reading/music/sound-effect.js')),
	sfx = require(p.join(appDir, '.dist/reading/music/sfx.mjs')).default;

let basePath = false;
let music = false, musicFiles = false;

const BGM = new Set(['music.json', 'bgm.json', 'ost.json']);
const SFX = new Set(['sfx.json']);
const MUSIC = new Set([...BGM, ...SFX]);

async function has(files, findParent = false)
{
	basePath = findParent;
	const musicFiles = [];

	for(let i = 0, len = files.length; i < len; i++)
	{
		let _file = files[i];

		if(compatible.audio(_file.name))
			musicFiles.push(_file);

		if(MUSIC.has(_file.name.toLowerCase()))
			musicFiles.push(_file);
	}

	if(musicFiles.length)
		return musicFiles;

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

async function read(musicFiles, files)
{
	const {promise, resolve} = Promise.withResolvers();
	makingAvailable = promise;

	music = await processMusic(musicFiles);
	process(music, files);

	if(music?.files?.length)
	{
		const file = fileManager.file();
		await file.makeAvailable(music.files);
		file.destroy();
	}
	else
	{
		pause();
	}

	resolve();
}

async function processMusic(audios)
{
	if(!audios)
		return false;

	const jsonFiles = audios.filter(file => MUSIC.has(file.name.toLowerCase()));
	const audioFiles = audios.filter(file => compatible.audio(file.name));

	if(jsonFiles.length)
	{
		const file = fileManager.file();
		await file.makeAvailable(jsonFiles);
		file.destroy();
	}

	const music = {
		bgm: [], // bgm and ost are the same
		sfx: [],
		files: [],
	};

	for(const file of jsonFiles)
	{
		const realPath = fileManager.realPath(file.path);

		try
		{
			const json = JSON.parse(fs.readFileSync(realPath));

			if(Array.isArray(json))
			{
				if(BGM.has(file.name.toLowerCase()))
					music.bgm.push(...json);
				else
					music.sfx.push(...json);
			}
			else
			{
				if(json.bgm)
					music.bgm.push(...json.bgm);

				if(json.ost)
					music.bgm.push(...json.ost);

				if(json.sfx)
					music.sfx.push(...json.sfx);
			}
		}
		catch(error)
		{
			console.error(error);
		}
	}

	const isset = new Set();

	const files = function(files = []) {

		for(const file of files)
		{
			if(!file || !file.path) continue;
			const path = file.path;

			const fullPath = p.resolve(basePath || '', path);
			const name = p.basename(fullPath);

			file._path = path;
			file.path = fullPath;
			file.name = name;

			if(isset.has(file.path)) continue;
			isset.add(file.path);

			music.files.push({
				compressed: false,
				folder: false,
				name: name,
				path: fullPath,
				sha: sha1(fullPath),
			});
		}

	} 

	files(music.bgm);
	files(music.sfx);

	// Only add audio files if no bgm is defined in music.json, etc
	if(!music.bgm.length)
	{
		for(const file of audioFiles)
		{
			const path = file.path;

			if(isset.has(path)) continue;
			isset.add(path);

			music.bgm.push(file);
			music.files.push(file);
		}
	}

	sfx.set(music.sfx);

	return music;
}

function process(music, files)
{
	if(!music?.files?.length) return false;

	const findExact = function(name) {

		name = name.replace(/bgm[^\p{L}\p{N}]*/iug, '');

		let split = name.split('-');

		if(split.length === 1)
			split = name.split(/[^\p{L}\p{N}]+/u);

		const filenameStart = split[0] || '';
		const filenameEnd = split[1] || '';

		const fileStart = files.find(file => p.parse(file.name).name === filenameStart) || false;
		const fileEnd = files.find(file => p.parse(file.name).name === filenameEnd) || false;

		return {filenameStart, filenameEnd, fileStart, fileEnd};

	};

	const find = function(name) {

		const [, playNumber, stopNumber] = name.match(/bgm[^\p{L}\p{N}]*([0-9]+)[^\p{L}\p{N}]+([0-9]+)/iu) || [];

		const findFileByNumber = function(number) {

			if(!number) return false;

			const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${number}(?:[^\\p{L}\\p{N}]|$)`, 'u');
			return files.find(file => regex.test(file.name)) || false;

		}

		const fileStart = findFileByNumber(playNumber);
		const fileEnd = findFileByNumber(stopNumber);

		const filenameStart = fileStart ? p.parse(fileStart.name).name : '';
		const filenameEnd = fileEnd ? p.parse(fileEnd.name).name : '';

		return {filenameStart, filenameEnd, fileStart, fileEnd};

	};

	for(const file of music.bgm)
	{
		const name = p.parse(file.name).name;

		let {startPage, endPage} = file;

		let filenameStart = '';
		let filenameEnd = '';
		let fileStart = false;
		let fileEnd = false;

		if(startPage === undefined && endPage === undefined && !fileStart && !fileEnd)
			({filenameStart, filenameEnd, fileStart, fileEnd} = findExact(name))

		if(startPage === undefined && endPage === undefined && !fileStart && !fileEnd)
			({filenameStart, filenameEnd, fileStart, fileEnd} = find(name));

		Object.assign(file, {
			startPage,
			endPage,
			filenameStart,
			filenameEnd,
			fileStart,
			fileEnd,
			file,
		});
	}
}

function getPages(index = false)
{
	const pages = index !== false ? [index] : (reading.view.distribution.currentDistribution[reading.currentImagePosition()] ?? []).map((item) => item.index).filter((index) => index !== undefined && index !== false && index !== null);
	return pages;
}

async function focusIndex(index = false)
{
	if(!music?.bgm?.length) return false;

	if(makingAvailable)
		await makingAvailable;

	const pages = getPages(index);
	sfx.render(pages);

	for(const audio of music.bgm)
	{
		if(audio.startPage === undefined) audio.startPage = audio.fileStart ? (reading.getImageByName(audio.fileStart.name)?.index ?? 0) : 0;
		if(audio.endPage === undefined) audio.endPage = audio.fileEnd ? (reading.getImageByName(audio.fileEnd.name)?.index ?? 0) : 0;
	}

	const bgm = [...music.bgm].sort((a, b) => (a.startPage || 0) - (b.startPage || 0)).reverse();
	let path = false;

	const roundedBgm = bgm.map(audio => ({
		...audio,
		start: audio.startPage === false ? false : Math.round(audio.startPage),
		end: audio.endPage === false ? false : Math.round(audio.endPage),
	})).filter(audio => (fs.existsSync(fileManager.realPath(audio.file.path))));

	toBreak:
	for(const page of pages)
	{
		for(const {start, end, file} of roundedBgm)
		{
			if(end !== false && end > 0 && page > end)
				continue;

			if(start !== false && start > 0 && page >= start)
			{
				path = file.path;
				break toBreak;
			}
		}

		if(!path)
		{
			for(const {start, end, file} of roundedBgm)
			{
				if((start === false || start <= 0) && (end <= 0 || (end !== false && end > 0 && page <= end)))
				{
					path = file.path;
					break toBreak;
				}
			}
		}
	}

	if(bgm && path)
	{
		const hasCurrent = !!current;

		generate(path);

		if(config.readingMusic.play)
		{
			if(hasCurrent)
				playDelay(config.readingMusic.fade * 1000 * 0.666);
			else
				play();
		}
	}
	else if(current)
	{
		current.pauseFade(config.readingMusic.fade * 1000, true);
		current = false;
	}

}

let current = false;

function generate(path)
{
	const realPath = fileManager.realPath(path);
	if(current?.path === realPath) return;

	const fade = config.readingMusic.fade * 1000;

	if(current)
		current.pauseFade(fade, true);

	current = sound(realPath, {
		volume: config.readingMusic.volume,
		loop: true,
		fadeIn: fade,
		fadeOut: fade,
	});
}

function play()
{
	const audio = current?.audio;

	if(!audio || !audio.paused) return;
	current.playFade(config.readingMusic.fade * 1000);
}

async function playDelay(delay = 0)
{
	await app.sleep(delay);
	play();
}

function pause()
{
	const audio = current?.audio;

	if(!audio || audio.paused) return;
	audio.pause();
}

function destroy()
{
	if(!current) return;

	current.destroy();
	current = false;
}

let audioContext = null;

function sound(path, options = {})
{
	let audio = new Audio(path);

	const context = audioContext = audioContext || new AudioContext();
	const source = context.createMediaElementSource(audio);
	const gain = context.createGain();

	source.connect(gain);
	gain.connect(context.destination);

	const volume = options.volume || 1;
	audio.volume = volume;

	const play = function() {

		audio.play();

		if(options.fadeOut)
		{
			const scheduleFade = function() {

				const remaining = (audio.duration - audio.currentTime) * 1000 - options.fadeOut;

				if(remaining > 0)
				{
					setTimeout(function() {

						pauseFade(options.fadeOut);

					}, remaining);
				}
				else
				{
					pauseFade(options.fadeOut + remaining);
				}
			};

			if(Number.isNaN(audio.duration))
				audio.addEventListener('loadedmetadata', scheduleFade, {once: true});
			else
				scheduleFade();
		}
	}

	const playFade = async function(duration = 1000) {

		await context.resume();

		gain.gain.setValueAtTime(0, context.currentTime);
		gain.gain.linearRampToValueAtTime(volume, context.currentTime + duration / 1000);

		play();
	}

	const pauseFade = async function(duration = 1000, _destroy = false) {

		await context.resume();

		const now = context.currentTime;

		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(volume, now);
		gain.gain.linearRampToValueAtTime(0, now + duration / 1000);

		await app.sleep(duration);

		audio.pause();

		if(_destroy)
			destroy();

	}

	const destroy = function() {

		source.disconnect();
		gain.disconnect();

		audio.src = '';
		audio.load();

	}

	if(options.loop)
	{
		audio.loop = true;
	}
	else
	{
		audio.onended = function(){destroy()}
	}

	if(options.play)
	{
		if(options.fadeIn)
			playFade(options.fadeIn);
		else
			play();
	}

	return {
		audio,
		context,
		gain,
		play,
		playFade,
		pauseFade,
		destroy,
		path,
	};
}

function change(key, value)
{
	const audio = current?.audio;

	switch(key)
	{
		case 'volume':
		case 'sfx.volume':

			value /= 100;

			if(audio)
				audio.volume = value;

			break;

		case 'play':

			if(value)
				play();
			else
				pause();

			break;
	}

	setProperty(config.readingMusic, key, value);
	storage.setVar('config', 'readingMusic', config.readingMusic);

	switch(key)
	{
		case 'sfx.active':

			if(value)
			{
				const pages = getPages();
				sfx.render(pages);
			}
			else
			{
				sfx.remove();
			}

			break;
	}
}

function loadMenu()
{
	handlebarsContext.volumePercent = Math.round(config.readingMusic.volume * 100);
	handlebarsContext.volumeSfxPercent = Math.round(config.readingMusic.sfx.volume * 100);

	dom.query('#reading-music .menu-simple').html(template.load('reading.elements.menus.music.html'));

	events.events();
}

module.exports = {
	has: has,
	read: read,
	play: play,
	pause: pause,
	destroy: destroy,
	focusIndex: focusIndex,
	loadMenu: loadMenu,
	sound: sound,
	sfx: sfx,
	soundEffect: soundEffect,
	change,
	get audios() {return music},
	get music() {return music},
};