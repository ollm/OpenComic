interface Variable {
	name: string;
	value: number;
}

const variables: Record<string, Variable> = {
	titleBarHeight: {
		name: '--const-title-bar-height',
		value: 30,
	},
	tabsBarHeight: {
		name: '--const-tabs-bar-height',
		value: 41,
	},
	headerBarHeight: {
		name: '--const-header-bar-height',
		value: 48,
	},
	sideBarWidth: {
		name: '--const-side-bar-width',
		value: 192,
	},
};

function get()
{
	const computed = getComputedStyle(document.documentElement);

	for(const key in variables)
	{
		variables[key].value = parseFloat(computed.getPropertyValue(variables[key].name)) || 0;
	}
}

export default {
	get,
	get titleBarHeight() {return variables.titleBarHeight.value},
	get tabsBarHeight() {return variables.tabsBarHeight.value},
	get headerBarHeight() {return variables.headerBarHeight.value},
	get sideBarWidth() {return variables.sideBarWidth.value},
};
