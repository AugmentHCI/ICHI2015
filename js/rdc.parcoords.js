/**
 * Created by robindecroon on 27/01/2015.{}
 */

(function () {
    'use strict';

    var dataFile = "testdata24";
    var nbOfDataElements = 60;

    //var dimensions = ["bmi", "diastolic blood pressure", "heartrate", "systolic blood pressure", "weight"];
    var dimensions = ["age", "diastolic blood pressure", "bmi", "heartrate", "systolic blood pressure", "weight"];
//var dimensions = ["age", "diastolic blood pressure", "heartrate", "systolic blood pressure", "weight", "bmi"];

    var allData;

    var sortedData = [];
    sortedData.length = dimensions.length;

    var myCrossfilterDimensions = [];
    myCrossfilterDimensions.length = dimensions.length;

    var selectionBoxHeights = [];
    selectionBoxHeights.length = dimensions.length;

    var selectionBoxStarts = [];
    selectionBoxStarts.length = dimensions.length;

    var selectionBoxEnds = [];
    selectionBoxEnds.length = dimensions.length;


    var lineMargin = 3;
    var nbLabels = 6;

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
    var mousePositionY;
    var clickTime;
    var selectionI; // hack to do mouse action over the whole container

    var dragging = false;

    var previousoffset = 0;

    /*
     * Draw the svg's
     */
    var svgContainer = d3.select("body").append("svg")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("class", "container")
        .on("mousemove", function () {
            var i = selectionI;
            var lastMousePosition = d3.mouse(this)[1];
            var startPosition = 0;
            var offset
            if (mouseDown) {
                startPosition = selectionBoxStarts[i];
                if (!dragging) {
                    selectionBoxHeights[i] = Math.abs(lastMousePosition - startPosition);
                    selectionBoxEnds[i] = lastMousePosition;
                }
                if (dragging) {
                    offset = lastMousePosition - mousePositionY - previousoffset;
                    previousoffset = offset;
                    startPosition = selectionBoxStarts[i] + offset;
                    selectionBoxStarts[i] = startPosition;
                    selectionBoxEnds[i] = selectionBoxEnds[i] + offset;
                }
                var dimensionElement = myCrossfilterDimensions[i];
                var min = dimensionElement.min;
                var max = dimensionElement.max;

                // Start drawing the selection box.
                drawSelectionbox();

                // Adapt the filters to the new ranges.
                var filter;
                if (startPosition < selectionBoxEnds[i]) {
                    filter = [yToValue(startPosition, min, max), yToValue(selectionBoxEnds[i], min, max)];
                } else {
                    filter = [yToValue(selectionBoxEnds[i], min, max), yToValue(startPosition, min, max)];
                }
                dimensionElement.crossDimension.filter(filter);
                renderPaths();
            }
        })
        .on("mouseup", function () {
            mouseDown = false;
            if ((+new Date() - clickTime) < 250) {
                selectionBoxHeights[selectionI] = 0;
                selectionBoxStarts[selectionI] = 0;
                selectionBoxEnds[selectionI] = 0;
                myCrossfilterDimensions[selectionI].crossDimension.filter(null);
                renderPaths();
                d3.select("#selectionBox-" + selectionI).attr("height", 0);
                dragging = false;
            }
        });

    var pathContainer = svgContainer.append("svg")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

    var brushContainer = svgContainer.append("svg")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

    function inSelectionBox(i, position) {
        var start = selectionBoxStarts[i];
        var end = selectionBoxEnds[i];
        var temp;
        if (start > end) {
            temp = end;
            end = start;
            start = temp;
        }
        console.log("pos: " + position + " ,start: " + start + " , end: " + end);
        return position > start && position < end; // end is not always reset in time
    }

    function renderChartEssentials() {
        // Draw the selectionAreas
        svgContainer.selectAll("rect")
            .data(dimensions)
            .enter()
            .append("rect")
            .attr("id", function (d) {
                return "selectionArea-" + d;
            })
            .attr("class", "selectionArea")
            .attr("x", function (d, i) {
                return (xZero + widthBetween * i) - selectionAreaWidth / 2;
            })
            .attr("y", function () {
                return yZero;
            })
            .attr("width", selectionAreaWidth)
            .attr("height", height - yZero)
            .on("mousedown", function (d, i) {
                dragging = inSelectionBox(i, d3.mouse(this)[1]);
                selectionBoxStarts[i] = d3.mouse(this)[1];
                mouseDown = true;
                mousePositionY = d3.mouse(this)[1];
                selectionI = i;
                clickTime = +new Date();
            });

        // Draw the axes title labels
        svgContainer.selectAll('text')
            .data(dimensions)
            .enter()
            .append('text')
            .attr("x", function (d, i) {
                return xZero + widthBetween * i;
            })
            .attr("y", function () {
                return yZero - 10;
            })
            .text(function (d) {
                return d;
            })
            .attr("class", "axisMainLabel");

        // Draw the axes themselves
        svgContainer.selectAll("line")
            .data(dimensions)
            .enter()
            .append("line")
            .attr("class", "axis")
            .attr("id", function (d) {
                return "axis-" + d;
            })
            .attr("x1", function (d, i) {
                return xZero + widthBetween * i;
            })
            .attr("y1", function () {
                return yZero;
            })
            .attr("x2", function (d, i) {
                return xZero + widthBetween * i;
            })
            .attr("y2", function () {
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
                .attr("x", function () {
                    return xZero + widthBetween * h - 10;
                })
                .attr("y", function (d, i) {
                    return yZero + ((height - yZero) / nbLabels) * (nbLabels - i) + 4;
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
                .attr("x1", function () {
                    return xZero + widthBetween * h - 3;
                })
                .attr("y1", function (d, i) {
                    return yZero + ((height - yZero) / nbLabels) * (nbLabels - i);
                })
                .attr("x2", function () {
                    return xZero + widthBetween * h + 3;
                })
                .attr("y2", function (d, i) {
                    return yZero + ((height - yZero) / nbLabels) * (nbLabels - i);
                });
        }
    }

    function renderPaths() {
        // Convert the data to coordinates
        var dataCoordinates = [];
        var count = 0;
        allData.forEach(function (d) {
            var color = "steelblue"
            var pathCoordinates = [];
            for (var i = 0; i < dimensions.length; i++) {
                if (d[dimensions[i]] == -Infinity) {
                    var k = i + 1;
                    var l = 0;
                    // Count if how many next dimensions are missing for this data point.
                    while (d[dimensions[k]] == -Infinity && k < dimensions.length) {
                        k = k + 1;
                        l = l + 1;
                    }

                    if (i === 0) { // special case
                        pathCoordinates.push({
                            x: xZero,
                            y: height + missingMarging - (sortedData[i + 1].indexOf(d) * lineMargin)
                        });
                        var nextIndex = sortedData[(i + l) + 1].indexOf(d);
                        var x2 = xZero + widthBetween * ((i + l) + 1) - nextIndex * lineMargin;
                        pathCoordinates.push({
                            x: x2,
                            y: height + missingMarging - (sortedData[i + 1].indexOf(d) * lineMargin)
                        });

                        var boundNext = myCrossfilterDimensions[(i + l) + 1];
                        var yNext = valueToY(d[dimensions[(i + l) + 1]], boundNext.min, boundNext.max);

                        pathCoordinates.push({x: x2, y: yNext});
                        pathCoordinates.push({x: (xZero + widthBetween * ((i + l) + 1)), y: yNext});
                    } else {
                        var x = xZero + sortedData[i - 1].indexOf(d) * lineMargin + widthBetween * (i - 1);
                        var y = valueToY(d[dimensions[i - 1]], myCrossfilterDimensions[i - 1].min, myCrossfilterDimensions[i - 1].max);
                        pathCoordinates.push({x: x, y: y});
                        pathCoordinates.push({
                            x: x,
                            y: height + missingMarging - (sortedData[i - 1].indexOf(d) * lineMargin)
                        });
                        if (i < dimensions.length - 2) {
                            var nextIndex = sortedData[(i + l) + 1].indexOf(d);
                            var x2 = xZero + widthBetween * ((i + l) + 1) - nextIndex * lineMargin;
                            pathCoordinates.push({
                                x: x2,
                                y: height + missingMarging - (sortedData[i - 1].indexOf(d) * lineMargin)
                            });

                            var boundNext = myCrossfilterDimensions[(i + l) + 1];
                            var yNext = valueToY(d[dimensions[(i + l) + 1]], boundNext.min, boundNext.max);

                            pathCoordinates.push({x: x2, y: yNext});
                            pathCoordinates.push({x: (xZero + widthBetween * ((i + l) + 1)), y: yNext});
                        } else { // voorlaatste
                            pathCoordinates.push({
                                x: xZero + widthBetween * (dimensions.length - 1),
                                y: height + missingMarging - (sortedData[i - 1].indexOf(d) * lineMargin)
                            });
                        }
                    }


                    count = count + 1;
                    i = (i + l) + 1;
                } else {
                    var yValue = valueToY(d[dimensions[i]], myCrossfilterDimensions[i].min, myCrossfilterDimensions[i].max);
                    pathCoordinates.push({x: (xZero + widthBetween * i), y: yValue});
                }
            }
            var selected = myCrossfilterDimensions[0].crossDimension.top(Infinity).indexOf(d) !== -1;
            dataCoordinates.push({coordinates: pathCoordinates, selected: selected, color: color});
        });


        // Draw the actual paths
        var paths = pathContainer.selectAll('path')
            .data(dataCoordinates);

        paths
            .enter()
            .append('path')
            .attr('d', function (d) {
                return lineInterpolation(d.coordinates);
            })
            .attr('fill', 'none')
            .style('stroke-width', 1)
            .style('stroke', 'steelblue')
            .on('mouseover', function (d) {
                if (d.selected) {
                    d3.select(this)
                        .style('stroke', '#600000')
                        .style('stroke-width', 2);
                } else {
                    d3.select(this)
                        .style('stroke', 'red')
                        .style('stroke-width', 1);
                }
            })
            .on('mouseout', function (d) {
                if (d.selected) {
                    d3.select(this)
                        .style('stroke', 'steelblue')
                        .style('stroke-width', 1);
                } else {
                    d3.select(this)
                        .style('stroke', '#ECECEA')
                        .style('stroke-width', 1);
                }
            });

        paths
            .style('stroke', function (d) {
                if (!d.selected) {
                    return '#ECECEA';
                } else {
                    return 'steelblue';
                }
            });

        paths.exit().remove();
    }

    d3.csv("data/" + dataFile + ".csv", function (error, data) {
        allData = data.slice(0, nbOfDataElements);
        allData.forEach(function (dataPoint) {
            dimensions.forEach(function (dimension) {
                if (dataPoint[dimension] === "NA") {
                    dataPoint[dimension] = -Infinity;
                }
            });
        });

        var myCrossfilter = crossfilter(allData);
        for (var i = 0; i < dimensions.length; i++) {
            var dim = dimensions[i];
            var values = allData.map(function (d) {
                return +d[dim];
            });
            myCrossfilterDimensions[i] = {
                min: d3.min(values.filter(function (b) {
                    return b !== -Infinity;
                })),
                max: d3.max(values.filter(function (b) {
                    return b !== -Infinity;
                })),
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

    function drawSelectionbox() {
        var selectionBox = brushContainer.selectAll('rect')
            .data(selectionBoxHeights);

        selectionBox.enter().append('rect')
            .attr("x", function (d, i) {
                return (xZero + widthBetween * i) - selectionAreaWidth / 2;
            })
            .attr("width", selectionAreaWidth)
            .attr("id", function (d, i) {
                return "selectionBox-" + i;
            })
            .attr("class", "selectionBox");

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

// redraw on window resize
    window.onresize = function () {
        location.reload();
    };

}());