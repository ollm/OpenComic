import p from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import un7z from 'node-7z';
import bin7z from '7zip-bin-full';

import driver from './driver.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const storage: any;
declare const asarToAsarUnpacked: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const path7z = asarToAsarUnpacked(bin7z.path7z);

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
		const archive = un7z.add(p.join(path, name), files, {
			$bin: path7z,
			method: ['x=1'],
		});

		archive.on('error', function(error) {
			console.error('7z error:', error);
		});
	}
	catch (error)
	{
		console.error(error);
	}

	purgeOld();

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
