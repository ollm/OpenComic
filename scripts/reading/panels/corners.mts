import {Point} from '@types';

export interface Corners {
	topLeft: Point;
	topRight: Point;
	bottomLeft: Point;
	bottomRight: Point;
}

export default function corners(mask: Uint8Array, width: number, height: number): Corners
{
	const tlCorner: Point = {x: 0, y: 0};
	const trCorner: Point = {x: width - 1, y: 0};
	const blCorner: Point = {x: 0, y: height - 1};
	const brCorner: Point = {x: width - 1, y: height - 1};

	let tl: Point = tlCorner;
	let tr: Point = trCorner;
	let bl: Point = blCorner;
	let br: Point = brCorner;

	let bestTL = Infinity;
	let bestTR = Infinity;
	let bestBL = Infinity;
	let bestBR = Infinity;

	for(let y = 0; y < height; y++)
	{
		for(let x = 0; x < width; x++)
		{
			if(!mask[y * width + x]) continue;

			const dx = x;
			const dy = y;

			// Top Left
			let d = dx * dx + dy * dy;

			if(d < bestTL)
			{
				bestTL = d;
				tl = {x, y};
			}

			// Top Right
			d = (x - trCorner.x) ** 2 + dy * dy;

			if(d < bestTR)
			{
				bestTR = d;
				tr = {x, y};
			}

			// Bottom Left
			d = dx * dx + (y - blCorner.y) ** 2;

			if(d < bestBL)
			{
				bestBL = d;
				bl = {x, y};
			}

			// Bottom Right
			d = (x - brCorner.x) ** 2 + (y - brCorner.y) ** 2;

			if(d < bestBR)
			{
				bestBR = d;
				br = {x, y};
			}
		}
	}

	return {
		topLeft: tl,
		topRight: tr,
		bottomLeft: bl,
		bottomRight: br,
	};
}
