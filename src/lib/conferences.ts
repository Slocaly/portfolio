import { getCollection, getEntry } from "astro:content";

const MONTHS = [
  "jan.", "fév.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function fmtDate(ms: number): string {
  const d = new Date(ms);
  return d.getDate() + " " + MONTHS[d.getMonth()];
}

export function fmtDateFull(ms: number): string {
  const d = new Date(ms);
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

export type TalkEvent = {
  conf: string;
  dateMs: number;
  loc: string;
  lat: number;
  lng: number;
  fb: string | null;
  vid: string | null;
};

export type Talk = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  authorLabel: string;
  link: string;
  events: TalkEvent[];
};

export type ConferenceStats = {
  totalTalks: number;
  totalEvents: number;
  totalCities: number;
  minYear: number;
};

export async function getTalks(): Promise<Talk[]> {
  const conferences = await getCollection("conferences");

  const talks = await Promise.all(
    conferences.map(async (conf) => {
      const coSpeaker = conf.data.authors
        ? await getEntry(conf.data.authors)
        : null;

      const shortDesc = (conf.data.abstract ?? "")
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
        .trim()
        .slice(0, 130)
        .concat("...");

      return {
        id: conf.id,
        title: conf.data.title,
        description: shortDesc,
        tags: conf.data.tags,
        authorLabel: coSpeaker
          ? `Lucas Audart & ${coSpeaker.data.name}`
          : "Lucas Audart",
        link: `/conferences/${conf.id}`,
        events: conf.data.events.map((e) => ({
          conf: e.name,
          dateMs: e.date.getTime(),
          loc: e.location.name,
          lat: e.location.lat,
          lng: e.location.lng,
          fb: e.feedbackLink ?? null,
          vid: e.videoLink ?? null,
        })),
      };
    }),
  );

  talks.sort((a, b) => {
    const maxA = Math.max(...a.events.map((e) => e.dateMs));
    const maxB = Math.max(...b.events.map((e) => e.dateMs));
    return maxB - maxA;
  });

  return talks;
}

export function getConferenceStats(talks: Talk[]): ConferenceStats {
  const totalTalks = talks.length;
  const totalEvents = talks.reduce((sum, t) => sum + t.events.length, 0);
  const uniqueCities = new Set(talks.flatMap((t) => t.events.map((e) => e.loc)));
  const totalCities = uniqueCities.size;
  const allYears = talks.flatMap((t) =>
    t.events.map((e) => new Date(e.dateMs).getFullYear()),
  );
  const minYear = Math.min(...allYears);
  return { totalTalks, totalEvents, totalCities, minYear };
}
