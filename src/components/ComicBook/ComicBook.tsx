import { forwardRef, useCallback, useRef, useImperativeHandle, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { PageFlipEvent } from '../../types';
import styles from './ComicBook.module.css';

interface ComicBookProps {
  children: React.ReactNode;
  onPageChange?: (pageIndex: number) => void;
  onPageFlip?: () => void;
  onBookOpen?: () => void;
  onBookClose?: () => void;
  showCover?: boolean;
  startPage?: number;
}

export interface ComicBookRef {
  flipNext: () => void;
  flipPrev: () => void;
  flipTo: (page: number) => void;
  getCurrentPage: () => number;
  isBookOpen: () => boolean;
}

const ComicBook = forwardRef<ComicBookRef, ComicBookProps>(
  (
    {
      children,
      onPageChange,
      onPageFlip,
      onBookOpen,
      onBookClose,
      showCover = true,
      startPage = 0,
    },
    ref
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookRef = useRef<any>(null);
    const currentPageRef = useRef(startPage);
    const [isOpen, setIsOpen] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 350, height: 525 });

    // Calculate optimal page dimensions based on viewport
    useEffect(() => {
      const calculateDimensions = () => {
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        // Page aspect ratio (comic book standard ~2:3)
        const aspectRatio = 2 / 3;

        // CHANGE THIS LINE - Add more padding to account for DevTools and controls
        const availableHeight = vh - 200;  // Increased from 120 to 200
        
        const availableWidth = vw - 80;

        // Rest of the code stays the same...
        const maxPageWidth = availableWidth / 2;
        let pageHeight = availableHeight * 0.9;
        let pageWidth = pageHeight * aspectRatio;

        if (pageWidth > maxPageWidth) {
          pageWidth = maxPageWidth;
          pageHeight = pageWidth / aspectRatio;
        }

        pageWidth = Math.max(200, Math.floor(pageWidth));
        pageHeight = Math.max(300, Math.floor(pageHeight));

        setDimensions({
          width: pageWidth,
          height: pageHeight,
        });
      };

      calculateDimensions();
      window.addEventListener('resize', calculateDimensions);
      return () => window.removeEventListener('resize', calculateDimensions);
    }, []);

    // Fix page-flip library positioning after mount
    /*
    useEffect(() => {
      const fixPositioning = () => {
        const wrapper = document.querySelector('.stf__wrapper') as HTMLElement;
        const block = document.querySelector('.stf__block') as HTMLElement;

        if (wrapper) {
          wrapper.style.position = 'absolute';
          wrapper.style.inset = '0';
          wrapper.style.height = '100%';
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'flex-start';  // CHANGED from 'center'
          wrapper.style.justifyContent = 'center';
          wrapper.style.paddingTop = '40px';  // ADD explicit top padding for positioning
        }

        if (block) {
          block.style.position = 'relative';
          block.style.height = 'auto';
        }
      };

      // Run after a short delay to ensure library has created elements
      const timer = setTimeout(fixPositioning, 100);
      return () => clearTimeout(timer);
    }, [dimensions]);
*/
    const handleFlip = useCallback(
      (e: PageFlipEvent) => {
        currentPageRef.current = e.data;

        // Book is "open" after first flip (past cover)
        if (e.data > 0 && !isOpen) {
          setIsOpen(true);
          onBookOpen?.();
        } else if (e.data === 0 && isOpen) {
          setIsOpen(false);
          onBookClose?.();
        }

        onPageChange?.(e.data);
        onPageFlip?.();
      },
      [onPageChange, onPageFlip, onBookOpen, onBookClose, isOpen]
    );

    useImperativeHandle(ref, () => ({
      flipNext: () => {
        bookRef.current?.pageFlip()?.flipNext();
      },
      flipPrev: () => {
        bookRef.current?.pageFlip()?.flipPrev();
      },
      flipTo: (page: number) => {
        bookRef.current?.pageFlip()?.flip(page);
      },
      getCurrentPage: () => currentPageRef.current,
      isBookOpen: () => isOpen,
    }));

 return (
  <div className={styles.bookContainer}>
    <div style={{
      width: dimensions.width * 2,
      height: dimensions.height,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <HTMLFlipBook
        ref={bookRef}
        width={dimensions.width}
        height={dimensions.height}
        size="fixed"
        minWidth={200}
        maxWidth={600}
        minHeight={300}
        maxHeight={900}
        showCover={showCover}
        mobileScrollSupport={true}
        onFlip={handleFlip}
        className={styles.flipBook}
        startPage={startPage}
        drawShadow={true}
        flippingTime={800}
        usePortrait={false}
        startZIndex={0}
        autoSize={false}
        maxShadowOpacity={0.5}
        showPageCorners={true}
        disableFlipByClick={false}
        swipeDistance={30}
        clickEventForward={true}
        useMouseEvents={true}
        style={{}}
      >
        {children}
      </HTMLFlipBook>
    </div>
  </div>
);
  }
);

ComicBook.displayName = 'ComicBook';

export default ComicBook;
