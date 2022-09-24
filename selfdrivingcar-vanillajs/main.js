const carCanvas = document.getElementById("carCanvas");
const networkCanvas = document.getElementById("networkCanvas");
carCanvas.width = 200;
const carCtx = carCanvas.getContext("2d");


const highscoreContainer = document.getElementById("highscore");
const bestCarScoreContainer = document.getElementById("bestCarScore");
const followCarScoreContainer = document.getElementById("followCarScore")

const fpsContainer = document.getElementById("fps");
    
networkCanvas.width = 400;
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width/2, carCanvas.width*0.9);


let cars = [];
let traffic = new Traffic(70);
let playing = false;

let bestCar = null;
let followCar = null;

let generationCount = 0;
let generationsSinceLastRecord = 0;


let highscore = 0;

let bestCars = [];

let gameRecord = 0;
let lastGameRecord = Date.now();

let lastCarPassed = 0;
let lastCarsPassed = [];


carCanvas.height=window.innerHeight;
networkCanvas.height = window.innerHeight;
road.draw(carCtx);

statusElements = {
    highscoreContainer: highscoreContainer,
    bestCarScoreContainer: bestCarScoreContainer,
    followCarScoreContainer: followCarScoreContainer,
    fpsContainer: fpsContainer
};

const simulator = new Simulator(carCtx, networkCtx, road, statusElements, SimulationEnd);

function play(){
        playing = true; 

        traffic = new Traffic(70, road.laneCount, 20000);
        cars = generateCars(500);
        simulator.init(traffic, cars, loadBestCars(), loadTrainingStats());
     
        simulator.animate()
}

function SimulationEnd(bestCars){
    console.log(bestCars);
    simulator.playing = false;
    saveTrainingStats(simulator);
    save(bestCars);
    console.log(simulator);
    if(playing){
        play();
    }
}

function stopSimulation(){
    playing = false;
    simulator.stop();
}



function generateCars(N){
    const cars = [];
    for(let i = 1; i <=N; i++){
        cars.push(new Car(road.getLaneCenter(1), 50, 30, 50, "AI", generationCount*1000 + i));
    }
    return cars;
}

function save(bestCars){
    console.log("new best cars saved");
    let bestBrains = bestCars.map(c =>{ return c.brain});
    localStorage.setItem("bestBrains", JSON.stringify(bestBrains));
}

function loadBestCars(){
    let  bestBrains = JSON.parse(localStorage.getItem("bestBrains"));
    const cars = [];
    if(bestBrains){
        bestBrains.forEach(brain => {
            let car = new Car(road.getLaneCenter(1), 50, 30, 50, "AI", brain.batchNumber );
            car.brain = brain;
            cars.push(car);
        });
    }
    return cars;
}


function discard(){
    console.log("best cars discarded");
    localStorage.removeItem("bestBrains");
    localStorage.removeItem("generations");
    localStorage.removeItem("generationsSinceLastRecord");

    localStorage.removeItem("highscore");
    simulator.bestCars = [];
    simulator.highscore = 0;
    simulator.generationCount = 0;
    simulator.generationsSinceLastRecord = 0;
}


function loadTrainingStats(){
    return {
        highscore: localStorage.getItem("highscore") ?? 0,
        generationsSinceLastRecord: localStorage.getItem("generationsSinceLastRecord") ?? 0,
        generationCount: localStorage.getItem("generations")?? 0
    }
}


function saveTrainingStats(simulator){
    console.log("training stats saved");
    localStorage.setItem("generations", simulator.generationCount);
    localStorage.setItem("highscore", simulator.highscore);
    localStorage.setItem("generationsSinceLastRecord", simulator.generationsSinceLastRecord);
}




