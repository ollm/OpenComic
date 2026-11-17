import {createRequire} from 'node:module';
import type sharpType from 'sharp';

const require = createRequire(import.meta.url);

let sharp: typeof sharpType | false = false;

export default function loadSharp(): typeof sharpType
{
	if(sharp !== false)
		return sharp;

	if(process.platform !== 'linux')
	{
		const loadedSharp: typeof sharpType = require('sharp');
		sharp = loadedSharp;
		return loadedSharp;
	}

	const archDescriptor = Object.getOwnPropertyDescriptor(process, 'arch');

	if(!archDescriptor)
		throw new Error('Unable to load sharp WASM: process.arch descriptor is unavailable');

	try
	{
		Object.defineProperty(process, 'arch', {...archDescriptor, value: 'wasm32'});
		const loadedSharp: typeof sharpType = require('sharp');
		sharp = loadedSharp;
		return loadedSharp;
	}
	finally
	{
		Object.defineProperty(process, 'arch', archDescriptor);
	}
}
