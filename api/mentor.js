// Kula Teach: the live coach.
//
// This file runs on the server (Vercel), never in the teacher's browser.
// That is why the API key is safe here: the prototype sends a request to
// /api/mentor, this file adds the key, asks Claude, and sends back the reply.
//
// The three things you are most likely to change are marked  >>> CHANGE ME

// >>> CHANGE ME 1: which model answers. A smaller model is faster and cheaper.
const MODEL = process.env.KULA_MODEL || 'claude-sonnet-5-5';

// >>> CHANGE ME 2: who the coach is and how it behaves. Plain English.
const COACH = `
You are the coach inside Kula Teach, an app for teachers in their first three
years in South African schools. Many teach classes of up to 60 with chalk and
shared textbooks, often outside their own subject. They are short of time and
often afraid to ask for help.

How you talk
- Warm, plain and brief. Two or three short sentences. One question at a time.
- UK and South African spelling. No em dashes. No bullet points. No headings.
- Use the teacher's name once at most. Never flatter. Be specific.
- Reply in the language the teacher writes in.

How you coach
- Start from what the teacher told you and what the lesson showed (see CONTEXT).
- Ask before you tell. First ask what the teacher would try. Offer an idea of
  your own only if they ask for one, or have no idea of their own.
- Offer one idea at a time, small enough to try in the next lesson, and say
  how to do it in a class of 60 with no devices.
- If CONTEXT says they chose something to try last time, ask how it went
  before anything else.
- If the lesson sounds hard, acknowledge that first and offer to leave it
  for today.
- Never script the lesson. The teacher decides.
- You are not a mentor, a manager or a counsellor. Nothing here goes to the
  school. If the teacher describes a learner at risk of harm, say they should
  speak to the school's designated person today.
`;

// >>> CHANGE ME 3: how many replies before the coach wraps up.
const MAX_TURNS = 4;

// ---------------------------------------------------------------------------
// One function that asks Claude a question and returns the text of the answer.
async function askClaude(system, messages, maxTokens) {
  const headers = {
    'content-type': 'application/json',
    'anthropic-version': '2026-10-21',
    'x-api-key': process.env.ANTHROPIC_API_KEY
  };
  // Only needed if your key is not tied to one workspace.
  if (process.env.ANTHROPIC_WORKSPACE_ID) headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Claude said ${response.status}: ${JSON.stringify(data)}`);
  // The answer comes back as a list of blocks. We want the text ones.
  return (data.content || []).filter(block => block.type === 'text').map(block => block.text).join('').trim();
}

// The conversation must start with the teacher and take turns.
function tidy(messages) {
  const list = (Array.isArray(messages) ? messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!list.length || list[0].role !== 'user') list.unshift({ role: 'user', content: '(The teacher has just opened the coach. Greet them and ask your first question.)' });
  return list.slice(-20);
}

// ---------------------------------------------------------------------------
// Vercel calls this function every time the prototype sends a request.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: true, note: 'The Kula coach is here. It answers POST requests from the prototype.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'No ANTHROPIC_API_KEY is set in this project.' });

  const body = req.body || {};
  try {
    // 1. Reminders for a focus the teacher typed in their own words.
    if (body.task === 'focus') {
      const system = `${COACH}
You are helping a teacher who typed what they want to work on in today's lesson.
Choose up to three steps of the lesson where a reminder would help most.
Each reminder is one or two short sentences telling the teacher what to do at
that step, tied to what happens in it. Answer with JSON only, in this shape:
{"label":"three or four words naming the focus","notes":[{"step":1,"note":"..."}]}`;
      const text = await askClaude(system, [{ role: 'user', content: JSON.stringify({ focus: body.text, steps: body.steps }) }], 400);
      const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      return res.status(200).json(json);
    }

    // 2. The conversation with the coach.
    const system = `${COACH}
CONTEXT (from the app, about this teacher and this lesson):
${JSON.stringify({ stage: body.stage, focus: body.focus, lesson: body.lesson, today: body.today, about: body.context }, null, 1).slice(0, 6000)}`;
    const reply = await askClaude(system, tidy(body.messages), 300);
    return res.status(200).json({ reply, closing: (body.turns || 0) >= MAX_TURNS });
  } catch (err) {
    // This shows up in Vercel under Logs. The prototype falls back to its built-in coach.
    console.error('Kula coach error:', err.message);
    return res.status(502).json({ error: 'The coach could not answer.' });
  }
};
