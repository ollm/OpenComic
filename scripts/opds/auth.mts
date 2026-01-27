import crypto from 'node:crypto';

declare const events: any;
declare const hb: any;
declare const language: any;
declare const opds: any;
declare const storage: any;
declare const template: any;

interface Auth {
	auth: string;
	user: string;
	pass: string;
}

interface AuthData {
	type: string | false;
	realm: string;
	nonce: string;
	algorithm: string;
	qop: string;
	nonceCount: string;
	cnonce: string;
	user?: string;
	pass?: string;
	uri?: string;
}

interface Headers {
	Authorization?: string;
}

class OpdsAuth
{
	auth: Auth | null = null;

	constructor(auth: Auth | null = null)
	{
		this.auth = auth;
	}

	async fetch(url: string, options: RequestInit = {}): Promise<Response>
	{
		const response = await fetch(url, {...options, headers: this.headers(url)});

		if(!response.ok)
		{
			const valid = this.valid(response);

			if(valid)
				return fetch(url, {...options, headers: this.headers(url)});
		}

		return response;
	}

	headers(url: string): HeadersInit
	{
		const auth = this.auth || opds.currentCatalog() as Auth;

		if(auth.auth && auth.user && auth.pass)
		{
			const data = parseAuth(auth.auth || '');
			data.user = auth.user || '';
			data.pass = storage.safe.decrypt(auth.pass || '');
			data.uri = new URL(url).pathname;

			let authorization: string | boolean = false;

			switch (data.type)
			{
				case 'basic':

					authorization = basic(data);

					break;
				case 'digest':

					authorization = digest(data);

					break;
			}

			if(authorization)
			{
				return {
					Authorization: authorization,
				};
			}
		}

		return {};
	}

	setAuth: ((auth: Partial<Auth>) => void) | null = null;

	valid(response): boolean
	{
		const auth = response.headers.get('www-authenticate');
		const data = parseAuth(auth || '');

		if(data.type === 'basic' || data.type === 'digest')
		{
			if(this.setAuth)
			{
				this.setAuth(auth);
			}
			else
			{
				const currentCatalog = opds.currentCatalog();
				opds.updateCatalog(currentCatalog.index, {auth: auth});
			}

			return true;
		}

		return false;
	}

}

const basicOpdsAuth = new OpdsAuth();

function parseAuth(auth: string): AuthData
{
	const type = auth.trim().split(/\s/)[0].toLowerCase();

	const data: AuthData = {
		type: ['basic', 'digest'].includes(type) ? type : false,
		realm: '',
		nonce: '',
		algorithm: '',
		qop: '',
		nonceCount: '',
		cnonce: crypto.hash('md5', crypto.randomUUID(), 'hex'),
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

async function requestCredentials(response: Response, forceCredentials: boolean = false): Promise<boolean>
{
	const currentCatalog = opds.currentCatalog();
	const auth = response.headers.get('www-authenticate');
	const data = parseAuth(auth || '');

	if(!currentCatalog.user || !currentCatalog.pass || forceCredentials)
	{
		const promise = new Promise<void>(function(resolve, reject) {
			
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

function requestCredentialsDialog(siteName: string | boolean = false, save: boolean | null = null): void
{
	if(save !== null)
	{
		if(save)
		{
			const currentCatalog = opds.currentCatalog();

			const user = (document.querySelector('.input-user') as HTMLInputElement).value;
			const pass = (document.querySelector('.input-pass') as HTMLInputElement).value;

			opds.updateCatalog(currentCatalog.index, {
				user: user,
				pass: storage.safe.encrypt(pass),
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

function basic(data: AuthData): string
{
	const auth = btoa(data.user+':'+data.pass);
	return 'Basic '+auth;
}

var nonceCount = 0;

function hex8(number: number): string
{
	const hex = number.toString(16);
	return hex.padStart(8, '0');
}

function digest(data: AuthData): string
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
	const _nonceCount = hex8(nonceCount);

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

const auths = new Map<string, OpdsAuth>();

function getAuth(key: string, auth: Auth): OpdsAuth
{
	key = key+'|'+auth.user+'|'+auth.pass;

	if(!auths.has(key))
		auths.set(key, new OpdsAuth(auth));

	return auths.get(key) as OpdsAuth;
}

export default {
	get: getAuth,
	basicOpdsAuth,
	fetch: basicOpdsAuth.fetch,
	headers: basicOpdsAuth.headers,
	valid: basicOpdsAuth.valid,
	requestCredentials: requestCredentials,
	requestCredentialsDialog: requestCredentialsDialog,
	OpdsAuth: OpdsAuth,
};	