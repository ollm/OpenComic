import p from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {readFile, readFileSync, writeFile} from 'atomically';

let path: string | null = null;

function setPath(_path: string)
{
	path = _path;

	if(!fs.existsSync(path))
		fs.mkdirSync(path, {recursive: true});
}

function getFile(key: string): string
{
	if(!path)
		throw new Error('Path is not set');

	return p.join(path, `${key}.json`);
}

// Read functions
async function read(key: string): Promise<unknown | null>
{
	const file = getFile(key);

	if(!fs.existsSync(file))
		return null;

	const json = await readFile(file, 'utf8');
	return JSON.parse(json);
}

function readSync(key: string): unknown | null
{
	const file = getFile(key);

	if(!fs.existsSync(file))
		return null;

	const json = readFileSync(file, 'utf8');
	return JSON.parse(json);
}

async function readMany(keys: string[]): Promise<Record<string, unknown | null>>
{
	const entries = await Promise.all(
		keys.map(async function(key): Promise<[string, unknown | null]> {
			return [key, await read(key)];
		}),
	);

	return Object.fromEntries(entries);
}

// Write functions
interface WriteState {
	isWriting: boolean;
	lastDataSha: string | null;
	pendingData: unknown | null;
}

const writeStates: Record<string, WriteState> = {};

async function write(key: string, data: unknown, forceWrite: boolean = true): Promise<void>
{
	if(!writeStates[key]) writeStates[key] = {isWriting: false, lastDataSha: null, pendingData: null};
	const state = writeStates[key];

	if(state.isWriting)
	{
		state.pendingData = data;
		return;
	}

	state.isWriting = true;

	const json = JSON.stringify(data);
	const sha = crypto.hash('sha1', json, 'hex');

	if(state.lastDataSha !== sha || forceWrite)
	{
		const file = getFile(key);
		await writeFile(file, json, 'utf8');
	}

	state.isWriting = false;
	state.lastDataSha = sha;

	if(state.pendingData)
	{
		const data = state.pendingData;
		state.pendingData = null;
		write(key, data);
	}
}

export default {
	setPath,
	get path() {return path},
	read,
	readSync,
	readMany,
	write,
};
