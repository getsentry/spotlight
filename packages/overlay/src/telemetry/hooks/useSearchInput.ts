import { type FormEvent, useEffect, useState } from "react";
import useDebounce from "./useDebounce";

export default function useSearchInput(onSearch: (value: string) => void, delay = 500) {
  const [inputValue, setInputValue] = useState("");
  const [showReset, setShowReset] = useState(false);

  const debouncedSearch = useDebounce(onSearch, delay);

  useEffect(() => {
    debouncedSearch(inputValue);
  }, [inputValue, debouncedSearch]);

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setInputValue(value);
    setShowReset(Boolean(value));
  };

  const handleReset = () => {
    setInputValue("");
    setShowReset(false);
    onSearch("");
  };

  return {
    inputValue,
    showReset,
    handleChange,
    handleReset,
  };
}
