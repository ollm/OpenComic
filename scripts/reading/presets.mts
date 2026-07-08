import {Preset} from '@types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const storage: any;
declare const reading: any;
declare const language: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

function list(): Record<string, Preset>
{
	const presets: Record<string, Preset> = {
		'preset-0': {
			key: 'preset-0',
			name: language.reading.pages.readingGlobal,
		},
	};

	const _presets = storage.get('readingShortcutPagesConfig');

	for(const key in _presets)
	{
		const preset = _presets[key];
		const _key = `preset-${key}`;

		presets[_key] = {
			key: _key,
			name: preset.readingPresetName,
		};
	}

	return presets;
}

function set(key: string | number)
{
	if(typeof key === 'string')
		key = +app.extract(/([0-9]+)/, key);

	reading.setReadingShortcutPagesConfig(key);
}

export default {
	list,
	set,
};
