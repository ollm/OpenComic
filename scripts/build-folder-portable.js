const fs = require('fs'),
	p = require('path');

fs.writeFileSync(p.join(__dirname, '../scripts/folder-portable.js'), `module.exports = {
	check: function(){return true},
};`);