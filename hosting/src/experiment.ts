import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response'
import jsPsychImageKeyboardResponse from '@jspsych/plugin-image-keyboard-response'
import jsPsychPreload from '@jspsych/plugin-preload'
import { initJsPsych } from 'jspsych'

import { debugging, getUserInfo, mockStore, prolificCC, prolificCUrl } from './globalVariables'
import { saveTrialDataComplete, saveTrialDataPartial } from './lib/databaseUtils'

import type { KeyboardResponse, Task, TrialData } from './project'
import type { DataCollection } from 'jspsych'

import imgStimBlue from './images/blue.png'
import imgStimOrange from './images/orange.png'

/* Alternatively
 * type JsPsychInstance = ReturnType<typeof initJsPsych>
 * type JsPsychGetData = JsPsychInstance['data']['get']
 * export type JsPsychDataCollection = ReturnType<JsPsychGetData>
 */

const debug = debugging()
const mock = mockStore()

const debuggingText = debug ? `<br /><br />redirect link : ${prolificCUrl}` : '<br />'
const exitMessage = `<p class="align-middle text-center"> 
Please wait. You will be redirected back to Prolific in a few moments. 
<br /><br />
If not, please use the following completion code to ensure compensation for this study: ${prolificCC}
${debuggingText}
</p>`

const randCond: string = ['A', 'B'][Math.round(Math.random())]
console.log('randCond:', randCond)

const exitExperiment = (): void => {
  document.body.innerHTML = exitMessage
  setTimeout(() => {
    window.location.replace(prolificCUrl)
  }, 3000)
}

const exitExperimentDebugging = (): void => {
  const contentDiv = document.getElementById('jspsych-content')
  if (contentDiv) contentDiv.innerHTML = exitMessage
}

export async function runExperiment(updateDebugPanel: () => void) {
  if (debug) {
    console.log('--runExperiment--')
    console.log('UserInfo ::', getUserInfo())
  }

  /* initialize jsPsych */
  const jsPsych = initJsPsych({
    on_data_update: function (trialData: TrialData) {
      if (debug) {
        console.log('jsPsych-update :: trialData ::', trialData)
      }
      // if trialData contains a saveToFirestore property, and the property is true, then save the trialData to Firestore
      if (trialData.saveToFirestore) {
        saveTrialDataPartial(trialData).then(
          () => {
            if (debug) {
              console.log('saveTrialDataPartial: Success') // Success!
              if (mock) {
                updateDebugPanel()
              }
            }
          },
          (err: unknown) => {
            console.error(err) // Error!
          },
        )
      }
    },
    on_finish: (data: DataCollection) => {
      const contentDiv = document.getElementById('jspsych-content')
      if (contentDiv) contentDiv.innerHTML = '<p> Please wait, your data are being saved.</p>'
      saveTrialDataComplete(data.values()).then(
        () => {
          if (debug) {
            exitExperimentDebugging()
            console.log('saveTrialDataComplete: Success') // Success!
            console.log('jsPsych-finish :: data ::')
            console.log(data)
            setTimeout(() => {
              jsPsych.data.displayData()
            }, 3000)
          } else {
            exitExperiment()
          }
        },
        (err: unknown) => {
          console.error(err) // Error!
          exitExperiment()
        },
      )
    },
  })

  /* create timeline */
  const timeline: Record<string, any>[] = []

  /* define welcome message trial */
  const someStim = ['Stim1', 'Stim2', 'Stim3']
  for (const istim of someStim) {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: 'Welcome to the experiment! Press any key to start.',
      data: {
        task: 'response' as Task,
        stimID: istim,
      },
      on_finish: function (data: TrialData) {
        data.saveToFirestore = true
      },
    })
  }

  const welcomeMessage =
    randCond === 'A'
      ? `<span class="text-xl">Welcome to the experiment (cond ${randCond}). Press any key to begin.</span>`
      : `<span class="text-xl">What are we doing in condition ${randCond} </span>`
  const welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: welcomeMessage,
  }
  timeline.push(welcome)

  /* define instructions trial */
  const instructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>In this experiment, a circle will appear in the center of the screen.</p>
        <p>If the circle is <span class="text-blue-500 font-semibold">blue</span>, 
        press the letter <span class="text-blue-500 font-semibold">F</span> on the keyboard as fast as you can.</p>
        <p>If the circle is <span class="text-orange-500 font-semibold">orange</span>, 
        press the letter <span class="text-orange-500 font-semibold">J</span> as fast as you can.</p>
        <div style='width: 700px;'>
        <div style='float: left;'><img src='${imgStimBlue}'></img>
        <p class='small'><strong>Press the F key</strong></p></div>
        <div style='float: right;'><img src='${imgStimOrange}'></img>
        <p class='small'><strong>Press the J key</strong></p></div>
        </div>
        <p>Press any key to begin.</p>
      `,
    post_trial_gap: 2000,
  }
  timeline.push(instructions)

  /* define vignettes and questions */
  const vignettes = [
    'Vignette 1 text here',
    'Vignette 2 text here',
    'Vignette 3 text here',
    'Vignette 4 text here',
    'Vignette 5 text here',
    'Vignette 6 text here',
    'Vignette 7 text here',
    'Vignette 8 text here',
    'Vignette 9 text here',
    'Vignette 10 text here',
    'Vignette 11 text here',
    'Vignette 12 text here',
  ]
  /* select 4 random vignettes */
  const selectedVignettes = jsPsych.randomization.sampleWithoutReplacement(vignettes, 4)

  selectedVignettes.forEach((vignette) => {
    timeline.push({
      type: 'html-keyboard-response',
      stimulus: vignette,
      choices: jsPsych.NO_KEYS,
      trial_duration: 5000, // 5-second duration for displaying the vignette
    })

    /* collect emotional label ratings for each vignette */
    timeline.push({
      type: 'survey-likert',
      questions: [
        { prompt: 'To what extent is the agent feeling happy?', labels: ['Not at all', 'Extremely'], required: true },
        { prompt: 'To what extent is the agent feeling sad?', labels: ['Not at all', 'Extremely'], required: true },
        // Add more emotion questions
      ],
    })

    /* collect appraisal responses for each vignette */
    timeline.push({
      type: 'survey-likert',
      questions: [
        { prompt: 'Was the event intentional?', labels: ['Not at all', 'Very much'], required: true },
        { prompt: 'Was the event controllable?', labels: ['Not at all', 'Very much'], required: true },
        // Add more appraisal questions
      ],
    })
  })

  /* define test procedure */
  const test_procedure = {
    timeline: [fixation, test],
    timeline_variables: test_stimuli,
    repetitions: 3,
    randomize_order: true,
  }
  timeline.push(test_procedure)

  /* define debrief */
  const debrief_block = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
      const trials = jsPsych.data.get().filter({ task: 'response' })
      const correct_trials = trials.filter({ correct: true })
      const accuracy = Math.round((correct_trials.count() / trials.count()) * 100)
      const rt = Math.round(correct_trials.select('rt').mean())

      return `<p>You responded correctly on ${accuracy.toString()}% of the trials.</p>
          <p>Your average response time was ${rt.toString()}ms.</p>
          <p>Press any key to complete the experiment. Thank you!</p>`
    },
  }
  timeline.push(debrief_block)

  /* start the experiment */
  // @ts-expect-error allow timeline to be type jsPsych TimelineArray
  await jsPsych.run(timeline)
}
