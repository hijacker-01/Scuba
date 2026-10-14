import { z } from 'zod';
import { database } from './db';

export const defaultSettings = {
  clubName: 'Havelock Dive Club', phone: '+919434290393', alternatePhone: '+919679572772', instagram: 'havelockdiveclub', location: 'Havelock Island, Andaman Islands',
  about: 'Havelock Dive Club is a scuba diving centre in the Andaman Islands, offering safe, fun, and professional experiences for beginners and experienced divers. Our instructors help you explore vibrant coral reefs and marine life, with safety at the heart of your time underwater.',
  travelDescription: 'Part of the same family, KK Tours and Travels helps with Andaman travel packages, transport, and bookings. Ask about car hire and logistics to bring your island plans together.',
  heroLine1: 'Dive into', heroLine2: 'another world.', heroDescription: 'Explore the Andaman Islands with Havelock Dive Club. Professional diving experiences for beginners and certified divers, in the waters we’ve called home since 2017.', foundingYear: 2017,
  carHireDescription: 'Make room for the journey. Ask the team about a car for your travel dates and the places you want to go.', logisticsDescription: 'Have transport or coordination requirements? Share the details with KK Tours and Travels to discuss the arrangements you need.',
  privacyPolicy: '', cancellationPolicy: '', enquiryEmails: true, changeEmails: true,
};
export type ClubSettings = typeof defaultSettings;
export const settingsInput = z.strictObject({ clubName: z.string().trim().min(2).max(100), phone: z.string().regex(/^\+\d{8,15}$/), alternatePhone: z.string().regex(/^\+\d{8,15}$/), instagram: z.string().regex(/^[\w.]{1,30}$/), location: z.string().trim().min(5).max(200), about: z.string().trim().min(20).max(2000), travelDescription: z.string().trim().min(20).max(2000), privacyPolicy: z.string().max(6000), cancellationPolicy: z.string().max(6000), enquiryEmails: z.boolean(), changeEmails: z.boolean(), heroLine1: z.string().trim().min(2).max(40), heroLine2: z.string().trim().min(2).max(40), heroDescription: z.string().trim().min(20).max(600), foundingYear: z.number().int().min(1900).max(2100), carHireDescription: z.string().trim().min(10).max(1000), logisticsDescription: z.string().trim().min(10).max(1000) });
export async function clubSettings(): Promise<ClubSettings> {
  if (!process.env.MONGODB_URI || /placeholder|xxxxx|your_|replace/i.test(process.env.MONGODB_URI)) return defaultSettings;
  try { const stored = await (await database()).collection('settings').findOne({ key: 'club' }); return settingsInput.parse({ ...defaultSettings, ...Object.fromEntries(Object.keys(defaultSettings).filter(key => stored && key in stored).map(key => [key, stored![key]])) }); }
  catch { return defaultSettings; }
}
