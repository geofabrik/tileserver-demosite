"use strict";
#include "settings.js"

var halfEarthCircumfence = Math.PI * 6378137;
var tileSize = 256;
function latlngToTile(coords, zoom) {
    var earthCircumfence = halfEarthCircumfence * 2;
    var latRad = coords.lat * (Math.PI / 180);
    var n = Math.pow(2, zoom);
    var x = ((coords.lng + 180) / 360) * n;
    var y = ((1 - Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI) / 2 * n);
    return {'x': Math.floor(x), 'y': Math.floor(y), 'z': zoom};
}

function requestAddQueue(e, ll) {
    var xhr = new XMLHttpRequest();
    var txy = latlngToTile(e.latlng, mymap.getZoom());
    var url = ll.getTileUrl(txy);
    url += '/dirty';
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Content-type", "text/plain");
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            var elemHeader = document.createElement('p');
            elemHeader.appendChild(document.createTextNode(url + ' returned:'));
            var elem1 = document.createElement('p');
            elem1.appendChild(document.createTextNode(xhr.response));
            var elemDiv = document.createElement('div');
            elemDiv.appendChild(elemHeader);
            elemDiv.appendChild(elem1);
            var popupWidth = Math.min(window.screen.availWidth, 300);
            var popup = L.popup({minWidth: popupWidth}).setLatLng(e.latlng).setContent(elemDiv).openOn(mymap);
        }
    };
    xhr.send();
}

function tileStatus(e, ll) {
    var xhr = new XMLHttpRequest();
    var txy = latlngToTile(e.latlng, mymap.getZoom());
    var url = ll.getTileUrl(txy);
    url += '/status';
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Content-type", "text/plain");
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            var text = xhr.response.split('\n');
            var elemDiv = document.createElement('div');
            var elemHeader = document.createElement('p');
            elemHeader.appendChild(document.createTextNode(url + ' returned:'));
            elemDiv.appendChild(elemHeader);
            var elem1 = document.createElement('p');
            elem1.appendChild(document.createTextNode(text[0]));
            elemDiv.appendChild(elem1);
            if (text.length >= 3) {
                var elem2 = document.createElement('p');
                elem2.appendChild(document.createTextNode(text[2]));
                elemDiv.appendChild(elem2);
            }
            var popupWidth = Math.min(window.screen.availWidth, 400);
            var popup = L.popup({minWidth: popupWidth}).setLatLng(e.latlng).setContent(elemDiv).openOn(mymap);
        }
    };
    xhr.send();
}


function openTileInNewTab(e, ll) {
    var txy = latlngToTile(e.latlng, mymap.getZoom());
    var url = ll.getTileUrl(txy);
    window.open(url, '_blank');
}

function getLayerName(ll) {
    var foundName = "";
    var testCoords = {'x': 0, 'y': 0, 'z': 0};
    var tileUrl = ll.getTileUrl(testCoords);
    [baseLayers, overlays].forEach(function (lGroup) {
        for (var i = 0; i < Object.keys(lGroup).length; ++i) {
            var name = Object.keys(lGroup)[i];
            // skip tile grid layer
            if (typeof(lGroup[name].getTileUrl) != 'function') {
                continue;
            }
            var layerUrl = lGroup[name].getTileUrl(testCoords);
            if (layerUrl == tileUrl) {
                foundName = name;
                break;
            }
        }
    });
    return foundName;
}

function getContextmenuItemsForLayer(ll) {
    var layerName = getLayerName(ll);
    return [
        {
            text: "open " + layerName + " tile in new tab",
            callback: function(e){openTileInNewTab(e, ll);}
        }, {
            text: "add " + layerName + " tile to rendering queue",
            callback: function(e){requestAddQueue(e, ll);}
        }, {
            text:  layerName + " tile status",
            callback: function(e){tileStatus(e, ll);}
        }
    ];
}

// set current layer, by default the layer with the local tiles
var currentBaseLayer = baseLayers['local'] || baseLayers[Object.keys(baseLayers)[0]];
var currentOverlays = [];
var markerLocation = null;

// tile grid
L.GridLayer.GridDebug = L.GridLayer.extend({
    createTile: function(coords){
        const tile = document.createElement('div');
        var html = '<div class="grid-tile"><span>x=' + coords.x + ' y=' + coords.y + ' z=' + coords.z + '</span></div>';
        var html2 = "<p x=" + coords.x + " y=" + coords.y + " z=" + coords.z;
        tile.innerHTML = html;
        return tile;
    }
});
L.gridLayer.gridDebug = function (opts) {
    return new L.GridLayer.GridDebug(opts);
};
var tileGrid = L.gridLayer.gridDebug();
overlays['tile grid'] = tileGrid;

// get layer and location from anchor part of the URL if there is any
var anchor = location.hash.substr(1);
if (anchor != "") {
    var elementsF = anchor.split("&");
    var elements = elementsF[0].split("/");
    if (elements.length == 4) {
        if (decodeURIComponent(elements[0]) in baseLayers) {
            currentBaseLayer = baseLayers[decodeURIComponent(elements[0])];
        }
        start_zoom = elements[1];
        start_latitude = elements[2];
        start_longitude = elements[3];
    }
    for (var i = 1; i < elementsF.length; ++i) {
        var kv = elementsF[i].split("=");
        if (kv.length == 2 && kv[0] == 'overlays') {
            decodeURIComponent(kv[1]).split(',').forEach(function (e) {
                if (e in overlays) {
                    currentOverlays.push(overlays[e]);
                }
            });
        } else if (kv.length == 2 && kv[0] == 'marker') {
            markerLocation = decodeURIComponent(kv[1]).split(',').map(parseFloat);
            if (markerLocation.length != 2 || markerLocation[0] === NaN || markerLocation[1] === NaN) {
                markerLocation = null;
            } else {
                // adapt order lon,lat to lat,lon for Leaflet
                markerLocation.reverse();
            }
        }
    }
}

var mymap = L.map('mapid', {
    center: [start_latitude, start_longitude],
    zoom: start_zoom,
    layers: [currentBaseLayer],
    contextmenu: enableContextmenu,
    contextmenuWidth: 250,
    contextmenuItems: getContextmenuItemsForLayer(currentBaseLayer)
});
currentOverlays.forEach(function(ll) {
    ll.addTo(mymap);
    if (ll === tileGrid) {
        return;
    }
    var menuItems = getContextmenuItemsForLayer(ll);
    menuItems.forEach(function(item) {
        mymap.contextmenu.addItem(item);
    });
});

// layer control
if (enableLayerSwitcher) {
    var layerControl = L.control.layers(baseLayers, overlays);
    layerControl.addTo(mymap);
}

// add marker if present
if (markerLocation != null) {
    L.marker(markerLocation).addTo(mymap);
}

// functions executed if the layer is changed or the map moved
function update_url(newBaseLayerName) {
    if (newBaseLayerName == '') {
        for (var key in baseLayers) {
            if (baseLayers[key] == currentBaseLayer) {
                newBaseLayerName = key;
            }
        }
    }
    var overlayNames = [];
    for (var overlayKey in overlays) {
        if (mymap.hasLayer(overlays[overlayKey])) {
            overlayNames.push(overlayKey);
        }
    }
    var origin = location.origin;
    var pathname = location.pathname;
    var newurl = origin + pathname + "#" + encodeURIComponent(newBaseLayerName) + '/' + mymap.getZoom() + "/" + mymap.getCenter().lat.toFixed(6) + "/" +mymap.getCenter().lng.toFixed(6);
    if (overlayNames != '') {
        newurl += '&overlays=' + encodeURIComponent(overlayNames.join(','));
    }
    history.replaceState('data to be passed', document.title, newurl);
}

// update context menu
function updateContextmenu() {
    mymap.contextmenu.removeAllItems();
    mymap.eachLayer(function(ll) {
        var menuItems = getContextmenuItemsForLayer(ll);
        menuItems.forEach(function(item) {
            mymap.contextmenu.addItem(item);
        });
    });
}

// event is fired if the base layer of the map changes
mymap.on('baselayerchange', function(e) {
    currentBaseLayer = baseLayers[e.name];
    update_url(e.name);
    updateContextmenu();
});

mymap.on('overlayadd', function(e) {
    update_url('');
    updateContextmenu();
});
mymap.on('overlayremove', function(e) {
    update_url('');
    updateContextmenu();
});

// change URL in address bar if the map is moved
mymap.on('move', function(e) {
    update_url('');
});
