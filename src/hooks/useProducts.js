import { useEffect, useState } from 'react';
import { fallbackProducts } from '../data/fallbackProducts';
import { supabase } from '../lib/supabase';

export function useProducts(category) {
  const [products, setProducts] = useState(fallbackProducts[category]);
  const [source, setSource] = useState('sample');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setProducts(fallbackProducts[category]);

    if (!supabase) {
      setSource('sample');
      return () => { active = false; };
    }

    setLoading(true);
    supabase
      .from('products')
      .select('slug,name,brand,category,price_vnd,active_total_g,cost_per_active_gram,badge,affiliate_url,last_checked_at')
      .eq('category', category)
      .eq('is_active', true)
      .order('cost_per_active_gram', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.length) {
          setSource('sample');
          return;
        }
        setProducts(data.map((product) => ({
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price_vnd,
          activeTotal: Number(product.active_total_g),
          costPerGram: Number(product.cost_per_active_gram),
          badge: product.badge,
          url: product.affiliate_url,
          lastCheckedAt: product.last_checked_at,
        })));
        setSource('supabase');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [category]);

  return { products, source, loading };
}
