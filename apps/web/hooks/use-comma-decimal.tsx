import { useEffect, useState } from "react";

export function useCommaDecimal(fieldValue: unknown) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
      setDisplay("");
    } else {
      setDisplay(String(fieldValue).replace(".", ","));
    }
  }, [fieldValue]);

  return { display, setDisplay };
}
