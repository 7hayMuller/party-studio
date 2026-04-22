require('dotenv').config();
const express         = require('express');
const cors            = require('cors');
const Anthropic       = require('@anthropic-ai/sdk');
const { Resend }      = require('resend');
const { randomBytes } = require('crypto');

const supabase                        = require('./src/db/supabase');
const { requireAuth }                 = require('./src/middleware/auth');
const { general, createEvent: createEventLimiter, submitRsvp: submitRsvpLimiter } = require('./src/middleware/rateLimiter');
const { validate, themeSchema, eventSchema, rsvpSchema } = require('./src/middleware/validate');

const ALLOWED_ORIGINS = [
  process.env.WEB_URL || 'https://party-studio.vercel.app',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
];

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(general);

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
if (resend) console.log('[email] Resend configurado');
else        console.log('[email] RESEND_API_KEY não definida — emails desativados');

// ─── Email ────────────────────────────────────────────────────────────────────
async function sendRsvpEmail(event, guestName, guestCount, guestMsg, totalPeople) {
  if (!resend || !event.hostEmail) return;
  const eventName = event.name || 'Evento';
  const from      = process.env.RESEND_FROM || 'Party Studio <noreply@partystudio.app>';

  await resend.emails.send({
    from,
    to:      event.hostEmail,
    subject: `🎉 ${guestName} confirmou presença em ${eventName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden">
        <div style="padding:24px 24px 20px;background:linear-gradient(135deg,#1a0a2e,#0a1a2e)">
          <p style="margin:0;font-size:10px;letter-spacing:4px;color:#666">PARTY STUDIO</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:900">Nova confirmação! 🎊</h1>
        </div>
        <div style="padding:24px">
          <p style="font-size:16px;margin:0 0 16px">
            <strong style="color:#00dcff">${guestName}</strong> confirmou presença
            ${guestCount > 0 ? ` + ${guestCount} acompanhante${guestCount > 1 ? 's' : ''}` : ''}.
          </p>
          ${guestMsg ? `
            <div style="background:#ffffff0d;border-left:3px solid #00dcff;padding:12px 16px;border-radius:4px;margin-bottom:20px;font-style:italic;color:#ccc">
              "${guestMsg}"
            </div>` : ''}
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="border-bottom:1px solid #ffffff11">
              <td style="padding:10px 0;color:#666;letter-spacing:1px;font-size:10px">EVENTO</td>
              <td style="padding:10px 0;font-weight:700">${eventName}</td>
            </tr>
            ${event.date ? `<tr style="border-bottom:1px solid #ffffff11">
              <td style="padding:10px 0;color:#666;letter-spacing:1px;font-size:10px">DATA</td>
              <td style="padding:10px 0">${event.date}${event.time ? ' às ' + event.time : ''}</td>
            </tr>` : ''}
            ${event.location ? `<tr style="border-bottom:1px solid #ffffff11">
              <td style="padding:10px 0;color:#666;letter-spacing:1px;font-size:10px">LOCAL</td>
              <td style="padding:10px 0">${event.location}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;color:#666;letter-spacing:1px;font-size:10px">TOTAL CONFIRMADO</td>
              <td style="padding:10px 0;font-weight:700;color:#00dcff">${totalPeople} pessoa${totalPeople !== 1 ? 's' : ''}</td>
            </tr>
          </table>
        </div>
        <div style="padding:16px 24px;background:#ffffff08;font-size:10px;color:#444;letter-spacing:2px">
          PARTY STUDIO · CONFIRMAÇÕES EM TEMPO REAL
        </div>
      </div>
    `,
  });
}

// ─── Theme generation ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é um gerador de tokens de estilo para convites de festa digitais.
Responda SOMENTE com JSON puro, sem markdown, sem explicações.`;

const buildPrompt = ({ tipo, vibes, a1, a2, bg, partyTitle, description, imageDescription }) => `
Crie tokens de texto e estilo para um convite de festa digital.

Tipo da festa: ${tipo}
Clima/vibe: ${vibes.length ? vibes.join(', ') : 'animado'}
Cor principal: ${a1 || 'escolha uma cor vibrante adequada ao tipo da festa'}
Cor secundária: ${a2 || 'escolha uma cor que contraste bem com a cor principal'}
Cor de fundo: ${bg || 'escolha uma cor de fundo bem escura (entre #020202 e #141420) adequada ao tema'}
${partyTitle   ? `Título da festa (usar este): ${partyTitle}` : 'Título da festa: criar um título criativo'}
${description  ? `Descrição da festa (usar esta): ${description}` : 'Descrição: criar uma descrição curta e animada'}
${imageDescription ? `Descrição da imagem de capa: ${imageDescription}` : ''}

Retorne APENAS este JSON:
{
  "bg": "${bg || 'cor escura adequada ao tema'}",
  "card": "#hex levemente mais claro que o bg escolhido",
  "a1": "${a1 || 'cor vibrante adequada ao tema'}",
  "a2": "${a2 || 'cor de contraste adequada ao tema'}",
  "icon": "emoji temático",
  "eyebrow": "CHAMADA CURTA EM CAPS (máx 4 palavras)",
  "titleMain": "PRIMEIRA PARTE DO TÍTULO EM CAPS",
  "titleEm": "SEGUNDA PARTE EM CAPS",
  "partyTitle": "${partyTitle || 'título criativo da festa'}",
  "description": "${description || 'descrição animada e convidativa da festa (1-2 frases)'}",
  "tagline": "frase curta alternativa (máx 8 palavras)",
  "btnTxt": "TEXTO DO BOTÃO (máx 4 palavras)",
  "s2ey": "FRASE DO FORMULÁRIO DE CONFIRMAÇÃO EM CAPS",
  "s3t": "FRASE DE CONFIRMAÇÃO EM CAPS",
  "s3jp": "frase temática curta",
  "s3m": "mensagem de confirmação no tom da festa (máx 15 palavras)",
  "imagePrompt": "prompt em inglês detalhado para imagem de fundo do convite, sem pessoas, sem texto"
}

IMPORTANTE:
- Se uma cor foi fornecida, use-a EXATAMENTE. Se não foi fornecida, escolha a mais adequada ao tipo/vibe da festa
- bg deve ser sempre escuro (entre #020202 e #18181f)
- card deve ser levemente mais claro que bg, mesmo tom
- partyTitle: ${partyTitle ? `use exatamente "${partyTitle}"` : 'crie um título criativo e marcante'}
- description: ${description ? `use exatamente "${description}"` : 'crie uma descrição animada com 1-2 frases'}
- imagePrompt: ${imageDescription
    ? `o host descreveu: "${imageDescription}". Traduza para inglês preservando EXATAMENTE os elementos descritos. Só adicione ao final: no people, no text, no faces`
    : `crie um prompt em inglês de 40-60 palavras descrevendo o CENÁRIO e AMBIENTE da festa do tipo "${tipo}" com clima "${vibes.join(', ') || 'animado'}". Inclua: iluminação (ex: neon glow, warm candlelight, dramatic spotlights), elementos decorativos específicos ao tema, profundidade de campo, atmosfera e mood. Sem pessoas, sem texto, sem rostos. Exemplo de estrutura: "[local/cenário], [elementos decorativos do tema], [iluminação], [atmosfera/mood], [detalhes visuais adicionais]"`}
`;

app.post('/theme', validate(themeSchema), async (req, res) => {
  const { tipo, vibes, a1, a2, bg, partyTitle, description, imageDescription } = req.body;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildPrompt({
          tipo,
          vibes:            vibes || [],
          a1:               a1 || '#ffffff',
          a2:               a2 || '#888888',
          bg:               bg || '#0a0a0a',
          partyTitle:       partyTitle || '',
          description:      description || '',
          imageDescription: imageDescription || '',
        }),
      }],
    });

    const raw    = message.content?.[0]?.text ?? '{}';
    const clean  = raw.replace(/```json|```/g, '').trim();
    const tokens = JSON.parse(clean);

    return res.json(tokens);
  } catch (err) {
    console.error('[/theme] erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Event routes ─────────────────────────────────────────────────────────────
app.post('/events', requireAuth, createEventLimiter, validate(eventSchema), async (req, res) => {
  const { theme, event } = req.body;
  const id = randomBytes(3).toString('hex').toUpperCase();

  const { error } = await supabase
    .from('events')
    .insert({ id, host_id: req.user.id, theme, event });

  if (error) {
    console.error('[/events] erro supabase:', error.message);
    return res.status(500).json({ error: 'Falha ao salvar evento' });
  }

  console.log(`[/events] Evento criado: ${id} — ${event.name || 'sem nome'}`);
  res.json({ eventId: id });
});

app.get('/events', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('id, event, created_at')
    .eq('host_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /events] erro supabase:', error.message);
    return res.status(500).json({ error: 'Falha ao buscar eventos' });
  }
  res.json({ events: data });
});

app.get('/events/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('theme, event')
    .eq('id', req.params.id.toUpperCase())
    .single();

  if (error || !data) return res.status(404).json({ error: 'Evento não encontrado' });
  res.json({ theme: data.theme, event: data.event });
});

app.post('/events/:id/rsvp', submitRsvpLimiter, validate(rsvpSchema), async (req, res) => {
  const eventId = req.params.id.toUpperCase();
  const { name, guests, msg } = req.body;

  const { data: eventData, error: evErr } = await supabase
    .from('events')
    .select('event')
    .eq('id', eventId)
    .single();

  if (evErr || !eventData) return res.status(404).json({ error: 'Evento não encontrado' });

  const { error } = await supabase
    .from('rsvps')
    .insert({ event_id: eventId, name, guests: guests ?? 0, msg: msg ?? '' });

  if (error) {
    console.error('[/rsvp] erro supabase:', error.message);
    return res.status(500).json({ error: 'Falha ao registrar RSVP' });
  }

  console.log(`[/events/${eventId}/rsvp] ${name} confirmou (+ ${guests ?? 0} acompanhantes)`);

  const { count } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  try {
    await sendRsvpEmail(eventData.event, name, guests ?? 0, msg ?? '', count ?? 1);
  } catch (e) {
    console.error('[email] Falha ao enviar:', e.message);
  }

  res.json({ ok: true });
});

app.get('/events/:id/rsvps', requireAuth, async (req, res) => {
  const eventId = req.params.id.toUpperCase();

  const { data: eventData } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single();

  if (!eventData || eventData.host_id !== req.user.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { data: rsvps, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', eventId)
    .order('confirmed_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Falha ao buscar RSVPs' });
  res.json({ rsvps });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`rsvp-backend rodando em http://localhost:${PORT}`));
