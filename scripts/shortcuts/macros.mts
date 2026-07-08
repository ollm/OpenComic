import {Macro} from '@types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const storage: any;
declare const shortcuts: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// let current: string | null = null;
let execution: number = 0;

async function run(key: string, force = null, fromMacro: boolean = false, deep: number = 0): Promise<void>
{
	// Avoid infinite loop
	if(deep > 3)
		return;

	const current = fromMacro ? execution : ++execution;

	const macros = storage.get('macros') as Record<string, Macro>;
	const list = shortcuts.shortcuts();

	const macro = macros[key];
	if(!macro) return;

	const toggleMode = force === null ? macro.toggleMode : true;

	// Get first forzable action
	const firstState = state(key);
	const toogle = (force === null && firstState && firstState.state === firstState.targetState) || (force !== null && firstState && force !== firstState.targetState);

	for(const _action of macro.actions)
	{
		const {action, targetState, delay} = _action;

		if(delay)
			await app.sleep(delay * 1000);

		if(current !== execution)
			return;

		const state = toggleMode && toogle ? !targetState : targetState;
		const data = list.reading.actions[action];

		data.function({}, false, state, true, deep + 1);
	}
}

interface State {
	state: boolean;
	targetState: boolean;
};

function state(key: string): State | false
{
	const macros = storage.get('macros') as Record<string, Macro>;
	const list = shortcuts.shortcuts();

	const macro = macros[key];
	if(!macro) return false;

	// Get first forzable action
	const firstForzable = macro.actions.find(function(action) {

		const data = list.reading.actions[action.action];
		return data.forzable;

	});

	const firstState = firstForzable ? list.reading.actions[firstForzable.action].state() as boolean : false;

	return {
		state: firstState,
		targetState: firstForzable ? firstForzable.targetState : false,
	};
}

function cancel()
{
	execution++;
}

export default {
	run,
	state,
	cancel,
};
