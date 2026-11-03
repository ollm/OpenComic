import p from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import {Archive} from '7zip-native';

import driver from './driver.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const storage: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

function getTimestamp()
{
	const now = new Date();

	const pad = function(n) {
		return String(n).padStart(2, '0');
	};

	const year = now.getFullYear();
	const month = pad(now.getMonth() + 1);
	const day = pad(now.getDate());

	const hours = pad(now.getHours());
	const minutes = pad(now.getMinutes());
	const seconds = pad(now.getSeconds());

	return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

async function save() {

	const driverPath = driver.path;
	if(!driverPath) return;

	const path = p.join(driverPath, 'backup');

	if(!fs.existsSync(path))
		await fsp.mkdir(path, {recursive: true});

	const name = `backup-${getTimestamp()}.7z`;
	const files = storage.storageKeys.map(key => p.join(driverPath, `${key}.json`)).filter(file => fs.existsSync(file));

	if(files.length === 0)
		return;

	try
	{
		await Archive.create(p.join(path, name), files.map(file => ({
			sourcePath: file,
			path: p.basename(file),
		})), {
			compressionLevel: 1,
		});

		await purgeOld();
	}
	catch (error)
	{
		console.error(error);
	}

}

async function purgeOld()
{
	const driverPath = driver.path;
	if(!driverPath) return;

	const now = Date.now();
	const path = p.join(driverPath, 'backup');

	const files = await Promise.all((await fsp.readdir(path)).map(async function(name) {

		const file = p.join(path, name);
		const stats = await fsp.stat(file);

		return {
			name,
			file,
			stats,
			time: stats.birthtimeMs || stats.mtimeMs,
		};

	}));

	files.sort((a, b) => b.time - a.time);
	const toDelete = files.slice(7).filter(file => (now - file.time) > 86400000 * 7); // Keep at least 7 backups, and only delete backups older than 7 days

	if(toDelete.length === 0)
		return;

	await Promise.all(
		toDelete.map(f => fsp.unlink(f.file)),
	);
}

export default {
	save,
};
