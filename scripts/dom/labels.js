
function masterFolder(folder, index)
{
	dom.selectMenuItem('master-folder-'+index);
	dom.setIndexLabel({masterFolder: folder});
	dom.loadIndexPage(true);
}

function setFavorite(path)
{
	let favorites = storage.get('favorites');

	if(favorites[path])
		delete favorites[path];
	else
		favorites[path] = {added: time()};

	storage.set('favorites', favorites);

	let prevIndexLabel = dom.prevIndexLabel();

	if(prevIndexLabel.favorites)
		dom.reloadIndex();
}

function favorites()
{
	dom.selectMenuItem('favorites');
	dom.setIndexLabel({favorites: true});
	dom.loadIndexPage(true);
}

module.exports = {
	masterFolder: masterFolder,
	setFavorite: setFavorite,
	favorites: favorites,
};