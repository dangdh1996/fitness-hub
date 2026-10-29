const creatine = [
  ['ostrovit-creatine-500g', 'Ostrovit Micronized Creatine 500g', 'Ostrovit', 450000, 500, '🥇 Giá tốt'],
  ['rule1-creatine-435g', 'Rule 1 Creatine Monohydrate 435g', 'Rule 1', 520000, 435, 'Bán chạy'],
  ['nutrabio-creatine-300g', 'NutraBio Pure Creatine 300g', 'NutraBio', 410000, 300, 'Cao cấp'],
  ['on-creatine-300g', 'Optimum Nutrition Micronized Creatine 300g', 'Optimum Nutrition', 490000, 300, 'Phổ biến'],
  ['myprotein-creatine-500g', 'MyProtein Creatine Monohydrate 500g', 'MyProtein', 560000, 500, 'Giá tốt'],
  ['applied-creatine-250g', 'Applied Nutrition Creatine 250g', 'Applied Nutrition', 390000, 250, 'Tinh khiết'],
  ['muscle-tech-creatine-400g', 'MuscleTech Platinum Creatine 400g', 'MuscleTech', 590000, 400, 'Bán chạy'],
  ['mutant-creatine-300g', 'Mutant Creakong Creatine 300g', 'Mutant', 530000, 300, 'Blend'],
  ['evogen-creatine-300g', 'Evogen Creatine 300g', 'Evogen', 620000, 300, 'Cao cấp'],
  ['biotech-creatine-300g', 'BioTechUSA 100% Creatine 300g', 'BioTechUSA', 480000, 300, 'Châu Âu'],
  ['scitec-creatine-300g', 'Scitec Nutrition Creatine 300g', 'Scitec', 470000, 300, 'Châu Âu'],
  ['allmax-creatine-400g', 'AllMax Creatine Monohydrate 400g', 'AllMax', 610000, 400, 'Tinh khiết'],
  ['qnt-creatine-300g', 'QNT Creatine Monohydrate 300g', 'QNT', 450000, 300, 'Giá tốt'],
  ['usn-creatine-500g', 'USN Creatine Monohydrate 500g', 'USN', 690000, 500, 'Hộp lớn'],
  ['kevin-levrone-creatine-300g', 'Kevin Levrone Gold Creatine 300g', 'Kevin Levrone', 460000, 300, 'Phổ biến'],
];

const whey = [
  ['avacore-isolate-2kg', 'Whey Protein Isolate Avacore 2kg', 'Avacore', 1650000, 1600, '🥇 Tối ưu'],
  ['rule1-isolate-5lb', 'Rule 1 Proteins Isolate 5lbs', 'Rule 1', 1850000, 1925, 'Bán chạy'],
  ['on-gold-standard-5lb', 'Optimum Nutrition Gold Standard Whey 5lbs', 'Optimum Nutrition', 1890000, 1730, 'Phổ biến'],
  ['myprotein-impact-2-5kg', 'MyProtein Impact Whey 2.5kg', 'MyProtein', 1750000, 2000, 'Hộp lớn'],
  ['dymatize-iso100-5lb', 'Dymatize ISO100 5lbs', 'Dymatize', 2350000, 1800, 'Cao cấp'],
  ['nutrabolics-hydropure-4-5lb', 'Nutrabolics Hydropure 4.5lbs', 'Nutrabolics', 2050000, 1750, 'Hydrolyzed'],
  ['applied-iso-xp-4lb', 'Applied Nutrition ISO-XP 4lbs', 'Applied Nutrition', 1990000, 1700, 'Tinh khiết'],
  ['muscle-tech-nitrotech-4lb', 'MuscleTech NitroTech Whey 4lbs', 'MuscleTech', 1790000, 1500, 'Tăng cơ'],
  ['mutant-iso-surge-5lb', 'Mutant ISO Surge 5lbs', 'Mutant', 1950000, 1800, 'Isolate'],
  ['scitec-100-whey-5lb', 'Scitec 100% Whey Professional 5lbs', 'Scitec', 1720000, 1680, 'Châu Âu'],
  ['biotech-iso-whey-zero-5lb', 'BioTechUSA Iso Whey Zero 5lbs', 'BioTechUSA', 2150000, 1850, 'Không lactose'],
  ['allmax-isoflex-5lb', 'AllMax Isoflex 5lbs', 'AllMax', 2250000, 1800, 'Cao cấp'],
  ['qnt-metapure-2kg', 'QNT Metapure Zero Carb 2kg', 'QNT', 2180000, 1800, 'Zero Carb'],
  ['usn-blue-lab-2kg', 'USN Blue Lab Whey 2kg', 'USN', 1690000, 1550, 'Phổ biến'],
  ['kevin-levrone-anabolic-mass-3kg', 'Kevin Levrone Anabolic Mass 3kg', 'Kevin Levrone', 1450000, 900, 'Mass Gainer'],
];

function normalize(rows, category) {
  return rows.map(([slug, name, brand, price, activeTotal, badge]) => ({
    slug,
    name,
    brand,
    category,
    price,
    activeTotal,
    costPerGram: Math.round(price / activeTotal),
    badge,
    url: `https://s.shopee.vn/sub_id=${slug}`,
  })).sort((a, b) => a.costPerGram - b.costPerGram);
}

export const fallbackProducts = {
  creatine: normalize(creatine, 'creatine'),
  whey: normalize(whey, 'whey'),
};
