import p from 'path';
import multiSelect, {SelectedItem, SelectedItems, ItemType} from './multi-select.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare let _config: any;
declare const dom: any;
declare const image: any;
declare const events: any;
declare const reading: any;
declare const language: any;
declare const fileManager: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Options {
	path: string;
	mainPath: string;
	fromIndex: boolean;
	fromIndexNotMasterFolders: boolean;
	folder: boolean;
}

function show(this: HTMLElement, gamepad = false): void {

	const path = this.dataset.path as string;
	const mainPath = this.dataset.mainPath as string;
	const fromIndex = this.dataset.fromIndex === '1';
	const fromIndexNotMasterFolders = this.dataset.fromIndexNotMasterFolders === '1';
	const folder = this.dataset.type === 'folder';

	const options: Options = {
		path,
		mainPath,
		fromIndex,
		fromIndexNotMasterFolders,
		folder,
	};

	console.log(path, mainPath, fromIndex, fromIndexNotMasterFolders, folder, gamepad);

	const selectedItems = multiSelect.selectedItems;
	const inSelectedItems = selectedItems.items.some(item => item.path === path);

	// TODO: Migrate the old context menu in the future
	if(selectedItems.items.length <= 1 || !inSelectedItems)
	{
		const type = this.dataset.type as ItemType;
		const path = this.dataset.path as string;
		const mainPath = this.dataset.mainPath as string;

		const item: SelectedItem = {type, element: this, path, mainPath};
		multiSelect.selectItem(item);
		// multiSelect.unselectAll();
		dom.comicContextMenu(path, mainPath, fromIndex, fromIndexNotMasterFolders, folder, gamepad);
	}
	else
	{
		console.log(selectedItems);
		contextMenu(selectedItems, options, gamepad);
	}
}

function canBeDelete(items: SelectedItem[]): boolean {

	return items.every(function(item) {

		return !fileManager.isServer(item.path) && !fileManager.lastCompressedFile(p.dirname(item.path));
	});

}

let contextMenuIndex = 0;

// TODO: Migrate the old context menu (Single item) here in the future
function contextMenu(selectedItems: SelectedItems, {fromIndex, folder}: Options, gamepad = false): void {

	contextMenuIndex++;

	const paths = selectedItems.items.map(item => item.path);

	const items: object[] = [];

	const isServer = selectedItems.items.some(item => fileManager.isServer(item.path));
	const canDelete = canBeDelete(selectedItems.items);

	if(selectedItems.type === 'folder')
	{
		if(fromIndex || folder)
		{
			items.push({
				key: 'context-menu-mark-read',
				class: 'context-menu-mark-read disable-pointer',
				name: language.global.contextMenu.markAsRead,
				icon: 'import_contacts',
				function: 'dom.contextMenu.markAsRead()',
			});

			items.push({
				key: 'context-menu-mark-unread',
				class: 'context-menu-mark-unread disable-pointer',
				name: language.global.contextMenu.markAsUnread,
				icon: 'menu_book',
				function: 'dom.contextMenu.markAsUnread()',
			});

			items.push({
				separator: true,
				class: 'separator-mark',
			});

			const haveFavorite = dom.labels.haveFavorite(paths);

			items.push({
				key: 'context-menu-favorite',
				class: 'context-menu-favorite',
				name: language.global.contextMenu.favorite,
				icon: 'favorite',
				fill: haveFavorite,
				function: 'dom.contextMenu.setFavorite()',
			});

			const haveLabel = dom.labels.haveLabel(paths);
			console.log('haveLabel', haveLabel);

			items.push({
				key: 'context-menu-labels',
				class: 'context-menu-labels',
				name: language.global.labels,
				icon: 'label',
				fill: haveLabel,
				function: 'dom.contextMenu.setLabels()',
			});
		}

		const hasPreprocess = true; // hasPreprocessImagesWithAI();

		if(hasPreprocess)
		{
			if(items.length)
			{
				items.push({
					separator: true,
					class: 'separator-preprocess-images-with-ai',
				});
			}

			items.push({
				key: 'context-menu-preprocess-images-with-ai',
				class: 'context-menu-preprocess-images-with-ai',
				name: language.global.contextMenu.preprocessImagesWithAI,
				icon: 'auto_awesome',
				function: 'dom.contextMenu.preprocessImagesWithAI()',
			});
		}

		if(!isServer)
		{
			if(items.length)
			{
				items.push({
					separator: true,
				});
			}

			items.push({
				key: 'context-menu-clear-file-cache',
				class: 'context-menu-clear-file-cache',
				name: language.global.contextMenu.clearFileCache,
				icon: 'mop',
				function: 'dom.contextMenu.clearFileCache()',
			});
		}

		if(canDelete && items.length)
		{
			items.push({
				separator: true,
			});
		}
	}

	if(canDelete)
	{
		items.push({
			key: 'context-menu-move-to-trash',
			class: 'context-menu-move-to-trash',
			name: language.global.contextMenu.moveToTrash,
			icon: 'delete',
			function: `dom.contextMenu.moveToTrash(${fromIndex ? 'true' : 'false'})`,
		});

		items.push({
			key: 'context-menu-delete-permanently',
			class: 'context-menu-delete-permanently',
			name: language.global.contextMenu.deletePermanently,
			icon: 'delete_forever',
			function: `dom.contextMenu.deletePermanently(${fromIndex ? 'true' : 'false'})`,
		});
	}

	if(!items.length)
		return;

	events.menuSimple(items, {
		query: '#index-context-menu-new',
		closeFuncion: 'events.desactiveMenu(\'#index-context-menu-new\');',
		width: 0,
		size: 'compact',
	});

	if(gamepad)
		events.activeMenu('#index-context-menu-new', false, 'gamepad');
	else
		events.activeContextMenu('#index-context-menu-new');

	if(selectedItems.type === 'folder')
	{
		if(fromIndex || folder)
		{
			const currentIndex = contextMenuIndex;

			const markRead = document.querySelector('#index-context-menu-new .context-menu-mark-read');
			const markUnread = document.querySelector('#index-context-menu-new .context-menu-mark-unread');

			if(!markRead || !markUnread)
				return;

			(async function() {

				try
				{
					const pathsProgress = await progressGetPaths(paths);

					if(currentIndex !== contextMenuIndex)
						return;

					dom.this(markRead).class(pathsProgress.completed, 'disable-pointer');
					dom.this(markUnread).class((pathsProgress.percent === 0), 'disable-pointer');
				}
				catch (error)
				{
					console.error(error);
				}

			})();
		}
	}
}

function getPaths(): string[] {

	const selectedItems = multiSelect.selectedItems;
	return selectedItems.items.map(item => item.path);

}

async function progressGetPaths(paths: string[]): Promise<{completed: boolean; percent: number}> {

	const total = paths.length;
	let completed = true;
	let completedCount = 0;

	for(const path of paths)
	{
		const progress = await reading.progress.get(path);
		reading.progress.updateProgress(path, progress);

		if(progress.completed)
			completedCount++;
		else
			completed = false;
	}

	const percent = total ? (completedCount / total) * 100 : 0;
	return {completed, percent};

}

function hasPreprocessImagesWithAI(): boolean {

	const selectedItems = multiSelect.selectedItems.items;
	const mainPaths = [...new Set(selectedItems.map(item => item.mainPath))];

	for(const mainPath of mainPaths)
	{
		const mainPathConfig = reading.loadReadingConfig(false, mainPath, true);

		if(reading.render.ai.hasAi(mainPathConfig.readingAi))
			return true;
	}

	return false;
}

function cancelPreprocessImages()
{
	cancelPreprocess = true;
	events.closeSnackbar();
}

let cancelPreprocess = false;

async function preprocessImagesWithAI(): Promise<void> {

	const hasPreprocess = hasPreprocessImagesWithAI();

	if(!hasPreprocess)
	{
		events.snackbar({
			key: 'preprocessImagesWithAINotConfigured',
			text: language.global.contextMenu.preprocessImagesWithAINotConfigured,
			duration: 6,
			buttons: [
				{
					text: language.buttons.dismiss,
					function: 'events.closeSnackbar();',
				},
			],
		});

		return;
	}

	const toPrepocessImages: {path: string; image: string; mainPath: string; width?: number; height?: number}[] = [];

	const selectedItems = multiSelect.selectedItems.items;

	for(const item of selectedItems)
	{
		const path = item.path;

		const file = fileManager.file(path);
		const files = await file.readRecursive({filtered: true, sha: true});
		file.destroy();

		for(const file of files)
		{
			if(file.compressed || file.folder)
				continue;

			toPrepocessImages.push({
				path: file.path,
				image: fileManager.realPath(file.path),
				mainPath: item.mainPath,
			});
		}
	}

	const len = toPrepocessImages.length;
	if(len === 0) return;

	const snackbar = function(i) {

		events.snackbar({
			key: 'saveImagesProgress',
			text: `${language.global.contextMenu.preprocessImagesWithAIProgress} (${i}/${len})`,
			duration: events.INFINITY,
			update: true,
			updateShown: true,
			buttons: [
				{
					text: 'AA', // language.buttons.download,
					function: 'dom.contextMenu.cancelPreprocessImages();',
					className: 'preprocess-images-with-ai-progress-button',
				},
				{
					text: language.buttons.cancel,
					function: 'dom.contextMenu.cancelPreprocessImages();',
				},
			],
		});
	};

	const updateProgress = function(i: number) {

		const button = document.querySelector('.snackbar .preprocess-images-with-ai-progress-button');
		if(button) events.buttonLoading(button, i / len);
		snackbar(i);

	};

	snackbar(0);
	const button = document.querySelector('.snackbar .preprocess-images-with-ai-progress-button');
	events.buttonLoading(button, 0.01);

	const file = fileManager.file(toPrepocessImages[0].mainPath);
	await file.makeAvailable(toPrepocessImages);
	file.destroy();

	events.buttonLoading(button, 0.01);

	for(let i = 0; i < len; i++)
	{
		const file = toPrepocessImages[i];

		if(cancelPreprocess)
			break;

		const size = (await image.getSizes([file]))[0];
		file.width = size.width;
		file.height = size.height;

		const mainPathConfig = reading.loadReadingConfig(false, file.mainPath, true);
		const originalConfig = _config;
		_config = mainPathConfig;

		const {promise, resolve} = Promise.withResolvers();

		const aiPath = reading.render.ai.image(file.image, file, {
			run: true,
			start: function() {},
			progress: function() {},
			end: function(aiPath: string) {

				resolve(aiPath);

			},
			canceled: function() {
				resolve(false);
			},
		});

		if(aiPath)
			resolve(aiPath);

		_config = originalConfig;
		await promise;

		if(!cancelPreprocess)
			updateProgress(i);

	}

	if(!cancelPreprocess)
	{
		events.buttonLoading(button, 1);
		events.closeSnackbar();
	}

	cancelPreprocess = false;
}

// Function wrapper

function clearFileCache(): void {

	dom.clearFileCache.clear(getPaths());

}

function setFavorite(): void {

	dom.labels.setFavorite(getPaths());

}

function setLabels(): void {

	dom.labels.setLabels(getPaths());

}

function moveToTrash(fromIndex = false): void {

	dom.moveToTrash(getPaths(), fromIndex);

}

function deletePermanently(fromIndex = false): void {

	dom.deletePermanently(getPaths(), fromIndex);

}

function markAsRead(): void {

	const paths = getPaths();

	for(const path of paths)
	{
		reading.progress.read(path);
	}

}

function markAsUnread(): void {

	const paths = getPaths();

	for(const path of paths)
	{
		reading.progress.unread(path);
	}

}

export default {
	show,

	// Functions wrapper
	clearFileCache,
	setFavorite,
	setLabels,
	moveToTrash,
	deletePermanently,
	markAsRead,
	markAsUnread,
	hasPreprocessImagesWithAI,
	preprocessImagesWithAI,
	cancelPreprocessImages,
};
