// import {
//   // addDoc,
//   // collection,
//   doc,
//   // DocumentData,
//   getDoc,
//   // getDocs,
//   // getFirestore,
//   // onSnapshot,
//   runTransaction,
//   setDoc,
//   Timestamp,
// } from 'firebase/firestore' // PRODUCTION

// import { doc, getDataBase, getDoc, getUID, runTransaction, setDoc, Timestamp } from './mockDatabase' // DEVELOPMENT

import { debugging, getDocStr, setUserInfo, UserRecord } from '../globalVariables'

import { getBrowserInfo, getOSInfo, getWindowSize } from './clientNavigatorQuery'
import { FireStore } from './databaseAdapterFirestore'
import { MockDatabase } from './databaseAdapterMock'

// import { getDataBase, getUID } from './databaseAuth' // PRODUCTION

/// conditional import
// async function importModule(moduleName: string):Promise<any>{
//   console.log("importing ", moduleName);
//   const importedModule = await import(moduleName);
//   console.log("\timported ...");
//   return importedModule;
// }

// let moduleName:string = "module-a";
// let importedModule = await importModule(moduleName);
// console.log("importedModule", importedModule);

import type { RecursiveRecordArray, TrialData } from '../project'

const debug: boolean = debugging()

const mock = true

const db = mock ? MockDatabase : FireStore

const doc = db.doc
const getDataBase = db.getDataBase
const getDoc = db.getDoc
const getUID = db.getUID
const runTransaction = db.runTransaction
const setDoc = db.setDoc
const Timestamp = db.Timestamp

async function initData(userInfo: UserRecord): Promise<void> {
  const docData = {
    ...userInfo,
    dateInit: Timestamp.now(),
    trialsPartial: [],
    clientInfo: {
      browser: getBrowserInfo(),
      os: getOSInfo(),
      windowSize: getWindowSize(),
    },
  }

  const exptDataDoc = getDocStr('exptData')
  const uid = await getUID()
  const db = getDataBase()
  const docRef = doc(db, exptDataDoc, uid)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const existingData = docSnap.data()
    if (existingData.hasOwnProperty('priorInits')) {
      let { priorInits, ...existingDataReduced } = existingData
      if (priorInits instanceof Array) {
        // @ts-expect-error allow priorInits to by unknown
        docData.priorInits = [...priorInits, existingDataReduced]
      } else {
        // @ts-expect-error allow priorInits to by unknown
        docData.priorInits = [priorInits, existingDataReduced]
      }
    } else {
      // @ts-expect-error allow priorInits to by unknown
      docData.priorInits = [existingData]
    }
  }

  await setDoc(doc(db, exptDataDoc, uid), docData)
  if (debug) {
    console.log('initData: Document written')
  }
}

export async function initExperimentData(uid: string): Promise<void> {
  // Initialize User
  const userInfo = setUserInfo(uid)

  if (debug) {
    console.log(`Experiment Version: ${userInfo.version}`)
    console.log(`Git Commit: ${userInfo.gitCommit}`)
  }

  // Initialize User's Data
  await initData(userInfo)
}

export async function saveTrialDataPartial(trialData: TrialData): Promise<boolean> {
  try {
    const exptDataDoc = getDocStr('exptData')
    const uid = await getUID()
    const db = getDataBase()
    const docRef = doc(db, exptDataDoc, uid)
    await runTransaction(db, async (transaction): Promise<void> => {
      // Get the latest data, rather than relying on the store
      const docSnap = await transaction.get(docRef)
      if (!docSnap.exists()) {
        throw new Error('saveTrialDataPartial: Document does not exist')
      }

      // Get the latest trial and current trial
      const userData = docSnap.data()

      const data: Record<string, unknown[]> = {}

      if ('trialsPartial' in userData) {
        data.trialsPartial = userData.trialsPartial
      } else {
        data.trialsPartial = []
      }

      data.trialsPartial.push(trialData)

      // Update the fields in responseData directly
      transaction.update(docRef, data)

      if (debug) {
        console.log('Successfully saved data')
      }
    })
    return true
  } catch (err) {
    console.error('Error saving data:: ', err)
    return false
  }
}

export async function saveTrialDataComplete(jsPsychDataTrials: unknown[]): Promise<boolean> {
  const exptDataDoc = getDocStr('exptData')
  const uid = await getUID()
  const db = getDataBase()
  const docRef = doc(db, exptDataDoc, uid)
  try {
    await runTransaction(db, async (transaction): Promise<void> => {
      // Get the latest data, rather than relying on the store
      const docSnap = await transaction.get(docRef)
      if (!docSnap.exists()) {
        throw new Error('saveTrialDataComplete: Document does not exist')
      }

      const data: Record<string, unknown[] | Timestamp | string | number> = {
        dataComplete: Timestamp.now(),
        trials: jsPsychDataTrials,
      }

      // Update the fields in responseData directly
      transaction.update(docRef, data)

      if (debug) {
        console.log('Successfully saved data')
      }
    })
  } catch (err) {
    console.error('Error saving data:: ', err)
    return false
  }
  return true
}

export async function saveRootData(responseData: RecursiveRecordArray): Promise<boolean> {
  const exptDataDoc = getDocStr('exptData')
  const uid = await getUID()
  const db = getDataBase()
  const docRef = doc(db, exptDataDoc, uid)
  try {
    await runTransaction(db, async (transaction): Promise<void> => {
      // Get the latest data, rather than relying on the store
      const docSnap = await transaction.get(docRef)
      if (!docSnap.exists()) {
        throw new Error('saveRootData: Document does not exist')
      }

      // Update the fields in responseData directly
      transaction.update(docRef, responseData)

      if (debug) {
        console.log('Successfully saved data')
      }
    })
  } catch (err) {
    console.error('Error saving data:: ', err)
    return false
  }
  return true
}
