"use strict";function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),Object.defineProperty(a,"prototype",{writable:!1}),a}var jsPsychCloseUnityPlugin=function(){"use strict";var a=/*#__PURE__*/function(){function a(b){_classCallCheck(this,a),this.jsPsych=b,this.unity=this.jsPsych.extensions.unity}return _createClass(a,[{key:"trial",value:function trial(){this.unity.closeUnity(),this.jsPsych.finishTrial({})}}]),a}();/**
   * **CLOSE-UNITY-PLUGIN**
   *
   * This plugin integrates unity into jsPsych
   *
   */return a.info={name:"moot-close-unity"},a}(jsPsychModule);

//# sourceMappingURL=index.browser.min.js.map