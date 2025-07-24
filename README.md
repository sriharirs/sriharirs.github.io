<<<<<<< HEAD
# MediaPipe & Three.js Virutal Mirror
## Files
The project consists of several important files:
- *index.html*
- *main.js*
- *task-vision.js*
### index.html
Shows the structure of the web page, parts of it are:
- stream shown by camera which renders mesh tracking facial features
- facial features metrics
- head model which mimics facial features that are read by camera
### main.js
This file holds the entire logic behind the program. It detects facial movements and maps the relevant movements to the head model which will be shown on the page.
- Firstly the script sets up the Three.js scene and attaches it to the html element with the id of '3dscene'.
- After that, Three.js camera is being set up.
- After the camera is set up, the scrpit loads the 3D model from the camera, finds a face, eyes and teeth meshes and displays the blendshapes in the according html sections.
- Using a CDN, assets are preloaded.
- Next part finds the video element and canvas. and checks if the webcam access is supported. If it is supported, an event listener is added for a button which enables the camera.
- enableCam function enables the live webcam and starts facial feature detecion
- predictWebcam function is called for every frame, and it processes the video stream and detects the landmarks.
- printBlendShapes function is used to print the blendShape metrics, which displays the intensity of each feature.
- draw3dScene is used to draw the face landmarks and blendshapes, all landmarks mapped accordingly.
- In the end, the scene is rendered.

The best way to follow this documentation is by reading it with the code open, since the code is well commented and self explainatory.

### task-vision.js
This file is imported from **mediapipe** library, and is used for detecting facial features. It should not be changed or even looked at, since it is a part of the library.
### How to run
Run a simple http server, it can be done through Visual Studio Code. It will open a certain port, and you can access the page via localhost. This program requires a camera, and will ask the user for camera access.
## How to add more action units
Action units are a part of *main.js* file. Format of each action unit is AU_*number*. They need to be read from metrics shown on a display, and in certain section should be mapped like this:

'blendshape' : 'AU_number'

Adding new action units would require updating the *head.gltf* file. The easiest way to change it is by using either [Three.js editor]("https://threejs.org/editor/") or [Gltf editor]("https://www.gltfeditor.com"). The list of blendshapes is:
- "_neutral",
- "browDownLeft",
- "browDownRight",
- "browInnerUp",
- "browOuterUpLeft",
- "browOuterUpRight",
- "cheekPuff",
- "cheekSquintLeft",
- "cheekSquintRight",
- "eyeBlinkLeft",
- "eyeBlinkRight",
- "eyeLookDownLeft",
- "eyeLookDownRight",
- "eyeLookInLeft",
- "eyeLookInRight",
- "eyeLookOutLeft",
- "eyeLookOutRight",
- "eyeLookUpLeft",
- "eyeLookUpRight",
- "eyeSquintLeft",
- "eyeSquintRight",
- "eyeWideLeft",
- "eyeWideRight",
- "jawForward",
- "jawLeft",
- "jawOpen",
- "jawRight",
- "mouthClose",
- "mouthDimpleLeft",
- "mouthDimpleRight",
- "mouthFrownLeft",
- "mouthFrownRight",
- "mouthFunnel",
- "mouthLeft",
- "mouthLowerDownLeft",
- "mouthLowerDownRight",
- "mouthPressLeft",
- "mouthPressRight",
- "mouthPucker",
- "mouthRight",
- "mouthRollLower",
- "mouthRollUpper",
- "mouthShrugLower",
- "mouthShrugUpper",
- "mouthSmileLeft",
- "mouthSmileRight",
- "mouthStretchLeft",
- "mouthStretchRight",
- "mouthUpperUpLeft",
- "mouthUpperUpRight",
- "noseSneerLeft",
- "noseSneerRight"
=======
# updatedccsrexp
Updated CCSR experiment
>>>>>>> ad6dfa6f061ec413b1e4f1c73e6317cd41570062
