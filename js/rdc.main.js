var transitionDuration = 100;
var nbOfDataElements = 100;
var nbOfMissingDataElements = 10;

var dataFile = "testdata24";

var nbWidgetsHorizontal = 3;
var nbWidgetsVertical = 4;

var gridMargin = 20;

var marginTop = 20;
var marginRight = 30;
var marginBottom = 30;
var marginLeft = 30;
var marginMiddle = 22;

var colorHighlightSelected = "#600000";
var colorHighlightNotSelected = "#ffb2b2";
var colorSelected = "steelblue";
var colorNotSelected = "#ECECEA";

var weight = 'weight';
var age = 'age';
var heartrate = "heartrate";
var bmi = "bmi";
var temperature = "temperature";
var diastolic = "diastolic blood pressure";
var systolic = "systolic blood pressure";

var name = "name";
var id = "id";
var medicationGroup = 'medication group';
var medication = 'medication';
var mainIcpc = 'main icpc';
var icpc = 'icpc';
var degree = 'degree';
var careGiver = 'main physician';
var gender = 'gender';
var lat = "lat";
var lng = 'lng';
var income = "income";
var religion = "religion";

widgetWidth = window.innerWidth / nbWidgetsHorizontal - 1.5 * gridMargin;
widgetHeight = window.innerHeight / nbWidgetsVertical - 1.5 * gridMargin;

$(function () { //DOM Ready

    gridster = $(".gridster ul").gridster({
        widget_margins: [gridMargin / 2, gridMargin / 2],
        widget_base_dimensions: [widgetWidth, widgetHeight]
    }).gridster().data('gridster').disable();

});

$(window).resize(function () {

    window.location.reload();

});