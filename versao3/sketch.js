// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER = 15;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY = true;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm = false;  // used to control what to show in draw()
let phrases = [];     // contains all 501 phrases that can be asked of the user
let current_trial = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt = 0       // the current attempt out of 2 (to account for practice)
let target_phrase = "";     // the current target phrase
let currently_typed = "";     // what the user has typed so far
let lastSeen = ""; // contains the last seen currently typed, in order to just look for predictions once the text has changed
let entered = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS = 0;      // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
var letters = ["qwertyuiop", "asdfghjkl", "zxcvbnm⌫"]
let keyboard;     // holds the left and right UI images for our keyboard
let KEYBOARD_WIDTH;            // UI button size
let KEYBOARD_HEIGHT;

// translate clickable zone
let SETUP_X;
let SETUP_Y;
let LETTER_X;
let LETTER_Y;

// coordenadas do ponteiro e distancia ao cursor real
let pointerX;
let pointerY;
let POINTER_DIST;

let current_letter = "";      // current char being displayed on our basic 2D keyboard (starts with 'a')

let LETTER_SIZE_X;
let OFFSET_LETTER_X;
let LETTER_SIZE_Y;
let OFFSET_LETTER_Y;

let typeOffset = 0;

let predictions = ["the", "be", "to"];
let auxnum, predNum = "predict";

let predictionary = Predictionary.instance();

// Runs once before the setup() and loads our data (images, phrases)
function preload() {
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");

  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");

  // loads keyboard image
  keyboard = loadImage("data/newkeyboard.jpg");
  loadStrings('./text/dict.txt', setWords);

  //load info image
  infoImage = loadImage("data/legenda.png");
}

function setWords(words)
{
  var auxcounter = 0;
  for(var counter = 0; counter < words.length; counter+=111111){
    predictionary.addWords(words.slice(auxcounter, counter));
    auxcounter = counter;
  }
  if(counter != words.length){
    predictionary.addWords(words.slice(auxcounter, words.length-1));
  }
}

// Runs once at the start
function setup() {
  createCanvas(2000, 1000);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)

  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];

  drawUserIDScreen();       // draws the user input screen (student number and display size)
}

function draw() {
	
  if (draw_finger_arm) {
    background(0);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'

    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial

      
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(224,228,9);
    rect(width / 2 - 2.0 * PPCM, height / 2 - 2 * PPCM, 4.0 * PPCM, 1.0 * PPCM);
    textAlign(CENTER);
    textFont("Arial", 0.3 * PPCM);
    
    push();
    strokeWeight(1);
    stroke(color(0));
    fill(color(58,110,165));
    rect(width/2 - 1.96*PPCM, height/2 - 1.5*PPCM, 2*PPCM, 0.5*PPCM );

    fill(color(49,13,63));
    rect(width/2, height/2 - 1.5*PPCM, 2*PPCM, 0.5*PPCM );
    pop();

    //fill(255);
    //noStroke();
    //text(current_letter, width / 2, height / 2 - 1.6 * PPCM);
    
    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    push();
    fill(206,210,219);
    rect(width / 2 - 2.0 * PPCM, height / 2 - 1.0 * PPCM, 4.0 * PPCM, 3.0 * PPCM);
    pop();

    draw2Dkeyboard();       // draws our basic 2D keyboard UI

    for(var i = 1; i < 4; i++){
      auxnum = predNum + i; 
      sendPrediction(auxnum);
    }

    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

function drawPrediction(typed){
  var aux = typed.split("|");
  
  var word = aux[0].split(' ');
  if (typeof word != 'undefined' && word != ""){
    if(currently_typed != lastSeen){   //basicamente vou ver se o currently typed e diferente para nao estar sempre a fazer predict, e verifica tambem se eu estou a fazer scroll ou nao
      lastSeen = currently_typed;
      predictions = predictionary.predict(word[word.length-1]);
    }
  }  
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard() {
  // Writes the current letter
  textFont("Arial", 24);
  fill(0);
  //text("" + current_letter, width/2, height/2); 

  // Draws keyboard
  noFill();
  imageMode(CENTER);
  image(keyboard, width / 2, height / 2, KEYBOARD_WIDTH, KEYBOARD_HEIGHT);


  push()
  fill(color(255, 127, 80, 80));
  stroke(color(255, 255, 0));
  strokeWeight(1); // muda a cor da letra selecionada

  if (current_letter == "_") {
    rectMode(CORNER)
    rect((SETUP_X + 2.5 * LETTER_SIZE_X), (SETUP_Y + OFFSET_LETTER_Y + 2.5 * LETTER_SIZE_Y), (4.0 * PPCM - 6 * LETTER_SIZE_X), LETTER_SIZE_Y, LETTER_SIZE_X / 5)

  }

  else if (current_letter == "⌫") {
    rectMode(CORNER)
    rect((SETUP_X + 8.5 * LETTER_SIZE_X), (SETUP_Y + 2 * LETTER_SIZE_Y), (4.0 * PPCM - 8.5 * LETTER_SIZE_X), (2 * LETTER_SIZE_Y), LETTER_SIZE_X / 5)

  }

  else if (current_letter == "predict2") {
    rectMode(CORNER)
    rect((SETUP_X + OFFSET_LETTER_X/2), (SETUP_Y + OFFSET_LETTER_Y + 2.5 * LETTER_SIZE_Y), (1.1 * LETTER_SIZE_X), LETTER_SIZE_Y, LETTER_SIZE_X / 5)
  }

  else if (current_letter == "predict1") {
    rectMode(CORNER)
    rect((SETUP_X + OFFSET_LETTER_X/2), (SETUP_Y + 2 * LETTER_SIZE_Y), (1.3 * LETTER_SIZE_X), LETTER_SIZE_Y, LETTER_SIZE_X / 5)
  }

  else if (current_letter == "predict3") {
    rectMode(CORNER)
    rect((SETUP_X + OFFSET_LETTER_X/2 + 1.1 * LETTER_SIZE_X), (SETUP_Y + OFFSET_LETTER_Y + 2.5 * LETTER_SIZE_Y), (1.1 * LETTER_SIZE_X), LETTER_SIZE_Y, LETTER_SIZE_X / 5)
  }

  else if (current_letter == "cursorBack") {
    rectMode(CORNER)
    rect((SETUP_X + 6.5 * LETTER_SIZE_X), (SETUP_Y + OFFSET_LETTER_Y + 2.5 * LETTER_SIZE_Y), (LETTER_SIZE_X), LETTER_SIZE_Y, LETTER_SIZE_X / 5)
  }

  else if (current_letter == "cursorFront") {
    rectMode(CORNER)
    rect((SETUP_X + 7.5 * LETTER_SIZE_X), (SETUP_Y + OFFSET_LETTER_Y + 2.5 * LETTER_SIZE_Y), (LETTER_SIZE_X), LETTER_SIZE_Y, LETTER_SIZE_X / 5)
  }

  else if (current_letter != "") {
    rectMode(CENTER)
    rect(LETTER_X, LETTER_Y, LETTER_SIZE_X, LETTER_SIZE_Y, LETTER_SIZE_X / 5)
  }
  pop()

  if (mouseIsPressed == true) {
    if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 1.0 * PPCM, 4.0 * PPCM, 3.0 * PPCM))
      drawPointer();
  }
}

function drawPointer() {
  push();
  pointerX = mouseX;
  pointerY = mouseY - POINTER_DIST;
  // desenha o cursor
  fill(color(255,69,0));
  noStroke();
  
  var x = pointerX;
  if (pointerX < width/2 - 1.75*PPCM)
      x = width/2-1.9*PPCM;
  else if(pointerX > width/2 + 1.75*PPCM)
      x = width/2+1.9*PPCM;

  ellipse(pointerX, pointerY, 0.2 * PPCM);
  pop();
}

// devolve a tecla sobre a qual o pointer esta
function letter() {
  // se o pointer estiver no espaco
  if (pointerX > (SETUP_X + 2.5 * LETTER_SIZE_X) && pointerX < (SETUP_X + 4.0 * PPCM - 3.5 * LETTER_SIZE_X) && abs(pointerY - (SETUP_Y + OFFSET_LETTER_Y + 3 * LETTER_SIZE_Y)) < LETTER_SIZE_Y / 2)
    return "_"

  // se o pointer estiver no backspace
  if (pointerX > (SETUP_X + 8.5 * LETTER_SIZE_X) && pointerX < (SETUP_X + 4.0 * PPCM) && abs(pointerY - (SETUP_Y + 3 * LETTER_SIZE_Y)) < LETTER_SIZE_Y)
    return "⌫"

  if (pointerX > (SETUP_X) && pointerX < (SETUP_X + 1.5 * LETTER_SIZE_X) && abs(pointerY - (SETUP_Y + OFFSET_LETTER_Y + 3 * LETTER_SIZE_Y)) < LETTER_SIZE_Y / 2){
    return "predict2"
  }
  
  if (pointerX > (SETUP_X) && pointerX < (SETUP_X + 1.5 * LETTER_SIZE_X) && abs(pointerY - (SETUP_Y + OFFSET_LETTER_Y + 2 * LETTER_SIZE_Y)) < LETTER_SIZE_Y / 2){
    return "predict1"
  }
  
  if (pointerX > (SETUP_X + 1.5 * LETTER_SIZE_X) && pointerX < (SETUP_X + 2.5 * LETTER_SIZE_X) && abs(pointerY - (SETUP_Y + OFFSET_LETTER_Y + 3 * LETTER_SIZE_Y)) < LETTER_SIZE_Y / 2){
    return "predict3"
  }

  if (pointerX > (SETUP_X + 6.5 * LETTER_SIZE_X) && pointerX < (SETUP_X + 7.5 * LETTER_SIZE_X) && abs(pointerY - (SETUP_Y + OFFSET_LETTER_Y + 3 * LETTER_SIZE_Y)) < LETTER_SIZE_Y / 2){
    return "cursorBack"
  }

  if (pointerX > (SETUP_X + 7.5 * LETTER_SIZE_X) && pointerX < (SETUP_X + 8.5 * LETTER_SIZE_X) && abs(pointerY - (SETUP_Y + OFFSET_LETTER_Y + 3 * LETTER_SIZE_Y)) < LETTER_SIZE_Y / 2){
    return "cursorFront"
  }

  // calcula qual letra esta selecionadas
  for (j = 0; j <= 2; j++) {
    for (i = 0; i <= 9 - j; i++) {

      LETTER_X = SETUP_X + OFFSET_LETTER_X + i * LETTER_SIZE_X
      LETTER_Y = SETUP_Y + OFFSET_LETTER_Y + j * LETTER_SIZE_Y

      if (j == 1)
        LETTER_X += (LETTER_SIZE_X - OFFSET_LETTER_X)
      else if (j == 2)
        LETTER_X += (2 * LETTER_SIZE_X - OFFSET_LETTER_X)


      if (abs(pointerX - LETTER_X) < LETTER_SIZE_X / 2 && abs(pointerY - LETTER_Y) < LETTER_SIZE_Y / 2) {
        fill(color(255))
        rect(SETUP_X, SETUP_Y, LETTER_SIZE_X, LETTER_SIZE_Y);
        return letters[j][i]
      }
    }

  }
  return "";
}

// Evoked when the mouse button was pressed
function mousePressed() {
  // Only look for mouse presses during the actual test
  if (draw_finger_arm) {
    // Check if mouse click happened within the touch input area
    if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 1.0 * PPCM, 4.0 * PPCM, 3.0 * PPCM)) {
      pointerX = mouseX;
      pointerY = mouseY - POINTER_DIST;
      current_letter = letter()
    }


    // Check if mouse click happened within 'ACCEPT' 
    // (i.e., submits a phrase and completes a trial)
    else if (mouseClickWithin(width / 2 - 2 * PPCM, height / 2 - 5.1 * PPCM, 4.0 * PPCM, 2.0 * PPCM)) {
      // Saves metrics for the current trial
      typeOffset = 0;
      var myArray = Array.from(currently_typed);
      var leftOver =  myArray.slice(myArray.indexOf("|")+1);
      myArray.splice(myArray.indexOf("|"));
      myArray = myArray.concat(leftOver);
      currently_typed = myArray.join("");
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;
		
      // Check if the user has one more trial/phrase to go
      if (current_trial < 2) {
        // Prepares for new trial
        currently_typed = "";
        target_phrase = phrases[current_trial];
      }
      else {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();

        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2) {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width / 2 - second_attempt_button.size().width / 2, height / 2 + 200);
        }
      }
    }
  }
}

function mouseDragged() {
  push();
  if (mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 1.0 * PPCM, 4.0 * PPCM, 3.0 * PPCM)) {
    current_letter = letter()
  }
  else {
    current_letter = ""
  }
  pop();
}

function sendPrediction(prediction){
  switch(prediction){
    case "predict1":
      if(!(typeof predictions[0] === 'undefined')){
        push();
        textAlign(CENTER, CENTER);
        fill(color(0, 0, 0));
        textFont("Arial", Math.min(PPCM*2.5/(predictions[0].length+1), PPCM/3.2));
        text(predictions[0], SETUP_X + 4 * PPCM/2, SETUP_Y - 1.4 * LETTER_SIZE_Y);
        pop();
        return true;
      }
    case "predict2":
      if(!(typeof predictions[1] === 'undefined')){
        push();
        textAlign(CENTER, CENTER);
        fill(color(255, 255, 255));
        textFont("Arial", Math.min(PPCM*2.5/(predictions[1].length+1), PPCM/3.2));
        text(predictions[1], SETUP_X + PPCM, SETUP_Y - 0.45 * LETTER_SIZE_Y);
        pop();
      }
      return true;
    case "predict3":
      if(!(typeof predictions[2] === 'undefined')){  
        push();
        textAlign(CENTER, CENTER);
        fill(color(255, 255, 255));
        textFont("Arial", Math.min(PPCM*2.5/(predictions[2].length+1), PPCM/3.2));
        text(predictions[2], SETUP_X + 3 * PPCM, SETUP_Y - 0.45 * LETTER_SIZE_Y);
        pop();
      }
      return true;
    default:
      return false;    
  }  
}

function cutCurrentWord(){
  if(currently_typed != ""){  
    var leftOver =  currently_typed.split("|");
    var myArray = leftOver[0].split(" ");
    var my2Array = leftOver[1].split(" ");
    myArray = myArray.slice(0, myArray.length-1).concat("|", my2Array.slice(1));
    currently_typed = myArray.join(" ");
  }
}

function writePrediction(prediction){
  switch(prediction){
    case "predict1":
      if(!(typeof predictions[0] === 'undefined')){ 
      cutCurrentWord();
      typeOffset = currently_typed.length-1;
      currently_typed = listString(currently_typed, predictions[0] + " ", typeOffset);
      typeOffset += predictions[0].length + 1;
      }
      return true;
    case "predict2":
      if(!(typeof predictions[1] === 'undefined')){   
        cutCurrentWord();
        typeOffset = currently_typed.length-1;
        currently_typed = listString(currently_typed, predictions[1] + " ", typeOffset);
        typeOffset += predictions[1].length + 1;
      }
      return true;
    case "predict3":
      if(!(typeof predictions[2] === 'undefined')){ 
        cutCurrentWord();
        typeOffset = currently_typed.length-1;
        currently_typed = listString(currently_typed, predictions[2] + " ", typeOffset);
        typeOffset += predictions[2].length + 1;
      }
      return true;
    default:
      return false;    
  }  
} 

function mouseReleased() {

  if (!draw_finger_arm) {
    return;
  }

  if (!mouseClickWithin(width / 2 - 2.0 * PPCM, height / 2 - 1.0 * PPCM, 4.0 * PPCM, 3.0 * PPCM)){
    return;
  }

  if (current_letter == "_"){
    //space
    current_letter = " ";
  }
  
  if (current_letter == "⌫"){
    //entao eu vou querer apagar uma coisa e nao adicionar
    if(typeOffset > 0){
      currently_typed = listString(currently_typed, "delete", typeOffset);
      typeOffset--;
      
    }else{
      typeOffset =  0;
    }
  }
  
  if(writePrediction(current_letter)){}
  else if (current_letter == "cursorBack"){
    if(typeOffset > 0){
      currently_typed = listString(currently_typed, "cursorBack", typeOffset);
      typeOffset--;
    }
  }
  else if (current_letter == "cursorFront"){
    if(typeOffset < currently_typed.length -1){
      currently_typed = listString(currently_typed, "cursorFront", typeOffset);
      typeOffset++;
    }
  }
  else if(current_letter != "" && current_letter != "⌫"){
    currently_typed = listString(currently_typed, current_letter, typeOffset);
    
    typeOffset++;  
    
  }
  drawPrediction(currently_typed);
  current_letter = "";
}


function listString(myString, add, index){
  var myArray = Array.from(myString);

  //vamos apagar a barra onde quer que ele esteja
  var leftOver =  myArray.slice(myArray.indexOf("|")+1);
  myArray.splice(myArray.indexOf("|"));
  myArray = myArray.concat(leftOver);

  //ver se e para apagar
  if(add == "delete"){
      //this means that I want to erase
      if(typeOffset == myString.length-1){
          //quer dizer que eu estou na ultima posicao
          myArray.splice(index-1);
          myArray.splice(index, 0,"|");
      }
      else{
          //quer dizer que eu ja nao estou na ultima posicao
          leftOver = myArray.slice(index);
          leftOver.unshift("|");
          myArray.splice(index-1);
          myArray = myArray.concat(leftOver);
      }
  }else if(add == ""){
      //aqui quer dizer que eu quero so meter a | no lugar certo
      myArray.splice(index, 0, "|");
  }
  else if(add == "cursorBack"){
    myArray.splice(index-1, 0, "|");
  }
  else if(add == "cursorFront"){
    myArray.splice(index+1, 0, "|");
  }
  else{
    myArray.splice(index, 0, "|");
    myArray.splice(index, 0, add);
  }
  
  return myArray.join("");

}

// Resets variables for second attempt
function startSecondAttempt() {
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial = 0;
  target_phrase = phrases[current_trial];

  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected = 0;
  letters_entered = 0;
  errors = 0;
  currently_typed = "";
  CPS = 0;

  current_letter = "";

  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm = true;
  attempt_start_time = millis();
}

// Print and save results at the end of 2 trials
function printAndSavePerformance() {
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm = (letters_entered / 5.0) / attempt_duration;
  let freebie_errors = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty = max(0, (errors - freebie_errors) / attempt_duration);
  let wpm_w_penalty = max((wpm - penalty), 0);                                   // minus because higher WPM is better: NET WPM
  let timestamp = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  CPS = letters_entered / (attempt_duration * 60);

  background(color(0, 0, 0));    // clears screen
  cursor();                    // shows the cursor again

  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255, 255, 255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 

  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2);

  // For each trial/phrase
  let h = 20;
  for (i = 0; i < 2; i++, h += 40) {
    text("Target phrase " + (i + 1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i + 1) + ": " + entered[i], width / 2, height / 2 + h + 20);
  }

  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h + 20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h + 40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h + 60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h + 80);
  text("CPS: " + CPS, width / 2, height / 2 + h+100);


  // Saves results (DO NOT CHANGE!)
  let attempt_data =
  {
    project_from: GROUP_NUMBER,
    assessed_by: student_ID,
    attempt_completed_by: timestamp,
    attempt: attempt,
    attempt_duration: attempt_duration,
    raw_wpm: wpm,
    freebie_errors: freebie_errors,
    penalty: penalty,
    wpm_w_penalty: wpm_w_penalty,
    cps: CPS
  }

  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY) {
    // Access the Firebase DB
    if (attempt === 0) {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }

    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let display = new Display({ diagonal: display_size }, window.screen);

  // DO NO CHANGE THESE!
  PPI = display.ppi;                        // calculates pixels per inch
  PPCM = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE = (int)(11 * PPCM);
  FINGER_OFFSET = (int)(0.8 * PPCM)
  ARM_LENGTH = (int)(19 * PPCM);
  ARM_HEIGHT = (int)(11.2 * PPCM);

  KEYBOARD_WIDTH = (int)(4.0 * PPCM);
  KEYBOARD_HEIGHT = (int)((4.0 * PPCM) * 297 / 590);

  SETUP_X = width / 2 - 2.0 * PPCM;
  SETUP_Y = height / 2 - 1.0 * PPCM;

  LETTER_SIZE_X = KEYBOARD_WIDTH * 59.5 / 590
  LETTER_SIZE_Y = KEYBOARD_WIDTH * 75 / 590
  OFFSET_LETTER_X = KEYBOARD_WIDTH * 27 / 590
  OFFSET_LETTER_Y = KEYBOARD_WIDTH * 36 / 590

  POINTER_DIST = (int)(0.8 * PPCM);


  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}