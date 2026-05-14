import view, {FullPosition} from '../view.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const dom: any;
declare const reading: any;
declare const template: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface StayInLineData {
	scrollTop: number | false;
	scrollHeight: number | false;
	height: number | false;
	position: FullPosition | false;
	setTimeout: NodeJS.Timeout | false;
}

let previousScrollTop = 0;
let previousScrollHeight = 0;
let previousContentHeight = 0;

let stayInLineData: StayInLineData = {
	scrollTop: false,
	scrollHeight: false,
	height: false,
	position: false,
	setTimeout: false,
};

function reset()
{
	stayInLineData = {
		scrollTop: false,
		scrollHeight: false,
		height: false,
		position: false,
		setTimeout: false,
	};
}

function getPreviusContentSize()
{
	if(!reading.viewIs('scroll')) return;

	const contentRight = template._contentRight();
	const content = contentRight.firstElementChild;
	const rect = content.getBoundingClientRect();

	previousContentHeight = rect.height;
	previousScrollHeight = content.scrollHeight;
	previousScrollTop = content.scrollTop;
}

function recalculate()
{
	const currentIndex = reading.currentIndex();
	const contentNum = reading.contentNum();

	if(reading.viewIs('compact'))
	{
		if(currentIndex < 1 && dom.previousComic())
			reading.showPreviousComic(1, false);
		else if(currentIndex > contentNum && dom.nextComic())
			reading.showNextComic(1, false);
		else
			reading.pageTransitions.goToIndex(currentIndex, false);
	}
	else if(reading.viewIs('slide'))
	{
		if(currentIndex < 1 && dom.previousComic())
			reading.showPreviousComic(1, false);
		else if(currentIndex > contentNum && dom.nextComic())
			reading.showNextComic(1, false);
		else
			reading.goToIndex(currentIndex, false, reading.currentPageVisibility());
	}
	else if(reading.viewIs('scroll'))
	{
		const contentRight = template._contentRight();
		const content = contentRight.firstElementChild;
		const rect = content.getBoundingClientRect();
		const position = view.imagesFullPosition[currentIndex - 1][0];

		reading.disableOnScroll(true);

		if(stayInLineData.scrollTop === false)
			stayInLineData = {scrollTop: previousScrollTop, scrollHeight: previousScrollHeight, height: previousContentHeight, position: view.prevImagesFullPosition[currentIndex - 1][0], setTimeout: false};

		if(stayInLineData.setTimeout) clearTimeout(stayInLineData.setTimeout);
		stayInLineData.setTimeout = setTimeout(function() {

			stayInLineData = {scrollTop: false, scrollHeight: false, height: false, position: false, setTimeout: false};

			reading.disableOnScroll(false);

		}, 400);

		if(stayInLineData.scrollTop === false || stayInLineData.scrollHeight === false || stayInLineData.height === false || stayInLineData.position === false) return;

		const percent = ((stayInLineData.scrollTop + stayInLineData.height / 2) - stayInLineData.position.top) / stayInLineData.position.height;

		const scrollTop = position.top + (percent * position.height) - (rect.height / 2);
		content.scrollTop = rect.height > stayInLineData.height ? app.ceilDPR(scrollTop) : app.floorDPR(scrollTop);
	}
}

export default {
	reset,
	recalculate,
	getPreviusContentSize,
	set previousScrollTop(scrollTop: number) {previousScrollTop = scrollTop},
};
