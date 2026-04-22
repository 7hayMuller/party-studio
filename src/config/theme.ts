export const BASE_THEME = {
  bg: '#0a0a0a',
  card: '#141414',
  a1: '#ffffff',
  a2: '#888888',
  icon: '🎉',
  eyebrow: 'CONVITE',
  titleMain: 'SUA',
  titleEm: 'FESTA',
  partyTitle: '',
  description: '',
  tagline: 'Configure seu convite no painel do host.',
  btnTxt: 'VER CONVITE',
  s2ey: 'CONFIRMAR PRESENÇA',
  s3t: 'PRESENÇA CONFIRMADA',
  s3jp: '出席確認完了',
  s3m: 'Sua presença foi confirmada!',
  imageUrl: '',
};

export const EVENT_CONFIG = {
  name: 'Minha Festa',
  date: 'A DEFINIR',
  time: '00:00',
  dressCode: 'A definir',
  location: 'A definir',
  hostEmail: '',
  musicUri: '',
  videoUri: '',
  youtubeVideoId: '',
};

export type TicketField = {
  label: string;
  value: string;
};

export type TicketThemeSpec = {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
  imagePrompt: string;
};

export type TicketFrontSpec = {
  leftEyebrow: string;
  headline: string;
  supportingText: string;
};

export type AIGeneratedTicket = {
  ticketTitle: string;
  ticketSubtitle: string;
  eventName: string;
  visualStyle: TicketThemeSpec;
  front: TicketFrontSpec;
  fields: TicketField[];
  serial: string;
  barcodeText: string;
};

export type AppTheme = typeof BASE_THEME;
export type EventConfig = typeof EVENT_CONFIG;
