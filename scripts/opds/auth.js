
function headers(url)
{
	const currentCatalog = opds.currentCatalog();

	if(currentCatalog.auth && currentCatalog.user && currentCatalog.pass)
	{
		const data = parseAuth(currentCatalog.auth);
		data.user = currentCatalog.user || '';
		data.pass = currentCatalog.pass || '';
		data.uri = new URL(url).pathname;

		let auth = false;

		switch (data.type)
		{
			case 'basic':

				auth = basic(data);

				break;
			case 'digest':

				auth = digest(data);

				break;
		}

		if(auth)
		{
			return {
				Authorization: auth,
			};
		}
	}

	return {};
}

function valid(response)
{
	const auth = response.headers.get('www-authenticate');
	const data = parseAuth(auth || '');

	if(data.type === 'basic' || data.type === 'digest')
	{
		const currentCatalog = opds.currentCatalog();
		opds.updateCatalog(currentCatalog.index, {auth: auth});

		return true;
	}

	return false;
}

function parseAuth(auth)
{
	const type = auth.trim().split(/\s/)[0].toLowerCase();

	const data = {
		type: ['basic', 'digest'].includes(type) ? type : false,
		realm: '',
		nonce: '',
		algorithm: '',
		qop: '',
		nonceCount: '',
		cnonce: md5(crypto.randomUUID()),
	};

	const matches = [...auth.matchAll(/([^\s=]+)=(["'](?:[^"']+)|(?:[^\s"',]+))/g)];

	for(let i = 0, len = matches.length; i < len; i++)
	{
		const match = matches[i];
		let key = match[1].toLowerCase();
		let value = match[2];

		if(key && value)
		{
			value = value.replace(/^['"]/, '');
			if(key !== 'realm') value.replace(/\,.*$/, '');

			data[match[1]] = value;
		}
	}

	return data;
}

var credentialsResolve, credentialsReject;

async function requestCredentials(response, forceCredentials = false)
{
	const currentCatalog = opds.currentCatalog();
	const auth = response.headers.get('www-authenticate');
	const data = parseAuth(auth || '');

	if(!currentCatalog.username || !currentCatalog.password || forceCredentials)
	{
		const promise = new Promise(function(resolve, reject) {
			
			credentialsResolve = resolve;
			credentialsReject = reject;

		});

		requestCredentialsDialog(currentCatalog.title || data.realm);

		try
		{
			await promise;
		}
		catch
		{
			throw new Error('Invalid credentials: '+response.status+' '+response.statusText);
		}
	}

	return true;
}

function requestCredentialsDialog(siteName = false, save = null)
{
	if(save !== null)
	{
		if(save)
		{
			const currentCatalog = opds.currentCatalog();

			const user = document.querySelector('.input-user').value;
			const pass = document.querySelector('.input-pass').value;

			opds.updateCatalog(currentCatalog.index, {
				user: user,
				pass: pass,
			});

			credentialsResolve();
		}
		else
		{
			credentialsReject();
		}
	}
	else
	{
		events.dialog({
			header: hb.compile(language.dialog.auth.loginTo)({siteName: siteName}),
			width: 400,
			height: false,
			content: template.load('dialog.auth.login.html'),
			onClose: 'opds.auth.requestCredentialsDialog(false, false);',
			buttons: [
				{
					text: language.buttons.cancel,
					function: 'opds.auth.requestCredentialsDialog(false, false); events.closeDialog();',
				},
				{
					text: language.buttons.login,
					function: 'opds.auth.requestCredentialsDialog(false, true); events.closeDialog();',
				}
			],
		});

		events.eventInput();
	}
}

function basic(data)
{
	const auth = btoa(data.user+':'+data.pass);
	return 'Basic '+auth;
}

var nonceCount = 0;

function hex8(number)
{
	const hex = number.toString(16);
	return hex.padStart(8, '0');
}

function digest(data)
{
	let algorithm = 'md5';

	switch (data.algorithm)
	{
		case 'SHA-256':
		case 'SHA-256-sess':

			algorithm = 'sha256';

			break;
		case 'SHA-512-256':
		case 'SHA-512-256-sess':

			algorithm = 'sha512-256';

			break;
	}

	nonceCount++;

	const sess = /sess/.test(data.algorithm) ? true : false;
	const _nonceCount = hex8(nonceCount, 8);

	const hash1 = crypto.hash(algorithm, data.user+':'+data.realm+':'+data.pass, 'hex');
	const hash2 = crypto.hash(algorithm, (data.qop === 'auth-int' ? '' : 'GET:'+data.uri), 'hex');
	const hash3 = sess ? crypto.hash(algorithm, hash1+':'+data.nonce+':'+data.cnonce, 'hex') : hash1;

	let response;

	if(data.qop === 'auth' || data.qop === 'auth-int')
		response = crypto.hash(algorithm, hash3+':'+data.nonce+':'+_nonceCount+':'+data.cnonce+':'+data.qop+':'+hash2, 'hex');
	else
		response = crypto.hash(algorithm, hash3+':'+data.nonce+':'+hash2, 'hex');

	const auth = 'username="'+data.user+'", realm="'+data.realm+'", nonce="'+data.nonce+'", uri="'+data.uri+'", algorithm='+data.algorithm+', response="'+response+'", qop='+data.qop+', nc='+_nonceCount+', cnonce="'+data.cnonce+'"';
	return 'Digest '+auth;
}

module.exports = {
	headers: headers,
	valid: valid,
	requestCredentials: requestCredentials,
	requestCredentialsDialog: requestCredentialsDialog,
};