import p from 'path';
import multiSelect, {SelectedItem, SelectedItems} from './multi-select.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const dom: any;
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
		multiSelect.unselectAll();
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
};
