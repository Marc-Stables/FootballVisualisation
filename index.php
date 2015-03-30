<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ember and D3</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap-theme.min.css">
    <link rel="stylesheet" href="CSS/base.css">
</head>
<body>
<!--CDN Libs-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.0.1/jquery.min.js"></script>
<script src="http://documentcloud.github.com/underscore/underscore-min.js"></script>
<script src="http://documentcloud.github.io/backbone/backbone-min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>
<script src="http://d3js.org/colorbrewer.v1.min.js"></script>

<!--My Scripts-->
<script src="JS/TableFunctions.js"></script>
<script src="JS/DataFunctions.js"></script>
<script src="JS/Controller.js"></script>
<script src="JS/PointsCalculator.js"></script

    <!-- HTML -->
    <!--<div class="button1" id="myButtons">
    <button class="remove" class="button-down">Remove Team</button>
    <button class="add" class="button-down">Add Team</button>
    <button class="change" class="button-down">Change Team</button>
</div>-->
<div class="container-fluid">
    <div class="jumbotron">
        <h1>Football</h1>
        <p></p>
    </div>
    <!-- Wrapper div -->
    <div id="wrapper">
        <!-- Backbone row container -->
        <div class="row">
            <div class="panel-heading"><h3 class="title">Exclusion Controller</h3></div>
            <!-- Column 1: Filter Control -->
            <div class="col-md-2">
                <!--<div><h3>Select Filter</h3></div>-->
                <!-- Navigation tabs -->
                <ul class="nav nav-tabs">
                    <li class="active"><a data-toggle="tab" href="#teams">Teams</a></li>
                    <li><a data-toggle="tab" href="#players">Players</a></li>
                </ul>
                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Tab 1: Teams -->
                    <div id="teams" class="tab-pane fade in active">
                        <!-- List Group 1: Teams -->
                        <div class="list-group teamsList"></div>
                    </div>
                    <!-- Tab 2: Players -->
                    <div id="players" class="tab-pane fade in">
                        <!-- List Group 2: Players -->
                        <div class="list-group playersList"></div>
                    </div>
                </div>
            </div>
            <!-- Column 2: View -->
            <div class="col-md-10">
                <div class=tablecontainer>
                    <div class="positionrows"></div>
                    <div class="chart"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    /*** Set up data ***/
    var teamsArray = [];
    var resultsArray = [];
    var scorersArray = [];
    var teamSet = d3.set();
    var playerSet = d3.map();
    var oldpositionsMap = d3.map();
    var newpositionsMap = d3.map();
    var triangles = { up: "M0,-5.26429605180997L6.078685485212741,5.26429605180997 -6.078685485212741,5.26429605180997Z", down: "M0,5.26429605180997L6.078685485212741,-5.26429605180997 -6.078685485212741,-5.26429605180997Z" };
    var clickAction, clickedTeam;

    $.ajax({
        url: "XML/leaguestandingsnew.xml",
        dataType: "xml",
        async: false,
        success: function (results) {
            teamsArray = datafunctions.parseXML(results);
        }
    });
    $.ajax({
        url: "XML/historicresultsnew.xml",
        dataType: "xml",
        async: false,
        success: function (results) {
            resultsArray = datafunctions.createHistoricResultsArray(results);
        },
        complete: function(blah, status){
            /*console.log(status);*/
        }
    });
    $.ajax({
        url: "XML/topscorersnew.xml",
        dataType: "xml",
        async: false,
        success: function (results) {
            scorersArray = datafunctions.createTopScorersArray(results);
        }
    });

    /*** Team Model ***/
    var Team = Backbone.Model.extend({
        Name:'',
        Played:'',
        Won:'',
        Drawn:'',
        Lost:'',
        Points:'',
        GD:''
    });

    /*** Teams Collection ***/
    var Teams = Backbone.Collection.extend({
        model: Team,
        comparator: function(a, b) {
            if(a.get('Points') === b.get('Points')){
                if(a.get('GD') > b.get('GD')) {
                    return -1;
                }else if(a.get('GD') < b.get('GD')){
                    return 1;
                }else if(a.get('GD') === b.get('GD')){
                    return 0;
                }
            }else if(a.get('Points') > b.get('Points')){
                return -1;
            }else{
                return 1;
            }
        }
    });

    /*** Instantiate collection ***/
    var myTeams = new Teams(teamsArray);

    /*** Table view ***/
    var TableChartView = Backbone.View.extend({
        initialize: function() {
            this.listenTo(this.collection, "add remove change reset", this.render);
            // Observe model

            tablefunctions.initialisePositionRows();
            tablefunctions.initialiseColumnHeadings(this.el, this.collection);
            // Render position rows and column headings
            this.render();
        },
        render: function() {
            this.collection.sort();
            tablefunctions.initialiseTeamRows(this.collection, oldpositionsMap, newpositionsMap, teamSet, playerSet, clickAction, clickedTeam);
        }
    });

    /*** Instantiate view ***/
    var table = new TableChartView({
        el: '.chart',
        collection: myTeams
    });

    /*** Listener for team list ***/
    $(function() {
        // Populate list controller with teams
        Controller.appendTeams(myTeams.toJSON());
        // Add listener to list controller items
        $('.teamListItem').on('click', function(){
            clickAction = "TeamClick";
            // Populate old positions map with current positions
            Controller.populatePositionsArray(oldpositionsMap, myTeams.toJSON());
            // Array to be used in reset
            var arr;
            // Name of clicked team
            var teamName = $.trim($(this).text());
            console.log(teamName);
            // If item has already been clicked
            if($(this).hasClass('list-group-item-success')){
                $(this).removeClass('list-group-item-success');
                clickedTeam = teamName;
                // Remove team from set
                teamSet.remove(teamName);
                // Reset collection
                myTeams.reset(teamsArray);
                // Ensure collection matches set - if any teams remain excluded (in the set), remove from reset collection
                myTeams.forEach(function (d) {
                    if (teamSet.has(d.get('Name')))
                        d.set("Points", 0);
                });
                // Re-calculate attributes
                arr = Controller.calculateAttributes(resultsArray, teamSet, myTeams.toJSON());
                // Reset collection, ensuring that the comparator function sorts the incoming models
                myTeams.reset(arr);
                // Populate new positions map
                Controller.populatePositionsArray(newpositionsMap, myTeams.toJSON());
                // Reset collection again, this time passing in new positions to enable comparison
                myTeams.reset(arr);
                // If there are no teams now selected, transition out all position triangles
                if(!$('.teamListItem').hasClass('list-group-item-success')) {
                    d3.selectAll('.positionTriangle')
                        .transition()
                        .delay(2000)
                        .transition()
                        .duration(2500)
                        .style('fill', 'white');
                }
            }else{
                // Add 'has been clicked' status to clicked item
                $(this).addClass('list-group-item-success');
                clickedTeam = teamName;
                // Add team to set
                teamSet.add(teamName);
                // Set selected team's points attribute to 0 in map
                var model = myTeams.get(myTeams.findWhere({Name: teamName}));
                model.set({Played: 0, Won: 0, Drawn:0, Lost:0, Scored:0, "Conceded":0, GD:0, Points:0});
                // Re-calculate attributes
                arr = Controller.calculateAttributes(resultsArray, teamSet, myTeams.toJSON());
                // Reset collection, ensuring that the comparator function sorts the incoming models
                myTeams.reset(arr);
                // Populate new positions map
                Controller.populatePositionsArray(newpositionsMap, myTeams.toJSON());
                // Reset collection with new array
                myTeams.reset(arr);
            }
        })
    });

    $(function() {
        // Populate list controller with teams
        Controller.appendScorers(scorersArray);
        // Add listener to list controller items
        $('.scorersListItem').on('click', function(){
            clickAction = "PlayerClick";
            Controller.populatePositionsArray(oldpositionsMap, myTeams.toJSON());
            // Get player and team names
            var scorer = $(this).text();
            var team = $(this).attr('id');
            // If item has already been clicked
            if($(this).hasClass('list-group-item-success')){
                // Remove 'has been clicked status'
                $(this).removeClass('list-group-item-success');
                // Remove scorer and - if empty - team from map
                playerSet.get(team).remove(scorer);
                if(playerSet.get(team).empty())
                    playerSet.remove(team);
                // If map is not empty
                if(!playerSet.empty()) {
                    // Iterate outer map of teams
                    playerSet.forEach(function(k, v){
                        // Iterate inner map of players
                        v.forEach(function(k){
                            // Set values to false to allow re-exclusion
                            this.set(k, false);
                        });
                    });
                    // Reset collection for re-evaluation
                    myTeams.reset(teamsArray);
                    // Re-evaluate remaining exclusions and reset collection
                    var arr = Controller.discountGoals(resultsArray, playerSet, myTeams.toJSON());
                    myTeams.reset(arr);
                    Controller.populatePositionsArray(newpositionsMap, myTeams.toJSON());
                    myTeams.reset(arr);

                    playerSet.forEach(function(k, v){
                        // Iterate inner map of players
                        v.forEach(function(k){
                            // Set values to true to indicate exclusion
                            this.set(k, true);
                        });
                    });
                }else{
                    // If map is completely empty, reset collection to original array
                    myTeams.reset(teamsArray);
                    var arr = Controller.discountGoals(resultsArray, playerSet, myTeams.toJSON());
                    Controller.populatePositionsArray(newpositionsMap, myTeams.toJSON());
                    myTeams.reset(arr);
                    // Fade out triangles
                    d3.selectAll('.positionTriangle')
                        .transition()
                        .delay(2000)
                        .transition()
                        .duration(2500)
                        .style('fill', 'white')
                        .size(500);

                    //console.log(playerSet);
                }
            }else {
                // If item has not been clicked, remove 'has been clicked' class from all
                d3.selectAll(".teamListItem").classed({"list-group-item-success": false});
                // Add 'has been clicked' status to clicked item
                $(this).addClass('list-group-item-success');
                // If team is not in map, add team to map with nested map for players
                if(!playerSet.has(team))
                    playerSet.set(team, d3.map());
                // Add clicked player to appropriate map key and set to false for exclusion status
                playerSet.get(team).set(scorer, false);
                // Reset collection
                myTeams.reset(teamsArray);
                // Calculate new array values and reset collection
                var arr = Controller.discountGoals(resultsArray, playerSet, myTeams.toJSON());


                myTeams.reset(arr);
                Controller.populatePositionsArray(newpositionsMap, myTeams.toJSON());
                myTeams.reset(arr);
                // Set player exclusion status to true - player is now excluded
                playerSet.get(team).set(scorer, true);
            }
        });
    });

    $(".barCell").tooltip({
        'container': 'body',
        'placement': 'right'
    });
</script>



</body>
</html>