import { useCallback, useEffect, useState, useRef, type MouseEvent } from 'react';

import { ComicBookGSAP, type ComicBookGSAPRef, type FlipDirection } from './components/ComicBook';
import { ContactSidebar } from './components/ContactSidebar';
import { HeroFlyby } from './components/HeroFlyby';
import { WebCatch, type IntroState, type WebCatchRef } from './components/WebCatch';
import {
  CoverPage,
  InsideFrontCoverPage,
  InsideCoverPage,
  OriginStoryPage1,
  OriginStoryPage2,
  SkillsPage1,
  SkillsPage2,
  ExperienceGrodivo,
  ExperiencePeopleReady,
  ExperienceEzlinks,
  ExperienceEarlyCareer,
  TestimonialsPage,
  BackCoverPage,
} from './pages';
import { useSoundEffects, usePageNavigation, useHoloSound, useHologramMode } from './hooks';
import { SkillsHologram, HOLO } from './components/SkillsHologram';
import type { PageSize } from './components/ComicBook';
import { resumeData } from './data/resume';

/**
 * DesktopApp - the two-page-spread flipbook that hangs from spider-web lines.
 *
 * This is the whole site above the phone breakpoint, unchanged; `App` picks it (or the phone reader) at runtime and
 * loads it as a separate chunk.
 */
function DesktopApp() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const comicBookRef = useRef<ComicBookGSAPRef>(null);
  const webCatchRef = useRef<WebCatchRef>(null);
  // The book falls in and is caught by webs; it can only be opened once held.
  const [webState, setWebState] = useState<IntroState>('falling');
  const isHeld = webState === 'held';
  // How many of the four main lines hold the book (read by the e2e tests)
  const [webLines, setWebLines] = useState(0);
  // One click made during the drop is remembered and applied when the book is held
  const pendingOpenRef = useRef(false);
  const soundEffects = useSoundEffects(true);
  const holoSound = useHoloSound(true);
  // Powers & Abilities hologram: the book lies flat and a projection rises out of the spread
  const holo = useHologramMode({ webCatchRef, comicBookRef, isHeld });

  // Split testimonials: first 2 on one page, middle ones individual, last 2 on one page
  const firstTwoTestimonials = resumeData.testimonials.slice(0, 2);
  const middleTestimonials = resumeData.testimonials.slice(2, -2);
  const lastTwoTestimonials = resumeData.testimonials.slice(-2);

  // Total child pages in the book
  const totalPages = 14 + middleTestimonials.length;


  const handlePageChange = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex);
  }, []);

  const handlePageFlip = useCallback(() => {
    soundEffects.playPageTurn();
  }, [soundEffects]);

  // The wrapped strands let go while a page turns; on landing they snap back and the book dips
  // A key pressed while a page is turning is dropped by the book; remember it so landing on the Powers spread
  // does not start the hologram under a reader who is still turning pages.
  const flipActiveRef = useRef(false);
  const keyDuringFlipRef = useRef<FlipDirection | null>(null);

  const handleFlipStart = useCallback((direction: FlipDirection) => {
    flipActiveRef.current = true;
    keyDuringFlipRef.current = null;
    webCatchRef.current?.release(direction);
  }, []);

  const handleFlipProgress = useCallback(() => {
    webCatchRef.current?.flipProgress();
  }, []);

  const handleFlipLanded = useCallback(
    (direction: FlipDirection, pageIndex: number) => {
      webCatchRef.current?.rewrap();
      flipActiveRef.current = false;
      const queued = keyDuringFlipRef.current;
      keyDuringFlipRef.current = null;
      if (queued && pageIndex === HOLO.triggerPage) {
        // Still turning pages: skip the hologram and keep going.
        webCatchRef.current?.land(direction);
        webCatchRef.current?.reattachAll();
        comicBookRef.current?.flipAfterLanding(queued);
        return;
      }
      // The disconnected corners shoot back. Landing on the Powers spread then lays the book down, with all
      // four lines still attached (they follow the corners while it lies down).
      webCatchRef.current?.land(direction);
      webCatchRef.current?.reattachAll();
      holo.landed(pageIndex);
    },
    [holo]
  );

  const handleBookOpen = useCallback(() => {
    setIsBookOpen(true);
  }, []);

  const handleBookClose = useCallback(() => {
    setIsBookOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    // A key pressed while the book is still falling in counts like a click: open once held
    if (!isHeld) {
      if (!comicBookRef.current?.isBookOpen()) pendingOpenRef.current = true;
      return;
    }
    if (holo.requestTurn('forward')) return;
    if (flipActiveRef.current) keyDuringFlipRef.current = 'forward';
    comicBookRef.current?.flipNext();
  }, [isHeld, holo]);

  const handlePrevious = useCallback(() => {
    if (!isHeld) return;
    if (holo.requestTurn('backward')) return;
    if (flipActiveRef.current) keyDuringFlipRef.current = 'backward';
    comicBookRef.current?.flipPrev();
  }, [isHeld, holo]);

  // Setup keyboard navigation
  usePageNavigation({
    onNext: handleNext,
    onPrevious: handlePrevious,
    enabled: true,
  });

  // Escape closes the hologram
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && holo.phase !== 'off') {
        event.preventDefault();
        holo.requestClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [holo]);

  const renderHologram = useCallback(
    (page: PageSize) =>
      holo.phase === 'off' ? null : (
        <SkillsHologram
          page={page}
          phase={holo.phase}
          onReady={holo.onReady}
          onPoweredDown={holo.onPoweredDown}
          onTurn={holo.requestTurn}
          onClose={holo.requestClose}
          onPowerUp={holoSound.playPowerUp}
          onPowerDown={holoSound.playPowerDown}
        />
      ),
    [holo, holoSound]
  );

  // Swallow clicks until the book is held, remembering that the visitor wanted it open
  const handleWrapperClickCapture = useCallback(
    (event: MouseEvent) => {
      if (isHeld) return;
      event.stopPropagation();
      if (!comicBookRef.current?.isBookOpen()) pendingOpenRef.current = true;
    },
    [isHeld]
  );

  // Perform the remembered click as soon as the book is caught
  useEffect(() => {
    if (isHeld && pendingOpenRef.current) {
      pendingOpenRef.current = false;
      comicBookRef.current?.flipNext();
    }
  }, [isHeld]);

  // Experience data references - lookup by company name for resilience to reordering
  const findExperience = (company: string) =>
    resumeData.experience.find(e => e.company === company)!;
  const grodivo = findExperience('Grodivo');
  const peopleReady = findExperience('PeopleReady');
  const ezlinks = findExperience('Ezlinks Golf');
  const geneca = findExperience('Geneca');
  const healthation = findExperience('Healthation');

  return (
    <div className="app-container" data-layout="desktop" data-web-state={webState} data-web-lines={webLines} data-holo={holo.phase}>
      <ContactSidebar />
      <div
        className={`comic-wrapper ${isBookOpen ? 'open' : 'closed'}${isHeld ? '' : ' intro'}`}
        onClickCapture={handleWrapperClickCapture}
      >
        <ComicBookGSAP
          ref={comicBookRef}
          clip={isHeld && holo.phase === 'off'}
          flat={holo.phase !== 'off'}
          renderOverlay={renderHologram}
          onPageChange={handlePageChange}
          onPageFlip={handlePageFlip}
          onBookOpen={handleBookOpen}
          onBookClose={handleBookClose}
          onFlipStart={handleFlipStart}
          onFlipProgress={handleFlipProgress}
          onFlipLanded={handleFlipLanded}
          showCover={true}
        >
          <CoverPage />
          <InsideFrontCoverPage />
          <InsideCoverPage />
          <OriginStoryPage1 />
          <OriginStoryPage2 />
          <SkillsPage1 isVisible={currentPage === 6} />
          <SkillsPage2 isVisible={currentPage === 6} />
          <ExperienceGrodivo
            key="exp-grodivo"
            experience={grodivo}
            pageNumber={8}
          />
          <ExperiencePeopleReady
            key="exp-peopleready"
            experience={peopleReady}
            pageNumber={9}
          />
          <ExperienceEzlinks
            key="exp-ezlinks"
            experience={ezlinks}
            pageNumber={10}
          />
          <ExperienceEarlyCareer
            key="exp-early-career"
            geneca={geneca}
            healthation={healthation}
            pageNumber={11}
          />
          {/* First page with 2 testimonials */}
          <TestimonialsPage
            key="testimonials-first"
            pageNumber={12}
            testimonials={firstTwoTestimonials}
            showHeader={true}
          />
          {/* Middle testimonials on individual pages */}
          {middleTestimonials.map((testimonial, index) => (
            <TestimonialsPage
              key={`testimonial-${index + 2}`}
              pageNumber={13 + index}
              testimonials={[testimonial]}
              showHeader={false}
            />
          ))}
          {/* Last page with 2 testimonials */}
          <TestimonialsPage
            key="testimonials-last"
            pageNumber={13 + middleTestimonials.length}
            testimonials={lastTwoTestimonials}
            showHeader={false}
          />
          <BackCoverPage />
        </ComicBookGSAP>
      </div>

      {/* The Iron Architect flies in the page background: under the book, and before the webs so their lines cross in front of him */}
      <HeroFlyby active={isHeld} holoOn={holo.phase !== 'off'} />

      {/* Webs: lines and webs behind the book, plus a front layer above it */}
      <WebCatch
        ref={webCatchRef}
        bookRef={comicBookRef}
        onStateChange={setWebState}
        onLinesChange={setWebLines}
        onPose={holo.onPose}
      />

      {isHeld && !isBookOpen && currentPage === 0 && (
        <div className="click-hint">
          ↑ CLICK COVER TO OPEN ↑
        </div>
      )}

      {isBookOpen && (
        <div className="keyboard-hints">
          <span className="keyboard-hint keyboard-hint-large">
            <kbd>←</kbd> <kbd>→</kbd> Navigate Pages
          </span>
          <span className="page-indicator">
            {currentPage + 1} / {totalPages}
          </span>
          {holo.phase === 'off' && currentPage === 6 && holo.available() && (
            <button type="button" className="holo-replay" data-holo-control="" onClick={holo.replay}>
              ▶ Replay hologram
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DesktopApp;
