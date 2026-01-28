import { useCallback, useState, useRef } from 'react';

import { ComicBookGSAP, type ComicBookGSAPRef } from './components/ComicBook';
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
import { useSoundEffects, usePageNavigation } from './hooks';
import { resumeData } from './data/resume';

import './styles/global.css';

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const comicBookRef = useRef<ComicBookGSAPRef>(null);
  const soundEffects = useSoundEffects(true);

  // Split testimonials: first 2 on one page, middle ones individual, last 2 on one page
  const firstTwoTestimonials = resumeData.testimonials.slice(0, 2);
  const middleTestimonials = resumeData.testimonials.slice(2, -2);
  const lastTwoTestimonials = resumeData.testimonials.slice(-2);

  // Total pages: Cover + InsideFrontCover + InsideCover + Origin(2) + Skills(2) + Exp(dynamic) + Edu + Testimonials(1 + middle + 1) + BackCover
  const testimonialPageCount = 1 + middleTestimonials.length + 1;
  const totalPages = 3 + 2 + 2 + resumeData.experience.length + 1 + testimonialPageCount + 1;

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
        <ComicBookGSAP
          ref={comicBookRef}
          onPageChange={handlePageChange}
          onPageFlip={handlePageFlip}
          onBookOpen={handleBookOpen}
          onBookClose={handleBookClose}
          showCover={true}
        >
          <CoverPage />
          <InsideFrontCoverPage />
          <InsideCoverPage />
          <OriginStoryPage1 />
          <OriginStoryPage2 />
          <SkillsPage1 />
          <SkillsPage2 />
          {experiencePages}
          <EducationPage pageNumber={7 + resumeData.experience.length} />
          {/* First page with 2 testimonials */}
          <TestimonialsPage
            key="testimonials-first"
            pageNumber={8 + resumeData.experience.length}
            testimonials={firstTwoTestimonials}
            showHeader={true}
          />
          {/* Middle testimonials on individual pages */}
          {middleTestimonials.map((testimonial, index) => (
            <TestimonialsPage
              key={`testimonial-${index + 2}`}
              pageNumber={9 + resumeData.experience.length + index}
              testimonials={[testimonial]}
              showHeader={false}
            />
          ))}
          {/* Last page with 2 testimonials */}
          <TestimonialsPage
            key="testimonials-last"
            pageNumber={9 + resumeData.experience.length + middleTestimonials.length}
            testimonials={lastTwoTestimonials}
            showHeader={false}
          />
          <BackCoverPage />
        </ComicBookGSAP>
      </div>

      {!isBookOpen && currentPage === 0 && (
        <div className="click-hint">
          ← CLICK TO OPEN
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
        </div>
      )}
    </div>
  );
}

export default App;
