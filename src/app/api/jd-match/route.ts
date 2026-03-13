import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getResumeSummaryForAI } from '@/data/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY 未配置' },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as { jd: string; locale?: 'zh' | 'en' };
    const { jd, locale = 'zh' } = body;
    const jdTrimmed = typeof jd === 'string' ? jd.trim() : '';
    if (!jdTrimmed) {
      return NextResponse.json({ error: 'jd 不能为空' }, { status: 400 });
    }

    const resumeContext = getResumeSummaryForAI(locale);
    const isZh = locale === 'zh';

    const sysContent = isZh
      ? `${resumeContext}\n\n你是一个简历与岗位匹配分析助手。用户会粘贴一段岗位描述（JD），请根据上述简历内容，分析该候选人与该岗位的匹配程度。你必须用 JSON 格式回复，且只输出这一 JSON，不要其他文字。格式：{"matchPercent": 0-100 的整数, "skillGaps": ["缺口1", "缺口2"], "reasons": ["推荐理由1", "推荐理由2"]}。matchPercent 表示匹配度百分比；skillGaps 是候选人相对该 JD 的技能缺口（没有可空数组）；reasons 是推荐该候选人的理由（至少 1 条）。`
      : `${resumeContext}\n\nYou are a resume-JD matching analyst. The user will paste a job description (JD). Based on the resume above, analyze how well the candidate matches the role. Reply with a single JSON object only, no other text. Format: {"matchPercent": number 0-100, "skillGaps": ["gap1", "gap2"], "reasons": ["reason1", "reason2"]}. matchPercent = match percentage; skillGaps = candidate's skill gaps vs JD (empty array if none); reasons = reasons to recommend (at least one).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysContent },
        { role: 'user', content: isZh ? `请分析以下岗位描述与上述简历的匹配度：\n\n${jdTrimmed}` : `Analyze match between this JD and the resume above:\n\n${jdTrimmed}` },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as { matchPercent?: number; skillGaps?: string[]; reasons?: string[] }) : null;
    if (!parsed) {
      return NextResponse.json({ error: '解析结果失败' }, { status: 500 });
    }

    return NextResponse.json({
      matchPercent: typeof parsed.matchPercent === 'number' ? Math.min(100, Math.max(0, parsed.matchPercent)) : 70,
      skillGaps: Array.isArray(parsed.skillGaps) ? parsed.skillGaps : [],
      reasons: Array.isArray(parsed.reasons) && parsed.reasons.length > 0 ? parsed.reasons : [isZh ? '具备相关经验与技能' : 'Relevant experience and skills'],
    });
  } catch (e) {
    console.error('[api/jd-match]', e);
    const message = e instanceof Error ? e.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
