var _dom = function(_this, string = false, querySelectorAll = false) { 

	this._this = _this;

	if(string)
	{
		if(querySelectorAll)
		{
			this._this = document.querySelectorAll(this._this);
		}
		else
		{
			let __this = document.querySelector(this._this);

			if(__this)
				this._this = [__this];
			else
				this._this = [];
		}
	}
	else
	{
		if(!this._this)
			this._this = [];
		else if(this._this.length === undefined)
			this._this = [this._this];
	}

	this.each = function(callback){

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			callback.call(this._this[i]);
		}

		return this;
	}

	this.remove = function() {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].remove();
		}

		delete this._this;
		delete this;
	}

	this.find = function(query, all = false) {

		let newThis = [];

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			if(all)
			{
				newThis = [...newThis, ...this._this[i].querySelectorAll(query)];
			}
			else
			{
				let _this = this._this[i].querySelector(query);

				if(_this)
					newThis.push(_this);
			}
		}

		this._this = newThis;

		return this;
	}

	this.getParents = function(element) {

		let result = [];

		for(let parent = element && element.parentElement; parent; parent = parent.parentElement)
		{
			result.push(parent);
		}

		return result;
	}

	this.parents = function(query, all = false)
	{
		let newThis = [];

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			let parents = this.getParents(this._this[i]);

			for(let i2 = 0, len2 = parents.length; i2 < len2; i2++)
			{
				if(parents[i2].matches(query))
				{
					newThis.push(parents[i2]);
				
					if(!all)
						break;
				}
			}
		}

		this._this = newThis;

		return this;
	}

	this.siblings = function(query = false, all = false) {

		let newThis = [];

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			let parentChildren = this._this[i].parentElement.children;

			for(let i2 = 0, len2 = parentChildren.length; i2 < len2; i2++)
			{
				if((query === false || parentChildren[i2].matches(query)) && parentChildren[i2] !== this._this[i])
				{
					newThis.push(parentChildren[i2]);

					if(!all)
						break;
				}
			}
		}

		this._this = newThis;

		return this;

	}

	this.addClass = function() {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].classList.add(...arguments);
		}

		return this;
	}

	this.removeClass = function() {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].classList.remove(...arguments);
		}

		return this;
	}

	this.class = function(active) {

		let _arguments = Array.from(arguments);
		_arguments.shift();

		if(active)
			this.addClass(..._arguments);
		else
			this.removeClass(..._arguments);
	}

	this.setAttribute = function(name, value) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].setAttribute(name, value);
		}

		return this;
	}

	this.getAttribute = function(attribute) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			let value = this._this[i].getAttribute(attribute);
			if(value) return value;
		}

		return '';
	}

	this.scrollTop = function(scrollTop = false) {

		if(scrollTop !== false)
		{
			for(let i = 0, len = this._this.length; i < len; i++)
			{
				this._this[i].scrollTop = scrollTop;
			}

			return this;
		}
		else
		{
			if(this._this.length > 0)
				return this._this[0].scrollTop;

			return 0;
		}

	}

	this.css = function(css) {

		for(let key in css)
		{
			let value = css[key];

			for(let i = 0, len = this._this.length; i < len; i++)
			{
				this._this[i].style[key] = value;
			}
		}

		return this;
	}

	this.html = function(html) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].innerHTML = html;
		}

		return this;
	}

	this.append = function(html) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].insertAdjacentHTML('beforeend', html);
		}

		return this;
	}

	this.text = function(html) {

		for(let i = 0, len = this._this.length; i < len; i++)
		{
			this._this[i].innerHTML = playmax.text(html);
		}

		return this;
	}

	this.get = function(index) {

		return this._this[index];

	}

	this.this = function() {

		return this._this;

	}

	this.delete = function() {

		delete this._this;
		delete this;

	}

	this.destroy = function() {

		delete this._this;
		delete this;

	}
}

module.exports = {
	this: function(_this, string = false, querySelectorAll = false) {
		return new _dom(_this, string, querySelectorAll);
	},
	query: function(_this) {
		return new _dom(_this, true, false);
	},
	queryAll: function(_this) {
		return new _dom(_this, true, true);
	},
};