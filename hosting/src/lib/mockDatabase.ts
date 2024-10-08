/* eslint @typescript-eslint/require-await: 0 */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-unsafe-call: 0 */
/* eslint @typescript-eslint/no-unsafe-member-access: 0 */
/* eslint @typescript-eslint/no-unsafe-return: 0 */

import { debugging, UserRecord } from '../globalVariables'
import { enableBeginExperiment } from '../main'

import { initExperimentData } from './databaseUtils'

import type { RecursiveRecordArray, TrialData } from '../project'

const mockDb: Record<string, any> = {}
let mockUid: string | null = null

const debug: boolean = debugging()

console.log('mockDatabase: debugging: ', debug)

export class Timestamp {
  seconds: number
  nanoseconds: number

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds
    this.nanoseconds = nanoseconds
  }

  static now(): Timestamp {
    const now = Date.now()
    return new Timestamp(Math.floor(now / 1000), (now % 1000) * 1e6)
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6)
  }

  toString(): string {
    return this.toDate().toISOString()
  }
}

// export const getFirestore = () => mockDb

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

export const getDataBase = () => mockDb

////////////////////////

/* important: called immediately to begin expt */
getUID().then(
  (uid) => {
    console.log('getUID():', uid)
    initExperimentData(uid).then(
      () => {
        enableBeginExperiment()
        if (debug) {
          console.log('onAuthStateChanged(): initExperimentData(): Success') // Success!
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

// Helper function to get the current state of the mock database (for debugging)
export function getMockDbState(): Record<string, any> {
  return { ...mockDb }
}
