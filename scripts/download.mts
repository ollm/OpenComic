import fs from 'fs';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

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

	let downloadStarted = false;

	try
	{
		const response = await fetch(url, options);

		if(!response.ok || !response.body)
		{
			throw new Error(`Invalid response: ${response.status} ${response.statusText}`);
		}

		const contentLength = parseInt(response.headers.get('content-length') ?? '', 10);
		const len = Number.isFinite(contentLength) && contentLength > 0 ? contentLength : 0;
		let downloaded = 0;

		const progress = new Transform({
			transform(chunk, _encoding, callback) {

				downloaded += chunk.length;
				events.buttonLoading(button, len > 0 ? Math.min(downloaded / len, 1) : true);
				callback(null, chunk);

			},
		});

		downloadStarted = true;
		await pipeline(Readable.from(response.body), progress, fs.createWriteStream(downloadPath));
		downloadStarted = false;

		events.buttonLoading(button, 1);
		events.closeSnackbar();
	}
	catch (error)
	{
		if(downloadStarted)
		{
			try
			{
				await fs.promises.rm(downloadPath, {force: true});
			}
			catch (cleanupError)
			{
				console.error('Failed to remove incomplete download:', cleanupError);
			}
		}

		events.closeSnackbar();

		const message = error instanceof Error ? error.message : String(error);

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

		throw error;
	}
}
