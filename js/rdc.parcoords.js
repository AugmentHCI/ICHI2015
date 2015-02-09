/**
 * Created by robindecroon on 27/01/2015.{}
 */

var dataFile = "testdata25";

/*
 * Data related arrays
 */
var dimensions = ["age", "heartrate", "systolic blood pressure", "diastolic blood pressure", "weight", "bmi"];
var filters = [];
filters.length = dimensions.length;
var myCrossfilterDimensions = [];
myCrossfilterDimensions.length = dimensions.length;


/*
 * Window related parameters
 */
var marginHack = 20;
var marginLeft = 50, marginRight = 50 + marginHack, marginBottom = 50 + marginHack, marginTop = 50;

var innerWidth = window.innerWidth - marginHack;
var innerHeight = window.innerHeight - marginHack;

var width = innerWidth - marginLeft - marginRight;
var height = innerHeight - marginTop - marginBottom;

var widthBetween = width / dimensions.length;
var xZero = marginLeft + (width / dimensions.length) / 2;
var yZero = marginTop;

var selectionAreaWidth = 40;


var missingMarging = 100;

var mouseDown = false;
var selectionI;
var thresshold = 3;


/*
 * Draw the svg's
 */
var svgContainer = d3.select("body").append("svg")
    .attr("width", innerWidth)
    .attr("height", innerHeight - missingMarging)
    .attr("class", "container")
    .on("mousemove", function () {
        if (mouseDown) {
            var i = selectionI;

            var lastMousePosition = d3.mouse(this)[1];

            var startPosition = selectionBoxStarts[i];
            selectionBoxEnds[i] = lastMousePosition;

            selectionBoxHeights[i] = Math.abs(lastMousePosition - startPosition);


            var dimensionElement = myCrossfilterDimensions[i];
            var min = dimensionElement.min;
            var max = dimensionElement.max;

            var filter = null;
            if (Math.abs(startPosition - lastMousePosition) > thresshold) {
                drawSelectionbox();

                if (startPosition < lastMousePosition) {
                    filter = [yToValue(startPosition, min, max), yToValue(lastMousePosition, min, max)];
                } else {
                    filter = [yToValue(lastMousePosition, min, max), yToValue(startPosition, min, max)];
                }
            }

            var crossfilterDimension = dimensionElement.crossDimension;
            crossfilterDimension.filter(filter);
            var selection = crossfilterDimension.top(Infinity);
            allData.forEach(function (d) {
                if (selection.indexOf(d) !== -1) {
                    d.selected = "true";
                }
                else {
                    d.selected = "false";
                }
            });
            renderPaths(prepareXY(allData));
        }
    })
    .on("mouseup", function (d, i) {
        mouseDown = false;
    });

var pathContainer = svgContainer.append("svg")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

var brushContainer = svgContainer.append("svg")
    .attr("width", innerWidth)
    .attr("height", innerHeight - missingMarging);

function renderChartEssentials() {
    // Draw the selectionAreas
    var selectionAreas = svgContainer.selectAll("rect")
        .data(dimensions)
        .enter()
        .append("rect")
        .attr("id", function (d, i) {
            return "selectionArea-" + d;
        })
        .attr("class", "selectionArea")
        .attr("x", function (d, i) {
            return (xZero + widthBetween * i) - selectionAreaWidth / 2;
        })
        .attr("y", function (d, i) {
            return yZero;
        })
        .attr("width", selectionAreaWidth)
        .attr("height", height)
        .on("mousedown", function (d, i) {
            selectionBoxStarts[i] = d3.mouse(this)[1];
            mouseDown = true;
            selectionI = i;
        });

    var axesLabels = svgContainer.selectAll('text')
        .data(dimensions)
        .enter()
        .append('text')
        .attr("x", function (d, i) {
            return xZero + widthBetween * i;
        })
        .attr("y", function (d, i) {
            return yZero - 10;
        })
        .text(function (d) {
            return d;
        })
        .attr("class", "axisLabel");

// Draw the axes
    var axes = svgContainer.selectAll("line")
        .data(dimensions)
        .enter()
        .append("line")
        .attr("class", "axis")
        .attr("id", function (d, i) {
            return "axis-" + d;
        })
        .attr("x1", function (d, i) {
            return xZero + widthBetween * i;
        })
        .attr("y1", function (d, i) {
            return yZero;
        })
        .attr("x2", function (d, i) {
            return xZero + widthBetween * i;
        })
        .attr("y2", function (d, i) {
            return yZero + height;
        });

}


function renderPaths(dataCoordinates) {
    var path = pathContainer.selectAll('path')
        .data(dataCoordinates);
    path
        .enter()
        .append('path')
        .attr('d', function (d) {
            // TODO hier moet ik zoeken. Vergeet ook niet de update. (maak er functie van)
            return lineInterpolation(d.coordinates);
        })
        .attr('fill', 'none')
        .style('stroke-width', 1)
        .style('stroke', 'steelblue');

    path.attr('d', function (d) {
        return lineInterpolation(d.coordinates);
    }).attr('fill', 'none').style('stroke-width', 1)
        .style('stroke', function (d) {
            if (!d.selected) {
                return '#ECECEA';
            } else {
                return 'steelblue';
            }
        });

    path.exit().remove();
}

var allData;
var myCrossfilter;

// read the data
d3.csv("../data/" + dataFile + ".csv", function (error, data) {
    data = data.filter(function (d) {
        return d.bmi !== "NA"
    });
    data = data.filter(function (d) {
        return d.age !== "NA"
    });

    allData = data;
    myCrossfilter = crossfilter(data);

    for (var i = 0; i < dimensions.length; i++) {
        var dim = dimensions[i];
        var values = data.map(function (d) {
            return +d[dim]
        });
        myCrossfilterDimensions[i] = {
            min: d3.min(values),
            max: d3.max(values),
            crossDimension: myCrossfilter.dimension(function (d) {
                return d[dim];
            }),
            filter: null
        };
    }
    renderPaths(prepareXY(data));

    renderChartEssentials();
});


function prepareXY(data) {
    var result = [];
    data.forEach(function (d) {
        var temp = [];
        for (var i = 0; i < dimensions.length; i++) {
            var bound = myCrossfilterDimensions[i];
            var yValue = valueToY(d[dimensions[i]], bound.min, bound.max);
            temp.push({x: (xZero + widthBetween * i), y: yValue})
        }
        result.push({coordinates: temp, selected: d.selected === "true"});
    });
    return result;
}


var selectionBoxHeights = [];
for (var i = 0; i < dimensions.length; i++) {
    selectionBoxHeights[i] = 0;
}

var selectionBoxStarts = [];
selectionBoxStarts.length = dimensions.length;

var selectionBoxEnds = [];
selectionBoxEnds.length = dimensions.length;

function drawSelectionbox() {
    var selectionBox = brushContainer.selectAll('rect').data(selectionBoxHeights);

    selectionBox
        .attr('height', function (d, i) {
            if (selectionBoxStarts[i] < selectionBoxEnds[i]) {
                return d3.min([d, height - selectionBoxStarts[i] + yZero]);
            } else {
                if (selectionBoxEnds[i] < yZero) {
                    return selectionBoxStarts[i] - yZero;
                } else {
                    return d;
                }
            }
        })
        .attr("y", function (d, i) {
            if (selectionBoxStarts[i] < selectionBoxEnds[i]) {
                return selectionBoxStarts[i];
            } else {
                return d3.max([yZero, selectionBoxStarts[i] - d]);
            }
        });

    selectionBox.enter().append('rect')
        .attr("x", function (d, i) {
            return (xZero + widthBetween * i) - selectionAreaWidth / 2;
        })
        .attr("width", selectionAreaWidth)
        .attr("class", "selectionBox");

    selectionBox.exit().remove();

}

function yToValue(y, min, max) {
    return (y - yZero) / (height - yZero) * (max - min) + min;
}

function valueToY(value, min, max) {
    return yZero + (height - yZero) * ((+value - min) / (max - min));
}

var lineInterpolation = d3.svg.line()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    })
    .interpolate('linear');

