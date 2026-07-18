/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Applet Config parsed directly
const firebaseConfig = {
  projectId: "studio-5498054063-fbc6b",
  appId: "1:702988054202:web:cccd6b64afb1b0a4405c83",
  apiKey: "AIzaSyCgKXXFpuErAkRMGgzC2sOwIgKqDm1Mciw",
  authDomain: "studio-5498054063-fbc6b.firebaseapp.com",
  storageBucket: "studio-5498054063-fbc6b.firebasestorage.app",
  messagingSenderId: "702988054202"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
