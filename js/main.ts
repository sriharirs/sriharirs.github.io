import { FaceLandmarker, FilesetResolver, DrawingUtils, FaceLandmarkerResult, Category } from "@mediapipe/tasks-vision";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Map blendshapes from MediaPipe to AU (Action Units) present in the 3D model
const blendshapesMap: Record<string, string[] | string> = {
    'browDownLeft': 'Brow_Drop_L',
    'browDownRight': 'Brow_Drop_R',
    'browInnerUp': ['Brow_Raise_Inner_L', 'Brow_Raise_Inner_R'],
    'browOuterUpLeft': 'Brow_Raise_Outer_L',
    'browOuterUpRight': 'Brow_Raise_Outer_R',
    'cheekPuff': ['Cheek_Puff_L', 'Cheek_Puff_R'],
    'cheekSquintLeft': 'Cheek_Raise_L',
    'cheekSquintRight': 'Cheek_Raise_R',
    'eyeBlinkLeft': 'Eye_Blink_L',
    'eyeBlinkRight': 'Eye_Blink_R',
    'eyeLookDownLeft': 'Eye_L_Look_Down',
    'eyeLookDownRight': 'Eye_R_Look_Down',
    'eyeLookInLeft': 'Eye_L_Look_R',
    'eyeLookInRight': 'Eye_R_Look_L',
    'eyeLookOutLeft': 'Eye_L_Look_L',
    'eyeLookOutRight': 'Eye_R_Look_R',
    'eyeLookUpLeft': 'Eye_L_Look_Up',
    'eyeLookUpRight': 'Eye_R_Look_Up',
    'eyeSquintLeft': 'Eye_Squint_L',
    'eyeSquintRight': 'Eye_Squint_R',
    'eyeWideLeft': 'Eye_Wide_L',
    'eyeWideRight': 'Eye_Wide_R',
    'jawForward': 'Jaw_Forward',
    'jawLeft': 'Jaw_L',
    'jawOpen': 'Jaw_Open',
    'jawRight': 'Jaw_R',
    'mouthClose': 'Mouth_Close',
    'mouthDimpleLeft': 'Mouth_Dimple_L',
    'mouthDimpleRight': 'Mouth_Dimple_R',
    'mouthFrownLeft': 'Mouth_Frown_L',
    'mouthFrownRight': 'Mouth_Frown_R',
    'mouthFunnel': ['Mouth_Funnel_Up_L', 'Mouth_Funnel_Up_R'],
    'mouthLeft': 'Mouth_L',
    'mouthLowerDownLeft': 'Mouth_Down_Lower_L',
    'mouthLowerDownRight': 'Mouth_Down_Lower_R',
    'mouthPressLeft': 'Mouth_Press_L',
    'mouthPressRight': 'Mouth_Press_R',
    'mouthPucker': ['Mouth_Pucker_Up_L', 'Mouth_Pucker_Up_R', 'Mouth_Pucker_Down_R', 'Mouth_Pucker_Down_L'],
    'mouthRight': 'Mouth_R',
    'mouthRollLower': ['Mouth_Roll_In_Lower_L', 'Mouth_Roll_In_Lower_R'],
    'mouthRollUpper': ['Mouth_Roll_In_Upper_L', 'Mouth_Roll_In_Upper_R'],
    'mouthShrugLower': 'Mouth_Shrug_Lower',
    'mouthShrugUpper': 'Mouth_Shrug_Upper',
    'mouthSmileLeft': 'Mouth_Smile_L',
    'mouthSmileRight': 'Mouth_Smile_R',
    'mouthStretchLeft': 'Mouth_Stretch_L',
    'mouthStretchRight': 'Mouth_Stretch_R',
    'mouthUpperUpLeft': 'Mouth_Up_Upper_L',
    'mouthUpperUpRight': 'Mouth_Up_Upper_R',
    'noseSneerLeft': 'Nose_Sneer_L',
    'noseSneerRight': 'Nose_Sneer_R',
    'tongueOut': 'Tongue_Out',
};

// Set up the Three.js scene and attach it to html element with id '3dscene'
var container = document.getElementById('3dscene')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// Set up the Three.js camera
const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 100);
const scene = new THREE.Scene();
scene.scale.x = - 1;
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.background = new THREE.Color(0x666666);
scene.environment = pmremGenerator.fromScene(environment).texture;
const controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.AmbientLight());
scene.add(new THREE.DirectionalLight());
const transform = new THREE.Object3D();


// Load the 3D model and find the face, eyes and teeth meshes
let mesh: THREE.Object3D, face: THREE.Mesh, eyeL, eyeR, teeth;
const eyeRotationLimitHorizontal = THREE.MathUtils.degToRad(30);
const eyeRotationLimitVertical = THREE.MathUtils.degToRad(30);
new GLTFLoader()
    .load('models/head.glb', (gltf) => {
        mesh = gltf.scene.children[0];
        scene.add(mesh);
        mesh.scale.setScalar(15);
        face = mesh.getObjectByName('head_geo002') as THREE.Mesh;
        //eyeL = mesh.getObjectByName( 'eyeLeft' );
        //eyeR = mesh.getObjectByName( 'eyeRight' );
        //teeth = mesh.getObjectByName( 'mesh_3' );
        //const gui = new GUI();
        //gui.close();
        //const influences = face.morphTargetInfluences ?? [];
        //for (const [key, value] of Object.entries(face.morphTargetDictionary ?? {})) {
        //    gui.add(influences, value, 0, 1, 0.01)
        //        .name(key.replace('blendShape1.', ''))
        //        .listen(true);
        //}

    });

// Find html elements for displaying the blendshapes
const demosSection = document.getElementById("demos")!;
const column1 = document.getElementById("video-blend-shapes-column1");
let faceLandmarker: FaceLandmarker;
let enableWebcamButton: HTMLElement;
let webcamRunning = false;
const videoWidth = 480;

// Preload assets from CDN
async function preLoadAssets() {
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
    });
    demosSection.classList.remove("invisible");
}
preLoadAssets();

// Find the video element and canvas for rendering the results
const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d")!;

//const videoTexture = new THREE.VideoTexture(video);
//videoTexture.minFilter = THREE.LinearFilter;
//videoTexture.maxFilter = THREE.LinearFilter;
//videoTexture.format = THREE.RGBFormat;
//videoTexture.wrapS = THREE.RepeatWrapping;
//videoTexture.repeat.x = -1;
//videoTexture.colorSpace = THREE.SRGBColorSpace;
////scene.background=videoTexture;

// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user wants to enable it
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton")!;
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection
function enableCam(event: MouseEvent) {
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
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", setWebCam);
    });
}
let lastVideoTime = -1;
let results: FaceLandmarkerResult;
const drawingUtils = new DrawingUtils(canvasCtx);

function setWebCam() {
    const ratio = video.videoHeight / video.videoWidth;
    video.style.width = videoWidth + "px";
    video.style.height = videoWidth * ratio + "px";
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = videoWidth * ratio + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    renderer.domElement.style.width = videoWidth + "px";
    renderer.domElement.style.height = videoWidth * ratio + "px";
    renderer.domElement.width = video.videoWidth;
    renderer.domElement.height = video.videoHeight;
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;

    predictWebcam();
}

// This is called for every frame, it processes the video stream and detects the face landmarks
async function predictWebcam() {

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    let nowInMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = faceLandmarker.detectForVideo(video, nowInMs);
        //console.log(video.srcObject);
    }
    if (results.faceLandmarks) {
        // If we have landmarks, draw them on the user's face
        for (const landmarks of results.faceLandmarks) {
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30", lineWidth: 1 });
        }
    }
    // If we have blendshapes, print them on the screen and draw the 3D scene
    if (results.faceBlendshapes.length > 0) {
        //printBlendShapes(column1, results.faceBlendshapes);
        draw3dScene(results);
    }

    // If the webcam is still enabled, call this function again for the next frame
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }

}

// Print the blendshapes on the screen (the numbers visible next to video and 3D scene)
function printBlendShapes(el: HTMLElement, blendShapes: Category[]) {
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
function draw3dScene(results: FaceLandmarkerResult) {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        //if(videoTexture) {
        //    videoTexture.needsUpdate = true;
        //}

        if (results.faceBlendshapes.length > 0) {
            for (const blendshape of results.faceBlendshapes[0].categories) {
                const index = face.morphTargetDictionary?.[blendshape.categoryName];
                if (index !== undefined) {
                    if (face.morphTargetInfluences !== undefined) {
                        face.morphTargetInfluences[index] = blendshape.score;
                    } else if (blendshape.categoryName !== '_neutral') {
                        console.warn(`Blend shape not defined for ${blendshape.categoryName}`);
                    }
                    else {
                        console.warn(`something is wrong`);
                    }
                }
            }
        }

        if (results.facialTransformationMatrixes.length > 0) {
            const facialTransformationMatrixes = results.facialTransformationMatrixes[0].data;
            transform.matrix.fromArray(facialTransformationMatrixes);
            transform.matrix.decompose(transform.position, transform.quaternion, transform.scale);
            mesh.position.copy(transform.position);
            mesh.rotation.copy(transform.rotation);
        }

        /*
        if ( results.faceBlendshapes.length > 0 ) {
            // Tracks eye movement
            const eyeScore = {
                leftHorizontal: 0,
                rightHorizontal: 0,
                leftVertical: 0,
                rightVertical: 0,
                };
            const eyeBlinkSquingScore = {
                blinkLeft: 0,
                blinkRight: 0,
                squintLeft: 0,
                squintRight: 0,
            };
            for ( const blendshape of faceBlendshapes ) {
                const categoryName = blendshape.categoryName;
                let score = blendshape.score;
                const index = face.morphTargetDictionary[ blendshapesMap[ categoryName ] ];


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
                    case 'eyeBlinkLeft':
                        eyeBlinkSquingScore.blinkLeft += score;
                        break;
                    case 'eyeBlinkRight':
                        eyeBlinkSquingScore.blinkRight += score;
                        break;
                    case 'eyeSquintLeft':
                        eyeBlinkSquingScore.squintLeft += score;
                        break;
                    case 'eyeSquintRight':
                        eyeBlinkSquingScore.squintRight += score;
                        break;
                }
            }

            // Apply the eye movement to the 3D model
            eyeL.rotation.y = -eyeScore.leftHorizontal * eyeRotationLimitHorizontal;
            eyeR.rotation.y = -eyeScore.rightHorizontal * eyeRotationLimitHorizontal;
            eyeL.rotation.x = eyeScore.leftVertical * eyeRotationLimitVertical;
            eyeR.rotation.x = eyeScore.rightVertical * eyeRotationLimitVertical;
        
            let eye43 = (eyeBlinkSquingScore.blinkLeft + eyeBlinkSquingScore.blinkRight) * 0.65;
            // za razliku 0.2 eye43 se smanjuje za 0.3
            // za razliku 0 eye43 se smanjuje 0
            let absdiff=Math.abs(eyeBlinkSquingScore.blinkLeft-eyeBlinkSquingScore.blinkRight);
            eye43-=absdiff*1.5;
            absdiff/=2;
            
            if(eyeBlinkSquingScore.blinkLeft>eyeBlinkSquingScore.blinkRight)
            {
                eyeBlinkSquingScore.blinkLeft+=absdiff;
                eyeBlinkSquingScore.blinkRight-=absdiff;
            }
            else
            {
                eyeBlinkSquingScore.blinkLeft-=absdiff;
                eyeBlinkSquingScore.blinkRight+=absdiff;
            }
            
            face.morphTargetInfluences[face.morphTargetDictionary['AU_46_L']]=eyeBlinkSquingScore.blinkLeft;
            face.morphTargetInfluences[face.morphTargetDictionary['AU_46_R']]=eyeBlinkSquingScore.blinkRight;
            face.morphTargetInfluences[face.morphTargetDictionary['AU_43']]=eye43;
        }
        */
    }
    // Render the 3D scene
    renderer.render(scene, camera);
    controls.update();
}
