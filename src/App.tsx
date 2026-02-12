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
  ExperiencePeopleReady,
  ExperienceEzlinks,
  ExperienceEarlyCareer,
  SpecialProjectsPage,
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

  // Total pages: Cover + InsideFrontCover + InsideCover + Origin(2) + Skills(2) + Exp(3: PeopleReady + Ezlinks + EarlyCareer) + SpecialProjects + Testimonials(1 + middle + 1) + BackCover
  const experiencePageCount = 3; // PeopleReady, Ezlinks, EarlyCareer (Geneca+Healthation combined)
  const testimonialPageCount = 1 + middleTestimonials.length + 1;
  const totalPages = 3 + 2 + 2 + experiencePageCount + 1 + testimonialPageCount + 1;

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

  // Experience data references - lookup by company name for resilience to reordering
  const findExperience = (company: string) =>
    resumeData.experience.find(e => e.company === company)!;
  const peopleReady = findExperience('PeopleReady');
  const ezlinks = findExperience('Ezlinks Golf');
  const geneca = findExperience('Geneca');
  const healthation = findExperience('Healthation');

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
          <SkillsPage1 isVisible={currentPage === 6} />
          <SkillsPage2 isVisible={currentPage === 6} />
          <ExperiencePeopleReady
            key="exp-peopleready"
            experience={peopleReady}
            pageNumber={8}
          />
          <ExperienceEzlinks
            key="exp-ezlinks"
            experience={ezlinks}
            pageNumber={9}
          />
          <ExperienceEarlyCareer
            key="exp-early-career"
            geneca={geneca}
            healthation={healthation}
            pageNumber={10}
          />
          <SpecialProjectsPage pageNumber={11} />
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

      {!isBookOpen && currentPage === 0 && (
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
        </div>
      )}
    </div>
  );
}

export default App;
