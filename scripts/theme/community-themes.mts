import p from 'path';
import fs from 'fs';
import download from '../download.mjs';
import {Archive} from '7zip-native';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const theme: any;
declare const config: any;
declare const template: any;
declare const electronRemote: any;
declare const handlebarsContext: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface CommunityAuthor {
	name: string;
	email: string;
	url: string;
}

interface CommunityTheme {
	id: string;
	name: string;
	version: string;
	authors: CommunityAuthor[];
	description: string;
	opencomicVersion: string;
	baseColor: string;
	main: string;
	preview: string;
	image?: string;
	active?: boolean;
}

async function list()
{
	const options = {
		method: 'GET',
	};

	const request = await fetch(`https://opencomic.app/themes/catalog.json?ts=${Date.now()}`, options);
	const catalog = await request.json();

	return catalog || [];
}

let communityThemes: CommunityTheme[] = [];

async function load()
{
	let themes = await list();
	themes = themes.map(function(theme: CommunityTheme) {
		theme.image = `https://opencomic.app/themes/previews/${theme.id}/preview-720.png`;
		theme.active = config.communityTheme?.id === theme.id;
		return theme;
	});

	communityThemes = themes;
	handlebarsContext.communityThemes = themes;

	const contentRight = template._contentRight();
	const element = contentRight.querySelector('.settings-community-themes-list');

	element.innerHTML = template.load('theme.content.right.community.themes.list.html');
}

// TODO: Test only
const downloadPath = p.join(electronRemote.app.getPath('userData'), 'opencomic-themes');

// Resolve ./ in CSS content
async function resolvePaths(basePath: string, filePath: string)
{
	const fix = function(content: string): string {

		content = content.replace(/url\(['"]?\.\/(.*?)['"]?\)/g, (match, p1) => {
			console.log(`Resolving path for: ${p1}`);
			const resolvedPath = p.resolve(basePath, p1);
			return `url('${resolvedPath}')`;
		});

		return content;
	};

	const stat = fs.statSync(filePath);
	if(stat.isDirectory())
	{
		const files = fs.readdirSync(filePath);

		for(const file of files)
		{
			await resolvePaths(basePath, p.resolve(filePath, file));
		}
	}
	else
	{
		const ext = app.extname(filePath);

		if(['css'].includes(ext))
		{
			const content = fs.readFileSync(filePath, 'utf-8');
			const fixedContent = fix(content);
			fs.writeFileSync(filePath, fixedContent, 'utf-8');
		}
	}
}

async function install(id: string, update = false)
{
	const communityTheme = communityThemes.find(theme => theme.id === id);
	if(!communityTheme)
		return;

	// Disable current community theme if the same theme is selected and not updating
	if(config.communityTheme?.id === id && !update)
	{
		theme.setCommunityTheme({
			id: '',
			path: '',
			baseColor: '',
		});

		load();

		return;
	}

	try
	{
		const zipPath = p.join(downloadPath, `${id}.zip?ts=${Date.now()}`);
		const extractPath = p.join(downloadPath);

		console.log(`Downloading theme (${communityTheme.name}) to: ${zipPath}`);

		if(!fs.existsSync(downloadPath))
			fs.mkdirSync(downloadPath, {recursive: true});

		if(!fs.existsSync(extractPath))
			fs.mkdirSync(extractPath, {recursive: true});

		// Remove old files in extract path
		/*
		const files = fs.readdirSync(extractPath);
		for(const file of files)
			fs.rmSync(p.resolve(extractPath, file), {recursive: true, force: true});
		*/

		await download(`https://opencomic.app/themes/${id}.zip`, zipPath, 'Downloading theme...');

		const archive = await Archive.open(zipPath);

		try
		{
			await archive.extractToFolder(extractPath, {overwrite: true});
		}
		catch (error)
		{
			console.error(error);
		}
		finally
		{
			await archive.close();
		}

		fs.rmSync(zipPath, {force: true});

		const basePath = p.join(extractPath, id, 'theme');
		await resolvePaths(basePath, extractPath);

		theme.setCommunityTheme({
			id: communityTheme.id,
			path: p.join(extractPath, id, communityTheme.main),
			baseColor: communityTheme.baseColor,
		});
	}
	catch (error)
	{
		console.error('Failed to download theme:', error);
	}

	load();
}

export default {
	list,
	load,
	install,
};
