import {readdir} from 'node:fs/promises';
import {run} from 'node:test';
import {spec} from 'node:test/reporters';
import p from 'node:path';

const ___dirname = typeof __dirname !== 'undefined' ? __dirname : import.meta.dirname;

const files = (await readdir(p.join(___dirname, 'unit'))).map((file: string) => p.join(___dirname, 'unit', file));

const stream = run({files, concurrency: true});
stream.compose(new spec()).pipe(process.stdout);

let failed = 0;

stream.on('test:fail', () => {
	failed++;
});

stream.on('end', () => {

	if(failed > 0)
		process.exitCode = 1;

});
