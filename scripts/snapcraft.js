const fs = require('fs'),
	p = require('path'),
	yaml = require('node-yaml');

var yamlDir = p.join(__dirname, '../dist/__snap-amd64/snap/snapcraft.yaml');

if(fs.existsSync(yamlDir))
{
	var snapcraft = yaml.readSync(yamlDir);

	snapcraft.parts.unrar = {
		'plugin': 'make',
		'source': 'https://launchpad.net/ubuntu/+archive/primary/+sourcefiles/unrar-nonfree/1:5.5.8-1/unrar-nonfree_5.5.8.orig.tar.gz',
		'build-packages': ['g++'],
	};

	yaml.writeSync(yamlDir, snapcraft);
}
else
{
	console.log('__snap-amd64 not found');
}

var yamlDir = p.join(__dirname, '../dist/__snap-arm64/snap/snapcraft.yaml');

if(fs.existsSync(yamlDir))
{
	var snapcraftArm = yaml.readSync(yamlDir);

	snapcraftArm.parts.unrar = {
		'plugin': 'make',
		'source': 'https://launchpad.net/ubuntu/+archive/primary/+sourcefiles/unrar-nonfree/1:5.5.8-1/unrar-nonfree_5.5.8.orig.tar.gz',
		'build-packages': ['g++'],
	};

	yaml.writeSync(yamlDir, snapcraftArm);
}
else
{
	console.log('__snap-arm64 not found');
}