const {fork} = require('node:child_process');

class ChildFork
{
	fork;
	#index = 0;
	#idleTimeout;
	#key = crypto.randomUUID();
	onCloseCallback = false;
	promisses = [];
	shouldCloseOnFinish = false;

	constructor(options = {}) {

		this.fork = fork(p.join(appDir, '.dist/fork.js'));
		this.fork.on('message', (event) => this.message(event));

		this.#idleTimeout = options.idleTimeout || false;

		if(this.#idleTimeout && options.idleTimeoutInit)
			app.setDebounce(this.#key, () => this.close(), this.#idleTimeout);

	}

	message(data) {

		const arrayIndex = this.promisses.findIndex(item => item.index === data.index);
		const promise = this.promisses[arrayIndex];
		this.promisses.splice(arrayIndex, 1);

		if(data.error)
			promise.reject(data.error);
		else
			promise.resolve(data.result);

		if(this.shouldCloseOnFinish)
			this.closeOnFinish();

	}

	work(options = {}) {

		if(this.#idleTimeout)
			app.setDebounce(this.#key, () => this.close(), this.#idleTimeout);

		const index = this.#index++;

		this.fork.send({
			index: index,
			...options,
		});

		let resolve = false, reject = false;

		const promise = new Promise(function(_resolve, _reject){

			resolve = _resolve;
			reject = _reject;

		});

		this.promisses.push({
			index: index,
			resolve: resolve,
			reject: reject,
		});

		return promise;

	}

	onClose(callback) {
		this.onCloseCallback = callback;
	}

	close() {

		if(!this.fork)
			return;

		this.fork.kill();
		delete this.fork;

		if(this.onCloseCallback)
			this.onCloseCallback();
	}

	closeOnFinish() {
		
		if(!this.promisses.length)
			this.close();
		else
			this.shouldCloseOnFinish = true;

	}
}

let IDLE_TIMEOUT = 5000;
let JOBS_PER_CYCLE = 30;

function config(options)
{
	if(options.idleTimeout !== undefined)
		IDLE_TIMEOUT = options.idleTimeout;

	if(options.jobsPerCycle !== undefined)
		JOBS_PER_CYCLE = options.jobsPerCycle;
}

const forks = [];
let index = 0;

function pushFork()
{
	const _index = index++;
	const fork = new ChildFork({idleTimeout: IDLE_TIMEOUT, idleTimeoutInit: false});

	forks.push({
		index: _index,
		count: 0,
		fork: fork,
	});

	fork.onClose(function(){
		closeFork(_index);
	});
}

function closeFork(index)
{
	const fork = forks.find(item => item.index === index);
	if(!fork) return;

	forks.splice(forks.indexOf(fork), 1);
	fork.fork.closeOnFinish();
}

// Keep 2 forks alive to avoid delays
function createForks()
{
	const fork = forks[0] || false;

	if(fork?.count > JOBS_PER_CYCLE)
		closeFork(fork.index);

	if(!forks[0]) pushFork();
	if(!forks[1]) pushFork();
}

function getFork(count = true)
{
	createForks();

	const fork = forks[0];
	if(count) fork.count++;

	return fork.fork;
}

async function _resize() {

	const fork = getFork();

	const result = await fork.work({
		job: '_resize',
		args: [...arguments],
	});

	return;
}

async function resizeToBlob() {

	const fork = getFork();

	return fork.work({
		job: 'resizeToBlob',
		args: [...arguments],
	});

}

module.exports = {
	ChildFork,
	config,
	_resize,
	resizeToBlob,
};