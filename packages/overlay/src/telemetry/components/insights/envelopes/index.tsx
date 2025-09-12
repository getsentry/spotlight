import EnvelopeList from "./EnvelopeList";

import { Route, Routes } from "react-router-dom";

export default function EnvelopesTab() {
  return (
    <Routes>
      <Route path="/:id" element={<EnvelopeList />} />
      <Route path="/" element={<EnvelopeList />} />
    </Routes>
  );
}
