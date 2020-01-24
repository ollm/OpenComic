var request = require('request'),
	site = {};

function setSiteData(siteData)
{
	site = siteData;
}

var prevSearchRequest = false;

// Search comic/manga in site
async function searchComic(title, callback = false)
{
	var query = `
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
			}
		}
	}
	`;

	var variables = {
		search: title,
		page: 1,
		perPage: 10
	};

	var options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		})
	};

	if(prevSearchRequest) prevSearchRequest.abort();

	prevSearchRequest = request('https://graphql.anilist.co', options, function(error, response, body) {

		if(!error && response.statusCode == 200)
		{
			var json = JSON.parse(body);
		
			results = [];

			if(json.data && json.data.Page && json.data.Page.media)
			{
				for(let key in json.data.Page.media)
				{
					var media = json.data.Page.media[key];

					results.push({
						id: media.id,
						title: media.title.romaji,
						image: media.coverImage.medium,
					});
				}
			}

			callback(results);
		}
		else
		{
			callback([]);
		}
	});
}

// Return data of comic/manga
async function getComicData(siteId, callback = false)
{
	var query = `
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

	var variables = {
		id: siteId,
		type: 'MANGA'
	};

	var options = {
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

	request('https://graphql.anilist.co', options, function(error, response, body) {

		if(!error && response.statusCode == 200)
		{
			var json = JSON.parse(body);
		
			if(json.data && json.data.Media)
			{
				callback({
					title: json.data.Media.title.romaji,
					image: json.data.Media.coverImage.large,
					chapters: +json.data.Media.chapters,
					volumes: +json.data.Media.volumes,
					progress: {
						chapters: json.data.Media.mediaListEntry ? +json.data.Media.mediaListEntry.progress : 0,
						volumes: json.data.Media.mediaListEntry ? +json.data.Media.mediaListEntry.progressVolumes : 0,
					},
				});
			}
			else
			{
				callback({});
			}
		}
		else
		{
			callback({});
		}

	});
}

// Loging to site
async function login(callback = false)
{
	electron.shell.openExternal('https://anilist.co/api/v2/oauth/authorize?client_id='+site.auth.clientId+'&response_type=code');

	tracking.getTokenDialog(site.key, function(token) {

		if(token)
		{
			var options = {
				uri: 'https://anilist.co/api/v2/oauth/token',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				json: {
					'grant_type': 'authorization_code',
					'client_id': site.auth.clientId,
					'client_secret': site.auth.clientSecret,
					'redirect_uri': 'https://anilist.co/api/v2/oauth/pin', 
					'code': token,
				}
			};

			request(options, function(error, response, body) {

				if(!error && response.statusCode == 200)
					callback({valid: true, token: body.access_token});
				else
					callback({valid: false});

			});
		}
		else
		{
			callback({valid: false});
		}

	});
}

// Track comic/manga
async function track(toTrack)
{
	var query = `
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

	var variables = {
		id: toTrack.id,
		type: 'MANGA'
	};

	var options = {
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

	request('https://graphql.anilist.co', options, function(error, response, body) {

		if(response.statusCode == 400)
		{
			tracking.invalidateSession(site.key, true);
		}
		else if(!error && response.statusCode == 200)
		{
			var json = JSON.parse(body).data.Media;

			var aniChapters, aniVolumes, aniUserStatus, aniUserProgress, aniUserProgressVolumes;

			aniChapters = json.chapters;
			aniVolumes = json.volumes;

			if(json.mediaListEntry)
			{
				aniUserStatus = json.mediaListEntry.status;
				aniUserProgress = json.mediaListEntry.progress;
				aniUserProgressVolumes = json.mediaListEntry.progressVolumes;
			}


			var upUserStatus, upUserProgress, upUserProgressVolumes;

			if(aniChapters && toTrack.chapters && toTrack.chapters == aniChapters)
				upUserStatus = 'COMPLETED';
			else if((aniUserStatus && aniUserStatus !== 'CURRENT') || !aniUserStatus)
				upUserStatus = 'CURRENT';

			if(toTrack.chapters && aniUserProgress && toTrack.chapters > aniUserProgress)
				upUserProgress = toTrack.chapters;
			else if(toTrack.chapters && !aniUserProgress)
				upUserProgress = toTrack.chapters;

			if(toTrack.volumes && aniUserProgressVolumes && toTrack.volumes > aniUserProgressVolumes)
				upUserProgressVolumes = toTrack.volumes;
			else if(toTrack.volumes && !aniUserProgressVolumes)
				upUserProgressVolumes = toTrack.volumes;


			var variables = {
				mediaId: toTrack.id,
			};

			if(upUserProgressVolumes) 
				variables['volumes'] = upUserProgressVolumes;

			if(upUserProgress)
				variables['progress'] = upUserProgress;

			if(upUserStatus)
				variables['status'] = upUserStatus;


			query = `
			mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $volumes: Int) {
				SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, progressVolumes: $volumes) {
					id
					status
					progress
					progressVolumes
				}
			}
			`;

			options = {
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

			request('https://graphql.anilist.co', options, function(error, response, body) {});
		}
		else
		{
			console.error(error)
		}
	});
}

module.exports = {
	setSiteData: setSiteData,
	searchComic: searchComic,
	getComicData: getComicData,
	login: login,
	track: track,
};