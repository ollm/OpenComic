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

	const query = `
	query ($id: Int, $page: Int, $perPage: Int, $search: String) {
		Page (page: $page, perPage: $perPage) {
			pageInfo {
				total
				currentPage
				lastPage
				hasNextPage
				perPage
			}
			media (id: $id, type: MANGA, search: $search) {
				id
				coverImage {
					medium
				}
				title {
					romaji
				}
				staff {
					edges {
						role
						node {
							name {
								full
							}
						}
					}
			    }
			}
		}
	}
	`;

	const variables = {
		search: title,
		page: 1,
		perPage: 10
	};

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		}),
		signal: controller.signal,
	};

	try
	{
		const response = await fetch('https://graphql.anilist.co', options);

		if(response.status == 200)
		{
			const json = await response.json();
			const results = (json.data?.Page?.media || []).map(function(media) {

				const authors = (media?.staff?.edges || []).map(function(author){

					if(['Story', 'Art', 'Story & Art', 'Original Story'].includes(author.role))
						return author.node.name.full;

					return false;

				}).filter(Boolean);

				return {
					id: media.id,
					title: media.title.romaji,
					image: media.coverImage.medium,
					authors: authors,
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
	const query = `
	query ($id: Int, $type: MediaType) {
		Media (id: $id, type: $type) {
			id
			chapters
			volumes
			mediaListEntry {
				status
				progress
				progressVolumes
			}
			coverImage {
				large
			}
			title {
				romaji
			}
		}
	}
	`;

	const variables = {
		id: siteId,
		type: 'MANGA'
	};

	const options = {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer '+site.config.session.token,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		})
	};

	try
	{
		const response = await fetch('https://graphql.anilist.co', options);

		if(response.status == 400 || response.status == 401)
		{
			tracking.invalidateSession(site.key, true);
			return null;
		}
		else if(response.status == 200)
		{
			const json = await response.json();
		
			if(json.data?.Media)
			{
				const {title, coverImage, chapters, volumes, mediaListEntry} = json.data.Media;

				return {
					title: title.romaji,
					image: coverImage.large,
					chapters: +chapters || 0,
					volumes: +volumes || 0,
					progress: {
						chapters: +mediaListEntry?.progress || 0,
						volumes: +mediaListEntry?.progressVolumes || 0,
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
	const url = await tracking.getRedirectResult(site.key, 'https://anilist.co/api/v2/oauth/authorize?client_id='+site.auth.clientId+'&redirect_uri=opencomic://tracking/anilist&response_type=code');
	const code = url.searchParams.get('code') || url.searchParams.get('token');
	
	if(!code)
		return {valid: false};

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			grant_type: 'authorization_code',
			client_id: site.auth.clientId,
			client_secret: site.auth.clientSecret,
			redirect_uri: 'opencomic://tracking/anilist', 
			code: code,
		})
	};

	try
	{
		const response = await fetch('https://anilist.co/api/v2/oauth/token', options);

		if(response.status == 200)
		{
			const json = await response.json();
			return {valid: true, token: json.access_token, refreshToken: json.refresh_token, expiresIn: json.expires_in};
		}
	}
	catch(error) {}

	return {valid: false};
}

// Refresh session token
async function refreshToken()
{
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			grant_type: 'refresh_token',
			client_id: site.auth.clientId,
			client_secret: site.auth.clientSecret,
			refresh_token: site.config.session.refreshToken,
		})
	};

	try
	{
		const response = await fetch('https://anilist.co/api/v2/oauth/token', options);

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
	const query = `
	query ($id: Int, $type: MediaType) {
		Media (id: $id, type: $type) {
			id
			chapters
			volumes
			mediaListEntry {
				status
				progress
				progressVolumes
			}
		}
	}
	`;

	const variables = {
		id: toTrack.id,
		type: 'MANGA'
	};

	const options = {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer '+site.config.session.token,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		}),
	};

	try
	{
		const response = await fetch('https://graphql.anilist.co', options);

		if(response.status == 400 || response.status == 401)
		{
			tracking.invalidateSession(site.key, true);
		}
		else if(response.status == 200)
		{
			const json = (await response.json()).data?.Media || {};

			const totalChapters = +json.chapters || 0;
			const totalVolumes = +json.volumes || 0;
			const {status: userStatus, progress: userChapters, progressVolumes: userVolumes} = json?.mediaListEntry || {};

			let status, chapters, volumes;

			// Status
			if((totalChapters && toTrack.chaptersInt && toTrack.chaptersInt == totalChapters) || (totalVolumes && toTrack.volumesInt && toTrack.volumesInt == totalVolumes))
				status = 'COMPLETED';
			else if(!userStatus || userStatus !== 'CURRENT')
				status = 'CURRENT';

			// Chapters
			if(toTrack.chaptersInt && (!userChapters || toTrack.chaptersInt > userChapters))
				chapters = toTrack.chaptersInt;

			// Volumes
			if(toTrack.volumesInt && (!userVolumes || toTrack.volumes > userVolumes))
				volumes = toTrack.volumesInt;

			const variables = {mediaId: toTrack.id};
			if(status && (chapters || volumes)) variables.status = status;
			if(chapters) variables.progress = chapters;
			if(volumes) variables.volumes = volumes;

			if(!status && !chapters && !volumes)
				return; // Nothing to update

			tracking.setTrackingChapters(site.key, {
				chapters: totalChapters,
				volumes: totalVolumes,
				progress: {
					chapters: (chapters || userChapters),
					volumes: (volumes || userVolumes),
				},
			}, toTrack.mainPath);

			const query = `
			mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $volumes: Int) {
				SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, progressVolumes: $volumes) {
					id
					status
					progress
					progressVolumes
				}
			}
			`;

			const options = {
				method: 'POST',
				headers: {
					'Authorization': 'Bearer '+site.config.session.token,
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify({
					query: query,
					variables: variables
				})
			};

			fetch('https://graphql.anilist.co', options);
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
	refreshToken: refreshToken,
	track: track,
};