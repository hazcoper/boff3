// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

/*
  ADICIONAR O CPS NO SAVE PERFORMANCE
  AUMENTAR O TAMANHO DE LETRA NAS PALAVRAS A COLOCAR E ALTERAR AS CORES PARA "DARK MODE"
  ESCOLHER UM BOM TEMA DE CORES 
  IMPLEMENTAR UM ESQUEMA SEMELHANTE AOS TELEMOVEIS ANTIGOS
  ADICIONAR CARACTER RECOGNISION, A DESENHAR
*/

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 15;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = true;  // set to 'true' before sharing during the simulation and bake-off days
const TEMPO_INTERVALO = 0.5;     // tempo entre clique da mesma tecla em segundos

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0;       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let ignoreLetter = 0;

let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
let leftArrow, rightArrow;     // holds the left and right UI images for our basic 2D keyboard   
let ARROW_SIZE;                // UI button size
let current_letter = '';      // current char being displayed on our basic 2D keyboard (starts with 'a')
let limit = 60*TEMPO_INTERVALO;
let time = limit;

let timeColor = 255;

let prevPressed = -1;
let touch = 0;

//this will be a list containing objects of the class Clickable
let cList;

//this will store the amount of the the mouse was pressed for 
let timepressed = 0;
let limPressed = 65; 
let typeOffset = 0;

//mouse variables to drag
let mouseXInitial = null;
let mouseYInitial, mouseXFinal, mouseYFinal;

// Runs once before the setup() and loads our data (images, phrases)
function preload()
{    
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");
    
  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");
  
  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)
  
  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];
  
  drawUserIDScreen();       // draws the user input screen (student number and display size)


}

// conflito com 2 interrupts distintos, um baseado em tempo e outro baseado em acao(draw e mousePressed)
// tentar encontrar uma solu
// flag representa para que lado e que eu tenho que mexer o cursor
function moveCursor(flag)
{
    ignoreLetter = 1;
    if(flag){
        typeOffset--;
        if (typeOffset < 0){
            typeOffset = 0;
        }
        console.log("mexer para o lado esquerdo");
    }else{
        console.log("mexer para o lado direito");
        typeOffset++;
    }
    currently_typed = listString(currently_typed, "", typeOffset);
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(0);           // clear background
    //noCursor();                // hides the cursor to simulate the 'fat finger'
    
    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    push();

    //draw no touch area
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    
    //draw the current letter
    textAlign(CENTER); 
    textFont("Arial", PPCM/2);
    fill(0);
    text("" + current_letter, width/2, height/2 - 1.3 * PPCM); 
    

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 255, 0);
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);

    translate(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM);

    if(timepressed < limPressed){
      for(var i = 0; i < cList.length; i++){
      
        if(cList[i].color && time > 0){
          fill(30, 10, 10, time*2);
        }else{
  
            fill(125);
          }
        
        
        rect(cList[i].posInit.x, cList[i].posInit.y, cList[i].size.x, cList[i].size.y);
        push();
        textAlign(CENTER, CENTER);
        textFont("Arial", PPCM/3.2);
        stroke(255);
        fill(255, 255, 255, 255);
        text(cList[i].getText(), cList[i].posInit.x + cList[i].size.x/2, cList[i].posInit.y + cList[i].size.y/2);
        pop();
      }
    }else{
      //quer dizer que quero desenhar a cena dos gestos
      pop();
      push();
      fill(0);
      stroke(255);
      rect(mouseXInitial-20, height/2 - 1.0*PPCM, 40, 3.0*PPCM);
      
      
    }

    if(mouseIsPressed){
      timepressed ++;
      if(mouseXInitial === null){
        mouseXInitial = mouseX;
        mouseYInitial = mouseY;
        console.log("beggined press: ", mouseXInitial);
      }
    }
    if(timepressed > limPressed){
      ignoreLetter = 1;

      if(abs(mouseXInitial-mouseX) > 20){
        //this means that the press qualifies as a long press
        mouseXFinal = mouseX;
        console.log("I have moved enough", mouseXInitial, mouseXFinal);        
        if (timepressed % 10 == 5){
          if((mouseXFinal - mouseXInitial) < 20){
            moveCursor(1);
          }else if((mouseXFinal - mouseXInitial) > 20){
            moveCursor(0);
          }  
        }
        
        
      }
    } 

    pop();

    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
    decrementTime();
  }
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard()
{
  // Writes the current letter
  push();
  textFont("Arial", 18);
  fill(0);
  translate(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM);
  textAlign(CENTER, CENTER);
  noFill();
  imageMode(CORNER);
  pop();
}


function decrementTime(){
  time --;
  if(time <= 0 && !ignoreLetter){
    if (current_letter == "␣"){
      //space
      current_letter = " ";
      
    }
    if (current_letter == "⌫"){
      //erase
      currently_typed = listString(currently_typed, "delete", typeOffset);

      //currently_typed = currently_typed.slice(0, -1);
      typeOffset--;
      if(typeOffset < 0){
          typeOffset =  0;
      }
      time = 0;
      current_letter = "";
      return;
    }

    if (time == 0){
      if(current_letter != ""){
        currently_typed = listString(currently_typed, current_letter, typeOffset);
        typeOffset ++;      
        current_letter = "";
      } 

    }
    
    time = 0;
  }
  if(ignoreLetter){
      ignoreLetter = 0;
  }
}

// receives a coordinate pair and returns the index of the box the coordinate is in
function checkIndex(posX, posY){
  var factorX = width/2 - 2.0*PPCM;
  var factorY = height/2 - 1.0*PPCM;
  var x, y;

  if(posX > 0 + factorX && posX < (4/3)*PPCM + factorX){
    x = 0;
  }
  if(posX >(4/3)*PPCM + factorX  && posX < (8/3)*PPCM + factorX){
    x = 1;
  }
  if(posX > (8/3)*PPCM+factorX && posX < 4*PPCM + factorX){
    x = 2;
  }
  
  
  if(posY > factorY && posY < PPCM + factorY){
    y = 0;
  }
  if(posY > factorY+PPCM && posY < 2*PPCM + factorY){
    y = 1;
  }
  if(posY > factorY+2*PPCM && posY < 3*PPCM + factorY){
    y = 2;
  }

  var index = x + y*3;

  
  // console.log("this is my x: " + x + "this is my y: " + y + "this is my index: " + index);
  return index;
}

function listString(myString, add, index){
    var myArray = Array.from(myString);

    //vamos apagar a barra onde quer que ele esteja
    var leftOver =  myArray.slice(myArray.indexOf("|")+1);
    // console.log("this is left over: ", leftOver);
    myArray.splice(myArray.indexOf("|"));
    myArray = myArray.concat(leftOver);

    // console.log("before: ", myArray);
    //ver se e para apagar
    if(add == "delete"){
        //this means that I want to erase
        if(typeOffset == myString.length-1){
            //quer dizer que eu estou na ultima posicao
            myArray.splice(index-1);
            myArray.splice(index, 0,"|");
            // console.log("here: ", myArray);
        }
        else{
            //quer dizer que eu ja nao estou na ultima posicao
            leftOver = myArray.slice(index);
            leftOver.unshift("|");
            myArray.splice(index-1);
            // console.log("left: ", leftOver);
            // console.log("cut: ", myArray);
            myArray = myArray.concat(leftOver);
        }
    }else if(add == ""){
        //aqui quer dizer que eu quero so meter a | no lugar certo
        myArray.splice(index, 0, "|");
    }
    else{
        //quer dizer que eu quer so adicionar qualquer coisa
        myArray.splice(index, 0, "|");
        myArray.splice(index, 0, add);
    }
    
    return myArray.join("");

}

// function listString(myString, add, index){
//   // vai receber uma string, e devolver outra com o que esta no add adicionado ao index da string
//   //0 == cena 0; -1 == ultima (mesma coisa que apppend)
//   //string.slice(0, cursor) + new input + string.slice(cursor+1, end) 
//   console.log("this should be true: ", typeOffset == myString.length);
//   var myArray;

//   if (add == ""){

//     if(typeOffset == myString.length-1){
//       myArray = myString.split("|");
//       myString = "";
//       for(var counter = 0; counter < myArray.length; counter++){
//         myString += myArray[counter];
//       }
//       return myString.slice(0, index-1) + "|";
//     }

//     myArray = myString.split("|");
//     myString = "";
//     for(var counter = 0; counter < myArray.length; counter++){
//       myString += myArray[counter];
//     }
//     return myString.slice(0, index-1) + add + "|" + myString.slice(index);  
//   }

//   myArray = myString.split("|");
//   myString = "";
//   for(var counter = 0; counter < myArray.length; counter++){
//     myString += myArray[counter];
//   }
//   return myString.slice(0, index) + add + "|" + myString.slice(index);
// }


// Evoked when the mouse button was pressed

// window.oncontextmenu = function ()
// {
//     typeOffset--;
//     currently_typed = listString(currently_typed, "", typeOffset);
//     console.log("Typeoffset decremented"); 
//     return false;     // cancel default menu
// }

function mousePressed(event)
{
  console.log("This is the typeoffset: " + typeOffset);
  // if(mouseXInitial === null){
  mouseXInitial = mouseX;
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  { 
    if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      var myArray = Array.from(currently_typed);
      var leftOver =  myArray.slice(myArray.indexOf("|")+1);
      // console.log("this is left over: ", leftOver);
      myArray.splice(myArray.indexOf("|"));
      myArray = myArray.concat(leftOver);
      currently_typed = myArray.join("");

      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)                                           
      {
        // Prepares for new trial
        currently_typed = "";
        typeOffset = 0;
        target_phrase = phrases[current_trial];  
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();
        
        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 250);
        }
      }
    }           
  }
    
}

function mouseReleased(){
  var index = checkIndex(mouseX, mouseY);
  var output;

  if(timepressed > limPressed){
    console.log("devia de ignorar este click");
    mouseXInitial = null;
    timepressed = 0;
    return; 
  }
  timepressed = 0;
  
  if(index || index == 0){
    //only gets in if its defined 
    if(index == prevPressed){
      //buttons has been pressed for the second or > time
      output = cList[index].hasBeenPressed(time, 0);
      time = limit;
    }else if(index >= 0){
      //button has been pressed for the first time
      
      //remove the color from before
      if(prevPressed != -1){
        cList[prevPressed].color = 0;
      }
      cList[index].color = 1;
      if(prevPressed != index){
        if (current_letter == "␣"){
          //space
          current_letter = " ";
        }
        if (current_letter == "⌫"){
          //entao eu vou querer apagar uma coisa e nao adicionar
          currently_typed = listString(currently_typed, "delete", typeOffset);
          typeOffset--;
          if(typeOffset < 0){
              typeOffset =  0;
          }
        }
        if(current_letter != "" && current_letter != "⌫"){
          currently_typed = listString(currently_typed, current_letter, typeOffset);
          typeOffset ++;      

        }
        current_letter = "";
      }
      prevPressed = index;
      time = limit;
      output = cList[index].hasBeenPressed(time, 1);
    }

    // 0 --> troqeui (de A para B)
    // 1 --> quer dizer que voltei a carregar na mesma tecla, mas o tempo expirou
    // 2 --> not sure (quando carrego a primeira vez) nao sei o que o user vai querer
    
    if(output[1] == 0){
      //quer dizer que tinha o A e carreguei outra vez para mudar para um B
      current_letter = output[0];
    }
    if(output[1] == 1){
      //quer dizer que e a primeira vez que eu estou a carregar
      current_letter = output[0];

    }
    if(output[1] == 2){
      
      current_letter = output[0];

    }
  }
  
}


// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];
  
  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  currently_typed      = "";
  CPS                  = 0;
  
  current_letter       = '';
  
  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();  
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration); 
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  CPS = letters_entered / (attempt_duration * 60);

  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again
  
  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 
  
  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2); 
  
  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 ) 
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }
  
  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);
  text("CPS: " + CPS, width / 2, height / 2 + h+100);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,      
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
  }
   
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  var flag = 0;
  if(PPCM == undefined){
    flag = 1; 
  }

  resizeCanvas(windowWidth, windowHeight);
  let display    = new Display({ diagonal: display_size }, window.screen);
  
  // DO NO CHANGE THESE!
  PPI           = display.ppi;                        // calculates pixels per inch
  PPCM          = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE   = (int)(11   * PPCM);
  FINGER_OFFSET = (int)(0.8  * PPCM)
  ARM_LENGTH    = (int)(19   * PPCM);
  ARM_HEIGHT    = (int)(11.2 * PPCM);
  
  ARROW_SIZE    = (int)(2.2 * PPCM);
  
  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();

  if(flag == 1){
    //define the list
    cList = [new Clickable(0,0,(4/3)*PPCM,PPCM, ["␣", "⌫", ""])];
    let index = 1;
    let posx = 0, posy = 0;
    let sizex = (4/3)*PPCM, sizey = PPCM;
    letterCounter = 97;
    //create all the letters
    
    for(var counter = 0; counter < 8; counter++){
      //create each individual button, loop three of four times
      var letterList = [];

      if(index == 6 || index == 8){
        for(var letter = 0; letter < 4; letter++){
          letterList.push(String.fromCharCode(letterCounter));
          letterCounter ++; 
        }
      } else{  
        for(var letter = 0; letter < 3; letter++){
          letterList.push(String.fromCharCode(letterCounter));
          letterCounter ++; 
        }  
      }
      letterList.push("");
      var x = index % 3;    // % is the "modulo operator", the remainder of i / width;
      var y = ~~(index / 3);    // where "/" is an integer division

      posx = x * (4/3)*PPCM;
      posy = y * PPCM;
      

      cList.push(new Clickable(posx, posy,posx + sizex, posy + sizey,letterList));
      index++;  
    }
  }
}
