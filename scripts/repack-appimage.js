const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const packageJson = require('../package.json');

const architecture = process.argv[2] || 'x64';
const architectureSettings = {
	x64: {
		appImageSuffix: '',
		appImageArchitecture: 'x86_64'
	},
	arm64: {
		appImageSuffix: '-arm64',
		appImageArchitecture: 'aarch64'
	}
}[architecture];

if(!architectureSettings)
{
	console.error('Usage: npm run repack-appimage -- <x64|arm64>');
	process.exit(1);
}

const appImageName = `OpenComic-${packageJson.version}${architectureSettings.appImageSuffix}.AppImage`;
const appImagePath = path.resolve('dist', appImageName);
const updateInformation = `zsync|https://github.com/ollm/OpenComic/releases/download/v${packageJson.version}/${appImageName}.zsync`;
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'opencomic-appimage-'));

try
{
	if(!fs.existsSync(appImagePath))
	{
		throw new Error(`AppImage not found: ${appImagePath}`);
	}

	childProcess.execFileSync(appImagePath, ['--appimage-extract'], {
		cwd: temporaryDirectory,
		stdio: 'inherit'
	});

	const appDir = path.join(temporaryDirectory, 'squashfs-root');
	const temporaryAppImagePath = path.join(temporaryDirectory, appImageName);
	const appimagetool = process.env.APPIMAGETOOL || 'appimagetool';

	childProcess.execFileSync(appimagetool, ['-u', updateInformation, appDir, temporaryAppImagePath], {
		cwd: temporaryDirectory,
		env: {
			...process.env,
			ARCH: architectureSettings.appImageArchitecture,
			APPIMAGE_EXTRACT_AND_RUN: '1'
		},
		stdio: 'inherit'
	});

	const temporaryZsyncPath = `${temporaryAppImagePath}.zsync`;
	if(!fs.existsSync(temporaryZsyncPath))
	{
		throw new Error('No .zsync file was generated; make sure zsyncmake is installed and available on PATH.');
	}

	fs.renameSync(temporaryAppImagePath, appImagePath);
	fs.renameSync(temporaryZsyncPath, `${appImagePath}.zsync`);
}
catch(error)
{
	console.error(`AppImage repack failed: ${error.message}`);
	process.exitCode = 1;
}
finally
{
	fs.rmSync(temporaryDirectory, {recursive: true, force: true});
}