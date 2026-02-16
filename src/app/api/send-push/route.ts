import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) return;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // 🚀 修正：秘密鍵の処理をより堅牢に
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin environment variables are missing.');
    return;
  }

  // 改行コードの置換と、前後にある可能性のある引用符を削除
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
};

export async function POST(request: Request) {
  initializeFirebaseAdmin();

  if (admin.apps.length === 0) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  const { title, body, targetUserId } = await request.json();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. 送信先トークンの取得 (fcm_tokenカラムを使用)
    let query = supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .not('fcm_token', 'is', null)
      .neq('fcm_token', ''); // 空文字も除外

    if (targetUserId) {
      query = query.eq('id', targetUserId);
    }

    const { data: members, error: dbError } = await query;

    if (dbError) throw new Error(`DB Error: ${dbError.message}`);

    // トークンを重複排除して抽出
    const tokens = Array.from(new Set(members?.map(m => m.fcm_token).filter(Boolean)));

    console.log(`送信対象トークン数: ${tokens.length}`);

    if (tokens.length === 0) {
      return NextResponse.json({ message: '有効な宛先トークンが見つかりません' }, { status: 200 });
    }

    // 2. Firebase経由で送信
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: {
        title: title || "LIONS HUB",
        body: body || "",
      },
      // 🚀 iOSで通知が表示されるようにするための設定を追加
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    console.log(`送信結果: 成功 ${response.successCount} 件 / 失敗 ${response.failureCount} 件`);

    // 🚀 失敗したトークンがある場合はログに出力（デバッグ用）
    if (response.failureCount > 0) {
  response.responses.forEach(async (res, idx) => {
    if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
      const invalidToken = tokens[idx];
      console.log('無効なトークンを削除します:', invalidToken);
      
      // 🚀 DBから無効なトークンを削除する処理を追加（任意）
      await supabaseAdmin
        .from('profiles')
        .update({ fcm_token: null })
        .eq('fcm_token', invalidToken);
    }
  });
}

    return NextResponse.json({ 
      success: true, 
      count: response.successCount,
      failure: response.failureCount 
    });
  } catch (error: any) {
    console.error('Push Notification API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}