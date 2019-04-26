var parentGroup = L.markerClusterGroup(),
    oracle = L.featureGroup.subGroup(parentGroup),
    mysql = L.featureGroup.subGroup(parentGroup),
    sqlserver = L.featureGroup.subGroup(parentGroup),
    postgres = L.featureGroup.subGroup(parentGroup),
    mongo = L.featureGroup.subGroup(parentGroup),
    ibm = L.featureGroup.subGroup(parentGroup),
    access = L.featureGroup.subGroup(parentGroup),
    redis = L.featureGroup.subGroup(parentGroup),
    elasticsearch = L.featureGroup.subGroup(parentGroup),
    sqlite = L.featureGroup.subGroup(parentGroup);

// Layers
var enginesOverlay = {
    '<i style="background: #D63E2A"></i>Oracle': oracle,
    '<i style="background: #0067A3"></i>MySQL': mysql,
    '<i style="background: #575757"></i>SQL Server': sqlserver,
    '<i style="background: #89DBFF"></i>PostgreSQL': postgres,
    '<i style="background: #72AF26"></i>MongoDB': mongo,
    '<i style="background: #303030"></i>IBM db2': ibm,
    '<i style="background: #A03336"></i>Microsoft Access': access,
    '<i style="background: #D63E2A"></i>Redis': redis,
    '<i style="background: orange"></i>Elasticsearch': elasticsearch,
    '<i style="background: #38AADD"></i>SQLite': sqlite
};

var map = L.map('map', {
    maxZoom: 16, layers: [oracle, mysql, sqlserver, postgres, mongo, ibm, access, redis, elasticsearch, sqlite]
}).setView([20.0,0.0], 2);

// Types of basemaps
var lightMap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> & &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 16,
    minZoom: 2.5,
    continuousWorld: false,
}).addTo(map);

var nightMode = false;

var nightmodeMap = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> & &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 16,
    minZoom: 2.5,
    continuousWorld: false,
});

// Set map bounds
var bounds = map.getBounds();
var southWest = bounds.getSouthWest();
var northEast = bounds.getNorthEast();
bounds = L.latLngBounds(southWest,northEast);
map.setMaxBounds(bounds);

parentGroup.addTo(map);
var tweets;

// Timeline slider
getDataAddMarkers = function ({label, value, map, exclamation}){
    for (layer in enginesOverlay) {
        enginesOverlay[layer].clearLayers();
    }

    var hours;

    if(label == "2 horas"){
        hours = "2hours";
    } else if (label == "4 horas"){
        hours = "4hours";
    } else if (label == "6 horas"){
        hours = "6hours";
    }

    tweets = $.ajax({
        url: "http://localhost:3000/api/tweets/geolocation/true/since/" + hours,
        dataType: "json",
        error: function(xhr) {
            console.log(xhr.statusText);
        }
    });

    var withTopic;

    $.when(tweets).done(function() {
        var geojson = L.geoJson(tweets.responseJSON, {
            onEachFeature: function (feature, layer) {
                withTopic = true;
                if(jQuery.inArray("Oracle", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'red'}));
                    layer.addTo(oracle);
                } else if(jQuery.inArray("MySQL", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'darkblue'}));
                    layer.addTo(mysql);
                } else if(jQuery.inArray("SQL Server", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'gray'}));
                    layer.addTo(sqlserver);
                } else if(jQuery.inArray("PostgreSQL", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'lightblue'}));
                    layer.addTo(postgres);
                } else if(jQuery.inArray("MongoDB", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'green'}));
                    layer.addTo(mongo);
                } else if(jQuery.inArray("IBM db2", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'black'}));
                    layer.addTo(ibm);
                } else if(jQuery.inArray("Access", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'darkred'}));
                    layer.addTo(access);
                } else if(jQuery.inArray("Redis", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'red'}));
                    layer.addTo(redis);
                } else if(jQuery.inArray("Elasticsearch", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'orange'}));
                    layer.addTo(elasticsearch);
                } else if(jQuery.inArray("SQLite", feature.properties.topics) !== -1){
                    layer.setIcon(L.AwesomeMarkers.icon({icon: 'null', markerColor: 'blue'}));
                    layer.addTo(sqlite);
                } else {
                    withTopic = false;
                }

                if(withTopic){
                    layer.bindPopup("<blockquote class=twitter-tweet data-cards=hidden data-conversation=none data-lang=es" + "><p lang="
                    + feature.properties.lang + "dir=ltr>" + feature.properties.text + "</p>&mdash;" + feature.properties.user_name +
                    "<a href=https://twitter.com/" + feature.properties.user_name + "/status/" + feature.properties.id + ">"
                    + feature.properties.date + "</a></blockquote>", {minWidth: 215, autoClose: true, closeOnClick: true}).on('click', clickZoom);
                }
            }
        });
    });
}

L.control.layers(null, enginesOverlay, {collapsed: false}).addTo(map);

L.control.timelineSlider({
    position: "bottomleft",
    timelineItems: ["6 horas", "4 horas", "2 horas"],
    changeMap: getDataAddMarkers })
.addTo(map);

// User location plugin
map.addControl(L.control.locate({
    locateOptions: {
        maxZoom: 7
}}));

// Fullscreen plugin
map.addControl(new L.Control.Fullscreen());

// Night mode control
var nightModeControl = L.Control.extend({
    options: { position: 'topleft' },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        container.style.backgroundColor = 'white';     
        container.style.backgroundImage = "url(images/moon-solid.svg)";
        container.style.backgroundRepeat = 'no-repeat';
        container.style.backgroundPosition = 'center';
        container.style.backgroundSize = "20px 20px";
        container.style.width = '30px';
        container.style.height = '30px';
        container.style.cursor = 'pointer';
        container.title = 'Modo oscuro';

        container.onclick = function(){
            if(nightMode){
                map.removeLayer(nightmodeMap);
                map.addLayer(lightMap);
                nightMode = false;
            } else {
                map.removeLayer(lightMap);
                map.addLayer(nightmodeMap);
                nightMode = true;
            }
        }
        return container;
    }
});

map.addControl(new nightModeControl());

map.addControl(new L.Control.Search({
    url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
    jsonpParam: 'json_callback',
    propertyName: 'display_name',
    propertyLoc: ['lat','lon'],
    marker: {},
    hideMarkerOnCollapse: true,
    autoCollapse: false,
    autoType: false,
    minLength: 2,
    zoom: 8,
    textErr: 'Ubicación no encontrada',
    textCancel: 'Cancelar',
    textPlaceholder: 'Buscar ubicación'
}));

function clickZoom(e) {
    $.getScript("https://platform.twitter.com/widgets.js");
    $(".leaflet-popup").hide();
    //map.setView(e.target.getLatLng());
    setTimeout(function() {
        $(".leaflet-popup").show();
    }, 1050);
}

map.on('popupopen', function(e) {
    var px = map.project(e.popup._latlng);
    px.y -= e.popup._container.clientHeight/2;
    map.panTo(map.unproject(px), {animate: true});
});
