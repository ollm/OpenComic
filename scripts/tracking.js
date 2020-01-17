const Dialogs = require('dialogs')
const dialogs = Dialogs()
var request = require('request');

async function track() {
	try{
		var tracking = storage.getKey('tracking', dom.indexMainPathA());
		var anilist = storage.getKey('config', "anilist");
	}catch(e) {

	}

	if(tracking && checkAuth()) {
		var chaptername = p.basename(reading.readingCurrentPath());

		var chapters = chaptername.match(/(ch\.\s*\d*)|(chapter\s*\d*)|(ch\s*\d*)|(episode\s*\d*)/gmi);
		if(chapters){
			chapters = parseInt(chapters[0].replace(/\D+/g, ''));
		}

		console.log("chapter: " + chapters);

		var volumes = chaptername.match(/(vol\.\s*\d*)|(volume\s*\d*)|(ch\s*\d*)|(vol\s*\d*)/gmi);
		if(volumes){
			volumes = parseInt(volumes[0].replace(/\D+/g, ''));
		}
		console.log("volume: " + volumes);


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
			id: tracking.anilistId,
			type: "MANGA"
		};

		var url = 'https://graphql.anilist.co',
		options = {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + anilist.accessToken,
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify({
				query: query,
				variables: variables
			})
		};
		new Promise((resolve,reject) => {
			request(url,options, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var json = JSON.parse(body).data.Media;
					var aniChapters,aniVolumes,aniUserStatus,aniUserProgress,aniUserProgressVolumes;
					aniChapters = json.chapters;
					aniVolumes = json.volumes;
					if(json.mediaListEntry) {
						aniUserStatus = json.mediaListEntry.status;
						aniUserProgress = json.mediaListEntry.progress;
						aniUserProgressVolumes = json.mediaListEntry.progressVolumes;
					}

					var upUserStatus,upUserProgress,upUserProgressVolumes;

					if(aniChapters && chapters && chapters == aniChapters) {
						upUserStatus = "COMPLETED";
					} else if((aniUserStatus && aniUserStatus !== "CURRENT") || !aniUserStatus){
						upUserStatus = "CURRENT";
					}

					if(chapters && aniUserProgress && chapters > aniUserProgress) {
						upUserProgress = chapters;
					} else if (chapters && !aniUserProgress) {
						upUserProgress = chapters;
					}

					if(volumes && aniUserProgressVolumes && volumes > aniUserProgressVolumes) {
						upUserProgressVolumes = volumes;
					} else if (volumes && !aniUserProgressVolumes) {
						upUserProgressVolumes = volumes;
					}

					console.log("upchapter: " + upUserProgress);
					console.log("upvolumes: " + upUserProgressVolumes);
					console.log("upstatus: " + upUserStatus);



					var variables = {
						"mediaId": tracking.anilistId,
					};
					if(upUserProgressVolumes) {
						variables['volumes'] = upUserProgressVolumes;
					}
					if(upUserProgress) {
						variables['progress'] = upUserProgress;
					}
					if(upUserStatus) {
						variables['status'] = upUserStatus;
					}
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

					var url = 'https://graphql.anilist.co',
					options = {
						method: 'POST',
						headers: {
							'Authorization': 'Bearer ' + anilist.accessToken,
							'Content-Type': 'application/json',
							'Accept': 'application/json',
						},
						body: JSON.stringify({
							query: query,
							variables: variables
						})
					};
					request(url,options, function (error, response, body) {
						console.log(body)
					});



					resolve(true)
				} else {
					console.log(error)
					resolve(false);
				}
			});
		});
	}
}

async function startTracking() {
	console.log("tracking start");
	if(checkAuth()) {
		try{
			var tracking = storage.getKey('tracking', dom.indexMainPathA());
		}catch(e) {

		}
		if(!tracking) {
			var tracking = {};
			var id = await searchTitle();
			console.log(id)
			if(id) {
				tracking.anilistId = id;
				storage.updateVar('tracking', dom.indexMainPathA(), tracking);
			}
		} else {
			dialogs.alert('already tracking this manga', ok => {})
		}
	}
}

function checkAuth() {
	try{
		var config = storage.getKey('config', "anilist");
	}catch(e) {

	}

	if(!config.accessToken){

		require("electron").shell.openExternal("https://anilist.co/api/v2/oauth/authorize?client_id=3050&response_type=code");

		dialogs.prompt('please enter the AniList token', '', ok => {

			var options = {
				uri: 'https://anilist.co/api/v2/oauth/token',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				json: {
					'grant_type': 'authorization_code',
					'client_id': '3050',
					'client_secret': '1ZUNqGak9QAHaGvaYjOgLuGXGCTpdTr18unz5koc',
					'redirect_uri': 'https://anilist.co/api/v2/oauth/pin', 
					'code': ok,
				}
			};

			request(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					storage.updateVar('config', 'anilist', {accessToken: body.access_token, refreshToken: body.refresh_token});
				}
			});
		});
		return false;
	} else {
		return true;
	}
}

async function searchTitle() {

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
				title {
					romaji
				}
			}
		}
	}
	`;
	var variables = {
		search: p.basename(dom.indexMainPathA()),
		page: 1,
		perPage: 1
	};

	var url = 'https://graphql.anilist.co',
	options = {
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
	return new Promise((resolve,reject) => {
		request(url,options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var json = JSON.parse(body);
				var id = 0;
				dialogs.confirm("Is this the correct AniList entry?\n [" + json.data.Page.media[0].title.romaji+ "] ("+ json.data.Page.media[0].id + ")", ok => {
					if(ok){
						console.log("yes")
						id = parseInt(json.data.Page.media[0].id);
						console.log("anilistid: "+ id)
						resolve(id);
					}else{
						console.log("no")
						dialogs.prompt('please enter the correct AniList Id/Link', '', ok2 => {

							if(ok2 && ok2.indexOf("anilist.co/manga/") !== -1) {
								if(ok2.indexOf("https://") !== -1) {
									id = ok2.split("/")[4]
								} else {
									id = ok2.split("/")[2]
								}

							} else {
								id = ok2;
							}
							id = parseInt(id);
							console.log("anilistid: " + id)
							resolve(id);
						});
					}
				});
			} else {
				resolve(undefined);
			}
		});
	});
}

module.exports = {
	startTracking: startTracking,
	track: track
};