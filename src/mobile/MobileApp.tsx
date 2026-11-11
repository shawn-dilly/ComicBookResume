/**
 * MobileApp - the phone layout: a single-page comic reader.
 *
 * Renders `.app-container` like the desktop does, with `data-layout="mobile"`. The content comes from the same
 * `data/resume.ts` as the desktop; there is no sound on this layout, and the cover opens at rest.
 */

import { useState } from 'react';
import Reader from './reader/Reader';
import { startIndex } from './reader/boot';
import './styles/mobile.css';

export default function MobileApp() {
  // Decided once per mount: which page to open on.
  const [start] = useState(startIndex);

  return (
    <div className="app-container" data-layout="mobile">
      <Reader startIndex={start} />
    </div>
  );
}
