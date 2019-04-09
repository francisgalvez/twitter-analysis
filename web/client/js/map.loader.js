var tweets = $.ajax({
    url: "http://localhost:3000/api/tweets/located",
    dataType: "json",
    error: function(xhr) {
        console.log(xhr.statusText);
    }
});

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

parentGroup.addTo(map);

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

// User location plugin
map.addControl(L.control.locate({
    locateOptions: {
        maxZoom: 7
}}));

// Fullscreen plugin
map.addControl(new L.Control.Fullscreen());

// Night mode control
var nightModeControl =  L.Control.extend({
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

var markerClusters = L.markerClusterGroup();

$.when(tweets).done(function() {
    var geojson = L.geoJson(tweets.responseJSON, {
        onEachFeature: function (feature, layer) {
            if(jQuery.inArray("Oracle", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({ markerColor: 'red'}));
                layer.addTo(oracle);
            } else if(jQuery.inArray("MySQL", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'darkblue'}));
                layer.addTo(mysql);
            } else if(jQuery.inArray("SQL Server", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'gray'}));
                layer.addTo(sqlserver);
            } else if(jQuery.inArray("PostgreSQL", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'lightblue'}));
                layer.addTo(postgres);
            } else if(jQuery.inArray("MongoDB", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'green'}));
                layer.addTo(mongo);
            } else if(jQuery.inArray("IBM db2", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'black'}));
                layer.addTo(ibm);
            } else if(jQuery.inArray("Access", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'darkred'}));
                layer.addTo(access);
            } else if(jQuery.inArray("Redis", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'red'}));
                layer.addTo(redis);
            } else if(jQuery.inArray("Elasticsearch", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'orange'}));
                layer.addTo(elasticsearch);
            } else if(jQuery.inArray("SQLite", feature.properties.topics) !== -1){
                layer.setIcon(L.AwesomeMarkers.icon({markerColor: 'blue'}));
                layer.addTo(sqlite);
            }

            layer.bindPopup("<blockquote class=twitter-tweet data-cards=hidden data-conversation=none data-lang=es" + "><p lang="
            + feature.properties.lang + "dir=ltr>" + feature.properties.text + "</p>&mdash;" + feature.properties.user_name +
            "<a href=https://twitter.com/" + feature.properties.user_name + "/status/" + feature.properties.id + ">"
            + feature.properties.date + "</a></blockquote>").on('click', clickZoom);
        }
    });

    L.control.layers(null, enginesOverlay, {collapsed: false}).addTo(map);
});

function clickZoom(e) {
    $.getScript("https://platform.twitter.com/widgets.js");
    $(".leaflet-popup").hide();
    map.setView(e.target.getLatLng(), 5);
    setTimeout(function() {
        $(".leaflet-popup").show();
    }, 1000);
}

map.on('popupopen', function(e) {
    var px = map.project(e.popup._latlng);
    px.y -= e.popup._container.clientHeight;
    map.panTo(map.unproject(px));
});

/*
map.on('popupopen', function(e) {
    $(".leaflet-popup").hide();
    $.getScript("https://platform.twitter.com/widgets.js");
    var px = map.project(e.popup._latlng);
    px.y -= e.popup._container.clientHeight;
    map.panTo(map.unproject(px));
    setTimeout(function() {
        $(".leaflet-popup").show();
    }, 1000);
});*/