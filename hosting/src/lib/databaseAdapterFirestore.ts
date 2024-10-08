import { doc, getDoc, runTransaction, setDoc, Timestamp } from 'firebase/firestore'

import { getDataBase, getUID } from './databaseAuth'

export class FireStore {
  static doc = doc
  static getDoc = getDoc
  static runTransaction = runTransaction
  static setDoc = setDoc
  static Timestamp = Timestamp
  static getDataBase = getDataBase
  static getUID = getUID
}
