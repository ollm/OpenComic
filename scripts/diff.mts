import {diffWords} from 'diff';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const pregQuote: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

function buildPattern(strings: string[]): RegExp | null
{
	if(!strings.length)
		return null;

	const diff = diffWords(strings[0], strings[strings.length - 1], {
		ignoreCase: true,
	});

	let regex = diff.map(function({added, removed, value}) {

		if(added)
			return '';

		if(removed)
			return '(.*)';

		return pregQuote(value, '/');

	}).join('');

	regex = regex.replace(/\s+/g, '\\s+');

	return new RegExp(regex, 'i');
}

function list(strings: string[], separator: string = ' - '): string[]
{
	const pattern = buildPattern(strings);
	if(!pattern) return strings;

	return strings.map(function(string) {

		const match = string.match(pattern);

		if(match)
		{
			const parts = match.slice(1);

			return parts.join(separator) || string;
		}

		return string;

	});

}

export default {
	list,
};
