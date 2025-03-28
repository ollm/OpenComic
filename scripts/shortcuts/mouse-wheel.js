class MouseWheel
{
	#passive;
	#captute;
	#target;

	constructor(options = {}) {

		this.#passive = options.passive ?? false;
		this.#captute = options.captute ?? false;
		this.#target = options.target ?? false;
	}

	wheel = (event) => {

		let preventDefault = false;

		const up = event.deltaY < 0;
		const down = event.deltaY > 0;
		const left = event.deltaX < 0;
		const right = event.deltaX > 0;

		const alt = event.altKey ?? false;
		const cmd = event.metaKey ?? false;
		const ctrl = event.ctrlKey ?? false;
		const shift = event.shiftKey ?? false;

		let keepScrollEvent = false;

		if(!alt && !cmd && !ctrl && !shift && reading.readingViewIs('scroll'))
			keepScrollEvent = true;

		for(let i = 0, length = this.shortcuts.length; i < length; i++)
		{
			const shortcut = this.shortcuts[i];

			if(shortcut.all)
			{
				shortcut.callback(event);
				preventDefault = true;
			}
			else if(shortcut.alt === alt && shortcut.cmd === cmd && shortcut.ctrl === ctrl && shortcut.shift === shift)
			{
				if(shortcut.up && up && !keepScrollEvent)
					preventDefault = shortcut.callback(event);
				else if(shortcut.down && down && !keepScrollEvent)
					preventDefault = shortcut.callback(event);
				else if(shortcut.left && left)
					preventDefault = shortcut.callback(event);
				else if(shortcut.right && right)
					preventDefault = shortcut.callback(event);
			}
		}

		if(preventDefault)
		{
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}

	record(callback) {

		const mouseWheel = new MouseWheel({
			capture: true,
			target: document,
		});

		mouseWheel.register('all', function(event) {

			const up = event.deltaY < 0;
			const down = event.deltaY > 0;
			const left = event.deltaX < 0;
			const right = event.deltaX > 0;

			const alt = event.altKey ?? false;
			const cmd = event.metaKey ?? false;
			const ctrl = event.ctrlKey ?? false;
			const shift = event.shiftKey ?? false;

			let shortcut = '';

			if(alt) shortcut += 'alt+';
			if(cmd) shortcut += 'cmd+';
			if(ctrl) shortcut += 'ctrl+';
			if(shift) shortcut += 'shift+';

			shortcut = ShoSho.format(shortcut, 'short-inflexible-nondirectional')
			if(shortcut) shortcut += '+';

			if(up)
				shortcut += 'MouseUp';
			else if(down)
				shortcut += 'MouseDown';
			else if(left)
				shortcut += 'MouseLeft';
			else if(right)
				shortcut += 'MouseRight';

			callback(shortcut);

		});

		mouseWheel.start();

		return function() {

			mouseWheel.reset();

		}

	}

	shortcuts = [];

	register(shortcut, callback) {

		this.shortcuts.push({
			up: /mouseUp/i.test(shortcut),
			down: /mouseDown/i.test(shortcut),
			left: /mouseLeft/i.test(shortcut),
			right: /mouseRight/i.test(shortcut),
			alt: /alt|option/i.test(shortcut),
			cmd: /cmd|command|meta/i.test(shortcut),
			ctrl: /ctrl|control/i.test(shortcut),
			shift: /shift/i.test(shortcut),
			all: /all/i.test(shortcut),
			callback: callback,
		});

	}

	#registred = false;

	start() {

		if(!this.#registred)
		{
			this.#target.addEventListener('wheel', this.wheel, {passive: this.#passive, capture: this.#captute});
			this.#registred = true;
		}
	}

	reset() {

		this.#target.removeEventListener('wheel', this.wheel, {passive: this.#passive, capture: this.#captute});
		this.#registred = false;
		this.shortcuts = [];

	}
}

module.exports = MouseWheel;