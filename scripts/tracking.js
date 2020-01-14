const Dialogs = require('dialogs')
const dialogs = Dialogs()
var request = require('request');

function startTracking() {
	console.log("tracking start");
	if(checkAuth()){
		console.log("Auth passed")
	}
}

function checkAuth() {
	if(config.anilist.accessToken === "undefined"){

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

function searchTitle() {

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

	request(url,options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var id = 0;
			dialogs.confirm("Is this the correct AniList entry?\n [" + json.data.Page.media[0].title.romaji+ "] " +"("+ json.data.Page.media[0].id + ")", ok => {
				if(ok){
					console.log("yes")
					id = json.data.Page.media[0].id;
					id = parseInt(id);
					console.log(id)
				}else{
					console.log("no")
					dialogs.prompt('please enter the correct AniList Id/Link', '', ok2 => {

						if(ok2 && ok2.indexOf("anilist.co/manga/") !== -1) {
							console.log("anilist manga link");
							if(ok2.indexOf("https://") !== -1) {
								id = ok2.split("/")[4]
							} else {
								id = ok2.split("/")[2]
							}

						} else {
							console.log("anilist id");
							id = ok2;
						}
						id = parseInt(id);
						console.log(id)

					});
				}
			});
		}
	});
}

module.exports = {
	startTracking: startTracking,
	searchTitle: searchTitle
};