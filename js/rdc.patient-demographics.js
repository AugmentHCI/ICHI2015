width = widgetWidth - marginLeft - marginRight;
height = widgetHeight - marginTop - marginBottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], 0.1);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var chart = d3.select("#demographics")
    .append("svg:svg")
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom)
    .append("g")
    .attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

function update(data) {
    x.domain(data.map(function (d) {
        return d.name;
    }));
    y.domain([0, d3.max(data, function (d) {
        return d.gewicht;
    })]);

    chart.select(".x.axis").remove(); // << this line added
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    chart.select(".y.axis").remove(); // << this line added
    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    var bar = chart.selectAll(".bar")
        .data(data, function (d) {
            return d.name;
        });

    // new data:
    bar.enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.name);
        })
        .attr("y", function (d) {
            return y(d.gewicht);
        })
        .attr("height", function (d) {
            return height - y(d.gewicht);
        })
        .attr("width", x.rangeBand());
    // removed data:
    bar.exit().remove();
    //// updated data:
    bar
        .transition().duration(transitionDuration)
        .attr("y", function (d) {
            return y(d.gewicht);
        })
        .attr("x", function (d) {
            return x(d.name);
        })
        .attr("width", x.rangeBand())
        .attr("height", function (d) {
            return height - y(d.gewicht);
        });

}