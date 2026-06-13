import fs from 'fs';
import p from 'path';

export function exists(base: string, path: string, permissions: number | null = null, fix: string | undefined = undefined)
{
	path = p.join(base, path);

	if(!fs.existsSync(path))
		throw new Error('Not exists! ' + path + (fix ? '\n\nTry: ' + fix : '') + '\n');

	if(permissions !== null)
	{
		try
		{
			fs.accessSync(path, permissions);
		}
		catch (error)
		{
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error('No access! ' + path + ', ' + errorMessage, {cause: error});
		}
	}
}

export function existsRegex(base: string, path: string, regex, permissions: number | null = null, fix: string | undefined = undefined)
{
	path = p.join(base, path);

	if(!fs.existsSync(path))
		throw new Error('Not exists! ' + path + (fix ? '\n\nTry: ' + fix : '') + '\n');

	const exists = fs.readdirSync(path).find(file => regex.test(file));

	if(!exists)
		throw new Error('Not exists! ' + path + regex + (fix ? '\n\nTry: ' + fix : '') + '\n');

	path = p.join(path, exists);

	if(permissions !== null)
	{
		try
		{
			fs.accessSync(path, permissions);
		}
		catch (error)
		{
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error('No access! ' + path + ', ' + errorMessage, {cause: error});
		}
	}
}

export function change(base: string, path: string, search: string, replacement: string, fix: string | undefined = undefined)
{
	path = p.join(base, path);

	if(!fs.existsSync(path))
		throw new Error('Not exists! ' + path + (fix ? '\n\nTry: ' + fix : '') + '\n');

	const buffer = fs.readFileSync(path);

	const searchBuffer = Buffer.from(search, 'utf8');
	const replacementBuffer = Buffer.from(replacement, 'utf8');

	let offset = 0;

	while((offset = buffer.indexOf(searchBuffer, offset)) !== -1)
	{
		replacementBuffer.copy(buffer, offset);
		offset += searchBuffer.length;
	}

	fs.writeFileSync(path, buffer);
}

export const fix = {
	ZSTD: 'npm install --no-save --force --prefix ./build/node-zstd-native-dependencies && node scripts/zstd-copy-native.js',
	sharp: {
		LINUX_X64: 'npm install --no-save @img-custom/sharp-libvips-linuxmusl-x64 @img-custom/sharp-libvips-linux-x64 @img-custom/sharp-linuxmusl-x64 @img-custom/sharp-linux-x64 --force && node scripts/sharp-copy-custom.js',
		LINUX_ARM64: 'npm install --no-save @img-custom/sharp-libvips-linux-arm64 @img-custom/sharp-libvips-linuxmusl-arm64 @img-custom/sharp-linux-arm64 @img-custom/sharp-linuxmusl-arm64 --force && node scripts/sharp-copy-custom.js ',
		MACOSS_X64: 'npm install --no-save @img-custom/sharp-darwin-x64 @img-custom/sharp-libvips-darwin-x64 --force && node scripts/sharp-copy-custom.js',
		MACOSS_ARM64: 'npm install --no-save @img-custom/sharp-darwin-arm64 @img-custom/sharp-libvips-darwin-arm64 --force && node scripts/sharp-copy-custom.js',
		WIN32_X64: 'npm install --no-save --cpu=x64 --os=win32 sharp',
		WIN32_ARM64: 'npm install --no-save --cpu=arm64 --os=win32 sharp',
	},
};

export const versions = {
	libvips: '8.18.3',
};
