import { useContext } from 'react';
import { SpotlightContext } from './spotlightContext';

export const useSpotlight = () => {
  return useContext(SpotlightContext);
};
