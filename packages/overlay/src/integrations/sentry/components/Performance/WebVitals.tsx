import { useLocation } from 'react-router-dom';

export const WebVitals = () => {
  const location = useLocation();
  console.log({ location: location.pathname });
  return <div>Coming Soon... 🚀</div>;
};
