import { test, expect, type Page } from '@playwright/test';

test.describe('Comic Book Resume - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to render
    await page.waitForSelector('.app-container', { timeout: 10000 });
  });

  test('app loads and renders cover page', async ({ page }) => {
    // App container exists
    await expect(page.locator('.app-container')).toBeVisible();
    // Comic wrapper exists
    await expect(page.locator('.comic-wrapper')).toBeVisible();
    // Click hint shows on cover
    await expect(page.locator('.click-hint')).toBeVisible();
  });

  test('cover page has essential content', async ({ page }) => {
    // Check for hero name or title text
    const pageContent = await page.textContent('.app-container');
    expect(pageContent).toContain('Shawn');
  });

  test('clicking the book opens it', async ({ page }) => {
    // Click on the comic wrapper to open the book
    await page.locator('.comic-wrapper').click();
    // Wait for open state
    await page.waitForTimeout(1500);
    // Keyboard hints should appear when book is open
    const keyboardHints = page.locator('.keyboard-hints');
    await expect(keyboardHints).toBeVisible({ timeout: 5000 });
    // Click hint should disappear
    await expect(page.locator('.click-hint')).not.toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    // Open the book first
    await page.locator('.comic-wrapper').click();
    await page.waitForTimeout(1500);

    // Get initial page indicator text
    const indicator = page.locator('.page-indicator');
    await expect(indicator).toBeVisible({ timeout: 5000 });
    const initialText = await indicator.textContent();

    // Press right arrow to flip page
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);

    // Page indicator should have changed
    const newText = await indicator.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForSelector('.app-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Filter out known benign errors (e.g., favicon)
    const realErrors = errors.filter(e => !e.includes('favicon'));
    expect(realErrors).toHaveLength(0);
  });

  test('pages render without crashing after multiple flips', async ({ page }) => {
    // Open book
    await page.locator('.comic-wrapper').click();
    await page.waitForTimeout(1500);

    // Flip through several pages
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
    }

    // App should still be functioning
    await expect(page.locator('.app-container')).toBeVisible();
    const indicator = page.locator('.page-indicator');
    await expect(indicator).toBeVisible();
  });
});

test.describe('Comic Book Resume - Web catch', () => {
  test('book is caught and held within 5s of load', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('.app-container');
    await expect(app).toBeVisible();
    await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 5000 });
    await expect(app).toHaveAttribute('data-web-lines', '4');
  });

  test('open book keeps all four lines after five page turns', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 5000 });

    await page.locator('.comic-wrapper').click();
    await expect(page.locator('.keyboard-hints')).toBeVisible({ timeout: 5000 });
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
    }

    await expect(app).toHaveAttribute('data-web-state', 'held');
    await expect(app).toHaveAttribute('data-web-lines', '4');
  });

  test('a page turn lets go of the corners on the side it leaves, then all four re-attach', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 5000 });
    await page.locator('.comic-wrapper').click();
    await expect(page.locator('.keyboard-hints')).toBeVisible({ timeout: 5000 });
    await expect(app).toHaveAttribute('data-web-lines', '4', { timeout: 5000 });

    // Record every value the attribute takes while the page turns.
    await page.evaluate(() => {
      const el = document.querySelector('.app-container');
      const seen: string[] = [];
      (window as unknown as { __lines: string[] }).__lines = seen;
      new MutationObserver(() => seen.push(el?.getAttribute('data-web-lines') ?? '')).observe(el as Element, {
        attributes: true,
        attributeFilter: ['data-web-lines'],
      });
    });
    await page.keyboard.press('ArrowRight');
    const readSeen = (): Promise<string[]> =>
      page.evaluate(() => (window as unknown as { __lines: string[] }).__lines.slice());
    // The two right corners let go during the turn, then all four are back.
    await expect.poll(readSeen, { timeout: 5000 }).toContain('2');
    await expect.poll(async () => (await readSeen()).at(-1), { timeout: 5000 }).toBe('4');
    await expect(app).toHaveAttribute('data-web-lines', '4');
  });

  test('flipping back and forth quickly never leaves a corner detached', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 5000 });
    await page.locator('.comic-wrapper').click();
    await expect(page.locator('.keyboard-hints')).toBeVisible({ timeout: 5000 });
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft');
      await page.waitForTimeout(150);
    }
    await expect(app).toHaveAttribute('data-web-state', 'held');
    await expect(app).toHaveAttribute('data-web-lines', '4', { timeout: 5000 });
  });

  test('the book is clickable the moment it becomes held', async ({ page }) => {
    // Any 3D tilt left on the book when `held` starts makes hit testing flip between the
    // click zone and the artwork under it, which loses a click. Sample it in the same task.
    await page.addInitScript(() => {
      const w = window as unknown as { __hitAtHeld?: string };
      new MutationObserver(() => {
        const app = document.querySelector('.app-container');
        if (app?.getAttribute('data-web-state') === 'held' && w.__hitAtHeld === undefined) {
          const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
          w.__hitAtHeld = el ? String(el.className) : 'none';
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-web-state'] });
    });
    await page.goto('/');
    await page.waitForFunction(() => (window as unknown as { __hitAtHeld?: string }).__hitAtHeld !== undefined, null, {
      timeout: 6000,
    });
    const hit = await page.evaluate(() => (window as unknown as { __hitAtHeld?: string }).__hitAtHeld);
    expect(hit).toContain('clickZone');
  });

  test('a key pressed during the drop opens the book once it is held', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-container');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.keyboard-hints')).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Comic Book Resume - Web catch with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('starts held immediately with all lines attached', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('.app-container');
    await expect(app).toBeVisible();
    await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 500 });
    await expect(app).toHaveAttribute('data-web-lines', '4', { timeout: 500 });
    await expect(page.locator('.click-hint')).toBeVisible({ timeout: 500 });
  });
});

test.describe('Comic Book Resume - hero fly-by', () => {
  test('appears after the book is held, ignores input, sits under the book, and the first pass rises from below then crosses', async ({ page }) => {
    type Sample = { pass: string; kind: string; phase: string; dir: string; art: string; flourish: string; rot: number; x: number; y: number };
    await page.addInitScript(() => {
      const log: Sample[] = [];
      (window as unknown as { __flybyLog: Sample[] }).__flybyLog = log;
      const tick = (): void => {
        const root = document.querySelector<HTMLElement>('[data-flyby]');
        const el = document.querySelector<HTMLElement>('[data-flyby-sprite]');
        if (root && el && getComputedStyle(el).visibility === 'visible') {
          const r = el.getBoundingClientRect();
          const d = root.dataset;
          // Rotation of the prone art in the figure's own frame (degrees; the mirror is on the parent)
          const m = new DOMMatrix(getComputedStyle(el.querySelector('[data-pose="fly"]')!).transform);
          const rot = (Math.atan2(m.b, m.a) * 180) / Math.PI;
          log.push({
            pass: d.flybyPass ?? '',
            kind: d.flybyKind ?? '',
            phase: d.flybyPhase ?? '',
            dir: d.flybyDir ?? '',
            art: d.flybyArt ?? '',
            flourish: d.flybyFlourish ?? '',
            rot,
            x: r.x + r.width / 2,
            y: r.y + r.height / 2,
          });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto('/?flyby=fast');
    const app = page.locator('.app-container');
    const flyby = page.locator('[data-flyby]');
    // Not during the opening drop
    await expect(flyby).toHaveCount(1);
    expect(await flyby.getAttribute('data-flyby-pass')).toBeNull();
    await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 10000 });
    await expect(flyby).toHaveAttribute('aria-hidden', 'true');
    expect(await flyby.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    expect(await page.locator('[data-flyby-sprite]').evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    // The art is the real panel cut-outs: four decorative images, no alt text
    const imgs = page.locator('[data-flyby-sprite] img');
    await expect(imgs).toHaveCount(4);
    for (const img of await imgs.all()) {
      expect(await img.getAttribute('alt')).toBe('');
      expect(await img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);
    }
    // Layering: above the page background (z-index 0 like the back web canvas), below the book wrapper
    const z = await page.evaluate(() => ({
      flyby: Number(getComputedStyle(document.querySelector('[data-flyby]')!).zIndex),
      book: Number(getComputedStyle(document.querySelector('.comic-wrapper')!).zIndex),
    }));
    expect(z.flyby).toBeLessThan(z.book);

    const { width: vw, height: vh } = page.viewportSize()!;
    // The in-page recorder (installed before load) logged every frame of every pass, so slow polling cannot miss anything
    await expect(flyby).toHaveAttribute('data-flyby-pass', '3', { timeout: 40000 });
    const log = await page.evaluate(() => (window as unknown as { __flybyLog: Sample[] }).__flybyLog);
    const first = log.filter((s) => s.pass === '1');
    expect(first.length).toBeGreaterThan(10);
    // The first pass is a rise, left to right: he starts below the bottom edge, climbs to the lane, then crosses
    expect(first.every((s) => s.kind === 'rise' && s.dir === 'ltr')).toBe(true);
    expect(first[0].phase).toBe('rise');
    expect(first[0].y).toBeGreaterThan(vh);
    const phases = [...new Set(first.map((s) => s.phase))];
    expect(phases).toEqual(['rise', 'hover', 'climb', 'cross']);
    // The art follows the move: rise, hover, climb, then the level prone art
    const arts = first.map((s) => s.art).filter((a, i, all) => i === 0 || a !== all[i - 1]);
    expect(arts).toEqual(['rise', 'hover', 'climb', 'fly']);
    const rising = first.filter((s) => s.phase === 'rise');
    expect(rising[rising.length - 1].y).toBeLessThan(rising[0].y - 150);
    for (let i = 1; i < rising.length; i++) expect(rising[i].y).toBeLessThanOrEqual(rising[i - 1].y + 0.5);
    const hover = first.filter((s) => s.phase === 'hover');
    expect(hover.length).toBeGreaterThan(0);
    expect(Math.max(...hover.map((s) => s.y)) - Math.min(...hover.map((s) => s.y))).toBeLessThan(40);
    const xs = first.map((s) => s.x);
    expect(Math.min(...xs)).toBeLessThan(vw / 2);
    expect(Math.max(...xs)).toBeGreaterThan(vw / 2);
    expect(new Set(xs.map(Math.round)).size).toBeGreaterThan(10);
    // Pass 2 started from the side he left, and pass 3 went back
    expect(log.find((s) => s.pass === '2')!.dir).toBe('rtl');
    expect(log.find((s) => s.pass === '3')!.dir).toBe('ltr');
    // While crossing he is always the prone art, level but for the path bank
    const crossing = log.filter((s) => s.phase === 'cross');
    expect(crossing.length).toBeGreaterThan(20);
    for (const sample of crossing) {
      // A swoop may use the climb art and a steeper dive; everything else is level, prone and banked within the cap
      if (sample.flourish === 'swoop') continue;
      expect(sample.art).toBe('fly');
      expect(Math.abs(sample.rot)).toBeLessThanOrEqual(18.5);
    }
        // The page itself is untouched: the cover is clickable through the layer
    await page.locator('.comic-wrapper').click();
    await expect(page.locator('.keyboard-hints')).toBeVisible({ timeout: 10000 });
  });

  test('keeps flying while the book is open and keys still turn pages', async ({ page }) => {
    await page.goto('/?flyby=fast');
    await expect(page.locator('.app-container')).toHaveAttribute('data-web-state', 'held', { timeout: 10000 });
    await page.locator('.comic-wrapper').click();
    await expect(page.locator('.page-indicator')).toHaveText('3 / 17', { timeout: 10000 });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.page-indicator')).toHaveText('5 / 17', { timeout: 10000 });
    await expect(page.locator('[data-flyby]')).toHaveAttribute('data-flyby-pass', /^[1-9]/, { timeout: 15000 });
  });
});

test.describe('Comic Book Resume - hero fly-by with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('is not rendered at all', async ({ page }) => {
    await page.goto('/?flyby=fast');
    await expect(page.locator('.app-container')).toHaveAttribute('data-web-state', 'held', { timeout: 2000 });
    for (let i = 0; i < 6; i++) {
      await expect(page.locator('[data-flyby]')).toHaveCount(0);
      await page.waitForTimeout(300);
    }
  });
});

/** Open the book and turn to the Powers & Abilities spread (page indicator 7 / 17). */
async function goToPowers(page: Page): Promise<void> {
  await page.goto('/');
  const app = page.locator('.app-container');
  await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 10000 });
  await page.locator('.comic-wrapper').click();
  await expect(page.locator('.keyboard-hints')).toBeVisible({ timeout: 10000 });
  // Wait for each flip to land (the indicator changes) before the next key: slow machines drop early keys
  await expect(page.locator('.page-indicator')).toHaveText('3 / 17', { timeout: 10000 });
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.page-indicator')).toHaveText('5 / 17', { timeout: 10000 });
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowRight');
}

test.describe('Comic Book Resume - Powers & Abilities hologram', () => {
  test('the hologram rises on the Powers spread: one tower per skill, the lines keep holding the book, hover reads out', async ({ page }) => {
    await goToPowers(page);
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
    // One tower per skill in resumeData.skills (5 categories x 4 skills)
    await expect(page.locator('[data-holo-tower]')).toHaveCount(20);
    await expect(page.getByRole('button', { name: 'Team Building, 10 out of 10, Leadership' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'REST APIs, 8 out of 10, Languages & Data' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Multi-Agent Workflows, 9 out of 10, Agentic Development' })).toHaveCount(1);
    await expect(page.getByRole('group', { name: /Skills hologram: 20 skills in 5 categories/ })).toHaveCount(1);
    // The four lines hold the book while it lies flat, and keep holding it
    await expect(app).toHaveAttribute('data-web-lines', '4');
    await page.waitForTimeout(600);
    await expect(app).toHaveAttribute('data-web-lines', '4');

    // One standing nameplate button per category, each just before its row's towers (tab order)
    await expect(page.locator('[data-holo-nameplate]')).toHaveCount(5);
    for (const name of [
      'Leadership category, 4 skills',
      'Agentic Development category, 4 skills',
      'Architecture category, 4 skills',
      'DevOps & SRE category, 4 skills',
      'Languages & Data category, 4 skills',
    ]) {
      await expect(page.getByRole('button', { name })).toHaveCount(1);
    }
    const order = await page
      .locator('[data-holo-nameplate], [data-holo-tower]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
    expect(order.slice(0, 2)).toEqual(['Leadership category, 4 skills', 'Team Building, 10 out of 10, Leadership']);
    expect(order[5]).toBe('Agentic Development category, 4 skills');
    expect(order[10]).toBe('Architecture category, 4 skills');

    // Real pointer on the visible nameplate (the button's own box): it must be what is under the pointer, not the
    // page-turn plane, hovering reads out the whole category, and clicking it does not turn the page.
    const plateButton = page.getByRole('button', { name: 'Languages & Data category, 4 skills' });
    const plate = await plateButton.boundingBox();
    expect(plate).not.toBeNull();
    if (plate) {
      expect(plate.width).toBeGreaterThan(40);
      const px = plate.x + plate.width / 2;
      const py = plate.y + plate.height / 2;
      expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[data-holo-nameplate]')?.getAttribute('aria-label') ?? null, [px, py])).toBe(
        'Languages & Data category, 4 skills'
      );
      await page.mouse.move(px, py);
      await expect(page.locator('[aria-live="polite"]')).toContainText('Languages & Data');
      await expect(page.locator('[aria-live="polite"]')).toContainText('REST APIs');
      await expect(page.locator('[aria-live="polite"]')).toContainText('4 SKILLS');
      await page.mouse.click(px, py);
      await page.waitForTimeout(400);
      await expect(page.locator('.page-indicator')).toHaveText('7 / 17');
      await expect(app).toHaveAttribute('data-holo', 'on');
    }

    // The same for a tower: a point on its visible label plate resolves to that tower, and hovering reads it out.
    const label = await page
      .getByRole('button', { name: 'Team Building, 10 out of 10, Leadership' })
      .locator('[data-holo-label] > span')
      .boundingBox();
    expect(label).not.toBeNull();
    if (label) {
      const lx = label.x + label.width / 2;
      const ly = label.y + label.height / 2;
      expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[data-holo-tower]')?.getAttribute('aria-label') ?? null, [lx, ly])).toBe(
        'Team Building, 10 out of 10, Leadership'
      );
      await page.mouse.move(lx, ly);
      await expect(page.locator('[aria-live="polite"]')).toContainText('Team Building');
      await expect(page.locator('[aria-live="polite"]')).toContainText('POWER LEVEL');
    }

    // A tower under the pointer wins over the page beneath it, and reads out (a front-row tower: nothing stands in
    // front of its side).
    const face = await page
      .getByRole('button', { name: 'Claude Code, 10 out of 10, Agentic Development' })
      .locator('span')
      .nth(1)
      .boundingBox();
    expect(face).not.toBeNull();
    if (face) await page.mouse.move(face.x + face.width / 2, face.y + face.height / 2);
    await expect(page.locator('[aria-live="polite"]')).toContainText('Claude Code');
    await expect(page.locator('[aria-live="polite"]')).toContainText('POWER LEVEL');
  });

  test('turning the page powers it down, stands the book up, turns, and all four lines return', async ({ page }) => {
    await goToPowers(page);
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
    await expect(page.locator('.page-indicator')).toHaveText('7 / 17');
    await page.keyboard.press('ArrowRight');
    await expect(app).toHaveAttribute('data-holo', 'off', { timeout: 4000 });
    await expect(page.locator('.page-indicator')).toHaveText('9 / 17', { timeout: 4000 });
    await expect(app).toHaveAttribute('data-web-state', 'held');
    await expect(app).toHaveAttribute('data-web-lines', '4', { timeout: 5000 });
  });

  test('clicking the left or right half of the flat book turns the page that way', async ({ page }) => {
    await goToPowers(page);
    const app = page.locator('.app-container');
    for (const [side, key, indicator] of [
      ['left', 'ArrowRight', '5 / 17'],
      ['right', 'ArrowLeft', '9 / 17'],
      ['left', 'ArrowRight', '5 / 17'],
    ] as const) {
      await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
      const box = await page.locator(`[data-holo-hit="${side}"]`).boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      // Low on the page, away from the towers
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.9);
      await expect(page.locator('.page-indicator')).toHaveText(indicator, { timeout: 4000 });
      await expect(app).toHaveAttribute('data-holo', 'off');
      await expect(app).toHaveAttribute('data-web-lines', '4', { timeout: 5000 });
      await page.waitForTimeout(300);
      await page.keyboard.press(key);
    }
  });

  test('Escape closes it on the same page, the lines return, and replay brings it back', async ({ page }) => {
    await goToPowers(page);
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
    await page.keyboard.press('Escape');
    await expect(app).toHaveAttribute('data-holo', 'off', { timeout: 4000 });
    await expect(page.locator('.page-indicator')).toHaveText('7 / 17');
    await expect(app).toHaveAttribute('data-web-lines', '4', { timeout: 5000 });
    const replay = page.getByRole('button', { name: /Replay hologram/ });
    await expect(replay).toBeVisible();
    await replay.click();
    await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
  });

  test('arriving from the next page turns it on too', async ({ page }) => {
    await goToPowers(page);
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.page-indicator')).toHaveText('9 / 17', { timeout: 4000 });
    await expect(app).toHaveAttribute('data-web-lines', '4', { timeout: 5000 });
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.page-indicator')).toHaveText('7 / 17', { timeout: 4000 });
    await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
  });

  test('mashing keys on the spread always ends upright, held, with four lines', async ({ page }) => {
    await goToPowers(page);
    const app = page.locator('.app-container');
    await expect(app).toHaveAttribute('data-holo', 'on', { timeout: 12000 });
    // A real mash: ten keys, one every 7 animation frames (about 115 ms), sent from inside the page. Pacing by
    // frames instead of by Playwright round trips keeps the keys in step with the frame-driven animations on a
    // loaded machine; with wall-clock gaps a slow run stretched the mash to seconds, and a deliberate key after a
    // landing then legitimately returned to the Powers spread, where the hologram is meant to come back on.
    await page.evaluate(async () => {
      const frames = (n: number): Promise<void> =>
        new Promise((resolve) => {
          const step = (): void => {
            n -= 1;
            if (n <= 0) resolve();
            else requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      for (let i = 0; i < 10; i++) {
        const key = i % 3 === 2 ? 'ArrowLeft' : 'ArrowRight';
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        await frames(7);
      }
    });
    await expect
      .poll(async () => [await app.getAttribute('data-holo'), await app.getAttribute('data-web-lines')], {
        timeout: 12000,
      })
      .toEqual(['off', '4']);
    await expect(app).toHaveAttribute('data-web-state', 'held');
  });
});

test.describe('Comic Book Resume - hologram with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('the Powers spread behaves as before: the hologram never starts', async ({ page }) => {
    await goToPowers(page);
    await expect(page.locator('.page-indicator')).toHaveText('7 / 17', { timeout: 4000 });
    const app = page.locator('.app-container');
    for (let i = 0; i < 8; i++) {
      await expect(app).toHaveAttribute('data-holo', 'off');
      await page.waitForTimeout(250);
    }
    await expect(page.locator('[data-holo-tower]')).toHaveCount(0);
    await expect(app).toHaveAttribute('data-web-lines', '4');
  });
});

/** Open the book on a fresh page load and turn forward to the spread whose indicator reads `target / 17`. */
async function openBookAt(page: Page, target = 3): Promise<void> {
  await page.addInitScript(() => window.sessionStorage.setItem('resume-web-catch-played', '1'));
  await page.goto('/');
  const app = page.locator('.app-container');
  await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 15000 });
  await page.locator('.comic-wrapper').click();
  await expect(page.locator('.keyboard-hints')).toBeVisible({ timeout: 10000 });
  for (let at = 3; at <= target; at += 2) {
    await expect(page.locator('.page-indicator')).toHaveText(`${at} / 17`, { timeout: 10000 });
    if (at < target) {
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowRight');
    }
  }
}

const board = (page: Page) => page.locator('[data-mission-board]');

test.describe('Comic Book Resume - hire me: beacon and Mission Board', () => {
  test('the beacon appears once the opening drop has finished and opens the board', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('.app-container');
    // Not offered while the cover is still dropping in
    await expect(page.locator('[data-hire-beacon-dock]')).toHaveCount(1);
    await expect(app).toHaveAttribute('data-web-state', 'held', { timeout: 20000 });
    const beacon = page.locator('[data-hire-beacon]');
    await expect(beacon).toBeVisible();
    await expect(page.locator('[data-hire-prompt]')).toHaveText(/\S/);
    await beacon.click({ force: true });
    await expect(board(page)).toBeVisible();
    await expect(board(page)).toHaveAttribute('data-board-step', '1');
    // hidden behind the open board
    await expect(page.locator('[data-hire-beacon-dock]')).toHaveCSS('opacity', '0');
  });

  for (const id of ['assess', 'project', 'unsure']) {
    test(`the ${id} mission reaches step 2 with its chip`, async ({ page }) => {
      await openBookAt(page);
      await page.locator('[data-hire-beacon]').click({ force: true });
      await page.locator(`[data-mission-card="${id}"]`).click();
      await expect(board(page)).toHaveAttribute('data-board-step', '2', { timeout: 5000 });
      if (id !== 'unsure') await expect(page.locator(`[data-board-chip="${id}"]`)).toBeVisible();
      await expect(page.locator('[data-board-subject]')).not.toHaveValue('');
      await expect(page.locator('[data-board-body]')).not.toHaveValue('');
    });
  }

  test('the email link is a mailto with the encoded subject', async ({ page }) => {
    await openBookAt(page);
    await page.locator('[data-hire-beacon]').click({ force: true });
    await page.locator('[data-mission-card="project"]').click();
    await expect(board(page)).toHaveAttribute('data-board-step', '2', { timeout: 5000 });
    const subject = await page.locator('[data-board-subject]').inputValue();
    const body = await page.locator('[data-board-body]').inputValue();
    const href = (await page.locator('[data-board-email]').getAttribute('href')) ?? '';
    expect(href.startsWith('mailto:')).toBe(true);
    const query = href.slice(href.indexOf('?') + 1);
    expect(query).toContain(`subject=${encodeURIComponent(subject.trim())}`);
    expect(query).toContain(`body=${encodeURIComponent(body)}`);
    // typing in the fields never reaches a site shortcut: a space or arrow key leaves the page where it is
    await page.locator('[data-board-name]').fill('Pat');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.page-indicator')).toHaveText('3 / 17');
  });

  test('the LinkedIn button copies the message and links to the profile', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openBookAt(page);
    await page.locator('[data-hire-beacon]').click({ force: true });
    await page.locator('[data-mission-card="assess"]').click();
    await expect(board(page)).toHaveAttribute('data-board-step', '2', { timeout: 5000 });
    const link = page.locator('[data-board-linkedin]');
    await expect(link).toHaveAttribute('href', /^https:\/\/www\.linkedin\.com\/in\/shawn-dillenbeck\/?$/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    const body = await page.locator('[data-board-body]').inputValue();
    const popup = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await link.click();
    await expect(page.locator('[data-board-status]')).toHaveText('Copied!');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(body);
    (await popup)?.close();
  });

  test('Escape closes the board and focus returns to the beacon', async ({ page }) => {
    await openBookAt(page);
    const beacon = page.locator('[data-hire-beacon]');
    await beacon.focus();
    await page.keyboard.press('Enter');
    await expect(board(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(board(page)).toHaveCount(0);
    await expect(beacon).toBeFocused();
  });

  test('arrow keys do not turn pages while the board is open, and do after it closes', async ({ page }) => {
    await openBookAt(page);
    await page.locator('[data-hire-beacon]').click({ force: true });
    await expect(board(page)).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1800);
    await expect(page.locator('.page-indicator')).toHaveText('3 / 17');
    await page.keyboard.press('Escape');
    await expect(board(page)).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.page-indicator')).toHaveText('5 / 17', { timeout: 10000 });
  });

  test('clicking the right edge of the book still turns the page with the beacon present', async ({ page }) => {
    await openBookAt(page);
    // the right-hand click zone covers the right page; click its outer edge, level with the beacon's column
    const box = await page.locator('[data-click-zone][aria-label="Next page"]').boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.click(box.x + box.width - 14, box.y + box.height * 0.28);
    await expect(page.locator('.page-indicator')).toHaveText('5 / 17', { timeout: 10000 });
  });
});

test.describe('Comic Book Resume - beacon clearance', () => {
  for (const size of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 650 },
    { width: 1280, height: 720 },
  ]) {
    test(`at its pulse peak the beacon stays 12px clear of the contact badges at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.addInitScript(() => window.sessionStorage.setItem('resume-web-catch-played', '1'));
      await page.goto('/');
      await expect(page.locator('.app-container')).toHaveAttribute('data-web-state', 'held', { timeout: 15000 });
      await expect(page.locator('[data-hire-beacon-dock]')).toHaveCSS('opacity', '1', { timeout: 5000 });
      await page.waitForTimeout(600);
      const m = await page.evaluate(() => {
        const b = (document.querySelector('[data-hire-beacon]') as HTMLElement).getBoundingClientRect();
        const bubble = (document.querySelector('[data-hire-prompt]') as HTMLElement).getBoundingClientRect();
        const badge = (document.querySelector('[class*="sidebar"] a') as HTMLElement).getBoundingClientRect();
        const cs = getComputedStyle(document.querySelector('[data-hire-beacon]') as HTMLElement);
        // peak: the burst swells 9% and the ring (inset 8%, grows to 1.55x of that box) reaches past it, plus the 4px shadow
        const size = b.width / (cs.scale === 'none' ? 1 : parseFloat(cs.scale));
        const ringHalf = size * 0.84 * 1.55 * 0.5 * 1.09;
        const burstHalf = size * 0.5 * 1.09;
        const cy = b.top + b.height / 2;
        return { bottom: cy + Math.max(ringHalf, burstHalf) + 4, badgeTop: badge.top, bubbleTop: bubble.top, size };
      });
      expect(m.badgeTop - m.bottom, 'gap to the first contact badge').toBeGreaterThanOrEqual(12);
      expect(m.bubbleTop, 'speech bubble stays on screen').toBeGreaterThanOrEqual(0);
    });
  }
});

test.describe('Comic Book Resume - special projects spread and ad page', () => {
  test('the case file opens as one spread with both pages in view, and the loop reacts to hover', async ({ page }) => {
    await openBookAt(page, 13);
    const dossier = page.locator('[data-case-file="dossier"]');
    const loop = page.locator('[data-case-file="loop"]');
    await expect(dossier).toBeVisible();
    await expect(loop).toBeVisible();
    const [a, b] = [await dossier.boundingBox(), await loop.boundingBox()];
    expect(a && b && Math.abs(a.y - b.y) < 2 && a.x + a.width <= b.x + 2).toBe(true);
    await expect(page.locator('[data-case-section="still-in-the-lab"]')).toContainText('STILL IN THE LAB');
    const node = page.locator('[data-loop-node="3"]');
    const nb = await node.boundingBox();
    expect(nb).not.toBeNull();
    if (!nb) return;
    await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2);
    await expect(page.locator('[data-loop-caption]')).toContainText('SHA-256');
    await page.mouse.click(nb.x + nb.width / 2, nb.y + nb.height / 2);
    await page.waitForTimeout(1500);
    await expect(page.locator('.page-indicator')).toHaveText('13 / 17');
    await expect(node).toHaveAttribute('aria-pressed', 'true');
  });

  test('the ad page is the inside front cover: its coupon opens the board at step 2', async ({ page }) => {
    await openBookAt(page);
    const ad = page.locator('[data-ad-page]');
    await expect(ad).toBeVisible();
    // nothing ticked: a hint, no board
    await page.locator('[data-ad-clip]').click({ force: true });
    await expect(page.locator('[data-ad-hint]')).toHaveText(/\S/);
    await expect(board(page)).toHaveCount(0);
    // the page's click zones sit above the controls and hand the click on, so click by position; ticking does not turn the page
    await page.locator('[data-ad-check="assess"]').click({ force: true });
    await page.locator('[data-ad-check="unsure"]').click({ force: true });
    await expect(page.locator('[data-ad-check="assess"] input')).toBeChecked();
    await expect(page.locator('.page-indicator')).toHaveText('3 / 17');
    await page.locator('[data-ad-clip]').click({ force: true });
    await expect(board(page)).toBeVisible({ timeout: 10000 });
    await expect(board(page)).toHaveAttribute('data-board-step', '2');
    await expect(page.locator('[data-board-chip="assess"]')).toBeVisible();
    await expect(page.locator('[data-board-chip="unsure"]')).toBeVisible();
    await expect(page.locator('[data-board-chip="project"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(board(page)).toHaveCount(0);
    await expect(page.locator('.page-indicator')).toHaveText('3 / 17');
  });

  test('clicking the ad page outside its controls turns back to the cover', async ({ page }) => {
    await openBookAt(page);
    const zone = await page.locator('[data-click-zone][aria-label="Previous page"]').boundingBox();
    expect(zone).not.toBeNull();
    if (!zone) return;
    // the empty paper strip at the very top-left of the page, clear of the ad's text and controls
    await page.mouse.click(zone.x + 6, zone.y + zone.height * 0.5);
    await expect(page.locator('.click-hint')).toBeVisible({ timeout: 10000 });
  });

  test('the last spread is the final testimonials and the back cover', async ({ page }) => {
    await openBookAt(page, 17);
    await expect(page.locator('.page-indicator')).toHaveText('17 / 17');
    await expect(page.locator('[data-ad-page]')).toHaveAttribute('inert', '');
  });

  for (const size of [
    { width: 1280, height: 720 },
    { width: 1366, height: 650 },
    { width: 1440, height: 900 },
    { width: 1920, height: 940 },
  ]) {
    test(`the three new pages do not overflow at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await openBookAt(page, 3);
      await page.evaluate(() => document.fonts.ready);
      const measure = (sels: string[]) =>
        page.evaluate((list) => {
          return list.map((sel) => {
            const root = document.querySelector(sel) as HTMLElement;
            const fit = root.querySelector<HTMLElement>('[class*="fit"]') as HTMLElement;
            const f = fit.getBoundingClientRect();
            let bottom = 0;
            let right = 0;
            fit.querySelectorAll<HTMLElement>('*').forEach((el) => {
              const r = el.getBoundingClientRect();
              if (!r.width || !r.height || el.closest('svg') || getComputedStyle(el).position === 'absolute') return;
              bottom = Math.max(bottom, r.bottom);
              right = Math.max(right, r.right);
            });
            return {
              name: sel,
              bottomGap: Math.round(f.bottom - bottom),
              rightGap: Math.round(f.right - right),
              sh: fit.scrollHeight - fit.clientHeight,
              sw: fit.scrollWidth - fit.clientWidth,
            };
          });
        }, sels);
      // The ad is full bleed: its box is the hard page face, and its content keeps at least 6px clear of every edge
      const ad = await page.evaluate(() => {
        const root = document.querySelector('[data-ad-page]') as HTMLElement;
        const face = (root.closest('[data-density]') as HTMLElement).getBoundingClientRect();
        const r = root.getBoundingClientRect();
        const min = { left: 1e9, top: 1e9, right: 1e9, bottom: 1e9 };
        root.querySelectorAll<HTMLElement>('[class*="fit"] *').forEach((el) => {
          if (el.closest('svg') || el.closest('[class*="cutLayer"]')) return;
          const b = el.getBoundingClientRect();
          if (!b.width || !b.height) return;
          min.left = Math.min(min.left, b.left - r.left);
          min.top = Math.min(min.top, b.top - r.top);
          min.right = Math.min(min.right, r.right - b.right);
          min.bottom = Math.min(min.bottom, r.bottom - b.bottom);
        });
        // The speech bubble sits above the picture: clear of the figure's head (top 30%) and of the headline strip
        const rect = (sel: string) => (root.querySelector(sel) as HTMLElement).getBoundingClientRect();
        const bubble = rect('[class*="bubble"]');
        const img = rect('[class*="hero"] img');
        const strip = rect('[class*="sub"]');
        const hit = (a: DOMRect, b: { left: number; right: number; top: number; bottom: number }) =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const head = { left: img.left, right: img.right, top: img.top, bottom: img.top + img.height * 0.3 };
        return {
          bubbleOnHead: hit(bubble, head),
          bubbleOnStrip: hit(bubble, strip),
          diff: [r.left - face.left, r.top - face.top, r.right - face.right, r.bottom - face.bottom].map((n) => Math.abs(n)),
          min,
        };
      });
      expect(ad.bubbleOnHead, 'speech bubble covers the hero head').toBe(false);
      expect(ad.bubbleOnStrip, 'speech bubble covers the headline strip').toBe(false);
      for (const d of ad.diff) expect(d, 'ad box vs page face').toBeLessThanOrEqual(1);
      for (const [side, v] of Object.entries(ad.min)) expect(v, `ad content clearance, ${side}`).toBeGreaterThanOrEqual(6);
      const rows = await measure(['[data-ad-page]']);
      for (const at of [5, 7, 9, 11, 13]) {
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('.page-indicator')).toHaveText(`${at} / 17`, { timeout: 10000 });
        await page.waitForTimeout(200);
      }
      rows.push(...(await measure(['[data-case-file="dossier"]', '[data-case-file="loop"]'])));
      for (const r of rows) {
        expect(r.bottomGap, `${r.name} bottom`).toBeGreaterThanOrEqual(0);
        expect(r.rightGap, `${r.name} right`).toBeGreaterThanOrEqual(0);
        expect(r.sh, `${r.name} vertical overflow`).toBeLessThanOrEqual(1);
        expect(r.sw, `${r.name} horizontal overflow`).toBeLessThanOrEqual(1);
      }
    });
  }
});
