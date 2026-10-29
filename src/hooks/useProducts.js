import { useEffect, useState } from 'react';
import { fallbackProducts } from '../data/fallbackProducts';
import { supabase } from '../lib/supabase';
import { loadCatalog } from '../lib/catalog';

export function useProducts(category) {
  const [state, setState] = useState({ category, products: fallbackProducts[category], source: 'sample', loading: Boolean(supabase), reason: 'unconfigured' });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const fallback = (reason) => ({ category, products: fallbackProducts[category], source: 'sample', loading: false, reason });

    if (!supabase) {
      setState(fallback('unconfigured'));
      return () => { active = false; };
    }

    setState({ ...fallback(null), loading: true });
    const timer = setTimeout(() => {
      controller.abort();
      if (active) setState(fallback('unavailable'));
    }, 10_000);
    loadCatalog(supabase, category, controller.signal)
      .then((products) => {
        if (!active) return;
        setState(products.length
          ? { category, products, source: 'verified', loading: false, reason: null }
          : fallback('empty'));
      })
      .catch(() => active && setState(fallback('unavailable')))
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [category]);

  return state.category === category ? state : { category, products: fallbackProducts[category], source: 'sample', loading: Boolean(supabase), reason: null };
}
