/**
 * Created by robindecroon on 27/01/2015.{}
 */

var dataFile = "testdata24";
var allData;

/*
 * Data related arrays
 */
var dimensions = ["age", "heartrate", "systolic blood pressure", "diastolic blood pressure", "bmi", "weight"];

var sortedData = [];
sortedData.length = dimensions.length;

var lineMargin = 2;
var nbLabels = 6;


var myCrossfilterDimensions = [];
myCrossfilterDimensions.length = dimensions.length;


/*
 * Window related parameters
 */
var marginHack = 20;
var marginLeft = 50, marginRight = 50 + marginHack, marginBottom = 50 + marginHack, marginTop = 50;

var innerWidth = window.innerWidth - marginHack;
var innerHeight = window.innerHeight - marginHack;

var missingMarging = 200;


var width = innerWidth - marginLeft - marginRight;
var height = innerHeight - marginTop - marginBottom - missingMarging / 2;

var widthBetween = width / dimensions.length;
var xZero = marginLeft + (width / dimensions.length) / 2;
var yZero = marginTop;

var selectionAreaWidth = 40;


var mouseDown = false;
var clickTime;
var selectionI; // hack to do mouse action over the whole container


/*
 * Draw the svg's
 */
var svgContainer = d3.select("body").append("svg")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
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
            // Start drawing the selection box.
            drawSelectionbox();
            // adapt the filters to the new ranges
            if (startPosition < lastMousePosition) {
                filter = [yToValue(startPosition, min, max), yToValue(lastMousePosition, min, max)];
            } else {
                filter = [yToValue(lastMousePosition, min, max), yToValue(startPosition, min, max)];
            }
            // apply the filter
            var crossfilterDimension = dimensionElement.crossDimension;
            applyNewFilter(crossfilterDimension, filter);
        }
    })
    .on("mouseup", function (d, i) {
        mouseDown = false;
        if ((+new Date() - clickTime) < 250) {
            selectionBoxHeights[selectionI] = 0;
            applyNewFilter(myCrossfilterDimensions[selectionI].crossDimension, null);
            renderPaths();
            d3.select("#selectionBox-" + selectionI).attr("height", 0);
        }
    });


function applyNewFilter(crossfilterDimension, filter) {
    crossfilterDimension.filter(filter);

    // set the path attributes
    var selection = crossfilterDimension.top(Infinity);
    allData.forEach(function (d) {
        if (selection.indexOf(d) !== -1) {
            d.selected = "true";
        }
        else {
            d.selected = "false";
        }
    });
    renderPaths();
}

var pathContainer = svgContainer.append("svg")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

var brushContainer = svgContainer.append("svg")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

function renderChartEssentials() {
    // Draw the selectionAreas
    svgContainer.selectAll("rect")
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
        .attr("height", height - yZero)
        .on("mousedown", function (d, i) {
            selectionBoxStarts[i] = d3.mouse(this)[1];
            mouseDown = true;
            selectionI = i;
            clickTime = +new Date();

        });

    svgContainer.selectAll('text')
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
        .attr("class", "axisMainLabel");

    // Draw the axes
    svgContainer.selectAll("line")
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
            return height;
        });
}


function drawAxesLabels() {
    // prepare data per dimension
    for (var h = 0; h < dimensions.length; h++) {
        var min = myCrossfilterDimensions[h].min;
        var max = myCrossfilterDimensions[h].max;
        var distance = (max - min) / nbLabels;
        var axisLabels = [];
        for (var j = 0; j <= nbLabels; j++) {
            axisLabels.push(Math.floor(min + distance * j));
        }

        svgContainer.selectAll('labelText')
            .data(axisLabels)
            .enter()
            .append('text')
            .attr("x", function (d, i) {
                return xZero + widthBetween * h - 10;
            })
            .attr("y", function (d, i) {
                return yZero + ((height - yZero) / nbLabels) * i + 4;
            })
            .text(function (d) {
                return d;
            })
            .attr("class", "axisLabel");

        svgContainer.selectAll('labelLine')
            .data(axisLabels)
            .enter()
            .append('line')
            .attr("class", "axis")
            .attr("x1", function (d, i) {
                return xZero + widthBetween * h - 3;
            })
            .attr("y1", function (d, i) {
                return yZero + ((height - yZero) / nbLabels) * i;
            })
            .attr("x2", function (d, i) {
                return xZero + widthBetween * h + 3;
            })
            .attr("y2", function (d, i) {
                return yZero + ((height - yZero) / nbLabels) * i;
            });
    }
}

function renderPaths() {
    var dataCoordinates = [];
    var count = 0;
    allData.forEach(function (d) {
        var temp = [];
        for (var i = 0; i < dimensions.length; i++) {
            if (d[dimensions[i]] == undefined) {

                var previousIndex = sortedData[i - 1].indexOf(d);

                var x = xZero + widthBetween * (i - 1) + previousIndex * lineMargin;

                var bound = myCrossfilterDimensions[i - 1];
                var y = valueToY(d[dimensions[i - 1]], bound.min, bound.max);

                temp.push({x: x, y: y});
                temp.push({x: x, y: height + missingMarging - count * lineMargin});

                var nextIndex = sortedData[i + 1].indexOf(d)
                var x2 = xZero + widthBetween * (i + 1) - nextIndex * lineMargin;
                temp.push({x: x2, y: height + missingMarging - count * lineMargin});

                var boundNext = myCrossfilterDimensions[i + 1];
                var yNext = valueToY(d[dimensions[i + 1]], boundNext.min, boundNext.max);

                temp.push({x: x2, y: yNext});
                temp.push({x: (xZero + widthBetween * (i + 1)), y: yNext});

                count = count + 1;
                i = i + 1;
            } else {
                var bound = myCrossfilterDimensions[i];
                var yValue = valueToY(d[dimensions[i]], bound.min, bound.max);
                temp.push({x: (xZero + widthBetween * i), y: yValue})
            }
        }
        dataCoordinates.push({coordinates: temp, selected: d.selected === "true"});
    });


    var path = pathContainer.selectAll('path')
        .data(dataCoordinates);
    path
        .enter()
        .append('path')
        .attr('d', function (d) {
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
                //return "blue";
            } else {
                return 'steelblue';
            }
        });

    path.exit().remove();
}

// read the data
d3.csv("data/" + dataFile + ".csv", function (error, data) {

    allData = data.slice(0, 80);
    allData.forEach(function (dataPoint) {
        dimensions.forEach(function (dimension) {
            if (dataPoint[dimension] === "NA") {
                dataPoint[dimension] = undefined;
            }
        })
    });

    var myCrossfilter = crossfilter(allData);

    for (var i = 0; i < dimensions.length; i++) {
        var dim = dimensions[i];
        var values = allData.map(function (d) {
            return +d[dim]
        });
        myCrossfilterDimensions[i] = {
            min: d3.min(values),
            max: d3.max(values),
            crossDimension: myCrossfilter.dimension(function (d) {
                return +d[dim];
            }),
            filter: null
        };
        sortedData[i] = myCrossfilterDimensions[i].crossDimension.top(Infinity);
    }

    renderPaths();

    renderChartEssentials();

    drawAxesLabels();

});

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
                return d3.min([d, height - selectionBoxStarts[i]]);
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
        .attr("id", function (d, i) {
            return "selectionBox-" + i;
        })
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

