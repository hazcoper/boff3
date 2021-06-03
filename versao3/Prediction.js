class Prediction{
    //size will be a vector containing the x and y sizes of the box
    //xpos and ypos are the inital coordinates of the box
    constructor(xposInit, yposInit, xposFinal, yposFinal , index){
        this.posInit = createVector(xposInit, yposInit);
        this.posFinal = createVector(xposFinal, yposFinal);
        this.index = index;
    }

    getText(predictions){
        return predictions[this.index];
    }
}