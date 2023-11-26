## Download beta [`v1.0.0-beta.5`](https://github.com/ollm/OpenComic/releases/tag/v1.0.0-beta.5)

###### Windows
- [.exe](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic.Setup.1.0.0-beta.5.exe)
- [portable.exe](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic.Portable.1.0.0-beta.5.exe)
###### macOS
- [.dmg](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5.dmg)
- [.pkg](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5.pkg)
- [.7z](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5-mac.7z)
###### macOS Arm64
- [arm64.dmg](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5-arm64.dmg)
- [arm64.pkg](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5-arm64.pkg)
- [arm64.7z](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5-arm64-mac.7z)
###### Linux
- [.deb](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/opencomic_1.0.0-beta.5_amd64.deb)
- [.rpm](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/opencomic-1.0.0-beta.5.x86_64.rpm)
- [.7z](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/opencomic-1.0.0-beta.5.7z)
- [.snap](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/opencomic_1.0.0-beta.5_amd64.snap)
- [.flatpak](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5-x86_64.flatpak)
- [.AppImage](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5.AppImage)
- [AUR](https://aur.archlinux.org/packages/opencomic-bin/)
- `snap install opencomic`
###### Linux Arm64
- [arm64.deb](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/opencomic_1.0.0-beta.5_arm64.deb)
- [arm64.rpm](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/opencomic-1.0.0-beta.5.aarch64.rpm)
- [arm64.7z](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/opencomic-1.0.0-beta.5-arm64.7z)
- [arm64.flatpak](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5-aarch64.flatpak)
- [arm64.AppImage](https://github.com/ollm/OpenComic/releases/download/v1.0.0-beta.5/OpenComic-1.0.0-beta.5-arm64.AppImage)

## Download [`v0.2.1`](https://github.com/ollm/OpenComic/releases/tag/v0.2.1)

###### All packages
- [v0.2.1](https://github.com/ollm/OpenComic/releases/tag/v0.2.1)

## Screenshot

![Screenshot](https://raw.githubusercontent.com/ollm/OpenComic/master/images/screenshots/main.png "Screenshot")

Here you can see more [Screenshots 📸](https://github.com/ollm/OpenComic/blob/master/SCREENSHOTS.MD)

## Features

- 🖼 Support this image formats: `JPG`, `PNG`, `APNG`, `AVIF`, `WEBP`, `GIF`, `SVG`, `BMP`, `ICO`
- 🗄 Support this compressed formats: `RAR`, `ZIP`, `7Z`, `TAR`, `CBR`, `CBZ`, `CB7`, `CBT`
- 📄 Support this documents/ebook formats: `PDF`, `EPUB` (Alpha)
- 📁 Master folders support
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

You can see the changes between versions in the [Changelog 📝](https://github.com/ollm/OpenComic/blob/master/CHANGELOG.md)

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

## Pepper & Carrot

This application contains as example the webcomic [Pepper&Carrot](https://www.peppercarrot.com) by David Revoy
licensed under the [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

Based on the universe of Hereva created by David Revoy with contributions by Craig Maloney.
Corrections by Willem Sonke, Moini, Hali, CGand and Alex Gryson.
Translated into Spanish by TheFaico

## GitHub Sponsors

<!-- sponsors --><!-- sponsors -->