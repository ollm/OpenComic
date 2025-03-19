var shosho = false;

var shortcuts = false;

async function loadShoShoObject()
{
	if(shosho) return;

	shosho = new ShoSho({
		capture: true,
		target: document,
	});

	shoshoMouse = new ShoSho({
		capture: true,
		target: document.querySelector('.content-right'),
	});

	return true;
}

function inputIsFocused()
{
	if(document.activeElement && document.activeElement.tagName === 'INPUT')
		return document.activeElement;

	return false;
}

function clickTapZone(event, button)
{
	if(reading.abortClick(event) && button != 'rightClick' && button != 'middleClick')
		return false;

	const contentRight = template._contentRight();
	const rect = contentRight.getBoundingClientRect();

	let pageX = app.pageX(event) - rect.left;
	let pageY = app.pageY(event) - rect.top;

	pageY = pageY / rect.height;
	pageX = pageX / rect.width;

	const vertical = (pageY > 0.66666 ? 'bottom' : (pageY > 0.33333 ? 'center' : 'top'));
	const horizontal = (pageX > 0.66666 ? 'right' : (pageX > 0.33333 ? 'center' : 'left'));

	const action = shortcuts[currentlyRegistered].tapZones[vertical][horizontal][button];

	if(shortcuts[currentlyRegistered].actions[action])
		shortcuts[currentlyRegistered].actions[action].function();

	return true;
}

function shortcutSnackbar(string, status = null)
{
	events.closeSnackbar();
	
	string = string+(status !== null ? ': '+(status ? language.buttons.on : language.buttons.off) : '');

	events.snackbar({
		key: string,
		text: string,
		duration: 2,
		buttons: [
			{
				text: language.buttons.dismiss,
				function: 'events.closeSnackbar();',
			},
		],
	});
}

function loadShortcuts()
{
	shortcuts = {
		browse: {
			actionsOrder: [
				'reload',
				'search',
				'searchFilter',
				'prevChapter',
				'nextChapter',
				'goBack',
				'goForwards',
			],
			actions: {
				reload: {
					name: language.reading.prev,
					function: function(){
						dom.reload();
						return true;
					},
				},
				search: {
					name: language.global.search,
					function: function(){
						dom.search.showHide();
						return true;
					},
				},
				searchFilter: {
					name: language.global.search,
					function: function(){
						dom.search.showHide(true);
						return true;
					},
				},
				prevChapter: {
					name: language.reading.prevChapter,
					function: function(){
						dom.goPrevComic();
						return true;
					},
				},
				nextChapter: {
					name: language.reading.nextChapter,
					function: function(){
						dom.goNextComic();
						return true;
					},
				},
				goBack: {
					name: language.global.goBack,
					function: function(){
						gamepad.goBack();
						return true;
					},
				},
				goForwards: {
					name: language.global.goForwards,
					function: function(){
						gamepad.goForwards();
						return true;
					},
				},
			},
			shortcuts: {},
			_shortcuts: {
				'F5': 'reload',
				'Ctrl+F': 'search',
				'Ctrl+G': 'searchFilter',
				'Mouse3': 'goBack',
				'Mouse4': 'goForwards',
			},
			_shortcutsForce: {},
			tapZones: {},
			_tapZones: {},
			gamepad: {},
			_gamepad: {
				'X': 'reload',
				'LB': 'prevChapter',
				'RB': 'nextChapter',
			},
		},
		opds: {
			actionsOrder: [
				'reload',
				'search',
				'goBack',
				'goForwards',
			],
			actions: {
				reload: {
					name: language.reading.prev,
					function: function(){
						dom.reload();
						return true;
					},
				},
				search: {
					name: language.global.search,
					function: function(){
						opds.search.show();
						return true;
					},
				},
				goBack: {
					name: language.global.goBack,
					function: function(){
						gamepad.goBack();
						return true;
					},
				},
				goForwards: {
					name: language.global.goForwards,
					function: function(){
						gamepad.goForwards();
						return true;
					},
				},
			},
			shortcuts: {},
			_shortcuts: {
				'F5': 'reload',
				'Ctrl+F': 'search',
				'Mouse3': 'goBack',
				'Mouse4': 'goForwards',
			},
			_shortcutsForce: {},
			tapZones: {},
			_tapZones: {},
			gamepad: {},
			_gamepad: {
				'X': 'reload',
			},
		},
		reading: {
			actionsOrder: [
				'prev',
				'next',
				'start',
				'end',
				'prevComic',
				'nextComic',
				'magnifyingGlass',
				'createAndDeleteBookmark',
				'pageLayout',
				'slide',
				'scroll',
				'roughPageTurn',
				'smoothPageTurn',
				'fade',
				'readingManga',
				'readingWebtoon',
				'doublePage',
				'doNotApplyToHorizontals',
				'blankPage',
				'adjustToWidth',
				'notEnlargeMoreThanOriginalSize',
				'rotateHorizontals',
				'ebookLayout',
				'increaseFontSize',
				'decreaseFontSize',
				'hideBarHeader',
				'hideContentLeft',
				'fullscreen',
				'zoomIn',
				'zoomOut',
				'zoomUp',
				'zoomDown',
				'zoomLeft',
				'zoomRight',
				'saveImage',
				'saveAllImages',
				'copyImage',
				'saveBookmarksImages',
				'saveAllBookmarksImages',
				'resetZoom',
				'goBack',
				'goForwards',
				'contextMenu',
				'gamepadMenu',
			],
			actionsGroups: [
				{
					name: language.settings.general,
					items: [
						'prev',
						'next',
						'start',
						'end',
						'prevComic',
						'nextComic',
						'magnifyingGlass',
						'createAndDeleteBookmark',
					],
				},
				{
					name: language.reading.pages.pageLayout,
					items: [
						'pageLayout',
						'slide',
						'scroll',
						'roughPageTurn',
						'smoothPageTurn',
						'fade',
						'readingManga',
						'readingWebtoon',
						'doublePage',
						'doNotApplyToHorizontals',
						'blankPage',
						'adjustToWidth',
						'notEnlargeMoreThanOriginalSize',
						'rotateHorizontals',
					],
				},
				{
					name: language.reading.pages.ebookLayout,
					items: [
						'ebookLayout',
						'increaseFontSize',
						'decreaseFontSize',
					],
				},
				{
					name: language.settings.shortcuts.screen,
					items: [
						'hideBarHeader',
						'hideContentLeft',
						'fullscreen',
					],
				},
				{
					name: language.settings.shortcuts.zoom,
					items: [
						'zoomIn',
						'zoomOut',
						'zoomUp',
						'zoomDown',
						'zoomLeft',
						'zoomRight',
						'resetZoom',
					],
				},
				{
					name: language.settings.navigation.main,
					items: [
						'goBack',
						'goForwards',
					],
				},
				{
					name: language.global.contextMenu.saveImage,
					items: [
						'saveImage',
						'saveAllImages',
						'copyImage',
						'saveBookmarksImages',
						'saveAllBookmarksImages',
					],
				},
				{
					name: language.settings.shortcuts.menus,
					items: [
						'contextMenu',
						'gamepadMenu',
					],
				},
			],
			actions: {
				prev: {
					name: language.reading.previous,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(event instanceof PointerEvent)
						{
							return reading.leftClick(event);
						}
						else
						{
							reading.goPrev();
							return true;
						}

					},
				},
				next: {
					name: language.reading.next,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(event instanceof PointerEvent)
						{
							if(event.button != 2 || event.type != 'contextmenu')
								return reading.rightClick(event);
							else
								return false;
						}
						else
						{
							reading.goNext();
							return true;
						}

					},
				},
				start: {
					name: language.reading.firstPage,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goStart();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(true)) return true;
						}

						return false;
					},
				},
				end: {
					name: language.reading.lastPage,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goEnd();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(false)) return true;
						}

						return false;
					},
				},
				prevComic: {
					name: language.reading.prevChapter,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goPrevComic();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(true)) return true;
						}

						return false;
					},
				},
				nextComic: {
					name: language.reading.nextChapter,
					function: function(event){

						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!reading.readingViewIs('scroll') || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
						{
							reading.goNextComic();
							return true;
						}
						else if(!reading.zoomingIn())
						{
							reading.disableOnScroll(false);
							if(reading.scrollNextOrPrevComic(false)) return true;
						}

						return false;
					},
				},
				magnifyingGlass: {
					name: language.reading.magnifyingGlass.main,
					function: function(event, gamepad = false){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.activeMagnifyingGlass(null, !!gamepad);
						return true;
					},
				},
				hideBarHeader: {
					name: language.reading.moreOptions.hideBarHeader,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.hideBarHeader();
						return true;
					},
				},
				hideContentLeft: {
					name: language.reading.moreOptions.hideContentLeft,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.hideContentLeft();
						return true;
					},
				},
				createAndDeleteBookmark: {
					name: language.reading.addBookmark,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.createAndDeleteBookmark();
						return true;
					},
				},
				zoomIn: {
					name: language.menu.view.zoomIn,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomIn(true, true);
						return true;
					},
				},
				zoomOut: {
					name: language.menu.view.zoomOut,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomOut(true, true);
						return true;
					},
				},
				zoomUp: {
					name: language.menu.view.zoomUp,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomUp();
						return true;
					},
				},
				zoomDown: {
					name: language.menu.view.zoomDown,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomDown();
						return true;
					},
				},
				zoomLeft: {
					name: language.menu.view.zoomLeft,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomLeft();
						return true;
					},
				},
				zoomRight: {
					name: language.menu.view.zoomRight,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.zoomRight();
						return true;
					},
				},
				resetZoom: {
					name: language.menu.view.resetZoom+'<br>'+language.menu.view.originalSize,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						let center = true;
						if(event instanceof PointerEvent) center = false;
						reading.resetZoom(true, false, true, center);
						return true;
					},
				},
				fullscreen: {
					name: language.menu.view.toggleFullScreen,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						fullScreen();
						return true;
					},
				},
				goBack: {
					name: language.global.goBack,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						gamepad.goBack();
						return true;
					},
				},
				goForwards: {
					name: language.global.goForwards,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						gamepad.goForwards();
						return true;
					},
				},
				gamepadMenu: {
					name: language.settings.shortcuts.gamepadMenu,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						gamepad.showMenu();
						return true;
					},
				},
				contextMenu: {
					name: language.settings.shortcuts.contextMenu,
					function: function(event, gamepad = false){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.contextMenu.show(!!gamepad);
						return true;
					},
				},
				pageLayout: {
					name: language.reading.pages.pageLayout,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						reading.loadReadingPages(false, false, 'page-layout');
						events.activeMenu('#reading-pages', '.bar-right-buttons .button-page-layout', 'right');
						events.eventsTab();

						return true;
					},
				},
				slide: {
					name: language.reading.pages.slide,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(_config.readingWebtoon) reading.changePagesView(9, false, false);
						reading.changePagesView(1, 'slide', false);

						shortcutSnackbar(language.reading.pages.slide);

						return true;
					},
				},
				scroll: {
					name: language.reading.pages.scroll,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(_config.readingWebtoon) reading.changePagesView(9, false, false);
						reading.changePagesView(1, 'scroll', false);

						shortcutSnackbar(language.reading.pages.scroll);

						return true;
					},
				},
				roughPageTurn: {
					name: language.reading.pages.roughPageTurn,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(_config.readingWebtoon) reading.changePagesView(9, false, false);
						reading.changePagesView(1, 'rough-page-turn', false);

						shortcutSnackbar(language.reading.pages.roughPageTurn);

						return true;
					},
				},
				smoothPageTurn: {
					name: language.reading.pages.smoothPageTurn,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(_config.readingWebtoon) reading.changePagesView(9, false, false);
						reading.changePagesView(1, 'smooth-page-turn', false);

						shortcutSnackbar(language.reading.pages.smoothPageTurn);

						return true;
					},
				},
				fade: {
					name: language.reading.pages.fade,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(_config.readingWebtoon) reading.changePagesView(9, false, false);
						reading.changePagesView(1, 'fade', false);

						shortcutSnackbar(language.reading.pages.fade);

						return true;
					},
				},
				readingManga: {
					name: language.reading.pages.readingManga,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!_config.readingWebtoon)
						{
							reading.changePagesView(8, !_config.readingManga, false);
							shortcutSnackbar(language.reading.pages.readingManga, _config.readingManga);
						}

						return true;
					},
				},
				readingWebtoon: {
					name: language.reading.pages.readingWebtoon,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						reading.changePagesView(9, !_config.readingWebtoon, false);
						shortcutSnackbar(language.reading.pages.readingWebtoon, _config.readingWebtoon);

						return true;
					},
				},
				doublePage: {
					name: language.reading.pages.doublePage,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!_config.readingWebtoon)
						{
							reading.changePagesView(6, !_config.readingDoublePage, false);
							shortcutSnackbar(language.reading.pages.doublePage, _config.readingDoublePage);
						}

						return true;
					},
				},
				doNotApplyToHorizontals: {
					name: language.reading.pages.doNotApplyToHorizontals+' ('+language.reading.pages.doublePage+')',
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!_config.readingWebtoon && _config.readingDoublePage)
						{
							reading.changePagesView(7, !_config.readingDoNotApplyToHorizontals, false);
							shortcutSnackbar(language.reading.pages.doNotApplyToHorizontals, _config.readingDoNotApplyToHorizontals);
						}

						return true;
					},
				},
				blankPage: {
					name: language.reading.pages.blankPage+' ('+language.reading.pages.doublePage+')',
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!_config.readingWebtoon && _config.readingDoublePage)
						{
							reading.changePagesView(12, !_config.readingBlankPage, false);
							shortcutSnackbar(language.reading.pages.blankPage, _config.readingBlankPage);
						}

						return true;
					},
				},
				adjustToWidth: {
					name: language.reading.pages.adjustToWidth+' ('+language.reading.pages.scroll+')',
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(reading.readingViewIs('scroll') && !_config.readingWebtoon)
						{
							reading.changePagesView(3, !_config.readingViewAdjustToWidth, false);
							shortcutSnackbar(language.reading.pages.adjustToWidth, _config.readingViewAdjustToWidth);
						}

						return true;
					},
				},
				notEnlargeMoreThanOriginalSize: {
					name: language.reading.pages.notEnlargeMoreThanOriginalSize,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						if(!_config.readingWebtoon)
						{
							reading.changePagesView(18, !_config.readingNotEnlargeMoreThanOriginalSize, false);
							shortcutSnackbar(language.reading.pages.notEnlargeMoreThanOriginalSize, _config.readingNotEnlargeMoreThanOriginalSize);
						}

						return true;
					},
				},
				rotateHorizontals: {
					name: language.reading.pages.rotateHorizontals,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						reading.changePagesView(19, !_config.readingRotateHorizontals, false);
						shortcutSnackbar(language.reading.pages.rotateHorizontals, _config.readingRotateHorizontals);

						return true;
					},
				},
				ebookLayout: {
					name: language.reading.pages.ebookLayout,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						reading.loadReadingPages(false, false, 'ebook-layout');
						events.activeMenu('#reading-pages', '.bar-right-buttons .button-ebook-layout', 'right');
						events.eventsTab();

						return true;
					},
				},
				increaseFontSize: {
					name: language.reading.pages.increaseFontSize,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						reading.ebook.increase('fontSize');

						return true;
					},
				},
				decreaseFontSize: {
					name: language.reading.pages.decreaseFontSize,
					function: function(){
						if(inputIsFocused() || !reading.isLoaded()) return false;

						reading.ebook.decrease('fontSize');

						return true;
					},
				},
				saveImage: {
					name: language.global.contextMenu.saveImage,
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.contextMenu.saveImage();
						return true;
					},
				},
				saveAllImages: {
					name: language.global.contextMenu.saveAllImages,
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.contextMenu.saveAllImages();
						return true;
					},
				},
				copyImage: {
					name: language.global.contextMenu.copyImage,
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.contextMenu.copyImageToClipboard();
						return true;
					},
				},
				saveBookmarksImages: {
					name: language.global.contextMenu.saveBookmarksImages,
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.contextMenu.saveBookmarksImages(true);
						return true;
					},
				},
				saveAllBookmarksImages: {
					name: language.global.contextMenu.saveAllBookmarksImages,
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						reading.contextMenu.saveAllBookmarksImages(true);
						return true;
					},
				},

				leftClick: {
					name: '',
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						return clickTapZone(event, 'leftClick');
					},
				},
				rightClick: {
					name: '',
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						if(event.button == 2 && event.type != 'contextmenu') return false;
						return clickTapZone(event, 'rightClick');
					},
				},
				middleClick: {
					name: '',
					function: function(event){
						if(inputIsFocused() || !reading.isLoaded()) return false;
						return clickTapZone(event, 'middleClick');
					},
				},
			},
			shortcuts: {},
			_shortcuts: {
				'Left': 'prev',
				'A': 'prev',
				'Mouse4': 'prev',
				'Right': 'next',
				'D': 'next',
				'Space': 'next',
				'Mouse3': 'next',
				'Up': 'start',
				//'W': 'start',
				'Home': 'start',
				'Down': 'end',
				//'S': 'end',
				'End': 'end',
				'Ctrl+Up': 'prevComic',
				'Ctrl+Left': 'prevComic',
				'Ctrl+Down': 'nextComic',
				'Ctrl+Right': 'nextComic',
				'M': 'magnifyingGlass',
				'B': 'hideBarHeader',
				'H': 'hideBarHeader',
				'L': 'hideContentLeft',
				'P': 'hideContentLeft',
				'B': 'createAndDeleteBookmark',
				'C': 'contextMenu',
				'Ctrl+P': 'pageLayout',
				'Ctrl+0': 'pageLayout',
				'Ctrl+1': 'slide',
				'Ctrl+2': 'scroll',
				'Ctrl+3': 'roughPageTurn',
				'Ctrl+4': 'smoothPageTurn',
				'Ctrl+5': 'fade',
				'Ctrl+M': 'readingManga',
				'Ctrl+W': 'readingWebtoon',
				'Ctrl+D': 'doublePage',
				'Ctrl+H': 'doNotApplyToHorizontals',
				'Ctrl+B': 'blankPage',
				'Ctrl+A': 'adjustToWidth',
				'Ctrl+L': 'notEnlargeMoreThanOriginalSize',
				'Ctrl+R': 'rotateHorizontals',
				'Shift+E': 'ebookLayout',
				'Shift+2': 'increaseFontSize',
				'Shift+.': 'increaseFontSize',
				'Shift+1': 'decreaseFontSize',
				'Shift+,': 'decreaseFontSize',
				'Q': 'zoomIn',
				'E': 'zoomOut',
				'W': 'zoomUp',
				'S': 'zoomDown',
				'Shift+A': 'zoomLeft',
				'Shift+D': 'zoomRight',
				'Z': 'resetZoom',
				'Esc': 'goBack',
				'Backspace': 'goBack',
				'Ctrl+S': 'saveImage',
				'Ctrl+C': 'copyImage',
				'F11': 'fullscreen',
				'G': 'gamepadMenu',
			},
			_shortcutsForce: {
				'LeftClick': 'leftClick',
				'RightClick': 'rightClick',
				'MiddleClick': 'middleClick',
			},
			tapZones: {},
			_tapZones: {
				top: {
					left: {
						leftClick: 'prev',
						rightClick: 'next',
						middleClick: 'resetZoom',
					},
					center: {
						leftClick: 'resetZoom',
						rightClick: 'contextMenu',
						middleClick: 'resetZoom',
					},
					right: {
						leftClick: 'next',
						rightClick: 'prev',
						middleClick: 'resetZoom',
					},
				},
				center: {
					left: {
						leftClick: 'prev',
						rightClick: 'next',
						middleClick: 'resetZoom',
					},
					center: {
						leftClick: 'resetZoom',
						rightClick: 'contextMenu',
						middleClick: 'resetZoom',
					},
					right: {
						leftClick: 'next',
						rightClick: 'prev',
						middleClick: 'resetZoom',
					},
				},
				bottom: {
					left: {
						leftClick: 'prev',
						rightClick: 'next',
						middleClick: 'resetZoom',
					},
					center: {
						leftClick: 'resetZoom',
						rightClick: 'contextMenu',
						middleClick: 'resetZoom',
					},
					right: {
						leftClick: 'next',
						rightClick: 'prev',
						middleClick: 'resetZoom',
					},
				},
			},
			gamepad: {},
			_gamepad: {
				'A': 'createAndDeleteBookmark',
				'B': 'goBack',
				'X': 'hideContentLeft',
				'Y': 'hideBarHeader',
				'LB': 'prev',
				'RB': 'next',
				'LT': 'zoomOut',
				'RT': 'zoomIn',
				'View': 'magnifyingGlass',
				'Menu': 'gamepadMenu',
				'L': 'resetZoom',
				'R': 'fullscreen',
				'Up': 'start',
				'Down': 'end',
				'Left': 'prev',
				'Right': 'next',
				'Xbox': 'gamepadMenu',
			},
		},
	}

	// Load here from saved
	let _shortcuts = storage.get('shortcuts');

	for(let section in shortcuts)
	{
		// Shortcuts
		for(let shortcut in _shortcuts[section]?.shortcuts)
		{
			shortcuts[section].shortcuts[shortcut] = _shortcuts[section].shortcuts[shortcut];
		}

		// Set not configured shortcuts
		for(let shortcut in shortcuts[section]._shortcuts)
		{
			let action = shortcuts[section]._shortcuts[shortcut];

			if(!inArray(action, _shortcuts[section]?.actionsConfigured || []) && !_shortcuts[section]?.shortcuts[shortcut])
				shortcuts[section].shortcuts[shortcut] = action;
		}

		// Set force shortcuts
		for(let shortcut in shortcuts[section]._shortcutsForce)
		{
			let action = shortcuts[section]._shortcutsForce[shortcut];
			shortcuts[section].shortcuts[shortcut] = action;
		}

		// Tap zones
		for(let shortcut in _shortcuts[section]?.tapZones)
		{
			shortcuts[section].tapZones[shortcut] = _shortcuts[section].tapZones[shortcut];
		}

		// Set not configured tap zones
		for(let shortcut in shortcuts[section]._tapZones)
		{
			let action = shortcuts[section]._tapZones[shortcut];

			if(!_shortcuts[section]?.tapZones || !_shortcuts[section]?.tapZones[shortcut])
				shortcuts[section].tapZones[shortcut] = action;
		}

		// Gamepad
		for(let button in _shortcuts[section]?.gamepad)
		{
			shortcuts[section].gamepad[button] = _shortcuts[section].gamepad[button];
		}

		// Set not configured gamepad
		for(let button in shortcuts[section]._gamepad)
		{
			let action = shortcuts[section]._gamepad[button];

			if(!inArray(action, _shortcuts[section]?.actionsConfigured || []) && !_shortcuts[section]?.gamepad[button])
				shortcuts[section].gamepad[button] = action;
		}
	}
}

var currentlyRegistered = false;

async function register(section = 'reading', force = false)
{
	if(currentlyRegistered === reading && !force)
		return;

	await loadShoSho();
	loadShoShoObject();
	loadShortcuts();

	shosho.reset();
	shoshoMouse.reset();

	for(let shortcut in shortcuts[section].shortcuts)
	{
		let actionKey = shortcuts[section].shortcuts[shortcut];
		let action = shortcuts[section].actions[actionKey];

		if(isMouseShortcut(shortcut))
			shoshoMouse.register(shortcut, action.function);
		else
			shosho.register(shortcut, action.function);
	}

	shosho.start();
	shoshoMouse.start();

	// Gamepad
	gamepad.reset('shortcuts');

	for(let button in shortcuts[section].gamepad)
	{
		let actionKey = shortcuts[section].gamepad[button];
		let action = shortcuts[section].actions[actionKey];

		gamepad.setButtonEvent('shortcuts', gamepad.buttonKey(button), action.function);
	}

	currentlyRegistered = section;
}

function unregister(force = false)
{
	if(!force || currentlyRegistered !== false)
	{
		shosho.reset();
		shoshoMouse.reset();
		gamepad.reset('shortcuts');
		currentlyRegistered = false;
	}
}

var mouse = [
	'LeftClick',
	'RightClick',
	'ClickLeft',
	'MouseLeft',
	'ClickMiddle',
	'MouseMiddle',
	'ClickRight',
	'MouseRight',
];

var mouseRegexp = new RegExp(mouse.join('|'), 'iu');

function isMouseShortcut(shortcut)
{
	return mouseRegexp.test(shortcut);
}

var modifiers = [
	'Ctrl',
	'Meta',
	'§',
	'OS',
	'Alt',
	'Shift',
];

var modifiersRegexp = new RegExp('(?:'+modifiers.join('|')+')$', 'iu');

var dispose = false;

function record(callback)
{
	if(dispose) return;

	dispose = shosho.record(function(shortcut){

		shortcut = ShoSho.format(shortcut, 'short-inflexible-nondirectional');

		if(!modifiersRegexp.test(shortcut))
		{
			callback(shortcut);
			dispose();
			setTimeout(function(){dispose = false;}, 100);
		}

	});
}

function stopRecord()
{
	if(dispose)
	{
		dispose();
		dispose = false;
	}
}

function change(section, action, current, shortcut)
{
	let saved = storage.getKey('shortcuts', section) || {};

	saved.gamepad = shortcuts[section].gamepad;

	saved.actionsConfigured = [];

	for(let key in shortcuts[section].actionsOrder)
	{
		saved.actionsConfigured.push(shortcuts[section].actionsOrder[key]);
	}

	saved.shortcuts = {};

	for(let key in shortcuts[section].shortcuts)
	{
		if(key === current && shortcut)
			saved.shortcuts[shortcut] = action;
		else if(key !== shortcut && key !== current)
			saved.shortcuts[key] = shortcuts[section].shortcuts[key];
	}

	if(!current && shortcut)
		saved.shortcuts[shortcut] = action;

	storage.setVar('shortcuts', section, saved);
}

function changeGamepad(section, action, current, button)
{
	let saved = storage.getKey('shortcuts', section) || {};

	saved.shortcuts = shortcuts[section].shortcuts;

	saved.actionsConfigured = [];

	for(let key in shortcuts[section].actionsOrder)
	{
		saved.actionsConfigured.push(shortcuts[section].actionsOrder[key]);
	}

	saved.gamepad = {};

	for(let key in shortcuts[section].gamepad)
	{
		if(key === current && button)
			saved.gamepad[button] = action;
		else if(key !== button && key !== current)
			saved.gamepad[key] = shortcuts[section].gamepad[key];
	}

	if(!current && button)
		saved.gamepad[button] = action;

	storage.setVar('shortcuts', section, saved);
}

function changeTapZone(section, vertical, horizontal, button, action)
{
	const saved = storage.getKey('shortcuts', section) || {};

	saved.tapZones = shortcuts[section].tapZones;
	saved.tapZones[vertical][horizontal][button] = action;

	storage.setVar('shortcuts', section, saved);
}

function restoreDefaults()
{
	const saved = storage.get('shortcuts');

	saved.browse.actionsConfigured = [];
	saved.browse.shortcuts = {};
	saved.browse.gamepad = {};

	saved.opds.actionsConfigured = [];
	saved.opds.shortcuts = {};
	saved.opds.gamepad = {};

	saved.reading.actionsConfigured = [];
	saved.reading.shortcuts = {};
	saved.reading.gamepad = {};

	storage.set('shortcuts', saved);
}

function restoreDefaultsTapZones()
{
	const saved = storage.get('shortcuts');

	saved.browse.tapZones = {};
	saved.opds.tapZones = {};
	saved.reading.tapZones = {};

	storage.set('shortcuts', saved);
}

var _currentlyRegistered = false, pauseST = false;

function play()
{
	clearTimeout(pauseST);

	if(_currentlyRegistered)
	{
		register(_currentlyRegistered);
		currentlyRegistered = _currentlyRegistered;
	}
	
	_currentlyRegistered = false;
}

function pause()
{
	clearTimeout(pauseST);

	_currentlyRegistered = currentlyRegistered;

	pauseST = setTimeout(function(){

		unregister(true);

	}, 50);
}

module.exports = {
	register: register,
	unregister: unregister,
	shortcuts: function(){loadShortcuts(); return shortcuts;},
	record: record,
	stopRecord: stopRecord,
	change: change,
	changeGamepad: changeGamepad,
	changeTapZone: changeTapZone,
	restoreDefaults: restoreDefaults,
	restoreDefaultsTapZones: restoreDefaultsTapZones,
	play: play,
	pause: pause,
	inputIsFocused: inputIsFocused,
};