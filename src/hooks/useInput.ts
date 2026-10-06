"use client";

import { useState, ChangeEvent } from "react";

export default function useInput(defaultValue = "") {
  const [value, setValue] = useState(defaultValue);

  function onChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setValue(event.target.value);
  }

  function reset() {
    setValue(defaultValue);
  }

  return [value, onChange, setValue, reset] as const;
}
