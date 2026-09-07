const OpenComicAI = require('opencomic-ai-bin');
const sharp = require('sharp');
const fsp = require('fs/promises');

OpenComicAI.setDirname(asarToAsarUnpacked(OpenComicAI.__dirname));

let currentPath = false;

function setModelsPath()
{
	const path = p.join(tempFolder, 'ai-models');

	if(!fs.existsSync(path))
		fs.mkdirSync(path, {recursive: true});

	if(currentPath !== path)
	{
		OpenComicAI.setModelsPath(path);
		currentPath = path;
	}
}

function upscale(src, imageSize, options = {})
{
	const toUpscale = reading.ai.toUpscale(imageSize);

	if(toUpscale)
	{
		const folderSha = sha1(p.dirname(src));
		const imageSha = sha1(`${src}|${toUpscale.model}|${toUpscale.scale}`);

		const folderPath = p.join(tempFolder, 'ai-upscale', folderSha);
		const path = p.join(folderPath, imageSha+'.jpg');

		if(fs.existsSync(path))
		{
			fileManager.setTmpUsage(path);
			return path;
		}

		if(options.generate === false)
			return;

		if(options.toUpscale)
			options.toUpscale(toUpscale);

		(async function(){

			await threads.job('aiPipeline', {key: imageSha, resolveDuplicated: true, useThreads: threads.SINGLE}, async function() {

				if(fs.existsSync(path))
					return;

				const ext = app.extname(src);
				let imagePath = src, convertPath = false;

				// Images that are not jpg, png or webp are not supported by RealESRGAN
				if(!compatible.image.jpg.has(ext) && !compatible.image.png.has(ext) && !compatible.image.webp.has(ext))
				{
					convertPath = p.join(folderPath, imageSha+'.png');
					await fsp.mkdir(folderPath, {recursive: true});
					await image.toPng(src, convertPath);
					imagePath = convertPath;
				}

				await OpenComicAI.pipeline(imagePath, path, [
					{
						model: toUpscale.model,
						scale: toUpscale.scale,
					}
				], options.onProgress || false);

				if(convertPath)
					fs.rmSync(convertPath, {force: true});

				return;

			});

			if(options.onUpscale)
				options.onUpscale(path);

		})();
	}

	return false;
}

function pipeline()
{

}

const downloading = {
	start: function() {

		events.snackbar({
			key: 'downloadingAiModel',
			text: 'Downloading AI model',
			duration: events.INFINITY,
			buttons: [
				{
					text: 'AA', // language.buttons.download,
					function: 'events.closeSnackbar();',
					className: 'ai-model-downloading-button',
				},
			],
		});

		const button = document.querySelector('.snackbar .ai-model-downloading-button');
		//events.buttonLoading(button, true);
		events.buttonLoading(button, 0.01);

	},
	progress: function(progress) {

		const button = document.querySelector('.snackbar .ai-model-downloading-button');
		events.buttonLoading(button, progress);

	},
	end: function() {

		const button = document.querySelector('.snackbar .ai-model-downloading-button');
		events.buttonLoading(button, 1);

		events.closeSnackbar();

	},
};

function _image(src, imageSize, options = {})
{
	setModelsPath();
	OpenComicAI.setSharp(sharp);

	// Set tmp usage
	const listModels = [];

	const artifactRemoval = _config.readingAi.artifactRemoval;
	const descreen = _config.readingAi.descreen;
	const toUpscale = reading.ai.toUpscale(imageSize);

	const _pipeline = [];

	if(artifactRemoval.active)
	{
		_pipeline.push({
			model: artifactRemoval.model,
		});

		listModels.push(artifactRemoval.model);
	}

	if(descreen.active)
	{
		const descreenMaskModel = 'opencomic-ai-descreen-mask-fast-v3-test-500000';
		const artifactRemovalModel = 'opencomic-ai-artifact-removal-compact';

		_pipeline.push({
			model: descreen.model,

			...(descreen.keepBigHalftone && {
				keepBigHalftone: {
					model: descreenMaskModel,
					minSize: descreen.minSize,
					// tileSize: 512, // TODO: This is not necesary when auto tile size is implemented

					...(!artifactRemoval.active && { // Only add artifact removal if it's not already in the pipeline
						artifactRemoval: {
							model: artifactRemovalModel,
						},
					}),

				},

			}),
		});

		listModels.push(descreen.model);

		if(descreen.keepBigHalftone)
		{
			listModels.push(descreenMaskModel);

			if(!artifactRemoval.active)
				listModels.push(artifactRemovalModel);
		}
	}

	if(toUpscale)
	{
		_pipeline.push({
			model: toUpscale.model,
			scale: toUpscale.scale,
			noise: toUpscale.noise,
		});

		listModels.push(toUpscale.model);
	}

	if(!_pipeline.length)
		return;

	const folderSha = sha1(p.dirname(src));
	const imageSha = sha1(`${src}|${JSON.stringify(_pipeline)}`);

	const folderPath = p.join(tempFolder, 'ai', folderSha);
	const path = p.join(folderPath, imageSha+'.jpg');

	if(fs.existsSync(path))
	{
		fileManager.setTmpUsage(path);
		return path;
	}

	if(!options.run)
		return;

	if(options.start)
		options.start(pipeline);

	(async function(){

		for(const model of listModels)
		{
			const modelInfo = OpenComicAI.model(model);

			for(const file of modelInfo.files)
			{
				fileManager.setTmpUsage(p.join(modelInfo.path, file));
			}
		}

		await threads.job('aiPipeline', {key: imageSha, useThreads: threads.SINGLE}, async function() {

			if(fs.existsSync(path))
				return;

			const ext = app.extname(src);
			let imagePath = src, convertPath = false;

			// Images that are not jpg, png or webp are not supported by OpenComicAI
			if(!compatible.image.jpg.has(ext) && !compatible.image.png.has(ext) && !compatible.image.webp.has(ext))
			{
				convertPath = p.join(folderPath, imageSha+'.png');
				await fsp.mkdir(folderPath, {recursive: true});
				await image.toPng(src, convertPath);
				imagePath = convertPath;
			}

			OpenComicAI.keepIccProfile('rgb16');
			await OpenComicAI.pipeline(imagePath, path, _pipeline, options.progress || false, downloading);

			fileManager.setTmpUsage(path);

			if(convertPath)
				fs.rmSync(convertPath, {force: true});

			return;

		});

		if(options.end)
			options.end(path);

	})();

	return;
}

let prevOptionsKey = false;

function clean(force = false)
{
	if(force)
		return threads.clean('aiPipeline');

	const optionsKey = sha1(`${JSON.stringify(_config.readingAi)}`);

	// Not clean if options didn't change
	if(prevOptionsKey !== optionsKey)
		threads.clean('aiPipeline');

	prevOptionsKey = optionsKey;
}

module.exports = {
	upscale,
	pipeline,
	image: _image,
	clean,
	downloading,
};