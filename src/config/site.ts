/**
 * Facts about me that more than one part of the site uses.
 * Change a link or a number here and the terminal picks it up too.
 */

export const EMAIL = 'jappreets4747@gmail.com';

/** Served from /public, so it is copied as-is into the build. */
export const RESUME_URL = '/Jappreet-Chhabra-Resume.pdf';

export const LINKS = {
  github: 'https://github.com/japp47',
  linkedin: 'https://www.linkedin.com/in/jappreetchhabra/',
  leetcode: 'https://leetcode.com/u/jappreets4747/',
  email: `mailto:${EMAIL}`,
  resume: RESUME_URL,
} as const;

export type LinkName = keyof typeof LINKS;

export const TIME_ZONE = 'Asia/Kolkata';
