/**
 * Motion animation definitions using motion/react
 */

export const screenTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};
