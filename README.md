# GBA Studio

[![Build](https://github.com/dackmin/gba-studio/actions/workflows/build.yml/badge.svg)](https://github.com/dackmin/gba-studio/actions/workflows/build.yml)

Just like [GB Studio](https://gbstudio.dev), but worse and for the GBA.

<img width="1728" height="1019" alt="Capture d’écran 2025-12-01 à 08 39 10" src="https://github.com/user-attachments/assets/fed8afe8-ce6a-4f28-b909-a8923677bfea" style="border-radius:16px;" />

GBA Studio is an Electron game creator built on top of the [Butano](https://github.com/GValiente/butano) GBA C++ game engine.

## Installation

GBA Studio still requires you to have [Python 3+](https://www.python.org/downloads/) and [devkitARM](https://devkitpro.org/wiki/Getting_Started/devkitARM) installed on your system.

Download the latest build for your platform from the [build action pipeline](https://github.com/dackmin/gba-studio/actions/workflows/build.yml).

> Note: macOS builds are signed & notarized. Windows builds are unsigned.


## Road to v1.0

- [x] File changes detection outside of GBA Studio
- [x] Copy/paste events
- [x] Use variables for any value
- [x] Rename events
- [x] Foreground sprites
- [x] WASM mGBA integration
- [x] ~~Windows signed installer~~ (I'm too poor for this, enjoy the unsigned version)
- [ ] Move target point from the target scene
- [ ] Side scroller scene type
- [ ] Parallax backgrounds
- [ ] images auto convert on build
- [ ] Portable python & devkitARM
- [ ] Auto updater
- [ ] Sprite animations editor
- [ ] Sound editor
- [ ] Plugins

## Development

Install dependencies:

```bash
yarn install
```

Run:

```bash
yarn dev
```

## Contributing

[![](https://contrib.rocks/image?repo=dackmin/gba-studio)](https://github.com/dackmin/gba-studio/graphs/contributors)

Please check the [CONTRIBUTING.md](https://github.com/dackmin/gba-studio/blob/main/CONTRIBUTING.md) doc for contribution guidelines.

## License

This software is licensed under [MIT](https://github.com/p3ol/oak/blob/master/LICENSE).

### Credits

* GBA Studio is heavily inspired by (if not a pale copy of) [GB Studio](https://gbstudio.dev) by [Chris Maltby](https://github.com/chrismaltby).
* C++ Code is built using the extraordinary [Butano](https://github.com/GValiente/butano) engine.
* Example assets displayed in the screenshot:
  - [Retro RPG Characters](https://the-pixel-nook.itch.io/retro-rpg-character-pack) from [The Pixel Nook](https://the-pixel-nook.itch.io/)
  - [Pocket Valley Essentials](https://widseylabs.itch.io/pocket-valley-essentials) from [Widsey Labs](https://widseylabs.itch.io/)
  - [Pocket Valley Interiors](https://widseylabs.itch.io/pocket-valley-interiors) from [Widsey Labs](https://widseylabs.itch.io/)
