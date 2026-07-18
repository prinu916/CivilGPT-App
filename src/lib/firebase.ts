/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Applet Config parsed directly
const firebaseConfig = {
  projectId: "gen-lang-client-0384965083",
  appId: "1:23962460050:web:379cf8db61dd9c3d18eb4b",
  apiKey: "AIzaSyDBEvNVbrcBmrW_r5P_MF086DwQjpxTzyQ",
  authDomain: "gen-lang-client-0384965083.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-civilgpt-00f6e802-c3ac-4807-9c7b-9f877bb828c2",
  storageBucket: "gen-lang-client-0384965083.firebasestorage.app",
  messagingSenderId: "23962460050"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
