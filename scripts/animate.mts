import {Bezier} from 'bezier-js';

const beziers = {
	ease: new Bezier(0, 0, 0.25, 0.1, 0.25, 1, 1, 1),
	easeInBezier: new Bezier(0, 0, 0.4, 0, 1, 1, 1, 1),
};

export interface Animate {
	progress: number;
	from: number;
	to: number;
	bezier?: string;
}

export interface AnimateCssVar {
	name: string;
	from: number;
	to: number;
	unit?: string;
	duration?: number;
	bezier?: string;
	removeOnEnd?: boolean;
}

function animate({progress, from, to, bezier = 'easeInBezier'}: Animate): number
{
	const mBezier = beziers[bezier].get(progress).y;

	return from + (to - from) * mBezier;
}

function cssVar({name, from, to, unit = 'px', duration = 300, bezier = 'easeInBezier', removeOnEnd}: AnimateCssVar)
{
	const _app = document.querySelector('.app') as HTMLElement;
	if(!_app) return;

	const start = Date.now();

	const set = function() {

		const now = Date.now();
		const elapsed = now - start;

		const m = Math.min(elapsed / duration, 1);
		const value = animate({progress: m, from, to, bezier});

		_app.style.setProperty(`--${name}`, String(value) + unit);

		if(elapsed < duration)
		{
			window.requestAnimationFrame(set);
		}
		else if(removeOnEnd !== undefined)
		{
			_app.style.removeProperty(`--${name}`);
		}

	};

	set();
}

export default {
	value: animate,
	cssVar,
};
