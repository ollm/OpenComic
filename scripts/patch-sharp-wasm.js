const fs = require('fs');
const p = require('path');

if(process.platform === 'linux')
{
	const wasmDir = p.join(__dirname, '../node_modules/@img/sharp-wasm32/lib');
	const wasmFile = fs.readdirSync(wasmDir).find(file => /^sharp-wasm32-.*\.node\.js$/.test(file));

	if(!wasmFile)
		throw new Error('Unable to find the sharp-wasm32 runtime');

	const wasmPath = p.join(wasmDir, wasmFile);
	const source = fs.readFileSync(wasmPath, 'utf8');
	const rendererCheck = '&&globalThis.process?.type!="renderer"';

	if(source.includes(rendererCheck))
	{
		fs.writeFileSync(wasmPath, source.replace(rendererCheck, ''));
	}
	else if(!source.includes('ENVIRONMENT_IS_NODE=globalThis.process?.versions?.node;'))
	{
		throw new Error('Unable to find the expected Sharp WASM Node environment check');
	}
}
