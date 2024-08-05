function generateClipPath(from, to, percent, secondPage = false, reverse = false)
{
	const fromSize = reading.pageTransitions.getImageSize(from, secondPage);
	const toSize = reading.pageTransitions.getImageSize(to, secondPage);

	const ease = reading.pageTransitions.easeOutQuadBezier.get(percent);
	const m = (ease.y / 1000);

	if(fromSize.len && toSize.len)
	{
		let right, left, top, bottom;

		if(reverse)
		{
			if(secondPage)
			{
				left = (percent > 0.55 ? toSize.left - 1 : 0);
				right = fromSize.right < toSize.right ? fromSize.right - ((fromSize.right - toSize.right) * m) : 0;
			}
			else
			{
				left = toSize.left < fromSize.left ? fromSize.left - ((fromSize.left - toSize.left) * m) : 0;
				right = (percent < 0.45 ? fromSize.right - 1 : 0);
			}
		}
		else
		{
			if(secondPage)
			{
				left = (percent < 0.45 ? fromSize.left - 1 : 0);
				right = fromSize.right > toSize.right ? fromSize.right - ((fromSize.right - toSize.right) * m) : 0;
			}
			else
			{
				left = toSize.left > fromSize.left ? fromSize.left - ((fromSize.left - toSize.left) * m) : 0;
				right = (percent > 0.55 ? toSize.right - 1 : 0);
			}
		}

		top = fromSize.top + ((toSize.top - fromSize.top) * m);
		bottom = fromSize.bottom + ((toSize.bottom - fromSize.bottom) * m);

		return top+'px '+right+'px '+bottom+'px '+left+'px';
	}
	else
	{
		return '0px 0px 0px 0px';
	}
}


module.exports = {
	generateClipPath: generateClipPath,
};