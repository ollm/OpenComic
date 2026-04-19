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
	lastDataSha: string | null;
	list: WriteStateList[];
}

interface WriteStateList {
	data: unknown | null;
	forceWrite: boolean;
	waiters: (() => void)[];
}

const writeStates: Record<string, WriteState> = {};

async function write(key: string, data: unknown, forceWrite = true): Promise<void>
{
	const state = writeStates[key] ??= {
		lastDataSha: null,
		list: [],
	};

	const length = state.list.length;
	const {promise, resolve} = Promise.withResolvers<void>();

	if(length === 0 || length === 1)
	{
		state.list.push({data, waiters: [resolve], forceWrite});
	}
	else
	{
		const list = state.list[1];

		list.data = data;
		list.waiters.push(resolve);
		list.forceWrite = list.forceWrite || forceWrite;
	}

	// If already writing, just wait
	if(length > 0)
		return promise;

	processWrite(key, state);
	return promise;
}

async function processWrite(key: string, state: WriteState): Promise<void>
{
	let item;

	while((item = state.list[0]))
	{
		const data = item.data;

		const json = JSON.stringify(data);
		const sha = crypto.hash('sha1', json, 'hex');

		if(state.lastDataSha !== sha || item.forceWrite)
		{
			try
			{
				const file = getFile(key);
				await writeFile(file, json, 'utf8');
				state.lastDataSha = sha;
			}
			catch (err)
			{
				console.error('Error writing file:', err);
			}
		}

		for(const resolve of item.waiters)
		{
			resolve();
		}

		state.list.shift();
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
