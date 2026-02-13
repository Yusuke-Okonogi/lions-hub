import { initializeApp, getApps } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // 🚀 NEXT_PUBLIC_ を付けた変数に変更
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "616255265177", 
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 二重初期化を防止
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ブラウザ環境でのみMessagingを初期化
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null as unknown as Messaging;