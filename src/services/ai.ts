import { Dimensions, PixelRatio } from 'react-native';
import { AppTheme, BASE_THEME } from '../config/theme';

const screen = Dimensions.get('window');
const _rawW = Math.round(screen.width  * PixelRatio.get());
const _rawH = Math.round(screen.height * PixelRatio.get());
// Cap em 768px para não travar o Pollinations com resolução física enorme
const IMG_W = Math.min(_rawW, 768);
const IMG_H = Math.min(_rawH, Math.round(768 * (_rawH / _rawW)));

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface ThemeInput {
  tipo: string;
  vibes: string[];
  a1: string;
  a2: string;
  bg: string;
  partyTitle: string;
  description: string;
  imageDescription: string;
  imageFile: string | null;
}

export async function generateTheme(input: ThemeInput): Promise<AppTheme> {
  const res = await fetch(`${API_URL}/theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo:             input.tipo,
      vibes:            input.vibes,
      a1:               input.a1,
      a2:               input.a2,
      bg:               input.bg,
      partyTitle:       input.partyTitle,
      description:      input.description,
      imageDescription: input.imageDescription,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const tokens = await res.json();

  let imageUrl = '';
  if (input.imageFile) {
    imageUrl = input.imageFile;
  } else {
    const base = input.imageDescription
      ? `${input.imageDescription}, no people, no text, no faces`
      : (tokens.imagePrompt ?? '');

    if (base) {
      const styled = `${base}, photorealistic, cinematic lighting, dramatic atmosphere, `
        + `rich colors, highly detailed, editorial photography, shot on Sony A7R IV, 8k`;
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(styled)}`
        + `?width=${IMG_W}&height=${IMG_H}&nologo=true&model=flux&enhance=true`;
    }
  }

  return { ...BASE_THEME, ...tokens, bg: input.bg || tokens.bg, imageUrl };
}

export function localTheme(input: ThemeInput): AppTheme {
  const tipo        = input.tipo.toLowerCase();
  const a1          = input.a1 || '#00dcff';
  const a2          = input.a2 || '#ff0080';
  const bg          = input.bg || '#0a0a0a';
  const imageUrl    = input.imageFile || '';
  const partyTitle  = input.partyTitle;
  const description = input.description;

  if (tipo.includes('junin'))
    return { ...BASE_THEME, bg, card: '#160e00', a1, a2, icon: '🌽', eyebrow: 'ARRASTA PRA CÁ', titleMain: 'FESTA', titleEm: 'JUNINA', partyTitle, description, tagline: 'Bora xotar até o sol nascer!', btnTxt: 'VEM FESTEJAR', s2ey: 'QUEM VAI ARRASTAR?', s3t: 'CONFIRMADO, OXENTE!', s3jp: 'お祭り万歳', s3m: 'Bote o chapéu e vem arrastar o pé!', imageUrl };
  if (tipo.includes('casamento'))
    return { ...BASE_THEME, bg, card: '#0f0f0c', a1, a2, icon: '🌹', eyebrow: 'CELEBRAÇÃO ESPECIAL', titleMain: 'NOSSA', titleEm: 'UNIÃO', partyTitle, description, tagline: 'Uma celebração inesquecível te aguarda.', btnTxt: 'VER CONVITE', s2ey: 'CONFIRME SUA PRESENÇA', s3t: 'PRESENÇA CONFIRMADA', s3jp: '永遠の愛', s3m: 'Sua presença foi confirmada. Obrigado!', imageUrl };
  if (tipo.includes('halloween'))
    return { ...BASE_THEME, bg, card: '#0d0420', a1, a2, icon: '💀', eyebrow: 'DEAD ZONE PARTY', titleMain: 'HALLOWEEN', titleEm: 'DARK', partyTitle, description, tagline: 'A zona morta te chama. Vai encarar?', btnTxt: 'ENTRAR SE OUSAR', s2ey: 'CONFIRME SE OUSAR', s3t: 'ALMA REGISTRADA', s3jp: '死の舞踏', s3m: 'Apareça... se tiver coragem.', imageUrl };
  if (tipo.includes('tropical'))
    return { ...BASE_THEME, bg, card: '#061806', a1, a2, icon: '🌴', eyebrow: 'TROPICAL PARTY', titleMain: 'VERÃO', titleEm: 'FEST', partyTitle, description, tagline: 'O synth toca, a areia aquece — bora!', btnTxt: 'VEM PRA PISTA', s2ey: 'QUEM VEM?', s3t: 'NA LISTA!', s3jp: '夏の波', s3m: 'Radar tropical te detectou!', imageUrl };
  if (tipo.includes('carnaval'))
    return { ...BASE_THEME, bg, card: '#130418', a1, a2, icon: '🎭', eyebrow: 'BRILHA MAIS', titleMain: 'CARNAVAL', titleEm: 'FOLIA', partyTitle, description, tagline: 'O bloco saiu e seu nome está na lista!', btnTxt: 'ENTRAR NA FOLIA', s2ey: 'QUEM VEM SAMBAR?', s3t: 'FOLIA CONFIRMADA!', s3jp: 'ブラジルの魂', s3m: 'Bota o adereço e vem brilhar!', imageUrl };

  return { ...BASE_THEME, bg, a1, a2, partyTitle, description, imageUrl };
}


export type TicketRequest = {
  tipo: string;
  vibes?: string[];
  a1?: string;
  a2?: string;
  bg?: string;
  partyTitle?: string;
  description?: string;
  imageDescription?: string;
  guestName: string;
  date: string;
  time: string;
  location: string;
  dressCode: string;
  hostPrompt?: string;
};

export type TicketResponse = {
  ticketTitle: string;
  ticketSubtitle: string;
  eventName: string;
  visualStyle: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
    imagePrompt: string;
  };
  front: {
    leftEyebrow: string;
    headline: string;
    supportingText: string;
  };
  fields: { label: string; value: string }[];
  serial: string;
  barcodeText: string;
};

export async function generateTicket(data: TicketRequest): Promise<TicketResponse> {
  const res = await fetch('https://seu-backend.com/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao gerar ticket');
  return res.json();
}

// ─── Event publishing & RSVP ──────────────────────────────────────────────────

export async function publishEvent(theme: AppTheme, event: object, token?: string): Promise<string> {
  const res = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ theme, event }),
  });
  if (!res.ok) throw new Error('Falha ao publicar evento');
  const { eventId } = await res.json();
  return eventId as string;
}

export async function fetchMyEvents(token: string): Promise<{ id: string; event: any; created_at: string }[]> {
  const res = await fetch(`${API_URL}/events`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao buscar eventos');
  const { events } = await res.json();
  return events;
}

export async function fetchEventRsvps(eventId: string, token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/events/${eventId}/rsvps`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao buscar RSVPs');
  const { rsvps } = await res.json();
  return rsvps;
}

export async function loadEvent(eventId: string): Promise<{ theme: AppTheme; event: object }> {
  const res = await fetch(`${API_URL}/events/${eventId}`);
  if (!res.ok) throw new Error('Evento não encontrado');
  return res.json();
}

export async function submitRsvp(eventId: string, name: string, guests: number, msg: string): Promise<void> {
  await fetch(`${API_URL}/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, guests, msg }),
  });
}