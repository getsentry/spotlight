import { useContext } from "react";
import { NavigationContext } from "./navigationContext";

export const useNavigation = () => {
  return useContext(NavigationContext);
};
