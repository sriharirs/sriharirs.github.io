import { FaceLandmarker, FilesetResolver, DrawingUtils, FaceLandmarkerResult, Category } from "@mediapipe/tasks-vision";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Map blendshapes from MediaPipe to AU (Action Units) present in the 3D model
const blendshapesMap: Record<string, string[]> = {
    'browDownLeft': ['Brow_Drop_L'],
    'browDownRight': ['Brow_Drop_R'],
    'browInnerUp': ['Brow_Raise_Inner_L', 'Brow_Raise_Inner_R'],
    'browOuterUpLeft': ['Brow_Raise_Outer_L'],
    'browOuterUpRight': ['Brow_Raise_Outer_R'],
    'cheekPuff': ['Cheek_Puff_L', 'Cheek_Puff_R'],
    'cheekSquintLeft': ['Cheek_Raise_L'],
    'cheekSquintRight': ['Cheek_Raise_R'],
    'eyeBlinkLeft': ['Eye_Blink_L'],
    'eyeBlinkRight': ['Eye_Blink_R'],
    'eyeLookDownLeft': ['Eye_L_Look_Down'],
    'eyeLookDownRight': ['Eye_R_Look_Down'],
    'eyeLookInLeft': ['Eye_L_Look_R'],
    'eyeLookInRight': ['Eye_R_Look_L'],
    'eyeLookOutLeft': ['Eye_L_Look_L'],
    'eyeLookOutRight': ['Eye_R_Look_R'],
    'eyeLookUpLeft': ['Eye_L_Look_Up'],
    'eyeLookUpRight': ['Eye_R_Look_Up'],
    'eyeSquintLeft': ['Eye_Squint_L'],
    'eyeSquintRight': ['Eye_Squint_R'],
    'eyeWideLeft': ['Eye_Wide_L'],
    'eyeWideRight': ['Eye_Wide_R'],
    'jawForward': ['Jaw_Forward'],
    'jawLeft': ['Jaw_L'],
    'jawOpen': ['Jaw_open_close'],
    'jawRight': ['Jaw_R'],
    'mouthClose': ['Mouth_open_close'],
    'mouthDimpleLeft': ['Mouth_Dimple_L'],
    'mouthDimpleRight': ['Mouth_Dimple_R'],
    'mouthFrownLeft': ['Mouth_Frown_L'],
    'mouthFrownRight': ['Mouth_Frown_R'],
    'mouthFunnel': ['Mouth_Funnel_Up_L', 'Mouth_Funnel_Up_R'],
    'mouthLeft': ['Mouth_L'],
    'mouthLowerDownLeft': ['Mouth_Down_Lower_L'],
    'mouthLowerDownRight': ['Mouth_Down_Lower_R'],
    'mouthPressLeft': ['Mouth_Press_L'],
    'mouthPressRight': ['Mouth_Press_R'],
    'mouthPucker': ['Mouth_Pucker_Up_L', 'Mouth_Pucker_Up_R', 'Mouth_Pucker_Down_R', 'Mouth_Pucker_Down_L'],
    'mouthRight': ['Mouth_R'],
    'mouthRollLower': ['Mouth_Roll_In_Lower_L', 'Mouth_Roll_In_Lower_R'],
    'mouthRollUpper': ['Mouth_Roll_In_Upper_L', 'Mouth_Roll_In_Upper_R'],
    'mouthShrugLower': ['Mouth_Shrug_Lower'],
    'mouthShrugUpper': ['Mouth_Shrug_Upper'],
    'mouthSmileLeft': ['Mouth_Smile_L'],
    'mouthSmileRight': ['Mouth_Smile_R'],
    'mouthStretchLeft': ['Mouth_Stretch_L'],
    'mouthStretchRight': ['Mouth_Stretch_R'],
    'mouthUpperUpLeft': ['Mouth_Up_Upper_L'],
    'mouthUpperUpRight': ['Mouth_Up_Upper_R'],
    'noseSneerLeft': ['Nose_Sneer_L'],
    'noseSneerRight': ['Nose_Sneer_R'],
    'tongueOut': ['Tongue_Out'],
};

// Set up the Three.js scene and attach it to html element with id '3dscene'
var container = document.getElementById('3dscene')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
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
let orbitTarget = camera.position.clone();
orbitTarget.z -= 5;
controls.target = orbitTarget;
controls.update();
scene.add(new THREE.AmbientLight());
scene.add(new THREE.DirectionalLight());

let mesh: THREE.Object3D, faceArray: THREE.Mesh[] = new Array();
let glass: THREE.Object3D;

const demosSection = document.getElementById("demos")!;
const column1 = document.getElementById("video-blend-shapes-column1")!;
let faceLandmarker: FaceLandmarker;
let enableWebcamButton = document.getElementById("webcamButton")!;
let enableGlass = document.getElementById("glassButton")!;
enableGlass.addEventListener("click", () => {
    glass.visible = !glass.visible;
});
let webcamRunning = false;
const videoWidth = 480;

// Preload assets from CDN
async function preLoadAssets() {
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
    let faceLandmarkerResult = FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
    });

    let modelPromise = new GLTFLoader().loadAsync('models/head.glb');
    let result = await Promise.all([modelPromise, faceLandmarkerResult]);
    faceLandmarker = result[1];
    let gltf = result[0];
    mesh = gltf.scene.children[0];
    scene.add(mesh);
    mesh.matrixAutoUpdate = false;
    faceArray[0] = mesh.getObjectByName('CC_Base_Body001_1') as THREE.Mesh;
    faceArray[1] = mesh.getObjectByName('CC_Base_Body001_2') as THREE.Mesh;
    glass = mesh.getObjectByName('glass')!;
    glass.visible = false;
    const gui = new GUI({ width: 500 });
    gui.close();
    const influences = faceArray[0].morphTargetInfluences!;
    for (let [key, value] of Object.entries(faceArray[0].morphTargetDictionary!)) {
        gui.add(influences, value, 0, 1, 0.01)
            .name(key.replace('blendShape1.', ''))
            .listen(true)
            .onChange((userValue) => {
                faceArray[0].morphTargetDictionary![key] = userValue;
            });
    }

    demosSection.classList.remove("invisible");
}
preLoadAssets();

// Find the video element and canvas for rendering the results
const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d")!;

// If webcam supported, add event listener to button for when user wants to enable it
if (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    alert("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection
function enableCam() {
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
    renderer.setSize(videoWidth, videoWidth * ratio);
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();

    predictWebcam();
}

window.addEventListener("resize", onWindowResize);

function onWindowResize() {
    const ratio = video.videoHeight / video.videoWidth;
    renderer.setSize(videoWidth, videoWidth * ratio);
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
}
// This is called for every frame, it processes the video stream and detects the face landmarks
async function predictWebcam() {

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    let nowInMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = faceLandmarker.detectForVideo(video, nowInMs);
    }
    if (results.faceLandmarks) {
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

    if (results.faceBlendshapes.length > 0) {
        printBlendShapes(column1, results.faceBlendshapes[0].categories);
        draw3dScene(results);
    }

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Draw the 3D scene with the face landmarks and blendshapes
function draw3dScene(results: FaceLandmarkerResult) {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {

        if (results.faceBlendshapes.length > 0) {
            for (const face of faceArray) {
                for (const blendshape of results.faceBlendshapes[0].categories) {
                    const actionUnitsArray = blendshapesMap[blendshape.categoryName];
                    actionUnitsArray?.forEach(actionUnits => {
                        face.morphTargetInfluences![face.morphTargetDictionary![actionUnits]] = blendshape.score;
                    });
                }
            }
        }

        if (results.facialTransformationMatrixes.length > 0) {
            let matrix = new THREE.Matrix4().fromArray(results.facialTransformationMatrixes[0].data);
            matrix.scale(new THREE.Vector3(5, 5, 5));
            // Set new position and rotation from matrix
            mesh.matrix.copy(matrix);
        }
    }
    // Render the 3D scene
    renderer.render(scene, camera);
    controls.update();
}

// Print the blendshapes on the screen (the numbers visible next to video and 3D scene)
function printBlendShapes(el: HTMLElement, blendShapes: Category[]) {

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
