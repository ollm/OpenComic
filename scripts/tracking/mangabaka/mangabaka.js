var site = {}, controller = false;

const API_BASE = 'https://api.mangabaka.org';

function setSiteData(siteData)
{
	site = siteData;
}

function authHeaders(authenticated = false)
{
	const headers = {
		'Accept': 'application/json',
	};

	if(authenticated && site.config?.session?.token)
	{
		headers.Authorization = 'Bearer '+site.config.session.token;
	}
	else if(authenticated)
	{
		headers['x-api-key'] = site.auth.clientId;
	}

	return headers;
}

function extractNumber(item = {}, candidates = [])
{
	for(let i = 0, len = candidates.length; i < len; i++)
	{
		const value = +item[candidates[i]];

		if(value > 0)
			return value;
	}

	return 0;
}

function getSeriesTotals(series = {})
{
	return {
		chapters: extractNumber(series, ['chapters', 'chapter_count', 'chapters_count', 'available_chapters', 'total_chapters']),
		volumes: extractNumber(series, ['volumes', 'volume_count', 'volumes_count', 'available_volumes', 'total_volumes', 'final_volume']),
	};
}

// Search comic/manga in site
async function searchComic(title)
{
	if(controller) controller.abort();
	controller = new AbortController();

	const variables = new URLSearchParams({
		q: title,
		page: 1,
		limit: 10,
		sort_by: 'relevance_desc',
	});

	const options = {
		method: 'GET',
		headers: authHeaders(false),
		signal: controller.signal,
	};

	try
	{
		const response = await fetch(API_BASE+'/v1/series/search?'+variables.toString(), options);

		if(response.status == 200)
		{
			const json = await response.json();

			return (json.data || []).map(function(item) {

				return {
					id: item.id,
					title: item.title,
					image: item.cover.x250.x1,
					authors: item.authors || [],
				};

			});
		}
	}
	catch(error) {}

	return [];
}

// Return data of comic/manga
async function getComicData(siteId)
{
	const seriesOptions = {
		method: 'GET',
		headers: authHeaders(false),
	};

	const libraryOptions = {
		method: 'GET',
		headers: authHeaders(true),
	};

	try
	{
		const [seriesResponse, libraryResponse] = await Promise.all([
			fetch(API_BASE+'/v1/series/'+siteId, seriesOptions),
			fetch(API_BASE+'/v1/my/library/'+siteId, libraryOptions),
		]);

		if(libraryResponse.status == 400 || libraryResponse.status == 401 || libraryResponse.status == 403)
		{
			tracking.invalidateSession(site.key, true);
			return null;
		}

		if(seriesResponse.status == 200)
		{
			const seriesJson = await seriesResponse.json();
			const series = seriesJson?.data || {};
			const totals = getSeriesTotals(series);

			let progress = {chapters: 0, volumes: 0};

			if(libraryResponse.status == 200)
			{
				const libraryJson = await libraryResponse.json();
				const entry = libraryJson?.data || {};

				progress = {
					chapters: +entry.progress_chapter || 0,
					volumes: +entry.progress_volume || 0,
				};
			}

			return {
				title: series.title,
				image: series.cover.x350.x1,
				chapters: totals.chapters,
				volumes: totals.volumes,
				progress: progress,
			};
		}
	}
	catch(error) {}

	return {};
}

// Loging to site
async function login()
{
	const verifier = crypto.randomUUID();
	const challenge = crypto.hash('sha256', verifier, 'base64url');
	const authorizationUrl = new URL('https://mangabaka.org/auth/oauth2/authorize');

	authorizationUrl.search = new URLSearchParams({
		response_type: 'code',
		client_id: site.auth.clientId,
		redirect_uri: 'opencomic://tracking/mangabaka',
		scope: 'openid profile library.read library.write offline_access',
		code_challenge: challenge,
		code_challenge_method: 'S256',
	}).toString();

	const url = await tracking.getRedirectResult(site.key, authorizationUrl.toString());
	const code = url.searchParams.get('code') || url.searchParams.get('token'); // Token param is from getTokenDialog

	if(!code)
		return {valid: false};

	const variables = new URLSearchParams({
		grant_type: 'authorization_code',
		client_id: site.auth.clientId,
		redirect_uri: 'opencomic://tracking/mangabaka',
		code: code,
		code_verifier: verifier,
	});

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
		},
		body: variables.toString(),
	};

	try
	{
		const response = await fetch('https://mangabaka.org/auth/oauth2/token', options);

		if(response.status == 200)
		{
			const json = await response.json();
			return {valid: true, token: json.access_token, refreshToken: json.refresh_token, expiresIn: json.expires_in || 0};
		}
	}
	catch(error) {}

	return {valid: false};
}

// Refresh session token
async function refreshToken()
{
	const variables = new URLSearchParams({
		grant_type: 'refresh_token',
		client_id: site.auth.clientId,
		refresh_token: site.config.session.refreshToken,
	});

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
		},
		body: variables.toString(),
	};

	try
	{
		const response = await fetch('https://mangabaka.org/auth/oauth2/token', options);

		if(response.status == 200)
		{
			const json = await response.json();
			return {valid: true, token: json.access_token, refreshToken: json.refresh_token, expiresIn: json.expires_in};
		}
	}
	catch(error) {}

	return {valid: false};
}

// Track comic/manga
async function track(toTrack)
{
	const headers = authHeaders(true);

	const seriesOptions = {
		method: 'GET',
		headers: authHeaders(false),
	};

	const libraryOptions = {
		method: 'GET',
		headers: headers,
	};

	try
	{
		const [seriesResponse, libraryResponse] = await Promise.all([
			fetch(API_BASE+'/v1/series/'+toTrack.id, seriesOptions),
			fetch(API_BASE+'/v1/my/library/'+toTrack.id, libraryOptions),
		]);

		if(libraryResponse.status == 400 || libraryResponse.status == 401 || libraryResponse.status == 403)
		{
			tracking.invalidateSession(site.key, true);
			return;
		}

		if(seriesResponse.status != 200)
			return;

		const seriesJson = await seriesResponse.json();
		const series = seriesJson?.data || {};
		const totals = getSeriesTotals(series);

		let entry = {};
		let entryExists = false;

		if(libraryResponse.status == 200)
		{
			const libraryJson = await libraryResponse.json();
			entry = libraryJson?.data || {};
			entryExists = true;
		}

		const userChapters = +entry.progress_chapter || 0;
		const userVolumes = +entry.progress_volume || 0;
		const userState = entry.state || '';

		let chapters = false;
		let volumes = false;
		let state = false;

		if(toTrack.chaptersInt && toTrack.chaptersInt > userChapters)
			chapters = toTrack.chaptersInt;

		if(toTrack.volumesInt && toTrack.volumesInt > userVolumes)
			volumes = toTrack.volumesInt;

		if((totals.chapters && toTrack.chaptersInt && toTrack.chaptersInt >= totals.chapters) || (totals.volumes && toTrack.volumesInt && toTrack.volumesInt >= totals.volumes))
			state = 'completed';
		else if(!userState || userState === 'plan_to_read' || userState === 'considering' || userState === 'paused')
			state = 'reading';

		if(!chapters && !volumes && !state)
			return; // Nothing to update

		tracking.setTrackingChapters(site.key, {
			chapters: totals.chapters,
			volumes: totals.volumes,
			progress: {
				chapters: (chapters || userChapters),
				volumes: (volumes || userVolumes),
			},
		}, toTrack.mainPath);

		const payload = {};

		if(chapters)
			payload.progress_chapter = chapters;

		if(volumes)
			payload.progress_volume = volumes;

		if(state)
			payload.state = state;

		const options = {
			method: entryExists ? 'PUT' : 'POST',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		};

		fetch(API_BASE+'/v1/my/library/'+toTrack.id, options);
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
