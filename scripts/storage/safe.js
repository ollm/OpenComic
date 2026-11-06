
var _isEncryptionAvailable = null;

async function isEncryptionAvailable()
{
	if(_isEncryptionAvailable === null)
	{
		const safeStorage = electronRemote.safeStorage;
		_isEncryptionAvailable = safeStorage.isAsyncEncryptionAvailable ? await safeStorage.isAsyncEncryptionAvailable() : safeStorage.isEncryptionAvailable();
	}

	return _isEncryptionAvailable;
}

async function encrypt(string)
{
	if(!string || /^\$safeStorage:/.test(string) || !await isEncryptionAvailable())
		return string;

	const safeStorage = electronRemote.safeStorage;
	const encrypted = safeStorage.encryptStringAsync ? await safeStorage.encryptStringAsync(string) : safeStorage.encryptString(string);

	return '$safeStorage:'+encrypted.toString('base64');
}

var decryptCache = {};

async function decrypt(string)
{
	if(/^\$safeStorage:/.test(string))
	{
		if(!Object.prototype.hasOwnProperty.call(decryptCache, string))
		{
			const buffer = Buffer.from(string.slice(13), 'base64');
			const safeStorage = electronRemote.safeStorage;
			decryptCache[string] = safeStorage.decryptStringAsync ? safeStorage.decryptStringAsync(buffer).then(result => result.result) : safeStorage.decryptString(buffer);
		}

		return await decryptCache[string];
	}

	return string;
}

module.exports = {
	isEncryptionAvailable: isEncryptionAvailable,
	encrypt: encrypt,
	decrypt: decrypt,
};