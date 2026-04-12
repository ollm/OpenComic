const authKeys = {
	anilist: {
		clientId: 27257,
		clientSecret: process.env.ANILIST_CLIENT_SECRET || '',
	},
	myanimelist: {
		clientId: '66ede34f8b00b1cc6c3480ab3923fda4',
	},
};

module.exports = authKeys;