-- Illustrative fixtures only. Prices and active quantities are not verified.
-- Run all migrations first. Public RLS excludes these sample rows.
insert into public.products
  (slug, name, brand, category, price_vnd, active_total_g, badge,
   affiliate_url, last_checked_at, is_sample)
select slug, name, brand, category, price_vnd, active_total_g,
  'Dữ liệu minh họa', null, null, true
from (values
  ('ostrovit-creatine-500g', 'Ostrovit Micronized Creatine 500g', 'Ostrovit', 'creatine', 450000, 500),
  ('rule1-creatine-435g', 'Rule 1 Creatine Monohydrate 435g', 'Rule 1', 'creatine', 520000, 435),
  ('nutrabio-creatine-300g', 'NutraBio Pure Creatine 300g', 'NutraBio', 'creatine', 410000, 300),
  ('on-creatine-300g', 'Optimum Nutrition Micronized Creatine 300g', 'Optimum Nutrition', 'creatine', 490000, 300),
  ('myprotein-creatine-500g', 'MyProtein Creatine Monohydrate 500g', 'MyProtein', 'creatine', 560000, 500),
  ('applied-creatine-250g', 'Applied Nutrition Creatine 250g', 'Applied Nutrition', 'creatine', 390000, 250),
  ('muscle-tech-creatine-400g', 'MuscleTech Platinum Creatine 400g', 'MuscleTech', 'creatine', 590000, 400),
  ('mutant-creatine-300g', 'Mutant Creakong Creatine 300g', 'Mutant', 'creatine', 530000, 300),
  ('evogen-creatine-300g', 'Evogen Creatine 300g', 'Evogen', 'creatine', 620000, 300),
  ('biotech-creatine-300g', 'BioTechUSA 100% Creatine 300g', 'BioTechUSA', 'creatine', 480000, 300),
  ('scitec-creatine-300g', 'Scitec Nutrition Creatine 300g', 'Scitec', 'creatine', 470000, 300),
  ('allmax-creatine-400g', 'AllMax Creatine Monohydrate 400g', 'AllMax', 'creatine', 610000, 400),
  ('qnt-creatine-300g', 'QNT Creatine Monohydrate 300g', 'QNT', 'creatine', 450000, 300),
  ('usn-creatine-500g', 'USN Creatine Monohydrate 500g', 'USN', 'creatine', 690000, 500),
  ('kevin-levrone-creatine-300g', 'Kevin Levrone Gold Creatine 300g', 'Kevin Levrone', 'creatine', 460000, 300),
  ('avacore-isolate-2kg', 'Whey Protein Isolate Avacore 2kg', 'Avacore', 'whey', 1650000, 1600),
  ('rule1-isolate-5lb', 'Rule 1 Proteins Isolate 5lbs', 'Rule 1', 'whey', 1850000, 1925),
  ('on-gold-standard-5lb', 'Optimum Nutrition Gold Standard Whey 5lbs', 'Optimum Nutrition', 'whey', 1890000, 1730),
  ('myprotein-impact-2-5kg', 'MyProtein Impact Whey 2.5kg', 'MyProtein', 'whey', 1750000, 2000),
  ('dymatize-iso100-5lb', 'Dymatize ISO100 5lbs', 'Dymatize', 'whey', 2350000, 1800),
  ('nutrabolics-hydropure-4-5lb', 'Nutrabolics Hydropure 4.5lbs', 'Nutrabolics', 'whey', 2050000, 1750),
  ('applied-iso-xp-4lb', 'Applied Nutrition ISO-XP 4lbs', 'Applied Nutrition', 'whey', 1990000, 1700),
  ('muscle-tech-nitrotech-4lb', 'MuscleTech NitroTech Whey 4lbs', 'MuscleTech', 'whey', 1790000, 1500),
  ('mutant-iso-surge-5lb', 'Mutant ISO Surge 5lbs', 'Mutant', 'whey', 1950000, 1800),
  ('scitec-100-whey-5lb', 'Scitec 100% Whey Professional 5lbs', 'Scitec', 'whey', 1720000, 1680),
  ('biotech-iso-whey-zero-5lb', 'BioTechUSA Iso Whey Zero 5lbs', 'BioTechUSA', 'whey', 2150000, 1850),
  ('allmax-isoflex-5lb', 'AllMax Isoflex 5lbs', 'AllMax', 'whey', 2250000, 1800),
  ('qnt-metapure-2kg', 'QNT Metapure Zero Carb 2kg', 'QNT', 'whey', 2180000, 1800),
  ('usn-blue-lab-2kg', 'USN Blue Lab Whey 2kg', 'USN', 'whey', 1690000, 1550),
  ('kevin-levrone-gold-whey-2kg', 'Kevin Levrone Gold Whey 2kg', 'Kevin Levrone', 'whey', 1450000, 1500)
) as sample(slug, name, brand, category, price_vnd, active_total_g)
-- A demo seed must never overwrite a row already imported from a real source.
on conflict (slug) do nothing;
