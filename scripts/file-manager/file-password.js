var passwordsInMemory = {};

function get(path)
{
	const parentPath = p.dirname(path);
	const passwords = storage.get('compressedPasswords') || {};

	const pass = passwords[path] || passwordsInMemory[path] || passwords[parentPath] || passwordsInMemory[parentPath];

	if(pass)
		return storage.safe.decrypt(pass) || 'password';

	return 'password';
}

function check(error)
{
	error = error.message || error || '';

	if(/Wrong password/iu.test(error))
		return true;

	return false;
}

var promise, resolve, reject, filePath;

async function request(path)
{
	if(promise)
		return promise;

	filePath = path;

	promise = new Promise(function(_resolve, _reject) {
		
		resolve = _resolve;
		reject = _reject;

	});

	requestDialog();

	return promise;
}

var remember = true;

function requestDialog(save = null)
{
	if(save !== null)
	{
		if(save)
		{
			const parentPath = p.dirname(filePath);

			const pass = document.querySelector('.input-pass').value;
			remember = document.querySelector('.input-remember').classList.contains('a');

			const safePass = storage.safe.encrypt(pass);

			if(remember)
			{
				const passwords = storage.get('compressedPasswords') || {};

				passwords[filePath] = safePass;
				if(!fileManager.isCompressed(parentPath) || !passwords[parentPath]) passwords[parentPath] = safePass;

				storage.set('compressedPasswords', passwords);
			}
			else
			{
				passwordsInMemory[filePath] = safePass;
				if(!fileManager.isCompressed(parentPath) || !passwordsInMemory[parentPath]) passwordsInMemory[parentPath] = safePass;
			}

			promise = false;
			resolve(pass);
		}
		else
		{
			promise = false;
			resolve(false);
		}
	}
	else
	{
		handlebarsContext.filePassword = {
			remember: remember,
		};

		events.dialog({
			header: language.dialog.auth.filePass,
			width: 400,
			height: false,
			content: template.load('dialog.file.pass.html'),
			onClose: 'fileManager.filePassword.requestDialog(false);',
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'fileManager.filePassword.requestDialog(false); events.closeDialog();',
				},
				{
					text: language.buttons.ok,
					function: 'fileManager.filePassword.requestDialog(true); events.closeDialog();',
				}
			],
		});

		events.eventSwitch();
		events.eventInput();
	}
}

module.exports = {
	get: get,
	check: check,
	request: request,
	requestDialog: requestDialog,
};