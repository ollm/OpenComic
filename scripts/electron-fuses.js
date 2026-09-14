const {FuseVersion, FuseV1Options} = require('@electron/fuses');

exports.default = async function(context)
{
	await context.packager.addElectronFuses(context, {
		version: FuseVersion.V1,
		[FuseV1Options.RunAsNode]: context.electronPlatformName === 'linux',
	});
};