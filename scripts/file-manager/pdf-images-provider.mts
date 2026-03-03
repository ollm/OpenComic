import p from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import zlib from 'zlib';
import {promisify} from 'util';
import {fileTypeFromBuffer} from 'file-type';

const inflate = promisify(zlib.inflate);

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface PdfImage {
	name: string;
	objStart: number;
	streamStart: number;
	streamEnd: number;
	streamDataStart: number;
	streamLength: number;
	width: number;
	height: number;
	format: string;
	filters: string[];
}

export interface ExtractOptions {
	files?: string[];
	progress?: (progress: number, file: string) => void;
}

const SUBTYPE = Buffer.from('/Subtype');
const IMAGE = Buffer.from('/Image');
const STREAM = Buffer.from('stream');
const ENDSTREAM = Buffer.from('endstream');

const LF = 0x0A; // \n
const CR = 0x0D; // \r

export default class PdfImagesProvider {

	path: string = '';
	images: PdfImage[] = [];

	constructor(path: string) {

		if(!path)
			throw new Error('Path is required');

		this.path = path;

	}

	readed: boolean = false;
	data: Buffer = Buffer.alloc(0);

	async _read() {

		if(this.readed)
			return;

		if(!fs.existsSync(this.path))
			throw new Error('File does not exist');

		// TODO: Instead of reading all file into memory, we can read it in chunks and process it. This will be more efficient for large files.
		this.data = await fsp.readFile(this.path);

		const len = this.data.length;
		let offset = 0;

		while(offset < len)
		{
			const objStart = this.data.indexOf(SUBTYPE, offset);
			if (objStart === -1) break;

			const imageStart = this.data.indexOf(IMAGE, objStart);
			if (imageStart === -1) break;

			if(objStart + SUBTYPE.length < imageStart - 5) // Allow some space between /Subtype and /Image, but not too much
			{
				offset = objStart + SUBTYPE.length;
				continue;
			}

			const streamStart = this.data.indexOf(STREAM, imageStart);
			if (streamStart === -1) break;

			let streamDataStart = streamStart + STREAM.length;

			console.log(streamDataStart);

			if(this.data[streamDataStart] === CR)
				streamDataStart++;

			if(this.data[streamDataStart] === LF)
				streamDataStart++;

			console.log(streamDataStart);
			console.log('-------');

			const streamEnd = this.data.indexOf(ENDSTREAM, streamStart);
			if (streamEnd === -1) break;

			await this.imageData(objStart, streamStart, streamDataStart, streamEnd);
			offset = streamEnd + ENDSTREAM.length;
		}

		this.images.sort((a, b) => a.objStart - b.objStart);
		const leadingZeros = Math.max(String(this.images.length).length, 4);

		this.images = this.images.map(function(image, i) {

			return {
				...image,
				name: `image-${String(i + 1).padStart(leadingZeros, '0')}.${image.format}`,
			};

		});

		this.readed = true;

	}

	async imageData(objStart: number, streamStart: number, streamDataStart: number, streamEnd: number): Promise<PdfImage | void> {

		const streamLength = streamEnd - streamDataStart;
		const header = this.data.subarray(objStart, streamStart).toString('latin1');

		const widthMatch = header.match(/\/Width\s+(\d+)/);
		const heightMatch = header.match(/\/Height\s+(\d+)/);
		const width = widthMatch ? parseInt(widthMatch[1]) : 0;
		const height = heightMatch ? parseInt(heightMatch[1]) : 0;

		console.log('imageData, width:', width, 'height:', height);

		// if(width === 0 || height === 0) // Disable, Some PDF files have 0 size
		//	return;

		const filters: string[] = [];
		let filtersMatch: string = '';

		const multiFilters = /\/Filter\s*\[/.test(header);

		if(multiFilters)
			filtersMatch = app.extract(/\/Filter\s*\[([\w/ ]+?)\]/, header, 1);
		else
			filtersMatch = app.extract(/\/Filter\s*\/([\w]+)/, header, 1);

		if(filtersMatch)
			filters.push(...filtersMatch.split(/[ /]/).map(function(f) {return f.replace(/^\//, '').trim()}).filter(Boolean));

		// https://github.com/mozilla/pdf.js/blob/3a32ca7e69df090be72be7e33063d0bfd1f85943/src/core/parser.js
		let ext: string = 'bin';

		for(const filter of filters)
		{
			switch(filter)
			{
				case 'Fl':
				case 'FlateDecode':
					// Ignore
					break;
				case 'LZW':
				case 'LZWDecode':
					// Ignore for now
					break;
				case 'DCT':
				case 'DCTDecode':
					ext = 'jpg';
					break;
				case 'JPX':
				case 'JPXDecode':
					ext = 'jp2';
					break;
				case 'A85':
				case 'ASCII85Decode':
					// Ignore for now
					break;
				case 'AHx':
				case 'ASCIIHexDecode':
					// Ignore for now
					break;
				case 'CCF':
				case 'CCITTFaxDecode':
					ext = 'tiff';
					break;
				case 'RL':
				case 'RunLengthDecode':
					// Ignore for now
					break;
				case 'JBIG2Decode':
					ext = 'jbig2';
					break;
				case 'BrotliDecode':
					// Ignore for now
					break;
			}
		}

		if(ext === 'bin')
		{
			let buffer = this.data.subarray(streamDataStart, streamEnd);

			for(const filter of filters)
			{
				switch(filter)
				{
					case 'Fl':
					case 'FlateDecode':
						buffer = await inflate(buffer);
						break;
				}
			}

			const fileType = await fileTypeFromBuffer(buffer);

			if(fileType)
				ext = fileType.ext;
		}

		const image: PdfImage = {
			name: '',
			objStart,
			streamStart,
			streamEnd,
			streamDataStart,
			streamLength,
			width,
			height,
			format: ext,
			filters,
		};

		this.images.push(image);

		return image;

	}

	async read(): Promise<PdfImage[]> {

		await this._read();
		return this.images;

	}

	async extract(dest: string, {files, progress}: ExtractOptions = {}): Promise<void> {

		await this._read();

		// TODO: Instead of reading all file into memory, we can read it in chunks and process it. This will be more efficient for large files.
		const data = this.data;
		const set = new Set(files ?? []);

		const extractLen = files ? this.images.filter(image => set.has(image.name)).length : this.images.length;
		let extracted = 0;

		const promises: Promise<void>[] = [];

		for(const image of this.images)
		{
			if(!files || set.has(image.name))
			{
				promises.push((async function(): Promise<void> {

					const outputPath = p.join(dest, image.name);
					let buffer = data.subarray(image.streamDataStart, image.streamEnd);

					for(const filter of image.filters)
					{
						switch(filter)
						{
							case 'Fl':
							case 'FlateDecode':
								buffer = await inflate(buffer);
								break;
							case 'LZW':
							case 'LZWDecode':
								// Ignore for now
								break;
							case 'A85':
							case 'ASCII85Decode':
								// Ignore for now
								break;
							case 'AHx':
							case 'ASCIIHexDecode':
								// Ignore for now
								break;
							case 'RL':
							case 'RunLengthDecode':
								// Ignore for now
								break;
							case 'BrotliDecode':
								// Ignore for now
								break;
						}
					}

					await fsp.writeFile(outputPath, buffer);

					if(progress)
						progress(++extracted / extractLen, image.name);

				})());
			}
		}

		await Promise.all(promises);

		return;

	}

}
