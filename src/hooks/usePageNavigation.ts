import { useEffect, useCallback } from 'react';

interface UsePageNavigationProps {
  onNext: () => void;
  onPrevious: () => void;
  enabled?: boolean;
}

const usePageNavigation = ({
  onNext,
  onPrevious,
  enabled = true,
}: UsePageNavigationProps): void => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Space bar
        case 'PageDown':
          event.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault();
          onPrevious();
          break;
        case 'Home':
          event.preventDefault();
          // Could add onFirst callback if needed
          break;
        case 'End':
          event.preventDefault();
          // Could add onLast callback if needed
          break;
        default:
          break;
      }
    },
    [enabled, onNext, onPrevious]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default usePageNavigation;
