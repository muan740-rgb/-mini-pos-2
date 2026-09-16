import { NextResponse } from 'next/server';

// ⚠️ ใช้ env var แบบไม่มี NEXT_PUBLIC_ เพื่อให้ค่านี้อยู่ฝั่ง server เท่านั้น
// ตั้งค่าใน .env.local:
//   TELEGRAM_BOT_TOKEN=xxxxxxxxxx:yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
//   TELEGRAM_CHAT_ID=-1001234567890
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('ไม่พบค่า TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ใน environment variables');
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(`Telegram API error: ${data.description || response.statusText}`);
  }

  return data;
}

// รับข้อความหลายข้อความในครั้งเดียว เช่น [ข้อความ order ใหม่, ข้อความ low stock (ถ้ามี)]
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'ต้องส่ง messages เป็น array ของข้อความอย่างน้อย 1 ข้อความ' },
        { status: 400 }
      );
    }

    const results = [];
    for (const text of messages) {
      // ยิงทีละข้อความตามลำดับ เพื่อไม่ให้ Telegram rate-limit
      const result = await sendTelegramMessage(text);
      results.push(result);
    }

    return NextResponse.json({ ok: true, sent: results.length });
  } catch (error) {
    console.error('Telegram notify error:', error);
    // คืน error กลับไป แต่ฝั่ง client จะไม่ทำให้ระบบขายพัง (ดู notifyTelegram ใน sell/page.js)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
