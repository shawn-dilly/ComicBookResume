/**
 * ComicBookGSAP - GSAP-Based Comic Book Page Flip Component
 *
 * Replaces react-pageflip with a custom GSAP implementation for better control
 * over animations and overflow handling.
 *
 * Book Model:
 * - Pages are paired into "sheets" (physical paper)
 * - Sheet 0: front = page 0 (cover), back = page 1 (inside front cover)
 * - Sheet 1: front = page 2, back = page 3
 * - etc.
 * - After flipping N sheets, you see: sheet[N-1].back (left) + sheet[N].front (right)
 */

import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from 'react';
import gsap from 'gsap';
import styles from './ComicBookGSAP.module.css';

// Animation configuration
const FLIP_DURATION = 0.8; // seconds
const FLIP_EASE = 'power2.inOut';

interface ComicBookGSAPProps {
  children: ReactNode;
  onPageChange?: (pageIndex: number) => void;
  onPageFlip?: () => void;
  onBookOpen?: () => void;
  onBookClose?: () => void;
  showCover?: boolean;
  startPage?: number;
}

export interface ComicBookGSAPRef {
  flipNext: () => void;
  flipPrev: () => void;
  flipTo: (page: number) => void;
  getCurrentPage: () => number;
  isBookOpen: () => boolean;
}

// Represents a physical sheet of paper with front and back
interface Sheet {
  front: ReactElement;
  back: ReactElement | null;
}

const ComicBookGSAP = forwardRef<ComicBookGSAPRef, ComicBookGSAPProps>(
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
    // Convert children to array and pair into sheets (memoized)
    const sheets = useMemo<Sheet[]>(() => {
      const pages = Children.toArray(children).filter(isValidElement) as ReactElement[];
      const result: Sheet[] = [];
      for (let i = 0; i < pages.length; i += 2) {
        result.push({
          front: pages[i],
          back: pages[i + 1] || null,
        });
      }
      return result;
    }, [children]);

    const totalSheets = sheets.length;

    // Current sheet index (which sheet is on top of the right stack)
    const [currentSheet, setCurrentSheet] = useState(Math.floor(startPage / 2));
    const [isAnimating, setIsAnimating] = useState(false);
    const [isOpen, setIsOpen] = useState(startPage > 0);
    const [dimensions, setDimensions] = useState({ width: 350, height: 525 });

    // Refs for sheet elements
    const bookRef = useRef<HTMLDivElement>(null);
    const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Calculate dimensions based on viewport - maximize screen usage
    useEffect(() => {
      const calculateDimensions = () => {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const aspectRatio = 2 / 3;

        // Reserve space: 12px top + 70px bottom for nav control with margin
        const availableHeight = vh - 82;
        const availableWidth = vw - 24;

        const maxPageWidth = availableWidth / 2;
        // Use 98% of available height
        let pageHeight = availableHeight * 0.98;
        let pageWidth = pageHeight * aspectRatio;

        if (pageWidth > maxPageWidth) {
          pageWidth = maxPageWidth;
          pageHeight = pageWidth / aspectRatio;
        }

        pageWidth = Math.max(200, Math.floor(pageWidth));
        pageHeight = Math.max(300, Math.floor(pageHeight));

        setDimensions({ width: pageWidth, height: pageHeight });
      };

      calculateDimensions();
      window.addEventListener('resize', calculateDimensions);
      return () => window.removeEventListener('resize', calculateDimensions);
    }, []);

    /**
     * Get z-index for a sheet based on its flip state
     */
    const getSheetZIndex = useCallback(
      (sheetIndex: number, isFlipped: boolean) => {
        if (isFlipped) {
          return sheetIndex + 1;
        } else {
          return totalSheets - sheetIndex;
        }
      },
      [totalSheets]
    );

    /**
     * Core sheet flip animation using GSAP
     */
    const flipSheet = useCallback(
      (direction: 'forward' | 'backward') => {
        if (isAnimating) return;

        let sheetToFlip: number;
        let newCurrentSheet: number;

        if (direction === 'forward') {
          if (currentSheet >= totalSheets - 1) return;
          sheetToFlip = currentSheet;
          newCurrentSheet = currentSheet + 1;
        } else {
          if (currentSheet <= 0) return;
          sheetToFlip = currentSheet - 1;
          newCurrentSheet = currentSheet - 1;
        }

        const sheetEl = sheetRefs.current[sheetToFlip];
        if (!sheetEl) return;

        setIsAnimating(true);
        onPageFlip?.();

        const tl = gsap.timeline({
          onComplete: () => {
            setCurrentSheet(newCurrentSheet);
            setIsAnimating(false);

            // Calculate the "page index" for callbacks — use right-side (odd) page of spread
            const pageIndex = newCurrentSheet * 2;
            onPageChange?.(pageIndex);

            if (newCurrentSheet > 0 && !isOpen) {
              setIsOpen(true);
              onBookOpen?.();
            } else if (newCurrentSheet === 0 && isOpen) {
              setIsOpen(false);
              onBookClose?.();
            }
          },
        });

        if (direction === 'forward') {
          gsap.set(sheetEl, { zIndex: totalSheets + 10 });
          tl.to(sheetEl, {
            rotateY: -180,
            duration: FLIP_DURATION,
            ease: FLIP_EASE,
          });
          tl.set(sheetEl, { zIndex: getSheetZIndex(sheetToFlip, true) });
        } else {
          gsap.set(sheetEl, { zIndex: totalSheets + 10 });
          tl.to(sheetEl, {
            rotateY: 0,
            duration: FLIP_DURATION,
            ease: FLIP_EASE,
          });
          tl.set(sheetEl, { zIndex: getSheetZIndex(sheetToFlip, false) });
        }
      },
      [
        currentSheet,
        isAnimating,
        isOpen,
        totalSheets,
        onPageChange,
        onPageFlip,
        onBookOpen,
        onBookClose,
        getSheetZIndex,
      ]
    );

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      flipNext: () => flipSheet('forward'),
      flipPrev: () => flipSheet('backward'),
      flipTo: (page: number) => {
        if (isAnimating) return;
        const targetSheet = Math.floor(page / 2);
        if (targetSheet === currentSheet) return;

        // Instantly jump all sheets to their correct positions
        for (let i = 0; i < totalSheets; i++) {
          const sheetEl = sheetRefs.current[i];
          if (!sheetEl) continue;
          const shouldBeFlipped = i < targetSheet;
          gsap.set(sheetEl, {
            rotateY: shouldBeFlipped ? -180 : 0,
            zIndex: getSheetZIndex(i, shouldBeFlipped),
          });
        }

        setCurrentSheet(targetSheet);
        const pageIndex = targetSheet * 2;
        onPageChange?.(pageIndex);

        if (targetSheet > 0 && !isOpen) {
          setIsOpen(true);
          onBookOpen?.();
        } else if (targetSheet === 0 && isOpen) {
          setIsOpen(false);
          onBookClose?.();
        }
      },
      getCurrentPage: () => currentSheet * 2,
      isBookOpen: () => isOpen,
    }));

    // Click handlers
    const handleLeftClick = useCallback(() => {
      flipSheet('backward');
    }, [flipSheet]);

    const handleRightClick = useCallback(() => {
      flipSheet('forward');
    }, [flipSheet]);

    /**
     * Render a sheet with front and back faces
     */
    const renderSheet = (sheet: Sheet, index: number) => {
      const isFlipped = index < currentSheet;
      const rotation = isFlipped ? -180 : 0;
      const zIndex = getSheetZIndex(index, isFlipped);

      const isCover = index === 0 && showCover;
      const isLastSheet = index === totalSheets - 1;

      const sheetClasses = [
        styles.page,
        styles.pageRight,
        isCover ? styles.coverPage : '',
        isLastSheet ? styles.backCover : '',
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div
          key={index}
          ref={(el) => {
            sheetRefs.current[index] = el;
          }}
          className={sheetClasses}
          style={{
            transform: `rotateY(${rotation}deg)`,
            zIndex,
          }}
        >
          {/* Front face - shows this sheet's front page */}
          <div className={`${styles.pageFace} ${styles.pageFront}`}>
            <div className={styles.pageWrapper}>
              {cloneElement(sheet.front)}
            </div>
            <div className={styles.pageGradient} />
          </div>

          {/* Back face - shows this sheet's back page (visible on left after flip) */}
          <div className={`${styles.pageFace} ${styles.pageBack}`}>
            <div className={styles.pageWrapper}>
              {sheet.back ? (
                cloneElement(sheet.back)
              ) : (
                <div className={styles.blankPage} />
              )}
            </div>
            <div className={styles.pageGradientBack} />
          </div>
        </div>
      );
    };

    return (
      <div className={styles.scene}>
        <div
          ref={bookRef}
          className={styles.book}
          style={{
            '--page-width': `${dimensions.width}px`,
            '--page-height': `${dimensions.height}px`,
          } as React.CSSProperties}
        >
          {/* Render all sheets */}
          {sheets.map((sheet, index) => renderSheet(sheet, index))}

          {/* Click zones for navigation */}
          <button
            className={`${styles.clickZone} ${styles.clickZoneLeft}`}
            onClick={handleLeftClick}
            disabled={currentSheet <= 0}
            aria-label="Previous page"
            tabIndex={-1}
          />
          <button
            className={`${styles.clickZone} ${styles.clickZoneRight}`}
            onClick={handleRightClick}
            disabled={currentSheet >= totalSheets - 1}
            aria-label="Next page"
            tabIndex={-1}
          />
        </div>
      </div>
    );
  }
);

ComicBookGSAP.displayName = 'ComicBookGSAP';

export default ComicBookGSAP;
