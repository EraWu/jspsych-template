/* eslint @typescript-eslint/require-await: 0 */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-unsafe-call: 0 */
/* eslint @typescript-eslint/no-unsafe-member-access: 0 */
/* eslint @typescript-eslint/no-unsafe-return: 0 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Firestore } from 'firebase/firestore'

import { debugging, mockStore, UserRecord } from '../globalVariables'
import { enableBeginExperiment } from '../main'

import { initExperimentData } from './databaseUtils'

const mockDb = {} as Firestore

let mockUid: string | null = 'mock-user-' + Math.random().toString(36).substring(2, 11)

const debug: boolean = debugging()
const mock: boolean = mockStore()

export const doc = (db: any, collection: string, id: string): any => ({
  path: `${collection}/${id}`,
})

export const getDoc = async (docRef: any) => ({
  exists: () => docRef.path in mockDb,
  data: () => mockDb[docRef.path] || null,
})

export const setDoc = async (docRef: any, data: any): Promise<void> => {
  mockDb[docRef.path] = data
  console.log('Mock Firestore: Document set', { path: docRef.path, data })
}

export const runTransaction = async (db: any, updateFunction: (transaction: any) => Promise<void>): Promise<void> => {
  const mockTransaction = {
    get: getDoc,
    update: (docRef: any, data: any) => {
      mockDb[docRef.path] = { ...mockDb[docRef.path], ...data }
      console.log('Mock Firestore: Document updated', { path: docRef.path, data })
    },
  }
  await updateFunction(mockTransaction)
}

export const getUID = async (): Promise<string> => {
  if (!mockUid) {
    mockUid = 'mock-user-' + Math.random().toString(36).substring(2, 11)
  }
  return mockUid
}

export const getDataBase = (): Firestore => mockDb

/* Helper function to get the current state of the mock database (for debugging) */
export function getMockDbState(): Record<string, any> {
  return { ...mockDb }
}

/* important: called immediately to begin expt */
if (mock) {
  getUID().then(
    (uid) => {
      console.log('getUID():', uid)
      initExperimentData(uid).then(
        () => {
          enableBeginExperiment()
          if (debug) {
            console.log('MockDB getUID() :: initExperimentData(): Success') // Success!
          }
        },
        (err: unknown) => {
          console.error(err) // Error!
        },
      )
    },
    (err: unknown) => {
      console.error(err)
    },
  )
}
