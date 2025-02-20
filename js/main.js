import { FaceLandmarker, FilesetResolver, DrawingUtils } from "./tasks-vision.js";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// ^ imports, first line for mediapipe, rest for Three.js which is for 3D rendering

// Map blendshapes from MediaPipe to AU (Action Units) present in the 3D model
const blendshapesMap = {
    'browInnerUp': 'AU_1',
    'browOuterUpLeft': 'AU_2',
    'browOuterUpRight': 'AU_2',
    'browDownLeft': 'AU_4',
    'browDownRight': 'AU_4',
    'eyeWideLeft': 'AU_5',
    'eyeWideRight': 'AU_5',
    'eyeSquintLeft': 'AU_7',
    'eyeSquintRight': 'AU_7',
    'eyeBlinkLeft': 'AU_43',
    'eyeBlinkRight': 'AU_43',
    'mouthSmileLeft': 'AU_12',
    'mouthSmileRight': 'AU_12',
    'mouthFrownLeft': 'AU_15',
    'mouthFrownRight': 'AU_15',
    'mouthPucker': 'AU_18',
    'mouthStretchLeft': 'AU_20',
    'mouthStretchRight': 'AU_20',
    'mouthPressLeft': 'AU_23',
    'mouthPressRight': 'AU_23',
    'jawOpen': 'AU_26',
    'noseSneerLeft': 'AU_9',
    'noseSneerRight': 'AU_9',
};

// Three.js preparation

// Set up the Three.js scene and attach it to html element with id '3dscene'
var container = document.getElementById( '3dscene' );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( container.clientWidth, container.clientHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

// Set up the Three.js camera
const camera = new THREE.PerspectiveCamera( 60, container.clientWidth / container.clientHeight, 1, 100 );
camera.position.z = 5;
const scene = new THREE.Scene();
scene.scale.x = - 1;
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator( renderer );
scene.background = new THREE.Color( 0x666666 );
scene.environment = pmremGenerator.fromScene( environment ).texture;
const controls = new OrbitControls( camera, renderer.domElement );
const transform = new THREE.Object3D();


// Load the 3D model and find the face, eyes and teeth meshes
let face, eyeL, eyeR, teeth;
const eyeRotationLimitHorizontal = THREE.MathUtils.degToRad( 30 );
const eyeRotationLimitVertical = THREE.MathUtils.degToRad( 30 );
const ktx2Loader = new KTX2Loader()
    .setTranscoderPath( 'three/addons/jsm/libs/basis/' )
    .detectSupport( renderer );
new GLTFLoader()
    .setKTX2Loader( ktx2Loader )
    .setMeshoptDecoder( MeshoptDecoder )
    .load( 'models/head.gltf', ( gltf ) => {
        const mesh = gltf.scene.children[ 0 ];
        scene.add( mesh );
        const head = mesh.getObjectByName( 'mesh_2' );
        face = mesh.getObjectByName( 'mesh_2' );
        eyeL = mesh.getObjectByName( 'eyeLeft' );
        eyeR = mesh.getObjectByName( 'eyeRight' );
        teeth = mesh.getObjectByName( 'mesh_3' );
        const gui = new GUI();
        gui.close();
        const influences = head.morphTargetInfluences;
        for ( const [ key, value ] of Object.entries( head.morphTargetDictionary ) ) {
            gui.add( influences, value, 0, 1, 0.01 )
                .name( key.replace( 'blendShape1.', '' ) )
                .listen( influences );
        }
    } );

// Find html elements for displaying the blendshapes
const demosSection = document.getElementById("demos");
const column1 = document.getElementById("video-blend-shapes-column1");
let faceLandmarker;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = 480;

// Preload assets from CDN
async function preLoadAssets() {    
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode,
        numFaces: 1
    });
    demosSection.classList.remove("invisible");
}
preLoadAssets();

// Find the video element and canvas for rendering the results
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.maxFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;
videoTexture.wrapS = THREE.RepeatWrapping;
videoTexture.repeat.x = -1;
videoTexture.colorSpace = THREE.SRGBColorSpace;
scene.background=videoTexture;

// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user wants to enable it
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection
function enableCam(event) {
    if (!faceLandmarker) {
        console.log("Wait! faceLandmarker not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }
    // getUsermedia parameters
    const constraints = {
        video: true
    };
    // Activate the webcam stream
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}
let lastVideoTime = -1;
let results = undefined;
const drawingUtils = new DrawingUtils(canvasCtx);

// This is called for every frame, it processes the video stream and detects the face landmarks
async function predictWebcam() {
    const radio = video.videoHeight / video.videoWidth;
    video.style.width = videoWidth + "px";
    video.style.height = videoWidth * radio + "px";
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = videoWidth * radio + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    // Now let's start detecting the stream
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await faceLandmarker.setOptions({ runningMode: runningMode });
    }
    let nowInMs = Date.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = faceLandmarker.detectForVideo(video, nowInMs);
        console.log(video.srcObject);
    }
    if (results.faceLandmarks) {
        // If we have landmarks, draw them on the user's face
        for (const landmarks of results.faceLandmarks) {
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" , lineWidth: 1});
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" , lineWidth: 1});
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" , lineWidth: 1});
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" , lineWidth: 1});
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" , lineWidth: 1});
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" , lineWidth: 1});
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" , lineWidth: 1});
        }
    }
    // If we have blendshapes, print them on the screen and draw the 3D scene
    if (results.faceBlendshapes.length > 0) {
        const blendShapeCategories = results.faceBlendshapes[0].categories;
        printBlendShapes(column1, blendShapeCategories);
        draw3dScene(results,blendShapeCategories)
    }

    // If the webcam is still enabled, call this function again for the next frame
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
    
}

// Print the blendshapes on the screen (the numbers visible next to video and 3D scene)
function printBlendShapes(el, blendShapes) {
    if (!blendShapes.length) {
      return;
    }
    let htmlMaker = "";
    blendShapes.map((shape) => {
      htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">${shape.displayName || shape.categoryName}</span>
          <span class="blend-shapes-value" style="width: calc(${shape.score * 100}% - 120px)">${shape.score.toFixed(4)}</span>
        </li>
      `;
    });
    el.innerHTML = htmlMaker;
  }
// Draw the 3D scene with the face landmarks and blendshapes
function draw3dScene(results, faceBlendshapes) {
    if ( video.readyState >= HTMLMediaElement.HAVE_METADATA ) {
        if(videoTexture) {
            videoTexture.needsUpdate = true;
        }

        if ( results.facialTransformationMatrixes.length > 0 ) {
            const facialTransformationMatrixes = results.facialTransformationMatrixes[ 0 ].data;
            transform.matrix.fromArray( facialTransformationMatrixes );
            transform.matrix.decompose( transform.position, transform.quaternion, transform.scale );
            const object = scene.getObjectByName( 'grp_transform' );
            // Update the 3D model to rotate the head
            object.rotation.x = transform.rotation.x;
            object.rotation.y = transform.rotation.y;
            object.rotation.z = transform.rotation.z;
        }
        if ( results.faceBlendshapes.length > 0 ) {
            // Tracks eye movement
            const eyeScore = {
                leftHorizontal: 0,
                rightHorizontal: 0,
                leftVertical: 0,
                rightVertical: 0,
                };
            let eyeBlinkScore=0;
            for ( const blendshape of faceBlendshapes ) {
                const categoryName = blendshape.categoryName;
                let score = blendshape.score;
                const index = face.morphTargetDictionary[ blendshapesMap[ categoryName ] ];
                if(categoryName=="eyeBlinkLeft" || categoryName=="eyeBlinkRight") {
                    if(eyeBlinkScore==0)
                    {
                        eyeBlinkScore+=score;
                        continue;
                    }
                    else {
                        eyeBlinkScore+=score;
                        eyeBlinkScore/=1.5;
                        score=eyeBlinkScore;
                    }
                }

                if ( index !== undefined ) {
                    face.morphTargetInfluences[ index ] = score;
                    teeth.morphTargetInfluences[index] = score;
                }
                // There are two blendshape for movement on each axis (up/down , in/out)
                // Add one and subtract the other to get the final score in -1 to 1 range
                switch ( categoryName ) {
                    case 'eyeLookInLeft':
                        eyeScore.leftHorizontal += score;
                        break;
                    case 'eyeLookOutLeft':
                        eyeScore.leftHorizontal -= score;
                        break;
                    case 'eyeLookInRight':
                        eyeScore.rightHorizontal -= score;
                        break;
                    case 'eyeLookOutRight':
                        eyeScore.rightHorizontal += score;
                        break;
                    case 'eyeLookUpLeft':
                        eyeScore.leftVertical -= score;
                        break;
                    case 'eyeLookDownLeft':
                        eyeScore.leftVertical += score;
                        break;
                    case 'eyeLookUpRight':
                        eyeScore.rightVertical -= score;
                        break;
                    case 'eyeLookDownRight':
                        eyeScore.rightVertical += score;
                        break;
                }
            }
            // Apply the eye movement to the 3D model
            eyeL.rotation.y = -eyeScore.leftHorizontal * eyeRotationLimitHorizontal;
            eyeR.rotation.y = -eyeScore.rightHorizontal * eyeRotationLimitHorizontal;
            eyeL.rotation.x = eyeScore.leftVertical * eyeRotationLimitVertical;
            eyeR.rotation.x = eyeScore.rightVertical * eyeRotationLimitVertical;
        }
    }
    // Render the 3D scene
    renderer.render( scene, camera );
    controls.update();
}