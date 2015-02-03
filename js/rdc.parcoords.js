/**
 * Created by robindecroon on 27/01/2015.{}
 */
var marginHack = 20;
var marginLeft = 50, marginRight = 50 + marginHack, marginBottom = 50 + marginHack, marginTop = 50;

var dimensions = ["age", "heartrate", "systolic blood pressure", "diastolic blood pressure", "weight", "bmi"];

var bounds = [];
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

// Draw the axes
var axis = svgContainer.selectAll("line")
    .data(dimensions)
    .enter()
    .append("line")
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

var axesLabel = svgContainer.selectAll('text')
    .data(dimensions)
    .enter()
    .append('text')
    .attr("x", function (d,i) {
        return xZero + widthBetween * i;
    })
    .attr("y", function (d,i) {
        return yZero - 10;
    })
    .text(function (d) {
        return d;
    })
    .attr("text-anchor","middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("fill", "grey");

var line = d3.svg.line()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    })
    .interpolate('linear');

function render(data) {
    var path = svgContainer.selectAll('path')
        .data(data);
    path
        .enter()
        .append('path')
        .attr('d', function (d) {
            return line(d);
        })
        .attr('fill', 'none')
        .style('stroke-width', 1)
        .style('stroke', 'steelblue');

    path.attr('d', function (d) {
        return line(d);
    }).attr('fill', 'none').style('stroke-width', 1)
        .style('stroke', 'steelblue');

    path.exit().remove();
}

// read the data
d3.csv("../data/testdata24.csv", function (error, data) {
    data = data.filter(function (d) {
        return d.bmi !== "NA"
    });
    data = data.filter(function (d) {
        return d.age !== "NA"
    });

    dimensions.forEach(function (dim) {
        var values = data.map(function (d) {
            return +d[dim]
        });
        bounds.push({dimension: dim, min: d3.min(values), max: d3.max(values)});
    });

    render(prepareXY(data));
});


function prepareXY(data) {
    var result = [];
    data.forEach(function (d) {
        var temp = [];
        for (var i = 0; i < dimensions.length; i++) {
            var bound = bounds.filter(function (b) {
                return b.dimension === dimensions[i]
            })[0];
            var yValue = yZero + (height - yZero) * ((+d[dimensions[i]] - bound.min) / (bound.max - bound.min));
            temp.push({x: (xZero + widthBetween * i), y: yValue})
        }
        result.push(temp);
    });
    return result;
}