
function showReleaseDialog(release)
{
	events.dialog({
		header: hb.compile(language.dialog.release.title)({releaseName: release.name}),
		width: 360,
		height: false,
		content: hb.compile(language.dialog.release.body)({linkStart: '<a href="javascript:void(0);" class="link" onclick="electron.shell.openExternal(\''+release.html_url+'\')">', linkEnd: '</a>'}),
		buttons: [
			{
				text: language.buttons.dismiss,
				function: 'events.closeDialog(); checkReleases.setLastCheckedRelease(\''+release.name+'\')',
			},
			{
				text: language.buttons.download,
				function: 'electron.shell.openExternal(\''+release.html_url+'\');',
			}
		],
	});
}

function setLastCheckedRelease(name)
{
	storage.updateVar('config', 'lastCheckedRelease', name);
}

function versionIsHigher(lowest, highest)
{
	let l = lowest.replace(/^[a-z]+/iu, '').split(/[.-]/);
	let h = highest.replace(/^[a-z]+/iu, '').split(/[.-]/);

	for(let key in l)
	{
		if(l[key] > h[key] || (h[key] === undefined && !isNaN(l[key])))
			break;
		else if(h[key] === undefined || l[key] < h[key])
			return true;
	}

	return false;
}

function check()
{
	let now = Date.now();

	if(now - config.lastCheckedReleaseTime < 3600000) // Check at most once an hour
		return;

	storage.updateVar('config', 'lastCheckedReleaseTime', now);

	let options = {
		headers:{
			'User-Agent': window.navigator.userAgent,
		},
	};

	console.log('Checking for new release');

	fetch('https://api.github.com/repos/ollm/OpenComic/releases', options).then(async function(response){

		let json = await response.json();

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
			if(lastRelease.name != config.lastCheckedRelease && lastRelease.name != _package.version && versionIsHigher(_package.version, lastRelease.name))
			{
				showReleaseDialog(lastRelease);

				console.log('New release available');
			}
			else
			{
				console.log('Not new release available');
			}
		}

	});
}

module.exports = {
	check: check,
	setLastCheckedRelease: setLastCheckedRelease,
};