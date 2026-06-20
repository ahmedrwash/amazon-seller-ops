import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import ProductForm from '@/components/products/ProductForm';
import { useProducts } from '@/hooks/useProducts';

const ProductEditPage = () => {
  const { id } = useParams();
  const { getProductById, loading } = useProducts();
  const [product, setProduct] = useState(null);

  const fetchProduct = async () => {
    if (!id) return;
    const data = await getProductById(id);
    setProduct(data);
  };

  useEffect(() => {
    fetchProduct();
  }, [id, getProductById]);

  if (loading && !product) return <div className="p-8 text-center text-slate-400">Loading...</div>;
  if (!loading && !product) return <div className="p-8 text-center text-slate-400">Product not found</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 pb-20">
      <Helmet>
        <title>Edit Product - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto space-y-8">
        <Header />
        
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Edit Product</h2>
          <p className="text-slate-400">Manage product details and specifications.</p>
        </div>

        {product && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <ProductForm productId={id} initialData={product} />
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductEditPage;