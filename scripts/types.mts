
type Page = boolean | 'languages' | 'theme' | 'settings';

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
	indexLabel: IndexLabel | {};
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