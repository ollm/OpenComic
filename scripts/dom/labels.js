
function masterFolder(folder, index)
{
	dom.selectMenuItem('master-folder-'+index);
	dom.setIndexLabel({masterFolder: folder});
	dom.loadIndexPage(true);
}

module.exports = {
	masterFolder: masterFolder,
};