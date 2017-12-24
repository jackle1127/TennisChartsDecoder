var SERVE_CODE = {
    4: 'wide',
    5: 'body',
    6: 'downTheT'
};

var ERROR_CODE = {
    'n': 'net',
    'w': 'wide',
    'd': 'deep',
    'x': 'wideAndDeep',
    'g': 'footFaults',
    'e': 'unknown',
    '!': 'shank'
};

var ERROR_TYPE = {
    '#': 'forced',
    '@': 'unforced'
};

var RALLY_CODE = {
    'f': 'forehandGround',
    'b': 'backhandGround',
    
    'r': 'forehandSlice',
    's': 'backhandSlice',
    
    'v': 'forehandVolley',
    'z': 'backhandVolley',

    'o': 'forehandOverhead',
    'p': 'backhandOverhead',
    
    'u': 'forehandDropShot',
    'y': 'backhandDropShot',

    'l': 'forehandLob',
    'm': 'backhandLob',
    
    'h': 'forehandHalfVolley',
    'i': 'backhandHalfVolley',

    'j': 'forehandSwingingVolley',
    'k': 'backhandSwingingVolley',

    't': 'trick',

    'q': 'unknown',
};

var RALLY_DIRECTION_CODE = {
    1: 'right',
    2: 'downTheCourt',
    3: 'left'
};

var RETURN_DEPTH = {
    7: 'serviceBox',
    8: 'serviceLine',
    9: 'baseline'
};

var POSITION_CODE = {
    '+': 'approach',
    '-': 'net',
    '=': 'baseline'
};

var RALLY_POINT_CODE = {
    '*': 'point'
};

var SERVE_POINT_CODE = {
    '*': 'ace',
    '#': 'unreturnable'
};

var SPECIAL_CODE = {
    ';': 'netCord'
}

var LET_CODE = {
    'c': 'let'
}

var togglePlayer = 0;
var rowProcessed = 0;

// Shot object.
function Shot() {
    this.type = 'shot';
    this.error = 'none';
    this.position = 'unknown';
    this.depth = 'unknown';
    this.point = 'no';
    this.let = 'no';
}

function Point() {
    this.type = 'point';
    this.players = [0, 1];
    this.winner = -1;
    this.shots = [];
}

function Game() {
    this.type = 'game';
    this.winner = -1;
    this.points = [];
}

function Set() {
    this.type = 'set';
    this.winner = -1;
    this.games = [];
}

function Match() {
    this.type = 'match';
    this.players = [];
    this.tournament = '';
    this.winner = -1;
    this.sets = [];
}


var match;
function decodeClick() {
    /*var point = decodePoint(document.getElementById('txtCode1').value,
            document.getElementById('txtCode2').value);
    document.getElementById('output').innerText = 
            JSON.stringify(point, null, 2);
    */
    var matchData = textToArray(document.getElementById('txtPointCodes').value.toLowerCase());
    //console.log(data);
    match = new Match();
    //matt = new Match();
    match.players = [document.getElementById('txtPlayer1').value,
            document.getElementById('txtPlayer2').value];
    match.tournament = document.getElementById('txtTournament').value;
    if (!decodeMatch(match, matchData)) {
        //alert("Code has errors.");
    }
    //console.log(match);
    //JSON.stringify(match, null, 2);
}

// Function to turn tab separated text into a 2D array.
function textToArray(text) {
    // Trim newlines at the end.
    while (text.endsWith('\n')) {
        text = text.substring(0, text.length - 1);
    }
    
    var newArray = text.split('\n');
    for (var i = 0; i < newArray.length; i++) {
        newArray[i] = newArray[i].split('\t');
    }
    return newArray;
}

// Takes an array of first and second shots.
// Add the sets to the provided match object.
function decodeMatch(match, data) {
    rowProcessed = 0; // For debugging
    togglePlayer = 0; // To toggle players between the games.
    var score = [0, 0];
    while(data.length > 0) {
        var set = new Set();
        if (!decodeSet(set, data)) {
            return false;
        }
        // Store the set and the score before the win.
        match.sets.push([[score[0], score[1]], set]);
        score[set.winner]++;
        if (score[0] == 3) {
            match.winner = match.players[0];
            return true;
        } else if (score[1] == 3) {
            match.winner = match.players[1];
            return true;
        }
    }
    // When run out of data, the set winner is the winner of the last set.
    // In case this is a smaller 3 set match.
    match.winner = match.players[match.sets[match.sets.length - 1][1].winner];
    return true;
}

// Takes an array of first and second shots.
// Add the games to the provided set object.
// Truncates the data array only for that set.
function decodeSet(set, data) {
    var score = [0, 0];
    while(data.length > 0) {
        var game = new Game();
        game.tieBreak = (score[0] == 6 && score[1] == 6) ? 'yes' : 'no';
        if (!decodeGame(game, data)) {
            return false;
        }
        togglePlayer = 1 - togglePlayer;
        // Store the set and the score before the win.
        set.games.push([[score[0], score[1]], game]);
        score[game.winner]++;
        if (Math.abs(score[0] - score[1]) >= 2) {
            if (score[0] >= 6 || score[1] >= 6) {
                set.winner = game.winner;
                return true;
            }
        } else {
            if (score[0] >= 7 || score[1] >= 7) {
                set.winner = game.winner;
                return true;
            }
        }
    }
    return true;
}

// Takes an array of first and second shots.
// Add the points to the provided game object.
// Truncates the data array only for that set.
function decodeGame(game, data) {
    var score = [0, 0];
    
    // To do internal server swithching for tie-break games only.
    var tieBreakSwitchCountDown = 1; // Switch server after first serve.
    var tieBreakSwitch = false;
    
    while(data.length > 0) {
        var point = new Point();
        point.players = [togglePlayer, 1 - togglePlayer];
        if (!decodePoint(point, data[0][0], data[0][1])) {
            return false;
        }
        
        // Remove the first data row.
        console.log((rowProcessed++) + ' ' + data[0][0] + ' ' + data[0][1]);
        data.shift();
        
        // Store the set and the score before the win.
        if (game.tieBreak == 'no') { // If normal game.
            var winner = point.winner;
            game.points.push([[score[0], score[1]], point]);
            if (score[0] < 3 && score[1] < 3) {
                score[winner]++;
            } else if (score[0] < 3 || score[1] < 3) { // If one of them is less than 40.
                score[winner]++;
                
                // If point winner get above 40. The opponent is still below 40.
                if (score[winner] == 4) {
                    game.winner = winner;
                    return true;
                }
            } else { // The deuce trading part.
                if (score[winner] == score[1 - winner]) {
                    score[winner]++;
                } else {
                    if (score[winner] == 4) { // If the point winner already has AD.
                        game.winner = winner;
                        return true;
                    } else if (score[1 - winner] == 4) { // If opponent has AD.
                        score[1 - winner] = 3; // Take AD from opponent.
                    }
                }
            }
        } else { // If game is a tie-break.
            // Switch server every 2 points.
            if (tieBreakSwitchCountDown == 0) {
                tieBreakSwitch = !tieBreakSwitch;
                tieBreakSwitchCountDown = 2;
            }
            tieBreakSwitchCountDown--;
            if (tieBreakSwitch) {
                point.players[0] = 1 - point.players[0];
                point.players[1] = 1 - point.players[1];
                point.winner = 1 - point.winner;
            }
            var winner = point.winner;
            game.points.push([[score[0], score[1]], point]);
            score[winner]++;
            if (Math.abs(score[0] - score[1]) >= 2) {
                if (score[0] >= 7 || score[1] >= 7) {
                    game.winner = winner;
                    return true;
                }
            }
        }
        
    }
    return true;
}


function decodePoint(point, first, second) {
    function decodeString(point, pointString, secondServe) {
        pointString = trimLets(pointString);
        while (pointString.length > 0) {
            var shot = new Shot();
            // Decode the shot and truncate the pointString
            pointString = decodeShot(shot, pointString);
            
            // If there's an error in the code.
            if (pointString == null) {
                //alert("'" + pointString + "'");
                return false;
            }
            
            shot.player = point.players[player];
            point.shots.push(shot);
            // If there's a error in the second serve but there's no
            // explicit forced or unforced notification, shot still counts as a point.
            if (secondServe && shot.error != 'none') {
                shot.point = 'yes';
            }
            if (shot.point !== 'no') {
                if (shot.error == 'none') {
                    point.winner = point.players[player];
                } else {
                    point.winner = point.players[1 - player];
                }
            }
            
            // Toggle between players.
            // This is not the player variable of the point object.
            player = 1 - player;
        }
        return true;
    }
    
    function trimLets(str) {
        while (str.startsWith('c')) { // Trim out lets.
            str = str.substring(1);
        }
        return str;
    }
    
    first = trimLets(first);
    
    var shot = new Shot();
    first = decodeShot(shot, first); // Serve.
    var player = 0; // This variable is to toggle between the server and receiver.
    shot.player = point.players[player];
    point.shots.push(shot);
    
    if (shot.point !== 'no') {
        point.winner = point.players[0];
    } else {
        if (shot.error != 'none') { // Error in the first serve.
            player = 0;
            if (!decodeString(point, second, true)) { // If one of the shots is not valid.
                return false;
            }
        } else {
            player = 1;
            if (!decodeString(point, first, false)) { // If one of the shots is not valid.
                return false;
            }
        }
    }
    //console.log(point);
    return true;
}

// Decode one shot out of the point code.
// Return an array containing a the shot and the truncated string.
function decodeShot(shot, pointString) {
    shot.string = pointString;
    var valid = false; // Check if there's an invalid character.
    var code = pointString.charAt(0);
    if (SERVE_CODE[code] !== undefined) {
        shot.category = 'serve';
        shot.direction = SERVE_CODE[code];
        // Read next.
        pointString = pointString.substring(1);
        code = pointString.charAt(0);
        valid = true;
    } else if (RALLY_CODE[code] !== undefined) {
        shot.category = 'rally';
        shot.shotType = RALLY_CODE[code];
        pointString = pointString.substring(1);
        code = pointString.charAt(0);
        valid = true;
    } else if (code == 'S') { // Entire point is missed but server wins.
        shot.category = 'serve';
        shot.direction = 'unknown';
        shot.point = 'yes';
        shot.error = 'none';
        pointString = pointString.substring(1);
        code = pointString.charAt(0);
        valid = true;
    } else if (code == 'R') { // Entire point is missed but receiver wins.
        shot.category = 'serve';
        shot.direction = 'unknown';
        shot.point = 'yes';
        shot.error = 'yes';
        pointString = pointString.substring(1);
        code = pointString.charAt(0);
        valid = true;
    }
    // If it's neither a serve nor a rally.
    if (!valid) {
        alert((rowProcessed + 1) + ": Bad category: '" + pointString + "'");
        return null;
    }
    
    var attributeFound = true;
    while (attributeFound) {
        attributeFound = false;
        
        if (shot.category == 'rally' && RALLY_POINT_CODE[code] !== undefined) {
            shot.point = 'yes';
            pointString = pointString.substring(1);
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
        
        if (shot.category == 'serve' && SERVE_POINT_CODE[code] !== undefined) {
            shot.point = SERVE_POINT_CODE[code];
            pointString = pointString.substring(1);
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
        
        if (SPECIAL_CODE[code] !== undefined) {
            shot.special = SPECIAL_CODE[code];
            pointString = pointString.substring(1);
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
        
        if (POSITION_CODE[code] !== undefined) {
            shot.position = POSITION_CODE[code];
            pointString = pointString.substring(1);
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
        
        if (RALLY_DIRECTION_CODE[code] !== undefined) {
            shot.direction = RALLY_DIRECTION_CODE[code];
            pointString = pointString.substring(1);
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
        
        if (RETURN_DEPTH[code] !== undefined) {
            shot.depth = RETURN_DEPTH[code];
            pointString = pointString.substring(1);
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
        
        if (ERROR_CODE[code] !== undefined) {
            shot.error = ERROR_CODE[code];
            pointString = pointString.substring(1);
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
        
        if (ERROR_TYPE[code] !== undefined) {
            shot.errorType = ERROR_TYPE[code];
            if (shot.error == 'none') {
                shot.error = 'yes';
            }
            pointString = pointString.substring(1);
            shot.point = 'yes';
            code = pointString.charAt(0);
            attributeFound = true;
            continue;
        }
    }
    
    //if (shot.category == 'serve') valid = true;
    
    /*if (!valid) {
        alert((rowProcessed + 1) + ": Bad attributes: '" + pointString + "'");
        return null;
    }*/
    return pointString;
}


/* for validation
var testList = [];
match.sets.forEach(function (set) {
    set[1].games.forEach(function (game) {
        game[1].points.forEach(function(point) {
            testList.push(point[0])
        });
    });
});
*/

function validateClick() {
    var testList = [];
    match.sets.forEach(function (set) {
        set[1].games.forEach(function (game) {
            game[1].points.forEach(function(point) {
                var pointScore = [0, 0];
                pointScore[point[1].players[0]] = point[0][0];
                pointScore[point[1].players[1]] = point[0][1];
                testList.push(pointScore);
            });
        });
    });
    
    var scoreMap = {
        '0': '0',
        '15': '1',
        '30': '2',
        '40': '3',
        'AD': '4'
    };
    var scores = textToArray(document.getElementById('txtValidate').value);
    var allMatch = true;
    for (var i = 0; i < scores.length; i++) {
        var score = scores[i][0].split('-');
        if (scoreMap[score[0]] !== undefined) score[0] = scoreMap[score[0]];
        if (scoreMap[score[1]] !== undefined) score[1] = scoreMap[score[1]];
        if (score + '' == testList[i]) {
            console.log((i + 1) + ': match: ' + score);
        } else {
            console.log((i + 1) + ': ' + score + ' | ' + testList[i]);
            allMatch = false;
        }
    }
    if (allMatch) console.log('All scores match!');
}
