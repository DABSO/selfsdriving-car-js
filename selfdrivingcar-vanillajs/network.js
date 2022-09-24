

class NeuralNetwork{

    constructor(neuronCounts, batchNumber){
        this.highscore = 0;
        this.batchNumber = batchNumber;
        this.id = Date.now().toString(16) + "-"+batchNumber
        this.levels= [];
        for(let i = 0; i < neuronCounts.length-1; i++){
            this.levels.push(new Level(
                neuronCounts[i], neuronCounts[i+1], (i == neuronCounts.length-2 ? "binaryStep" : (Math.random() > 0.5 ? "reLU" : "tanh"))
            ));
        }
    }
  

    static feedForward(givenInputs, network){
        let outputs = Level.feedForward(
            givenInputs, network.levels[0]);
        for(let i = 1; i < network.levels.length; i++){
            outputs = Level.feedForward(outputs, network.levels[i]);
        }
        return outputs;
    }



    static mutate(network, amount=1, batchNumber){
        network.id = Date.now().toString(16) + "-"+batchNumber
        network.highscore = 0;
        network.levels.forEach(level => {
            for(let i = 0; i < level.biases.length; i++){
                level.biases[i] = lerp(
                    level.biases[i],
                    Math.random()*2-1,
                    amount
                );
            }
            for(let i = 0; i < level.weights.length; i++){
                for(let j = 0; j < level.weights[i].length; j++ ){
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random()*2-1,
                        amount
                    );
                }
            }
        })
    }
}


class Level {
    static reLU  (x) {
        return Math.max(0, x);
    }
    static tanh (x) {
        return Math.tanh(x);
    }
    
    static binaryStep(x){
        return x > 0 ? 1 : 0;
    }


    constructor (inputCount, outputCount, activation){
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);
        
        this.activation = activation;
    
        this.weights = [];
        for(let i = 0; i < inputCount; i++){
            this.weights[i] = new Array(outputCount);
        }

        Level.#randomize(this);
    }

    static #randomize(level){
        for(let i = 0; i < level.inputs.length; i++){
            for(let j = 0; j < level.outputs.length; j++){
               level.weights[i][j]= Math.random()*2 - 1; 
            }
        }

        for(let i = 0; i< level.biases.length; i++){
            level.biases[i] = Math.random()*2-1;
        }

    }

    static feedForward(givenInputs, level){
        for(let i = 0; i < level.inputs.length; i++){
            level.inputs[i] = givenInputs[i];
        }

        for(let i = 0; i < level.outputs.length; i++){
            let sum = 0;
            for(let j = 0; j<level.inputs.length; j++){
                sum+=level.inputs[j]*level.weights[j][i];
            }
            switch (level.activation ){
                case "reLu":
                    level.outputs[i] = Level.reLU(sum + level.biases[i]);
                    break;
                case "tanh": 
                    level.outputs[i] = Level.tanh(sum + level.biases[i]);
                    break;
                case "binaryStep":
                    level.outputs[i] = Level.binaryStep(sum + level.biases[i]);
                    break;
            }
        }

        return level.outputs;
    }
}




