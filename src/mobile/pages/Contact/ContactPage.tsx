/**
 * ContactPage - the back cover: TO BE CONTINUED..., HIRE ME!, and large Email / Call / LinkedIn / GitHub buttons
 * with the values visible as text. Links are real mailto:, tel: and https links (same hrefs as the desktop back cover).
 * The page fits the page area without scrolling: the pieces share the measured height (see the CSS) and the link
 * values are shown without the scheme, `www.` and trailing slash (the hrefs are unchanged).
 */

import { resumeData } from "../../../data/resume";
import { FitText } from "../../components/FitText";
import { PageFace } from "../../components/PageFace";
import { ScrollPage } from "../../components/ScrollPage";
import styles from "./ContactPage.module.css";

interface Props {
  ref?: React.Ref<HTMLElement>;
  onBackToCover: () => void;
}

const ICONS = {
  mail: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.6 2 7.4 6 7.4-6z",
  phone:
    "M6.6 2h3l1.5 5-2 1.5a12 12 0 0 0 5.4 5.4l1.5-2 5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 4.2 2 2 0 0 1 6.6 2z",
  linkedin:
    "M4.5 3A2.5 2.5 0 1 0 4.5 8 2.5 2.5 0 0 0 4.5 3zM2.3 9.5h4.4V22H2.3zM9 9.5h4.2v1.8c.7-1.2 2.1-2.1 4.1-2.1 4 0 4.7 2.6 4.7 6V22h-4.4v-6c0-1.5 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V22H9z",
  github:
    "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.56-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5z",
} as const;

/** The address as shown on the button: no scheme, no `www.`, no trailing slash. */
const shown = (url: string): string =>
  url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export default function ContactPage({ ref, onBackToCover }: Props) {
  const { contact, personal } = resumeData;
  const links: Array<{
    key: string;
    href: string;
    label: string;
    value: string;
    color: string;
    icon: string;
    external?: boolean;
  }> = [
    {
      key: "email",
      href: `mailto:${contact.email}`,
      label: "Email",
      value: contact.email,
      color: "var(--comic-red)",
      icon: ICONS.mail,
    },
  ];
  if (contact.phone) {
    links.push({
      key: "phone",
      href: `tel:${contact.phone.replace(/[^+\d]/g, "")}`,
      label: "Call",
      value: contact.phone,
      color: "var(--comic-green)",
      icon: ICONS.phone,
    });
  }
  if (contact.linkedin) {
    links.push({
      key: "linkedin",
      href: contact.linkedin,
      label: "LinkedIn",
      value: shown(contact.linkedin),
      color: "var(--comic-blue)",
      icon: ICONS.linkedin,
      external: true,
    });
  }
  if (contact.github) {
    links.push({
      key: "github",
      href: contact.github,
      label: "GitHub",
      value: shown(contact.github),
      color: "var(--m-ink)",
      icon: ICONS.github,
      external: true,
    });
  }
  return (
    <PageFace
      ref={ref}
      id="contact"
      label="Contact"
      faceClassName={styles.face}
    >
      <ScrollPage label="Contact" className={styles.scroll}>
        <div className={styles.tbc}>
          <FitText className={styles.tbcText}>TO BE CONTINUED...</FitText>
        </div>
        <div className={styles.hire}>
          <span>HIRE ME!</span>
        </div>
        <div className={styles.links}>
          {links.map((l) => (
            <a
              key={l.key}
              className={styles.link}
              href={l.href}
              {...(l.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              style={{ "--c": l.color } as React.CSSProperties}
            >
              <span className={styles.icon}>
                <Icon d={l.icon} />
              </span>
              <span
                className={styles.text}
                style={{ "--n": l.value.length } as React.CSSProperties}
              >
                <b>{l.label}</b>
                <span>{l.value}</span>
              </span>
            </a>
          ))}
        </div>
        <div className={styles.foot}>
          <span className={styles.copy}>
            &copy; {new Date().getFullYear()} {personal.name} &bull; Built with
            &hearts; and React
          </span>
          <button type="button" className={styles.back} onClick={onBackToCover}>
            &#9650; Back to cover
          </button>
        </div>
      </ScrollPage>
    </PageFace>
  );
}
