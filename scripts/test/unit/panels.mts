import {describe, it} from 'node:test';
import assert from 'node:assert/strict';

const config = {readingManga: false};

Object.assign(globalThis, {
	asarToAsarUnpacked: (path: string) => path,
	_config: config,
});

const {default: panels} = await import('../../reading/panels.mjs');

function panel(label, x1, y1, x2, y2, width = 100, height = 100) {

	const box: [number, number, number, number] = [x1, y1, x2, y2];

	return {
		label,
		probability: 1,
		score: 1,
		width,
		height,
		originalWidth: width,
		originalHeight: height,
		box,
		mask: new Uint8Array(width * height),
		corners: {
			topLeft: {x: x1, y: y1},
			topRight: {x: x2, y: y1},
			bottomLeft: {x: x1, y: y2},
			bottomRight: {x: x2, y: y2},
		},
	};

}

describe('Panel ordering', function() {

	it('keeps a regular row in left-to-right order', function() {

		const boxes = [
			panel('1', 0, 0, 30, 30),
			panel('2', 35, 0, 65, 30),
			panel('3', 70, 0, 100, 30),
		];
		config.readingManga = false;
		assert.deepEqual(panels.sortBoxes(boxes).map(box => box.label), ['1', '2', '3']);

	});

	it('keeps a manga row in right-to-left order', function() {

		const boxes = [
			panel('1', 70, 0, 100, 30),
			panel('2', 35, 0, 65, 30),
			panel('3', 0, 0, 30, 30),
		];
		config.readingManga = true;
		assert.deepEqual(panels.sortBoxes(boxes).map(box => box.label), ['1', '2', '3']);

	});

	it('finishes each manga row before moving to the next', function() {

		const boxes = [
			panel('1', 50, 0, 100, 50),
			panel('2', 0, 0, 50, 50),
			panel('3', 50, 50, 100, 100),
			panel('4', 0, 50, 50, 100),
		];
		config.readingManga = true;
		assert.deepEqual(panels.sortBoxes(boxes).map(box => box.label), ['1', '2', '3', '4']);

	});

	it('follows nearby panels through an irregular manga layout', function() {

		const boxes = [
			panel('4', 10, 0, 20, 20, 100, 40),
			panel('3', 60, 0, 70, 40, 100, 40),
			panel('1', 90, 0, 100, 20, 100, 40),
			panel('5', 10, 30, 20, 40, 100, 40),
			panel('2', 90, 30, 100, 40, 100, 40),
		];
		config.readingManga = true;
		assert.deepEqual(panels.sortBoxes(boxes).map(box => box.label), ['1', '2', '3', '4', '5']);

	});

	it('an irregular manga layout', function() {

		const boxes = [
			panel('2', 0, 10, 20, 30),
			panel('3', 0, 35, 20, 70),
			panel('1', 25, 15, 50, 70),
			panel('4', 0, 80, 50, 100),
		];
		config.readingManga = true;
		assert.deepEqual(panels.sortBoxes(boxes).map(box => box.label), ['1', '2', '3', '4']);

	});

});
