import { Route, Routes } from 'react-router-dom';
import LogsList from './LogsList';

export default function Logs(props: { showAll: boolean }) {
  return (
    <Routes>
      <Route path="/:id" element={<LogsList {...props} />} />
      <Route path="/" element={<LogsList {...props} />} />
    </Routes>
  );
}
