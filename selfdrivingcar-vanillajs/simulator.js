class Simulator {

    constructor(carCtx, networkCtx ,road, statusElements, simulationEndCallback){
        this.carCtx = carCtx;
        this.networkCtx = networkCtx;
        this.road = road;
        this.statusElements = statusElements;
        //
        this.playing = false;


        // 
        this.cars = [];
        this.bestCar = null;
        this.followCar = null;
        this.lastGameRecord =  Date.now();
        this.lastCarPassed = Date.now();

        this.highscore = 0;
        this.gameRecord = 0;
        this.generationCount = 0;
        this.generationsSinceLastRecord = 0;

        
        //
        this.fps = 0;
        this.frames = 0;
        this.lastFpsCalc = 0;

        this.simulationEndCallback = simulationEndCallback;
    }


    evaluate(){
        let carsSurvived = false;
        let carsMoving = false;
        let carsPassed = [];
       
        // evaluate if there are surviving cars that move 
        for(let i = 0; i < this.cars.length; i++){
            if(!this.cars[i].damaged){
                carsSurvived = true;
            } 
            if(this.cars[i].isMovingForward()){
                carsMoving = true;
            }
            carsPassed[i] = this.cars[i].carsPassed;
        }
        if(lastCarsPassed.length == carsPassed.length){
            for(let i = 0; i < carsPassed.length; i++){
                if(carsPassed[i] > lastCarsPassed[i]){
                    this.lastCarPassed = Date.now();
                    break;
                }
            }
        }
        lastCarsPassed = [...carsPassed];
    
        // get car with current highest score
        let potentialBestCar = this.cars.find(c => c.score == Math.max(...this.cars.map(car => car.score)));
        

        if(this.gameRecord <  potentialBestCar.score){
            this.lastGameRecord = Date.now();
            this.gameRecord = potentialBestCar.score;
        
            return true;
        }else {
            if((+this.lastGameRecord + 120000) < (+Date.now())){
                console.log("no new record since 120 seconds");
                return false;
            }else if(!carsMoving){
                console.log("no cars moving forward");
                return false;
            }else if(!carsSurvived){
                console.log("no surviving cars");
                return false;
            } else if(this.lastCarPassed + 60000 < Date.now()){
                console.log("no cars passed since 60 seconds");
                return false;
            } else {
                return true;
            }
        }
    }

    init(traffic, cars, bestCars = [], stats ){
        this.traffic = traffic;
        this.cars = cars;

        this.playing = true;

        this.highscore = stats.highscore ;
        this.generationCount = stats.generationCount;
        this.generationsSinceLastRecord = stats.generationsSinceLastRecord;
        
        this.generationCount++;
        this.gameRecord = 0;
        this.lastGameRecord = Date.now();
        this.lastCarPassed = Date.now();
    
        this.lastCarsPassed = [];
    
        console.log("initializing new simulation")
        console.log("initializing generation "+this.generationCount);
        if(this.highscore != 0){
            console.log("generations since last record: "+this.generationsSinceLastRecord);
        }
    
        console.log("initializing "+this.cars.length+" cars ");

        bestCar = this.cars[0];
        if(bestCars.length > 0){
            let randomizationFactor =  Math.min(1, 0.15 + (this.highscore < 5000 ) ? ( 0.2 + Math.sqrt(this.generationsSinceLastRecord*10) / 100): ( Math.sqrt(generationsSinceLastRecord*10) / 100)) ;
            console.log("mutating previous best cars with randomization factor " +randomizationFactor);
            for(let i = 0; i < this.cars.length; i++){
                this.cars[i].brain = JSON.parse(JSON.stringify(bestCars[i % bestCars.length].brain)) // get latest best cars brains
                if(i >= 5){
                    NeuralNetwork.mutate(this.cars[i].brain,randomizationFactor, this.generationCount * 1000 + i);
                }
            }    
        }
    }

    getBestCar(cars){
        return cars ? cars.find(c=> c.score == Math.max(...cars.map(c=> c.score))) : null;
    }
    
    getFollowCar(cars){
        return cars.find(c => c.y == Math.min(...([...cars].filter(c => !c.damaged).map(c => c.y))))?? getBestCar();
    }

    

    animate  = (time) => {
        


        this.calcFps();
        this.showFps();
        this.traffic.update(this.road);
        
        for(let i = 0; i < this.cars.length; i++){
            this.cars[i].update(road, this.traffic.cars);
        }
    
        this.carCtx.canvas.height=window.innerHeight;
        this.networkCtx.canvas.height = window.innerHeight;
        this.carCtx.save();
    
        this.bestCar = this.getBestCar(this.cars);
        this.followCar = this.getFollowCar(this.cars);
    
        if(this.followCar){
            this.carCtx.translate(0, -this.followCar.y+window.innerHeight *0.7);
        }
    
        this.road.draw(carCtx);
        this.traffic.draw(carCtx);
    
        carCtx.globalAlpha = 0.2;
        //car2.draw(carCtx);
        for(let i = 0; i < this.cars.length; i++){
            if(!this.cars[i]){
                console.log(this.cars[i]);
            }
            this.cars[i].draw(this.carCtx, "blue");
        }
        this.carCtx.globalAlpha=1;
        if(this.followCar){
            this.followCar.draw(this.carCtx, "blue", true);
        }
        
        this.showStats();
        this.showNetwork(time);
        
        this.carCtx.restore();
       
        if(this.playing){
            if(this.evaluate()){
                requestAnimationFrame(this.animate);
                return true;
            }else {
                this.stop();
            }
        }
    }

    showNetwork(time){
        if(this.followCar){
            this.networkCtx.lineDashOffset= -(typeof time === "undefined" ? 0 : time)/50;
            Visualizer.drawNetwork(this.networkCtx, this.followCar.brain);
        }
    }

    showStats(){
        this.statusElements.highscoreContainer.innerText = Math.abs(Math.floor(this.highscore < this.bestCar.score ? this.bestCar.score : this.highscore));
        if(this.followCar){
            this.statusElements.bestCarScoreContainer.innerText = Math.floor(this.bestCar.score);
            this.statusElements.followCarScoreContainer.innerText = Math.floor(this.followCar.score);
            
           
        }
    }

    calcFps (){
        this.frames++;
        if(this.lastFpsCalc  + 50< Date.now()){
            this.fps = Math.round(this.frames / ((Date.now() - this.lastFpsCalc) / 1000));
            this.lastFpsCalc = Date.now();
            this.frames = 0;
        }
    }
    
    showFps(){
        this.statusElements.fpsContainer.innerText = this.fps;
    }

    

    stop(){
        if(this.playing){
            this.playing = false;
            console.log("simulation end");
    
            console.log("Global record: "+ this.highscore+ "\n maximum of this game: "+this.gameRecord);
            console.log("best cars of this round: ",bestCars);

            console.log("\n\n\n\n");
            
            console.log(this.highscore < this.gameRecord, this.highscore, this.gameRecord);
            if(this.highscore < this.gameRecord){
                this.highscore = this.gameRecord;
                this.generationsSinceLastRecord = 1;
               
            }else {
                this.generationsSinceLastRecord++;
            }

            
            this.simulationEndCallback(getXBestCars(this.cars.concat(this.bestCars ?? []), 5))
        }
    }
}