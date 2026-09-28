import { useState, useEffect } from 'react';

/**
 * Custom hook to monitor viewport breakpoints
 * Conceptually tested for 320px, 375px, 768px, 1024px, 1440px
 */
export function useResponsive() {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = dimensions.width;

  return {
    width,
    height: dimensions.height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isLaptop: width >= 1024 && width < 1440,
    isDesktop: width >= 1440,
    isSmallMobile: width <= 375,
  };
}
