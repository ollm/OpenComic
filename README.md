<div align="center" >
	<img src="https://raw.githubusercontent.com/ollm/OpenComic/master/images/icon-border-transparent.png" width="128px" height="128px"/>
</div>

<h1 align="center">
	OpenComic
</h1>

<h3 align="center">
	Comic and Manga reader
</h3>

<div align="center">

[Screenshots](https://github.com/ollm/OpenComic/blob/master/SCREENSHOTS.MD) | [Features](#features) | [Changelog](https://github.com/ollm/OpenComic/blob/master/CHANGELOG.md) | [Download](#download-v120)

</div>

## Screenshot

![Screenshot](https://raw.githubusercontent.com/ollm/OpenComic/master/images/screenshots/main.png "Screenshot")

More [Screenshots 📸](https://github.com/ollm/OpenComic/blob/master/SCREENSHOTS.MD)

## Features

- 🖼 Support this image formats: `JPG`, `PNG`, `APNG`, `AVIF`, `WEBP`, `GIF`, `SVG`, `BMP`, `ICO`
- 🗄 Support this compressed formats: `RAR`, `ZIP`, `7Z`, `TAR`, `CBR`, `CBZ`, `CB7`, `CBT`
- 📄 Support this documents/ebook formats: `PDF`, `EPUB` (Alpha)
- 🎵 Support background music from folder: `MP3`, `M4A`, `WEBM`, `WEBA`, `OGG`, `OPUS`, `WAV`, `FLAC`
- 📁 Master folders support
- ☁️ Server connection support: `smb://`, `ftp://`, `ftps://`, `scp://`, `sftp://`, `ssh://`, `s3://`, `webdav://`, `webdavs://`
- 🇯🇵 Manga read mode
- 🇰🇷 Webtoon read mode
- 📖 Double page view
- 🔖 Bookmarks and continue reading
- 🔍 Floating magnifying glass
- 🖱 Reading in scroll or slide
- ⚪ Adjust the brightness, saturation, contrast, sepia, negative and invert colors
- 🎨 Colorize black and white images
- 🔄 Tracking with sites (AniList)
- 🎮 Gamepad navigation
- 🔢 Multiple interpolation methods: `lanczos3`, `lanczos2`, `mitchell`, `cubic`, `nearest` and others

You can see the changes between versions in the [Changelog 📝](https://github.com/ollm/OpenComic/blob/master/CHANGELOG.md)

## Download [`v1.2.0`](https://github.com/ollm/OpenComic/releases)

###### Stores
<a href="https://apps.microsoft.com/detail/9PDCMVNFZ2KK"><img height="50" alt="Get it from Microsoft" title="Get it from Microsoft" src="https://raw.githubusercontent.com/ollm/OpenComic/master/images/store/microsoft-store.svg" /></a>
&nbsp;&nbsp;&nbsp;<a href="https://apps.apple.com/app/opencomic/id6464329463"><img height="50" alt="Download on the Mac App Store" title="Download on the Mac App Store" src="https://raw.githubusercontent.com/ollm/OpenComic/master/images/store/mac-app-store.svg" /></a>
&nbsp;&nbsp;&nbsp;<a href="https://snapcraft.io/opencomic"><img height="50" alt="Get it from the Snap Store" title="Get it from the Snap Store" src="https://raw.githubusercontent.com/ollm/OpenComic/master/images/store/snap-store.svg" /></a>
###### Windows
- [.exe](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic.Setup.1.2.0.exe)
- [portable.exe](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic.Portable.1.2.0.exe)
###### macOS
- [.dmg](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0.dmg)
- [.pkg](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0.pkg)
- [.7z](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0-mac.7z)
###### macOS Arm64
- [arm64.dmg](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0-arm64.dmg)
- [arm64.pkg](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0-arm64.pkg)
- [arm64.7z](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0-arm64-mac.7z)
###### Linux
- [.deb](https://github.com/ollm/OpenComic/releases/download/v1.2.0/opencomic_1.2.0_amd64.deb)
- [.rpm](https://github.com/ollm/OpenComic/releases/download/v1.2.0/opencomic-1.2.0.x86_64.rpm)
- [.7z](https://github.com/ollm/OpenComic/releases/download/v1.2.0/opencomic-1.2.0.7z)
- [.snap](https://github.com/ollm/OpenComic/releases/download/v1.2.0/opencomic_1.2.0_amd64.snap)
- [.flatpak](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0-x86_64.flatpak)
- [.AppImage](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0.AppImage)
- [AUR](https://aur.archlinux.org/packages/opencomic-bin/) by [@z00rat](https://github.com/z00rat)
###### Linux Arm64
- [arm64.deb](https://github.com/ollm/OpenComic/releases/download/v1.2.0/opencomic_1.2.0_arm64.deb)
- [arm64.rpm](https://github.com/ollm/OpenComic/releases/download/v1.2.0/opencomic-1.2.0.aarch64.rpm)
- [arm64.7z](https://github.com/ollm/OpenComic/releases/download/v1.2.0/opencomic-1.2.0-arm64.7z)
- [arm64.flatpak](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0-aarch64.flatpak)
- [arm64.AppImage](https://github.com/ollm/OpenComic/releases/download/v1.2.0/OpenComic-1.2.0-arm64.AppImage)

## Installation and Starting for development
__Requirements__: Git, Node and NPM

```shell
git clone https://github.com/ollm/OpenComic.git
cd OpenComic
npm install
npm run rebuild
npm start
```

## Build from source

```shell
npm pull origin master
npm install
npm run build-<buildType>
```

Available builds types:

- Windows: `nsis` , `portable`
- macOS: `mac-dmg`, `mac-pkg` (Both include `arm`)
- Linux `deb`, `rpm`, `snap`, `flatpak`, `appimage`, `7z`
- Linux Arm: `deb-arm`, `rpm-arm`, `snap-arm`, `flatpak-arm`, `appimage-arm`, `7z-arm`

Now the build files are located in `dist` folder.

## Translation

If you want to see OpenComic in your language, please help us to [Translate](https://github.com/ollm/OpenComic/blob/master/TRANSLATE.md).

<a href="https://github.com/ollm/OpenComic/blob/master/TRANSLATE.md">
	<img src="https://raw.githubusercontent.com/ollm/OpenComic/master/images/translated.svg" />
</a>

## Contributors

<a href="https://github.com/ollm/OpenComic/graphs/contributors">
	<img src="https://opencollective.com/opencomic/contributors.svg?width=830&button=false&avatarHeight=42" />
</a>

<!--

## Backers

<a href="https://opencollective.com/opencomic#support">
	<img src="https://opencollective.com/opencomic/tiers/backers.svg?width=830"></a>
</a>

## Sponsors

<a href="https://opencollective.com/opencomic#support">
	<img src="https://opencollective.com/opencomic/tiers/sponsors.svg?width=830"></a>
</a>

## Mega Sponsors

<a href="https://opencollective.com/opencomic#support">
	<img src="https://opencollective.com/opencomic/tiers/sponsor.svg?width=830"></a>
</a>

-->

<!-- ## GitHub Sponsors -->

<!-- sponsors --><!-- sponsors -->

## Pepper & Carrot

This application contains as example the webcomic [Pepper&Carrot](https://www.peppercarrot.com) by David Revoy
licensed under the [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

Based on the universe of Hereva created by David Revoy with contributions by Craig Maloney.
Corrections by Willem Sonke, Moini, Hali, CGand and Alex Gryson.
Translated into Spanish by TheFaico.