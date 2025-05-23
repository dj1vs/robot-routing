import {
  fadeToAction,
  addSide,
  createGUI,
  updateData,
  init,
  animate,
  model,
  scene,
  camera,
  jsonData
} from "./scene.js";

import * as THREE from "three";

const socket = io("http://localhost:3010/");

let animationsObjects = [];

function connectToStation() {
  console.log("Connecting to station...");
  const host = document.getElementById("host").value;
  socket.emit("connectToStation", host);
}

function disconnectFromStation() {
  console.log("Disconnecting from station...");
  socket.emit("disconnectFromStation");
}

function moveForward() {
  console.log("move Forward...");
  socket.emit("move", "forward")
  // let angle = Math.round(getCurrentRobotRotationDegrees());
  // if(angle == 0)moveRobotForward(stepSize, 1000, "север");
  // if(angle == 90)moveRobotForward(stepSize, 1000, "восток");
  // if(angle == 180)moveRobotForward(stepSize, 1000, "юг");
  // if(angle == 270)moveRobotForward(stepSize, 1000, "запад");
}

function moveRight() {
  console.log("move Right...");
  socket.emit("move", "right");
  // moveRobotForwardAndRotate(-90, stepSize, 1000);
}

function moveLeft() {
  console.log("move Left...");
  socket.emit("move", "left");
  // moveRobotForwardAndRotate(90, stepSize, 1000);
}

function moveBack() {
  console.log("move back...");
  socket.emit("move", "backward");
  // moveRobotForwardAndRotate(180, stepSize, 1000);
}

function turnRight() {
  console.log("turn right...");
  socket.emit("turn", "right");
}

function turnLeft() {
  console.log("turn left...");
  socket.emit("turn", "left");
}

function heal() {
  fadeToAction("ThumbsUp", 0.2);
  console.log("healing");
  socket.emit("heal");
}

function restart() {
  console.log("restarting...");
  socket.emit("restart");
}

socket.on("allInfo", (state) => {
  if (!state.coordinates) {
    return;
  }
  document.getElementById("health").innerHTML = "Здоровье: " + state.health;
  console.log("allinfo", state);
  updateData(state);
  init();
  animate();
});

socket.on("state", (state) => {
  console.log('hi')
  if (!model) {
    updateData(state);
    init();
    animate();
  } else {
    const initialPosition = new THREE.Vector3(model.position.x, model.position.y, model.position.z);
    const targetPosition = new THREE.Vector3(state.coordinates[0] * 100, state.coordinates[1] * 100, state.coordinates[2] * 100 );
    const initialRotation = getDegrees(model.rotation._y);

    let targetRotation = 0

    if (jsonData.direction != state.direction)
    {
      if (jsonData.direction == 'север' && state.direction == 'юг'
        || jsonData.direction == 'юг' && state.direction == 'север'
        || jsonData.direction == 'восток' && state.direction == 'запад'
        || jsonData.direction == 'запад' && state.direciton == 'восток'
      )
      {
        targetRotation = 180
      }
      else if ((jsonData.direction == 'север' && state.direction == 'восток')
        || (jsonData.direction == 'восток' && state.direction == 'юг')
        || (jsonData.direction == 'юг' && state.direction == 'запад')
        || (jsonData.direction == 'запад' && state.direction == 'север')
      )
      {
        targetRotation = 90
      }
      else
      {
        targetRotation = -90
      }
    }

    move(stepSize, 1000, initialRotation, targetRotation, initialPosition, targetPosition );
    // model.position.set(newXPosition, newYPosition, newZPosition);
    // model.position.
    updateData(state);
    addSide();
  }
  document.getElementById("health").innerHTML = "Здоровье: " + state.health;
  console.log(state);
});

socket.on("connect", () => console.log("connected to ЦУП"));

socket.on("message", (data) => console.log("Message received: " + data));

socket.on("temperature", (temperature) => {
  document.getElementById("temperature").innerHTML = "Температура: " + parseFloat(temperature).toFixed(3);
});

socket.on("health", (health) => {
  document.getElementById("health").innerHTML = "Здоровье: " + health;
});

socket.on("dead", () => {});

socket.on("action", (action) => {
  console.log(action)
  fadeToAction(action, 0.2);
});

socket.on("emote", (emote) => {
  console.log(emote)
  fadeToAction(emote, 0.2);
});

// Show the modal with error text
function showErrorPopup(errorText) {
	const backdrop = document.getElementById('error-modal-backdrop');
	const message = document.getElementById('error-message');
	message.textContent = errorText;
	backdrop.style.display = 'flex';
}

// Hide the modal
function closeErrorModal() {
	document.getElementById('error-modal-backdrop').style.display = 'none';
}

socket.on("basic_error", (text) => {
  showErrorPopup("BASIC:\n" + text);
})

socket.on("runtime_error", (text) => {
  showErrorPopup("Экспертная система:\n" + text);
})



socket.on("expression", (expression) => {});

socket.on("mode", (mode) => {});

document.getElementById("basicButton").addEventListener("click", function(event)
{
  document.getElementById("basicButtonInput").click();
});

document.getElementById("basicButtonInput").onchange = function(event) {
  var fr=new FileReader();
  fr.onload=function(){
    console.log(fr.result)

    socket.emit("exec", fr.result)

    event.target.value = "";
  };
  
  fr.readAsText(event.target.files[0])

};


document
  .getElementById("moveForwardButton")
  .addEventListener("click", moveForward);

document.getElementById("moveBackButton").addEventListener("click", moveBack);

document.getElementById("moveRightButton").addEventListener("click", moveRight);

document.getElementById("moveLeftButton").addEventListener("click", moveLeft);

document.getElementById("turnRightButton").addEventListener("click",turnRight);

document.getElementById("turnLeftButton").addEventListener("click", turnLeft );

document.getElementById("healButton").addEventListener("click", heal);

document.getElementById("connect").addEventListener("click", connectToStation);

document.getElementById("error-modal-close-button").addEventListener("click", closeErrorModal);

document
  .getElementById("disconnect")
  .addEventListener("click", disconnectFromStation);

// smooth animation
let robotPosition = new THREE.Vector3();
let stepSize = 100;
let robotRotationAngle = 0; 

function createMoveAnimation({
    mesh,
    startPosition,
    endPosition
  }) {
    mesh.userData.mixer = new THREE.AnimationMixer(mesh);
    let track = new THREE.VectorKeyframeTrack(
      '.position', [0, 1, 2], [
      startPosition.x,
      startPosition.y,
      startPosition.z,
      endPosition.x,
      endPosition.y,
      endPosition.z,
      ]
    );
    const animationClip = new THREE.AnimationClip(null, 5, [track]);
    const animationAction = mesh.userData.mixer.clipAction(animationClip);
    animationAction.setLoop(THREE.LoopOnce);
    animationAction.play();
    mesh.userData.clock = new THREE.Clock();
    animationsObjects.push(mesh);
  };

  // model
  
  // robotPosition.set(model.position.x, model.position.y, model.position.z )


  function updateRobotPosition() {
    model.position.set(robotPosition.x, robotPosition.y, robotPosition.z);
  }

  function rotateRobot(degrees) {
    if (model) {
      const radians = (degrees * Math.PI) / 180; // Переводим градусы в радианы
      model.rotateY(radians);
      robotRotationAngle += radians; // Обновляем угол поворота
    }
  }

  function getDegrees(rotation) {
    var radians = rotation;

    // Преобразуем радианы в градусы
    var degrees = (radians * 180) / Math.PI;

    // Преобразуем отрицательные значения в положительные и ограничиваем в пределах 0-359 градусов
    degrees = (degrees % 360 + 360) % 360;

    return degrees;
  }

  function move(distance, duration, initialRotation, targetRotation, initialPosition, targetPosition) {
    if (model) {
      const start = performance.now();
      const end = start + duration;
      
      // if (direction == 'север') {
      //   targetPosition.z += distance;
      // } else if (direction == 'восток') {
      //   targetPosition.x += distance;
      // } else if (direction == 'юг') {
      //   targetPosition.z -= distance;
      // } else if (direction == 'запад') {
      //   targetPosition.x -= distance;
      // }

      rotateRobotSmoothly(initialRotation, targetRotation, 200);

      /** если робот сделал только поворот */
      if (
        initialPosition.x === targetPosition.x && 
        initialPosition.y === targetPosition.y && 
        initialPosition.z === targetPosition.z 
      ) {
        return;
      }

      function animate(currentTime) {
        const elapsedTime = currentTime - start;
        const progress = elapsedTime / duration;

        if (progress < 1) {
          model.position.lerpVectors(initialPosition, targetPosition, progress);
          requestAnimationFrame(animate);
        } else {
          model.position.copy(targetPosition);
        }
      }
      fadeToAction("Walking", 0);
      fadeToAction("Idle", 4);
      requestAnimationFrame(animate);

      // Создайте анимацию для данной функции перемещения
      createMoveAnimation({
        mesh: model,
        startPosition: initialPosition,
        endPosition: targetPosition,
        duration: duration
      });
    }
  }

  function createRotateAnimation({ mesh, startRotation, endRotation, duration }) {
    // Создайте анимацию для разворота робота
    if (mesh) {
      const clock = new THREE.Clock();
      const mixer = new THREE.AnimationMixer(mesh);
      const rotationTrack = new THREE.NumberKeyframeTrack(
      '.rotation[y]', // Анимация вращения вокруг оси Y
      [0, duration],
      [startRotation, endRotation]
      );
      const rotationClip = new THREE.AnimationClip('RotateAnimation', duration, [rotationTrack]);
      const rotationAction = mixer.clipAction(rotationClip);
      rotationAction.setLoop(THREE.LoopOnce);
      rotationAction.play();
      mixer.update(0); // Начальное обновление
      mesh.userData.mixer = mixer;
    }
  }

  function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  function rotateRobotSmoothly(initialRotation, targetRotation, duration) {
    // temporary fix: animation disabled
    return new Promise(async (resolve) => {
      if (model) {
        let steps = 25;
        let step_dur = duration / steps;

        for (let i = 0; i < steps; i++) {
          model.rotateY(degreesToRadians(targetRotation/steps));
          await new Promise(r => setTimeout(r, step_dur));
        }
        resolve();
      }

    });
    }

    function moveRobotForwardAndRotate(degrees, distance, duration) {
      rotateRobotSmoothly(degrees, duration).then(() => {
        let angle = Math.round(getCurrentRobotRotationDegrees());
        if (angle === 0) move(distance, duration, "север");
        else if (angle === 90) move(distance, duration, "восток");
        else if (angle === 180) move(distance, duration, "юг");
        else if (angle === 270) move(distance, duration, "запад");
      }).catch(error => alert(error))
    }