import {
  ShoppingQuery,
  ValidatedProduct,
  RecommendationResult,
  PipelineStage,
  SourceStatus,
  RankingWeights
} from '../types/shopping';

export const DEFAULT_WEIGHTS: RankingWeights = {
  material: 0.4,
  price: 0.3,
  shipping: 0.2,
  rating: 0.1,
};

// Curated high quality product visuals
const PRODUCT_IMAGES: Record<string, string> = {
  coat_1: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80',
  coat_2: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80',
  coat_3: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
  coat_4: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
  coat_5: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  coat_rejected: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=600&q=80',
  shoes_1: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  shoes_2: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
  shoes_3: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
  sweater_1: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
  sweater_2: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80',
};

export function getDeterministicQuery(queryStr: string): ShoppingQuery {
  const text = queryStr.toLowerCase();

  // Price
  let maxPrice: number | undefined = undefined;
  const priceMatch = text.match(/(?:under|below|max|less than|\$)\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    maxPrice = parseFloat(priceMatch[1]);
  }

  // Material
  const materials = ['cotton', 'wool', 'leather', 'polyester', 'linen', 'fleece', 'denim'];
  let material: string | undefined = undefined;
  for (const m of materials) {
    if (text.includes(m)) {
      material = m;
      break;
    }
  }

  // Sizes
  const sizes: string[] = [];
  const sizeMatch = text.match(/size\s+([a-z0-9\s,/\-_]+)/i);
  if (sizeMatch) {
    const rawTokens = sizeMatch[1].split(/[\s,/\-_]+|or|and/i);
    for (const t of rawTokens) {
      const clean = t.trim().toUpperCase();
      if (['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'].includes(clean) || /^\d+(\.\d+)?$/.test(clean)) {
        if (!sizes.includes(clean)) sizes.push(clean);
      }
    }
  }
  if (sizes.length === 0) {
    if (/\bmedium\b/i.test(text)) sizes.push('M');
    if (/\blarge\b/i.test(text)) sizes.push('L');
    if (/\bsmall\b/i.test(text)) sizes.push('S');
  }

  // Product Noun
  let product = 'coat';
  if (text.includes('shoe') || text.includes('sneaker') || text.includes('runner')) {
    product = 'running shoes';
  } else if (text.includes('sweater') || text.includes('knit')) {
    product = 'sweater';
  } else if (text.includes('jacket')) {
    product = 'jacket';
  }

  return {
    product,
    material,
    max_price: maxPrice ?? 100,
    sizes: sizes.length > 0 ? sizes : ['M', 'L'],
    sites: ['amazon', 'ebay', 'walmart'],
    gender: text.includes('women') ? 'women' : text.includes('men') ? 'men' : undefined,
  };
}

export function generateMockResult(userQueryStr: string): RecommendationResult {
  const parsedQuery = getDeterministicQuery(userQueryStr);
  const maxBudget = parsedQuery.max_price ?? 100;
  const isShoes = parsedQuery.product.includes('shoe');
  const isSweater = parsedQuery.product.includes('sweater');

  let validCandidates: ValidatedProduct[] = [];
  let rejectedCandidates: ValidatedProduct[] = [];

  if (isShoes) {
    validCandidates = [
      {
        product: {
          id: 'shoe-1',
          title: "Athletic Works Men's Active Running Shoes",
          price: 29.98,
          currency: 'USD',
          sizes: ['8', '9', '10', '11'],
          material: 'breathable mesh',
          rating: 4.1,
          shipping_cost: 0.0,
          source: 'walmart',
          url: 'https://www.walmart.com/ip/shoe1',
          availability: true,
          description: 'Engineered lightweight athletic running shoe with shock absorbing foam sole.',
          image_url: PRODUCT_IMAGES.shoes_1,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: Math.min(1, Math.max(0, 1 - 29.98 / maxBudget)),
        shipping_score: 1.0,
        rating_score: 4.1 / 5,
        final_score: 0.91,
        validation_reasons: ['All hard filters passed', 'Size 9 verified in stock', 'Price well under budget ($29.98 vs $120.00)', 'Free Shipping'],
      },
      {
        product: {
          id: 'shoe-2',
          title: "Avia Men's Jag Mesh Running Shoes Size 9",
          price: 38.50,
          currency: 'USD',
          sizes: ['9', '10'],
          material: 'synthetic knit',
          rating: 4.4,
          shipping_cost: 0.0,
          source: 'walmart',
          url: 'https://www.walmart.com/ip/shoe2',
          availability: true,
          description: 'Responsive cushion runner with high durability rubber outsole.',
          image_url: PRODUCT_IMAGES.shoes_2,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: Math.min(1, Math.max(0, 1 - 38.50 / maxBudget)),
        shipping_score: 1.0,
        rating_score: 4.4 / 5,
        final_score: 0.89,
        validation_reasons: ['All hard filters passed', 'Direct size 9 match', 'Excellent price to rating ratio'],
      },
      {
        product: {
          id: 'shoe-3',
          title: "Reebok Men's Floatride Energy Running Shoes",
          price: 85.00,
          currency: 'USD',
          sizes: ['9', '9.5', '10'],
          material: 'engineered mesh',
          rating: 4.7,
          shipping_cost: 0.0,
          source: 'walmart',
          url: 'https://www.walmart.com/ip/shoe3',
          availability: true,
          description: 'Marathon distance trainer with high rebound Floatride energy foam.',
          image_url: PRODUCT_IMAGES.shoes_3,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: Math.min(1, Math.max(0, 1 - 85.00 / maxBudget)),
        shipping_score: 1.0,
        rating_score: 4.7 / 5,
        final_score: 0.78,
        validation_reasons: ['All hard filters passed', 'High consumer rating (4.7)', 'Free shipping included'],
      },
    ];
  } else if (isSweater) {
    validCandidates = [
      {
        product: {
          id: 'swtr-1',
          title: "Time and Tru Women's 100% Wool Knit Sweater",
          price: 54.98,
          currency: 'USD',
          sizes: ['M', 'L'],
          material: 'wool',
          rating: 4.5,
          shipping_cost: 0.0,
          source: 'walmart',
          url: 'https://www.walmart.com/ip/swtr1',
          availability: true,
          description: 'Cozy and warm 100% pure wool knitted winter sweater.',
          image_url: PRODUCT_IMAGES.sweater_1,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: Math.min(1, Math.max(0, 1 - 54.98 / maxBudget)),
        shipping_score: 1.0,
        rating_score: 4.5 / 5,
        final_score: 0.75,
        validation_reasons: ['All hard filters passed', '100% pure wool exact match', 'Under $70 limit', 'Free shipping'],
      },
      {
        product: {
          id: 'swtr-2',
          title: "Women's 100% Merino Wool Crewneck Sweater",
          price: 64.99,
          currency: 'USD',
          sizes: ['M', 'L'],
          material: 'wool',
          rating: 4.7,
          shipping_cost: 0.0,
          source: 'amazon',
          url: 'https://www.amazon.com/dp/swtr2',
          availability: true,
          description: 'Superfine Merino wool sweater with ribbed cuffs and hem.',
          image_url: PRODUCT_IMAGES.sweater_2,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: Math.min(1, Math.max(0, 1 - 64.99 / maxBudget)),
        shipping_score: 1.0,
        rating_score: 4.7 / 5,
        final_score: 0.72,
        validation_reasons: ['All hard filters passed', 'Merino wool premium rating (4.7)', 'Complies with size L'],
      },
    ];
  } else {
    // Default: Coat / Jacket
    validCandidates = [
      {
        product: {
          id: 'prod-1',
          title: "Cotton Casual Windbreaker Spring Coat",
          price: 49.99,
          currency: 'USD',
          sizes: ['S', 'M', 'L'],
          material: 'cotton',
          rating: 3.9,
          shipping_cost: 0.0,
          source: 'ebay',
          url: 'https://www.ebay.com/itm/EBAY_COAT_04',
          availability: true,
          description: 'Lightweight, breathable 100% cotton casual utility coat with storm flap and dual pockets.',
          image_url: PRODUCT_IMAGES.coat_1,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: 0.50, // 1 - 49.99/100
        shipping_score: 1.0,
        rating_score: 0.78, // 3.9/5
        final_score: 0.83,
        validation_reasons: [
          'All hard filters passed',
          'Exact material match: 100% cotton (Score: 1.0)',
          'Budget savings: $50.01 under $100 budget',
          'Free shipping',
          'Supports target sizes M and L',
        ],
      },
      {
        product: {
          id: 'prod-2',
          title: "Cotton Casual Daily Coat with Hood",
          price: 69.99,
          currency: 'USD',
          sizes: ['M', 'L'],
          material: 'cotton',
          rating: 4.3,
          shipping_cost: 0.0,
          source: 'walmart',
          url: 'https://www.walmart.com/ip/WM_COAT_01',
          availability: true,
          description: 'Pure cotton casual jacket with zip front closure, thermal hood, and comfortable inner lining.',
          image_url: PRODUCT_IMAGES.coat_2,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: 0.30,
        shipping_score: 1.0,
        rating_score: 0.86,
        final_score: 0.78,
        validation_reasons: [
          'All hard filters passed',
          'Exact material match: cotton',
          'Verified size M and L options',
          'Free shipping included',
        ],
      },
      {
        product: {
          id: 'prod-3',
          title: "Men's Cotton Coat Classic Vintage Style",
          price: 79.99,
          currency: 'USD',
          sizes: ['M', 'L'],
          material: 'cotton',
          rating: 4.4,
          shipping_cost: 0.0,
          source: 'ebay',
          url: 'https://www.ebay.com/itm/EBAY_COAT_01',
          availability: true,
          description: 'Vintage styled military field coat with 100% cotton canvas outer layer.',
          image_url: PRODUCT_IMAGES.coat_3,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: 0.20,
        shipping_score: 1.0,
        rating_score: 0.88,
        final_score: 0.75,
        validation_reasons: [
          'All hard filters passed',
          'Exact cotton material match',
          'High user rating (4.4/5.0)',
          'Free shipping',
        ],
      },
      {
        product: {
          id: 'prod-4',
          title: "Winter Cotton Padded Jacket Parka",
          price: 84.99,
          currency: 'USD',
          sizes: ['L', 'XL'],
          material: 'cotton',
          rating: 4.5,
          shipping_cost: 0.0,
          source: 'walmart',
          url: 'https://www.walmart.com/ip/WM_COAT_02',
          availability: true,
          description: 'Heavy duty cold weather parka with cotton exterior and quilted insulation.',
          image_url: PRODUCT_IMAGES.coat_4,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: 0.15,
        shipping_score: 1.0,
        rating_score: 0.90,
        final_score: 0.73,
        validation_reasons: [
          'All hard filters passed',
          'Target size L verified in inventory',
          'Premium customer satisfaction score',
        ],
      },
      {
        product: {
          id: 'prod-5',
          title: "Men's Cotton Winter Coat Heavy Duty Parka",
          price: 89.99,
          currency: 'USD',
          sizes: ['M', 'L'],
          material: 'cotton',
          rating: 4.5,
          shipping_cost: 0.0,
          source: 'amazon',
          url: 'https://www.amazon.com/dp/B08COTTON01',
          availability: true,
          description: 'Amazon bestselling cotton winter coat with fleece lining and detachable hood.',
          image_url: PRODUCT_IMAGES.coat_5,
        },
        hard_filter_passed: true,
        material_score: 1.0,
        price_score: 0.10,
        shipping_score: 1.0,
        rating_score: 0.90,
        final_score: 0.72,
        validation_reasons: [
          'All hard filters passed',
          '100% cotton construction',
          'Prime free shipping',
        ],
      },
    ];
  }

  // Realistic rejected products for validation transparency
  rejectedCandidates = [
    {
      product: {
        id: 'rej-1',
        title: "Extreme Alpine Heavy Goose Down Coat",
        price: 149.99,
        currency: 'USD',
        sizes: ['M', 'L'],
        material: 'cotton',
        rating: 4.8,
        shipping_cost: 0.0,
        source: 'amazon',
        url: 'https://www.amazon.com/dp/rej1',
        availability: true,
        image_url: PRODUCT_IMAGES.coat_rejected,
      },
      hard_filter_passed: false,
      material_score: 1.0,
      price_score: 0.0,
      shipping_score: 1.0,
      rating_score: 0.96,
      final_score: 0.0,
      validation_reasons: [`Price ($149.99) exceeds maximum budget ($${maxBudget.toFixed(2)})`],
    },
    {
      product: {
        id: 'rej-2',
        title: "Cotton Canvas Rancher Chore Coat",
        price: 82.50,
        currency: 'USD',
        sizes: ['XL', 'XXL'],
        material: 'cotton',
        rating: 4.4,
        shipping_cost: 0.0,
        source: 'amazon',
        url: 'https://www.amazon.com/dp/rej2',
        availability: true,
      },
      hard_filter_passed: false,
      material_score: 1.0,
      price_score: 0.175,
      shipping_score: 1.0,
      rating_score: 0.88,
      final_score: 0.0,
      validation_reasons: [`Requested size(s) [${parsedQuery.sizes.join(', ')}] not available in stock (only ['XL', 'XXL'])`],
    },
    {
      product: {
        id: 'rej-3',
        title: "Italian Designer Genuine Leather Trench",
        price: 180.00,
        currency: 'USD',
        sizes: ['M', 'L'],
        material: 'leather',
        rating: 4.9,
        shipping_cost: 0.0,
        source: 'ebay',
        url: 'https://www.ebay.com/itm/rej3',
        availability: true,
      },
      hard_filter_passed: false,
      material_score: 0.0,
      price_score: 0.0,
      shipping_score: 1.0,
      rating_score: 0.98,
      final_score: 0.0,
      validation_reasons: [`Price ($180.00) exceeds maximum budget ($${maxBudget.toFixed(2)})`],
    },
    {
      product: {
        id: 'rej-4',
        title: "Men's Cotton Ankle Socks 6-Pack",
        price: 18.00,
        currency: 'USD',
        sizes: ['M', 'L'],
        material: 'cotton',
        rating: 4.6,
        shipping_cost: 0.0,
        source: 'walmart',
        url: 'https://www.walmart.com/ip/rej4',
        availability: true,
      },
      hard_filter_passed: false,
      material_score: 1.0,
      price_score: 0.82,
      shipping_score: 1.0,
      rating_score: 0.92,
      final_score: 0.0,
      validation_reasons: [`Product title 'Men's Cotton Ankle Socks 6-Pack' does not match requested item '${parsedQuery.product}'`],
    },
  ];

  const bestProduct = validCandidates.length > 0 ? validCandidates[0] : null;

  const executionStages: PipelineStage[] = [
    {
      id: 'understanding',
      name: 'Input Understanding',
      layer: 'IGNA',
      status: 'completed',
      description: 'Extracted semantic requirements: product, price, sizes, and material.',
      details: [
        `Target product: ${parsedQuery.product}`,
        `Material preference: ${parsedQuery.material || 'Any'}`,
        `Budget threshold: ≤ $${maxBudget}`,
        `Accepted sizes: ${parsedQuery.sizes.join(', ')}`,
      ],
    },
    {
      id: 'planning',
      name: 'Search Planning',
      layer: 'IGNA',
      status: 'completed',
      description: 'Created 3 deterministic browser execution tasks across shopping platforms.',
      details: [
        `Task 1: Amazon Search ('${parsedQuery.gender || ''} ${parsedQuery.material || ''} ${parsedQuery.product}'.trim())`,
        `Task 2: eBay Search ('${parsedQuery.gender || ''} ${parsedQuery.material || ''} ${parsedQuery.product}'.trim())`,
        `Task 3: Walmart Search ('${parsedQuery.gender || ''} ${parsedQuery.material || ''} ${parsedQuery.product}'.trim())`,
      ],
    },
    {
      id: 'execution',
      name: 'Browser Search & Extraction',
      layer: 'CUA',
      status: 'completed',
      description: 'Navigated websites via Playwright async API and extracted raw candidate items.',
      details: [
        'Amazon: 7 candidate items extracted',
        'eBay: 7 candidate items extracted',
        'Walmart: 7 candidate items extracted',
      ],
    },
    {
      id: 'formatting',
      name: 'Data Normalization',
      layer: 'CUA',
      status: 'completed',
      description: 'Converted raw DOM data into strict typed Product schema contracts.',
      details: [
        'Sanitized price strings, currency codes, and rating numbers',
        'Standardized size arrays and clean canonical URLs',
      ],
    },
    {
      id: 'validation',
      name: 'Requirements Validation',
      layer: 'IGNA',
      status: 'completed',
      description: 'Enforced strict hard constraints (budget, size variants, core category).',
      details: [
        `Total collected: ${validCandidates.length + rejectedCandidates.length}`,
        `Valid candidates: ${validCandidates.length}`,
        `Rejected non-conforming items: ${rejectedCandidates.length}`,
      ],
    },
    {
      id: 'ranking',
      name: 'Scoring & Deduplication',
      layer: 'IGNA',
      status: 'completed',
      description: 'Applied RapidFuzz cross-source deduplication and weighted ranking formula.',
      details: [
        'Formula: (Material × 0.4) + (Price × 0.3) + (Shipping × 0.2) + (Rating × 0.1)',
        'Deduplicated redundant cross-listings',
        `Selected Top ${validCandidates.length} best matches across all platforms`,
      ],
    },
    {
      id: 'recommendation',
      name: 'Decision Explainability',
      layer: 'IGNA',
      status: 'completed',
      description: 'Designated highest-ranked candidate with mathematically grounded reasoning.',
      details: [
        `Top Choice: ${bestProduct?.product.title}`,
        `Final Score: ${((bestProduct?.final_score || 0) * 100).toFixed(0)}%`,
      ],
    },
  ];

  const sourcesStatus: Record<string, SourceStatus> = {
    amazon: { site: 'Amazon', status: 'completed', products_found: 7, valid_products: 4 },
    ebay: { site: 'eBay', status: 'completed', products_found: 7, valid_products: 5 },
    walmart: { site: 'Walmart', status: 'completed', products_found: 7, valid_products: 5 },
  };

  const explanation = bestProduct
    ? `Recommended as the #1 choice (Composite Score: ${(bestProduct.final_score * 100).toFixed(0)}%) on ${bestProduct.product.source.toUpperCase()} ` +
      `because it exactly matches your desired ${parsedQuery.material || 'product'} specification, ` +
      `is priced at $${bestProduct.product.price.toFixed(2)} (saving $${(maxBudget - bestProduct.product.price).toFixed(2)} under your $${maxBudget} budget), ` +
      `verifiably supports sizes ${parsedQuery.sizes.join(', ')}, offers free shipping, and maintains a solid customer rating of ${bestProduct.product.rating?.toFixed(1) || '4.0'}/5.0.`
    : 'No products satisfied all hard constraints.';

  return {
    search_id: 'srch_' + Math.random().toString(36).substring(2, 9),
    raw_query: userQueryStr,
    playwright_query: parsedQuery.product,
    execution_tasks: [
      { site: 'amazon', search_query: parsedQuery.product, filters: { max_price: maxBudget, sizes: parsedQuery.sizes } },
    ],
    query: parsedQuery,
    summary: {
      total_collected: validCandidates.length + rejectedCandidates.length,
      valid_count: validCandidates.length,
      rejected_count: rejectedCandidates.length,
      sources_count: 3,
      top_score: bestProduct?.final_score ?? 0,
      site_counts: { amazon: 7, ebay: 7, walmart: 7 },
    },
    top_products: validCandidates,
    best_product: bestProduct,
    rejected_products: rejectedCandidates,
    explanation,
    execution_stages: executionStages,
    sources_status: sourcesStatus,
    weights: DEFAULT_WEIGHTS,
  };
}
