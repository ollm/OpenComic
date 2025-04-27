
var _isEncryptionAvailable = null;

function isEncryptionAvailable()
{
	if(_isEncryptionAvailable !== null) return _isEncryptionAvailable;
	
	_isEncryptionAvailable = electronRemote.safeStorage.isEncryptionAvailable();
	return _isEncryptionAvailable;
}

function encrypt(string)
{
	if(!string || /^\$safeStorage:/.test(string) || !isEncryptionAvailable())
		return string;

	return '$safeStorage:'+electronRemote.safeStorage.encryptString(string).toString('base64');
}

var decryptCache = {};

function decrypt(string)
{
	if(/^\$safeStorage:/.test(string))
	{
		if(!decryptCache[string])
		{
			const buffer = Buffer.from(string.slice(13), 'base64');
			decryptCache[string] = electronRemote.safeStorage.decryptString(buffer);
		}

		return decryptCache[string];
	}

	return string;
}

module.exports = {
	isEncryptionAvailable: isEncryptionAvailable,
	encrypt: encrypt,
	decrypt: decrypt,
};