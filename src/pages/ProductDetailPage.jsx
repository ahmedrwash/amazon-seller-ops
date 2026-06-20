import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import ProductDetail from '@/components/products/ProductDetail';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { getProductById, loading, error } = useProducts();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const data = await getProductById(id);
      setProduct(data);
    };
    if (id) fetchProduct();
  }, [id, getProductById]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading product...</div>;
  if (error || !product) return (
    <div className="p-8 text-center">
      <h2 className="text-xl text-red-500">Product not found</h2>
      <Button variant="link" onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <Helmet>
        <title>{product.product_name} - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <Header />
        <ProductDetail product={product} />
      </div>
    </div>
  );
};

export default ProductDetailPage;