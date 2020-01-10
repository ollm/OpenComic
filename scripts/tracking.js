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

function searchTitle(title) {

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
		search: title,
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
		/*if (!error && response.statusCode == 200) {

			dialogs.confirm('ok?', ok => {
				console.log("yes")
			}, cancel => {
				console.log("no")
			});
		}*/
		console.log(body)

	});
}

module.exports = {
	startTracking: startTracking,
	searchTitle: searchTitle
};