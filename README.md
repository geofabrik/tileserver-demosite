# Tile Server Demo Site

This simple map displays tiles of a tile server and is intended as an replacement for slippymap.html
which is part of the [mod_tile](https://github.com/openstreetmap/mod_tile) Debian package.

## Features

* Overlays: This map supports overlays, i.e. transparent raster tile layers.
* Privacy: All assets are retrieved from the same host, no personal information is leaked to CDN
  providers.
* Permalink: When panning or zooming the map, the URL will be updated in the address bar of your
  browser (works not if this site is called via a file:// URL). Permalink includes centre of the map,
  zoom level, base layer and overlays
* Easy configurable for sysadmins: The list of layers can be configured during deployment. No
  NodeJS is required, you just need GNU Awk and Make.
* Markers: You can add `&markers=9,49` to the hash part of the URL to add marker at 9°E, 49°N.
* Context menu: The context menu of the map offers access to the URL of the tiles, to submit
  tiles as dirty and to get details about the tile from mod_tile. The context menu can be disabled.

## Installation

The installation requires GNU Awk (usually known as *gawk*).

Create a copy of `settings.js.sample` called `settings.js`:

```sh
cp settings.js.sample settings.js
```

Adapt the available tile layers in `settings.js`. The demo site supports both basemaps and overlay
layers.

After customizing your installation, run build the final `map.js` file. It is build by including
the settings from `settings.js` in the template file `map-src.js`:

```sh
make
```

Copy the contents of this directory to the document root of your webserver. The files `map-src.js`,
`settings.js`, `import.awk` and `Makefile` are not required on the web server.

## License

This project is published under the terms of the BSD 2-clause license.
See the [LICENSE](LICENSE) file for details.

### Third-party code

This project uses [Leaflet](https://leafletjs.com) which is also available under the terms of the
BSD 2-clause license.

Copyright (c) 2010-2019, Vladimir Agafonkin
Copyright (c) 2010-2011, CloudMade
