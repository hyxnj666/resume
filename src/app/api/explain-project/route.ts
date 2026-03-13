import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY 未配置' },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as {
      projectName: string;
      projectDesc: string;
      points?: string[];
      locale?: 'zh' | 'en';
    };
    const { projectName, projectDesc, points = [], locale = 'zh' } = body;
    const name = typeof projectName === 'string' ? projectName.trim() : '';
    const desc = typeof projectDesc === 'string' ? projectDesc.trim() : '';
    if (!name || !desc) {
      return NextResponse.json({ error: 'projectName and projectDesc required' }, { status: 400 });
    }

    const pointsStr = Array.isArray(points) ? points.join('\n') : '';
    const isZh = locale === 'zh';

    const userContent = isZh
      ? `请从「项目架构、技术难点、技术方案」三方面，用简洁专业的语言解读以下项目（面向面试官）。\n\n项目名称：${name}\n项目描述：${desc}\n${pointsStr ? `要点：\n${pointsStr}` : ''}`
      : `Explain this project in 3 aspects: architecture, technical challenges, technical approach. Be concise and professional (for interviewers).\n\nProject: ${name}\nDescription: ${desc}\n${pointsStr ? `Points:\n${pointsStr}` : ''}`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: isZh
            ? '你是一个技术面试官助手。根据给出的项目信息，从项目架构、技术难点、技术方案三方面做简明解读，使用 Markdown 分段，不要编造项目中没有的内容。'
            : 'You are a technical interviewer assistant. Explain the project in 3 aspects: architecture, challenges, solutions. Use Markdown. Do not invent details not in the project.',
        },
        { role: 'user', content: userContent },
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.4,
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
          const message = e instanceof Error ? e.message : 'Request failed';
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
    console.error('[api/explain-project]', e);
    const message = e instanceof Error ? e.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
