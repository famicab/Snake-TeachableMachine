// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/puUczo8P2/";

let model, webcam, ctx2, labelContainer, maxPredictions;

/**
 * Snake logic
 */

//Snake consts
window.onload = function () {
  canvas = document.getElementById("snake");
  ctx = canvas.getContext("2d");

  document.addEventListener("keydown", keyDownEvent);

  // render X times per second
  var x = 1.5;
  setInterval(draw, 1000 / x);
};

// game world
var gridSize = (tileSize = 20); // 20 x 20 = 400
var nextX = (nextY = 0);

// snake
var defaultTailSize = 3;
var tailSize = defaultTailSize;
var snakeTrail = [];
var snakeX = (snakeY = 10);

// apple
var appleX = (appleY = 15);

// draw
function draw() {
  // move snake in next pos
  snakeX += nextX;
  snakeY += nextY;

  // snake over game world?
  if (snakeX < 0) {
    snakeX = gridSize - 1;
  }
  if (snakeX > gridSize - 1) {
    snakeX = 0;
  }

  if (snakeY < 0) {
    snakeY = gridSize - 1;
  }
  if (snakeY > gridSize - 1) {
    snakeY = 0;
  }

  //snake bite apple?
  if (snakeX == appleX && snakeY == appleY) {
    tailSize++;

    appleX = Math.floor(Math.random() * gridSize);
    appleY = Math.floor(Math.random() * gridSize);
  }

  //paint background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // paint snake
  ctx.fillStyle = "green";
  for (var i = 0; i < snakeTrail.length; i++) {
    ctx.fillRect(
      snakeTrail[i].x * tileSize,
      snakeTrail[i].y * tileSize,
      tileSize,
      tileSize
    );

    //snake bites it's tail?
    if (snakeTrail[i].x == snakeX && snakeTrail[i].y == snakeY) {
      tailSize = defaultTailSize;
    }
  }

  // paint apple
  ctx.fillStyle = "red";
  ctx.fillRect(appleX * tileSize, appleY * tileSize, tileSize, tileSize);

  //set snake trail
  snakeTrail.push({ x: snakeX, y: snakeY });
  while (snakeTrail.length > tailSize) {
    snakeTrail.shift();
  }
}

// input
let direc = "";
function keyDownEvent(e) {
  let key = e.keyCode;
  if (key == 37 && direc != "RIGHT") {
    nextX = -1;
    nextY = 0;
    direc = "LEFT";
  } else if (key == 38 && direc != "DOWN") {
    direc = "UP";
    nextX = 0;
    nextY = -1;
  } else if (key == 39 && direc != "LEFT") {
    direc = "RIGHT";
    nextX = 1;
    nextY = 0;
  } else if (key == 40 && direc != "UP") {
    direc = "DOWN";
    nextX = 0;
    nextY = 1;
  }
}

/**
 * Teachable Machine logic
 */
// Load the image model and setup the webcam
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  model = await tmPose.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const size = 200;
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop);

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = size; canvas.height = size;
  ctx2 = canvas.getContext("2d");
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < maxPredictions; i++) { // and class labels
      labelContainer.appendChild(document.createElement("div"));
  }
}

async function loop(timestamp) {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  // Prediction 2: run input through teachable machine classification model
  const prediction = await model.predict(posenetOutput);

  // finally draw the poses
  drawPose(pose);

  if (prediction[0].probability > 0.95 && direc != "DOWN") {
    direc = "UP";
    nextX = 0;
    nextY = -1;
  } else if (prediction[1].probability > 0.95 && direc != "UP") {
    direc = "DOWN";
    nextX = 0;
    nextY = 1;
  } else if (prediction[2].probability > 0.95 && direc != "RIGHT") {
    nextX = -1;
    nextY = 0;
    direc = "LEFT";
  } else if (prediction[3].probability > 0.95 && direc != "LEFT") {
    direc = "RIGHT";
    nextX = 1;
    nextY = 0;
  }
  await sleep(100);
}

/**
 * Draw webcam
 * @param {*} pose 
 */
function drawPose(pose) {
  if (webcam.canvas) {
      ctx2.drawImage(webcam.canvas, 0, 0);
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}  
