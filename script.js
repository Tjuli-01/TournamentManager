const _winnerPoints = 4;
const _TiePoints = 2;
const _loserPoints = 1;
class Participant {
    constructor(name) {
        this.name = name || "Unnamed";
        this.points = 0;
        this.score = 0;
    }
}

class Match {
    constructor(participant1, participant2) {
        this.participant1 = participant1;
        this.participant2 = participant2;
        this.resultScore = new Result(0, 0);
    }


    calculatePoints() {
        if (this.participant1.name === "BYE") {
            this.resultScore.participant1Score = -1;
        }
        if (this.participant2.name === "BYE") {
            this.resultScore.participant2Score = -1;
        }
        this.participant1.score += Math.max(0, this.resultScore.participant1Score);
        this.participant2.score += Math.max(0, this.resultScore.participant2Score);
        if (this.resultScore.participant1Score > this.resultScore.participant2Score) {
            this.participant1.points += _winnerPoints;
            this.participant2.points += _loserPoints;
        } else if (this.resultScore.participant1Score < this.resultScore.participant2Score) {
            this.participant2.points += _winnerPoints;
            this.participant1.points += _loserPoints;
        } else {
            this.participant1.points += _TiePoints;
            this.participant2.points += _TiePoints;
        }
    }
}


class Result {
    constructor(participant1Score, participant2Score) {
        this.participant1Score = participant1Score;
        this.participant2Score = participant2Score;
    }
}

class Round {
    constructor(matches) {
        this.matches = matches || [];
    }
}

class Tournament {
    constructor() {
        this.rounds = [];
        this.participants = [];
        this.rowedParticipants = [];
    }

    addRound(round) {
        this.rounds.push(round);
    }
    addParticipant(participant) {
        if (this.hasStarted()) {
            throw new Error("Cannot add participants after a round has been played");
        }
        this.participants.push(participant);
    }


    sortParticipants() {
        this.participants.sort((a, b) => {
        
            if (a.points !== b.points) {
                return b.points - a.points; // sort by points
            }
            if (a.score !== b.score) {
                return b.score - a.score; // then sort by score 
            }
            return a.name.localeCompare(b.name);
        });
    }

    hasStarted() {
        return this.rounds.length > 0;
    }

    drawRound() {
        if (this.rounds.length === 0) {
            this.setupRoundSystem();
        }
        let arrToRotate = [...this.rowedParticipants];
        let rotatedParticipants = [arrToRotate.shift()]; //pop the first so we can rotate the array

        const round = new Round();
        const currentRound = this.rounds.length;
        const participantCount = this.rowedParticipants.length;
        const matches = [];
        for (let i = 0; i < participantCount / 2; i++) {
            matches.push(new Match(null, null));
        }
        for (let i = 0; i < currentRound; i++) {
            arrToRotate.push(arrToRotate.shift());
        }
        rotatedParticipants.push(...arrToRotate);

        for (let i = 0; i < participantCount; i++) {
            const participant = rotatedParticipants[i];
            for (let j = 0; j < matches.length; j++) {
                if (i === j) {
                    matches[j].participant1 = participant;
                    break;
                }
                else if (i === participantCount - 1 - j) {
                    matches[j].participant2 = participant;
                    break;
                }

            }


        }
        round.matches = matches;
        return round;

    }

    setupRoundSystem() {
        //sort the participants alphabethicly
        this.participants.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        this.rowedParticipants = [...this.participants];
        if (this.rowedParticipants.length % 2 !== 0) {
            this.rowedParticipants.push(new Participant("BYE"));
        }
        this.sortParticipants();

    }


    havePlayedBefore(participant1, participant2) {
        for (const round of this.rounds) {
            for (const match of round.matches)
                if (match.participant1 === participant1 && match.participant2 === participant2) {
                    return true;
                } else if (match.participant1 === participant2 && match.participant2 === participant1) {
                    return true;
                }

        }
        return false;
    }
    saveToLocalStorage(key) {
        const serializedData = JSON.stringify(this);
        localStorage.setItem(key, serializedData);
    }

    static loadFromLocalStorage(key) {
        const serializedData = localStorage.getItem(key);
        if (serializedData) {
            const tournamentData = JSON.parse(serializedData);
            const tournament = new Tournament();
           
            Object.assign(tournament, tournamentData);

            tournament.participants = tournament.participants.map(participantData => {
                const participant = new Participant();
                Object.assign(participant, participantData);
                return participant;
            });
            tournament.rounds = tournament.rounds.map(roundData => {
                const round = new Round();
                Object.assign(round, roundData);
                round.matches = round.matches.map(matchData => {
                    const match = new Match();
                    Object.assign(match, matchData);
                    if (match.participant1.name !== "BYE") {
                        match.participant1 = tournament.participants.find(participant => participant.name === matchData.participant1.name);
                    }
                    if (match.participant2.name !== "BYE") {
                        match.participant2 = tournament.participants.find(participant => participant.name === matchData.participant2.name);
                    }
                    return match;
                });
                return round;
            });
            if (tournament.hasStarted) {
                tournament.setupRoundSystem();
            }
            return tournament;
        } else {
            return null;
        }
    }

}

function loadTournament() {
    let tournament = Tournament.loadFromLocalStorage('tournament');
    if (!tournament) {
        tournament = new Tournament();
    } else {
        if (tournament.hasStarted()) {
            let start = document.getElementById("start");
            start.innerText = "Next Round"
            let addParticipant = document.getElementById("addParticipant");
            addParticipant.remove();

        }
    }

    return tournament;
}
function deleteTournament() {

    if (prompt("Are you sure you want to delete the tournament? \nThe tournament will be gone FOREVER (a long time) \nMake sure to export the table before \nType CONFIRM to confirm") === 'CONFIRM') {
        localStorage.removeItem("tournament");
        location.reload();
    }

}
function saveTournament() {
    tournament.saveToLocalStorage("tournament");
}

const tournament = loadTournament();


function addParticipant() {
    let name = prompt("Enter participant name:");
    if (!name) {
        alert("You must enter a name");
        return;
    }
    if (name.toUpperCase() === "BYE") {
        alert("You can't add a participant with the name BYE")
        return; //cant add bye manually
    }
    if (tournament.participants.find(participant => participant.name === name)) {
        alert("A participant with that name already exists")
        return;
    }
    const participant = new Participant(name);
    tournament.addParticipant(participant);
    updateParticipantsTable();
}


function start() {
    if (!tournament.hasStarted()) {
        let start = document.getElementById("start");
        start.innerText = "Next Round"
        let addParticipant = document.getElementById("addParticipant");
        addParticipant.remove();

    }
    const round = tournament.drawRound();
    tournament.addRound(round);
    updateRoundsTable(tournament.rounds.length - 1);

    recalculateScore();

}
function recalculateScore() {

    for (const participant of tournament.participants) {
        participant.points = 0;
        participant.score = 0;
    }
    for (const round of tournament.rounds) {
        for (const match of round.matches) {
            match.calculatePoints();
        }
    }
    updateParticipantsTable(tournament.rounds.length - 1);
}

function updateParticipantsTable() {
    const participantsDiv = document.getElementById("participants");
    participantsDiv.innerHTML = "";

    const table = document.createElement("table");
    const headerRow = table.insertRow();
    headerRow.innerHTML = "<th>Name</th><th>Points</th><th>Score</th>";
    tournament.sortParticipants();
    tournament.participants.forEach(participant => {
        const row = table.insertRow();
        const nameCell = row.insertCell();
        nameCell.textContent = participant.name;
        const pointsCell = row.insertCell();
        pointsCell.textContent = participant.points;
        const scoreCell = row.insertCell();
        scoreCell.textContent = participant.score;
    });
    participantsDiv.appendChild(table);
}

function updateRoundsTable(selectedRoundIndex) {
    const roundsContainerDiv = document.getElementById("roundsContainer");
    roundsContainerDiv.innerHTML = "<h2>Rounds</h2>";
    const roundsDiv = document.createElement("div");
    roundsDiv.id = "rounds";
    let selectElement = document.createElement("select");
    selectElement.id = "roundSelect";
    selectElement.addEventListener("change", function () {
        let selectedOption = parseInt(this.options[this.selectedIndex].id);
        updateRoundsTable(selectedOption);
    });
    let selectAllOption = document.createElement("option");
    selectAllOption.text = "All";
    selectAllOption.id = -1
    selectElement.add(selectAllOption);
    for (let i = 0; i < tournament.rounds.length; i++) {
        let option = document.createElement("option");
        option.text = "Round " + (i + 1);
        option.id = i;
        selectElement.add(option);
    }
    selectElement.selectedIndex = selectedRoundIndex + 1;
    roundsContainerDiv.append(selectElement);
    roundsContainerDiv.append(roundsDiv);
    const table = document.createElement("table");
    tournament.rounds.forEach((round, roundIndex) => {
        if (selectedRoundIndex === -1 || roundIndex === selectedRoundIndex) {
            const row = table.insertRow();
            row.innerHTML = `<td><strong>Round ${roundIndex + 1}</strong></td>`;
            row.id = "round" + roundIndex;
            round.matches.forEach((match, matchIndex) => {
                const matchRow = table.insertRow();
                matchRow.id = "round" + roundIndex + ":match" + matchIndex;
                const participant1Cell = matchRow.insertCell();
                participant1Cell.textContent = match.participant1.name;
                const participant2Cell = matchRow.insertCell();
                participant2Cell.textContent = match.participant2.name;
                const scoreParticipant1Cell = matchRow.insertCell();
                const scoreParticipant1Input = document.createElement("input");
                scoreParticipant1Input.id = "participant1Score";
                scoreParticipant1Input.type = "number";
                scoreParticipant1Input.min = "0";
                scoreParticipant1Input.max = "10";
                scoreParticipant1Input.value = Math.max(0, match.resultScore.participant1Score);
                scoreParticipant1Input.oninput = function () {
                    this.value = Math.max(0, Math.min(10, this.value));
                    const thisMatch = tournament.rounds[roundIndex].matches[matchIndex];
                    thisMatch.resultScore.participant1Score = parseInt(this.value);
                    recalculateScore();
                };
                scoreParticipant1Cell.append(scoreParticipant1Input);

                const scoreParticipant2Cell = matchRow.insertCell();
                const scoreParticipant2Input = document.createElement("input");
                scoreParticipant2Input.id = "participant2Score";
                scoreParticipant2Input.type = "number";
                scoreParticipant2Input.min = "0";
                scoreParticipant2Input.max = "10";
                scoreParticipant2Input.value = Math.max(0, match.resultScore.participant2Score);
                scoreParticipant2Input.oninput = function () {
                    this.value = Math.max(0, Math.min(10, this.value));
                    const thisMatch = tournament.rounds[roundIndex].matches[matchIndex];
                    thisMatch.resultScore.participant2Score = parseInt(this.value);
                    recalculateScore();
                };
                scoreParticipant2Cell.append(scoreParticipant2Input);
            });
        }
        table.insertEmp
    });
    roundsDiv.appendChild(table);
}

function printElement(elementId) {

    const element = document.getElementById(elementId);
    const newWin = window.open("");
    const originalStyle = document.querySelector('style');
    if (originalStyle) {
        newWin.document.write(originalStyle.outerHTML);
    }

    newWin.document.write('<style>@page { size: landscape; margin: 0; } body { zoom: 0.75; padding: 12.7mm; -webkit-print-color-adjust: exact; }</style>');
    newWin.document.write(element.outerHTML);
    newWin.print();
    if (!isMobileBrowser()) {
        newWin.close();
    }
}

function isMobileBrowser() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    //Ofc regex is skid from chatgpt who tf knows regex
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

    return mobileRegex.test(userAgent);
}

updateParticipantsTable();
updateRoundsTable(-1);