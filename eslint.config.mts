import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';

const customized = stylistic.configs.customize({
	indent: 'tab',
	quotes: 'single',
	semi: true,
	jsx: false,
});

export default defineConfig([
	{
		files: ['scripts/**/*.mts'],
		plugins: {js},
		extends: ['js/recommended'],
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			quotes: ['error', 'single'],
		},
	},
	{
		files: ['scripts/**/*.mts'],
		extends: [tseslint.configs.recommended],
	},
	{
		files: ['scripts/**/*.mts'],
		plugins: customized.plugins,
		rules: {
			...customized.rules,
			'@stylistic/brace-style': ['off', 'allman', {allowSingleLine: true}],
			'@stylistic/padded-blocks': ['off', {blocks: 'never', classes: 'never', switches: 'never'}],
			'@stylistic/keyword-spacing': ['off', {after: false, before: true}],
			'@stylistic/object-curly-spacing': ['error', 'never'],
			'@stylistic/space-before-function-paren': ['error', {anonymous: 'never', asyncArrow: 'never', named: 'never'}],
			'@stylistic/semi': ['error', 'always', {'omitLastInOneLineBlock': true, 'omitLastInOneLineClassBody': true}],
			'@stylistic/block-spacing': ['error', 'never'],
			'@stylistic/space-before-blocks': ['error', 'always'],
			'@stylistic/multiline-ternary': ['error', 'never'],
		},
	}
]);