class Traffic {

   constructor(count = 5, laneCount, spread = 1000){
    this.cars = [];
        for(let i = 0 ; i < count; i++){
            let car = new Car(road.getLaneCenter(Math.floor(Math.random() * 100) % laneCount), (-Math.random() * spread) , 30, 50, "DUMMY");
            this.cars.push(car);
        }
   }

   update(roadBorders){
        for(let i = 0; i < this.cars.length; i++){
            this.cars[i].update(roadBorders, []);
        }
   }


   draw(ctx){
    for(let i  = 0; i < this.cars.length; i++){
        this.cars[i].draw(ctx, "red");
    }
   }

}