# Third-party assets

The application uses the original WebAudioFont playback engine and instrument presets locally so an installed PWA does not depend on a live CDN.

Retrieved on 2026-11-11 without modification:

- WebAudioFont Engine v3.0.04: https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js
- Project and source: https://github.com/surikov/webaudiofont ; TypeScript files from `npm/src/` are included under `third_party/webaudiofont/npm/src/` in the paired source archive.
- Player license: GNU GPL v3, included as `vendor/WebAudioFont-LICENSE.txt`.
- Piano preset: https://surikov.github.io/webaudiofontdata/sound/0000_JCLive_sf2_file.js
- Violin preset: https://surikov.github.io/webaudiofontdata/sound/0400_JCLive_sf2_file.js
- Preset repository: https://github.com/surikov/webaudiofontdata ; its MIT license is included as `vendor/Soundfont-LICENSE.txt`.

Instrument presets already contain their encoded audio data. Each deploy archive contains only its own instrument preset. The application itself needs no build step. Upstream TypeScript configuration is supplied for source inspection and rebuilding the playback engine; the shipped upstream distribution is used as-is.

SHA-256 of downloaded runtime assets:

- `WebAudioFontPlayer.js`: `f3f3bae5fa47140eecc0c72834d3b4eaed16ca108f891456aa2625b86d3fb07f`
- `0000_JCLive_sf2_file.js`: `201b5e975e6dfd30937c2c153f226e2ca5e0c413b778b5a4a22318d24381765a`
- `0400_JCLive_sf2_file.js`: `923d2f2a05ad6847a662fd3e7fd14599426dfc7d711e064e1d5d54acaa398166`
