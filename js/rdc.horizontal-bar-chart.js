function HorizontalChart(divID, title, field) {

    this.nbBarsVariable = Math.floor(widgetHeight / 25);
    this.gap = 0.5;
    this.left_width = 75;
    this.titleOffset = 15;

    this.width = widgetWidth - marginLeft - marginRight;
    this.height = widgetHeight - marginTop - marginBottom;// + nbBarsVariable * gap;

    this.internalChart = d3.select(divID)
        .append('svg')
        .attr('width', this.width + marginLeft + marginRight)
        .attr('height', this.height + marginTop + marginBottom);

    this.internalChart.append("text")
        .attr("x", this.width / 2 + marginLeft)
        .attr("y", marginTop / 2 + this.titleOffset)
        .attr("text-anchor", "middle")
        .attr("class", "chart-title")
        .text(title);

    this.lowerLayer = this.internalChart.append("g")
        .attr("transform", translation(marginLeft, marginTop + this.titleOffset));

    this.middleLayer = this.internalChart.append("g")
        .attr("transform", translation(marginLeft, marginTop + this.titleOffset));

    this.upperLayer = this.internalChart.append("g")
        .attr("transform", translation(marginLeft, marginTop + this.titleOffset));

    this.field = field;

    this.currentFilter;
}

HorizontalChart.prototype.createChart = function (crossfilterDimension) {


    var _this = this;

    var nbBars = _this.nbBarsVariable;

    var valueCountByType = crossfilterDimension.group();
    var chartDict = valueCountByType.top(nbBars);
    if (_this.currentFilter) {
        chartDict = chartDict.filter(function (d) {
            return d.key === _this.currentFilter;
        });
    }

    var tempCount = chartDict.filter(function (d) {
        return d.value !== 0;
    });

    nbBars = d3.min([nbBars, tempCount.length]);
    chartDict = chartDict.slice(0, nbBars);

    //calculate height
    var barHeight = (_this.height / nbBars) - ((nbBars + 1) * _this.gap + 2 * _this.gap);

    var x = d3.scale.linear()
        .domain([0, d3.max(chartDict, function (d) {
            return d.value;
        })])
        .range([0, _this.width - _this.left_width]);

    var yValues = [];
    chartDict.forEach(function (d) {
        yValues.push(d.key);
    });

    var y = d3.scale.ordinal()
        .domain(yValues)
        .rangeBands([0, _this.height]);


    var lines = _this.upperLayer.selectAll("line")
        .data(x.ticks(d3.min([5, d3.max(chartDict, function (d) {
            return d.value;
        })])));
    lines
        .enter().append("line");
    lines
        .transition().duration(transitionDuration)
        .attr("class", "axisHelpLines")
        .attr("x1", function (d) {
            return x(d) + _this.left_width;
        })
        .attr("x2", function (d) {
            return x(d) + _this.left_width;
        })
        .attr("y1", 0)
        .attr("y2", _this.height);
    lines.exit().remove();

    var textNames = _this.lowerLayer.selectAll("text.axisText")
        .data(chartDict);
    textNames
        .enter().append("text");
    textNames
        .attr('class', 'axisText')
        .transition().duration(transitionDuration)
        .attr("x", 0)
        .attr("y", function (d) {
            return y(d.key) + y.rangeBand() / 2 - 2 * _this.gap;
        })
        .attr("dy", ".36em")
        .attr("text-anchor", "left")
        .text(function (d) {
            var text = d.key;
            return text.slice(0, 15);
        });
    textNames.exit().remove();

    var bars = _this.middleLayer.selectAll("rect")
        .data(chartDict);
    bars
        .enter().append("rect");

    bars
        .transition().duration(transitionDuration)
        .attr("class", "bar")
        .attr("id", function (d) {
            return "bar-" + d.key.replace(/\s/g, '');
        })
        .attr("x", this.left_width)
        .attr("y", function (d) {
            return y(d.key) + _this.gap;
        })
        .attr("width", function (d) {
            return x(d.value);
        })
        .attr("height", barHeight)
        .style("fill", function () {
            if (_this.currentFilter) {
                return colorHighlightSelected;
            }
            else {
                return colorSelected;
            }
        });

    bars.exit().remove();

    bars
        .on("click", function (d) {
            // "<a href=\"#mainIcpc\" class=\"lightview\">Inline</a>"
            //Lightview.show(document.getElementById("testdiv"));
            if (_this.currentFilter === undefined) {
                _this.currentFilter = d.key;
                crossfilterDimension.filter(_this.currentFilter);
                updateWidgets();
                highLightByKeyValue(_this.field, d.key);
            } else {
                _this.currentFilter = undefined;
                crossfilterDimension.filter(null);
                updateWidgets();
            }
        })
        .on("mouseover", function (d) {
            highLightByKeyValue(_this.field, d.key);
            d3.select(this).style("fill", function () {
                return colorHighlightSelected;
            });
        })
        .on("mouseout", function (d) {
            revertHighLightByKeyValue(_this.field, d.key);
            d3.select(this).style("fill", function () {
                if (_this.currentFilter) {
                    return colorHighlightSelected;
                }
                else {
                    return colorSelected;
                }
            });
        });

    var textScores = _this.middleLayer.selectAll("text.barText")
        .data(chartDict);
    textScores
        .enter().append("text");
    textScores
        .transition().duration(transitionDuration)
        .attr("x", function (d) {
            return x(d.value) + _this.left_width;
        })
        .attr("y", function (d) {
            return y(d.key) + y.rangeBand() / 2;
        })
        .attr("dx", -5)
        .attr("dy", 0)
        .attr("text-anchor", "end")
        .attr('class', 'barText')
        .text(function (d) {
            return d.value;
        });
    textScores.exit().remove();
}
;