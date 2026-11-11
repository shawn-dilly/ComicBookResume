/**
 * App - picks the layout at runtime: the desktop flipbook, or the phone reader at 600px wide and below.
 *
 * Both layouts read the same content from `data/resume.ts`. Each is a separate lazy chunk, so a phone does
 * not download the desktop bundle (page-flip, web physics, hologram) and a desktop does not download the reader.
 * The fallback shown while a chunk loads is only the navy backdrop, so nothing flashes.
 */

import { lazy, Suspense } from 'react';
import useIsPhone from './hooks/useIsPhone';

import './styles/global.css';
import './AppFallback.css';

const DesktopApp = lazy(() => import('./DesktopApp'));
const MobileApp = lazy(() => import('./mobile/MobileApp'));

function App() {
  const isPhone = useIsPhone();
  return (
    <Suspense fallback={<div className="app-fallback" aria-hidden="true" />}>
      {isPhone ? <MobileApp /> : <DesktopApp />}
    </Suspense>
  );
}

export default App;
