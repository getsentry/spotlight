import { Route, Routes } from 'react-router-dom';
import TraceDetails from '../components/traces/TraceDetails';
import TraceList from '../components/traces/TraceList';

export default function TracesTab() {
  return (
    <Routes>
      <Route path="/:traceId/*" element={<TraceDetails />} />
      <Route path="/" element={<TraceList />} />
    </Routes>
  );
}
