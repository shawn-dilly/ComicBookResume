import { useState, useRef, useCallback } from 'react';
import { ComicBook, Navigation } from './components';
import type { ComicBookRef } from './components';
import {
  CoverPage,
  InsideFrontCoverPage,
  InsideCoverPage,
  OriginStoryPage1,
  OriginStoryPage2,
  SkillsPage1,
  SkillsPage2,
  ExperiencePage,
  EducationPage,
  TestimonialsPage,
  BackCoverPage,
} from './pages';
import { resumeData } from './data/resume';
import { useSoundEffects, usePageNavigation } from './hooks';
import './styles/global.css';

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const comicBookRef = useRef<ComicBookRef>(null);
  const soundEffects = useSoundEffects(true);

  // Total pages: Cover + InsideFrontCover + InsideCover + Origin(2) + Skills(2) + Exp(dynamic) + Edu + Testimonials + BackCover
  const totalPages = 3 + 2 + 2 + resumeData.experience.length + 1 + 1 + 1;

  const handlePageChange = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex);
  }, []);

  const handlePageFlip = useCallback(() => {
    soundEffects.playPageTurn();
  }, [soundEffects]);

  const handleBookOpen = useCallback(() => {
    setIsBookOpen(true);
  }, []);

  const handleBookClose = useCallback(() => {
    setIsBookOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    comicBookRef.current?.flipNext();
  }, []);

  const handlePrevious = useCallback(() => {
    comicBookRef.current?.flipPrev();
  }, []);

  // Setup keyboard navigation
  usePageNavigation({
    onNext: handleNext,
    onPrevious: handlePrevious,
    enabled: true,
  });

  // Generate experience pages dynamically
  const experiencePages = resumeData.experience.map((exp, index) => (
    <ExperiencePage
      key={`exp-${index}`}
      experience={exp}
      pageNumber={8 + index}
      isFirst={index === 0}
    />
  ));

  return (
    <div className="app-container">
      <div className={`comic-wrapper ${isBookOpen ? 'open' : 'closed'}`}>
        <ComicBook
          ref={comicBookRef}
          onPageChange={handlePageChange}
          onPageFlip={handlePageFlip}
          onBookOpen={handleBookOpen}
          onBookClose={handleBookClose}
          showCover={true}
        >
          {/* Page 0: Front Cover (hard, right side when closed) */}
          <CoverPage />

          {/* Page 1: Inside Front Cover - Decorative (hard, left side when opened) */}
          <InsideFrontCoverPage />

          {/* Page 2: Inside Cover - Contact/Dossier (right side of first spread) */}
          <InsideCoverPage />

          {/* Pages 3-4: Origin Story (spread) */}
          <OriginStoryPage1 />
          <OriginStoryPage2 />

          {/* Pages 5-6: Skills (spread) */}
          <SkillsPage1 />
          <SkillsPage2 />

          {/* Pages 7+: Experience (each takes a full page, shown as spreads) */}
          {experiencePages}

          {/* Education Page */}
          <EducationPage pageNumber={7 + resumeData.experience.length} />

          {/* Testimonials Page */}
          <TestimonialsPage pageNumber={8 + resumeData.experience.length} />

          {/* Back Cover (hard) */}
          <BackCoverPage />
        </ComicBook>
      </div>

      {/* Click hint when book is closed */}
      {!isBookOpen && currentPage === 0 && (
        <div className="click-hint">
          ← CLICK TO OPEN
        </div>
      )}

      <Navigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hidden={!isBookOpen}
      />

      {isBookOpen && (
        <div className="keyboard-hints">
          <span className="keyboard-hint">
            <kbd>←</kbd> <kbd>→</kbd> Navigate pages
          </span>
          <span className="keyboard-hint">
            <kbd>Space</kbd> Next page
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
