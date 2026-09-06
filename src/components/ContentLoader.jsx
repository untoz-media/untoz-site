import { useEffect, useState } from 'react';
import { loadUntozContent } from '../services/content';

export default function useUntozContent(fallback = {}) {
  const [content, setContent] = useState(fallback);

  useEffect(() => {
    let active = true;

    loadUntozContent(fallback).then((loaded) => {
      if (active) setContent(loaded);
    });

    return () => {
      active = false;
    };
  }, []);

  return content;
}
