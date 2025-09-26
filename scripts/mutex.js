const locks = new Map();

async function lock(key = '', timeout = 5000)
{
	const currentLock = locks.get(key) || {timeout, locks: [], index: 0};

	const len = currentLock.locks.length;
	const lastLock = len ? currentLock.locks[len - 1] : false;

	const index = currentLock.index++;
	let resolve = false;

	const promise = new Promise(function(_resolve) {
		resolve = _resolve;
	});

	currentLock.locks.push({
		index,
		promise,
		resolve,
		now: Date.now(),
	});

	locks.set(key, currentLock);

	startTimeout();

	if(lastLock)
		await lastLock.promise;

	return function() {
		release(key, index);
	};
}

function release(key, index = false)
{
	const currentLock = locks.get(key);

	if(!currentLock)
		return;

	const lockIndex = index !== false ? currentLock.locks.findIndex((item) => item.index === index) : 0;
	const lock = currentLock.locks[lockIndex];

	if(!lock)
		return;

	currentLock.locks.splice(lockIndex, 1);
	lock.resolve();

	if(currentLock.locks.length === 0)
		locks.delete(key);
	else
		locks.set(key, currentLock);
}

let setIntervalId = false;

function startTimeout()
{
	if(setIntervalId !== false)
		return;

	setIntervalId = setInterval(realeseTimeouts, 1000);
}

function realeseTimeouts()
{
	const now = Date.now();

	for(const [key, currentLock] of locks)
	{
		if(currentLock.locks.length === 0)
		{
			locks.delete(key);
			continue;
		}

		const lock = currentLock.locks[0];

		if(now - lock.now > currentLock.timeout)
			release(key, lock.index);
	}

	if(locks.size === 0)
	{
		clearInterval(setIntervalId);
		setIntervalId = false;
	}
}

module.exports = {
	lock,
	get locks() {return locks}
}