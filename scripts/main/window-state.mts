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

function windowState(options: Options): State
{
	let state;
	let winRef: Electron.BrowserWindow | undefined;
	let stateChangeTimer: NodeJS.Timeout;
	let appliedBounds: Electron.Rectangle | null = null;
	let desiredBounds: Electron.Rectangle | null = null;
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
			state.isFullScreen = win.isFullScreen();
			state.isMaximized = state.isFullScreen ? state.isMaximized : win.isMaximized();
			const winBounds = isNormal(win) ? win.getBounds() : win.getNormalBounds();

			// If the window has not been moved or resized, store the bounds that were requested
			// instead of the ones reported back, otherwise the DIP rounding error that Chromium
			// introduces on fractional scale factors is written to disk and grows on every launch
			const saveBounds = (desiredBounds && appliedBounds
				&& winBounds.x === appliedBounds.x
				&& winBounds.y === appliedBounds.y
				&& winBounds.width === appliedBounds.width
				&& winBounds.height === appliedBounds.height) ? desiredBounds : winBounds;

			state.x = saveBounds.x;
			state.y = saveBounds.y;
			state.width = saveBounds.width;
			state.height = saveBounds.height;
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
		// Apply the restored bounds explicitly and remember what Chromium reports back, so that
		// updateState() can tell an untouched window apart from one the user actually resized.
		// This has to run before maximize/setFullScreen so the normal bounds are seeded as well
		if(hasBounds())
		{
			desiredBounds = {x: state.x, y: state.y, width: state.width, height: state.height};
			win.setBounds(desiredBounds);
			appliedBounds = win.getBounds();
		}

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
