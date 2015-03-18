// map center
var myLatlng = new google.maps.LatLng(50.868580, 4.538670);
// map options,
var myOptions = {
    zoom: 9,
    center: myLatlng,
    scrollwheel: false,
    disableDefaultUI: true,
    scaleControl: false,
    panControl: false,
    zoomControl: true,
    styles: [
        {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "saturation": 36
                },
                {
                    "color": "#333333"
                },
                {
                    "lightness": 40
                }
            ]
        },
        {
            "featureType": "all",
            "elementType": "labels.text.stroke",
            "stylers": [
                {
                    "visibility": "on"
                },
                {
                    "color": "#ffffff"
                },
                {
                    "lightness": 16
                }
            ]
        },
        {
            "featureType": "all",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#fefefe"
                },
                {
                    "lightness": 20
                }
            ]
        },
        {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#fefefe"
                },
                {
                    "lightness": 17
                },
                {
                    "weight": 1.2
                }
            ]
        },
        {
            "featureType": "administrative",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "simple"
                }
            ]
        },
        {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#ffffff"
                },
                {
                    "lightness": 20
                }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f5f5f5"
                },
                {
                    "lightness": 21
                }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#dedede"
                },
                {
                    "lightness": 21
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#ffffff"
                },
                {
                    "lightness": 17
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#ffffff"
                },
                {
                    "lightness": 29
                },
                {
                    "weight": 0.2
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#ffffff"
                },
                {
                    "lightness": 18
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#ffffff"
                },
                {
                    "lightness": 16
                }
            ]
        },
        {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f2f2f2"
                },
                {
                    "lightness": 19
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#e9e9e9"
                },
                {
                    "lightness": 17
                }
            ]
        }
    ]
};

var shapeOptions = {
    strokeWeight: 1,
    strokeOpacity: 1,
    fillOpacity: 0.2,
    editable: false,
    clickable: false,
    strokeColor: colorHighlightSelected,
    fillColor: colorHighlightSelected
};

var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

var heatmap = new google.maps.visualization.HeatmapLayer({
    data: [],
    radius: 25,
    opacity: 0.75,
    gradient: [
        'rgba(255, 255, 255, 0)',
        'rgba(218,230,240,0.2)',
        'rgba(181,205,225,0.4)',
        'rgba(144,180,210,0.6)',
        'rgba(106,155,195,0.8)',
        'rgba(70, 130, 180, 1)']
});
heatmap.setMap(map);

var drawingManager;
var lastShape;

function createHeatmap(items) {
    if (items.length !== 0) {
        heatmap.setMap(map);
        var heatmapData = [];
        items.forEach(function (p) {
            heatmapData.push(new google.maps.LatLng(p.lat, p.lng));
        });
        heatmap.setData(heatmapData);
    } else {
        heatmap.setMap(null);
    }
}

// create a drawing manager attached to the map to allow the user to draw
// markers, lines, and shapes.
drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControlOptions: {drawingModes: [google.maps.drawing.OverlayType.RECTANGLE]},
    rectangleOptions: shapeOptions,
    polygonOptions: shapeOptions,
    map: map
});

google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
    if (lastShape !== undefined) {
        lastShape.setMap(null);
    }

    // cancel drawing mode
    if (shift_draw === false) {
        drawingManager.setDrawingMode(null);
    }

    lastShape = e.overlay;
    lastShape.type = e.type;


    if (lastShape.type === google.maps.drawing.OverlayType.RECTANGLE) {

        lastBounds = lastShape.getBounds();

        var latRange = [lastBounds.getSouthWest().lat(), lastBounds.getNorthEast().lat()];
        var lngRange = [lastBounds.getSouthWest().lng(), lastBounds.getNorthEast().lng()];

        patientsByLat.filter(latRange);
        patientsByLng.filter(lngRange);
    }
    updateWidgets();
});

var shift_draw = false;

$(document).bind('keydown', function (e) {
    if (e.keyCode == 16 && shift_draw == false) {
        map.setOptions({draggable: false, disableDoubleClickZoom: true});
        shift_draw = true; // enable drawing
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
    }
});

$(document).bind('keyup', function (e) {
    if (e.keyCode == 16) {
        map.setOptions({draggable: true, disableDoubleClickZoom: true});
        shift_draw = false; // disable drawing
        drawingManager.setDrawingMode(null);
    }

});

google.maps.event.addListener(map, 'mousedown', function () {
    if (lastShape != undefined) {
        lastShape.setMap(null);
        patientsByLat.filter(null);
        patientsByLng.filter(null);
        updateWidgets();
    }
});

google.maps.event.addListener(map, 'drag', function () {
    if (lastShape != undefined) {
        lastShape.setMap(null);
    }
});