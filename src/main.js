import * as THREE from "three";

import "./style.css";

console.log("MAIN JS LOADED");

const scene = new THREE.Scene();


const camera = new THREE.PerspectiveCamera(
45,
window.innerWidth/window.innerHeight,
0.1,
100
);

camera.position.z = 5;


const renderer = new THREE.WebGLRenderer({
alpha:true,
antialias:true
});

renderer.setSize(
window.innerWidth,
window.innerHeight
);

document.body.appendChild(renderer.domElement);



const count = 3000;

const geometry = new THREE.BufferGeometry();

const positions=[];


for(let i=0;i<count;i++){

const r=1.5;

const phi=Math.random()*Math.PI*2;
const theta=Math.acos(
2*Math.random()-1
);


positions.push(
r*Math.sin(theta)*Math.cos(phi),
r*Math.sin(theta)*Math.sin(phi),
r*Math.cos(theta)
);

}


geometry.setAttribute(
"position",
new THREE.Float32BufferAttribute(
positions,
3
)
);



const material = new THREE.PointsMaterial({

color:0xffffff,

size:0.025

});


const sphere = new THREE.Points(
geometry,
material
);


scene.add(sphere);



function animate(){

requestAnimationFrame(animate);


sphere.rotation.y+=0.003;


renderer.render(
scene,
camera
);

}


animate();



/* HAND TRACKING */


const video = document.createElement("video");

video.id = "webcam";
video.autoplay = true;
video.muted = true;
video.playsInline = true;

document.body.appendChild(video);


navigator.mediaDevices.getUserMedia({
    video:true
})
.then(stream=>{
    video.srcObject = stream;
})
.catch(error=>{
    console.log("Camera error:", error);
});


const button=document.createElement("button");

button.innerText="Toggle Webcam";

button.id="camBtn";

document.body.appendChild(button);


let webcamVisible=false;


button.onclick=()=>{

webcamVisible=!webcamVisible;

video.style.opacity=
webcamVisible ? "0.35":"0";

};


const hands = new Hands({

locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}

});

hands.setOptions({

maxNumHands:2,

modelComplexity:1,

minDetectionConfidence:.7,

minTrackingConfidence:.7

});


hands.onResults(result=>{


const detected = result.multiHandLandmarks;


if(detected && detected.length > 0){


    let hand = detected[0];


    let x = hand[9].x;
    let y = hand[9].y;


    sphere.rotation.y += (x - 0.5) * 0.08;


    sphere.rotation.x += (y - 0.5) * 0.08;


}


});


const cam = new Camera(video,{
    
onFrame:async()=>{

await hands.send({
image:video
});

},

width:1280,

height:720

});


cam.start();




window.addEventListener(
"resize",
()=>{

camera.aspect=
window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();


renderer.setSize(
window.innerWidth,
window.innerHeight
);

});