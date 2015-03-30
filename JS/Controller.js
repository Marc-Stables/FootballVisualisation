var Controller = {};

Controller.appendTeams = function(collection){
    $.each(collection, function(){
        $('.teamsList').append('<a class="list-group-item teamListItem"><img src="IMG/' + this.Name + '.png" height="35px" width="35px">&nbsp&nbsp&nbsp' + this.Name + '</a>');
    })
};

Controller.appendScorers = function(collection) {
    for(var i = 0; i < 10; ++i) {
        $('.playersList').append('<a id="'+ collection[i].Team +'" class="list-group-item scorersListItem">' + collection[i].Name + '</a>');
    }
};

Controller.calculateAttributes = function(resultsArray, teamSet, leagueStandings){
    // Object for use as associative array - points
    var points = {};
    var matchOutcomes = {};
    var goals = {};

    /** Initialise object literals **/
    $(leagueStandings).each(function (index, value) {
        points[""+ value.Name + ""] = 0;
        matchOutcomes[""+ value.Name + ""] = { Won: 0, Lost: 0, Played: 0, Drawn: 0 };
        goals[""+ value.Name +""] = { Scored:0, Conceded: 0 };
    });

    //console.log(leagueStandings);

    /** Calculate points, wins/losses/draws, goals to be deducted from each team **/
    $(resultsArray).each(function(index, value) {
        // If excluded team is playing at home
        if (teamSet.has(value.HomeTeam) && !teamSet.has(value.AwayTeam)) {
            // Add one to 'Played'
            matchOutcomes["" + value.AwayTeam + ""].Played = matchOutcomes["" + value.AwayTeam + ""].Played + 1;
            // Add goals scored/conceded to away team
            goals["" + value.AwayTeam + ""].Conceded += value.HomeGoals;
            goals["" + value.AwayTeam + ""].Scored += value.AwayGoals;
            // If match was a draw
            if (value.HomeGoals === value.AwayGoals) {
                // Add one to 'Drawn' for away team
                matchOutcomes["" + value.AwayTeam + ""].Drawn = matchOutcomes["" + value.AwayTeam + ""].Drawn + 1;
                // Add one to 'Points' for away team
                points["" + value.AwayTeam + ""] = points["" + value.AwayTeam + ""] + 1;
                // If excluded team won match
            } else if (value.HomeGoals > value.AwayGoals) {
                // Add one to 'Lost' for away team
                matchOutcomes["" + value.AwayTeam + ""].Lost = matchOutcomes["" + value.AwayTeam + ""].Lost + 1;
            }
            // If excluded team lost match
            else if (value.AwayGoals > value.HomeGoals) {
                // Add one to 'Won' for away team
                matchOutcomes["" + value.AwayTeam + ""].Won = matchOutcomes["" + value.AwayTeam + ""].Won + 1;
                // Add three to 'Points' for away team
                points["" + value.AwayTeam + ""] = points["" + value.AwayTeam + ""] + 3;
            }
            // If excluded team is playing away from home
        } else if (teamSet.has(value.AwayTeam) && !teamSet.has(value.HomeTeam)) {
            // Add one to 'Played'
            //console.log(matchOutcomes);
            //console.log(value.HomeTeam);
            matchOutcomes["" + value.HomeTeam + ""].Played = matchOutcomes["" + value.HomeTeam + ""].Played + 1;
            // Add goals scored/conceded to home team
            goals["" + value.HomeTeam + ""].Conceded += value.AwayGoals;
            goals["" + value.HomeTeam + ""].Scored += value.HomeGoals;
            if (value.HomeGoals === value.AwayGoals) {
                // Add one to 'Drawn' for home team
                matchOutcomes["" + value.HomeTeam + ""].Drawn = matchOutcomes["" + value.HomeTeam + ""].Drawn + 1;
                // Add one to 'Points' for home team
                points["" + value.HomeTeam + ""] = points["" + value.HomeTeam + ""] + 1;
                // If excluded team lost match
            } else if (value.HomeGoals > value.AwayGoals) {
                // Add one to 'Lost' for home team
                matchOutcomes["" + value.HomeTeam + ""].Lost = matchOutcomes["" + value.HomeTeam + ""].Lost + 1;
                // Add three to 'Points' for home team
                points["" + value.HomeTeam + ""] = points["" + value.HomeTeam + ""] + 3;
            }
            // If excluded team won match
            else if (value.AwayGoals > value.HomeGoals) {
                // Add one to 'Won' for home team
                matchOutcomes["" + value.HomeTeam + ""].Won = matchOutcomes["" + value.HomeTeam + ""].Won + 1;
            }
        }
    });

    /*** Adjust team attributes after exclusion ***/
    $(leagueStandings).each(function(index, value){
        // Adjust Points
        value.Points = value.Points - points["" + value.Name + ""];
        // Adjust goals scored/conceded
        value.Scored -= goals["" + value.Name + ""].Scored;
        value.Conceded -= goals["" + value.Name + ""].Conceded;
        // Adjust goal difference
        value.GD = value.Scored - value.Conceded;
        // Adjust match results
        value.Played -= matchOutcomes["" + value.Name + ""].Played;
        value.Won -= matchOutcomes["" + value.Name + ""].Won;
        value.Lost -= matchOutcomes["" + value.Name + ""].Lost;
        value.Drawn -= matchOutcomes["" + value.Name + ""].Drawn;
    });

    return leagueStandings;
};

Controller.discountGoals = function(resultsArray, playerSet, leagueStandings){
    var regexp, team;
    var scorers, scoresheet;
    var points = {};
    var matchOutcomes = {};
    var goals = {};

    /** Deep copy results array to preserve original data **/
    var arr = [];
    for(var i = 0; i < resultsArray.length; ++i){
        var obj = jQuery.extend(true, {}, resultsArray[i]);
        arr.push(obj);
    }

    /** Initialise object literals **/
    $(leagueStandings).each(function (index, value) {
        points[""+ value.Name + ""] = 0;
        matchOutcomes[""+ value.Name + ""] = { Won: 0, Lost: 0, Played: 0, Drawn: 0 };
        goals[""+ value.Name +""] = { Scored:0, Conceded: 0 };
    });

    /** Iterate through all historical matches **/
    $.each(arr, function(index, value) {
        // If a player from the home team has been excluded
        if(playerSet.has(value.HomeTeam)) {
            // Get scorers of all home goals in match
            scorers = value.HomeScorers;
            // Get team from outer map
            team = playerSet.get(value.HomeTeam);
           // console.log(team);
            // Iterate players in inner map
            team.forEach(function(player, excluded) {
                // If player has not yet been excluded
                if (!excluded) {
                    // Create new regex to find player within home scorers
                    regexp = new RegExp(player, 'g');
                    // Use regex on home scorers
                    scoresheet = scorers.match(regexp);
                    // If player scored, subtract their goals from team
                    if (scoresheet != null)
                        value.HomeGoals -= scoresheet.length;
                }
            });
         // If a player from the home team has been excluded
        }else if(playerSet.has(value.AwayTeam)){
            // Get scorers of all away goals in match
            scorers = value.AwayScorers;
            // Get team from outer map
            team = playerSet.get(value.AwayTeam);
            // Iterate players in inner map
            team.forEach(function(player, excluded) {
                // If player has not yet been excluded
                if (!excluded) {
                    // Create new regex to find player within away scorers
                    regexp = new RegExp(player, 'g');
                    // Use regex on away scorers
                    scoresheet = scorers.match(regexp);
                    // If player scored, subtract their goals from team
                    if (scoresheet != null)
                        value.AwayGoals -= scoresheet.length;
                }
            });
        }
    });

    /** Loop through results and re-construct team stats **/
    $.each(arr, function(index, value) {
        matchOutcomes["" + value.HomeTeam + ""].Played += 1;
        matchOutcomes["" + value.AwayTeam + ""].Played += 1;
        // If match was a draw
        if(value.HomeGoals === value.AwayGoals){
            matchOutcomes["" + value.HomeTeam + ""].Drawn += 1;
            matchOutcomes["" + value.AwayTeam + ""].Drawn += 1;
            goals["" + value.HomeTeam + ""].Conceded += value.AwayGoals;
            goals["" + value.AwayTeam + ""].Conceded += value.HomeGoals;
            goals["" + value.HomeTeam + ""].Scored += value.HomeGoals;
            goals["" + value.AwayTeam + ""].Scored += value.AwayGoals;
            points["" + value.HomeTeam + ""] += 1;
            points["" + value.AwayTeam + ""] += 1;
        }else if(value.HomeGoals > value.AwayGoals){
            matchOutcomes["" + value.HomeTeam + ""].Won += 1;
            matchOutcomes["" + value.AwayTeam + ""].Lost += 1;
            goals["" + value.HomeTeam + ""].Conceded += value.AwayGoals;
            goals["" + value.AwayTeam + ""].Conceded += value.HomeGoals;
            goals["" + value.HomeTeam + ""].Scored += value.HomeGoals;
            goals["" + value.AwayTeam + ""].Scored += value.AwayGoals;
            points["" + value.HomeTeam + ""] += 3;
        }else if(value.AwayGoals > value.HomeGoals){
            matchOutcomes["" + value.HomeTeam + ""].Lost += 1;
            matchOutcomes["" + value.AwayTeam + ""].Won += 1;
            goals["" + value.HomeTeam + ""].Conceded += value.AwayGoals;
            goals["" + value.AwayTeam + ""].Conceded += value.HomeGoals;
            goals["" + value.HomeTeam + ""].Scored += value.HomeGoals;
            goals["" + value.AwayTeam + ""].Scored += value.AwayGoals;
            points["" + value.AwayTeam + ""] += 3;
        }
    });

    /** Adjust league standings after exclusion **/
    $(leagueStandings).each(function(index, value){
        // Adjust Points
        value.Points = points["" + value.Name + ""];
        // Adjust goals scored/conceded
        value.Scored = goals["" + value.Name + ""].Scored;
        value.Conceded = goals["" + value.Name + ""].Conceded;
        // Adjust goal difference
        value.GD = value.Scored - value.Conceded;
        // Adjust match results
        value.Played = matchOutcomes["" + value.Name + ""].Played;
        value.Won = matchOutcomes["" + value.Name + ""].Won;
        value.Lost = matchOutcomes["" + value.Name + ""].Lost;
        value.Drawn = matchOutcomes["" + value.Name + ""].Drawn;
    });

    return leagueStandings;
};

Controller.populatePositionsArray = function(positionsMap, collection){
    $.each(collection, function(i, d) {
        positionsMap.set(d.Name, i);
    });

    /*console.log(collection);
    console.log(positionsMap);*/
}
