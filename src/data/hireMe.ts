/**
 * hireMe - the wording of the call to action: the Mission Board, the HIRE ME! beacon and the WANTED ad page.
 * Shawn approves every string here; nothing else on the site invents copy for these pieces.
 */

export type MissionId = 'assess' | 'project' | 'unsure';

export interface Mission {
  id: MissionId;
  title: string;
  blurb: string;
  /** Subject line used when this mission is the only one picked. */
  subject: string;
  /** Completes "I'd like to talk about ..." in the drafted message. */
  topic: string;
}

export const MISSIONS: readonly Mission[] = [
  {
    id: 'assess',
    title: 'AI ASSESSMENT',
    blurb: 'Find out where AI can help your team and what to do first.',
    subject: 'AI assessment',
    topic: 'an AI assessment for my team',
  },
  {
    id: 'project',
    title: 'SMALL PROJECT',
    blurb: 'A focused build with a clear finish line.',
    subject: 'Small project',
    topic: 'a small project',
  },
  {
    id: 'unsure',
    title: 'NOT SURE WHERE TO START?',
    blurb: "Reach out and we'll brainstorm.",
    subject: "Let's brainstorm",
    topic: "brainstorming, since I'm not sure where to start",
  },
];

export const BOARD_COPY = {
  heading: 'CHOOSE YOUR MISSION',
  step1Kicker: 'STEP 1 OF 2',
  step2Heading: 'YOUR MESSAGE',
  step2Kicker: 'STEP 2 OF 2',
  pick: 'PICK THIS MISSION',
  draftTag: 'draft message, edit it',
  subject: 'SUBJECT',
  message: 'MESSAGE (EDIT FREELY)',
  nameCompany: 'YOUR NAME / COMPANY (OPTIONAL)',
  namePlaceholder: 'e.g. Alex, Acme Co.',
  email: 'Email Shawn',
  linkedin: 'Message on LinkedIn',
  copy: 'Copy',
  back: 'Back',
  copied: 'Copied!',
  copyBlocked: 'Copy was blocked here. Select the text above and copy it by hand.',
  pow: 'POW!',
} as const;

/** The three prompts the beacon's speech bubble cycles through. */
export const BEACON_PROMPTS: readonly string[] = ['Need an AI assessment?', 'Got a small project?', 'Not sure where to start?'];

export const BEACON_LABEL = 'HIRE ME!';

export const AD_COPY = {
  attention: 'ATTENTION!',
  wanted: 'WANTED:',
  headline: ['TEAMS WITH', 'BIG IDEAS!'],
  sub: 'Choose your mission and send for it today!',
  burst: ['NOW', 'OPEN!'],
  heroBubble: "Let's brainstorm!",
  newTag: 'NEW!',
  couponTitle: 'CLIP THIS COUPON!',
  couponPick: 'Pick your mission(s):',
  couponFine: 'Tick one or more boxes, then clip. Your message gets drafted for you.',
  labels: { assess: 'AI assessment', project: 'Small project', unsure: 'Not sure where to start' } as Record<MissionId, string>,
  send: ['CLIP &', 'SEND!'],
  hint: 'Tick at least one mission first!',
} as const;

/** Subject and body of the drafted message for the picked missions. */
export function draftMessage(picked: readonly MissionId[]): { subject: string; body: string } {
  const list = MISSIONS.filter((m) => picked.includes(m.id));
  const subject = list.map((m) => m.subject).join(' + ');
  const topics = list.map((m) => m.topic);
  const topic = topics.length > 1 ? `${topics.slice(0, -1).join(', ')} and ${topics[topics.length - 1]}` : (topics[0] ?? '');
  const ask = 'What would be a good time to talk?';
  if (list.length === 1 && list[0].id === 'unsure') {
    return { subject, body: `Hi Shawn, I saw your comic resume and I'm not sure where to start, but I'd like to brainstorm with you.\n${ask}` };
  }
  return { subject, body: `Hi Shawn, I saw your comic resume and I'd like to talk about ${topic}.\n${ask}` };
}
