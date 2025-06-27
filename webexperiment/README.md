# exp-1_ccsr 

## Branches: 
### main 
First version of the experiment, completely outdated

### documented_main 
Version with smiling avatar and questionnaireAgencyOwnership position after moot-phase

### documented_earlier_questionnaire
Same as documented_main but position of questionnaireAgencyOwnership is changed to be after practice_moot_block and before the moot-phase

### documented_earlier_questionnaire_demo
Demo version of documented_earlier_questionnaire

### documented_main_demo
Demo version of documented_main, includes only one moot trial and no data upload

### frown
Version with frowning avatar and questionnaireAgencyOwnership position after moot-phase

### frown_earlier_questionnaire
Same as frown but position of questionnaireAgencyOwnership is changed to be after practice_moot_block and before the moot-phase

### frown_demo
Demo version of frown, includes only one moot trial and no data upload

### lab_exp
Baby Moot version for experiments with infants, after initial import of packages to the browser storage, this works offline. Data gets downloaded instead of uploaded to owncloud.

### lsl_main
Lab version with smiling avatar. Used with lsl to synchronise EMG/EEG data

### exp1_SA
Version of the experiment for South-Asian participants. Includes questions about familiarity with the "indian head wobble"

## Instructions for updating older branches: 
Check jsPsych and Moot Plugin Versions, especially nextcloud filedrop and unity plugins Change prolific code and nextcloud filedrop link

Update prolific block list to exclude participants from older experiments

Change nextcloud link in "upload failed" slide aswell

Check Slide 81 for typo in “experienced” 

Replace in all files: moot-online.informatik.uni-bremen.de/experiment_1 with moot-online.informatik.uni-bremen.de/new_experiment_folder

Check is consent form needs to be updated (remove names or change dates)

Check if any trial are missing (debriefing for example)

Add exp link to jspsych json

## How to run:
1. Clone Repository (git clone https://github.com/suman-bremen/exp-1_ccsr.git)
2. Navigate into the folder (cd exp-1_ccsr)
3. Checkout the branch of any experiment you want to run (E.g. git checkout documented_main)
4. Change the Nextcloud upload link (only works with uni bremen nextcloud):
- Create a folder in nextcloud and create a Filedrop link (E.g. https://owncloud.csl.uni-bremen.de/s/Q3gf4xDz8tFgqgf)
- Copy the last part (E.g. Q3gf4xDz8tFgqgf) and open utils.js with any editor, then CTRL+F and search for owncloud.
- Replace the string after folder: with the copied string and save the file.
![grafik](https://github.com/user-attachments/assets/6edd2366-ff75-4666-8410-f91fe263f18d)
- Also adjust the link in slides/upload_failed.
![grafik](https://github.com/user-attachments/assets/8befded2-cc19-464d-b827-1a291e11c122)
5. Change the Prolific return code:
- Open experiment_1.html with any editor then CTRL+F and search for createThankYou, then paste your prolific return code into the quotation marks.
![grafik](https://github.com/user-attachments/assets/2c2fcf4f-9b71-49c8-970f-1b6392739017)
6. Upload the exp-1_ccsr folder onto a server or run a local server using python -m http.server
7. Open experiment_1.html in your browser to run the experiment.

## Avatar Settings and how to modify the settings:
### In the current version, there are two settings that can be modified for the experiment:
   1. `Setting`: Which environment should be selected for conducting experiment (Accepted arguments: `Web`, `Lab`)
   2. `Expression`: Which expression should be used in mimicry ( Accepted arguments: `Smile`, `Frown`, `Disgust`, `Proud`, `Fear`, `Surprised`, `Anger`)
### How to change the settings:
  1. Navigate to the folder `exp-1_ccsr/StreamingAssets`
  
  ![image](https://github.com/user-attachments/assets/155c4097-5ab1-4904-b27c-86ce52b45a50)
  
  2. Open `config.json` file using any text editor.
  
  ![image](https://github.com/user-attachments/assets/ce82e880-91cf-43b4-9d7c-6209a0cdab0c)
  
  3. There will be two parameters in the file already. Modify their value according to the requirement.
  
  ![image](https://github.com/user-attachments/assets/035d409f-c998-42c9-b133-844600bac2b0)

     







