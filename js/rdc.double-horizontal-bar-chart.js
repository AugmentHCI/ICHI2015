function DoubleHorizontalBarChart(divID, title, var1, var2, field) {

    this.gap = 0.5;
    this.tickSize = 5;
    this.titleOffset = 15;

    this.var1 = var1;
    this.var2 = var2;

    this.width = widgetWidth - marginLeft - marginRight;
    this.height = widgetHeight - marginTop - marginBottom;

    // the width of each side of the chart
    this.regionWidth = this.width / 2 - marginMiddle;

    // these are the x-coordinates of the y-axes
    this.pointA = this.regionWidth;
    this.pointB = this.width - this.regionWidth;


    // CREATE SVG
    this.internalChart = d3.select(divID).append('svg')
        .attr('width', marginLeft + this.width + marginRight)
        .attr('height', marginTop + this.height + marginBottom);

    this.internalChart.append("text")
        .attr("x", width / 2 + marginLeft)
        .attr("y", marginTop / 2 + this.titleOffset)
        .attr("text-anchor", "middle")
        .attr("class", "chart-title")
        .text(title);

    this.lowerLayer = this.internalChart.append('g')
        .attr('transform', translation(marginLeft, marginTop + this.titleOffset));

    this.middleLayer = this.internalChart.append('g')
        .attr('transform', translation(marginLeft, marginTop + this.titleOffset));

    this.upperLayer = this.internalChart.append('g')
        .attr('transform', translation(marginLeft, marginTop + this.titleOffset));

    this.upperRightLayer = this.internalChart.append('g')
        .attr('transform', translation(marginLeft, marginTop + this.titleOffset));

    this.currentLeftFilter;
    this.currentRightFilter;

}

DoubleHorizontalBarChart.prototype.prepareData = function (ageDimension, genderDimension) {

    // age en gender filter toevoegen

    var _this = this;

    // empty JSON
    var groups = resetData();
    var groupNames = groups.map(function (d) {
        return d.group;
    });

    var yScale = d3.scale.ordinal()
        .domain(groupNames)
        .rangeBands([this.height, 0]);

    _this.lowerLayer.selectAll("text.axisText")
        .data(groupNames)
        .enter().append("text")
        .attr('class', 'axisText')
        .attr("x", this.pointA + marginMiddle)
        .attr("y", function (d) {
            return yScale(d) + yScale.rangeBand() / 2;
        })
        .attr("dy", ".36em")
        .attr("text-anchor", "middle")
        .text(String);

    var data = ageDimension.top(Infinity);


    data.forEach(function (patient) {
        var groupID = Math.floor(patient[_this.var1] / 10);
        if (patient[_this.var2] === 'male') {
            groups[groupID].male++;
        } else {
            groups[groupID].female++;
        }
    });

    // GET THE TOTAL POPULATION SIZE AND CREATE A FUNCTION FOR RETURNING THE PERCENTAGE
    var totalPopulation = d3.sum(groups, function (d) {
            return d.male + d.female;
        }),
        percentage = function (d) {
            if (totalPopulation === 0) return 0;
            return d / totalPopulation;
        };

    // find the maximum data value on either side
    //  since this will be shared by both of the x-axes
    var maxValue = Math.max(
        d3.max(groups, function (d) {
            return percentage(d.male);
        }),
        d3.max(groups, function (d) {
            return percentage(d.female);
        })
    );

// SET UP SCALES

// the xScale goes from 0 to the width of a region
//  it will be reversed for the left x-axis
    var xScale = d3.scale.linear()
        .domain([0, maxValue])
        .range([0, _this.regionWidth])
        .nice();

    var xScaleRight = xScale.copy().range([_this.pointA, 0]);

    var lines = _this.upperRightLayer.selectAll("line")
        .data(xScaleRight.ticks(5));
    lines
        .enter().append("line");
    lines
        .transition().duration(transitionDuration)
        .attr("class", "axisHelpLines")
        .attr("x1", function (d) {
            return _this.pointB + xScaleRight(d);
        })
        .attr("x2", function (d) {
            return _this.pointB + xScaleRight(d);
        })
        .attr("y1", 0)
        .attr("y2", _this.height);
    lines.exit().remove();

    var lines2 = _this.upperLayer.selectAll("line")
        .data(xScale.ticks(5));
    lines2
        .enter().append("line");
    lines2
        .transition().duration(transitionDuration)
        .attr("class", "axisHelpLines")
        .attr("x1", function (d) {
            return xScale(d);
        })
        .attr("x2", function (d) {
            return xScale(d);
        })
        .attr("y1", 0)
        .attr("y2", _this.height);
    lines2.exit().remove();


    // DRAW BARS
    var leftBars = _this.lowerLayer.selectAll('.bar.left')
        .data(groups);

    leftBars
        .enter().append('rect')
        .attr('class', 'bar left')
        .attr('transform', translation(_this.pointA, 0) + 'scale(-1,1)')
        .attr('x', 0)
        .attr('height', yScale.rangeBand() - groupNames.length * _this.gap);

    leftBars
        .transition().duration(transitionDuration)
        .attr('y', function (d) {
            return yScale(d.group) + _this.gap;
        })
        .attr('width', function (d) {
            return xScale(percentage(d.male));
        });

    leftBars.exit().remove();

    leftBars.on("click", function (d) {
        if (_this.currentLeftFilter === undefined) {
            _this.currentLeftFilter = d.group.split("-");
            ageDimension.filter(_this.currentLeftFilter);
            genderDimension.filter('male');
            updateWidgets();
            highLight(d, 'male');
        } else {
            _this.currentLeftFilter = undefined;
            ageDimension.filter(null);
            genderDimension.filter(null);
            revertHighLight(d, 'male');
            updateWidgets();
        }
    })
        .on("mouseover", function (d) {
            highLight(d, "male");

            d3.select(this).style("fill", function () {
                return colorHighlightSelected;
            });
        })
        .on("mouseout", function (d) {
            revertHighLight(d, "male");
            d3.select(this).style("fill", function () {
                return colorSelected;
            });
        });

    var rightBars = _this.lowerLayer.selectAll('.bar.right')
        .data(groups);

    rightBars
        .enter().append('rect')
        .attr('class', 'bar right')
        .attr('transform', translation(_this.pointB, 0))
        .attr('x', 0)
        .attr('height', yScale.rangeBand() - groupNames.length * _this.gap);

    rightBars
        .transition().duration(transitionDuration)
        .attr('y', function (d) {
            return yScale(d.group) + _this.gap;
        })
        .attr('width', function (d) {
            return xScale(percentage(d.female));
        });

    rightBars.exit().remove();

    rightBars
        .on("click", function (d) {
            if (_this.currentRightFilter === undefined) {
                _this.currentRightFilter = d.group.split("-");
                ageDimension.filter(_this.currentRightFilter);
                genderDimension.filter("female");
                updateWidgets();
                highLight(d, 'female');
            } else {
                _this.currentRightFilter = undefined;
                ageDimension.filter(null);
                genderDimension.filter(null);
                revertHighLight(d, 'female');
                updateWidgets();
            }
        })
        .on("mouseover", function (d) {
            highLight(d, "female");

            d3.select(this).style("fill", function () {
                return colorHighlightSelected;
            });
        })
        .on("mouseout", function (d) {
            revertHighLight(d, "female");
            d3.select(this).style("fill", function () {
                return "#fa9fb5";
            });
        });


    var leftGenderAgeTextScores = _this.upperLayer.selectAll("text.barTextR")
        .data(groups);
    leftGenderAgeTextScores
        .enter().append("text");
    leftGenderAgeTextScores
        .transition().duration(transitionDuration)
        .attr("x", function (d) {
            return xScale(percentage(d.female)) + widgetWidth / 2 + marginMiddle;
        })
        .attr("y", function (d) {
            return yScale(d.group) + yScale.rangeBand() / 2 + _this.gap;
        })
        .attr("dx", -35)
        .attr("dy", 0)
        .attr("text-anchor", "end")
        .attr('class', 'barTextR')
        .text(function (d) {
            if (d.female !== 0) {
                return d3.format('%')(percentage(d.female));
            }
        });
    leftGenderAgeTextScores.exit().remove();

    var rightGenderAgeTextScores = _this.upperLayer.selectAll("text.barText")
        .data(groups);
    rightGenderAgeTextScores
        .enter().append("text");
    rightGenderAgeTextScores
        .transition().duration(transitionDuration)
        .attr("x", function (d) {
            return widgetWidth / 2 - xScale(percentage(d.male)) - marginLeft - marginBottom;
        })
        .attr("y", function (d) {
            return yScale(d.group) + yScale.rangeBand() / 2 + _this.gap;
        })
        .attr("dx", +30)
        .attr("dy", 0)
        .attr("text-anchor", "end")
        .attr('class', 'barText')
        .text(function (d) {
            if (d.male != 0)
                return d3.format('%')(percentage(d.male));
        });
    rightGenderAgeTextScores.exit().remove();

};

// so sick of string concatenation for translations
function translation(x, y) {
    return 'translate(' + x + ',' + y + ')';
}

function resetData() {
    return [
        {group: '0-9', male: 0, female: 0},
        {group: '10-19', male: 0, female: 0},
        {group: '20-29', male: 0, female: 0},
        {group: '30-39', male: 0, female: 0},
        {group: '40-49', male: 0, female: 0},
        {group: '50-59', male: 0, female: 0},
        {group: '60-69', male: 0, female: 0},
        {group: '70-79', male: 0, female: 0},
        {group: '80-89', male: 0, female: 0},
        {group: '90-99', male: 0, female: 0},
        {group: '100-109', male: 0, female: 0}];
}

function highLight(d, gender) {
    var locations = [];
    allData.forEach(function (p) {
        var lowerAge = d.group.split("-")[0];
        var higherAge = d.group.split("-")[1];
        if (p[age] >= lowerAge && p[age] <= higherAge && p.gender == gender) {
            highLightByPatientId(p.id);
            locations.push(p);
        }
    });
    createHeatmap(locations);
}
function revertHighLight(d, gender) {
    allData.forEach(function (p) {
        var lowerAge = d.group.split("-")[0];
        var higherAge = d.group.split("-")[1];
        if (p[age] >= lowerAge && p[age] <= higherAge && p.gender == gender) {
            revertHighLightByPatientId(p.id);
        }
    });
    createHeatmap(patientsById.top(Infinity));
}