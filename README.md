# GBA Studio

[![Build](https://github.com/dackmin/gba-studio/actions/workflows/build.yml/badge.svg)](https://github.com/dackmin/gba-studio/actions/workflows/build.yml)

Just like [GB Studio](https://gbstudio.dev), but worse and for the GBA.

<img width="1728" height="1019" alt="Capture d’écran 2025-12-01 à 08 39 10" src="https://github.com/user-attachments/assets/fed8afe8-ce6a-4f28-b909-a8923677bfea" style="border-radius:10px;" />

GBA Studio is an Electron game creator built on top of the [Butano](https://github.com/GValiente/butano) GBA C++ game engine.

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

Example assets displayed in the screenshot:
- [Retro RPG Characters](https://the-pixel-nook.itch.io/retro-rpg-character-pack) from [The Pixel Nook](https://the-pixel-nook.itch.io/)
