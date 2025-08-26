import { Route, Routes } from "react-router-dom";
import SidecarMcpTabList from "./SidecarMcpTabList";

export default function SidecarMcpTab() {
  return (
    <div className="flex-1 overflow-auto">
      <Routes>
        <Route path="/:id/*" element={<SidecarMcpTabList />} />
        <Route path="/" element={<SidecarMcpTabList />} />
      </Routes>
    </div>
  );
}
