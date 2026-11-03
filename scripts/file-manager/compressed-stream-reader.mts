import {Archive} from '7zip-native';

import {OptimalThreads} from '@types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const threads: any;
declare const fileManager: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

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

	const archive = await Archive.open(realPath, {
		password: fileManager.filePassword.get(compressed),
	});

	try
	{
		const entries = await archive.entries();
		const entryIds = new Map(entries.map(entry => [entry.path, entry.id]));
		const promises: Promise<BufferWithIndex[]>[] = [];

		for(const task of tasks)
		{
			promises.push(threads.job('7zStreamReader', {useThreads: optimalThreads.extract}, async function(): Promise<BufferWithIndex[]> {

				const files = task.map(function(file) {

					const name = fileManager.removePathPart(file.path, compressed);
					const originalName = fileManager.originalName(name).replace(/\\/g, '/');

					return {
						...file,
						originalName,
					};

				});

				return Promise.all(files.map(async function(file) {

					const entryId = entryIds.get(file.originalName);
					if(entryId === undefined)
						throw new Error(`Archive entry not found: ${file.originalName}`);

					const buffer = await archive.read(entryId, {offset: 0, length: file.size});
					return {index: file.index!, buffer};

				}));

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
	catch (error)
	{
		console.error(error);
		throw error;
	}
	finally
	{
		await archive.close();
	}
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
