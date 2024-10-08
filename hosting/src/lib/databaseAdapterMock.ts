import { doc, getDataBase, getDoc, getUID, runTransaction, setDoc, Timestamp } from './mockDatabase' // DEVELOPMENT

export class MockDatabase {
  static doc = doc
  static getDoc = getDoc
  static runTransaction = runTransaction
  static setDoc = setDoc
  static Timestamp = Timestamp
  static getDataBase = getDataBase
  static getUID = getUID
}
