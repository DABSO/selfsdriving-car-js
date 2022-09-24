class Sensor{

    constructor(car){
        this.car = car;
        this.forwardRayCount = 20;
        this.rightRayCount = 3;
        this.leftRayCount = 3 ;
        this.backwardRayCount = 3;

        this.rayCount = this.forwardRayCount+ this.leftRayCount +this.rightRayCount + this.backwardRayCount;
        this.rayLength = 250;
        this.raySpread = 0.5 * Math.PI; 
        this.rays=[];
        this.readings = [];
    }
    
    update(roadBorders, traffic){
          this.#castRays();
          this.readings = [];
          for(let i = 0; i < this.rayCount; i++){
            this.readings.push(
                this.#getReading(this.rays[i], roadBorders, traffic)
            )
          }
    }
    
    #castRays(){
        this.rays = [];
        for(let i = 0; i < this.forwardRayCount; i++){
            const rayAngle = lerp(
                this.raySpread/2,
                -this.raySpread/2,
                this.forwardRayCount== 1 ? 0.5 : (i)/((this.forwardRayCount-1))
            )+ this.car.angle;
            
        const start = {x: this.car.x, y: this.car.y};
        const end = {
            x: this.car.x -
            Math.sin(rayAngle)*this.rayLength,
            y: this.car.y-
            Math.cos(rayAngle)*this.rayLength
        };

        this.rays.push([start, end]);
        }  

        for(let i = 0; i < this.backwardRayCount; i++){
            const rayAngle = lerp(
                this.raySpread/2,
                -this.raySpread/2,
                this.backwardRayCount== 1 ? 0.5 : (i)/((this.backwardRayCount-1))
            )+Math.PI+ this.car.angle;
            
        const start = {x: this.car.x, y: this.car.y};
        const end = {
            x: this.car.x -
            Math.sin(rayAngle)*this.rayLength,
            y: this.car.y-
            Math.cos(rayAngle)*this.rayLength
        };

        this.rays.push([start, end]);
        }

        for(let i = 0; i < this.leftRayCount; i++){
            const rayAngle = lerp(
                this.raySpread/2,
                -this.raySpread/2,
                this.leftRayCount== 1 ? 0.5 : (i)/((this.leftRayCount-1))
            )+ (Math.PI * 0.5)+ this.car.angle;
            
        const start = {x: this.car.x, y: this.car.y};
        const end = {
            x: this.car.x - Math.sin(rayAngle)*this.rayLength,
            y: this.car.y-Math.cos(rayAngle)*this.rayLength
        };
        
        this.rays.push([start, end]);
        }

        for(let i = 0; i < this.rightRayCount; i++){
            const rayAngle = lerp(
                this.raySpread/2,
                -this.raySpread/2,
                this.rightRayCount== 1 ? 0.5 : (i)/((this.rightRayCount-1))
            )+Math.PI * 1.5+ this.car.angle;
            
        const start = {x: this.car.x, y: this.car.y};
        const end = {
            x: this.car.x -
            Math.sin(rayAngle)*this.rayLength,
            y: this.car.y-
            Math.cos(rayAngle)*this.rayLength
        };

        this.rays.push([start, end]);
        }
    }

    #getReading(ray, borders, traffic){
        let touches = [];

        for(let i = 0; i < borders.length; i++){
            const touch =  getIntersection(
                ray[0],
                ray[1],
                borders[i][0],
                borders[i][1]
            )
            if(touch){
            
                touches.push(touch)
            }
        }

        for(let i = 0; i < traffic.length; i ++){
            const poly  = traffic[i].polygon; 
            for(let j = 0; j < poly.length; j++){
                const value = getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j+1)%poly.length]
                );
                if(value){
                    touches.push(value);
                }
            }
        }

        if(touches.length== 0){
            return null;
        }else {
            const offsets = touches.map(e => e.offset);
            const minOffset= Math.min(...offsets);
            return touches.find(e=> e.offset== minOffset)
        }
    }



    draw(ctx){
        
        for(let i = 0; i < this.rayCount ; i++ ){
            let end = this.rays[i][1];

            if(this.readings[i]){
                end = this.readings[i];
            }
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";

            ctx.moveTo(
                this.rays[i][0].x,
                this.rays[i][0].y
            );

            ctx.lineTo(
                end.x,
                end.y
            )
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";

            ctx.moveTo(
                end.x,
                end.y
            );

            ctx.lineTo(
                this.rays[i][1].x,
                this.rays[i][1].y
                
            )
            ctx.stroke();
        }
    }
}