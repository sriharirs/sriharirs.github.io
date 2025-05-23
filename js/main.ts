import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
  FaceLandmarkerResult,
  Category,
} from "@mediapipe/tasks-vision";

type ActionUnitDescript = { descript: string; blendShapes: string[] };
const actionUnitsMap: Record<string, ActionUnitDescript> = {
  ["AU 1"]: {
    descript: "Inner Brow Raiser",
    blendShapes: ["browInnerUp"],
  },
  ["AU 2"]: {
    descript: "Outer Brow Raiser",
    blendShapes: ["browOuterUpLeft", "browOuterUpRight"],
  },
  ["AU 4"]: {
    descript: "Brow Lowerer",
    blendShapes: ["browDownLeft", "browDownRight"],
  },
  ["AU 5"]: {
    descript: "Upper Lid Raiser",
    blendShapes: ["eyeWideLeft", "eyeWideRight"],
  },
  ["AU 6"]: {
    descript: "Cheek Raiser",
    blendShapes: ["cheekSquintLeft", "cheekSquintRight"],
  },
  ["AU 7"]: {
    descript: "Lid Tightener",
    blendShapes: ["eyeBlinkLeft", "eyeBlinkRight"],
  },
  ["AU 9"]: {
    descript: "Nose Wrinkler",
    blendShapes: ["noseSneerLeft", "noseSneerRight"],
  },
  ["AU 12"]: {
    descript: "Lip Corner Puller",
    blendShapes: ["mouthSmileLeft", "mouthSmileRight"],
  },
  ["AU 14"]: {
    descript: "Dimpler",
    blendShapes: ["mouthDimpleLeft", "mouthDimpleRight"],
  },
  ["AU 15"]: {
    descript: "Lip Corner Depressor",
    blendShapes: ["mouthFrownLeft", "mouthFrownRight"],
  },
  ["AU 17"]: {
    descript: "Chin Raiser",
    blendShapes: [
      "mouthLowerDownRight",
      "mouthLowerDownRight",
      "jawForward",
      "jawOpen",
    ],
  },
  ["AU 20"]: {
    descript: "Lip Stretcher",
    blendShapes: ["mouthStretchLeft", "mouthStretchRight"],
  },
  ["AU 23"]: {
    descript: "Lip Tightener",
    blendShapes: ["mouthPressLeft", "mouthPressRight"],
  },
  ["AU 26"]: {
    descript: "Jaw Drop",
    blendShapes: ["jawOpen"],
  },
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
let faceArray: THREE.Mesh[] = [];
let eyes: THREE.Mesh;
let faceLandmarker: FaceLandmarker;

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
  eyes = mesh.getObjectByName("Right_Eyeball_Mesh001") as THREE.Mesh;
  glass = mesh.getObjectByName("sunglasses003")!;
  glass.visible = false;

  for (const actionUnit in actionUnitsMap) {
    let option = new Option(
      `${actionUnit} (${actionUnitsMap[actionUnit].descript})`,
      actionUnit,
    );
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
    const value = actionUnitsMap[selectedAction].blendShapes.includes(
      blendshape.categoryName,
    )
      ? Math.min(1, amplificationValue * blendshape.score)
      : blendshape.score;

    if (blendshape.categoryName.startsWith("eye")) {
      const index = eyes.morphTargetDictionary![blendshape.categoryName];
      eyes.morphTargetInfluences![index] = value;
    }
    for (const face of faceArray) {
      const index = face.morphTargetDictionary![blendshape.categoryName];
      face.morphTargetInfluences![index] = value;
    }
  }

  if (results.facialTransformationMatrixes.length > 0) {
    mesh.matrix.copy(
      new THREE.Matrix4()
        .fromArray(results.facialTransformationMatrixes[0].data)
        .scale(new THREE.Vector3(7.5, 7.5, 7.5)),
    );
  }

  renderer.render(scene, camera);
  controls.update();
}

// ───── UTILITY: Display blend shapes ─────
function printBlendShapes(blendShapes: Category[]) {
  var totalActionUnits = "";
  for (var actionUnit in actionUnitsMap) {
    let currentActionUnits = `
        <ul class="au-item">
            <span>${actionUnit}</span>`;
    for (var shape of blendShapes) {
      if (actionUnitsMap[actionUnit].blendShapes.includes(shape.categoryName)) {
        const value = actionUnitsMap[selectedAction].blendShapes.includes(
          shape.categoryName,
        )
          ? Math.min(1, amplificationValue * shape.score)
          : shape.score;

        currentActionUnits += `
        <li class="blend-shapes-item">
            <span class="blend-shapes-label">${shape.displayName || shape.categoryName}</span>
            <span class="blend-shapes-value" style="width: calc(${shape.score * 100}% - 120px)">
            ${shape.score.toFixed(4)},${value.toFixed(4)}
            </span>
        </li>`;
      }
    }
    currentActionUnits += `</ul><br>`;
    totalActionUnits += currentActionUnits;
  }

  return totalActionUnits;
  // return blendShapes
  //   .map(
  //     (shape) => `
  //       <li class="blend-shapes-item">
  //           <span class="blend-shapes-label">${shape.displayName || shape.categoryName}</span>
  //           <span class="blend-shapes-value" style="width: calc(${shape.score * 100}% - 120px)">${shape.score.toFixed(4)}</span>
  //       </li>`,
  //   )
  //   .join("");
}
