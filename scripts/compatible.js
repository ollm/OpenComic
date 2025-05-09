const compatible = {
	image: {
		all: [],
		blob: [ /* This image formats requires conversion to Blob to be displayed */ ],
		convert: [ /* This image formats requires conversion to PNG to be displayed */ ],
		jpg: [
			'jpg',
			'jpeg',
			'jif',
			'jfi',
			'jfif',
			'jfif-tbnl',
			'jpe',
		],
		jp2: [
			'jp2',
			'j2k',
			'jpf',
			'jpm',
			'jpg2',
			'j2c',
			'jpc',
			'jpx',
		],
		jxr: [
			'jxr',
			'hdp',
			'wdp',
		],
		jxl: [
			'jxl',
		],
		png: [
			'png',
			'x-png',
			'apng',
		],
		svg: [
			'svg',
			'svgz',
		],
		gif: [
			'gif',
		],
		bmp: [
			'bmp',
			'dib',
		],
		ico: [
			'ico',
		],
		webp: [
			'webp',
		],
		avif: [
			'avif',
			'avifs',
		],
		heic: [
			'heic',
			'heif',
		],
		special: [
			'tbn',
		],
	},
	compressed: {
		all: [],
		'7z': [
			// ZIP
			'zip',
			'cbz',

			// RAR
			'rar',
			'cbr',

			// 7Z
			'7z',
			'cb7',

			// ACE
			'ace',
			'cba',

			// TAR
			'tar',
			'cbt',
			// GZ (TAR)
			'tgz',
			'tar.gz',
			'tar.gzip',
			// XZ (TAR)
			'txz',
			'tar.xz',
			// BZIP2 (TAR)
			'tbz',
			'tbz2',
			'tar.bz2',
			'tar.bzip2',
			// ZSTD (TAR)
			'tzst',
			'tar.zst',
			'tar.zstd',

			// LZH
			'lzh',
			'lha',
		],
		pdf: [
			'pdf',
		],
		epub: [
			'epub',
			'epub3',
		],
	},
	audio: {
		all: [
			'mp3',
			'm4a',
			'webm',
			'weba',
			'ogg',
			'opus',
			'wav',
			'flac',
		],
	},
};

const compatibleMime = {
	image: {
		all: [],
		blob: [ /* This image formats requires conversion to Blob to be displayed */ ],
		convert: [ /* This image formats requires conversion to PNG to be displayed */ ],
		jpg: [
			'image/jpeg',
			'image/pjpeg',
		],
		jp2: [
			'image/jp2',
			'image/jpx',
			'image/jpm', 
		],
		jxr: [
			'image/jxr',
			'image/vnd.ms-photo',
		],
		jxl: [
			'image/jxl',
		],
		png: [
			'image/png',
			'image/apng',
		],
		svg: [
			'image/svg',
			'image/svg+xml',
		],
		gif: [
			'image/gif',
		],
		bmp: [
			'image/x-ms-bmp',
			'image/bmp',
		],
		ico: [
			'image/x-icon',
			'image/vnd.microsoft.icon',
		],
		webp: [
			'image/webp',
		],
		avif: [
			'image/avif',
			'image/avif-sequence',
		],
		heic: [
			'image/heic',
			'image/heif',
			'image/heic-sequence',
			'image/heif-sequence',
		],
	},
	compressed: {
		all: [],
		'7z': [
			// ZIP
			'application/zip',
			'application/x-cbz',
			'application/x-zip',
			'application/x-zip-compressed',
			'application/vnd.comicbook+zip',

			// RAR
			'application/rar',
			'application/x-cbr',
			'application/x-rar',
			'application/x-rar-compressed',
			'application/vnd.rar',
			'application/vnd.comicbook-rar',

			// 7Z
			'application/7z',
			'application/x-cb7',
			'application/x-7z',
			'application/x-7z-compressed',
			'application/vnd.comicbook+7z',

			// ACE
			'application/ace',
			'application/x-ace',
			'application/x-cba',
			'application/x-ace-compressed',
			'application/vnd.comicbook+ace',

			// TAR
			'application/tar',
			'application/x-cbt',
			'application/x-tar',
			'application/x-tar-compressed',
			'application/vnd.comicbook+tar',

			// LZH
			'application/x-lzh-compressed',
		],
		pdf: [
			'application/pdf',
			'application/x-bzpdf',
			'application/x-gzpdf',
		],
		epub: [
			'application/epub+zip',
		],
	},
	audio: {
		all: [
			'audio/mpeg',
			'audio/mp4',
			'audio/webm',
			'audio/ogg',
			'audio/opus',
			'audio/wav',
			'audio/flac',
		],
	},
};

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
	...compatible.image.jp2,
	...compatible.image.jxl,
	...compatible.image.heic,	
];
compatible.image.convert = [ // This image formats requires conversion to PNG to be displayed
	...compatible.image.jxr,	
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
	...compatibleMime.image.jp2,
	...compatibleMime.image.jxl,
	...compatibleMime.image.heic,	
];
compatibleMime.image.convert = [ // This image formats requires conversion to PNG to be displayed
	...compatibleMime.image.jxr,	
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
	check: check,
	// list: list,
	mime: {

	},
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