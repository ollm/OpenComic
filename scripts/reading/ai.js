const OpenComicAI = require('opencomic-ai-bin');

function OpenComicAIModelSafe(name)
{
	let model;

	try
	{
		model = OpenComicAI.model(removeCustomKey(name));
	}
	catch(e)
	{
		console.error(e);

		model = {
			key: name,
			name: name,
			scales: [2, 3, 4],
			noise: undefined,
			speed: 'Very Slow',
			supportCurrentPlatform: false,
		};
	}

	return model;
}

function change(feaute, key, value, save = true)
{
	switch (feaute)
	{
		case 'upscale':

			switch (key)
			{
				case 'model':

					const model = OpenComicAIModelSafe(value);

					fixScale(model);
					fixNoise(model);

					dom.queryAll('.reading-ai-upscale-models .text').html(getModelName(value));

					events.eventRange();

					break;

				case 'active':

					dom.query('.ai-upscale').class(!value, 'disable-pointer');

					break;

				case 'autoScale':

					dom.query('.reading-ai-upscale-scale').class(!!value, 'disable-pointer');

					break;

				case 'scale':

					fixScale(false, value);
					events.eventRange();

					break;

				case 'noise':

					fixNoise(false, value);
					events.eventRange();

					break;
			}

			break;

		case 'descreen':

			switch (key)
			{
				case 'model':

					const model = OpenComicAIModelSafe(value);
					dom.queryAll('.reading-ai-descreen-models .text').html(getModelName(value));
					events.eventRange();

					break;

				case 'active':

					dom.query('.ai-descreen').class(!value, 'disable-pointer');

					break;

				case 'keepBigHalftone':

					dom.query('.reading-ai-keep-big-halftone-scale').class(!value, 'disable-pointer');

					break;
			}

			break;

		case 'artifactRemoval':

			switch (key)
			{
				case 'model':

					const model = OpenComicAIModelSafe(value);
					dom.queryAll('.reading-ai-artifact-removal-models .text').html(getModelName(value));
					events.eventRange();

					break;

				case 'active':

					dom.query('.ai-artifact-removal').class(!value, 'disable-pointer');

					break;
			}

			break;
	}

	const readingAi = structuredClone(_config.readingAi);
	readingAi[feaute][key] = value;

	if(save)
	{
		reading.updateReadingPagesConfig('readingAi', readingAi);
		apply();
	}
}

function fixScale(model = false, _scale = false)
{
	model = model || OpenComicAIModelSafe(_config.readingAi.upscale.model);
	_scale = _scale || _config.readingAi.upscale.scale;

	const input = document.querySelector('.reading-ai-upscale-scale input');
	const text = document.querySelector('.reading-ai-upscale-scale .simple-slider-text > div > span');

	if(input)
	{
		const max = app.clamp(Math.max(...model.scales), 0, 4);
		const min = Math.min(...model.scales);
		const step = model.scales[1] - model.scales[0];

		input.setAttribute('max', max);
		input.setAttribute('min', min);
		input.setAttribute('step', step);

		const scale = OpenComicAI.closest(model.scales, _scale);

		if(_scale !== scale)
		{
			input.value = scale;
			text.innerText = scale;
		}
	}
}

function fixNoise(model = false, _noise = false)
{
	model = model || OpenComicAIModelSafe(_config.readingAi.upscale.model);
	_noise = _noise || _config.readingAi.upscale.noise;

	const input = document.querySelector('.reading-ai-upscale-noise input');
	const text = document.querySelector('.reading-ai-upscale-noise .simple-slider-text > div > span');

	if(input)
	{
		const max = model.noise ? Math.max(...model.noise) : 0;
		const min = model.noise ? Math.min(...model.noise) : 0;
		const step = model.noise ? model.noise[1] - model.noise[0] : 0;

		input.setAttribute('max', max);
		input.setAttribute('min', min);
		input.setAttribute('step', step);

		if(model.noise)
		{
			const noise = OpenComicAI.closest(model.noise, _noise);

			if(_noise !== noise)
			{
				input.value = noise;
				text.innerText = noise;
			}
		}
	}

	dom.query('.reading-ai-upscale-noise').class(!model.noise, 'disable-pointer');
}

function apply()
{
	template.loadContentRight('reading.content.right.html', true);
	reading.reload(false);
}

function toUpscale(options = {})
{
	const upscale = _config.readingAi.upscale;

	if(upscale.active && !reading.isEbook() && !reading.isPdf() && options.width && options.height)
	{
		const {width, height} = options;
		const mp = width * height / 1000000;

		if(mp <= upscale.maxMegapixels)
			return size({width, height});
	}

	return false;
}

function size(options = {})
{
	const upscale = _config.readingAi.upscale;

	if(upscale.active && !reading.isEbook() && !reading.isPdf() && options.width && options.height)
	{
		const {width, height} = options;
		const mp = width * height / 1000000;

		if(mp <= upscale.maxMegapixels)
		{
			if(upscale.model.startsWith('custom-'))
				getAllCustomModels();

			const model = OpenComicAIModelSafe(upscale.model);
			let scale = upscale.scale;

			if(upscale.autoScale)
				scale = Math.min(Math.max(Math.round((Math.sqrt(upscale.maxMegapixels) / Math.sqrt(mp)) * 2), 2), 4);

			scale = OpenComicAI.closest(model.scales, scale);

			return {
				...options,
				width: width * scale,
				height: height * scale,
				model: upscale.model,
				scale: scale,
				noise: upscale.noise,
			};
		}
	}

	return options;
}

function getModelName(model)
{
	const modeInfo = OpenComicAIModelSafe(model);
	return modeInfo ? modeInfo.name : model;
}

function getModelSpeed(speed)
{
	if(speed === 'Very Fast')
		return language.global.speed.veryFast;
	else if(speed === 'Fast')
		return language.global.speed.fast;
	else if(speed === 'Medium')
		return language.global.speed.medium;
	else if(speed === 'Slow')
		return language.global.speed.slow;
	else if(speed === 'Very Slow')
		return language.global.speed.verySlow;
	else
		return speed;
}

const customModelsCache = {};

function removeCustomKey(model)
{
	return model.startsWith('custom-') ? model.slice(7) : model;
}

function getAllCustomModels(cache = true)
{
	getCustomModels('artifact-removal', cache);
	getCustomModels('descreen', cache);
	getCustomModels('upscale', cache);

	return customModelsCache;
}

function getCustomModels(key, cache = true)
{
	const folder = config.readingCustomModelsFolder;

	if(!folder)
		return [];

	if(cache && customModelsCache[key])
		return customModelsCache[key];

	const parameters = [
		'scale',
		'tileSize',
		'tileSizeFromMem',
		'tileAlignment',
		'fp32'
	];

	const getParameterValue = function(name, content) {

		const match = content.match(new RegExp(`${name}=([a-zA-Z0-9.,_+]+)`, 'iu'));
		let value = match ? match[1] : null;

		if(!isNaN(value))
			value = Number(value);

		return value;

	};

	const removeParameters = function(content) {

		for(const name of parameters)
		{
			content = content.replace(new RegExp(`${name}=([a-zA-Z0-9.,_+]+)`, 'iu'), '');
		}

		return content.replace(/([ _,.-])\1+/g, '$1').replace(/([ _,.-])$/g, '');
	};

	const readFiles = function(modelsPath, key = '', type = 'custom') {

		if(!fs.existsSync(modelsPath))
			return [];

		const files = fs.readdirSync(modelsPath);
		
		// Agroup files by name without extension
		const grouped = {};
		const scalePattern = /(?:(\d+)x|x(\d+))/iu;

		for(const file of files)
		{
			const extension = app.extname(file);
			const type = extension === 'bin' ? 'bin' : extension === 'param' ? 'param' : 'other';
			const name = p.basename(file, p.extname(file));

			let baseName = name;
			let scale = getParameterValue('scale', name) ?? scale;

			if(!scale)
			{
				const scaleMatch = name.match(scalePattern);
				scale = Number(scaleMatch?.[1] ?? scaleMatch?.[2] ?? 1);
				baseName = scaleMatch ? name.replace(scaleMatch[0], '') : name;
			}

			const tileSize = getParameterValue('tileSize', name);
			const tileSizeFromMem = getParameterValue('tileSizeFromMem', name);
			const tileAlignment = getParameterValue('tileAlignment', name);
			let fp32 = getParameterValue('fp32', name);
			fp32 = fp32 && fp32 !== 'false';

			baseName = removeParameters(baseName);

			if(!grouped[baseName])
				grouped[baseName] = {scales: [], tileSize: false, tileSizeFromMem: false, tileAlignment: false, fp32: false, files: {}};

			const group = grouped[baseName];

			if(!group.files[name])
				group.files[name] = {scale};

			if(!group.scales.includes(scale))
				group.scales.push(scale);

			group.files[name][type] = file;
			group.tileSize = group.tileSize || tileSize;
			group.tileSizeFromMem = group.tileSizeFromMem || (tileSizeFromMem ? OpenComicAI.tileMemoryProfiles[tileSizeFromMem] || tileSizeFromMem.replace(/[_+]/g, ':') : false);
			group.tileAlignment = group.tileAlignment || tileAlignment;
			group.fp32 = group.fp32 || fp32;
		}

		const result = [];

		for(const baseName in grouped)
		{
			const group = grouped[baseName];
			const modelKey = `custom-${baseName}`;

			const files = [];
			const scaleFiles = {};

			for(const name in group.files)
			{
				const bin = group.files[name].bin;
				const param = group.files[name].param;

				if(!bin || !param)
					continue;

				files.push(bin, param);

				const scale = group.files[name].scale;
				scaleFiles[scale] = name;
			}

			if(files.length === 0)
				continue;

			const {tileSize, tileSizeFromMem, tileAlignment, fp32} = group;

			const model = {
				key: baseName,
				name: baseName, // Format name?
				type: type,
				upscaler: 'upscayl',
				tileSize: tileSize || 0,
				tileSizeFromMem: tileSizeFromMem || OpenComicAI.tileMemoryProfiles.ESRGAN_Upscale,
				tileAlignment: tileAlignment || 4,
				fp32: fp32 || false,
				scales: group.scales,
				noise: undefined,
				latency: 0,
				modelsPath: p.dirname(modelsPath),
				folder: './models',
				files: files,
				scaleFiles: scaleFiles,
			};

			// console.log(model);

			OpenComicAI.setCustomModel(model);
			result.push(modelKey);
		}

		return result;

	}

	const files = [
		...readFiles(p.join(folder, key, 'models'), key, key),
		...readFiles(p.join(folder, 'models'), key, `custom`),
	];

	customModelsCache[key] = files;
	return files;

}

function loadModels(key)
{
	const queryKey = key === 'artifactRemoval' ? 'artifact-removal' : key;
	const models = OpenComicAI.modelsTypeList[queryKey];
	const current = _config.readingAi[key].model;
	const items = [];

	const opencomicPreview = models.filter(model => model.startsWith('opencomic-') && /-v4/.test(model));
	const opencomicLast = models.filter(model => model.startsWith('opencomic-') && /-v3/.test(model));
	const opencomic = models.filter(model => model.startsWith('opencomic-') && !/-v3/.test(model) && !/-v4/.test(model));
	const others = models.filter(model => !model.startsWith('opencomic-'));
	const custom = getCustomModels(queryKey, false);

	const process = function(models, emptyText, rightText = true) {

		for(const model of models)
		{
			const modeInfo = OpenComicAIModelSafe(model);

			items.push({
				key: model,
				name: getModelName(model),
				//rightText: modeInfo.speed+' (~'+app.normalizeNumber(app.round(modeInfo.latency, 1), 0.1)+'s)',
				rightText: rightText ? getModelSpeed(modeInfo.speed) : '',
				paddingLeft: true,
				select: current == model ? true : false,
				function: 'reading.ai.change(\''+key+'\', \'model\', \''+model+'\');',
			});
		}

		if(models.length === 0 && emptyText)
		{
			items.push({
				name: emptyText,
				paddingLeft: true,
				disabled: true,
			});
		}
	}

	if(opencomicPreview.length > 0)
	{
		items.push({
			text: `${language.reading.pages.openComicModels} v4 Preview`,
		});

		process(opencomicPreview);
	}

	items.push({
		text: `${language.reading.pages.openComicModels} v3`,
	});

	process(opencomicLast);

	items.push({
		text: language.reading.pages.openComicModels,
	});

	process(opencomic);

	items.push({
		text: language.reading.pages.customModels,
	});

	process(custom, language.reading.pages.emptyCustomModels, false);

	items.push({
		text: language.reading.pages.otherModels,
	});

	process(others);

	events.menuSimple(items, {
		width: 552,
		query: '#reading-ai-'+queryKey+'-models',
	});
}

function processContext()
{
	getAllCustomModels();

	const model = OpenComicAIModelSafe(_config.readingAi.upscale.model);
	handlebarsContext.readingUpscaleModel = getModelName(_config.readingAi.upscale.model);

	// Scale
	{
		const max = app.clamp(Math.max(...model.scales), 0, 4);
		const min = Math.min(...model.scales);
		const step = model.scales[1] - model.scales[0];

		const scale = app.clamp(_config.readingAi.upscale.scale, min, max);

		handlebarsContext.readingUpscaleScale = {scale, max, min, step};
	}

	// Noise
	{
		const max = model.noise ? Math.max(...model.noise) : 0;
		const min = model.noise ? Math.min(...model.noise) : 0;
		const step = model.noise ? model.noise[1] - model.noise[0] : 0;

		const noise = model.noise ? app.clamp(_config.readingAi.upscale.noise, min, max) : 0;

		handlebarsContext.readingUpscaleNoise = {compatible: !!model.noise, noise, max, min, step};
	}

	// Descreen
	handlebarsContext.readingDescreenModel = getModelName(_config.readingAi.descreen.model);

	// Artifact Removal
	handlebarsContext.readingArtifactRemovalModel = getModelName(_config.readingAi.artifactRemoval.model);
}


module.exports = {
	change,
	toUpscale,
	size,
	loadModels,
	processContext,
	removeCustomKey,
	getCustomModels,
	getAllCustomModels,
};