import {Bezier} from 'bezier-js';

declare const app: any;

const beziers = {
	easeInBezier: new Bezier(0,0, 0.4,0, 1,1, 1,1),
	bounce: new Bezier(0,0, 0.3,0.75, 0.8,1, 1,1),
};

interface SimpleEventOptions {
	type?: string;
	drag?: boolean;
	offset?: number;
	touchAction?: string;
	min?: number | false;
	max?: number | false;
	bounce?: boolean;
	size?: number | (() => number);
	multiple?: boolean;
	speed?: boolean;
}

interface SpeedData {
	time: number;
	x: number;
	y: number;
}

interface CurrentState {
	id?: number;
	first?: boolean;
	start?: { x: number; y: number };
	speed?: SpeedData[];
	active?: boolean;
}

interface CallbackData {
	type: string;
	diffX: number;
	diffY: number;
	speedX: number;
	speedY: number;
	goToX?: number;
	goToY?: number;
}

type SimpleEventCallback = (event: PointerEvent, data: CallbackData) => void;

export default class SimpleEvent {

	element: HTMLElement | false = false;

	// https://stackoverflow.com/questions/50391422/detect-that-given-element-has-been-removed-from-the-dom-without-sacrificing-perf
	constructor(element: HTMLElement | string) {

		if(typeof element === 'string')
			element = document.querySelector(element) as HTMLElement;

		this.element = element;

		// Bing event functions
		this.down = this.down.bind(this);
		this.move = this.move.bind(this);
		this.up = this.up.bind(this);

	}

	options: SimpleEventOptions = {};
	callback: SimpleEventCallback | false = false;

	horizontal(options: SimpleEventOptions = {}, callback: SimpleEventCallback | false = false) {

		this.on({
			type: 'middleHorizontal',
			touchAction: 'pan-y pinch-zoom',
			speed: true,
			...options,
		}, callback);

	}

	on(options: SimpleEventOptions = {}, callback: SimpleEventCallback | false = false) {

		app.event(this.element, 'pointerdown', this.down, {passive: true});
		app.event(this.element, 'pointerup', this.up, {passive: true});

		this.options = {
			drag: true,
			offset: 16,
			touchAction: '',
			min: false,
			max: false,
			bounce: true,
			...options,
		};

		this.callback = callback;
		(this.element as HTMLElement).style.touchAction = options.touchAction || '';

	}

	#current: CurrentState = {

	};

	down(event: PointerEvent) {

		if(this.#current.active) return;

		const x = app.clientX(event);
		const y = app.clientY(event);

		this.#current = {
			id: event.pointerId,
			first: true,
			start: {
				x: x,
				y: y,
			},
			speed: [],
		};

		// this.element.onpointermove = this.move;
		app.event(this.element, 'pointermove', this.move, {passive: false});
		// this.element.setPointerCapture(event.pointerId);
	}

	move(event: PointerEvent) {

		if(event.pointerId === this.#current.id)
		{
			// Check if is horizontal
			if(this.#current.first)
			{
				const options = this.options;
				const start = this.#current.start!;

				const x = app.clientX(event);
				const y = app.clientY(event);

				const diffX = Math.abs(x - start.x);
				const diffY = Math.abs(y - start.y);

				if(diffX > options.offset! || diffY > options.offset!)
				{
					const deg = app.returnDeg(start.y, start.x, y, x);

					if(app.degIs(options.type, deg))
						this.#current.active = true;

					this.#current.first = false;

					if(!this.#current.active)
					{
						//this.element.onpointermove = null;
						app.eventOff(this.element, 'pointermove', this.move, {passive: false});
						(this.element as HTMLElement).releasePointerCapture(event.pointerId);
					}
					else
					{
						this.#current.start = {
							x: x,
							y: y,
						};

						if(this.callback) this.callback(event, {type: 'start', diffX: 0, diffY: 0, speedX: 0, speedY: 0});
						if(options.drag) (this.element as HTMLElement).style.cursor = 'grabbing';

						(this.element as HTMLElement).setPointerCapture(event.pointerId);
					}
				}
			}
			
			// Run callback
			if(this.#current.active)
			{
				event.preventDefault();

				const x = app.clientX(event);
				const y = app.clientY(event);

				if(this.#current.speed!.length > 2)
					this.#current.speed!.shift();

				this.#current.speed!.push({
					time: performance.now(),
					x: x,
					y: y,
				});

				const data: CallbackData = {
					type: 'move',
					diffX: this.diff((x - this.#current.start!.x) + this.diffX),
					diffY: this.diff((y - this.#current.start!.y) + this.diffY),
					speedX: this.speedX(),
					speedY: this.speedY(), 
				};

				data.goToX = this.goTo(data, 'diffX');
				data.goToY = this.goTo(data, 'diffY');

				if(this.callback) this.callback(event, data);
			}
		}

	}

	up(event: PointerEvent) {

		if(event.pointerId === this.#current.id || event.pointerType == 'mouse')
		{
			if(this.#current.active)
			{
				const x = app.clientX(event);
				const y = app.clientY(event);

				(this.element as HTMLElement).style.cursor = '';

				const data: CallbackData = {
					type: 'end',
					diffX: this.diff((x - this.#current.start!.x) + this.diffX),
					diffY: this.diff((y - this.#current.start!.y) + this.diffY),
					speedX: this.speedX(),
					speedY: this.speedY(),
				};

				data.goToX = this.goTo(data, 'diffX');
				data.goToY = this.goTo(data, 'diffY');

				if(this.callback) this.callback(event, data);
			}

			// this.element.onpointermove = null;
			app.eventOff(this.element, 'pointermove', this.move, {passive: false});
			(this.element as HTMLElement).releasePointerCapture(event.pointerId);
			this.#current = {};
		}

	}

	goTo(data: CallbackData, key: 'diffX' | 'diffY') {

		const speed = key === 'diffY' ? data.speedY : data.speedX;

		if(Math.abs(speed) > 120 && this.options.speed)
		{
			if(speed < 0)
				return 1;
			else
				return -1;
		}
		else
		{
			let size = this.options.size ?? 1;
			if(typeof size === 'function') size = size();

			const diff = data[key] - this[key === 'diffX' ? 'diffX' : 'diffY'];
			const half = size / 2;
			const abs = Math.abs(diff);

			const multiple = this.options.multiple;

			if(abs > half)
			{
				const sign = diff > 0 ? -1 : 1;

				if(!multiple)
					return sign;

				return sign * Math.ceil((abs - half) / size);
			}
		}

		return 0;
	}

	bezier(value: number) {

		if(value < 0)
			value = 0;
		else if(value > 1000)
			value = 1000;

		return beziers.bounce.get(value).y * 0.1; // * 0.403;
	}

	diffX: number = 0;
	diffY: number = 0;

	diff(diff: number) {

		const min = this.options.min;
		const max = this.options.max;

		if(min !== false && min !== undefined && min > diff)
		{
			if(this.options.bounce)
				return min - this.bezier(min - diff);

			return min;
		}
		else if(max !== false && max !== undefined && max < diff)
		{
			if(this.options.bounce)
				return max + this.bezier(diff - max);

			return max;
		}

		return diff;

	}

	speedX() {

		const speed = this.#current.speed!;

		const first = speed[0];
		const last = speed[speed.length - 1];

		if(first === last) return 0;

		const dragSpeed = (last.x - first.x) / ((performance.now() - first.time) / 1000);

		return dragSpeed;

	}

	speedY() {

		const speed = this.#current.speed!;

		const first = speed[0];
		const last = speed[speed.length - 1];

		if(first === last) return 0;

		const dragSpeed = (last.y - first.y) / ((performance.now() - first.time) / 1000);

		return dragSpeed;

	}

	off() {

		this.destroy();

	}

	destroy() {

		app.eventOff(this.element, 'pointerdown', this.down, {passive: true});
		app.eventOff(this.element, 'pointerup', this.up, {passive: true});

		(this.element as HTMLElement).style.touchAction = '';
		this.element = false;

	}

}