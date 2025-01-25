// Constants
const css = document.documentElement.style;
const cssRead = getComputedStyle(document.documentElement);

const gridSize = [30,30];
    //Virus list
const virusesList = {
    //NOTE : These values are averages so may not be perfectly accurate.
    "SARS-COV-2" : {
        name : "SARS-COV-2 (Covid-19)",
        rRate : 3,
        mortalityRate : 0.442,
        timeInBody : 14,
        reinfectionRate : 1,
        timeScale : 7 //Weeks 
    },
    "Norovirus" : {
        name : "Norovirus",
        rRate : 7.26,
        mortalityRate : 0.001,
        timeInBody : 3,
        reinfectionRate : 10,
        timeScale : 1 //Days
    },
    "Influenza" : {
        name : "Influenza (Flu)",
        rRate : 1.45, 
        mortalityRate : 0.1,
        timeInBody : 4,
        reinfectionRate : 7,
        timeScale : 1 //Days
    },
    "Measles" : {
        name : "Measles",
        rRate : 15,
        mortalityRate : 0.1,
        timeInBody : 14,
        reinfectionRate : 0,
        timeScale : 7 //Weaks
    },

};

//Setting inital infected
var settingInitialInfected = true;

//Positions of infected
var infectedPositions = []; 
var generationsLeft = [];

//Tracking values
var numOfHealthyCells = 0;
var numOfInfectedCells = 0;
var numOfDeadCells = 0;
var numOfRecoveredCells = 0;

//Simulation variables
var virusName = null;
var rRate = null;
var mortalityRate = null;
var timeInBody = null;
var reinfectionRate = null;
var timeScale = null;

//Setting values
function SetInitialValues(virusNameInput){
    let data = virusesList[virusNameInput];
    console.log(data);

    virusName = data.name;
    rRate = data.rRate;
    mortalityRate = data.mortalityRate;
    timeInBody = data.timeInBody;
    reinfectionRate = data.reinfectionRate;
    timeScale = data.timeScale;
    

    console.log(`NAME ${virusName} \nR RATE ${rRate} \nMORTALITY RATE ${mortalityRate}\nTIME IN BODY ${timeInBody}\nREINFECTION RATE ${reinfectionRate}`);
}

//Creating the original grid
function CreateGrid() {
    const board = document.querySelector('.board');
    board.innerHTML = ''; // Clear any existing content

    for (let i = 0; i < gridSize[0]; i++) {
        const row = document.createElement('div');
        row.classList.add('row'); // Use the `.row` class for styling

        for (let j = 0; j < gridSize[1]; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell healthy'; // Start with healthy state
            cell.id = `${i},${j}`; // Store coordinates for future use
            row.appendChild(cell);
        }

        board.appendChild(row); // Add row to the board
    }
}

//Setting initial infected
function SetInfected(infectedPosition) {
    let targetCell = document.getElementById(`${infectedPosition[0]},${infectedPosition[1]}`);
    targetCell.className = "cell infected";
    infectedPositions.push(infectedPosition);
    generationsLeft.push(Math.floor(timeInBody / timeScale));
    CalculateNums();
}

//Attempting to infect others
function TryInfectOthers(infectedPosition){
    let targetDirections = [];

    //Generating directions
    let workingRRate = GenerateWeightedInteger(rRate);
    while(targetDirections.length < workingRRate){
        let attemptedDirection = Math.floor(Math.random() * 16) + 1;

        if(!targetDirections.includes(attemptedDirection)) targetDirections.push(attemptedDirection);
    }

    let directionMap = new Map([
        [1 , [-1,0]], //Up
        [2 , [0, 1]], //Right
        [3 , [1, 0]], //Down
        [4 , [0,-1]], //Left
        [5 , [-1,1]], //Up Right
        [6 , [1, 1]], //Down Right
        [7 , [1, -1]], //Down Left
        [8 , [-1,-1]], //Up Left
        //2 out
        [9 ,  [-2,0]], //Up
        [10 , [0, 2]], //Right
        [11 , [2, 0]], //Down
        [12 , [0,-2]], //Left
        [13 , [-2,2]], //Up Right
        [14 , [2, 2]], //Down Right
        [15 , [2, -2]], //Down Left
        [16 , [-2,-2]], //Up Left
    ]);
    for(let targetDirection of targetDirections){ 
        offset = directionMap.get(targetDirection);

        let targetPoint = [infectedPosition[0] + offset[0],infectedPosition[1] + offset[1]];
        
        let validAttempt = true;
        //Out of bounds
        if((targetPoint[0] < 0) || (targetPoint[1] < 0) || (targetPoint[0] >= gridSize[0]) || (targetPoint[1] >= gridSize[1])) validAttempt = false;
        
        //Infecting already infected / dead cell
        else if(document.getElementById(`${targetPoint[0]},${targetPoint[1]}`).classList.contains("infected") || document.getElementById(`${targetPoint[0]},${targetPoint[1]}`).classList.contains("dead")) validAttempt = false;
   
        //Infecting recovered cell
        else if(document.getElementById(`${targetPoint[0]},${targetPoint[1]}`).classList.contains("recovered")){
            let infectionChance = reinfectionRate / 100;
            if(Math.random() > infectionChance) validAttempt = false;
        }

        if(validAttempt){
            //Actually infecting a target square
            SetInfected(targetPoint);
        }
    }

}

function GenerateWeightedInteger(float){
    let integerPart = Math.floor(float);  // Integer part of the float
    let fractionPart = float - integerPart; // Fractional part of the float

    // Use the fractional part as a weight for rounding
    let randomValue = Math.random();

    if (randomValue < fractionPart) {
        return integerPart + 1; // Round up if random number is less than the fractional part
    } else {
        return integerPart; // Round down if random number is greater or equal to the fractional part
    }
}

//Simulation Step
function SimulationStep(){
    Recoveries();

    let infectedPositionsCopy = structuredClone(infectedPositions)
    for(let infectedPosition of infectedPositionsCopy){
        TryInfectOthers(infectedPosition);
    }
    
    console.log(`${JSON.stringify(infectedPositions)} ${JSON.stringify(generationsLeft)}`)
    CalculateNums();
}

//Recovering people
function Recoveries(){
    let positionsToRemove = [];
    
    for(let i = 0; i < generationsLeft.length; i++){
        if(generationsLeft[i] === 0) positionsToRemove.push(i);
        else generationsLeft[i] = generationsLeft[i] - 1;
    }

    for(let i = positionsToRemove.length - 1; i > -1; i--){
        //Rolling to kill host
        if(Math.random() <= mortalityRate / 100) document.getElementById(`${infectedPositions[i][0]},${infectedPositions[i][1]}`).className = "cell dead";
        else document.getElementById(`${infectedPositions[i][0]},${infectedPositions[i][1]}`).className = "cell recovered";
        generationsLeft.splice(i, 1);
        infectedPositions.splice(i,1);
    }
}

//Setting values to track
function CalculateNums() {

    numOfHealthyCells = 0;
    numOfInfectedCells = 0;
    numOfDeadCells = 0;
    numOfRecoveredCells = 0;

    for(let i = 0; i < gridSize[0]; i++){
        for(let j = 0; j < gridSize[1]; j++){
            let targetCell = document.getElementById(`${i},${j}`);
            if(targetCell.classList.contains("healthy")) numOfHealthyCells ++;
            else if(targetCell.classList.contains("infected")) numOfInfectedCells++;
            else if(targetCell.classList.contains("dead")) numOfDeadCells++;
            else if(targetCell.classList.contains("recovered")) numOfRecoveredCells++;
        }
    }

    let numDisplay = document.getElementById("trackingNumDisplay");
    numDisplay.innerHTML = `<h1 class="displayText trackingNumDisplayText">Healthy : ${numOfHealthyCells} | Infected : ${numOfInfectedCells} | Dead : ${numOfDeadCells} | Recovered : ${numOfRecoveredCells}</h1>`;
}

//Starting simulation
document.querySelector('.simulationButton').addEventListener('click', function (event) {
    if(settingInitialInfected){
        settingInitialInfected = false;
        document.getElementById("simulationButton").innerHTML = `<h1 class="displayText simulationButtonText">Next Simulation Step</h1>`;
        CalculateNums();
        SimulationStep();
    }
    else{
        SimulationStep();

    }

});

document.querySelector('.board').addEventListener('click', function (event) {
    if (event.target.classList.contains('cell')) {
        let cellId = event.target.id;
        //Setting cell position
        let cellIdCut = (cellId.split(" ")[0]);
        cellIdCut = cellIdCut.split(",");
        cellPosition = [Number(cellIdCut[0]), Number(cellIdCut[1])];
        if(settingInitialInfected) SetInfected(cellPosition);
    }
});

//Setup search
function SetVirusSearch() {
    let targetList = document.getElementById("myUL");
    targetList.innerHTML = "";
    for(let virus in virusesList){
        targetList.innerHTML += `<li><h1 class="virusListItem displayText" id="${virus}">${virusesList[virus].name}</h1></li>`;
    }
}

function AdjustSearchOptions(){
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('myInput');
    filter = input.value.toUpperCase();
    ul = document.getElementById("myUL");
    li = ul.getElementsByTagName('li');
   
    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("h1")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

document.querySelector(".search").addEventListener('click', function (event) {
    if (event.target.classList.contains('virusListItem')) {
        console.log(event.target.id); 
        console.log(typeof event.target.id); 
        SetInitialValues(event.target.id);
    }
});

//DISCLAIMER
alert("DISCLAIMER : The values used for this sim may not be entirely accurate. This is more of a proof of concept and a personal project");

window.onload = SetInitialValues("SARS-COV-2");
window.onload = CreateGrid();
window.onload = CalculateNums();
window.onload = SetVirusSearch();