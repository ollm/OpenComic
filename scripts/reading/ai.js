const OpenComicAI = require('opencomic-ai-bin');

function change(feaute, key, value, save = true)
{
	switch (feaute)
	{
		case 'upscale':

			switch (key)
			{
				case 'model':

					const model = OpenComicAI.model(value);

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

					const model = OpenComicAI.model(value);

					fixScale(model);
					fixNoise(model);

					dom.queryAll('.reading-ai-descreen-models .text').html(getModelName(value));

					events.eventRange();

					break;

				case 'active':

					dom.query('.ai-descreen').class(!value, 'disable-pointer');

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
	model = model || OpenComicAI.model(_config.readingAi.upscale.model);
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
	model = model || OpenComicAI.model(_config.readingAi.upscale.model);
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

	if(upscale.active && !reading.isEbook() && !reading.isCanvas() && options.width && options.height)
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

	if(upscale.active && !reading.isEbook() && !reading.isCanvas() && options.width && options.height)
	{
		const {width, height} = options;
		const mp = width * height / 1000000;

		if(mp <= upscale.maxMegapixels)
		{
			const model = OpenComicAI.model(upscale.model);
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
	const modeInfo = OpenComicAI.model(model);
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

function loadUpscaleModels()
{
	const models = OpenComicAI.modelsTypeList.upscale;
	const current = _config.readingAi.model;
	const items = [];

	for(const model of models)
	{
		const modeInfo = OpenComicAI.model(model);

		items.push({
			key: model,
			name: getModelName(model),
			//rightText: modeInfo.speed+' (~'+app.normalizeNumber(app.round(modeInfo.latency, 1), 0.1)+'s)',
			rightText: getModelSpeed(modeInfo.speed),
			select: current == model ? true : false,
			function: 'reading.ai.change(\'upscale\', \'model\', \''+model+'\');',
		});
	}

	handlebarsContext.menu = {
		items: items,
	};

	document.querySelector('#reading-ai-upscale-models .menu-simple-content').innerHTML = template.load('menu.simple.element.html');
}

function loadDescreenModels()
{
	const models = OpenComicAI.modelsTypeList.descreen;
	const current = _config.readingAi.model;
	const items = [];

	for(const model of models)
	{
		const modeInfo = OpenComicAI.model(model);

		items.push({
			key: model,
			name: getModelName(model),
			//rightText: modeInfo.speed+' (~'+app.normalizeNumber(app.round(modeInfo.latency, 1), 0.1)+'s)',
			rightText: getModelSpeed(modeInfo.speed),
			select: current == model ? true : false,
			function: 'reading.ai.change(\'descreen\', \'model\', \''+model+'\');',
		});
	}

	handlebarsContext.menu = {
		items: items,
	};

	document.querySelector('#reading-ai-descreen-models .menu-simple-content').innerHTML = template.load('menu.simple.element.html');
}

function processContext()
{
	const model = OpenComicAI.model(_config.readingAi.upscale.model);
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
}


module.exports = {
	change,
	toUpscale,
	size,
	loadUpscaleModels,
	loadDescreenModels,
	processContext,
};