////////////////////////////////////////////////////
////////////////////////////////////////////////////
//// UTILITIES
////////////////////////////////////////////////////
////////////////////////////////////////////////////

//https://www.geeksforgeeks.org/how-to-shuffle-an-array-using-javascript/
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    // Generate random number
    var j = Math.floor(Math.random() * (i + 1));

    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}

function prepare_html(slides_names, replacements) {
  // Load the html files and replace placeholders
  let slides_content = {};
  Object.keys(slides_names).forEach((key) => {
    const req = new XMLHttpRequest();
    req.open("GET", slides_names[key], false);
    req.send();
    text = req.response;

    Object.keys(replacements).forEach((key) => {
      text =
        '<div class="canvas">' +
        text.replaceAll("$" + key + "$", replacements[key]) +
        "</div>";
    });
    slides_content[key] = text;
  });
  return slides_content;
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
//// PRACTICE test
////////////////////////////////////////////////////
////////////////////////////////////////////////////
function practiceFeedBack() {
  var comboPracticeTrial = {
    timeline: [
      {
        type: jsPsychMootPlugin,
        moot_parameters: {
          doggelgaenger_col: condition.doppelgaenger_color_white
            ? "1,1,1"
            : "0,0,0",
          doggelgaenger_loc: condition.doppelgaenger_up
            ? "20,0,-10"
            : "-20,0,-10",
          doppelgaenger_target: condition.targetpattern_squares ? "SQ" : "TR",
          go_notarget_left: jsPsych.timelineVariable('go_notarget_left'),
          nogo_type1_notarget_left: jsPsych.timelineVariable('nogo_type1_notarget_left'),
          go_target_left: jsPsych.timelineVariable("go_target_left"),
          nogo_type1_notarget_right: jsPsych.timelineVariable("nogo_type1_notarget_right"),
          go_notarget_right: jsPsych.timelineVariable("go_notarget_right"),
          nogo_type2_notarget_left: jsPsych.timelineVariable('nogo_type2_notarget_left'),
          go_target_right: jsPsych.timelineVariable("go_target_right"),
          nogo_type2_notarget_right: jsPsych.timelineVariable('nogo_type2_notarget_right'),
          go_target_right: jsPsych.timelineVariable("go_target_right"),
          nogo_type1_target_left: jsPsych.timelineVariable("nogo_type1_target_left"),
          go_notarget_right: jsPsych.timelineVariable("go_notarget_right"),
          nogo_type1_target_right: jsPsych.timelineVariable("nogo_type1_target_right"),
          go_target_left: jsPsych.timelineVariable("go_target_left"),
          nogo_type2_target_left: jsPsych.timelineVariable('nogo_type2_target_left'),
          go_notarget_left: jsPsych.timelineVariable('go_notarget_left'),
          nogo_type2_target_right: jsPsych.timelineVariable('nogo_type2_target_right'),
          doppelgaenger_anim_rec:experiment_config.record_doppelgaenger_animation,
          other_anim_rec: experiment_config.record_other_animation,
        },
        extensions: [
          { type: jsPsychUnityExtension },
          {
            type: jsPsychExtensionMediapipeFacemesh,
            params: {
              record: false,
            },
          },
        ],
      },
      {
        type: jsPsychHtmlSliderResponse,
        stimulus:
          "<p>What should you have done in response to the last video?</p>",
        step: 33,
        labels:  [
          "Turn my head left",
          "Turn my head right",
          "Do nothing",
          "Press the space bar",
        ],
      
        //prompt: "<p>Press right arrow key to move forward</p>",
        on_finish: function (data) {
          if (data.response == jsPsych.timelineVariable("correctAnswer")) {
            data.correct = 1;
          } else {
            data.correct = 0;
          }
        },
      },
      {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function () {
          var last_trial_correct = jsPsych.data
            .get()
            .last(1)
            .values()[0].correct;
          if (last_trial_correct) {
            return "<p>Correct</p>"; // the parameter value has to be returned from the function
          } else {
            return "<p>Wrong</p>"; // the parameter value has to be returned from the function
          }
        },
        trial_duration: 1000,
      },
    ],
    timeline_variables: [
      { go_notarget_left: 1, correctAnswer: 66 },
      { nogo_type1_notarget_left: 1, correctAnswer: 99 },
      { go_target_left: 1, correctAnswer: 0 },
      { nogo_type1_notarget_right: 1, correctAnswer: 99 },
      { go_notarget_right: 1, correctAnswer: 66 },
      { nogo_type2_notarget_left: 1, correctAnswer: 99 },
      { go_target_right: 1, correctAnswer: 33 },
      { nogo_type2_notarget_right: 1, correctAnswer: 99 },
      { go_target_right: 1, correctAnswer: 33 },
      { nogo_type1_target_left: 1, correctAnswer: 99 },
      { go_notarget_right: 1, correctAnswer: 66 },
      { nogo_type1_target_right: 1, correctAnswer: 99 },
      { go_target_left: 1, correctAnswer: 0 },
      { nogo_type2_target_left: 1, correctAnswer: 99 },
      { go_notarget_left: 1, correctAnswer: 66 },
      { nogo_type2_target_right: 1, correctAnswer: 99 },
    ],
  };

  var comulativeResponsePercentage = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
      var trial_correct = jsPsych.data.get().filter({ correct: 1 }).count();
      console.log("trial correct",trial_correct)
      if ((trial_correct / 16) * 100 >= 85) {
        return "<p>You have passed the test</p>"; // the parameter value has to be returned from the function
        jsPsych.data.addProperties({ subject: 1, condition: "control" });
      }
      if ((trial_correct / 16) * 100 < 85) {
        return "<p>You have failed the test and it will be repeated again</p>"; // the parameter value has to be returned from the function
      }
    },
    choices: ["ArrowRight"],
    prompt: '<img alt="" src="images/right_arrow.png" width="75" height="50"/>',
    on_finish: function (data) {
      var last_trial_correct = jsPsych.data
        .get()
        .filter({ correct: 1 })
        .count();
    },
  };

  var secondFeedback = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
      var trial_correct = jsPsych.data
        .get()
        .last(48)
        .filter({ correct: 1 })
        .count();
      if ((trial_correct / 16) * 100 < 85) {
        return "<p>You have failed the test and it will not be repeated again. You will have the chance to review instructions again</p>"; // the parameter value has to be returned from the function
      }
      if ((trial_correct / 16) * 100 >= 85) {
        return "<p>You have passed the test</p>"; // the parameter value has to be returned from the function
      }
    },
    //trial_duration: 1000,
    choices: ["ArrowRight"],
    prompt: '<img alt="" src="images/right_arrow.png" width="75" height="50"/>',
    on_finish: function (data) {
      var trial_correct = jsPsych.data
        .get()
        .last(48)
        .filter({ correct: 1 })
        .count();
        console.log("correct", trial_correct)
    },
  };

  var if_node = {
    timeline: [comboPracticeTrial, secondFeedback],
    conditional_function: function () {
      // get the data from the previous trial,
      // and check which key was pressed
      var last_trial_stimulus = jsPsych.data.get().last(1).values()[0].stimulus;

      var trial_correct = jsPsych.data.get().filter({ correct: 1 }).count();
      if ((trial_correct / 16) * 100 >= 85) {
        return false;
      }
      if ((trial_correct / 16) * 100 < 85) {
        return true;
      }
    },
  };
  var practiceTest = [].concat(comboPracticeTrial);
  practiceTest.push(comulativeResponsePercentage);
  practiceTest.push(if_node);
  return practiceTest;
}
////////////////////////////////////////////////////
////////////////////////////////////////////////////
//// PRACTICE
////////////////////////////////////////////////////
////////////////////////////////////////////////////

function createPracticeTimeline() {
  practiceMoot = {
    type: jsPsychMootPlugin,
    moot_parameters: {
      doggelgaenger_col: condition.doppelgaenger_color_white
        ? "1,1,1"
        : "0,0,0",
      doggelgaenger_loc: condition.doppelgaenger_up ? "20,0,-10" : "-20,0,-10",
      doppelgaenger_target: condition.targetpattern_squares ? "SQ" : "TR",
      go_notarget_left: 4,
      go_notarget_right: 4,
      go_target_left: 4,
      go_target_right: 4,
      nogo_type1_target_left: 1,
      nogo_type1_target_right: 1,
      nogo_type1_notarget_left: 1,
      nogo_type1_notarget_right: 1,
      nogo_type2_target_left: 1,
      nogo_type2_target_right: 1,
      nogo_type2_notarget_left: 1,
      nogo_type2_notarget_right: 1,
      doppelgaenger_anim_rec: experiment_config.record_doppelgaenger_animation,
      other_anim_rec: experiment_config.record_other_animation,
    },
    extensions: [
      { type: jsPsychUnityExtension },
      { type: jsPsychExtensionRecordVideo },
      {
        type: jsPsychExtensionMediapipeFacemesh,
        params: {
          record: false,
        },
      },
    ],
  };

  return [practiceMoot];
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
//// MOOT
////////////////////////////////////////////////////
////////////////////////////////////////////////////

function createMootTimeline() {
  // Create the moot blocks V1,...,V4
  const blocks = {
    1: {
      doggelgaenger_col: condition.doppelgaenger_color_white
        ? "1,1,1"
        : "0,0,0",
      doggelgaenger_loc: condition.doppelgaenger_up ? "20,0,-10" : "-20,0,-10",
      doppelgaenger_target: condition.targetpattern_squares ? "SQ" : "TR",
      go_notarget_left: 3,
      go_notarget_right: 3,
      go_target_left: 3,
      go_target_right: 3,
      nogo_type1_target_left: 1, 
      nogo_type1_target_right: 1, 
      doppelgaenger_anim_rec: experiment_config.record_doppelgaenger_animation,
      other_anim_rec: experiment_config.record_other_animation,
    },
    2: {
      doggelgaenger_col: condition.doppelgaenger_color_white
        ? "1,1,1"
        : "0,0,0",
      doggelgaenger_loc: condition.doppelgaenger_up ? "20,0,-10" : "-20,0,-10",
      doppelgaenger_target: condition.targetpattern_squares ? "SQ" : "TR",
      go_notarget_left: 2,
      go_notarget_right: 2,
      go_target_left: 2,
      go_target_right: 2,
      nogo_type1_target_left: 1, 
      nogo_type1_target_right: 1, 
      doppelgaenger_anim_rec: experiment_config.record_doppelgaenger_animation,
      other_anim_rec: experiment_config.record_other_animation,
    },
    3: {
      doggelgaenger_col: condition.doppelgaenger_color_white
        ? "1,1,1"
        : "0,0,0",
      doggelgaenger_loc: condition.doppelgaenger_up ? "20,0,-10" : "-20,0,-10",
      doppelgaenger_target: condition.targetpattern_squares ? "SQ" : "TR",
      go_notarget_left: 4,
      go_notarget_right: 4,
      go_target_left: 4,
      go_target_right: 4,
      nogo_type1_target_left: 1, 
      nogo_type1_target_right: 1, 
      doppelgaenger_anim_rec: experiment_config.record_doppelgaenger_animation,
      other_anim_rec: experiment_config.record_other_animation,
    },
    4: {
      doggelgaenger_col: condition.doppelgaenger_color_white
        ? "1,1,1"
        : "0,0,0",
      doggelgaenger_loc: condition.doppelgaenger_up ? "20,0,-10" : "-20,0,-10",
      doppelgaenger_target: condition.targetpattern_squares ? "SQ" : "TR",
      go_notarget_left: 5,
      go_notarget_right: 5,
      go_target_left: 5,
      go_target_right: 5,
      nogo_type1_target_left: 1, 
      nogo_type1_target_right: 1, 
      doppelgaenger_anim_rec: experiment_config.record_doppelgaenger_animation,
      other_anim_rec: experiment_config.record_other_animation,
    },
  };

  let mimicry_blocks = [
    { mimicry_first_target_left: 1, mimicry_second_notarget_left: 1 },
    { mimicry_first_target_left: 1, mimicry_second_notarget_right: 1 },
    { mimicry_first_target_right: 1, mimicry_second_notarget_left: 1 },
    { mimicry_first_target_right: 1, mimicry_second_notarget_right: 1 },

    { mimicry_first_notarget_left: 1, mimicry_second_target_left: 1 },
    { mimicry_first_notarget_left: 1, mimicry_second_target_right: 1 },
    { mimicry_first_notarget_right: 1, mimicry_second_target_left: 1 },
    { mimicry_first_notarget_right: 1, mimicry_second_target_right: 1 },
    
  ];
  mimicry_blocks = shuffleArray(mimicry_blocks.concat(mimicry_blocks));
  let trials_moot_blocks = [];
  shuffleArray(new Array(4).fill([1, 2, 3, 4]).flat()).forEach((idx, i) => {
    const moot_parameters = Object.assign({}, blocks[idx], mimicry_blocks[i]);

    trials_moot_blocks.push({
      type: jsPsychMootPlugin,
      moot_parameters: moot_parameters,
      extensions: [
        { type: jsPsychUnityExtension },
        { type: jsPsychExtensionRecordVideo },
        {
          type: jsPsychExtensionMediapipeFacemesh,
          params: {
            record: false,
          },
        },
      ],
    });
  });
  
  return trials_moot_blocks;
}

function createWarumupTimeline() {
  let warmup_block = [];

  warmup_block.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: slides_content["Slide_7"],
    choices: ["ArrowRight"],
    trial_ends_after_video: false,
    prompt: '<img alt="" src="images/right_arrow.png" width="75" height="50"/>',
  });

  for (i=0;i< warmup_videos_names.length; i++){

    warmup_block.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<p>Please imitate the expression you will see during the upcoming video.</p>',
      choices: ["ArrowRight"],
      prompt:
        '<p>Press right arrow key to start the video.</p><img alt="" src="images/right_arrow.png" width="75" height="50"/>',
    });


    warmup_block.push({
      type: jsPsychVideoKeyboardResponse,
      stimulus: [warmup_videos_names[i].video],
      response_ends_trial:false,
      trial_duration: 11000,
      extensions: [
        {type: jsPsychExtensionRecordVideo}
      ]

    });
    warmup_block.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<p>You can stop imitating the expression now.</p>',
      trial_duration:2000,
    });

  }
  warmup_block.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p>The warmup phase is finished, now we will give further instructions for the experiment.</p>',
    trial_duration:4000,
  });
  
  return warmup_block;
}

function createConsentAndUpload() {

  var pipeline = [];

  pipeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<p>Do you give consent to upload the video data collected during the experiment?</p>",
    choices: ['<p>Yes, upload with video</p>', '<p>No, upload without video</p>'],
    prompt: slides_content['upload_consent'],
  });

  const stripVideo = function (data) {
    Object.keys(data.trials).forEach((key) => {
      let counter = 0;
      if (data.trials[key]['record_video_data']) {
        data.trials[key]['record_video_data'] = "REMOVED";
        counter++;
      }
      return (counter);
    });
  }

  // Strip video data depending on the response of the participant
  pipeline.push({
    timeline: [
      {
        type: jsPsychSurveyText,
        questions: [
          {
            prompt: '<p>Please take a moment to describe in the textbox below why did you declined uploading your data.</p>', 
            rows: 7
          }
        ]
      },
      {
        type: jsPsychCallFunction,
        func: function () { stripVideo(jsPsych.data.get()) }
      }
    ],
    conditional_function: function () {
      // get the data from the previous trial,
      // and check which key was pressed
      var data = jsPsych.data.get().last(1).values()[0];
      return (data.response == 1)
    }
  });

  pipeline.push(
    {
    type: jsPsychNextcloudFiledropPlugin,
    url: 'https://owncloud.csl.uni-bremen.de',
    // If changing this, please also change the link for rescue-upload in 
    // slides/upload_failed.html
    folder: 'MQqCYwmy6YBdS9d',
    filename: function (){
      return subject_id + '.zip';
    },
    generate_download_url_on_error: true
  });

  // Check for error during upload
  pipeline.push({
    timeline: [
      {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: slides_content['upload_failed'],
        prompt: "<p>Press right arrow key after upload has finished.</p>",
        choices: ['ArrowRight'],
      },
      {
        type: jsPsychCallFunction,
        func: function () {
          // console.log("REVOKE", jsPsych.data.get().last(2).values()[0].url);
          // Remove ObjectURL to prevent mem leakage
          URL.revokeObjectURL(jsPsych.data.get().last(2).values()[0].url);
        }
      }
    ],
    conditional_function: function () {
      var data = jsPsych.data.get().last(1).values()[0];
      return (data.error)
    }
  });

  return (pipeline)

}

function checkBrowser(){
  var browserCondition = {
    type: jsPsychBrowserCheck,
    inclusion_function: (data) => {
        return ['chrome', 'firefox','edge-chromium'].includes(data.browser) && data.mobile === false;
    },
    exclusion_message: (data) => {
        if(data.mobile){
            return '<p>You must use a desktop/laptop computer to participate in this experiment.</p>';
        } else if (data.browser !== 'chrome' || data.browser !== 'firefox' || data.browser !== 'edge-chromium') {
            return '<p>You must use Chrome or Firefox or Edge to complete this experiment.</p>'
        }
    },
};  
return browserCondition;
} 