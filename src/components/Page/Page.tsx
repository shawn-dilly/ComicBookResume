import { forwardRef } from 'react';
import type { PageDensity } from '../../types';
import styles from './Page.module.css';

interface PageProps {
  children: React.ReactNode;
  pageNumber?: number;
  density?: PageDensity;
  className?: string;
  variant?: 'cover' | 'inner' | 'back';
  showPageNumber?: boolean;
  /** Full-bleed art: the content area is the whole page (no strip reserved for the page number). */
  bleed?: boolean;
}

const Page = forwardRef<HTMLDivElement, PageProps>(
  (
    {
      children,
      pageNumber,
      density = 'soft',
      className = '',
      variant = 'inner',
      showPageNumber = true,
      bleed = false,
    },
    ref
  ) => {
    const isEvenPage = pageNumber ? pageNumber % 2 === 0 : false;

    return (
      <div
        ref={ref}
        className={`${styles.page} ${styles[variant]} ${bleed ? styles.bleed : ''} ${className}`}
        data-density={density}
      >
        <div className={styles.pageContent}>
          <div className={styles.newsprintTexture} />
          {children}
        </div>

        {showPageNumber && pageNumber && variant === 'inner' && (
          <span
            className={`${styles.pageNumber} ${
              isEvenPage ? styles.pageNumberLeft : styles.pageNumberRight
            }`}
          >
            {pageNumber}
          </span>
        )}
      </div>
    );
  }
);

Page.displayName = 'Page';

export default Page;
