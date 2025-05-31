var site = {}, controller = false;

function setSiteData(siteData)
{
	site = siteData;
}

// Search comic/manga in site
async function searchComic(title)
{
	if(controller) controller.abort();
	controller = new AbortController();

	const variables = new URLSearchParams({
		q: title,
		page: 1,
		perPage: 10,
		fields: 'title,main_picture', // 'title,main_picture,synopsis',
	});

	const options = {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer '+site.config.session.token,
			'Accept': 'application/json',
		},
		signal: controller.signal,
	};

	try
	{
		const response = await fetch('https://api.myanimelist.net/v2/manga?'+variables.toString(), options);

		if(response.status == 400 || response.status == 401)
		{
			tracking.invalidateSession(site.key, true);
			return null;
		}
		else if(response.status == 200)
		{
			const json = await response.json();
			const results = (json.data || []).map(function(item) {

				const node = item.node || {};

				return {
					id: node.id,
					title: node.title,
					image: node.main_picture.medium,
					// synopsis: media.synopsis || null,
				};

			});

			return results;
		}
	}
	catch(error) {}

	return [];
}

// Return data of comic/manga
async function getComicData(siteId)
{
	const options = {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer '+site.config.session.token,
			'Accept': 'application/json',
		},
	};

	try
	{
		const response = await fetch('https://api.myanimelist.net/v2/manga/'+siteId+'?fields=title,main_picture,num_chapters,num_volumes,synopsis,my_list_status,status', options);

		if(response.status == 400 || response.status == 401)
		{
			tracking.invalidateSession(site.key, true);
			return null;
		}
		else if(response.status == 200)
		{
			const json = await response.json();
		
			if(json.id)
			{
				return {
					title: json.title,
					image: json.main_picture.medium,
					// synopsis: synopsis,
					chapters: +json.num_chapters || 0,
					volumes: +json.num_volumes || 0,
					progress: {
						chapters: +json?.my_list_status?.num_chapters_read || 0,
						volumes: +json?.my_list_status?.num_volumes_read || 0,
						// status: json?.my_list_status?.status || '',
					},
				};
			}
		}
	}
	catch(error) {}

	return {};
}

// Loging to site
async function login()
{
	const challenge = crypto.hash('sha512', crypto.randomUUID(), 'hex');
	const url = await tracking.getRedirectResult(site.key, 'https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id='+site.auth.clientId+'&code_challenge='+challenge+'&redirect_uri=opencomic://tracking/myanimelist&response_type=code');
	const code = url.searchParams.get('code') || url.searchParams.get('token');
	
	if(!code)
		return {valid: false};

	const variables = new URLSearchParams({
		grant_type: 'authorization_code',
		client_id: site.auth.clientId,
		redirect_uri: 'opencomic://tracking/myanimelist', 
		code: code,
		code_verifier: challenge,
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
		const response = await fetch('https://myanimelist.net/v1/oauth2/token', options);

		if(response.status == 200)
		{
			const json = await response.json();
			return {valid: true, token: json.access_token};
		}
	}
	catch(error) {}

	return {valid: false};
}

// Track comic/manga
async function track(toTrack)
{
	const options = {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer '+site.config.session.token,
			'Accept': 'application/json',
		},
	};

	try
	{
		const response = await fetch('https://api.myanimelist.net/v2/manga/'+toTrack.id+'?fields=title,main_picture,num_chapters,num_volumes,synopsis,my_list_status,status', options);

		if(response.status == 400 || response.status == 401)
		{
			tracking.invalidateSession(site.key, true);
		}
		else if(response.status == 200)
		{
			const json = await response.json();

			const totalChapters = +json.num_chapters || 0;
			const {status: userStatus, num_chapters_read: userChapters, num_volumes_read: userVolumes} = json?.my_list_status || {};

			let status, chapters, volumes;

			// Status
			if(totalChapters && toTrack.chapters && toTrack.chapters == totalChapters)
				status = 'completed';

			// Chapters
			if(toTrack.chapters && (!userChapters || toTrack.chapters > userChapters))
				chapters = toTrack.chapters;

			// Volumes
			if(toTrack.volumes && (!userVolumes || toTrack.volumes > userVolumes))
				volumes = toTrack.volumes;

			const variables = new URLSearchParams();
			if(status) variables.append('status', status);
			if(chapters) variables.append('num_chapters_read', chapters);
			if(volumes) variables.append('num_volumes_read', volumes);

			if(!status && !chapters && !volumes)
				return; // Nothing to update

			const options = {
				method: 'PUT',
				headers: {
					'Authorization': 'Bearer '+site.config.session.token,
					'Content-Type': 'application/x-www-form-urlencoded',
					'Accept': 'application/json',
				},
				body: variables.toString(),
			};

			fetch('https://api.myanimelist.net/v2/manga/'+toTrack.id+'/my_list_status', options);
		}
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
	track: track,
};