var margin = {top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft};
//width = 960 - margin.left - margin.right,
//height = 500 - margin.top - margin.bottom;

var width = 3 * widgetWidth + 2 * gridMargin - marginLeft - marginRight;
//this.height = 10000;// + nbBarsVariable * gap;
var height = 40 * widgetHeight - marginTop - marginBottom;// + nbBarsVariable * gap;

var canvas = d3.select("#patients2")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var headerGrp = canvas.append("g").attr("class", "headerGrp");
var rowsGrp = canvas.append("g").attr("class", "rowsGrp");

var elements = [name, careGiver, degree, religion, income];

var fieldHeight = 50;
var fieldWidth = width / elements.length;

var previousSort = null;
var format = d3.time.format("%a %b %d %Y");

var internalData = null;

var sortTriggered = true;
var previousSortI = -1;

function refreshTable(sortOn, filteredData, reset) {

    if (reset) {
        for (var j = 0; j < elements.length; j++) {
            d3.select("#arrowup-" + j).style("visibility", "visible");
            d3.select("#arrowdown-" + j).style("visibility", "visible");
        }
    }

    gridster.resize_widget($("#patients2"), 3, Math.ceil((fieldHeight * (filteredData.length + 1)) / widgetHeight));

    internalData = filteredData;

    // create the table header
    var header = headerGrp.selectAll("g")
        .data(elements)
        .enter().append("g")
        .attr("class", "header")
        .attr("transform", function (d, i) {
            return "translate(" + i * fieldWidth + ",0)";
        })
        .on("click", function (d, i) {
            if (previousSortI !== i) {
                sortTriggered = false;
            }
            for (var j = 0; j < elements.length; j++) {
                if (j === i) {
                    if (!sortTriggered) {
                        d3.select("#arrowup-" + i).style("visibility", "visible");
                        d3.select("#arrowdown-" + i).style("visibility", "hidden");
                    } else {
                        d3.select("#arrowup-" + i).style("visibility", "hidden");
                        d3.select("#arrowdown-" + i).style("visibility", "visible");
                    }
                    sortTriggered = !sortTriggered;
                } else {
                    d3.select("#arrowup-" + j).style("visibility", "visible");
                    d3.select("#arrowdown-" + j).style("visibility", "visible");
                }
            }
            previousSortI = i;
            return refreshTable(d, internalData, false);
        });

    header.append("rect")
        .attr("width", fieldWidth - 1)
        .attr("height", fieldHeight);

    header.append("text")
        .attr("x", fieldWidth / 2)
        .attr("y", fieldHeight / 2)
        .attr("dy", ".35em")
        .text(String);

    header
        .append("image")
        .attr("id", function (d, i) {
            return "arrowup-" + i;
        })
        .attr("xlink:href", "http://uxrepo.com/download.php?img=static/icon-sets/font-awesome/svg/sort-up.svg&color=FFFFFF")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", fieldWidth - 30)
        .attr("y", fieldHeight / 2 - 10);

    header
        .append("image")
        .attr("id", function (d, i) {
            return "arrowdown-" + i;
        })
        .attr("xlink:href", "http://uxrepo.com/download.php?img=static/icon-sets/font-awesome/svg/sort-down.svg&color=FFFFFF")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", fieldWidth - 30)
        .attr("y", fieldHeight / 2 - 10);

    // fill the table
    // select rows
    var rows = rowsGrp.selectAll("g.row").data(internalData,
        function (d) {
            return d.id;
        });

    // create rows
    rows.enter().append("svg:g")
        .attr("class", "row")
        .on("click", function (d) {
            //d3.select("cell-" + d.id).style("fill", function () {
            //    return colorHighlightSelected;
            //});
            console.log(d);
        })
        //.on("mouseover", function (d) {
        //    //d3.select("cell-" + d.id).style("fill", function () {
        //    //    return colorHighlightSelected;
        //    //});
        //
        //})
        //.on("mouseout", function (d) {
        //
        //})
    ;

    rows.exit().remove();


    // select cells
    var cells = rows.selectAll("g.cell").data(function (d) {
        var returnArray = [];
        elements.forEach(function (e) {
            if (e === income) {
                returnArray.push("€ " + Math.round(d[e]));
            } else {
                returnArray.push(d[e]);
            }
        });
        return returnArray;
    });

    // create cells
    cells.enter().append("svg:g")
        .attr("class", "cell")
        .attr("transform", function (d, i) {
            return "translate(" + i * fieldWidth + ",0)";
        });

    cells
        .append("rect")
        .attr("width", fieldWidth - 1)
        .attr("height", fieldHeight);

    cells.append("text")
        .attr("x", fieldWidth / 2)
        .attr("y", fieldHeight / 2)
        .attr("dy", ".35em")
        .text(String);

    cells.exit().remove();

    if (sortOn !== previousSort) {
        rows.sort(function (a, b) {
            return sort(a[sortOn], b[sortOn]);
        });
        previousSort = sortOn;
    }
    else {
        rows.sort(function (a, b) {
            return sort(b[sortOn], a[sortOn]);
        });
        previousSort = null;
    }
    rows.transition()
        .duration(5 * transitionDuration)
        .attr("transform", function (d, i) {
            return "translate(0," + (i + 1) * (fieldHeight + 1) + ")";
        });
}

function sort(a, b) {
    if (typeof a == "string") {
        var parseA = format.parse(a);
        if (parseA) {
            var timeA = parseA.getTime();
            var timeB = format.parse(b).getTime();
            return timeA > timeB ? 1 : timeA == timeB ? 0 : -1;
        }
        else
            return a.localeCompare(b);
    }
    else if (typeof a == "number") {
        return a > b ? 1 : a == b ? 0 : -1;
    }
    else if (typeof a == "boolean") {
        return b ? 1 : a ? -1 : 0;
    }
}