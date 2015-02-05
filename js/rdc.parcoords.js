/**
 * Created by robindecroon on 27/01/2015.{}
 */
var marginHack = 20;
var marginLeft = 50, marginRight = 50 + marginHack, marginBottom = 50 + marginHack, marginTop = 50;

var dimensions = ["age", "heartrate", "systolic blood pressure", "diastolic blood pressure", "weight", "bmi"];

var dimensionArray = [];
var innerWidth = window.innerWidth - marginHack;
var innerHeight = (window.innerHeight - marginHack) / 1;

var width = innerWidth - marginLeft - marginRight;
var height = innerHeight - marginTop - marginBottom;

var widthBetween = width / dimensions.length;
var xZero = marginLeft + (width / dimensions.length) / 2;
var yZero = marginTop;

var svgContainer = d3.select("body").append("svg")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

// Draw the axesScales
var axis = svgContainer.selectAll("lineInterpolation")
    .data(dimensions)
    .enter()
    .append("lineInterpolation")
    .attr("stroke", "gray")
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

var selectionAreaWidth = 40;
// Draw the selectionAreas
var selectionAreas = svgContainer.selectAll("rect")
    .data(dimensions)
    .enter()
    .append("rect")
    .attr("id", function (d, i) {
        return "selectionArea-" + d;
    })
    .attr("x", function (d, i) {
        return (xZero + widthBetween * i) - selectionAreaWidth / 2;
    })
    .attr("y", function (d, i) {
        return yZero;
    })
    .attr("width", selectionAreaWidth)
    .attr("height", height);

var axesLabel = svgContainer.selectAll('text')
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
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("fill", "grey");

var lineInterpolation = d3.svg.line()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    })
    .interpolate('linear');

function render(dataCoordinates) {
    var path = svgContainer.selectAll('path')
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
                return 'steelblue';
            } else {
                return 'red';
            }
        });

    path.exit().remove();
}

var allData;
var dataElements;
var dataDimensions;

// read the data
d3.csv("../data/testdata24.csv", function (error, data) {
    data = data.filter(function (d) {
        return d.bmi !== "NA"
    });
    data = data.filter(function (d) {
        return d.age !== "NA"
    });

    allData = data;
    dataElements = crossfilter(data);

    for (var i = 0; i < dimensions.length; i++) {
        var dim = dimensions[i];
        var values = data.map(function (d) {
            return +d[dim]
        });
        dimensionArray.push({
            dimension: dim,
            min: d3.min(values),
            max: d3.max(values),
            crossDimension: dataElements.dimension(function (d) {
                return d[dim];
            })
        });
    }
    render(prepareXY(data));
});


function prepareXY(data) {
    var result = [];
    data.forEach(function (d) {
        var temp = [];
        for (var i = 0; i < dimensions.length; i++) {
            var bound = dimensionArray.filter(function (b) {
                return b.dimension === dimensions[i]
            })[0];
            var yValue = valueToY(d[dimensions[i]], bound.min, bound.max);
            temp.push({x: (xZero + widthBetween * i), y: yValue})
        }
        result.push({coordinates: temp, selected: d.selected === "true"});
    });
    return result;
}

var firstMousePosition;
var mouseDown = false;

svgContainer.on("mousedown", function () {
    return false;
});

selectionAreas.on("mousedown", function (d, i) {
    firstMousePosition = d3.mouse(this)[1];
    mouseDown = true;
});

selectionAreas.on("mousemove", function (d, i) {
    if (mouseDown) {
        var selection = d3.selectAll("rect").data([d]);
        selection.enter().append("rect")
            .attr("x", function () {
                return (xZero + widthBetween * i) - selectionAreaWidth / 2;
            })
            .attr("y", function () {
                return firstMousePosition;
            })
            .attr("width", selectionAreaWidth + 50);

        selection.attr("height",Math.abs(d3.mouse(this)[1] - firstMousePosition));

        //selection.exit().remove();

        //selectedDimensions.push({dimension: d, height:Math.abs(d3.mouse(this)[1] - firstMousePosition)});
    }
});

selectionAreas.on("mouseup", function (d, index) {
    mouseDown = false;
    var lastMousePosition = d3.mouse(this)[1];
    var dimensionElement = dimensionArray.filter(function (b) {
        return b.dimension === d;
    })[0];
    var tmp = firstMousePosition;
    if (lastMousePosition < firstMousePosition) {
        firstMousePosition = lastMousePosition;
        lastMousePosition = tmp;
    }
    var previousSelection = dimensionElement.crossDimension.top(Infinity);

    dimensionElement.crossDimension.filter([yToValue(firstMousePosition, dimensionElement.min, dimensionElement.max), yToValue(lastMousePosition, dimensionElement.min, dimensionElement.max)]);
    var selection = dimensionElement.crossDimension.top(Infinity);
    if (selection.length == 0) {
        dimensionElement.crossDimension.filter(null);
        //selection = dimensionElement.crossDimension.top(Infinity);;
    }
    allData.forEach(function (d) {
        if (selection.indexOf(d) !== -1) {
            d.selected = "true";
        }
        else {
            d.selected = "false";
        }
    });
    render(prepareXY(allData));

});

function yToValue(y, min, max) {
    return (y - yZero) / (height - yZero) * (max - min) + min;
}

function valueToY(value, min, max) {
    return yZero + (height - yZero) * ((+value - min) / (max - min));
}

