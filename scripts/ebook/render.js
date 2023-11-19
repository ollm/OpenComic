const ipcRenderer = require('electron').ipcRenderer,
	p = require('path');

const app = require(p.join(__dirname, '../scripts/app.js'));
const ebook = require(p.join(__dirname, '../scripts/ebook.js'));
const book = ebook.load();

var windowIsLoaded = false, toProcess = false;

window.onload = function() {

	windowIsLoaded = true;

	if(toProcess)
		process(toProcess);

	toProcess = false;

}

var renderPageIframe;

async function process(data)
{
	if(data.type == 'split-in-pages')
	{
		book.updateConfig(data.config);
		let pages = await book.splitInPages(data.html.documentElement, data.basePath, data.path);

		ipcRenderer.send('rendered-ebook', data.index, pages);

	}
	else if(data.type == 'render-page')
	{
		if(renderPageIframe) renderPageIframe.remove();

		book.updateConfig(data.config);
		let pages = await book.splitInPages(data.html.documentElement, data.basePath, data.path);

		renderPageIframe = book.pageToIframe(pages[0].html);

		renderPageIframe.addEventListener('load', function(event) {

			ipcRenderer.send('rendered-page', data.index, pages);

		});

		document.body.appendChild(renderPageIframe);
		if(data.config.imageWidth) renderPageIframe.style.transform = 'scale('+(data.config.imageWidth / data.config.width)+')';
	}
}

ipcRenderer.on('render', function(event, data) {

	data.html = new DOMParser().parseFromString(data.html, 'application/xhtml+xml');

	if(!windowIsLoaded)
		toProcess = data;
	else
		process(data);

});

ipcRenderer.on('ping', function(event, index) {

	ipcRenderer.send('pong', index);

});