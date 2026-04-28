import {exec} from 'child_process';
import {promisify} from 'node:util';
import {path7zc} from '7zip-bin-full';
import crypto from 'crypto';

import {OptimalThreads} from '@types';

const execAsync = promisify(exec);

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const threads: any;
declare const fileManager: any;
declare const asarToAsarUnpacked: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const bin7z = asarToAsarUnpacked(path7zc);

interface GetBuffers {
	index?: number;
	compressed: string;
	name: string;
	path: string;
	size: number;
	buffer?: Buffer;
}

interface BufferWithIndex {
	index: number;
	buffer: Buffer;
}

interface Delimiter {
	name: string;
	quote: string;
	buffer: Buffer;
}

interface TasksStatus {
	tasks: GetBuffers[][];
	current: number;
	fullSize: boolean;
	full: boolean;
}

interface Group {
	compressed: string;
	realPath: string;
	items: GetBuffers[];
	indices: number[];
	optimalThreads: OptimalThreads;
}

function splitBuffer(buffer: Buffer, delimiter: Buffer)
{
	const parts: Buffer[] = [];
	let start = 0;

	while(true)
	{
		const idx = buffer.indexOf(delimiter, start);
		if(idx === -1) break;

		parts.push(buffer.subarray(start, idx));
		start = idx + delimiter.length;
	}

	parts.push(buffer.subarray(start));
	return parts;
}

function quote(string: string): string
{
	if(process.platform === 'win32')
		return `"${String(string).replace(/"/g, '""')}"`;

	return `'${String(string).replace(/'/g, '\'\\\'\'')}'`;
}

function generateDelimiter(): Delimiter
{
	const delimiter = crypto.randomUUID();

	return {
		name: delimiter,
		quote: quote(delimiter),
		buffer: Buffer.from(delimiter),
	};
}

async function _getBuffers({compressed, realPath, items, optimalThreads}: Group): Promise<Buffer[]>
{
	const numThreads: number = threads.num();
	const len = items.length;

	if(!len)
		return [];

	items = items.map((item, index) => ({...item, index}));

	const MAX_FILES = 100;
	const OPTIMAL_FILES = 50;
	const FILE = 1;

	const tasks: GetBuffers[][] = [];

	const status: TasksStatus = {
		tasks: [],
		current: 0,
		fullSize: false,
		full: false,
	};

	for(let i = 0; i < len; i++)
	{
		const task = fileManager.getOptimalTask(FILE, status, OPTIMAL_FILES, MAX_FILES, numThreads);

		if(!tasks[task]) tasks[task] = [];
		tasks[task].push(items[i]);
	}

	const delimiter = generateDelimiter();
	const promises: Promise<BufferWithIndex[]>[] = [];

	for(const task of tasks)
	{
		const higherSize = Math.max(...task.map(file => file.size));

		promises.push(threads.job('7zStreamReader', {useThreads: optimalThreads.extract}, async function(): Promise<BufferWithIndex[]> {

			const files = task.map(function(file) {

				const name = fileManager.removePathPart(file.path, compressed);
				const originalName = fileManager.originalName(name);

				return {
					...file,
					originalName,
				};

			});

			const filesList = files.map(file => quote(file.originalName)).join(' ');

			const command = `${quote(bin7z)} x -so -slb${higherSize} -snf${quote(`${delimiter.name}{name}${delimiter.name}`)} -- ${quote(realPath)} ${filesList}`;
			const data = await execAsync(command, {encoding: 'buffer'});

			const buffer = data.stdout;
			const split = splitBuffer(buffer, delimiter.buffer);
			split.shift(); // First split is empty because of the delimiter at the start

			const names: string[] = split.filter((_, index) => index % 2 === 0).map(name => name.toString());
			const buffers: Buffer[] = split.filter((_, index) => index % 2 === 1);

			const map = new Map<string, Buffer>();

			for(let i = 0, len = names.length; i < len; i++)
			{
				map.set(names[i], buffers[i]);
			}

			return files.map(file => ({index: file.index, buffer: map.get(file.originalName)!})) as BufferWithIndex[];

		}));
	}

	const buffers = await Promise.all(promises);
	const flat = buffers.flat();

	const map: Map<number, Buffer> = new Map();

	for(const item of flat)
	{
		map.set(item.index, item.buffer);
	}

	return items.map(item => map.get(item.index!)!);
}

async function getBuffers(items: GetBuffers[]): Promise<Buffer[]>
{
	const len = items.length;

	if(!len)
		return [];

	// Group
	const groups = new Map<string, Group>();

	for(let i = 0; i < len; i++)
	{
		const item = items[i];
		const compressed = item.compressed;

		if(!groups.has(compressed))
		{
			const realPath = fileManager.realPath(compressed, -1);
			const optimalThreads = fileManager.getOptimalThreads(realPath) as OptimalThreads;
			groups.set(compressed, {compressed, realPath, items: [], indices: [], optimalThreads});
		}

		const group = groups.get(compressed)!;
		group.items.push(item);
		group.indices.push(i);
	}

	// Execute
	const result: Buffer[] = new Array(len);

	const promises = Array.from(groups.values()).map(async function(group) {

		const buffers = await _getBuffers(group);

		for(let i = 0, len = buffers.length; i < len; i++)
		{
			result[group.indices[i]] = buffers[i];
		}

	});

	await Promise.all(promises);

	return result;
}

export default {
	getBuffers,
};
