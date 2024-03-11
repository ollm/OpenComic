const findOn = {
	global: {
		store: {
			general:  [
				{
					key: 'amazon',
					name: 'Amazon',
					url: 'https://www.amazon.{{domainCountry}}/s?k={{query}}&tag=oc-fo-amazon-21',
					domainCountry: {
						default: 'com',
						us: 'com',
						ca: 'ca',
						cn: 'cn',
						jp: 'co.jp',
						au: 'com.au',
						mx: 'com.mx',
						uk: 'co.uk',
						de: 'de',
						es: 'es',
						fr: 'fr',
						in: 'in',
						it: 'it',
						nl: 'nl',
						sa: 'sa',
					},
				},
			],
			book: [
				{
					key: 'audible',
					name: 'Audible',
					url: 'https://www.amazon.{{domainCountry}}/s?k={{query}}&i=audible&tag=oc-fo-audible-21',
					domainCountry: {
						default: 'com',
						us: 'com',
						ca: 'ca',
						cn: 'cn',
						jp: 'co.jp',
						au: 'com.au',
						mx: 'com.mx',
						uk: 'co.uk',
						de: 'de',
						es: 'es',
						fr: 'fr',
						in: 'in',
						it: 'it',
						nl: 'nl',
						sa: 'sa',
					},
				},
			],
			comic: [

			],
		},
		social: {
			general: [
				{
					key: 'goodreads',
					name: 'Goodreads',
					url: 'https://www.goodreads.com/search?q={{query}}',
				},
			],
			book: [

			],
			comic: [
				{
					key: 'comicvine',
					name: 'Comic Vine',
					url: 'https://comicvine.gamespot.com/search/?header=1&q={{query}}',
				},
			],
			manga: [
				{
					key: 'anilist',
					name: 'Anilist',
					url: 'https://anilist.co/search/manga?search={{query}}',
				},
				{
					key: 'myanimelist',
					name: 'MyAnimeList',
					url: 'https://myanimelist.net/manga.php?q={{query}}&cat=manga',
				},
			]
		},
	},
	us: {
		store: {
			general: [
				{
					key: 'barnesandnoble',
					name: 'Barnes & Noble',
					url: 'https://www.barnesandnoble.com/s/{{query}}',
				},
			],
			manga: [
				{
					key: 'crunchyroll',
					name: 'Crunchyroll Store',
					url: 'https://store.crunchyroll.com/search?q={{query}}&search-button=&lang=null',
				},
			]
		},
	},
	es: {
		store: {
			general: [
				{
					key: 'fnac',
					name: 'Fnac',
					url: 'https://www.fnac.es/SearchResult/ResultList.aspx?Search={{query}}&sft=1&sa=0',
				},
				{
					key: 'casadellibro',
					name: 'Casa del Libro',
					url: 'https://www.casadellibro.com/?query={{query}}',
				},
				{
					key: 'elcorteingles',
					name: 'El Corte Inglés',
					url: 'https://www.elcorteingles.es/libros/search/?s={{query}}&stype=typeahead_keywords_1',
				},
				{
					key: 'abacus',
					name: 'Abacus',
					url: 'https://www.abacus.coop/es/busqueda?q={{query}}&lang=es',
				},
			],
			book: [

			],
			comic: [
				{
					key: 'normacomics',
					name: 'Norma Comics',
					url: 'https://www.normacomics.com/search/{{query}}',
				},
				{
					key: 'panini',
					name: 'Panini',
					url: 'https://www.panini.es/shp_esp_es/catalogsearch/result/?q={{query}}',
				},
				{
					key: 'akiracomics',
					name: 'Akira Comics',
					url: 'https://www.akiracomics.com/producto/listadobuscar?buscar={{query}}',
				},
				{
					key: 'universalcomics',
					name: 'Universal Comics',
					url: 'https://www.universal-comics.com/producto/listadobuscar?buscar={{query}}',
				},
				{
					key: 'mangabreria',
					name: 'Mangabrería',
					url: 'https://www.mangabreria.com/search?q={{query}}',
				},
			],
			manga: [

			],
		},
	},
	mx: {
		store: {
			general: [

			],
			book: [

			],
			comic: [
				{
					key: 'mangabreria',
					name: 'Mangabrería',
					url: 'https://www.mangabreria.com/search?q={{query}}',
				},
			],
			manga: [

			],
		},
	},
};

function get(name)
{
	name = p.parse(name).name;

	let globalList = structuredClone(findOn.global);
	let countries = dom.fileInfo.country.get();

	let list = {
		store: {
			general: [],
			book: [],
			comic: [],
			manga: [],
		},
		social: {
			general: [],
			book: [],
			comic: [],
			manga: [],
		},
	};

	let _list = {
		store: {
			general: [],
			book: [],
			comic: [],
			manga: [],
		},
		social: {
			general: [],
			book: [],
			comic: [],
			manga: [],
		},
	};

	let isset = {
		store: {
			general: {},
			book: {},
			comic: {},
			manga: {},
		},
		social: {
			general: {},
			book: {},
			comic: {},
			manga: {},
		},
	};

	let domainCountry = false;

	for(let i = 0, len = countries.length; i < len; i++)
	{
		let country = countries[i].toLowerCase();
		if(!domainCountry) domainCountry = country;

		if(findOn[country])
		{
			for(let type in findOn[country])
			{
				for(let section in findOn[country][type])
				{
					for(let i in findOn[country][type][section])
					{
						let site = structuredClone(findOn[country][type][section][i]);

						if(!isset[type][section][site.key])
						{
							isset[type][section][site.key] = site;
							_list[type][section].push(site);
						}
					}
				}
			}
		}
	}

	for(let type in globalList)
	{
		for(let section in globalList[type])
		{
			for(let i in globalList[type][section])
			{
				let site = globalList[type][section][i];

				if(!isset[type][section][site.key])
					list[type][section].push(site);
			}
		}
	}

	for(let type in _list)
	{
		for(let section in _list[type])
		{
			for(let i in _list[type][section])
			{
				let site = _list[type][section][i];
				list[type][section].push(site);
			}
		}
	}

	// Process urls
	for(let type in list)
	{
		for(let section in list[type])
		{
			for(let i in list[type][section])
			{
				let site = list[type][section][i];
				
				site.url = site.url.replace(/\{\{domainCountry\}\}/g, site.domainCountry ? (site.domainCountry[domainCountry] || site.domainCountry.default || 'com') : 'com');
				site.url = site.url.replace(/\{\{query\}\}/g, encodeURI(name));

				list[type][section][i] = site;
			}
		}
	}

	handlebarsContext.findOn = list;
	document.querySelector('#index-file-info-find-on .menu-simple-content').innerHTML = template.load('index.elements.menus.find.on.html');
}

module.exports = {
	get: get,
};