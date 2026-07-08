import {Macro, MenuItem} from '@types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const dom: any;
declare const events: any;
declare const storage: any;
declare const template: any;
declare const settings: any;
declare const gamepad: any;
declare const language: any;
declare const shortcuts: any;
declare const handlebarsContext: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Vars {
	toggleMode: boolean;
	targetState: boolean;
	action: string;
	delay: number;
}

let currentMacro: Macro | null = null;

let vars: Vars = {
	toggleMode: true,
	targetState: true,
	action: '',
	delay: 0,
};

function getActionName(actions: object[], action: string): string
{
	const data = actions[action];
	const name = data?.name?.replace(/<br\s*\/?>/, ' | ') || action;

	return name;
}

function getCurrentMacroNames(): void
{
	if(!currentMacro) return;

	const list = shortcuts.shortcuts();

	for(const action of currentMacro.actions)
	{
		action.name = getActionName(list.reading.actions, action.action);
	}
}

interface Add {
	save?: boolean;
	edit?: string | null;
}

function add({save = false, edit = null}: Add = {})
{
	if(save)
	{
		const name = (document.querySelector('.macro-name input') as HTMLInputElement)!.value.trim();
		const macroName = document.querySelector('.macro-name');

		if(!name || !currentMacro || currentMacro.actions.length === 0)
		{
			if(!name)
				macroName?.classList.add('error');
			else
				macroName?.classList.remove('error');
		}
		else
		{
			macroName?.classList.remove('error');

			currentMacro.name = name;
			currentMacro.toggleMode = vars.toggleMode;

			const id = edit || `macro-${Date.now()}`;
			currentMacro.id = id;

			const macros = storage.get('macros') as Record<string, Macro>;
			macros[id] = currentMacro;
			storage.set('macros', macros);

			events.closeDialog();

			settings.generateShortcutsTable(gamepad.currentHighlightItem());
			events.events();
		}
	}
	else
	{
		vars = {
			toggleMode: true,
			targetState: true,
			action: '',
			delay: 0,
		};

		const macros = storage.get('macros') as Record<string, Macro>;
		const macro = edit ? app.copy(macros[edit]) as Macro : null;

		currentMacro = macro || {id: 'macro', name: '', toggleMode: true, actions: []};
		vars.toggleMode = currentMacro.toggleMode;

		handlebarsContext.macro = processMacro(currentMacro);

		events.dialog({
			header: language.settings.macros.add,
			width: 600,
			height: false,
			content: template.load('dialog.macros.add.html'),
			buttons: [
				...(edit ? [{
					text: language.buttons.delete,
					function: `settings.macros.delete('${edit}');`,
				}] : [{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				}]),
				{
					text: language.buttons.save,
					function: `settings.macros.add({save: true, edit: ${edit ? `'${edit}'` : 'null'}});`,
				},
			],
		});

		events.eventSwitch();
		events.eventInput();
		events.eventRange();
	}
}

function edit(edit: string)
{
	add({edit});
}

function _delete(id: string, confirm: boolean = false)
{
	if(confirm)
	{
		const macros = storage.get('macros') as Record<string, Macro>;
		delete macros[id];
		storage.set('macros', macros);

		settings.generateShortcutsTable(gamepad.currentHighlightItem());
		events.events();
	}
	else
	{
		events.dialog({
			header: language.settings.macros.deleteMacro,
			width: 400,
			height: false,
			content: language.settings.macros.confirmDelete,
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'events.closeDialog();',
				},
				{
					text: language.buttons.delete,
					function: `events.closeDialog(); settings.macros.delete('${id}', true);`,
				},
			],
		});
	}
}

function getActions()
{
	const list = shortcuts.shortcuts();
	const items: MenuItem[] = [];

	for(const group of list.reading.actionsGroups)
	{
		items.push({
			text: group.name,
		});

		if(!group.items.length && group.macro)
		{
			items.push({
				name: language.settings.macros.empty,
				paddingLeft: true,
				disabled: true,
			});

			continue;
		}

		for(const action of group.items)
		{
			if(currentMacro?.id === action)
				continue;

			items.push({
				key: action,
				name: getActionName(list.reading.actions, action),
				function: `settings.macros.setAction('${action}');`,
				paddingLeft: true,
			});
		}
	}

	events.menuSimple(items, {
		width: 552,
	});
}

function setAction(action: string)
{
	const list = shortcuts.shortcuts();
	const data = list.reading.actions[action];

	dom.query('.macro-action').addClass('have-select');
	dom.query('.macro-action .text').html(data.name);
	dom.query('.settings-macros-target-state').class(!data.forzable, 'disable-pointer');

	set('action', action);
}

function addAction()
{
	if(vars.action && currentMacro)
	{
		currentMacro.actions.push({
			targetState: vars.targetState,
			action: vars.action,
			delay: vars.delay,
		});

		updateActions();
	}
}

function processMacro(macro: Macro | null): Macro | null
{
	if(!macro) return null;

	const list = shortcuts.shortcuts();
	const actions = list.reading.actions;

	macro.actions = macro.actions.map(function(action) {

		const data = actions[action.action];
		action.forzable = data?.forzable ?? false;
		return action;

	});

	return macro;
}

function updateActions()
{
	getCurrentMacroNames();
	handlebarsContext.macro = processMacro(currentMacro);
	document.querySelector('.macros-actions')!.innerHTML = template.load('dialog.macros.list.html');

	events.eventSwitch();
	events.eventInput();
	events.eventRange();
}

function set(key: string, value: unknown, index: number | null = null)
{
	if(index === null)
		vars[key] = value;
	else if(currentMacro)
		currentMacro.actions[index][key] = value;
}

function up(index: number = 0)
{
	if(!currentMacro) return;

	if(index > 0)
	{
		const curent = currentMacro.actions[index];
		const toChange = currentMacro.actions[index - 1];

		currentMacro.actions[index] = toChange;
		currentMacro.actions[index - 1] = curent;

		updateActions();
	}
}

function down(index: number = 0)
{
	if(!currentMacro) return;

	if(index < currentMacro.actions.length - 1)
	{
		const curent = currentMacro.actions[index];
		const toChange = currentMacro.actions[index + 1];

		currentMacro.actions[index] = toChange;
		currentMacro.actions[index + 1] = curent;

		updateActions();
	}
}

function remove(index: number = 0)
{
	if(!currentMacro) return;
	currentMacro.actions.splice(index, 1);
	updateActions();
}

export default {
	add,
	edit,
	delete: _delete,
	getActions,
	setAction,
	addAction,
	set,
	up,
	down,
	remove,
};
