import React from 'react';
import { ValidatedProduct } from '../../types/shopping';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ValidatedProduct[];
  onSelect: (item: ValidatedProduct) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((item, index) => (
        <ProductCard
          key={item.product.id}
          item={item}
          rank={index + 1}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
