import { Route, Routes } from 'react-router-dom';
import TraceDetails from './TraceDetails';
import TraceList from './TraceList';

export default function TracesTab() {
  return (
    <Routes>
      <Route path="/:traceId/*" element={<TraceDetails />} />
      <Route path="/" element={<TraceList />} />
    </Routes>
  );
}
