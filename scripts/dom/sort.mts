import crypto from 'crypto';

let seed: number;

function generateShuffle(): void
{
	seed = crypto.randomBytes(4).readUInt32BE(0);
}

function fnv1a(str: string, seed: number): number
{
	let hash = 2166136261 ^ seed;

	for(let i = 0; i < str.length; i++)
	{
		hash ^= str.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}

	return hash >>> 0;
}

function score(string: string): number
{
	return fnv1a(string, seed);
}

function compareShuffle(a: string, b: string): number
{
	return score(a) - score(b);
}

generateShuffle();

export default {
	generateShuffle,
	compareShuffle,
};
