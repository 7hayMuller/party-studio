# ✦ Party Studio

Crie convites de festa digitais com ajuda de IA, compartilhe por link e acompanhe as confirmações de presença (RSVP) em tempo real.

O app roda em **iOS, Android e Web** (Expo / React Native) e tem um backend Node.js que gera o tema do convite com Claude, persiste eventos no Supabase e notifica o anfitrião por e-mail.

---

## Funcionalidades

### Para o anfitrião (host)

**Conta e login**
- Login com Google (OAuth) ou e-mail e senha, via Supabase Auth.
- Sessão persistida com `expo-secure-store` no mobile.

**Criação do convite em 3 etapas**
1. **Tipo e estilo** — tipo da festa (Aniversário, Casamento, Halloween, Junina, Tropical, Carnaval, Formatura, Corporativo, Outro), um ou mais "climas" (Elegante, Animado, Dark, Colorido, Minimalista, Glam, Futurista, Retrô), título e descrição. Título e descrição em branco são criados pela IA.
2. **Paleta e mídia**
   - Cor principal, secundária e de fundo com color picker, ou deixar a IA escolher (✦ IA escolhe!).
   - Imagem de capa: enviar da galeria, descrever em texto ou deixar a IA gerar.
   - Música de fundo: arquivo de áudio ou link do YouTube (o ID do vídeo é detectado automaticamente).
   - Vídeo opcional para o fundo da tela de confirmação.
3. **Dados do evento** — nome, data, horário, local, e-mail para receber confirmações, dress code e imagem de referência do look.

**Geração com IA**
- O backend envia os dados ao Claude, que devolve tokens de estilo e textos: cores, emoji, título, chamadas, texto do botão e mensagens de confirmação no tom da festa.
- A imagem de capa é gerada via Pollinations (modelo Flux) a partir de um prompt criado pela IA, na resolução da tela do dispositivo.
- **Fallback offline:** se o backend falhar, o app aplica um preset local por tipo de festa (Junina, Casamento, Halloween, Tropical, Carnaval ou padrão). A tela indica se o tema veio da IA ou do preset.

**Preview, simulação e regeneração**
- Preview do convite antes de publicar.
- Modo **Simular** para percorrer o fluxo completo como convidado (intro → formulário → confirmação).
- **Regenerar** o tema com 2 regenerações gratuitas por convite; depois disso aparece um paywall de créditos (em breve).

**Publicação e compartilhamento**
- Ao publicar, as mídias são enviadas ao Supabase Storage e o evento recebe um código curto (ex.: `A1B2C3`).
- Link compartilhável `https://party-studio.vercel.app/guest?id=CODIGO` via share nativo, Web Share API ou cópia para a área de transferência.

**Meus convites**
- Lista dos convites criados pelo anfitrião.
- Lista de confirmados com nome, acompanhantes, mensagem e total de pessoas.
- Editar ou excluir convites.

**Notificação por e-mail**
- A cada nova confirmação, o anfitrião recebe um e-mail (Resend) com nome do convidado, acompanhantes, mensagem e total confirmado até o momento.

### Para o convidado

- Abre o convite pelo link, sem login (com deep link para o app no Android e iOS).
- **Intro** com o tema gerado, imagem de capa e trilha sonora (pede permissão para tocar a música, por causa das restrições de autoplay dos navegadores).
- **Formulário** de RSVP: nome, número de acompanhantes (0–20) e mensagem opcional.
- **Confirmação** com vídeo de fundo opcional, animação de estrelas e um **ticket digital** com data, hora, local, dress code e código de barras gerado a partir do nome.
- A confirmação fica salva no dispositivo: ao reabrir o link, o convidado vai direto para o ticket.

### Geral

- **Internacionalização:** português, inglês e espanhol, detectados pelo idioma do dispositivo (padrão: português).
- **Web:** layout em moldura de celular (390×844) no navegador.

---

## Stack

| Camada | Tecnologias |
| --- | --- |
| App | Expo 54, React Native 0.81, React 19, TypeScript, Expo Router, Reanimated, i18next |
| Mídia | expo-audio, expo-video, expo-image-picker, expo-document-picker, react-native-webview (YouTube) |
| Backend | Node.js, Express, Zod, express-rate-limit |
| IA | Anthropic Claude (tema e textos), Pollinations (imagem) |
| Dados e auth | Supabase (Postgres, Auth, Storage) |
| E-mail | Resend |
| Deploy | Vercel (web), Railway (backend), EAS (builds mobile) |

---

## Estrutura

```
app/                  Rotas (Expo Router)
  index.tsx           Redireciona para /host
  host.tsx            Fluxo do anfitrião
  guest.tsx           Fluxo do convidado (?id=CODIGO)
src/
  screens/            HostPanel, HostMenu, LoginScreen, IntroScreen, FormScreen, ConfirmScreen
  components/         PartyTicketAi, ColorPicker, StarBurst, YouTubePlayer, FooterBrand
  services/           ai.ts (API), auth.ts (Supabase Auth), storage.ts (upload de mídia)
  hooks/              useTheme, useBackgroundAudio (web/native)
  context/            AuthContext
  i18n/               pt, en, es
  config/theme.ts     Tema base e tipos
backend/
  server.js           API Express
  src/db/schema.sql   Tabelas e políticas RLS
  src/middleware/     auth, rate limit, validação
```

---

## API

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `POST` | `/theme` | — | Gera tokens de tema com IA |
| `POST` | `/events` | ✓ | Cria um evento e retorna o código |
| `GET` | `/events` | ✓ | Lista os eventos do anfitrião |
| `GET` | `/events/:id` | — | Dados públicos do convite |
| `PATCH` | `/events/:id` | ✓ (dono) | Atualiza o evento |
| `DELETE` | `/events/:id` | ✓ (dono) | Exclui o evento |
| `POST` | `/events/:id/rsvp` | — | Registra uma confirmação |
| `GET` | `/events/:id/rsvps` | ✓ (dono) | Lista as confirmações |
| `GET` | `/health` | — | Health check |

Rotas autenticadas usam `Authorization: Bearer <token do Supabase>`. Limites por IP a cada 15 min: 100 requisições no geral, 10 criações de evento e 30 RSVPs.

---

## Como rodar

### Pré-requisitos

- Node.js 20+
- Projeto no Supabase com login por Google e e-mail habilitado e um bucket público `event-media`
- Chave da API da Anthropic e, opcionalmente, do Resend

### Banco de dados

Rode `backend/src/db/schema.sql` no SQL Editor do Supabase.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha as variáveis
npm run dev
```

| Variável | Descrição |
| --- | --- |
| `ANTHROPIC_API_KEY` | Chave da Anthropic |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key do Supabase |
| `RESEND_API_KEY` | Opcional — sem ela, os e-mails ficam desativados |
| `RESEND_FROM` | Remetente dos e-mails |
| `WEB_URL` | Origem do web app liberada no CORS |
| `PORT` | Porta (padrão `3000`) |

### App

Crie um `.env` na raiz:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_WEB_URL=https://party-studio.vercel.app
```

```bash
npm install
npm start          # ou: npm run web / npm run android / npm run ios
```

---

## Deploy

- **Web:** Vercel, com `npx expo export --platform web` (`vercel.json`).
- **Backend:** Railway com Nixpacks (`railway.json`, `nixpacks.toml`).
- **Mobile:** EAS Build com perfis `development`, `preview` e `production` (`eas.json`).
