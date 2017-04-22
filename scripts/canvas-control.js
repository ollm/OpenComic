

var paintedSurface = {x1: false, y1: false, x2: false, y2: false};

function calcPaintedSurface(x = 0, y = 0, w = 0, h = 0)
{
	if(!paintedSurface.x1 || x < paintedSurface.x1)
		paintedSurface.x1 = x;

	if(!paintedSurface.y1 || y < paintedSurface.y1)
		paintedSurface.y1 = y1;

	if(!paintedSurface.x2 || x + w > paintedSurface.x2)
		paintedSurface.x2 = x2;

	if(!paintedSurface.y2 || y + h > paintedSurface.y2)
		paintedSurface.y2 = y2;

}

function imageCanvas(ctx, img, data, invert = false, opacity = 1)
{
	ctx.save();

	if(opacity < 1)
	{
		ctx.globalAlpha = opacity;
	}

	if(typeof data.source != 'undefined' && typeof data.destiny != 'undefined')
	{
		if(invert)
		{
			ctx.scale(-1,1);
			ctx.drawImage(img, data.source.x, data.source.y, data.source.width, data.source.height, data.destiny.x * -1, data.destiny.y, data.destiny.width * -1, data.destiny.height);
		}
		else
		{
			ctx.drawImage(img, data.source.x, data.source.y, data.source.width, data.source.height, data.destiny.x, data.destiny.y, data.destiny.width, data.destiny.height);
		}

		calcPaintedSurface(data.destiny.x, data.destiny.y, data.destiny.width, data.destiny.height);
	}
	else if(typeof data.destiny != 'undefined')
	{
		if(invert)
		{
			ctx.scale(-1,1);
			ctx.drawImage(img, data.destiny.x * -1, data.destiny.y, data.destiny.width * -1, data.destiny.height);
		}
		else
		{
			ctx.drawImage(img, data.destiny.x, data.destiny.y, data.destiny.width, data.destiny.height);
		}

		calcPaintedSurface(data.destiny.x, data.destiny.y, data.destiny.width, data.destiny.height);
	}

	ctx.restore();
}

module.exports = {
	imageCanvas: imageCanvas,
};