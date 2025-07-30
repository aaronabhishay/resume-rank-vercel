import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation(options = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -10% 0px', triggerOnce = true } = options;
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}

export function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const scrolled = window.pageYOffset;
      const elementTop = ref.current.offsetTop;
      const elementHeight = ref.current.offsetHeight;
      const windowHeight = window.innerHeight;
      if (scrolled + windowHeight > elementTop && scrolled < elementTop + elementHeight) {
        const yPos = (scrolled - elementTop) * speed;
        setOffset(yPos);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);
  return { ref, offset };
}

export function useStaggerAnimation(itemCount, delay = 100) {
  const [visibleItems, setVisibleItems] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems(prev => [...prev, i]);
            }, i * delay);
          }
          observer.unobserve(container);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [itemCount, delay]);
  return { containerRef, visibleItems };
}

export function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;
      const elementTop = rect.top;
      const elementBottom = rect.bottom;
      if (elementBottom < 0 || elementTop > windowHeight) {
        setProgress(elementTop > windowHeight ? 0 : 1);
      } else {
        const visibleHeight = Math.min(windowHeight, elementBottom) - Math.max(0, elementTop);
        const totalScrollableHeight = elementHeight + windowHeight;
        const scrolled = windowHeight - elementTop;
        const progressValue = Math.max(0, Math.min(1, scrolled / totalScrollableHeight));
        setProgress(progressValue);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return { ref, progress };
}

export function useScrollTransform(inputRange, outputRange) {
  const ref = useRef(null);
  const [transform, setTransform] = useState(outputRange[0]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;
      const scrollProgress = Math.max(0, Math.min(1, (windowHeight - elementTop) / (windowHeight + elementHeight)));
      const interpolate = (progress, input, output) => {
        if (progress <= input[0]) return output[0];
        if (progress >= input[input.length - 1]) return output[output.length - 1];
        for (let i = 0; i < input.length - 1; i++) {
          if (progress >= input[i] && progress <= input[i + 1]) {
            const t = (progress - input[i]) / (input[i + 1] - input[i]);
            return output[i] + t * (output[i + 1] - output[i]);
          }
        }
        return output[0];
      };
      const transformValue = interpolate(scrollProgress, inputRange, outputRange);
      setTransform(transformValue);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [inputRange, outputRange]);
  return { ref, transform };
} 