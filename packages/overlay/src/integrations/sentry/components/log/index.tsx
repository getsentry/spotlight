import { Route, Routes } from "react-router-dom";
import LogsList from "./LogsList";

export default function Logs() {
  return (
    <Routes>
      <Route path="/:id" element={<LogsList />} />
      <Route path="/" element={<LogsList />} />
    </Routes>
  );
}
