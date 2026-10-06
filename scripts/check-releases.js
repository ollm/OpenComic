const sanitizeHtml = require('sanitize-html'),
	marked = require('marked');

function showReleaseDialog(release)
{
	release.releases_url = 'https://opencomic.app/docs/installation/download';
	release.html_url = 'https://github.com/ollm/OpenComic/releases';

	const parsed = marked.parse(release.body, {breaks: true}).replace(/(\<a\s)\s*/ig, '$1 target="_blank"').replace(/\<h5\>/ig, '<h5 class="title-small">');

	const releaseNotes = sanitizeHtml(parsed, {
		allowedClasses: {
			h5: ['title-small'],
		},
		allowedAttributes: {
			a: ['href', 'target', 'data-function'],
		},
	});

	events.dialog({
		header: hb.compile(language.dialog.release.title)({releaseName: release.name}),
		width: 'max-content',
		height: false,
		content: '<div class="release-notes">'+releaseNotes+'</div>',
		buttons: [
			{
				text: language.buttons.dismiss,
				function: 'events.closeDialog(); checkReleases.setLastCheckedRelease(\''+release.name+'\')',
			},
			{
				text: language.buttons.download,
				function: 'electron.shell.openExternal(\''+release.releases_url+'\');',
			}
		],
	});
}

function showNightlyReleaseDialog(release)
{
	release.releases_url = 'https://github.com/ollm/OpenComic-Nightly';
	release.html_url = 'https://github.com/ollm/OpenComic-Nightly';

	const releaseHash = app.extract(/OpenComic-Nightly-v[0-9.]+-([a-f0-9]+)/iu, release.name);

	let body = release.body;
	body += `\n\n##### Changes Since Your Installed Version:\nhttps://github.com/ollm/OpenComic/compare/${nightly.commit7}...${releaseHash}`;

	const parsed = marked.parse(body, {breaks: true}).replace(/(\<a\s)\s*/ig, '$1 target="_blank"').replace(/\<h5\>/ig, '<h5 class="title-small">');

	const releaseNotes = sanitizeHtml(parsed, {
		allowedClasses: {
			h5: ['title-small'],
		},
		allowedAttributes: {
			a: ['href', 'target', 'data-function'],
		},
	});

	const name = app.extract(/OpenComic-Nightly-(v[0-9.]+-[a-f0-9]+)/iu, release.name);

	events.dialog({
		header: hb.compile(language.dialog.release.titleNightly)({releaseName: name}),
		width: 'max-content',
		height: false,
		content: '<div class="release-notes">'+releaseNotes+'</div>',
		buttons: [
			{
				text: language.buttons.dismiss,
				function: 'events.closeDialog(); checkReleases.setLastCheckedNightlyRelease(\''+release.name+'\')',
			},
			{
				text: language.buttons.download,
				function: 'electron.shell.openExternal(\''+release.releases_url+'\');',
			}
		],
	});
}

function setLastCheckedRelease(name)
{
	storage.setKey('config', 'lastCheckedRelease', name);
}

function setLastCheckedNightlyRelease(name)
{
	storage.setKey('config', 'lastCheckedNightlyRelease', name);
}

function versionIsHigher(lowest, highest)
{
	const l = lowest.replace(/^[a-z]+/iu, '').split(/[.-]/);
	const h = highest.replace(/^[a-z]+/iu, '').split(/[.-]/);

	const maxLength = Math.max(l.length, h.length);

	for(let i = 0; i < maxLength; i++)
	{
		const lv = parseInt(l[i] ?? 0, 10);
		const hv = parseInt(h[i] ?? 0, 10);

		if(hv > lv)
			return true;

		if(hv < lv)
			return false;
	}

	return false;
}

function check(force = false)
{
	let now = Date.now();

	if(now - config.lastCheckedReleaseTime < 3600000 && !force) // Check at most once an hour
		return;

	storage.setKey('config', 'lastCheckedReleaseTime', now);

	let options = {
		headers:{
			'User-Agent': window.navigator.userAgent,
		},
	};

	console.log('Checking for new release');

	fetch('https://api.github.com/repos/ollm/OpenComic/releases', options).then(async function(response){

		let json = await response.json();
		if(json.message) return console.log(json.message);

		let lastRelease = false;

		for(let key in json)
		{
			let release = json[key];

			if(!release.draft && (config.checkPreReleases || !release.prerelease))
			{
				lastRelease = release;
				break;
			}
		}

		if(lastRelease)
		{
			if((lastRelease.name != config.lastCheckedRelease && versionIsHigher(_package.version, lastRelease.name)) || force)
			{
				showReleaseDialog(lastRelease);
				console.log('New release available');
			}
			else
			{
				console.log('Not new release available');
				checkNightly();
			}
		}

	});
}

function checkNightly(force = false)
{
	if((!nightly.build && !force) || !config.checkNightlyReleases)
		return;

	let options = {
		headers:{
			'User-Agent': window.navigator.userAgent,
		},
	};

	console.log('Checking for new nightly release');

	fetch('https://api.github.com/repos/ollm/OpenComic-Nightly/releases', options).then(async function(response){

		let json = await response.json();
		if(json.message) return console.log(json.message);

		json.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

		let lastRelease = false;

		for(let key in json)
		{
			let release = json[key];

			if(!release.draft && (config.checkPreReleases || !release.prerelease))
			{
				lastRelease = release;
				break;
			}
		}

		if(lastRelease)
		{
			const releaseHash = app.extract(/OpenComic-Nightly-v[0-9.]+-([a-f0-9]+)/iu, lastRelease.name);

			if((lastRelease.name != config.lastCheckedNightlyRelease && releaseHash != nightly.commit7) || force)
			{
				showNightlyReleaseDialog(lastRelease);

				console.log('New nightly release available');
			}
			else
			{
				console.log('Not new nightly release available');
			}
		}

	});
}

module.exports = {
	check,
	checkNightly,
	setLastCheckedRelease,
	setLastCheckedNightlyRelease,
};