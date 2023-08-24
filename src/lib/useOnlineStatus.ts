import { useContext } from "react";
import { OnlineContext } from "./onlineContext";

export const useOnlineStatus = () => {
  return useContext(OnlineContext);
};
