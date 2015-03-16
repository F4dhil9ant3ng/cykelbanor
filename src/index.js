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
    map = L.map('map', {
        editInOSMControlOptions: {position: 'bottomright', widget: 'attributionBox'}
    }),
    layerControl = L.control.layers(undefined, require('./layers'), { position: 'bottomleft'}).addTo(map),
    routingControl = L.Routing.control({
        router: L.Routing.osrm({serviceUrl: 'http://tinycat.liedman.net/viaroute'}),
        geocoder: L.Control.Geocoder.nominatim(),
        routeWhileDragging: true,
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
                handle = L.DomUtil.create('div', 'geocoder-handle');
            handle.innerHTML = String.fromCharCode(65 + i);
            geocoder.container.insertBefore(handle, geocoder.container.firstChild);
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

L.tileLayer('https://a.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibGllZG1hbiIsImEiOiI1TXRSbUI4In0.EMQ3W8jAteath85pR800ag', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on('click', function(e) {
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

map.on('locationerror', function() {
    map.fitBounds(L.latLngBounds([55.3,9.6],[69.3,26.6]));
});
map.on('locationfound', function(e) {
    L.circleMarker(e.latlng, {
        radius: 4,
        fillOpacity: 0.8
    })
    .addTo(map);
});

routingControl.on('waypointschanged', function() {
    state.setWaypoints(routingControl.getWaypoints());
});

if (!initialWaypoints || initialWaypoints.length < 2) {
    map.locate({
        setView: true,
        timeout: 1000,
        maxZoom: 14
    });
}

userInfo();
