var tablefunctions = {};

tablefunctions.tableDimensions = { height: $(window).height()*0.65, width: /*$(window).width() / 2.15*/'2000px' };
tablefunctions.cellDimensions = { height:43, width: 140 };

tablefunctions.initialiseColumnHeadings = function(element, col) {
    var tableSel = d3.select(element).append('svg')
            .attr('class', 'table')
            .attr('height', tablefunctions.tableDimensions.height)
            .attr('width', tablefunctions.tableDimensions.width)
        ; // Append SVG to view element

    tableSel.append('g').attr('class', 'teamRows');
    tableSel.append('g').attr('class', 'columnHeadings');

    var tableHeadings = d3.keys(col.toJSON()[0]);
    tableSel.select('.columnHeadings').selectAll('rect') .data(tableHeadings)
        .enter().append('rect')
        .attr('height', 1)
        .attr('width', tablefunctions.cellDimensions.width)
        .attr('x', function (d, i) { return i * tablefunctions.cellDimensions.width * 1.05 })
        .attr('y', 10)
        .attr('fill', '#FFF')
        .attr('stroke', 'slategrey')
        .attr('class', 'teamRect')
    ; // Append column headings to table

    tableSel.select('.columnHeadings').selectAll('text')
        .data(tableHeadings)
        .enter().append('text')
        .attr('x', function (d, i) { return i * tablefunctions.cellDimensions.width * 1.05 + 5})
        .attr('y', 40)
        .style({'font-weight':'bold'})
        .text(function (d) { return d })
    ; // Append text to column headings
};




tablefunctions.initialiseTeamRows = function(collection, oldPositions, newPositions, teamSet, playerSet, clickAction, clickedTeam){
    // Path strings for position triangles
    var triangles = { up: "M0,-7.26429605180997L6.078685485212741,7.26429605180997 -8.078685485212741,7.26429605180997Z", down: "M0,7.26429605180997L6.078685485212741,-7.26429605180997 -8.078685485212741,-7.26429605180997Z" };
    var col = collection.toJSON();
    var keys = d3.keys(col[0]);
    var scalesMap = tablefunctions.getScalesMap(col);
    var colourScales = tablefunctions.getColourScales(col.filter(function(d){ return d.Points != 0}));
    var excludedTeams = teamSet.values();


    /**** Rows work ****/

    // Append container g element for rows
    var rowsSel = d3.select('.teamRows')
            .selectAll('g')
            .data(col, function(d){ return d.Name })
        ;

    // Exit transition
    rowsSel.exit().transition().duration(2000).style('opacity', 0).transition().duration(2000).attr('transform', function(d, i) { return 'translate(0,' + 605 +')';  });

    // Append g container elements for team rows and path for position triangles
    rowsSel.enter().append('g')
        .attr('class', 'team')
        .attr('id', function(d){ return d.Name })
        .attr('transform', function(d, i) { return 'translate(0,' + i * (tablefunctions.cellDimensions.height + 5) +')'; })
        .append('path')
        .attr("transform", function(d, i)  { return 'translate(1350, ' + tablefunctions.cellDimensions.height * 1.80 + ')'; })
        .attr('class', 'positionTriangle')
    ;

    // Transition any changes within data structure according to key
    rowsSel
        .transition()
        .style('opacity', function(d){
            if(d.Points === 0)
                return 0.5;
        })
        .duration (2000)
        .attr('transform', function(d, i) { return 'translate(0,' + i * (tablefunctions.cellDimensions.height + 5) +')'; })
    ;

    /**** Rects work ****/

    // Rect selector
    var rects = rowsSel
            .selectAll('rect')
            .data(function(d){ return d3.values(d) })
        ;

    // Append team row rects
    rects
        .enter().append('rect')
        .attr('height', 1)
        .attr('width', tablefunctions.cellDimensions.width)
        .attr('x', function(d, i){ return i * tablefunctions.cellDimensions.width * 1.05})
        .attr('y', tablefunctions.cellDimensions.height + 15)
        .attr('fill', '#FFF')
        .attr('stroke', 'slategrey')
        .attr('class', 'teamRect')
        .attr('stroke-width', '1')
    ;

    // Append bar cell rects
    rects
        .enter().append('rect')
        .attr('height', tablefunctions.cellDimensions.height)
        .attr('width',
        function(d, i){
            if(Number.isNaN(parseInt(d))) {
                return '0';
            }else{
                if (d >= 0) {
                    //console.log(keys[i] + ": " + d);
                    return scalesMap.get(keys[i])(d) / 2;
                }
                else {
                    //console.log(keys[i] + ": " + d);
                    return scalesMap.get(keys[i])(d * -1) / 2;
                }
            }
        })
        .attr('x',
        function(d, i) {
            if (d >= 0) {
                return (i * tablefunctions.cellDimensions.width * 1.05) + tablefunctions.cellDimensions.width * 0.5;
            } else {
                return (i * tablefunctions.cellDimensions.width * 1.05) + (tablefunctions.cellDimensions.width * 0.5) - d3.select(this).attr('width');
            }
        })
        .attr('y', tablefunctions.cellDimensions.height + 15)
        .attr('fill', function(d, i){
            return colourScales.get(keys[i])(d); //return "black";
        })
        .attr('stroke', 'none')
        .attr('class', 'barCell')
        .attr('id', function(d, i){ return i })
        .attr('title', function(d, i){ return d })
        .attr('data-toggle', 'tooltip')
    ;

    // Select all bar cells
    var barCells = rowsSel
            .selectAll('.barCell')
            .data(function(d, i){ return d3.values(d) })
        ;

    // Update bar cell width
    barCells
        .transition()
        .duration(2000)
        .attr('width',
        function(d, i){
            if(Number.isNaN(parseInt(d))) {
                return '0';
            }else{
                if (d >= 0) {
                    return scalesMap.get(keys[i])(d) / 2;
                }
                else {
                    return scalesMap.get(keys[i])(d * -1) / 2;
                }
            }
        })
        .transition()
        .attr('fill', function(d, i){
            return colourScales.get(keys[i])(d); //return "black";
        })
    ;

    d3.selectAll('.barCell').attr('data-original-title', function(d, i){ return d });

    /**** Text work ****/

    // Create text elements to append to team rows & bind data
    var teamText = rowsSel
            .selectAll('text')
            .data(function(d){ return d3.values(d) })
        ;

    // Append text elements
    teamText
        .enter().append('text')
        .attr('x', function(d, i){ return i * tablefunctions.cellDimensions.width * 1.05 + 5 })
        .attr('y', 85)
        .style('font-size', 15)
    ;

    // Update text
    teamText.text(function(d){ return d });

    /** Position triangles **/

        // Set 'd' and 'style' attributes of position triangles based on new and old position maps
    d3.selectAll('.positionTriangle')
        .transition()
        .duration(2000)
        .attr("d", function(d, i){
            if(clickAction === 'TeamClick') {
                // If no teams are now highlighted
                if (teamSet.empty()) {
                    if(oldPositions.get(d.Name) < newPositions.get(clickedTeam)) {
                        // If team has moved up the table
                        if (newPositions.get(d.Name) < oldPositions.get(d.Name) - teamSet.size()) {
                            return triangles.up;
                        }
                        // If team has moved down the table
                        else if (newPositions.get(d.Name) > oldPositions.get(d.Name) + teamSet.size()) {
                            return triangles.down;
                        }
                    }
                    else if (oldPositions.get(d.Name) > newPositions.get(clickedTeam)){
                        // If team has moved up the table
                        if (newPositions.get(d.Name) < oldPositions.get(d.Name) - teamSet.size() - 1) {
                            return triangles.up;
                        }
                        // If team has moved down the table
                        else if (newPositions.get(d.Name) > oldPositions.get(d.Name) + teamSet.size() + 1) {
                            return triangles.down;
                        }
                    }
                }
                else{
                    if(newPositions.get(d.Name) < oldPositions.get(clickedTeam)){
                        if(newPositions.get(d.Name) < oldPositions.get(d.Name)){
                            return triangles.up;
                        }
                        else if(newPositions.get(d.Name) > oldPositions.get(d.Name)){
                            return triangles.down;
                        }
                    }
                    else if (newPositions.get(d.Name) > oldPositions.get(clickedTeam)){
                        if(newPositions.get(d.Name) < oldPositions.get(d.Name) - teamSet.size() ){
                            return triangles.up;
                        }
                        else if(newPositions.get(d.Name) > oldPositions.get(d.Name) + teamSet.size() ){
                            return triangles.down;
                        }
                    }
                }
            }
            else if(clickAction === 'PlayerClick'){
                if(teamSet.empty()){
                    if (newPositions.get(d.Name) < oldPositions.get(d.Name)) {
                        return triangles.up;
                    }
                    // If team has moved down the table
                    else if (newPositions.get(d.Name) > oldPositions.get(d.Name)) {
                        return triangles.down;
                    }
                }
            }
        })
        .style('fill', function(d, i){
            if(newPositions.has(d.Name)) {
                if (newPositions.get(d.Name) > oldPositions.get(d.Name)) {
                    return 'red';
                }
                else if (newPositions.get(d.Name) < oldPositions.get(d.Name)) {
                    return 'green';
                }
                /*else if (newPositions.get(d.Name) > oldPositions.get(d.Name)) {
                 return 'red';
                 }
                 else if (newPositions.get(d.Name) < oldPositions.get(d.Name)) {
                 return 'green';
                 }*/
            }
        })
        .size(1000)
    ;
};
/*if (newPositions.get(d.Name) >= oldPositions.get(d.Name) + teamSet.size()) {
 return triangles.down;
 }
 else if (newPositions.get(d.Name) <= oldPositions.get(d.Name) - teamSet.size()) {
 return triangles.up;
 }*/

/*else if (newPositions.get(d.Name) <= oldPositions.get(d.Name) - teamSet.size() * 2) {*/
/*d3.selectAll('.positionTriangle')
 .transition()
 .duration(2000)
 .attr("d", function(d, i){
 if(newPositions.has(d.Name)) {
 if(oldPositions.get(d.Name) >= oldPositions.get(excludedTeams[excludedTeams.length - 1])) {
 if (newPositions.get(d.Name) >= oldPositions.get(d.Name) + 2){
 return triangles.down;
 }
 else if (newPositions.get(d.Name) <= oldPositions.get(d.Name) - 2){
 return triangles.up;
 }
 }else if(oldPositions.get(d.Name) <= oldPositions.get(excludedTeams[excludedTeams.length - 1])){
 if (newPositions.get(d.Name) >= oldPositions.get(d.Name) + 1) {
 return triangles.down;
 }
 else if (newPositions.get(d.Name) <= oldPositions.get(d.Name) - 1){
 return triangles.up;
 }
 }
 }
 })
 .style('fill', function(d, i){
 if(newPositions.has(d.Name)) {
 if (newPositions.get(d.Name) >= oldPositions.get(d.Name) +2) {
 return 'red';
 }
 else if (newPositions.get(d.Name) <= oldPositions.get(d.Name) -2) {
 return 'green';
 }
 else if (newPositions.get(d.Name) >= oldPositions.get(d.Name) +1) {
 return 'red';
 }
 else if(newPositions.get(d.Name) <= oldPositions.get(d.Name) -1) {
 return 'green';
 }
 }
 })
 ;*/

tablefunctions.initialisePositionRows = function(){
    var rows = d3.select('.positionrows')
        .append('svg')
        .attr('class', 'positionsSVG')
        .attr("height", tablefunctions.tableDimensions.height)
        .attr("width", '100px')
        .selectAll("g")
        .data([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    rows
        .enter()
        .append("g").attr("transform", function(d, i) { return "translate(0," + i * (tablefunctions.cellDimensions.height + 5) +")"; })
        .append("rect")
        .attr("height", 1)
        .attr("width", tablefunctions.cellDimensions.width * 0.3)
        .attr("x", 0)
        .attr("y", tablefunctions.cellDimensions.height + 15)
        .attr("fill", "#FFF")
        .attr("stroke", "slategrey")
        .attr("class", "teamRect");

    rows
        .append("text")
        .attr("x", 5)
        .attr("y", 85)
        .text(function(d, i){ return d });
};


tablefunctions.getScalesMap = function(collection){
    var scalesMap = d3.map();

    var keys = d3.keys(collection[0]);

    for (var i = 0; i < keys.length; ++i) {

        var max = d3.max(collection, function (d) {
            return +d["" + keys[i] + ""];
        });

        var linearScale = d3.scale.linear()
            .domain([0, max])
            .range([0, tablefunctions.cellDimensions.width]);

        scalesMap.set(keys[i], linearScale);
    }

    return scalesMap;
};

tablefunctions.getColourScales = function(collection){
    var scalesMap = d3.map();
    var linearScale;

    var keys = d3.keys(collection[0]);

    for (var i = 0; i < keys.length; ++i) {
        var max = d3.max(collection, function (d) {
            return +d["" + keys[i] + ""];
        });

        var min = d3.min(collection, function (d) {
            return +d["" + keys[i] + ""];
        });

        if(keys[i] === "Played" || keys[i] === "Drawn") {
            linearScale = d3.scale.linear()
                .domain([min, max])
                .range(["#006d2c", "#006d2c"]);
        }else if(keys[i] === "Conceded" || keys[i] === "Lost") {
            linearScale = d3.scale.quantize()
                .domain([max, min])
                .range(colorbrewer.Greens[4]);
        }else{
            linearScale = d3.scale.quantize()
                .domain([min, max])
                .range(colorbrewer.Greens[4]);
        }

        scalesMap.set(keys[i], linearScale);
    }
    return scalesMap;
};
