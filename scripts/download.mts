import fs from 'fs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const events: any;
declare const language: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export default async function download(url: string, downloadPath: string, message: string = 'Downloading...')
{
	events.snackbar({
		key: 'downloading',
		text: message,
		duration: events.INFINITY,
		buttons: [
			{
				text: 'AA', // language.buttons.download,
				function: 'events.closeSnackbar();',
				className: 'downloading-button',
			},
		],
	});

	const button = document.querySelector('.snackbar .downloading-button');
	events.buttonLoading(button, 0.01);

	const options = {
		method: 'GET',
	};

	const response = await fetch(url, options);

	if(response.ok && response.body)
	{
		const len = parseInt(response.headers.get('content-length') ?? '0', 10);

		const reader = response.body.getReader();
		const fileStream = fs.createWriteStream(downloadPath);

		let downloaded = 0;

		while(true)
		{
			const {done, value} = await reader.read();

			if(done)
				break;

			fileStream.write(value);
			downloaded += value.byteLength;

			events.buttonLoading(button, downloaded / len);
		}

		events.buttonLoading(button, 1);

		let resolve;

		const promise = new Promise(function(_resolve) {

			resolve = _resolve;

		});

		fileStream.end(resolve);

		await promise;
	}
	else
	{
		const message = `Invalid response: ${response.status} ${response.statusText}`;

		events.snackbar({
			key: 'downloadError',
			text: message,
			duration: 6,
			buttons: [
				{
					text: language.buttons.dismiss,
					function: 'events.closeSnackbar();',
				},
			],
		});

		events.buttonLoading(button, false);

		throw new Error(message);
	}

	events.buttonLoading(button, 1);
	events.closeSnackbar();
}
