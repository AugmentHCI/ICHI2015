/**
 * Created by robindecroon on 11/12/14.
 */
function SelectedTable(divID, title) {

    this.titleOffset = 15;

    this.width = widgetWidth - marginLeft - marginRight;
    //this.height = 10000;// + nbBarsVariable * gap;
    this.height = 40 * widgetHeight - marginTop - marginBottom;// + nbBarsVariable * gap;

    this.internalChart = d3.select(divID)
        .append('table')
        .attr('class', 'patientTable')
        .attr('width', this.width + marginLeft + marginRight)
        .attr('height', this.height + marginTop + marginBottom);

    this.lowerLayer = this.internalChart.append("div")
        .attr("transform", translation(marginLeft, marginTop + this.titleOffset));
}

SelectedTable.prototype.update = function (data, columns) {

    gridster.resize_widget($("#patients"), 3, Math.floor(data.length * 0.4));

    var _this = this;

    _this.internalChart.select("table").remove();

    var table = _this.internalChart.append("table").attr('height', ((Math.floor(data.length * 0.4)) * (widgetHeight))).attr("class", "sortable"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    //sorttable.makeSortable(table);

    var allColums = ["Picture"].concat(columns);

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(allColums)
        .enter()
        .append("th")
        .text(function (column) {
            return column;
        });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data, function (d) {
            console.log(d);
            return d.name;
        });
    rows
        .enter()
        .append("tr");

    var images = rows.selectAll("td")
        .data(function (row) {
            if (row[gender] === "male") {
                return [{
                    column: "Foto",
                    value: "http://api.randomuser.me/portraits/thumb/men/" + (row.id % 95) + ".jpg"
                }];
            }
            if (row[gender] === "female") {
                return [{
                    column: "Foto",
                    value: "http://api.randomuser.me/portraits/thumb/women/" + (row.id % 95) + ".jpg"
                }];
            }
        });

    images
        .enter()
        .append("img");

    images
        .attr('class', 'imageCell')
        .attr("src", function (d) {
            return d.value;
        });

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]};
            });
        });

    cells
        .enter()
        .append("td");

    cells
        .attr("style", "font-family: Courier") // sets the font style
        .attr("style", "max-width: 180px")
        .text(function (d) {
            return d.value;
        });

    cells
        .on("click", function () {
            Lightview.show({url: 'https://robindecroon.wordpress.com/', type: 'iframe'});
        });


    cells.exit().remove();

    rows.exit().remove();
};