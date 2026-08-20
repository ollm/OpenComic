var site = {}, controller = false;

const API_BASE = 'https://api.bgm.tv/v0';

function setSiteData(siteData)
{
	site = siteData;
}

function authHeaders()
{
	return {
		'Authorization': 'Bearer '+site.config.session.token,
		'Accept': 'application/json',
	};
}

async function request(path, options = {})
{
	return fetch(API_BASE+path, {
		...options,
		headers: {
			...authHeaders(),
			...(options.headers || {}),
		},
	});
}

// Search comic/manga in site
async function searchComic(title)
{
	if(controller) controller.abort();
	controller = new AbortController();

	try
	{
		const response = await fetch(API_BASE+'/search/subjects?limit=10&offset=0', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify({
				keyword: title,
				filter: {type: [1]},
			}),
			signal: controller.signal,
		});

		if(response.status == 200)
		{
			const json = await response.json();

			return (json.data || []).map(function(subject) {
				return {
					id: subject.id,
					title: subject.name_cn || subject.name,
					image: subject.images?.medium || subject.images?.common,
					authors: [],
				};
			});
		}
	}
	catch(error) {}

	return [];
}

async function getCurrentCollection(siteId)
{
	const meResponse = await request('/me');

	if(meResponse.status != 200)
		return {status: meResponse.status, data: {}};

	const me = await meResponse.json();
	const collectionResponse = await request('/users/'+encodeURIComponent(me.username)+'/collections/'+siteId);

	if(collectionResponse.status == 200)
		return {status: 200, data: await collectionResponse.json()};

	return {status: collectionResponse.status, data: {}};
}

// Return data of comic/manga
async function getComicData(siteId)
{
	try
	{
		const subjectResponse = await request('/subjects/'+siteId);

		if(subjectResponse.status == 401)
		{
			tracking.invalidateSession(site.key, true);
			return null;
		}

		if(subjectResponse.status == 200)
		{
			const subject = await subjectResponse.json();
			const collection = await getCurrentCollection(siteId);

			if(collection.status == 401)
			{
				tracking.invalidateSession(site.key, true);
				return null;
			}

			return {
				title: subject.name_cn || subject.name,
				image: subject.images?.large || subject.images?.common,
				chapters: +subject.eps || +subject.total_episodes || 0,
				volumes: +subject.volumes || 0,
				progress: {
					chapters: +collection.data.ep_status || 0,
					volumes: +collection.data.vol_status || 0,
				},
			};
		}
	}
	catch(error) {}

	return {};
}

// Log in with a personal Bangumi access token
async function login()
{
	const url = await new Promise(function(resolve){
		electron.shell.openExternal('https://next.bgm.tv/demo/access-token');
		tracking.getTokenDialog(site.key, false, resolve);
	});
	const token = url.searchParams.get('token') || url.searchParams.get('access_token');

	if(!token)
		return {valid: false};

	try
	{
		const response = await fetch(API_BASE+'/me', {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer '+token,
				'Accept': 'application/json',
			},
		});

		if(response.status == 200)
			return {valid: true, token: token, refreshToken: '', expiresIn: 0};
	}
	catch(error) {}

	return {valid: false};
}

// Bangumi personal access tokens do not expose a refresh flow.
async function refreshToken()
{
	return {valid: false};
}

// Track comic/manga
async function track(toTrack)
{
	try
	{
		const subjectResponse = await request('/subjects/'+toTrack.id);
		if(subjectResponse.status == 401)
		{
			tracking.invalidateSession(site.key, true);
			return;
		}

		if(subjectResponse.status != 200)
			return;

		const subject = await subjectResponse.json();
		const collection = await getCurrentCollection(toTrack.id);

		if(collection.status == 401)
		{
			tracking.invalidateSession(site.key, true);
			return;
		}

		const userChapters = +collection.data.ep_status || 0;
		const userVolumes = +collection.data.vol_status || 0;
		const totalChapters = +subject.eps || +subject.total_episodes || 0;
		const totalVolumes = +subject.volumes || 0;
		const chapters = toTrack.chaptersInt > userChapters ? toTrack.chaptersInt : false;
		const volumes = toTrack.volumesInt > userVolumes ? toTrack.volumesInt : false;
		const completed = (totalChapters && (chapters || userChapters) >= totalChapters) || (totalVolumes && (volumes || userVolumes) >= totalVolumes);
		const type = completed ? 2 : 3;

		if(!chapters && !volumes && collection.status == 200 && collection.data.type == type)
			return;

		tracking.setTrackingChapters(site.key, {
			chapters: totalChapters,
			volumes: totalVolumes,
			progress: {
				chapters: chapters || userChapters,
				volumes: volumes || userVolumes,
			},
		}, toTrack.mainPath);

		const payload = {type: type};
		if(chapters) payload.ep_status = chapters;
		if(volumes) payload.vol_status = volumes;

		await request('/users/-/collections/'+toTrack.id, {
			method: collection.status == 200 ? 'PATCH' : 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(payload),
		});
	}
	catch(error)
	{
		console.error(error);
	}
}

module.exports = {
	setSiteData: setSiteData,
	searchComic: searchComic,
	getComicData: getComicData,
	login: login,
	refreshToken: refreshToken,
	track: track,
};