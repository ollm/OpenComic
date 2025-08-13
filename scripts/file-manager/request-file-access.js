var files = [];
var showPopupST = false;

function check(path, error)
{
	error = error.message || error || '';

	if(macosMAS && /operation not permitted|EPERM/iu.test(error))
	{
		path = app.extract(/(?:scandir|open)\s*['"](.+?)['"]\s*$/m, error) || app.extract(/Error:\s*['"]?(\/.+?)['"]?\s*:\s*opening/iu, error) || path;
		if(path) setFile(path);
	}
}

function setFile(path)
{
	files.push(path);

	clearTimeout(showPopupST);

	showPopupST = setTimeout(function(){

		showPopup();

	}, 500);
}

function showPopup()
{
	files.sort();

	// Avoid showing a path and also a parent path
	const _files = [];
	let prevPath = false;

	for(let i = 0, len = files.length; i < len; i++)
	{
		const path = files[i];

		if(!prevPath || !fileManager.isParentPath(prevPath, path))
			_files.push(path);

		prevPath = path;
	}

	files = _files;
	handlebarsContext.requestFileAccess = files;

	events.dialog({
		header: language.dialog.requestFileAccess.title,
		width: 600,
		height: false,
		content: template.load('dialog.request.file.access.html'),
		buttons: [
			{
				text: language.buttons.close,
				function: 'events.closeDialog();',
			}
		],
	});

}

function updateFileList(guaranteedPath)
{
	const _files = [];

	for(let i = 0, len = files.length; i < len; i++)
	{
		const path = files[i];

		if(!fileManager.isParentPath(guaranteedPath, path))
			_files.push(path);
	}

	files = _files;
	handlebarsContext.requestFileAccess = files;

	if(!_files.length)
	{
		events.closeDialog();
		dom.reload();
	}
	else
	{
		const dialog = document.querySelector('.dialog .dialog-text');
		if(dialog) dialog.innerHTML = template.load('dialog.request.file.access.html');
	}

}

function request(path)
{
	const isCompressed = fileManager.isCompressed(path);
	const properties = isCompressed ? ['openFile'] : ['openDirectory'];

	const dialog = electronRemote.dialog;

	dialog.showOpenDialog({properties: properties, defaultPath: path, securityScopedBookmarks: macosMAS}).then(async function (files) {

		fileManager.macosSecurityScopedBookmarks(files);

		if(files.filePaths && files.filePaths[0])
			updateFileList(files.filePaths[0]);

	});
}

module.exports = {
	check: check,
	file: setFile,
	request: request,
};