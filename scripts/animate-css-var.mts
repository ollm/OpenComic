import {Bezier} from 'bezier-js';

const beziers = {
	easeInBezier: new Bezier(0,0, 0.4,0, 1,1, 1,1),
};

export interface AnimateCssVar {
	name: string;
	from: number;
	to: number;
	unit?: string;
	duration?: number;
	bezier?: string;
	removeOnEnd?: boolean;
}

export default function animateCssVar({name, from, to, unit = 'px', duration = 300, bezier = 'easeInBezier', removeOnEnd}: AnimateCssVar) {

	const _app = document.querySelector('.app') as HTMLElement;
	if(!_app) return;

	const start = Date.now();

	const set = function() {

		const now = Date.now();
		const elapsed = now - start;

		const m = Math.min(elapsed / duration, 1);
		const mBezier = beziers[bezier].get(m).y;

		_app.style.setProperty(`--${name}`, String(from + (to - from) * mBezier)+unit);

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