var datafunctions = {};

datafunctions.parseXML = function(arr){
    var leagueStandings = [];

    var nodes = $(arr).find('TeamLeagueStanding');
    $(nodes).each(function () {
        $(this).each(function () {
            var obj = {
                Name: $(this).find('Team').text(),
                Played: $(this).find('Played').text(),
                Drawn: $(this).find('Draw').text(),
                Won: $(this).find('Won').text(),
                Lost: $(this).find('Lost').text(),
                Scored: parseInt($(this).find('Goals_For').text()),
                Conceded: parseInt($(this).find('Goals_Against').text()),
                GD: parseInt($(this).find('Goal_Difference').text()),
                Points: parseInt($(this).find('Points').text())
            };
            leagueStandings.push(obj);
        });
    });
    return leagueStandings;
};



datafunctions.createHistoricResultsArray = function(arr){
    var resultsArray = [];
    var nodes = $(arr).find('Match');
    $(nodes).each(function () {
        $(this).each(function () {
            var obj = {
                HomeTeam: $(this).find("HomeTeam").text(),
                AwayTeam: $(this).find("AwayTeam").text(),
                HomeGoals: parseInt($(this).find("HomeGoals").text()),
                AwayGoals: parseInt($(this).find("AwayGoals").text()),
                HomeScorers: $(this).find("HomeGoalDetails").text(),
                AwayScorers: $(this).find("AwayGoalDetails").text()
            };
            resultsArray.push(obj);
        });
    });
    return resultsArray;
};

datafunctions.createTopScorersArray = function(arr){
    var scorersArray = [];
    var nodes = $(arr).find('Topscorer');
    $(nodes).each(function () {
        $(this).each(function () {
            var obj = {
                Name: $(this).find("Name").text(),
                Team: $(this).find("TeamName").text(),
                Goals: parseInt($(this).find("Goals").text())
            };
            scorersArray.push(obj);
        });
    });
    return scorersArray;
};

function getIndex(collection, teamName){
    var num = 0;
    $.each(collection, function(index, value){
        if(value["Name"] === teamName)
            num = index;
    });
    return num;
}