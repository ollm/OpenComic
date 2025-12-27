const compatible = {
	image: {
		all: {},
		blob: { /* This image formats requires conversion to Blob to be displayed */ },
		convert: { /* This image formats requires conversion to PNG to be displayed */ },
		jpg: {
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'jif': 'image/jpeg',
			'jfi': 'image/jpeg',
			'jfif': 'image/pjpeg',
			'jfif-tbnl': 'image/jpeg',
			'jpe': 'image/jpeg',
		},
		jp2: {
			'jp2': 'image/jp2',
			'j2k': 'image/jp2',
			'jpf': 'image/jpx',
			'jpm': 'image/jpm',
			'jpg2': 'image/jp2',
			'j2c': 'image/jp2',
			'jpc': 'image/jp2',
			'jpx': 'image/jpx',
		},
		jxr: {
			'jxr': 'image/jxr',
			'hdp': 'image/vnd.ms-photo',
			'wdp': 'image/vnd.ms-photo',
		},
		jxl: {
			'jxl': 'image/jxl',
		},
		png: {
			'png': 'image/png',
			'x-png': 'image/png',
			'apng': 'image/apng',
		},
		svg: {
			'svg': 'image/svg+xml',
			'svgz': 'image/svg+xml',
		},
		gif: {
			'gif': 'image/gif',
		},
		bmp: {
			'bmp': 'image/bmp',
			'dib': 'image/bmp',
		},
		ico: {
			'ico': 'image/vnd.microsoft.icon',
		},
		webp: {
			'webp': 'image/webp',
		},
		avif: {
			'avif': 'image/avif',
			'avifs': 'image/avif-sequence',
		},
		heic: {
			'heic': 'image/heic',
			'heif': 'image/heif',
			'heics': 'image/heic-sequence',
			'heifs': 'image/heif-sequence',
		},
		special: {
			'tbn': 'image/jpeg',
		},
	},
	compressed: {
		all: {},
		'7z': {
			// ZIP
			'zip': 'application/zip',
			'cbz': 'application/x-cbz',

			// RAR
			'rar': 'application/vnd.rar',
			'cbr': 'application/x-cbr',

			// 7Z
			'7z': 'application/x-7z-compressed',
			'cb7': 'application/x-cb7',

			// ACE
			'ace': 'application/x-ace-compressed',
			'cba': 'application/x-cba',

			// TAR
			'tar': 'application/x-tar',
			'cbt': 'application/x-cbt',
			// GZ (TAR)
			'tgz': 'application/x-tar-compressed',
			'tar.gz': 'application/gzip',
			'tar.gzip': 'application/gzip',
			// XZ (TAR)
			'txz': 'application/x-tar-compressed',
			'tar.xz': 'application/x-xz',
			// BZIP2 (TAR)
			'tbz': 'application/x-tar-compressed',
			'tbz2': 'application/x-tar-compressed',
			'tar.bz2': 'application/x-bzip2',
			'tar.bzip2': 'application/x-bzip2',
			// ZSTD (TAR)
			'tzst': 'application/x-tar-compressed',
			'tar.zst': 'application/x-tar-compressed',
			'tar.zstd': 'application/x-tar-compressed',

			// LZH
			'lzh': 'application/x-lzh-compressed',
			'lha': 'application/x-lzh-compressed',
		},
		pdf: {
			'pdf': 'application/pdf',
		},
		epub: {
			'epub': 'application/epub+zip',
			'epub3': 'application/epub+zip',
		},
	},
	audio: {
		all: {
			'mp3': 'audio/mpeg',
			'mpga': 'audio/mpeg',
			'm4a': 'audio/mp4',
			'mp4': 'audio/mp4',
			'webm': 'video/webm',
			'weba': 'audio/webm',
			'oga': 'audio/ogg',
			'ogg': 'audio/ogg',
			'opus': 'audio/ogg',
			'wav': 'audio/wav',
			'flac': 'audio/x-flac',
		},
	},
};

const compatibleMime = {
	image: {
		all: {},
		blob: { /* This image formats requires conversion to Blob to be displayed */ },
		convert: { /* This image formats requires conversion to PNG to be displayed */ },
		jpg: {
			'image/jpeg': 'jpg',
			'image/pjpeg': 'jfif',
		},
		jp2: {
			'image/jp2': 'jp2',
			'image/jpx': 'jpf',
			'image/jpm': 'jpm', 
		},
		jxr: {
			'image/jxr': 'jxr',
			'image/vnd.ms-photo': 'hdp',
		},
		jxl: {
			'image/jxl': 'image/jxl',
		},
		png: {
			'image/png': 'png',
			'image/apng': 'apng',
		},
		svg: {
			'image/svg': 'svg',
			'image/svg+xml': 'svg',
		},
		gif: {
			'image/gif': 'gif',
		},
		bmp: {
			'image/x-ms-bmp': 'bmp',
			'image/bmp': 'bmp',
		},
		ico: {
			'image/x-icon': 'ico',
			'image/vnd.microsoft.icon': 'ico',
		},
		webp: {
			'image/webp': 'webp',
		},
		avif: {
			'image/avif': 'avif',
			'image/avif-sequence': 'avifs',
		},
		heic: {
			'image/heic': 'heic',
			'image/heif': 'heif',
			'image/heic-sequence': 'heics',
			'image/heif-sequence': 'heifs',
		},
	},
	compressed: {
		all: {},
		'7z': {
			// ZIP
			'application/zip': 'zip',
			'application/x-cbz': 'cbz',
			'application/x-zip': 'zip',
			'application/x-zip-compressed': 'zip',
			'application/vnd.comicbook+zip': 'cbz',

			// RAR
			'application/rar': 'rar',
			'application/x-cbr': 'cbr',
			'application/x-rar': 'rar',
			'application/x-rar-compressed': 'rar',
			'application/vnd.rar': 'rar',
			'application/vnd.comicbook-rar': 'cbr',

			// 7Z
			'application/7z': '7z',
			'application/x-cb7': 'cb7',
			'application/x-7z': '7z',
			'application/x-7z-compressed': '7z',
			'application/vnd.comicbook+7z': 'cb7',

			// ACE
			'application/ace': 'ace',
			'application/x-ace': 'ace',
			'application/x-cba': 'cba',
			'application/x-ace-compressed': 'ace',
			'application/vnd.comicbook+ace': 'cba',

			// TAR
			'application/tar': 'tar',
			'application/x-cbt': 'cbt',
			'application/x-tar': 'tar',
			'application/x-tar-compressed': 'tgz',
			'application/vnd.comicbook+tar': 'cbt',

			// LZH
			'application/x-lzh-compressed': 'lzh',
		},
		pdf: {
			'application/pdf': 'pdf',
			'application/x-bzpdf': 'pdf',
			'application/x-gzpdf': 'pdf',
		},
		epub: {
			'application/epub+zip': 'epub',
		},
	},
	audio: {
		all: {
			'audio/mpeg': 'mpga',
			'audio/mp4': 'm4a',
			'audio/webm': 'weba',
			'audio/ogg': 'oga',
			'audio/opus': 'oga',
			'audio/wav': 'wav',
			'audio/flac': 'flac',
			'audio/x-flac': 'flac',
		},
	},
};


// Generate mime and extension map
function getMime(map, string) // Get mime from extension
{
	const ext = app.extname(string);
	return map.get(ext) ?? map.get(string);
}

function getExtension(map, string) // Get extension from mime
{
	return map.get(string);
}

function generateMap(object, extension = false)
{
	const map = new Map();

	for(const group in object)
	{
		for(const format in object[group])
		{
			for(const key in object[group][format])
			{
				map.set(key, object[group][format][key]);
			}

			object[group][format] = Object.keys(object[group][format]);
		}
	}

	const _get = extension ? getMime : getExtension;
	const _function = function(string) {
		return _get(map, string);
	};

	_function.map = map;
	_function.get = _function;

	return _function;
}

const extension = generateMap(compatibleMime);
const mime = generateMap(compatible, true);

compatible.compressed._7z = compatible.compressed['7z'];
compatibleMime.compressed._7z = compatibleMime.compressed['7z'];

// Join images
compatible.image.all = [
	...compatible.image.jpg,
	...compatible.image.jp2,
	...compatible.image.jxr,
	...compatible.image.jxl,
	...compatible.image.png,
	...compatible.image.svg,
	...compatible.image.gif,
	...compatible.image.bmp,
	...compatible.image.ico,
	...compatible.image.webp,
	...compatible.image.avif,
	...compatible.image.heic,
];
compatible.image.blob = [ // This image formats requires conversion to Blob to be displayed

];
compatible.image.convert = [ // This image formats requires conversion to PNG to be displayed
	...compatible.image.jxr,
	...compatible.image.jp2,
	...compatible.image.jxl,
	...compatible.image.heic,	
];

// Join compressed
compatible.compressed.all = [
	...compatible.compressed._7z,
	...compatible.compressed.pdf,
	...compatible.compressed.epub,
];

// Join mime images
compatibleMime.image.all = [
	...compatibleMime.image.jpg,
	...compatibleMime.image.jp2,
	...compatibleMime.image.jxr,
	...compatibleMime.image.jxl,
	...compatibleMime.image.png,
	...compatibleMime.image.svg,
	...compatibleMime.image.gif,
	...compatibleMime.image.bmp,
	...compatibleMime.image.ico,
	...compatibleMime.image.webp,
	...compatibleMime.image.avif,
	...compatibleMime.image.heic,
];
compatibleMime.image.blob = [ // This image formats requires conversion to Blob to be displayed

];
compatibleMime.image.convert = [ // This image formats requires conversion to PNG to be displayed
	...compatibleMime.image.jxr,
	...compatibleMime.image.jp2,
	...compatibleMime.image.jxl,
	...compatibleMime.image.heic,
];

// Join mime compressed
compatibleMime.compressed.all = [
	...compatibleMime.compressed._7z,
	...compatibleMime.compressed.pdf,
	...compatibleMime.compressed.epub,
];

// Generate open
compatible.open = {
	all: [
		...compatible.image.all,
		...compatible.compressed.all
	],
};

compatibleMime.open = {
	all: [
		...compatibleMime.image.all,
		...compatibleMime.compressed.all
	],
};

// Generate without convert
compatible.image.withoutConvert = removeElements(compatible.image.all, [...compatible.image.blob, ...compatible.image.convert]);
compatibleMime.image.withoutConvert = removeElements(compatibleMime.image.all, [...compatibleMime.image.blob, ...compatibleMime.image.convert]);

function check(set, string)
{
	const ext = app.extname(string);
	return set.has(ext);
}

function checkCompressed(set, string)
{
	const ext = app.extnameC(string);
	return set.has(ext);
}

const _export = {
	check,
	// list,
	extension,
	mime,
}

// Generate the object
for(const type in compatible)
{
	for(const ext in compatible[type])
	{
		const set = new Set(compatible[type][ext]);

		const _check = type === 'compressed' ? checkCompressed : check;
		const _function = function(string) {
			return _check(set, string);
		};

		_function.has = function(ext){
			return set.has(ext);
		};

		_function.list = function() {
			return compatible[type][ext];
		};

		if(ext === 'all')
			_export[type] = _function;
		else
			_export[type][ext] = _function;
	}
}

// Generate the mime object
for(const type in compatibleMime)
{
	for(const ext in compatibleMime[type])
	{
		const set = new Set(compatibleMime[type][ext]);

		const _function = function(mime) {
			return set.has(mime);
		};

		_function.list = function() {
			return compatibleMime[type][ext];
		};

		if(ext === 'all')
			_export.mime[type] = _function;
		else
			_export.mime[type][ext] = _function;
	}
}

module.exports = _export;