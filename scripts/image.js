var sharp = false, jimp = false, imageMagick = false, graphicsMagick = false;

async function resize(fromImage, toImage, config = {})
{
	config = {...{
		width: 200,
		quality: 95,
	}, ...config};

	if(sharp === false) sharp = require('sharp');

	return new Promise(function(resolve, reject) {

		sharp(fromImage).jpeg({quality: config.quality}).resize({width: config.width, background: 'white'}).toFile(toImage, function(error) {
		
			if(error)
			{
				if(!imageMagick) imageMagick = require('gm').subClass({imageMagick: true});

				imageMagick(fromImage).resize(config.width, null).quality(config.quality).noProfile().write(toImage, function(error){

					if(error)
					{
						if(!graphicsMagick) graphicsMagick = require('gm').subClass({imageMagick: false});

						graphicsMagick(fromImage).resize(config.width, null).quality(config.quality).noProfile().write(toImage, function(error){

							if(error)
							{
								if(jimp === false) jimp = require('jimp');

								jimp.read(fromImage, function(error, lenna) {

									if(error)
									{
										reject();
									}
									else
									{
										lenna.resize(config.width, jimp.AUTO).quality(config.quality).background(0xFFFFFFFF).write(toImage, function(){

											resolve(toImage);

										});
									}

								});
							}
							else
							{
								resolve(toImage);
							}
						});

					}
					else
					{
						resolve(toImage);
					}
				});
			}
			else
			{
				resolve(toImage);
			}
		});

	});
}

module.exports = {
	resize: resize,
};