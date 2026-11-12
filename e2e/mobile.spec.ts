import { test, expect, type Page } from '@playwright/test';

/**
 * Phone layout tests: the single-page reader at 390x844 with touch.
 * The phone opens on the cover at rest: there is no cover drop and no web layer on this layout.
 */

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

const PAGE_IDS = [
  'cover',
  'personnel-file',
  'origin-story',
  'powers-abilities',
  'battle-grodivo',
  'battle-peopleready',
  'battle-ezlinks',
  'battle-early-career',
  'mighty-allies',
  'contact',
];

const TAB_ORDER = ['Leadership', 'Agentic Development', 'Architecture', 'DevOps & SRE', 'Languages & Data'];

const FORBIDDEN = [
  /CHAPTER \d/i,
  /THREAT LEVEL/i,
  /ENLISTED/,
  /FLASHBACK/i,
  /OBJ-\d+/,
  /STATUS:/i,
  /SEEKING NEW ADVENTURES/i,
  /FIELD NOTES/i,
  /TRAINING/i,
  /\bLEGENDARY\b/,
  /\bHEROIC\b/,
  /\bSEASONED\b/,
  /\bRISING\b/,
  /THE END\?/i,
  /NOT QUITE/i,
  /About this concept/i,
  /HOLOGRAPHIC PROJECTION/i,
  /POWER LEVELS/i,
  /CONFIDENTIAL/i,
  /FILE 001/i,
];

/** The desktop layout plays its own intro; the resize test mutes it (same sessionStorage key as the desktop). */
async function skipDesktopIntro(page: Page): Promise<void> {
  await page.addInitScript(() => window.sessionStorage.setItem('resume-web-catch-played', '1'));
}

async function open(page: Page, hash = ''): Promise<void> {
  await page.goto(`/${hash}`);
  await page.waitForSelector('[data-layout="mobile"]');
}

const count = (page: Page) => page.getByTestId('reader-count');

async function jump(page: Page, id: string): Promise<void> {
  const n = PAGE_IDS.indexOf(id) + 1;
  await page.evaluate((h) => {
    window.location.hash = h;
  }, id);
  await expect(count(page)).toHaveText(`${n}/10`);
  await page.waitForTimeout(450);
}

/** A touch drag through the Chrome DevTools protocol (real touch events, so pointer events and touch-action apply). */
async function swipe(page: Page, from: [number, number], to: [number, number], steps = 10): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: point(...from),
  });
  for (let i = 1; i <= steps; i++) {
    const x = from[0] + ((to[0] - from[0]) * i) / steps;
    const y = from[1] + ((to[1] - from[1]) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: point(x, y),
    });
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await cdp.detach();
}

/** Every fitted heading, after walking through all pages, still has at least half its CSS size. */
async function expectHeadingsFitted(page: Page): Promise<void> {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.waitForSelector('[data-layout="mobile"]');
  for (const id of PAGE_IDS.slice(1)) await jump(page, id);
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-fit]')].map((el) => {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-fit');
      clone.style.fontSize = '';
      clone.style.visibility = 'hidden';
      el.parentElement?.appendChild(clone);
      const css = parseFloat(getComputedStyle(clone).fontSize);
      clone.remove();
      return { page: el.closest('section')?.id ?? '', text: el.textContent ?? '', css, now: parseFloat(getComputedStyle(el).fontSize) };
    }),
  );
  expect(sizes.length).toBeGreaterThan(5);
  for (const s of sizes) expect(s.now, `${s.page}: ${s.text}`).toBeGreaterThanOrEqual(s.css * 0.5);
}

test.describe('Phone layout', () => {
  test('every fitted heading keeps at least half its CSS size at 360x640', async ({ page }) => {
    await expectHeadingsFitted(page);
  });

  test('opens on the cover at rest: interactive at once, no web canvas, no intro state', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('.app-container');
    await expect(root).toHaveAttribute('data-layout', 'mobile');
    await expect(root).not.toHaveAttribute('data-web-state', /.*/);
    await expect(count(page)).toHaveText('1/10');
    await expect(page.locator('canvas')).toHaveCount(0);
    // The desktop background fly-by is never mounted on the phone layout
    await expect(page.locator('[data-flyby]')).toHaveCount(0);
    await page.waitForTimeout(2500);
    await expect(page.locator('[data-flyby]')).toHaveCount(0);
    // The cover is interactive immediately: its button and the bar are usable straight away.
    const tap = page.getByRole('button', { name: 'TAP TO OPEN' });
    await expect(tap).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Page navigation' })).toBeInViewport();
    // At rest: the cover is not mid-transform.
    expect(await page.locator('#pg-cover').evaluate((el) => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await tap.click({ force: true });
    await expect(count(page)).toHaveText('2/10');
  });

  test('tapping the cover opens to the next page', async ({ page }) => {
    await open(page);
    await page.touchscreen.tap(195, 300);
    await expect(count(page)).toHaveText('2/10');
    await expect(page.locator('#pg-personnel-file')).toHaveClass(/is-cur/);
  });

  test('next and back buttons, and a swipe, turn pages; a vertical swipe scrolls without turning', async ({ page }) => {
    await open(page, '#personnel-file');
    await expect(count(page)).toHaveText('2/10');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(count(page)).toHaveText('3/10');
    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(count(page)).toHaveText('2/10');
    // swipe left turns forward, swipe right turns back
    await swipe(page, [330, 420], [50, 430]);
    await expect(count(page)).toHaveText('3/10');
    await page.waitForTimeout(800);
    await swipe(page, [60, 420], [340, 430]);
    await expect(count(page)).toHaveText('2/10');
    await page.waitForTimeout(800);
    // a vertical swipe on a long page scrolls it and does not turn
    await jump(page, 'battle-grodivo');
    const scroller = page.locator('#pg-battle-grodivo [data-scroller]');
    expect(await scroller.evaluate((el) => el.scrollTop)).toBe(0);
    await swipe(page, [200, 600], [205, 200]);
    await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(50);
    await expect(count(page)).toHaveText('5/10');
  });

  test('contents sheet jumps to Powers; tabs are in data order; hologram shows four towers', async ({ page }) => {
    await open(page, '#personnel-file');
    await page.getByRole('button', { name: /^Contents/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Contents' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close contents' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Powers & Abilities' }).click();
    await expect(count(page)).toHaveText('4/10');
    await expect(dialog).toBeHidden();

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveText(TAB_ORDER);
    await page.getByRole('tab', { name: 'Agentic Development' }).click();
    await expect(page.getByRole('tab', { name: 'Agentic Development' })).toHaveAttribute('aria-selected', 'true');
    for (const skill of ['Claude Code', 'Multi-Agent Workflows', 'RAG / Bedrock', 'AI Development']) {
      await expect(
        page.getByRole('img', {
          name: new RegExp(`^${skill.replace(/[/]/g, '\\/')}, level`),
        }),
      ).toHaveCount(1);
    }

    await page.getByRole('button', { name: 'Project hologram' }).click();
    const towers = page.getByRole('button', { name: /, level \d+ of 10$/ });
    await expect(towers).toHaveCount(4);
    await expect(towers.first()).toBeVisible({ timeout: 6000 });
    for (let i = 0; i < 4; i++) await expect(towers.nth(i)).toBeVisible();
    await towers.nth(1).click();
    await expect(page.getByRole('status').filter({ hasText: 'Multi-Agent Workflows' })).toBeVisible();
    await page.getByRole('button', { name: 'End projection' }).click();
    await expect(towers.first()).toBeHidden({ timeout: 4000 });
  });

  test('the contact page has the email, phone, LinkedIn and GitHub as text and real links', async ({ page }) => {
    await open(page, '#contact');
    const links = page.locator('#pg-contact a');
    await expect(links).toHaveCount(4);
    const hrefs = await links.evaluateAll((as) => as.map((a) => [(a as HTMLAnchorElement).getAttribute('href'), (a as HTMLElement).innerText]));
    expect(hrefs[0][0]).toBe('mailto:shawndillenbeck@gmail.com');
    expect(hrefs[0][1]).toContain('shawndillenbeck@gmail.com');
    expect(hrefs[1][0]).toBe('tel:3314540486');
    expect(hrefs[1][1]).toContain('(331) 454-0486');
    expect(hrefs[2][0]).toBe('https://www.linkedin.com/in/shawn-dillenbeck/');
    expect(hrefs[2][1]).toContain('linkedin.com/in/shawn-dillenbeck');
    expect(hrefs[3][0]).toBe('https://github.com/shawn-dilly');
    expect(hrefs[3][1]).toContain('github.com/shawn-dilly');
    await expect(page.getByRole('button', { name: 'Hire me: jump to contact' })).toBeHidden();
    await expect(page.locator('#pg-contact')).toContainText('TO BE CONTINUED...');
    await expect(page.locator('#pg-contact')).toContainText('HIRE ME!');
  });

  for (const size of [
    { width: 390, height: 844 },
    { width: 360, height: 740 },
  ]) {
    test(`no horizontal overflow on any page at ${size.width}`, async ({ page }) => {
      await page.setViewportSize(size);
      await open(page);
      for (const id of PAGE_IDS) {
        await jump(page, id);
        const result = await page.evaluate((pid) => {
          const doc = document.scrollingElement as HTMLElement;
          const scroller = document.querySelector<HTMLElement>(`#pg-${pid} [data-scroller]`);
          return {
            doc: doc.scrollWidth - window.innerWidth,
            scroller: scroller ? scroller.scrollWidth - scroller.clientWidth : 0,
          };
        }, id);
        expect(result.doc, `${id} document`).toBeLessThanOrEqual(0);
        expect(result.scroller, `${id} content`).toBeLessThanOrEqual(1);
      }
    });
  }

  test('no invented copy: none of the removed strings appear on any page', async ({ page }) => {
    await open(page);
    let all = '';
    for (const id of PAGE_IDS) {
      await jump(page, id);
      all += `\n${await page.locator('.app-container').evaluate((el) => (el as HTMLElement).innerText)}`;
      if (id === 'origin-story') {
        // step through the panels
        for (let i = 0; i < 6; i++) {
          await page.getByRole('button', { name: 'Next page' }).click();
          await page.waitForTimeout(150);
          all += `\n${await page.locator('#pg-origin-story').evaluate((el) => (el as HTMLElement).innerText)}`;
        }
      }
      if (id === 'powers-abilities') {
        await page.getByRole('button', { name: 'Project hologram' }).click();
        await page.waitForTimeout(2500);
        await page.locator('[data-tower="0"] [role=button]').click();
        all += `\n${await page.locator('#pg-powers-abilities').evaluate((el) => (el as HTMLElement).innerText)}`;
        await page.getByRole('button', { name: 'End projection' }).click();
      }
    }
    for (const re of FORBIDDEN) expect(all, String(re)).not.toMatch(re);
    // RANK UP! is the desktop's wording and sits only between role cards (two of three).
    expect(all.match(/RANK UP!/g)?.length).toBe(2);
    // aliases only ever appear in the desktop's "a.k.a." form, from the data
    const aliases = (await page.locator('#pg-mighty-allies em').allTextContents()).map((t) => t.trim());
    expect(aliases.length).toBeGreaterThan(0);
    for (const a of aliases) expect(a).toMatch(/^a\.k\.a\. /);
  });

  test('no AudioContext is constructed during a full walk-through', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown> & {
        __audio: number;
      };
      w.__audio = 0;
      for (const name of ['AudioContext', 'webkitAudioContext', 'OfflineAudioContext']) {
        const Orig = w[name] as (new (...a: unknown[]) => unknown) | undefined;
        if (!Orig) continue;
        w[name] = function (...args: unknown[]) {
          w.__audio += 1;
          return new Orig(...args);
        };
      }
    });
    await page.goto('/');
    await page.waitForSelector('[data-layout="mobile"]');
    await page.touchscreen.tap(195, 300);
    for (const id of PAGE_IDS.slice(1)) await jump(page, id);
    await jump(page, 'powers-abilities');
    await page.getByRole('button', { name: 'Project hologram' }).click();
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => (window as unknown as { __audio: number }).__audio)).toBe(0);
  });

  test('resizing from 390 to 1280 wide swaps to the desktop layout and back', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
    });
    await skipDesktopIntro(page);
    await open(page, '#mighty-allies');
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.app-container')).toHaveAttribute('data-layout', 'desktop');
    await expect(page.locator('.comic-wrapper')).toBeVisible();
    await expect(page.locator('[data-flyby]')).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.app-container')).toHaveAttribute('data-layout', 'mobile');
    await expect(page.locator('[data-flyby]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('Phone layout with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('every fitted heading keeps at least half its CSS size at 360x640', async ({ page }) => {
    await expectHeadingsFitted(page);
  });

  test('a page turn still works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(count(page)).toHaveText('2/10');
    await swipe(page, [330, 420], [50, 430]);
    await expect(count(page)).toHaveText('3/10');
  });
});

test.describe('Phone layout: powers strip, hologram and contact fit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('the category strip shows a scroll hint that follows the scroll position', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await open(page, '#powers-abilities');
    const strip = page.getByRole('tablist', { name: 'Skill categories' });
    const hints = page.getByRole('button', { name: 'Scroll categories' });
    const side = async (): Promise<string[]> => {
      const box = await strip.boundingBox();
      const mid = (box?.x ?? 0) + (box?.width ?? 0) / 2;
      const out: string[] = [];
      for (const h of await hints.all()) {
        const b = await h.boundingBox();
        out.push((b?.x ?? 0) < mid ? 'left' : 'right');
      }
      return out.sort();
    };
    // At the start only the right hint shows.
    await expect.poll(side).toEqual(['right']);
    // Part way: both.
    await strip.evaluate((el) => (el.scrollLeft = 120));
    await expect.poll(side).toEqual(['left', 'right']);
    // The end: only the left one.
    await strip.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await expect.poll(side).toEqual(['left']);
    // The chevron moves the strip, and the first tab hides the left hint again.
    const before = await strip.evaluate((el) => el.scrollLeft);
    await hints.click();
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeLessThan(before);
    await strip.evaluate((el) => (el.scrollLeft = 0));
    await expect.poll(side).toEqual(['right']);
    // Choosing a tab scrolls it into view.
    await page.getByRole('tab').last().click();
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(40);
  });

  for (const size of [
    { width: 360, height: 740 },
    { width: 430, height: 932 },
  ]) {
    test(`the hologram is centred, fills the stage and keeps its labels on screen at ${size.width} wide`, async ({ page }) => {
      await page.setViewportSize(size);
      await open(page, '#powers-abilities');
      await page.getByRole('button', { name: 'Project hologram' }).click();
      const stage = page.locator('[data-holo-stage]');
      const tabs = page.getByRole('tab');
      const n = await tabs.count();
      for (let i = 0; i < n; i++) {
        await tabs.nth(i).click();
        const plates = page.locator('[data-holo-stage] [role=button]');
        await expect(plates).toHaveCount(4);
        await expect(plates.last()).toBeVisible({ timeout: 6000 });
        await page.waitForTimeout(800);
        const m = await page.evaluate(() => {
          const rect = (e: Element) => {
            const b = e.getBoundingClientRect();
            return { l: b.left, r: b.right, t: b.top, b: b.bottom };
          };
          const hs = document.querySelector('[data-holo-stage]') as HTMLElement;
          const pl = [...hs.querySelectorAll('[role=button]')].map(rect);
          const bodies = [...hs.querySelectorAll('[class*=body]')].map(rect);
          const all = [...pl, ...bodies];
          return {
            stage: rect(hs),
            group: {
              l: Math.min(...all.map((r) => r.l)),
              r: Math.max(...all.map((r) => r.r)),
            },
            plates: pl,
            vw: window.innerWidth,
          };
        });
        const stageW = m.stage.r - m.stage.l;
        const groupCentre = (m.group.l + m.group.r) / 2;
        const stageCentre = (m.stage.l + m.stage.r) / 2;
        expect(Math.abs(groupCentre - stageCentre), `category ${i}: group centre`).toBeLessThanOrEqual(4);
        expect((m.group.r - m.group.l) / stageW, `category ${i}: group width`).toBeGreaterThanOrEqual(0.8);
        for (const p of m.plates) {
          expect(p.l, `category ${i}: label left edge`).toBeGreaterThanOrEqual(0);
          expect(p.r, `category ${i}: label right edge`).toBeLessThanOrEqual(m.vw);
          expect(p.t, `category ${i}: label top edge`).toBeGreaterThanOrEqual(m.stage.t - 1);
        }
        for (let a = 0; a < m.plates.length; a++) {
          for (let b = a + 1; b < m.plates.length; b++) {
            const A = m.plates[a];
            const B = m.plates[b];
            const apart = A.r <= B.l || B.r <= A.l || A.b <= B.t || B.b <= A.t;
            expect(apart, `category ${i}: labels ${a} and ${b} overlap`).toBe(true);
          }
        }
      }
      await expect(stage).toBeVisible();
    });
  }

  for (const size of [
    { width: 360, height: 640 },
    { width: 390, height: 700 },
  ]) {
    test(`the contact page fits without scrolling at ${size.width}x${size.height}, without the tagline`, async ({ page }) => {
      await page.setViewportSize(size);
      await open(page, '#contact');
      const scroller = page.locator('#pg-contact [data-scroller]');
      const dims = await scroller.evaluate((el) => ({
        sh: el.scrollHeight,
        ch: el.clientHeight,
      }));
      expect(dims.sh).toBeLessThanOrEqual(dims.ch + 1);
      await expect(page.locator('#pg-contact')).not.toContainText('Forging Teams');
      // Everything from TO BE CONTINUED to BACK TO COVER is on screen, and the links stay easy to tap.
      for (const el of [page.getByText('TO BE CONTINUED...'), page.getByRole('button', { name: /Back to cover/i })]) {
        await expect(el).toBeInViewport({ ratio: 1 });
      }
      for (const a of await page.locator('#pg-contact a').all()) {
        await expect(a).toBeInViewport({ ratio: 1 });
        expect((await a.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    });
  }
});
