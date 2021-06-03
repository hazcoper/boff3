    class Clickable{
    //size will be a vector containing the x and y sizes of the box
    //xpos and ypos are the inital coordinates of the box
    constructor(xposInit, yposInit, xposFinal, yposFinal , letterList){
        this.posInit = createVector(xposInit, yposInit);
        this.posFinal = createVector(xposFinal, yposFinal);
        this.letterList = letterList;
        this.index = 0;
        this.size = createVector(xposFinal - xposInit, yposFinal - yposInit);
        this.touch = 0;
        
        this.color = 0; //flag to see if I draw the color or not
    }  

    //isto vai dar return da letra correta para meter
    //da return de um array em que o segundo valor e ua flag que indica se o resultado e uma nova letra ou entao mudar existente
    // 0 --> troqeui (de A para B)
    // 1 --> quer dizer que voltei a carregar na mesma tecla, mas o tempo expirou
    // 2 --> not sure (quando carrego a primeira vez) nao sei o que o user vai querer
    hasBeenPressed(time, isFirst){
        if (isFirst){
            return [this.getFirst(), 2];
        }
        if (time > 0){
            return [this.getNext(), 0];
        }
        return [this.getFirst(), 1];
    }

    addTouch(){
        this.touch++;
    }
    resetTouch(){
        this.touch = 0;
    }
    getTouch(){
        return this.touch;
    }

    getFirst(){
        this.index = 0;
        return this.letterList[0];
    }   

    getNext(){
        this.index = (this.index + 1) % this.letterList.length;
        return this.letterList[this.index];
    }

    checkHit(){
        if (mouseX > this.posInit.x && mouseX < this.posFinal.x && mouseY < this.posInit.y && mouseY < this.posFinal.y){
            console.log("hey");
        }  
    }

    getText(){
        let string = "";
        for(var i= 0; i < this.letterList.length; i++){
            
            string += this.letterList[i] + " ";
        }
        return string.toUpperCase();
    }
}