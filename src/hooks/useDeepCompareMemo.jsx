import { useRef } from 'react';

export const useDeepCompareMemo = value => {
  const valueRef = useRef();
  const stringifiedRef = useRef();

  const newStringified = JSON.stringify(value);

  if (newStringified !== stringifiedRef.current) {
    stringifiedRef.current = newStringified;
    valueRef.current = value;
  }

  return valueRef.current;
};
