import EnvelopeList from "./EnvelopeList";

import { Route, Routes } from "react-router-dom";

export default function EnvelopesTab(props: { showAll: boolean }) {
  return (
    <Routes>
      <Route path="/:id" element={<EnvelopeList {...props} />} />
      <Route path="/" element={<EnvelopeList {...props} />} />
    </Routes>
  );
}
