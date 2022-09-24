class Car{
    

    constructor(x, y, width, height, type, batchNumber ){
        
        this.x = x;
        this.y = y;
        this.width= width;
        this.height = height;
        this.type = type;
        this.ticks = 0;
        
        this.speed = 0;
        this.totalSpeed = 0;

        this.acceleration = 0.4;
        this.reverseAcceleration = 0.3;
        this.maxReverseSpeed = 2;

        this.totalDistanceToLaneCenter = 0;
        this.carsPassed = 0;
        this.score= 0;
        this.overtakes = 0;

        this.useBrain = type == "AI";

        this.baseFriction = type == "AI" ? 0.01: Math.random() % 0.024 + 0.01;;
        this.friction = 0;
        this.angle = 0;
        this.damaged = false;
        this.polygon = this.#createPolygon();
        this.passedCount = 0;

        if(type != "DUMMY"){
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, Math.floor(this.sensor.rayCount/2), 8, 4], batchNumber
            )
        }
        
        this.controls = new Controls(type);
    }


    update(road, trafficCars){
        if(!this.damaged){
            this.ticks++;
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(road.borders, trafficCars);
            if(this.damaged){
               this.deathTime = Date.now();
            }
            if(this.sensor){
                this.sensor.update(road.borders, trafficCars);
                const offsets = this.sensor.readings.map(s => s== null ? 0: 1-s.offset );
                const outputs = NeuralNetwork.feedForward(offsets, this.brain);
                if(this.useBrain){
                    [this.carsPassed, this.overtakes] = this.calcCarsPassed(trafficCars);
                    this.score = this.calcScore(road);
                    this.brain.highscore = this.brain.highscore < this.score ? this.score : this.brain.highscore;
                    
                    this.controls.forward = outputs[0];
                    this.controls.left = outputs[1];
                    this.controls.right = outputs[2];
                    this.controls.reverse = outputs[3];
                }
            }
        }
    }

    calcCarsPassed(trafficCars){
        let count = 0
        let overtakeCount = 0;
        for(let i = 0; i < trafficCars.length; i++){
            if(trafficCars[i].y > this.y){
                count++;
                if(trafficCars[i].x >= this.x){
                    overtakeCount++;
                }
            } 
        }
        return[ count, overtakeCount];
    }


    calcScore(road){
        let lifetimeFactor =  1.00001^(this.ticks/10);
        let score = 0;
        score += this.carsPassed * 100 + (this.carsPassed > 0 ? 500 : 0) + (this.carsPassed > 1 ? 500 : 0);
        score += this.overtakes * 100;
        score += Math.floor(this.calcAverageSpeed()* lifetimeFactor ); 
        
        score += Math.floor(this.calcAverageDistanceToLaneCenter(road) *(-25) *lifetimeFactor);
        score += this.y / 10 * (-1);
        return score;
    }

    calcAverageSpeed(){
        this.totalSpeed += this.speed;
       return this.totalSpeed / this.ticks;
    }

    calcAverageDistanceToLaneCenter(road){
        // get distance to closest lane center 
        
        let distances = [];
        for(let i = 0; i < road.laneCount; i++){
            distances.push(Math.abs(road.getLaneCenter(i)-this.x));
        }
        this.totalDistanceToLaneCenter = Math.min(...distances);
        return (this.totalDistanceToLaneCenter / this.ticks);
    }
    


    isMovingForward(){
        return !this.damaged ; 
    }

    #assessDamage(borders, traffic){
            for(let i = 0; i <borders.length; i++){
                if(polysIntersect(this.polygon, borders[i])){
                    return true;
                }
            }
            for(let i = 0; i < traffic.length; i++){
                if(traffic[i].y <= this.y + 500 && traffic[i].y >= this.y - 500){ // only check cars in range of the car 
                    if(polysIntersect(this.polygon, traffic[i].polygon)){
                        return true;
                    }
                }
            }
    }

    #createPolygon(){
        const points = [];
        const rad = Math.hypot(this.width, this.height)/2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y: this.y-Math.cos(this.angle-alpha)*rad
        })
        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y: this.y-Math.cos(this.angle+alpha)*rad
        })

        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y: this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        })

        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y: this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        })

        return points;
    }

    #move(){

        if(this.controls.forward){
            this.speed += this.acceleration;
            
        }
        if(this.controls.reverse){
            this.speed -= this.reverseAcceleration;
        }
        this.friction = Math.max(this.speed * this.speed * this.baseFriction, this.baseFriction);

        
        if(this.speed<0){
            this.speed += this.friction;
        }
        if(this.speed>0){
            this.speed -= this.friction;
        }

        if(this.speed < - this.maxReverseSpeed){
                this.speed = -this.maxReverseSpeed;
        }

        if(Math.abs(this.speed) < this.friction){
            this.speed = 0;
        }

        // left , right controls
        if(this.speed != 0){
            const flip = this.speed < 0 ? -1 : 1
            if(this.controls.left){
                this.angle += 0.03 * flip;
            }
            if(this.controls.right){
                this.angle -= 0.03 * flip;
            }
        }
        this.x -= Math.sin(this.angle)*this.speed;
        this.y -= Math.cos(this.angle)*this.speed;
       
    }

    draw(ctx, color, drawSensor=false){

        if(this.damaged){
            if(this.deathTime + 5000 < Date.now() ){
                return;
            }
            ctx.fillStyle = "gray";
        }else {
            ctx.fillStyle = color;
        }
        ctx.beginPath();
       
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y)
        for(let i = 1; i< this.polygon.length; i++){
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y)
        }
        ctx.fill();
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }
    }
}