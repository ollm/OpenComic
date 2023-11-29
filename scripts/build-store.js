const fs = require('fs'),
	p = require('path');

fs.writeFileSync(p.join(__dirname, '../scripts/installed-from-store.js'), `module.exports = {
	check: function(){return true},
};`);