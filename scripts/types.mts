type Page = boolean | 'languages' | 'theme' | 'settings';

export type ReadingView = 'slide' | 'scroll' | 'panels' | 'rough-page-turn' | 'smooth-page-turn';
export type PanelsType = 'focus' | 'hide' | 'immersive';

export interface PanelsConfig {
	model: string;
	type: PanelsType;
	maxZoom: {
		active: boolean;
		value: number;
	};
	margin: 100;
	focus: {
		prevPanels: number; // Keep focus on the previous panel
		nextPanels: number;
	};
	showFullPage: {
		beforeFirstPanel: boolean;
		afterLastPanel: boolean;
	};
	// Only in hide mode and immersive mode
	hideEffect: 'blur' | 'black' | 'white';
	expandPanel: number;
	// Only in hide mode
	visibility: {
		prevPanels: number; // -1 = all
		nextPanels: number;
	};
};

export interface Filter {
	onlyRoot?: boolean;
	favorites?: boolean;
	requireAllLabels?: boolean;
	labels?: string[];
	withoutLabels?: string[];
	hasLabels?: string[];
}

export interface IndexLabel {
	name: string;
	index?: number;
	label?: string;
	server?: string;
	favorites?: boolean;
	opds?: boolean;
	filter?: Filter;
	has: boolean;
}

export interface HistoryItem {
	file: string | boolean;
	indexLabel: IndexLabel | object;
	isComic: boolean;
	mainPath: string | boolean;
	path: string | boolean;
	recentlyOpened?: string | boolean;
	root?: boolean;
	page?: Page;
}

export interface History {
	current: HistoryItem;
	forwardHistory: HistoryItem[];
	history: HistoryItem[];
	root: HistoryItem;
}

export interface File {
	name: string;
	path: string;
	mainPath: string;
	folder: boolean;
	sha: string;
}

export interface Image extends File {
	canvas: boolean;
	ebook: boolean;
	image: string;
	size?: {
		width: number;
		height: number;
	};
}

export interface OptimalThreads {
	readKey: string;
	extractKey: string;
	read: number;
	extract: number;
}

export type PointA = [number, number];

export interface Point {
	x: number;
	y: number;
}
