import { glob } from "astro/loaders";
import { defineCollection, reference, z } from "astro:content";

const articles = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/blog" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.string(),
    description: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }),
    tags: z.array(z.string()),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/authors" }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    company: z.string().optional(),
    link: z.string().url().optional(),
    photo: z.string().url().optional(),
    bio: z.string().optional(),
  }),
});

const ZEvent = z.object({
  name: z.string(),
  date: z.coerce.date(),
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  thumbnail: z.string(),
  photos: z.array(z.string()).optional(),
  feedbackLink: z.string().url().optional(),
  videoLink: z.string().url().optional(),
});

const conferences = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/conferences" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    abstract: z.string().optional(),
    events: z.array(ZEvent),
    authors: reference("authors").optional(),
    tags: z.array(z.string()),
    slides: z.string().url().optional(),
    references: z.array(z.string().url()).optional(),
    thumbnail: image(),
    photos: z.array(image()).optional(),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/education" }),
  schema: z.object({
    years: z.string(),
    diploma: z.string(),
    school: z.string(),
    location: z.string(),
  }),
});

const experiences = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/experiences" }),
  schema: ({ image }) => z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable(),
    location: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    logo: image(),
  }),
});

export const collections = {
  articles,
  conferences,
  authors,
  experiences,
  education,
};
