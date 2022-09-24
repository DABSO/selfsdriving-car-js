class Traffic {

   constructor(count = 5, laneCount, spread = 1000){
    this.cars = [];

        for(let i = 0 ; i < count; i++){
            let car = new Car(road.getLaneCenter(Math.floor(Math.random() * 100) % laneCount), (-Math.random() * spread) , 30, 50, "DUMMY", i);
            if(i == 0){
                car = new Car(road.getLaneCenter(1), -Math.random() * 200 -200, 30, 50, "DUMMY", i);
            }
            this.cars.push(car);
        }
   }

   update(road){
        for(let i = 0; i < this.cars.length; i++){
            this.cars[i].update(road, []);
        }
   }


   draw(ctx){
    for(let i  = 0; i < this.cars.length; i++){
        this.cars[i].draw(ctx, "red");
    }
   }

}