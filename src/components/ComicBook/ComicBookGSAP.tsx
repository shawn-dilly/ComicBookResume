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
 *
 * Hanger:
 * - The book sits inside a "hanger" wrapper (a flex box that fills the scene).
 *   The hanger never affects layout; an external physics loop (see
 *   WebCatch/useHangPhysics) writes a transform onto it so the whole book can
 *   fall, hang and swing without touching the GSAP-owned `.book` transform.
 *   The hanger is `transform-style: preserve-3d` so the scene perspective keeps
 *   applying exactly as it did when the book was the scene's direct child.
 * - `getPageSize()` and `getOpenProgress()` let that loop track the visible
 *   corners of the book (0 = closed cover centred, 1 = full spread).
 */

import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
  useLayoutEffect,
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
const BOOK_SHADOW = '0 0 30px rgba(0,0,0,0.4), 0 0 60px rgba(0,0,0,0.15)';
const BOOK_SHADOW_HIDDEN = '0 0 30px rgba(0,0,0,0), 0 0 60px rgba(0,0,0,0)';

export type FlipDirection = 'forward' | 'backward';

/** Size of one page in CSS pixels. */
export interface PageSize {
  width: number;
  height: number;
}

/**
 * Page size for a viewport: maximise screen usage while keeping a 2:3 page and
 * leaving room for the 12px top / 70px bottom of the comic wrapper.
 */
function calculatePageSize(): PageSize {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const aspectRatio = 2 / 3;

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

  return {
    width: Math.max(200, Math.floor(pageWidth)),
    height: Math.max(300, Math.floor(pageHeight)),
  };
}

interface ComicBookGSAPProps {
  children: ReactNode;
  onPageChange?: (pageIndex: number) => void;
  onPageFlip?: () => void;
  onBookOpen?: () => void;
  onBookClose?: () => void;
  /** A page turn (or the cover opening/closing) is about to animate. */
  onFlipStart?: (direction: FlipDirection) => void;
  /**
   * Fired on every GSAP update of a flip. `t` is how far the turning sheet is
   * flipped (0 = flat on the right, 1 = flat on the left); `openProgress` is
   * the cover-open progress (0 = closed, 1 = spread), which moves while the
   * cover turns.
   */
  onFlipProgress?: (sheetIndex: number, t: number, openProgress: number) => void;
  /** A flip finished and the page has landed. */
  onFlipLanded?: (direction: FlipDirection, pageIndex: number) => void;
  /** Let the scene clip its contents (default). Pass false while the book is falling in. */
  clip?: boolean;
  /**
   * The book lies flat (hologram mode): its own pointer handling is switched off so nothing under the
   * tilted pages competes with the overlay, which takes over clicks.
   */
  flat?: boolean;
  /**
   * Extra content drawn next to the book inside the hanger, so it shares the book's 3D pose. It is centred on
   * the visible spread and gets the page size. (Not a child of `.book`: that clips and flattens.)
   */
  renderOverlay?: (page: PageSize) => ReactNode;
  showCover?: boolean;
  startPage?: number;
}

export interface ComicBookGSAPRef {
  flipNext: () => void;
  flipPrev: () => void;
  /**
   * Turn a page as soon as the current flip has landed and the book is free again (right away if no flip is
   * running). Used to honour a key pressed during a flip that would otherwise be dropped.
   */
  flipAfterLanding: (direction: FlipDirection) => void;
  flipTo: (page: number) => void;
  getCurrentPage: () => number;
  isBookOpen: () => boolean;
  /** The wrapper element between `.scene` and `.book` that physics moves and tilts. */
  getHangerElement: () => HTMLDivElement | null;
  /** Size of one page in CSS pixels. */
  getPageSize: () => PageSize;
  /** 0 = closed cover centred on screen, 1 = full spread (moves while the cover turns). */
  getOpenProgress: () => number;
  /**
   * 0 while the last sheet lies on the right; 1 once it has turned onto the
   * left (only the left half of the book is then visible).
   */
  getCloseProgress: () => number;
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
      onFlipStart,
      onFlipProgress,
      onFlipLanded,
      clip = true,
      flat = false,
      renderOverlay,
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
    const [dimensions, setDimensions] = useState<PageSize>(calculatePageSize);

    // Refs for sheet elements
    const hangerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<HTMLDivElement>(null);
    const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Position book for cover-centered mode before first paint
    useLayoutEffect(() => {
      if (bookRef.current && Math.floor(startPage / 2) === 0) {
        gsap.set(bookRef.current, { x: '-25%' });
      }
    }, [startPage]);

    // Keep the page size in step with the viewport
    useEffect(() => {
      const handleResize = () => setDimensions(calculatePageSize());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mirror the size for synchronous reads (physics runs outside React)
    const dimensionsRef = useRef(dimensions);
    useLayoutEffect(() => {
      dimensionsRef.current = dimensions;
    }, [dimensions]);

    /**
     * Cover-open progress, read from the cover sheet's rotation. The cover's
     * rotateY and the book's slide share one tween, so they always agree.
     */
    const readSheetProgress = useCallback((index: number): number => {
      const sheet = sheetRefs.current[index];
      if (!sheet) return 0;
      const rotation = Number(gsap.getProperty(sheet, 'rotateY')) || 0;
      return Math.min(1, Math.max(0, Math.abs(rotation) / 180));
    }, []);
    const readOpenProgress = useCallback((): number => readSheetProgress(0), [readSheetProgress]);
    const readCloseProgress = useCallback(
      (): number => readSheetProgress(totalSheets - 1),
      [readSheetProgress, totalSheets]
    );

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
        onFlipStart?.(direction);

        const tl = gsap.timeline({
          onUpdate: () => {
            const rotation = Number(gsap.getProperty(sheetEl, 'rotateY')) || 0;
            onFlipProgress?.(sheetToFlip, Math.min(1, Math.abs(rotation) / 180), readOpenProgress());
          },
          onComplete: () => {
            onFlipLanded?.(direction, newCurrentSheet * 2);
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

          // Opening from cover: slide book and fade in shadow
          if (currentSheet === 0 && bookRef.current) {
            tl.to(bookRef.current, {
              x: 0,
              boxShadow: BOOK_SHADOW,
              duration: FLIP_DURATION,
              ease: FLIP_EASE,
            }, 0);
          }

          tl.to(sheetEl, {
            rotateY: -180,
            duration: FLIP_DURATION,
            ease: FLIP_EASE,
          }, 0);
          tl.set(sheetEl, { zIndex: getSheetZIndex(sheetToFlip, true) });
        } else {
          gsap.set(sheetEl, { zIndex: totalSheets + 10 });

          // Closing to cover: slide book back and fade out shadow
          if (newCurrentSheet === 0 && bookRef.current) {
            tl.to(bookRef.current, {
              x: '-25%',
              boxShadow: BOOK_SHADOW_HIDDEN,
              duration: FLIP_DURATION,
              ease: FLIP_EASE,
            }, 0);
          }

          tl.to(sheetEl, {
            rotateY: 0,
            duration: FLIP_DURATION,
            ease: FLIP_EASE,
          }, 0);
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
        onFlipStart,
        onFlipProgress,
        onFlipLanded,
        readOpenProgress,
        getSheetZIndex,
      ]
    );

    // A turn asked for while another one was running: it runs as soon as the book is free
    const queuedRef = useRef<FlipDirection | null>(null);
    useEffect(() => {
      if (isAnimating || !queuedRef.current) return;
      const direction = queuedRef.current;
      queuedRef.current = null;
      flipSheet(direction);
    }, [isAnimating, flipSheet]);

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      flipNext: () => flipSheet('forward'),
      flipPrev: () => flipSheet('backward'),
      flipAfterLanding: (direction: FlipDirection) => {
        if (isAnimating) queuedRef.current = direction;
        else flipSheet(direction);
      },
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

        // Set book position and shadow: cover-centered or spread
        if (bookRef.current) {
          gsap.set(bookRef.current, {
            x: targetSheet === 0 ? '-25%' : 0,
            boxShadow: targetSheet === 0 ? BOOK_SHADOW_HIDDEN : BOOK_SHADOW,
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
      getHangerElement: () => hangerRef.current,
      getPageSize: () => dimensionsRef.current,
      getOpenProgress: readOpenProgress,
      getCloseProgress: readCloseProgress,
    }));

    /**
     * The click zones cover both pages, so a control printed on a page (a diagram node, a checkbox, a button) sits under
     * them. A page marks such controls `data-no-turn`; a click or hover that lands on one is handed to it (the click is
     * forwarded, hover is sent as `book-enter` / `book-leave` events) and the page does not turn.
     */
    const hoveredControlRef = useRef<HTMLElement | null>(null);
    const controlAt = useCallback((x: number, y: number): HTMLElement | null => {
      for (const el of document.elementsFromPoint(x, y)) {
        if (!(el instanceof HTMLElement) || el.dataset.clickZone !== undefined) continue;
        return el.closest<HTMLElement>('[data-no-turn]');
      }
      return null;
    }, []);

    const handleZoneMove = useCallback(
      (event: React.MouseEvent) => {
        const control = controlAt(event.clientX, event.clientY);
        const previous = hoveredControlRef.current;
        if (control === previous) return;
        previous?.dispatchEvent(new CustomEvent('book-leave'));
        control?.dispatchEvent(new CustomEvent('book-enter'));
        hoveredControlRef.current = control;
      },
      [controlAt]
    );

    const handleZoneLeave = useCallback(() => {
      hoveredControlRef.current?.dispatchEvent(new CustomEvent('book-leave'));
      hoveredControlRef.current = null;
    }, []);

    // Click handlers
    const handleLeftClick = useCallback(
      (event: React.MouseEvent) => {
        const control = controlAt(event.clientX, event.clientY);
        if (control) {
          control.click();
          return;
        }
        flipSheet('backward');
      },
      [controlAt, flipSheet]
    );

    const handleRightClick = useCallback(
      (event: React.MouseEvent) => {
        const control = controlAt(event.clientX, event.clientY);
        if (control) {
          control.click();
          return;
        }
        flipSheet('forward');
      },
      [controlAt, flipSheet]
    );

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
      <div className={`${styles.scene} ${clip ? styles.sceneClip : ''}`}>
        <div ref={hangerRef} className={styles.hanger}>
          <div
            ref={bookRef}
            data-book={currentSheet === 0 ? 'closed' : 'open'}
            className={`${styles.book} ${currentSheet === 0 ? styles.bookClosed : ''} ${flat ? styles.bookFlat : ''}`}
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
              data-click-zone=""
              onClick={handleLeftClick}
              onMouseMove={handleZoneMove}
              onMouseLeave={handleZoneLeave}
              disabled={currentSheet <= 0}
              aria-label="Previous page"
              tabIndex={-1}
            />
            <button
              className={`${styles.clickZone} ${styles.clickZoneRight}`}
              data-click-zone=""
              onClick={handleRightClick}
              onMouseMove={handleZoneMove}
              onMouseLeave={handleZoneLeave}
              disabled={currentSheet >= totalSheets - 1}
              aria-label="Next page"
              tabIndex={-1}
            />
          </div>
          {renderOverlay?.(dimensions)}
        </div>
      </div>
    );
  }
);

ComicBookGSAP.displayName = 'ComicBookGSAP';

export default ComicBookGSAP;
