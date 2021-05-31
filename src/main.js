var fs = require('fs');
var ChessWebAPI = require('chess-web-api');
const { start } = require('repl');
var chessAPI = new ChessWebAPI();
var accountCreationDate;
var gamesArray = new Array();
var username = "gminghd";

chessAPI.getPlayer(username)
    .then(async function(response) {
        accountCreationDate = new Date(response.body.joined * 1000);
        await getPlayerDataAndPutIntoArray();
    }, function(err) {
        console.error(err);
    });

async function getPlayerDataAndPutIntoArray() {
    let iterativeYear = accountCreationDate.getFullYear();
    let iterativeMonth = accountCreationDate.getMonth() + 1;
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;
    console.log("Fetching data of account " + username + "... ");
    while (iterativeYear != currentYear || iterativeMonth != currentMonth + 1) {
        let response = await chessAPI.getPlayerCompleteMonthlyArchives(username, iterativeYear, iterativeMonth);
        gamesArray.push(response.body);
        console.log("Fetched data of year->" + iterativeYear + " month->" + iterativeMonth);
        if (iterativeMonth == 12 && currentYear > iterativeYear) {
            iterativeMonth = 1;
            iterativeYear++;
        } else {
            iterativeMonth++;
        }
    }
    console.log("Fetching completed. Analysing...\n");
    await analyseData();
}

async function analyseData() {
    let secoundsPlayed = 0;
    let gamesPlayed = 0;
    let uncountedGames = 0;

    for (let i = 0; i < gamesArray.length; i++) {
        let body = gamesArray[i].games;
        for (let j = 0; j < body.length; j++) {
            try {
                let startDate = body[j].pgn.split('[Date "')[1].split('"]')[0];
                let endDate = body[j].pgn.split('[EndDate "')[1].split('"]')[0];
                let startTime = body[j].pgn.split('[StartTime "')[1].split('"]')[0];
                let endTime = body[j].pgn.split('[EndTime "')[1].split('"]')[0];

                let startDateTime = getDateByDate(startDate + " " + startTime);
                let endDateTime = getDateByDate(endDate + " " + endTime);
                secoundsPlayed += (Math.round(endDateTime.getTime() / 1000) - Math.round(startDateTime.getTime() / 1000));
                gamesPlayed++;
            } catch (error) { uncountedGames++; }
        }
    }

    console.log(username + " started playing in (MONTH/YEAR): " + (accountCreationDate.getMonth() + 1) + "." + accountCreationDate.getFullYear());
    console.log(username + " played " + (Math.round(secoundsPlayed / (60 * 60))) + " hours");
    console.log(username + " also played in " + gamesPlayed + " chess matches\n");
    console.log("Couldn't analyse " + uncountedGames + " games due exceptions...")
}

//2021.05.29 12:11:25
function getDateByDate(dateString) {
    dateString = dateString.split(".").join(" ");
    dateString = dateString.split(":").join(" ");
    var array = dateString.split(" ");
    return new Date(array[0], array[1] - 1, array[2], array[3], array[4], array[5]);
}