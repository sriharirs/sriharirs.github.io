import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
  FaceLandmarkerResult,
  Category,
} from "@mediapipe/tasks-vision";

// Blendshapes to morph target mapping
const blendshapesMap: Record<string, string[]> = {
  ["browDownLeft"]: ["Brow_Drop_L"],
  ["browDownRight"]: ["Brow_Drop_R"],
  ["browInnerUp"]: ["Brow_Raise_Inner_L", "Brow_Raise_Inner_R"],
  ["browOuterUpLeft"]: ["Brow_Raise_Outer_L"],
  ["browOuterUpRight"]: ["Brow_Raise_Outer_R"],
  ["cheekPuff"]: ["Cheek_Puff_L", "Cheek_Puff_R"],
  ["cheekSquintLeft"]: ["Cheek_Raise_L"],
  ["cheekSquintRight"]: ["Cheek_Raise_R"],
  ["eyeBlinkLeft"]: ["Eye_Blink_L"],
  ["eyeBlinkRight"]: ["Eye_Blink_R"],
  ["eyeLookDownLeft"]: ["Eye_L_Look_Down"],
  ["eyeLookDownRight"]: ["Eye_R_Look_Down"],
  ["eyeLookInLeft"]: ["Eye_L_Look_R"],
  ["eyeLookInRight"]: ["Eye_R_Look_L"],
  ["eyeLookOutLeft"]: ["Eye_L_Look_L"],
  ["eyeLookOutRight"]: ["Eye_R_Look_R"],
  ["eyeLookUpLeft"]: ["Eye_L_Look_Up"],
  ["eyeLookUpRight"]: ["Eye_R_Look_Up"],
  ["eyeSquintLeft"]: ["Eye_Squint_L"],
  ["eyeSquintRight"]: ["Eye_Squint_R"],
  ["eyeWideLeft"]: ["Eye_Wide_L"],
  ["eyeWideRight"]: ["Eye_Wide_R"],
  ["jawForward"]: ["Jaw_Forward"],
  ["jawLeft"]: ["Jaw_L"],
  ["jawOpen"]: ["Jaw_open_close"],
  ["jawRight"]: ["Jaw_R"],
  ["mouthClose"]: ["Mouth_open_close"],
  ["mouthDimpleLeft"]: ["Mouth_Dimple_L"],
  ["mouthDimpleRight"]: ["Mouth_Dimple_R"],
  ["mouthFrownLeft"]: ["Mouth_Frown_L"],
  ["mouthFrownRight"]: ["Mouth_Frown_R"],
  ["mouthFunnel"]: ["Mouth_Funnel_Up_L", "Mouth_Funnel_Up_R"],
  ["mouthLeft"]: ["Mouth_L"],
  ["mouthLowerDownLeft"]: ["Mouth_Down_Lower_L"],
  ["mouthLowerDownRight"]: ["Mouth_Down_Lower_R"],
  ["mouthPressLeft"]: ["Mouth_Press_L"],
  ["mouthPressRight"]: ["Mouth_Press_R"],
  ["mouthPucker"]: [
    "Mouth_Pucker_Up_L",
    "Mouth_Pucker_Up_R",
    "Mouth_Pucker_Down_R",
    "Mouth_Pucker_Down_L",
  ],
  ["mouthRight"]: ["Mouth_R"],
  ["mouthRollLower"]: ["Mouth_Roll_In_Lower_L", "Mouth_Roll_In_Lower_R"],
  ["mouthRollUpper"]: ["Mouth_Roll_In_Upper_L", "Mouth_Roll_In_Upper_R"],
  ["mouthShrugLower"]: ["Mouth_Shrug_Lower"],
  ["mouthShrugUpper"]: ["Mouth_Shrug_Upper"],
  ["mouthSmileLeft"]: ["Mouth_Smile_L"],
  ["mouthSmileRight"]: ["Mouth_Smile_R"],
  ["mouthStretchLeft"]: ["Mouth_Stretch_L"],
  ["mouthStretchRight"]: ["Mouth_Stretch_R"],
  ["mouthUpperUpLeft"]: ["Mouth_Up_Upper_L"],
  ["mouthUpperUpRight"]: ["Mouth_Up_Upper_R"],
  ["noseSneerLeft"]: ["Nose_Sneer_L"],
  ["noseSneerRight"]: ["Nose_Sneer_R"],
  ["tongueOut"]: ["Tongue_Out"],
};

const actionUnitsMap: Record<string, string[]> = {
  ["brow"]: [
    "browDownLeft",
    "browDownRight",
    "browInnerUp",
    "browOuterUpLeft",
    "browOuterUpRight",
  ],
  ["cheek"]: ["cheekPuff", "cheekSquintLeft", "cheekSquintRight"],
  ["jaw"]: ["jawForward", "jawLeft", "jawOpen", "jawRight"],
  ["mouthClose"]: ["mouthClose"],
  ["mouthSmile"]: ["mouthSmileLeft", "mouthSmileRight"],
  ["mouthFrown"]: ["mouthFrownLeft", "mouthFrownRight"],
  ["mouthStretch"]: ["mouthStretchLeft", "mouthStretchRight"],
  ["mouthPucker"]: ["mouthPucker"],
  ["mouthFunnel"]: ["mouthFunnel"],
  ["mouthShrug"]: ["mouthShrugLower", "mouthShrugUpper"],
  ["mouthDimple"]: ["mouthDimpleLeft", "mouthDimpleRight"],
  ["mouthRoll"]: ["mouthRollLower", "mouthRollUpper"],
  ["mouthPress"]: ["mouthPressLeft", "mouthPressRight"],
  ["mouthLowerDown"]: ["mouthLowerDownLeft", "mouthLowerDownRight"],
  ["mouthUpperUp"]: ["mouthUpperUpLeft", "mouthUpperUpRight"],
  ["mouthDirection"]: ["mouthLeft", "mouthRight"],
};

// ───── THREE.JS SCENE SETUP ─────
const container = document.getElementById("3dscene")!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.01,
  100,
);
const scene = new THREE.Scene();
scene.scale.x = -1;

const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(environment).texture;

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(camera.position.clone().setZ(camera.position.z - 5));
controls.update();

scene.add(new THREE.AmbientLight());
scene.add(new THREE.DirectionalLight());

window.addEventListener("resize", () => {
  const ratio = video.videoHeight / video.videoWidth;
  renderer.setSize(videoWidth, videoWidth * ratio);
  camera.aspect =
    renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  camera.updateProjectionMatrix();
});

// ───── UI & EVENT SETUP ─────
const fileInput = document.getElementById("imageUpload") as HTMLInputElement;
const selectBackground = document.getElementById(
  "background",
) as HTMLSelectElement;
const backgroundColor = new THREE.Color(0x666666);

selectBackground.onchange = () => {
  fileInput.style.visibility = "hidden";
  switch (selectBackground.selectedIndex) {
    case 0:
      scene.background = videoTexture;
      break;
    case 1:
      scene.background = backgroundColor;
      break;
    case 2:
      fileInput.style.visibility = "visible";
      break;
  }
};

const reader = new FileReader();
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  reader.onload = () => {
    new THREE.TextureLoader().load(reader.result as string, (texture) => {
      scene.background = texture;
    });
  };
});

let amplificationValue = 1;
const range = document.getElementById("amplification") as HTMLInputElement;
range.oninput = () => {
  amplificationValue = parseFloat(range.value);
  if (Number.isNaN(amplificationValue) || amplificationValue <= 0) {
    amplificationValue = 1;
  }
  range.value = amplificationValue.toString();
};

const actionUnitsSelect = document.getElementById(
  "actionUnits",
) as HTMLSelectElement;
let selectedAction = "";
actionUnitsSelect.onchange = () => (selectedAction = actionUnitsSelect.value);

const demosSection = document.getElementById("demos")!;
const enableGlass = document.getElementById("glassButton")!;

// ───── ASSETS AND MODEL LOADING ─────
let mesh: THREE.Object3D, glass: THREE.Object3D;
let faceArray: THREE.Mesh[] = [],
  faceLandmarker: FaceLandmarker;

async function preLoadAssets() {
  const faceLandmarkerResult = FaceLandmarker.createFromOptions(
    await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
    ),
    {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    },
  );

  let gltf;
  [gltf, faceLandmarker] = await Promise.all([
    new GLTFLoader().loadAsync("models/head.glb"),
    faceLandmarkerResult,
  ]);
  mesh = gltf.scene.children[0];
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);

  faceArray = [
    mesh.getObjectByName("0000_mean_face001") as THREE.Mesh,
    mesh.getObjectByName("0000_mean_face001_1") as THREE.Mesh,
  ];
  glass = mesh.getObjectByName("sunglasses003")!;
  glass.visible = false;

  const gui = new GUI({ width: 500 });
  gui.close();

  const influences = faceArray[0].morphTargetInfluences!;
  for (let [key, index] of Object.entries(
    faceArray[0].morphTargetDictionary!,
  )) {
    gui
      .add(influences, index, 0, 1, 0.01)
      .name(key.replace("blendShape1.", ""))
      .listen(true);
  }

  for (const key of Object.keys(actionUnitsMap)) {
    let option = new Option(key, key);
    actionUnitsSelect.add(option);
  }

  selectedAction = actionUnitsSelect.selectedOptions[0].value;
  demosSection.classList.remove("invisible");
}

enableGlass.addEventListener("click", () => {
  glass.visible = !glass.visible;
  enableGlass.innerText = `${glass.visible ? "DISABLE" : "ENABLE"} GLASSES`;
});

preLoadAssets();

// ───── WEBCAM SETUP & DETECTION ─────
const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById(
  "output_canvas",
) as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d")!;
const videoTexture = new THREE.VideoTexture(video);
videoTexture.format = THREE.RGBFormat;
videoTexture.wrapS = THREE.RepeatWrapping;
videoTexture.repeat.x = -1;
videoTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = videoTexture;

const enableWebcamButton = document.getElementById("webcamButton")!;
let webcamRunning = false;
if (navigator.mediaDevices) {
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  alert("getUserMedia() is not supported by your browser");
}

function enableCam() {
  if (!faceLandmarker)
    return console.log("Wait! faceLandmarker not loaded yet.");

  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning
    ? "DISABLE PREDICTIONS"
    : "ENABLE PREDICTIONS";

  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", setWebCam);
  });
}

const videoWidth = 480;
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
  camera.aspect =
    renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  camera.updateProjectionMatrix();

  predictWebcam();
}

const column1 = document.getElementById("video-blend-shapes-column1")!;
let lastVideoTime = -1;
let results: FaceLandmarkerResult;
const drawingUtils = new DrawingUtils(canvasCtx);

async function predictWebcam() {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const nowInMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, nowInMs);
  }

  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      // draw connectors
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030", lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30", lineWidth: 1 },
      );
    }
  }

  if (results.faceBlendshapes.length > 0) {
    column1.innerHTML = printBlendShapes(results.faceBlendshapes[0].categories);
    draw3dScene(results);
  }

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  } else {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }
}

// ───── RENDERING ─────
function draw3dScene(results: FaceLandmarkerResult) {
  if (
    video.readyState < HTMLMediaElement.HAVE_METADATA ||
    results.faceBlendshapes.length === 0
  ) {
    return;
  }

  for (const blendshape of results.faceBlendshapes[0].categories) {
    const value = actionUnitsMap[selectedAction].includes(
      blendshape.categoryName,
    )
      ? Math.min(1, amplificationValue * blendshape.score)
      : blendshape.score;

    for (const face of faceArray) {
      const index = face.morphTargetDictionary![blendshape.categoryName];
      console.log(`index of ${blendshape.categoryName} is ${index}`);
      face.morphTargetInfluences![index] = value;
    }
  }

  if (results.facialTransformationMatrixes.length > 0) {
    mesh.matrix.copy(
      new THREE.Matrix4()
        .fromArray(results.facialTransformationMatrixes[0].data)
        .scale(new THREE.Vector3(7, 7, 7)),
    );
  }

  renderer.render(scene, camera);
  controls.update();
}

// ───── UTILITY: Display blend shapes ─────
function printBlendShapes(blendShapes: Category[]) {
  return blendShapes
    .map(
      (shape) => `
        <li class="blend-shapes-item">
            <span class="blend-shapes-label">${shape.displayName || shape.categoryName}</span>
            <span class="blend-shapes-value" style="width: calc(${shape.score * 100}% - 120px)">${shape.score.toFixed(4)}</span>
        </li>`,
    )
    .join("");
}
