/**
 * Created by robindecroon on 27/01/2015.{}
 */


var icpcChart = new HorizontalChart("#icpc", "Secondary diseases and conditions", icpc);
var genderAgeChart = new DoubleHorizontalBarChart("#genderpopulation", "Population pyramid", "age", "gender", gender);
var medicationChart = new HorizontalChart("#medication", "Frequent medication", medication);
var medicationGroupChart = new HorizontalChart("#medicationGroup", "Frequent medication groups", medicationGroup);
var mainIcpcChart = new HorizontalChart("#mainIcpc", "Primary conditions", mainIcpc);
//var patientsTable = new SelectedTable("#patients", "Filtered patients");


var dimensions = [age, diastolic, bmi, heartrate, systolic, weight];
//var dimensions = [bmi,age, diastolic, heartrate, bmi, bmi,bmi,systolic, weight];
var myQualitativeDimensions = [age, medicationGroup, medication, mainIcpc, icpc];

var allData;

var sortedData = [];
sortedData.length = dimensions.length;

var parcoordsCrossfilterDimensions = [];
parcoordsCrossfilterDimensions.length = dimensions.length;
var otherCrossFilterDimensions = [];
var patientsByGender;
var patientsById;
var patientsByLat;
var patientsByLng;


var selectionBoxHeights = [];
selectionBoxHeights.length = dimensions.length;

var selectionBoxStarts = [];
selectionBoxStarts.length = dimensions.length;

var selectionBoxEnds = [];
selectionBoxEnds.length = dimensions.length;

var selectionBoxInitStarts = [];
selectionBoxStarts.length = dimensions.length;

var selectionBoxInitEnds = [];
selectionBoxEnds.length = dimensions.length;


var lineMargin = 3;
var nbLabels = 6;

var missingMarging = nbOfMissingDataElements * 3 + marginBottom / 2;


var myInnerWidth = widgetWidth * 3 + 2 * gridMargin;
var myInnerHeight = 2 * widgetHeight + gridMargin;

var width = myInnerWidth - marginLeft - marginRight;
var height = myInnerHeight - marginTop - marginBottom - missingMarging;

var widthBetween = width / (dimensions.length - 1);
var xZero = marginLeft;//+ (width / dimensions.length) / 2;
var yZero = marginTop;

var selectionAreaWidth = 30;

var mouseDown = false;
var mousePositionY;
var clickTime;
var selectionI; // hack to do mouse action over the whole container

var dragging = false;


// load csv file and create the chart
d3.csv("data/" + dataFile + ".csv", function (error, data) {

    allData = [];

    var count = 0;
    var missing = false;
    for (var i = 0; i < data.length && allData.length < nbOfDataElements; i++) {
        var dataPoint = data[i];
        dimensions.forEach(function (dimension) {
            if (dataPoint[dimension] === "NA") {
                dataPoint[dimension] = -Infinity;
                missing = true
            }
        });
        if (missing) {
            count += 1;
            if (count < nbOfMissingDataElements) {
                allData.push(dataPoint);
            }
        } else {
            allData.push(dataPoint);
        }
        missing = false;
    }
    ;

    var myCrossfilter = crossfilter(allData);
    patientsByGender = myCrossfilter.dimension(function (d) {
        return d[gender];
    });
    patientsById = myCrossfilter.dimension(function (d) {
        return d[id];
    });
    patientsByLat = myCrossfilter.dimension(function (d) {
        return d[lat];
    });
    patientsByLng = myCrossfilter.dimension(function (d) {
        return d[lng];
    });

    myQualitativeDimensions.forEach(function (dim) {
        var tempDim = myCrossfilter.dimension(function (d) {
            return d[dim];
        });
        var temp = {key: dim, crossDim: tempDim};
        otherCrossFilterDimensions.push(temp);
    });


    for (var i = 0; i < dimensions.length; i++) {
        var dim = dimensions[i];
        var values = allData.map(function (d) {
            return +d[dim];
        });
        parcoordsCrossfilterDimensions[i] = {
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
        sortedData[i] = parcoordsCrossfilterDimensions[i].crossDimension.top(Infinity).filter(function (a) {
            return a[dim] == -Infinity;
        });
    }

    renderChartEssentials();
    drawAxesLabels();
    updateWidgets();

});

function highLightByPatientId(patient) {
    var color = colorHighlightNotSelected;
    var strokeWidth = 1;
    if (patientsById.filter(patient).top(Infinity).length !== 0) {
        color = colorHighlightSelected;
        strokeWidth = 2;
    }
    pathContainer.select("#path-" + patient).style('stroke-width', strokeWidth)
        .style('stroke', color);
    patientsById.filter(null);
}

function revertHighLightByPatientId(patient) {
    var color = colorNotSelected;
    if (patientsById.filter(patient).top(Infinity).length !== 0) {
        color = colorSelected;
    }
    pathContainer.select("#path-" + patient).style('stroke-width', 1)
        .style('stroke', color);
    patientsById.filter(null);
}

function highLightByKeyValue(key, value) {
    var locations = [];
    allData.forEach(function (d) {
        if (d[key] === value) {
            highLightByPatientId(d.id);
            locations.push(d);
        }
    });
    createHeatmap(locations);
}

function revertHighLightByKeyValue(key, value) {
    allData.forEach(function (d) {
        if (d[key] === value) {
            revertHighLightByPatientId(d.id);
        }
    });
    createHeatmap(patientsById.top(Infinity));
}

function updateWidgets() {
    var filtered = window.filtered;
    if (filtered) {
        otherCrossFilterDimensions.forEach(function (dimension) {
            var found = false;
            var low;
            var high;
            filtered.forEach(function (f) {
                if (f.dimension == dimension.key) {
                    found = true;
                    low = f.lower;
                    high = f.high;
                }
            });
            if (found) {
                dimension.crossDim.filter([low, high])
            } else {
                dimension.crossDim.filter(null);
            }
        });
    }

    // create the charts
    for (var i = 0; i < otherCrossFilterDimensions.length; i++) {
        var crossDimension = otherCrossFilterDimensions[i].crossDim;
        switch (otherCrossFilterDimensions[i].key) {
            case icpc:
                icpcChart.createChart(crossDimension);
                break;
            case medication:
                medicationChart.createChart(crossDimension);
                break;
            case medicationGroup:
                medicationGroupChart.createChart(crossDimension);
                break;
            case mainIcpc:
                mainIcpcChart.createChart(crossDimension);
                break;
            case age:
                genderAgeChart.prepareData(crossDimension, patientsByGender);
        }
    }
    var filteredData = otherCrossFilterDimensions[0].crossDim.top(Infinity);
    refreshTable(null, filteredData, true);
    window.filtered = undefined;

    createHeatmap(filteredData);
    renderPaths();
}


function applyFilter(dimensionElement, filter) {
    dimensionElement.crossDimension.filter(filter);
    // Start drawing the selection box.
    drawSelectionbox();
    updateWidgets();
}

/*
 * Draw the svg's
 */
var svgContainer = d3.select("#patient_filter")
    .attr("height", 20 * height + marginTop + marginBottom + missingMarging)
    .append("svg")
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom + missingMarging)
    .append("g").attr("transform", "translate(0,20)") // hack since chrome won't allow a translate on svg yet
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom + missingMarging)
    .attr("class", "container")
    .on("mousemove", function () {
        var i = selectionI;
        var lastMousePosition = d3.mouse(this)[1];
        var startPosition = 0;
        var offset;
        if (mouseDown) {
            startPosition = selectionBoxStarts[i];
            if (!dragging) {
                selectionBoxHeights[i] = Math.abs(lastMousePosition - startPosition);
                selectionBoxEnds[i] = lastMousePosition;
            }
            if (dragging) {
                offset = lastMousePosition - mousePositionY;
                startPosition = selectionBoxInitStarts[i] + offset;
                selectionBoxStarts[i] = d3.max([yZero, startPosition]);
                selectionBoxEnds[i] = d3.min([height - yZero, selectionBoxInitEnds[i] + offset]);
            }
            var dimensionElement = parcoordsCrossfilterDimensions[i];
            var min = dimensionElement.min;
            var max = dimensionElement.max;


            // Adapt the filters to the new ranges.
            var filter;
            if (startPosition < selectionBoxEnds[i]) {
                filter = [yToValue(startPosition, min, max), yToValue(selectionBoxEnds[i], min, max)];
            } else {
                filter = [yToValue(selectionBoxEnds[i], min, max), yToValue(startPosition, min, max)];
            }
            applyFilter(dimensionElement, filter);
        }
    })
    .on("mouseup", function () {
        mouseDown = false;
        if ((+new Date() - clickTime) < 250) {
            selectionBoxHeights[selectionI] = 0;
            selectionBoxStarts[selectionI] = 0;
            selectionBoxEnds[selectionI] = 0;
            parcoordsCrossfilterDimensions[selectionI].crossDimension.filter(null);
            updateWidgets();
            d3.select("#selectionBox-" + selectionI).attr("height", 0);
            dragging = false;
        }
    });

var pathContainer = svgContainer.append("svg")
    .attr("width", myInnerWidth)
    .attr("height", myInnerHeight + missingMarging);

var brushContainer = svgContainer.append("svg")
    .attr("width", myInnerWidth)
    .attr("height", myInnerHeight);

function inSelectionBox(i, position) {
    var start = selectionBoxStarts[i];
    var end = selectionBoxEnds[i];
    var temp;
    if (start > end) {
        temp = end;
        end = start;
        start = temp;
    }
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
            if (dragging) {
                selectionBoxInitStarts[i] = selectionBoxStarts[i];
                selectionBoxInitEnds[i] = selectionBoxEnds[i];
            }
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
        var min = parcoordsCrossfilterDimensions[h].min;
        var max = parcoordsCrossfilterDimensions[h].max;
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
                return xZero + widthBetween * h - selectionAreaWidth / 1.5 - 2;
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

function tempFunction(i, j) {
    return sortedData[i].sort(function (a, b) {
        return +b[dimensions[j]] - +a[dimensions[j]]
    })
}

function renderPaths() {
    // Convert the data to coordinates
    var dataCoordinates = [];
    var count = 0;
    allData.forEach(function (d) {
        var color = "steelblue";
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
                    var yInit = height + missingMarging - (sortedData[i].indexOf(d) * lineMargin);
                    pathCoordinates.push({
                        x: xZero,
                        y: yInit
                    });
                    var nextIndex = tempFunction(i, (i + l) + 1).indexOf(d);
                    //var nextIndex = sortedData[(i + l) + 1].indexOf(d);
                    var x2 = xZero + widthBetween * ((i + l) + 1) - nextIndex * lineMargin;
                    pathCoordinates.push({
                        x: x2,
                        y: yInit
                    });

                    var boundNext = parcoordsCrossfilterDimensions[(i + l) + 1];
                    var yNext = valueToY(d[dimensions[(i + l) + 1]], boundNext.min, boundNext.max);

                    pathCoordinates.push({
                        x: x2,
                        y: yNext
                    });
                    pathCoordinates.push({
                        x: (xZero + widthBetween * ((i + l) + 1)),
                        y: yNext
                    });
                } else {
                    var x = xZero + tempFunction(i, i - 1).indexOf(d) * lineMargin + widthBetween * (i - 1);
                    var y = valueToY(d[dimensions[i - 1]], parcoordsCrossfilterDimensions[i - 1].min, parcoordsCrossfilterDimensions[i - 1].max);
                    pathCoordinates.push({
                        x: x,
                        y: y
                    });
                    pathCoordinates.push({
                        x: x,
                        y: height + missingMarging - (sortedData[i].indexOf(d) * lineMargin)
                        //y: height + missingMarging - (sortedData[i - 1].indexOf(d) * lineMargin)
                    });
                    if (i < dimensions.length - 2) {
                        var nextIndex = tempFunction(i, i - 1).indexOf(d);
                        //var nextIndex = sortedData[(i + l) + 1].indexOf(d);
                        var x2 = xZero + widthBetween * ((i + l) + 1) - nextIndex * lineMargin;
                        //var x2 = xZero + widthBetween * ((i + l) + 1) - nextIndex * lineMargin;
                        pathCoordinates.push({
                            x: x2,
                            y: height + missingMarging - (sortedData[i].indexOf(d) * lineMargin)
                            //y: height + missingMarging - (sortedData[i - 1].indexOf(d) * lineMargin)
                        });

                        var boundNext = parcoordsCrossfilterDimensions[(i + l) + 1];
                        var yNext = valueToY(d[dimensions[(i + l) + 1]], boundNext.min, boundNext.max);

                        pathCoordinates.push({
                            x: x2,
                            y: yNext
                        });
                        pathCoordinates.push({
                            x: (xZero + widthBetween * ((i + l) + 1)),
                            y: yNext
                        });
                    } else { // voorlaatste
                        pathCoordinates.push({
                            x: xZero + widthBetween * (dimensions.length - 1),
                            y: height + missingMarging - (sortedData[i].indexOf(d) * lineMargin)
                            //y: height + missingMarging - (sortedData[i - 1].indexOf(d) * lineMargin)
                        });
                    }
                }

                count = count + 1;
                i = (i + l) + 1;
            } else {
                var yValue = valueToY(d[dimensions[i]], parcoordsCrossfilterDimensions[i].min, parcoordsCrossfilterDimensions[i].max);
                pathCoordinates.push({x: (xZero + widthBetween * i), y: yValue});
            }
        }
        var selected = parcoordsCrossfilterDimensions[0].crossDimension.top(Infinity).indexOf(d) !== -1;
        dataCoordinates.push({
            coordinates: pathCoordinates,
            selected: selected,
            color: color,
            patient: d
        });
    });


    var filteredIds = [];

    // Draw the actual paths
    var paths = pathContainer.selectAll('path')
        .data(dataCoordinates);

    paths
        .enter()
        .append('path')
        .attr('id', function (d) {
            return "path-" + d.patient.id;
        })
        .attr('d', function (d) {
            return lineInterpolation(d.coordinates);
        })
        .attr('fill', 'none')
        .style('stroke-width', 1)
        .style('stroke', colorSelected)
        .on('click', function (d) {
            var index = filteredIds.indexOf(+d.patient.id);
            if (index > -1) {
                filteredIds.splice(index, 1);
            } else {
                filteredIds.push(+d.patient.id);
            }
            if (filteredIds.length === 0) {
                patientsById.filter(null);
            } else {
                patientsById.filter(function (p) {
                    return filteredIds.indexOf(+p) != -1;
                });
            }
            updateWidgets();
        })
        .on('mouseover', function (d) {
            if (d.selected) {
                d3.select(this)
                    .style('stroke', colorHighlightSelected)
                    .style('stroke-width', 2);
            } else {
                d3.select(this)
                    .style('stroke', colorHighlightNotSelected)
                    .style('stroke-width', 1);
            }

            myQualitativeDimensions.forEach(function (a) {
                d3.select("#bar-" + d.patient[a].replace(/\s/g, '')).style('fill', colorHighlightSelected);
            });

            createHeatmap([d.patient]);
        })
        .on('mouseout', function (d) {
            if (d.selected) {
                d3.select(this)
                    .style('stroke', colorSelected)
                    .style('stroke-width', 1);
            } else {
                d3.select(this)
                    .style('stroke', colorNotSelected)
                    .style('stroke-width', 1);
            }
            myQualitativeDimensions.forEach(function (a) {
                d3.select("#bar-" + d.patient[a].replace(/\s/g, '')).style('fill', colorSelected);
            });

            createHeatmap(patientsById.top(Infinity));

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
        .attr("class", "selectionBox")
        .style("cursor", 'move');

    selectionBox
        .attr('height', function (d, i) {
            if (d === undefined) {
                return 0;
            } else {
                if (selectionBoxStarts[i] < selectionBoxEnds[i]) {
                    return d3.min([d, height - selectionBoxStarts[i]]);
                } else {
                    if (selectionBoxEnds[i] < yZero) {
                        return d3.max([0, selectionBoxStarts[i] - yZero]);
                    } else {
                        return d;
                    }
                }

            }
        })
        .attr("y", function (d, i) {
            if (selectionBoxStarts[i] < selectionBoxEnds[i]) {
                return d3.max([yZero, selectionBoxStarts[i]]);
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