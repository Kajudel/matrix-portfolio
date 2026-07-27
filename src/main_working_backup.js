import * as THREE from "three";
import "./style.css";

console.log("MATRIX 2.0 COLOR MODE LOADED");


/* ================= THREE ================= */

const scene = new THREE.Scene();


const camera = new THREE.PerspectiveCamera(
45,
window.innerWidth/window.innerHeight,
0.1,
100
);

camera.position.z=5;



const renderer=new THREE.WebGLRenderer({

antialias:true,
alpha:false

});


renderer.setClearColor(0x050505,1);


renderer.setSize(
window.innerWidth,
window.innerHeight
);


document.body.appendChild(renderer.domElement);



/* ================= PARTICLES ================= */


const COUNT=3000;


const geometry=new THREE.BufferGeometry();


const positions=[];
const base=[];
const velocity=[];



for(let i=0;i<COUNT;i++){


const r=1.5;


const phi=Math.acos(
-1+(2*i)/COUNT
);


const theta=Math.sqrt(COUNT*Math.PI)*phi;



const x=r*Math.sin(phi)*Math.cos(theta);
const y=r*Math.sin(phi)*Math.sin(theta);
const z=r*Math.cos(phi);



positions.push(x,y,z);

base.push(x,y,z);


velocity.push(0,0,0);


}



geometry.setAttribute(

"position",

new THREE.Float32BufferAttribute(
positions,
3
)

);




const material=new THREE.PointsMaterial({

size:0.035,

color:0xff3366,

transparent:true,

opacity:.9,

blending:THREE.AdditiveBlending

});



const sphere=new THREE.Points(

geometry,

material

);



scene.add(sphere);




/* ================= VARIABLES ================= */


let rotationX=0;
let rotationY=0;

let scale=1;


let exploding=false;

let pinch=false;
let charge=0;

const chargeBar=document.querySelector("#charge span");

const gestureText=document.getElementById("gesture");



let targetColor=new THREE.Color(0xff3366);



/* ================= ANIMATION ================= */


function animate(){


requestAnimationFrame(animate);



sphere.rotation.x+=rotationX;

sphere.rotation.y+=rotationY;



material.size=
0.035+
Math.sin(Date.now()*0.003)*0.008;



material.color.lerp(
targetColor,
0.05
);



sphere.scale.set(
scale,
scale,
scale
);



const arr=geometry.attributes.position.array;



for(let i=0;i<COUNT;i++){


let id=i*3;



if(exploding){


arr[id]+=velocity[id];

arr[id+1]+=velocity[id+1];

arr[id+2]+=velocity[id+2];



velocity[id]*=.96;

velocity[id+1]*=.96;

velocity[id+2]*=.96;


}

else{


arr[id]+=(base[id]-arr[id])*.04;

arr[id+1]+=(base[id+1]-arr[id+1])*.04;

arr[id+2]+=(base[id+2]-arr[id+2])*.04;


}


}



geometry.attributes.position.needsUpdate=true;



renderer.render(
scene,
camera
);


}


animate();





/* ================= CAMERA ================= */


const video=document.createElement("video");


video.id="webcam";

video.autoplay=true;

video.muted=true;

video.playsInline=true;



document.body.appendChild(video);



navigator.mediaDevices.getUserMedia({

video:true

})
.then(stream=>{

video.srcObject=stream;

});






/* ================= MEDIAPIPE ================= */


const hands=new Hands({

locateFile:(file)=>{

return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;

}

});



hands.setOptions({

maxNumHands:2,

modelComplexity:1,

minDetectionConfidence:.7,

minTrackingConfidence:.7

});





hands.onResults(results=>{


const list=results.multiHandLandmarks;



if(!list) return;



/* ONE HAND */


if(list.length===1){



const hand=list[0];



let x=hand[9].x;

let y=hand[9].y;



rotationY=(x-.5)*0.08;

rotationX=(y-.5)*0.08;



/* PINCH */


const thumb=hand[4];

const index=hand[8];


const distance=Math.hypot(

thumb.x-index.x,

thumb.y-index.y

);


if(distance < 0.05){

    pinch=true;

    charge += 2;

    if(charge > 100)
        charge = 100;


    gestureText.innerHTML =
    "PINCH CHARGING ⚡";


    material.size =
    0.035 + charge * 0.0005;


}
else{


    if(pinch && charge > 20){

        explode();

        gestureText.innerHTML =
        "ENERGY RELEASE 💥";

    }


    pinch=false;

    charge=0;


}


/* COLOR CONTROL */


let fingers=countFingers(hand);



if(fingers===1){

targetColor.set(0xff0000);

gestureText.innerHTML="1 FINGER - RED";

}


else if(fingers===2){


targetColor.set(0xff3366);

gestureText.innerHTML="2 FINGERS - PINK";


}


else if(fingers===3){


targetColor.set(0x00ffff);

gestureText.innerHTML="3 FINGERS - CYAN";


}


else if(fingers===4){


targetColor.set(0xaa00ff);

gestureText.innerHTML="4 FINGERS - PURPLE";


}


else if(fingers===5){


targetColor.set(0xffffff);

gestureText.innerHTML="OPEN HAND - WHITE";


}



}



/* TWO HAND SCALE */


if(list.length===2){


let a=list[0][9];

let b=list[1][9];


let distance=Math.hypot(

a.x-b.x,

a.y-b.y

);



scale=THREE.MathUtils.clamp(

distance*2,

0.6,

2.5

);



gestureText.innerHTML="TWO HAND SCALE";


}

chargeBar.style.width = charge + "%";

});





function countFingers(hand){


let count=0;



if(hand[8].y < hand[6].y)
count++;


if(hand[12].y < hand[10].y)
count++;


if(hand[16].y < hand[14].y)
count++;


if(hand[20].y < hand[18].y)
count++;



return count;


}





function explode(){


exploding=true;



for(let i=0;i<COUNT;i++){


let id=i*3;


velocity[id]=(Math.random()-.5)*0.35;

velocity[id+1]=(Math.random()-.5)*0.35;

velocity[id+2]=(Math.random()-.5)*0.35;



}



setTimeout(()=>{

exploding=false;


},1500);


}





/* ================= CAMERA START ================= */


const cam=new Camera(video,{

onFrame:async()=>{

await hands.send({

image:video

});


},

width:1280,

height:720

});


cam.start();






/* ================= RESIZE ================= */


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


}

);