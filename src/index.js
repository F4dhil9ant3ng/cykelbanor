var L = require('leaflet'),
    lrm = require('leaflet-routing-machine'),
    lcg = require('leaflet-control-geocoder'),
    eio = require('leaflet-editinosm'),
    addressPopup = require('../templates/address-popup.hbs'),
    address = require('./address'),
    userInfo = require('./user-info'),
    State = require('./state'),
    state = new State(window),
    initialWaypoints = state.getWaypoints(),
    Sortable = require('sortablejs'),
    geolocate = require('./geolocate'),
    map = L.map('map', {
        attributionControl: false
    }),
    GeolocateControl = require('./geolocate-control'),
    baselayers = require('./baselayers'),
    overlays = require('./overlays'),
    layerControl = new L.Control.Layers(baselayers, overlays, { position: 'bottomleft' })
        .addTo(map),
    routingControl = L.Routing.control({
        router: L.Routing.osrm({serviceUrl: 'http://tinycat.liedman.net/viaroute'}),
        geocoder: L.Control.Geocoder.nominatim(),
        routeWhileDragging: true,
        reverseWaypoints: true,
        language: 'sv',
        lineOptions: {
            styles: [
                {color: 'black', opacity: 0.3, weight: 11},
                {color: 'white', opacity: 0.9, weight: 9},
                {color: 'red', opacity: 1, weight: 3}
            ]
        },
        waypoints: initialWaypoints,
        createGeocoder: function(i) {
            var geocoder = L.Routing.Plan.prototype.options.createGeocoder.call(this, i),
                handle = L.DomUtil.create('div', 'geocoder-handle'),
                geolocateBtn = L.DomUtil.create('span', 'geocoder-geolocate-btn', geocoder.container);

            handle.innerHTML = String.fromCharCode(65 + i);
            geocoder.container.insertBefore(handle, geocoder.container.firstChild);

            geolocateBtn.title = 'Välj min position';
            L.DomEvent.on(geolocateBtn, 'click', function() {
                geolocate(map, function(err, p) {
                    if (err) {
                        // TODO: error message
                        return;
                    }

                    routingControl.spliceWaypoints(i, 1, p.latlng);
                });
            });

            return geocoder;
        }
    }).addTo(map),
    sortable = Sortable.create(document.querySelector('.leaflet-routing-geocoders'), {
        handle: '.geocoder-handle',
        draggable: '.leaflet-routing-geocoder',
        onUpdate: function(e) {
            var oldI = e.oldIndex,
                newI = e.newIndex,
                wps = routingControl.getWaypoints(),
                wp = wps[oldI];

            if (oldI === newI || newI === undefined) {
                return;
            }

            wps.splice(oldI, 1);
            wps.splice(newI, 0, wp);
            routingControl.setWaypoints(wps);
        }
    });


L.Icon.Default.imagePath = 'assets/vendor/images';

L.control.attribution({
    prefix: '<a href="/om/">Om cykelbanor.se</a>'
}).addTo(map);
new L.Control.EditInOSM({
    position: 'bottomright',
    widget: 'attributionbox'
}).addTo(map);

baselayers[state.getBaseLayer() || 'Karta'].addTo(map);
state.getOverlays().forEach(function(name) { 
    overlays[name].addTo(map); 
});

new GeolocateControl({ position: 'topleft' }).addTo(map);

map
    .on('baselayerchange', function(e) {
        state.setBaseLayer(e.name);
    })
    .on('overlayadd', function(e) {
        state.addOverlay(e.name);
    })
    .on('overlayremove', function(e) {
        state.removeOverlay(e.name);
    })
    .on('click', function(e) {
    var $content = $(addressPopup()),
        name;

    L.popup().
        setLatLng(e.latlng).
        setContent($content[0]).
        openOn(map);

    L.Control.Geocoder.nominatim().reverse(e.latlng, map.options.crs.scale(18), function(r) {
        if (r && r[0]) {
            name = address(r[0]);
            $content.find('[data-address]').html(name.html);
        }
    });

    $content.find('[data-from]').click(function() {
        routingControl.spliceWaypoints(0, 1, {
            latLng: e.latlng,
            name: name && name.text ? name.text : ''
        });
        map.closePopup();
    });
    $content.find('[data-to]').click(function() {
        routingControl.spliceWaypoints(routingControl.getWaypoints().length - 1, 1, {
            latLng: e.latlng,
            name: name && name.text ? name.text : ''
        });
        map.closePopup();
    });
});

geolocate(map, function(err, p) {
        if (err) {
            map.fitBounds(L.latLngBounds([56,9.6],[68,26.6]));
            return;
        }

        if (!initialWaypoints || initialWaypoints.length < 2) {
            map.setView(p.latlng, Math.min(p.zoom, 14));
        }

        L.circleMarker(p.latlng, {
            radius: 4,
            fillOpacity: 0.8
        })
        .addTo(map);
    }, {
        timeout: 5000
    });

routingControl.on('waypointschanged', function() {
    state.setWaypoints(routingControl.getWaypoints());
});

userInfo();
