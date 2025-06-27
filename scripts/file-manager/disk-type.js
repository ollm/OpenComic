const systemInfo = require('systeminformation');

var runned = false;

async function _findDisks(method = 0)
{
	const disks = [];

	if(method === 1)
	{
		const diskLayout = await systemInfo.diskLayout();
		const blockDevices = await systemInfo.blockDevices();

		for(const layout of diskLayout)
		{
			const regex = layout.device ? new RegExp('^'+pregQuote(layout.device), '') : false;;
			const mount = blockDevices.find(function(block) {

				return regex && block.device && block.device === layout.device ? true : false;

			});

			if(mount && mount.mount)
			{
				disks.push({
					name: layout.name,
					mount: mount.mount,
					type: layout.type,
					hdd: /HD/iu.test(layout.type),
					ssd: /SSD/iu.test(layout.type),
					nvme: /NVMe/iu.test(layout.type),
				});
			}
		}
	}
	else if(method === 2)
	{
		const blockDevices = await systemInfo.blockDevices();

		for(const block of blockDevices)
		{
			if(block && block.mount && block.physical)
			{
				const type = /NVMe/iu.test(block.protocol) ? 'NVMe' : block.physical;

				disks.push({
					name: block.label,
					mount: block.mount,
					type: type,
					hdd: /HD/iu.test(type),
					ssd: /SSD/iu.test(type),
					nvme: /NVMe/iu.test(type),
				});
			}
		}
	}
	else
	{
		const diskLayout = await systemInfo.diskLayout();
		const fsSize = await systemInfo.fsSize();

		for(const layout of diskLayout)
		{
			const regex = layout.device ? new RegExp('^'+pregQuote(layout.device), '') : false;
			const mount = fsSize.find(function(size) {

				return regex && size.fs && regex.test(size.fs) ? true : false;

			});

			if(mount && mount.mount)
			{
				disks.push({
					name: layout.name,
					mount: mount.mount,
					type: layout.type,
					hdd: /HD/iu.test(layout.type),
					ssd: /SSD/iu.test(layout.type),
					nvme: /NVMe/iu.test(layout.type),
				});
			}
		}
	}

	return disks;
}

async function findDisks(force = false)
{
	if(runned && !force)
		return;

	runned = true;

	let disks = [];

	if(process.platform == 'win32')
	{
		disks = await _findDisks(1);
		if(!disks.length) disks = await _findDisks(2);
		if(!disks.length) disks = await _findDisks(0);
	}
	else if(process.platform == 'darwin')
	{
		disks = await _findDisks(2);
		if(!disks.length) disks = await _findDisks(0);
		if(!disks.length) disks = await _findDisks(1);
	}
	else
	{
		disks = await _findDisks(0);
		if(!disks.length) disks = await _findDisks(1);
		if(!disks.length) disks = await _findDisks(2);
	}

	disks.sort(function(a, b) {
		
		if(a.mount.length === b.mount.length)
			return 0;

		return a.mount.length > b.mount.length ? -1 : 1;

	});

	storage.set('disks', disks);
	getDisks(true); // Update disks cache

	return disks;
}

var disks = false;

function getDisks(force = false)
{
	if(disks !== false && !force)
		return disks;

	if(!force)
		findDisks();

	disks = storage.get('disks') || [];

	for(const disk of disks)
	{
		disk.mountRegex = new RegExp('^'+pregQuote(disk.mount), '');
	}

	return disks;
}

function check(path)
{
	const disks = getDisks();

	for(let i = 0, len = disks.length; i < len; i++)
	{
		const disk = disks[i];

		if(disk.mountRegex.test(path))
			return disk;
	}

	return {
		hdd: false,
		ssd: true,
		nvme: false,
	};
}

module.exports = {
	check,
	getDisks,
	findDisks,
	_findDisks,
};