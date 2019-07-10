const fs = require('fs'),
	yaml = require('node-yaml');

var snapcraft = yaml.readSync('../dist/__snap-x64/snap/snapcraft.yaml');

snapcraft.parts.unrar = {
	'plugin': 'make',
    'source': 'https://launchpad.net/ubuntu/+archive/primary/+sourcefiles/unrar-nonfree/1:5.5.8-1/unrar-nonfree_5.5.8.orig.tar.gz',
    'build-packages': ['g++'],
};

yaml.writeSync('../dist/__snap-x64/snap/snapcraft.yaml', snapcraft)
