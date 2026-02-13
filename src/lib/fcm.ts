import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import { supabase } from "./supabase";

export const requestAndSaveToken = async (userId: string) => {
  try {
    if (!messaging) return false;

    // 1. 通知の許可をもらう
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    // 2. トークン（受取用ID）を取得
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (token) {
      // 3. Supabaseのprofilesテーブルに保存
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    }
    return false;
  } catch (error) {
    console.error("FCM Token Error:", error);
    return false;
  }
};