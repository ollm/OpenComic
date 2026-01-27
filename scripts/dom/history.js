var history = [],
	forwardHistory = [],
	current = false,
	root = {};

function add(page = {}, _clean = false)
{
	if(_clean)
		clean();

	if(page.root)
		root = page;

	history.push(page);
	current = page;
}

function update(page = {})
{
	history.pop();
	add(page);
}

function updateLastComic(path = false)
{
	const index = history.length - 1;
	const last = history[index];

	if(last && last.isComic && p.normalize(p.dirname(last.path)) === p.normalize(p.dirname(path)))
	{
		history[index].file = p.basename(path);
		history[index].path = path;
	}
}

function clean()
{
	history = [];
	current = false;
}

function cleanForwards()
{
	forwardHistory = [];
}

function cleanCurrent()
{
	history.pop();
}

async function goTo(goTo = false, animation = true)
{
	if(!goTo) return;

	if(goTo.root)
	{
		if(goTo.page)
		{
			switch(goTo.page)
			{
				case 'language':
					dom.loadLanguagePage(animation);
					break;

				case 'theme':
					dom.loadThemePage(animation);
					break;

				case 'settings':
					dom.loadSettingsPage(animation);
					break;
			}

			return;
		}

		if(goTo.indexLabel && !goTo.recentlyOpened)
			dom.setIndexLabel(goTo.indexLabel);

		if(goTo.recentlyOpened)
			await recentlyOpened.load(animation);
		else
			await dom.loadIndexPage(animation, false);
	}
	else if(goTo)
	{
		dom.setIndexLabel(goTo.indexLabel);

		if(fileManager.simpleExists(goTo.path))
		{
			if(goTo.isComic)
				await dom.openComic(animation, goTo.path, goTo.mainPath, false, false);
			else
				await dom.loadIndexPage(animation, goTo.path, false, false, goTo.mainPath, false);
		}
	}
}

function goBack()
{
	template.setHeaderDelay();

	const prev = history.pop();
	const len = history.length;

	const goBack = history[len - 1];
	current = goBack || false;

	if(!goBack)
	{
		if(handlebarsContext?.page?.key !== 'index')
			dom.loadIndexPage(true);

		return;
	}

	if(goBack.root)
	{
		if(goBack.indexLabel && !goBack.recentlyOpened)
			dom.setIndexLabel(goBack.indexLabel);

		forwardHistory.push(prev);

		if(goBack.recentlyOpened)
			recentlyOpened.load(true);
		else
			dom.loadIndexPage(true, false);
	}
	else if(goBack)
	{
		dom.setIndexLabel(goBack.indexLabel);

		if(fileManager.simpleExists(goBack.path))
		{
			forwardHistory.push(prev);

			if(goBack.isComic)
				dom.openComic(true, goBack.path, goBack.mainPath, false, true);
			else
				dom.loadIndexPage(true, goBack.path, false, false, goBack.mainPath, true);
		}
		else
		{
			return goBack();
		}
	}
}

var fromGoForwards = false;

function goForwards()
{
	template.setHeaderDelay();

	if(forwardHistory.length > 0)
	{
		const goForwards = forwardHistory.pop();
		if(!fileManager.simpleExists(goForwards.path)) return goForwards();

		if(onReading)
			reading.progress.save();

		fromGoForwards = true;

		if(goForwards.indexLabel)
			dom.setIndexLabel(goForwards.indexLabel);

		if(goForwards.isComic)
			dom.openComic(true, goForwards.path, goForwards.mainPath, false, false);
		else
			dom.loadIndexPage(true, goForwards.path, false, false, goForwards.mainPath, false, false, false, false, true);

		fromGoForwards = false;
	}
}

function serialize()
{
	return {
		history,
		forwardHistory,
		current,
		root,
	};
}

function load(data)
{
	history = data.history || [];
	forwardHistory = data.forwardHistory || [];
	current = data.current || false;
	root = data.root || {};
}

function status()
{
	return {
		history: history,
		forwardHistory: forwardHistory,
		current: current,
	};
}

module.exports = {
	add,
	update,
	updateLastComic,
	clean,
	cleanForwards,
	cleanCurrent,
	goTo,
	goBack,
	goForwards,
	status,
	serialize,
	load,
	current: function() {return current},
	root: function() {return root},
	fromGoForwards: function(){return fromGoForwards},
	get path() {return current.path},
	get mainPath() {return current.mainPath},
	get isComic() {return current.isComic},
};