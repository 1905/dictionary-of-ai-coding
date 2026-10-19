export type Language = "en" | "ru";
export type LocalizedEntry = {
  title: string;
  description: string;
  aliases: string[];
  body: string;
  html: string;
};
export type Entry = {
  id: string;
  term: string;
  section: number;
  en: LocalizedEntry;
  ru: LocalizedEntry;
};
export type Section = { id: number; en: string; ru: string; terms: string[] };
export type Dictionary = { sections: Section[]; entries: Entry[] };
