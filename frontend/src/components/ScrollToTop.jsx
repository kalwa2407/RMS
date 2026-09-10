import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal ScrollToTop:
 * Ensures every page and scrollable view in the application always starts at the top (scrollTop: 0),
 * perfectly matching native iOS and Android mobile app behavior.
 */
const ScrollToTop = () => {
  const { pathname, search, hash, key } = useLocation();

  // 1. Disable browser's automatic scroll restoration so it never retains stale scroll states
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // 2. Universal reset on any route, parameter, or navigation key change
  useEffect(() => {
    const resetScrollToTop = () => {
      // Window and document root reset
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      // Inner container resets (for mobile views, modals, drawers, and fixed layouts)
      const scrollContainers = document.querySelectorAll(
        '.overflow-y-auto, .overflow-auto, [data-scroll-container], main, #root > div'
      );
      scrollContainers.forEach((el) => {
        el.scrollTop = 0;
      });
    };

    if (!hash) {
      // Instant execution
      resetScrollToTop();

      // Ensure post-render & layout paint also resets (for async data/images)
      const rafId = requestAnimationFrame(resetScrollToTop);
      const timerId = setTimeout(resetScrollToTop, 50);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timerId);
      };
    } else {
      // If an in-page hash anchor is provided (#section), scroll to it
      const target = document.getElementById(hash.replace('#', ''));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, search, hash, key]);

  // 3. Global tap-to-top when clicking a link pointing to the current active page
  useEffect(() => {
    const handleGlobalLinkClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        try {
          const url = new URL(link.href, window.location.origin);
          if (
            url.origin === window.location.origin &&
            url.pathname === window.location.pathname &&
            (!url.search || url.search === window.location.search) &&
            !url.hash
          ) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (document.documentElement?.scrollTo) {
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }
            const scrollables = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
            scrollables.forEach((el) => {
              if (el.scrollTo) {
                el.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                el.scrollTop = 0;
              }
            });
          }
        } catch (err) {
          // Ignore invalid URL formats
        }
      }
    };

    document.addEventListener('click', handleGlobalLinkClick);
    return () => document.removeEventListener('click', handleGlobalLinkClick);
  }, []);

  return null;
};

export default ScrollToTop;

