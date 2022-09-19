const carCanvas = document.getElementById("carCanvas");
const networkCanvas = document.getElementById("networkCanvas");
carCanvas.width = 200;
const carCtx = carCanvas.getContext("2d");
    
networkCanvas.width = 400;
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width/2, carCanvas.width*0.9);

let cars = [];
let traffic = new Traffic(70);
let bestCar = null;

let generationCount = 0;
let generationsSinceLastRecord = 0;
playing = false;

let highscore = 0;

let bestCars = [];

let gameRecord = 0;
let lastGameRecord = Date.now();


carCanvas.height=window.innerHeight;
networkCanvas.height = window.innerHeight;
road.draw(carCtx);

function play(){
    init();
    animate();
}

function init(){
    if(localStorage.getItem("highscore")){
        highscore = localStorage.getItem("highscore");
        generationsSinceLastRecord = localStorage.getItem("generationsSinceLastRecord");
        generationCount = localStorage.getItem("generations");
    }
    generationCount++;
    gameRecord = 0;
    lastGameRecord = Date.now();
    playing = true;
    
    console.log("starting new simulation")
    console.log("generations since last record: "+generationsSinceLastRecord);
    console.log("initializing generation "+generationCount);
    

    cars = generateCars(500); 
    traffic = new Traffic(70, road.laneCount, 25000);
    bestCar = cars[0];
    if(localStorage.getItem("bestBrains")){
        console.log("loading best car");
        for(let i = 0; i < cars.length; i++){
            cars[i].brain = JSON.parse(localStorage.getItem("bestBrains"))[bestCars.length - 1];
            if(i != 0){
                NeuralNetwork.mutate(cars[i].brain, 0.05 + highscore < 7 ? 0.3: (Math.sqrt(generationsSinceLastRecord) / 100));
            }
        }    
    }
}

function generateCars(N){
    const cars = [];
    for(let i = 1; i <=N; i++){
        cars.push(new Car(road.getLaneCenter(1), 50, 30, 50, "AI"));
    }
    return cars;
}

function save(){
    console.log("new best car saved");
    localStorage.setItem("bestBrains", JSON.stringify(bestCars[bestCars.length - 1].brain));
}

function discard(){
    console.log("best cars discarded");
    localStorage.removeItem("bestBrains");
}

function saveTrainingStats(){
    console.log("training stats saved");
    localStorage.setItem("generations", generationCount);
    localStorage.setItem("highscore", highscore);
    localStorage.setItem("generationsSinceLastRecord", generationsSinceLastRecord);
}

function evaluateSimulation(){
    carsSurvived = false;
    carsMoving = false;
    for(let i = 0; i < cars.length; i++){
        if(!cars[i].damaged){
            carsSurvived = true;
        } 
        if(cars[i].isMovingForward()){
            carsMoving = true;
        }
        let passedCount = 0;
        for(let j = 0; j < traffic.cars.length; j++){
            if( cars[i].y < traffic.cars[j].y){
               passedCount++;
            }
        }
        cars[i].passedCount = passedCount;
    }
    potentialBestCar = cars.find(c => c.passedCount == Math.max(...cars.map(car => car.passedCount)));
    if(gameRecord <  potentialBestCar.passedCount){
        lastGameRecord = Date.now();
        // if significantly better than globalRecord save the car
        if(highscore + 2 < potentialBestCar.passedCount && potentialBestCar.passedCount > 5){
            bestCars.push(potentialBestCar);
            save();
        } else if (highscore < 7 && potentialBestCar.passedCount > highscore){
            bestCars.push(potentialBestCar);
            save();
        }
        gameRecord = potentialBestCar.passedCount;
        return true;
    }else {
        return (+lastGameRecord + 60000) > (+Date.now()) && carsSurvived && carsMoving;
    }
}

function animate(time){
    
    traffic.update(road.borders);
    for(i = 0; i < cars.length; i++){
        cars[i].update(road.borders, traffic.cars);
    }
   
    carCanvas.height=window.innerHeight;
    networkCanvas.height = window.innerHeight;
    carCtx.save();
    bestCar = cars.find(c=> c.y == Math.min(...cars.map(c=> c.y)))
    
    carCtx.translate(0, -bestCar.y+window.innerHeight *0.7);
    road.draw(carCtx);
    traffic.draw(carCtx);
    
    carCtx.globalAlpha = 0.2;
    //car2.draw(carCtx);
    for(i = 0; i < cars.length; i++){
        cars[i].draw(carCtx, "blue");
    }
    carCtx.globalAlpha=1;
    bestCar.draw(carCtx, "blue", true);

    carCtx.restore();

    networkCtx.lineDashOffset=-time/50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    if(evaluateSimulation()){
        requestAnimationFrame(animate)
    }else {
        console.log("simulation end");
        console.log("Global record: "+ highscore+ "\n maximum of this game: "+gameRecord)
        if(playing){
            
            if(highscore < gameRecord){
                highscore = gameRecord;
                generationsSinceLastRecord = 1;
            }else {
                generationsSinceLastRecord++;
            }
            saveTrainingStats();
            init();            
            animate();
        }
    }
}

