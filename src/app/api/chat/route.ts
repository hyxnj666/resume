import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getResumeSummaryForAI } from '@/data/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY 未配置，请在 .env.local 中设置' },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as { messages: { role: string; content: string }[]; locale?: 'zh' | 'en' };
    const { messages, locale = 'zh' } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages 不能为空' }, { status: 400 });
    }

    const systemContent = getResumeSummaryForAI(locale);

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.5,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
              controller.enqueue(encoder.encode(JSON.stringify({ content: text }) + '\n'));
            }
          }
          controller.close();
        } catch (e) {
          const message = e instanceof Error ? e.message : '请求失败';
          controller.enqueue(encoder.encode(JSON.stringify({ error: message }) + '\n'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('[api/chat]', e);
    const message = e instanceof Error ? e.message : '请求失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
