// Code adapted from https://github.com/flawiddsouza/Restfox/blob/main/packages/electron/src/utils/window-state.js
/**
	* ref:
	* https://github.com/mawie81/electron-window-state 2701d9a
	* https://github.com/jmatth11/electron-window-state 98feced
	*
	* https://github.com/mawie81/electron-window-state/pull/69
	* https://github.com/mawie81/electron-window-state/issues/27
	* https://github.com/whyboris/Video-Hub-App/issues/572
*/
import {screen} from 'electron';
import fs from 'fs';
import p from 'path';

interface Options {
	path: string;
	defaultWidth?: number;
	defaultHeight?: number;
	defaultMaximize?: boolean;
	defaultFullScreen?: boolean;
	fullScreen?: boolean;
	maximize?: boolean;
}

interface State {
	x: number;
	y: number;
	width: number;
	height: number;
	isFullScreen: boolean;
	isMaximized: boolean;
	displayBounds: {
		height: number;
		width: number;
	};
	saveState: (window: Electron.BrowserWindow) => void;
	manage: (window: Electron.BrowserWindow) => void;
	unmanage: () => void;
	resetStateToDefault: () => void;
}

interface Point {
	x: number;
	y: number;
}

function windowState(options: Options): State
{
	let state;
	let winRef: Electron.BrowserWindow | undefined;
	let stateChangeTimer: NodeJS.Timeout;
	const eventHandlingDelay = 100;

	options = {
		maximize: true,
		fullScreen: true,
		...options,
	};

	function isNormal(win: Electron.BrowserWindow)
	{
		return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen();
	}

	function hasBounds()
	{
		return state
			&& Number.isInteger(state.x)
			&& Number.isInteger(state.y)
			&& Number.isInteger(state.width)
			&& state.width > 0
			&& Number.isInteger(state.height)
			&& state.height > 0;
	}

	function resetStateToDefault()
	{
		const displayBounds = screen.getPrimaryDisplay().bounds;

		// Reset state to default values on the primary display
		state = {
			width: options.defaultWidth || 800,
			height: options.defaultHeight || 600,
			isMaximized: options.defaultMaximize || false,
			isFullScreen: options.defaultFullScreen || false,
			x: displayBounds.x,
			y: displayBounds.y,
			displayBounds,
		};
	}

	function pointWithinBounds(point: Point, bounds: Electron.Rectangle)
	{
		return (
			point.x >= bounds.x
			&& point.y >= bounds.y
			&& point.x < bounds.x + bounds.width
			&& point.y < bounds.y + bounds.height
		);
	}

	function newPoint(x, y): Point
	{
		return {
			x,
			y,
		};
	}

	function ensureWindowVisibleOnSomeDisplay()
	{
		const winRect = {
			x: state.x,
			y: state.y,
			width: state.width,
			height: state.height,
		};

		const visible = screen.getAllDisplays().some(function(display) {
			const area = display.workArea;
			const intersectsX = winRect.x < area.x + area.width && winRect.x + winRect.width > area.x;
			const intersectsY = winRect.y < area.y + area.height && winRect.y + winRect.height > area.y;

			return intersectsX && intersectsY;
		});

		if(!visible)
		{
			// Window is partially or fully not visible now.
			// Reset it to safe defaults.
			return resetStateToDefault();
		}
	}

	function validateState()
	{
		const isValid = state && (hasBounds() || state.isMaximized || state.isFullScreen);

		if(!isValid)
		{
			state = null;
			return;
		}

		if(hasBounds() && state.displayBounds)
			ensureWindowVisibleOnSomeDisplay();
	}

	function updateState(win?: Electron.BrowserWindow)
	{
		win = win || winRef;
		if(!win) return;

		// Don't throw an error when window was closed
		try
		{
			state.isMaximized = win.isMaximized();
			state.isFullScreen = win.isFullScreen();
			const winBounds = isNormal(win) ? win.getBounds() : win.getNormalBounds();

			state.x = winBounds.x;
			state.y = winBounds.y;
			state.width = winBounds.width;
			state.height = winBounds.height;
			state.displayBounds = screen.getDisplayMatching(winBounds).bounds;
			// state.scale = screen.getDisplayMatching(winBounds).scaleFactor;
		}
		catch (error)
		{
			console.error(error);
		}
	}

	function saveState(win?: Electron.BrowserWindow)
	{
		// Update window state only if it was provided
		if(win)
			updateState(win);

		// Save state
		try
		{
			fs.mkdirSync(p.dirname(options.path), {recursive: true});
			fs.writeFileSync(options.path, JSON.stringify(state));
		}
		catch (error)
		{
			console.error(error);
		}
	}

	function stateChangeHandler()
	{
		// Handles both 'resize' and 'move'
		clearTimeout(stateChangeTimer);
		stateChangeTimer = setTimeout(updateState, eventHandlingDelay);
	}

	function closeHandler()
	{
		updateState();
	}

	function closedHandler()
	{
		// Unregister listeners and save state
		unmanage();
		saveState();
	}

	function manage(win: Electron.BrowserWindow)
	{
		if(options.fullScreen && state.isFullScreen)
			win.setFullScreen(true);
		else if(options.maximize && state.isMaximized)
			win.maximize();

		win.on('resize', stateChangeHandler);
		win.on('move', stateChangeHandler);
		win.on('close', closeHandler);
		win.on('closed', closedHandler);
		winRef = win;
	}

	function unmanage()
	{
		if(winRef)
		{
			winRef.removeListener('resize', stateChangeHandler);
			winRef.removeListener('move', stateChangeHandler);
			clearTimeout(stateChangeTimer);
			winRef.removeListener('close', closeHandler);
			winRef.removeListener('closed', closedHandler);
			winRef = undefined;
		}
	}

	function pointOnWhichDisplay(point: Point)
	{
		return screen.getAllDisplays().find(function(display: Electron.Display) {
			return pointWithinBounds(point, display.bounds);
		});
	}

	function calcScale()
	{
		if(state.x == undefined || state.y == undefined)
		{
			console.log('state x or y is undefined');
			return 1;
		}

		let point = newPoint(state.x, state.y);
		let display = pointOnWhichDisplay(point);

		if(display)
		{
			console.log(`"left top point: ${screen.getPrimaryDisplay().scaleFactor} / ${display.scaleFactor}"`);
			return screen.getPrimaryDisplay().scaleFactor / display.scaleFactor;
		}

		point = newPoint(state.x + state.width, state.y);
		display = pointOnWhichDisplay(point);

		if(display)
		{
			console.log(`"right top point: ${screen.getPrimaryDisplay().scaleFactor} / ${display.scaleFactor}"`);
			return screen.getPrimaryDisplay().scaleFactor / display.scaleFactor;
		}

		return 1;
	}

	// Load previous state
	if(fs.existsSync(options.path))
	{
		try
		{
			const json = fs.readFileSync(options.path, 'utf-8');
			state = JSON.parse(json);
		}
		catch (error)
		{
			console.log(error);
		}
	}

	// Check state validity
	validateState();

	// Set state fallback values
	state = {
		width: options.defaultWidth || 800,
		height: options.defaultHeight || 600,
		isMaximized: options.defaultMaximize || false,
		isFullScreen: options.defaultFullScreen || false,
		...state,
	};

	// Calculate screen scale
	state.scale = calcScale();
	console.log(`scale: ${state.scale}`);
	state.width = Math.floor(state.width * state.scale);
	state.height = Math.floor(state.height * state.scale);

	return {
		get x() {return state.x},
		get y() {return state.y},
		get width() {return state.width},
		get height() {return state.height},
		get isFullScreen() {return state.isFullScreen},
		get isMaximized() {return state.isMaximized},
		get displayBounds() {return state.displayBounds},
		saveState,
		manage,
		unmanage,
		resetStateToDefault,
	};
};

export default windowState;
