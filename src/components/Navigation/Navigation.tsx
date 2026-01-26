import styles from './Navigation.module.css';

interface NavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
  hidden?: boolean;
}

const Navigation = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className = '',
  hidden = false,
}: NavigationProps) => {
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;

  if (hidden) return null;

  return (
    <nav className={`${styles.navigation} ${className}`} aria-label="Page navigation">
      <button
        className={styles.navButton}
        onClick={onPrevious}
        disabled={isFirstPage}
        aria-label="Previous page"
      >
        ← PREV
      </button>

      <div className={styles.pageIndicator} aria-live="polite">
        <span className={styles.current}>{currentPage + 1}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.total}>{totalPages}</span>
      </div>

      <button
        className={styles.navButton}
        onClick={onNext}
        disabled={isLastPage}
        aria-label="Next page"
      >
        NEXT →
      </button>
    </nav>
  );
};

export default Navigation;
