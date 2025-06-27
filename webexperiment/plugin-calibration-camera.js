var jsPsychCalibration = (function (jspsych) {
  "use strict";

  const info = {
    name: "calibration-camera",
    parameters: {
      /** HTML to render below the video */
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        default: null,
      },
      /** Label to show on continue button */
      button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Continue",
      },
      /** Whether to flip the camera */
      flip_camera: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
    },
  };
  /**
   * **mirror-camera**
   *
   * jsPsych plugin for showing a live stream from a camera
   *
   * @author Abdul
   * 
   */
  class CalibrationCameraPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {
      this.stream = this.jsPsych.pluginAPI.getCameraStream();
      display_element.innerHTML = `
      <style>
      .content {
        position: relative;
        width: 500px;
        margin: 0 auto;
        
      }
      .content video {
        margin: 0 auto;
        width: 500px;
        display: block;
      }
      .content:after {
        content: '';
        position: absolute;
        border: 5px solid green;
        border-radius: 50%;
        width:35%;
        height:65%;
        top: 50px;
        right: 50px;
        bottom: 0;
        left: 160px;
      }
      .jspsych-mirror-camera-prompt{
        vertical-align:bottom;
      }
      </style> 
      
      <div class="content">
      
      
      <video autoplay playsinline id="jspsych-mirror-camera-video" width="auto" height="auto" ${trial.flip_camera ? 'style="transform: rotateY(180deg);"' : ""}></video>
        </div>

      ${trial.prompt ? `<div id="jspsych-mirror-camera-prompt">${trial.prompt}</div>` : ""}
      <p><button class="jspsych-btn" id="btn-continue">${trial.button_label}</button></p>`;
      display_element.querySelector("#jspsych-mirror-camera-video").srcObject =
        this.stream;
     
      display_element
        .querySelector("#btn-continue")
        .addEventListener("click", () => {
          this.finish(display_element);
        });
      this.start_time = performance.now();
    }
   
    finish(display_element) {
      display_element.innerHTML = "";
      this.jsPsych.finishTrial({
        rt: performance.now() - this.start_time,
      });
    }
  }
  CalibrationCameraPlugin.info = info;

  return CalibrationCameraPlugin;
})(jsPsychModule);
