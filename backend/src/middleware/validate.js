const { z } = require('zod');

const themeSchema = z.object({
  tipo: z.string().min(1).max(100),
  vibes: z.array(z.string()).optional(),
  a1: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  a2: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  bg: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  partyTitle: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  imageDescription: z.string().max(300).optional(),
});

const eventSchema = z.object({
  theme: z.record(z.unknown()),
  event: z.object({
    name: z.string().min(1).max(120),
    date: z.string().optional(),
    time: z.string().optional(),
    location: z.string().max(200).optional(),
    hostEmail: z.union([z.string().email(), z.literal('')]).optional(),
    dressCode: z.string().max(100).optional(),
    musicUri: z.string().optional().nullable(),
    videoUri: z.string().optional().nullable(),
    youtubeVideoId: z.string().max(20).optional().nullable(),
  }),
});

const rsvpSchema = z.object({
  name: z.string().min(1).max(100),
  guests: z.number().int().min(0).max(20).optional(),
  msg: z.string().max(500).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues ?? result.error.errors ?? [];
      return res.status(400).json({ error: issues[0]?.message ?? 'Dados inválidos' });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate, themeSchema, eventSchema, rsvpSchema };
