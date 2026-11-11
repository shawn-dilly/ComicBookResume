/**
 * originStory - the seven Origin Story panels: image, caption, action word, bubble and mission text.
 *
 * The wording is the same as OriginStoryPage1 / OriginStoryPage2 (the desktop spreads), listed here so the phone
 * reader can show one panel per screen. Images are the files in public/images (about 3 MB each).
 */

export interface OriginPanel {
  /** File name in public/images. */
  image: string;
  alt: string;
  caption?: string;
  /** Caption style: narrator (yellow box) or location (cream box, uppercase). */
  captionVariant?: 'narrator' | 'location';
  /** Action word drawn over the art. */
  actionWord?: string;
  /** Shout bubble: a lead line and the bold name. */
  shout?: { lead: string; name: string };
  /** Mission box. */
  mission?: { label: string; text: string };
  /** Splash panel: the art sits on top and the text below it. */
  splash?: boolean;
}

export const ORIGIN_HEADING = 'Origin Story';

export const originPanels: readonly OriginPanel[] = [
  {
    image: 'ComicPanel1.png',
    alt: 'Panel 1',
    caption: 'In the beginning... a hero was thrust into battle',
  },
  {
    image: 'ComicPanel2.png',
    alt: 'Panel 2',
    caption: 'He fought against the bugs that overwhelmed the system',
    actionWord: 'POW',
  },
  {
    image: 'ComicPanel3.png',
    alt: 'Panel 3',
    caption: "During the battle, a barrel of toxic waste was dumped on the hero and he couldn't dodge it",
  },
  {
    image: 'ComicPanel4.png',
    alt: 'Panel 4',
    caption: 'Something unexpected happened..',
    captionVariant: 'location',
  },
  {
    image: 'ComicPanel5.png',
    alt: 'Panel 5',
    shout: { lead: 'A new hero arises..', name: 'THE IRON ARCHITECT' },
  },
  {
    image: 'ComicPanel6.png',
    alt: 'Panel 6',
    caption: 'With great power, comes great responsibility to architect a solution for all',
  },
  {
    image: 'ComicPanel7.png',
    alt: 'Panel 7',
    caption: 'Sometime in the future our hero has assembled a team..',
    mission: { label: 'MISSION:', text: 'Build great teams. Shape the vision. Forge the future.' },
    splash: true,
  },
];
