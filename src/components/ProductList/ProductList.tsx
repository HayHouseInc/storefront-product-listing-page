/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { FunctionComponent } from 'preact';
import { HTMLAttributes } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';

import './product-list.css';

import { Alert } from '../../components/Alert';
import { useProducts, useStore } from '../../context';
import { Product } from '../../types/interface';
import { classNames } from '../../utils/dom';
import ProductItem from '../ProductItem';

type AddToCartError = {
  id: number;
  message: string;
};

export interface ProductListProps extends HTMLAttributes<HTMLDivElement> {
  products: Array<Product> | null | undefined;
  numberOfColumns: number;
  showFilters: boolean;
}

export const ProductList: FunctionComponent<ProductListProps> = ({
  products,
  numberOfColumns,
  showFilters,
}) => {
  const productsCtx = useProducts();
  const {
    currencySymbol,
    currencyRate,
    setRoute,
    refineProduct,
    addToCart,
  } = productsCtx;
  const { viewType } = useProducts();
  const {
    config: { listview },
  } = useStore();
  const [addToCartError, setAddToCartError] =
    useState<AddToCartError | null>(null);
  const addToCartErrorRef = useRef<HTMLDivElement>(null);

  const className = showFilters
    ? 'ds-sdk-product-list bg-body max-w-full pl-3 pb-2xl sm:pb-24'
    : 'ds-sdk-product-list bg-body w-full mx-auto pb-2xl sm:pb-24';

  useEffect(() => {
    if (!addToCartError) {
      return;
    }

    window.scrollTo(0, 0);
  }, [addToCartError]);

  const handleAddToCartError = (message: string) => {
    setAddToCartError((current) => ({
      id: (current?.id ?? 0) + 1,
      message,
    }));
  };

  return (
    <div
      className={classNames(
        'ds-sdk-product-list bg-body pb-2xl sm:pb-24',
        className
      )}
    >
      {addToCartError && (
        <div ref={addToCartErrorRef} className="mt-8 mb-4">
          <Alert
            title={addToCartError.message}
            type="error"
            description=""
            onClick={() => setAddToCartError(null)}
          />
        </div>
      )}
      {listview && viewType === 'listview' ? (
        <div className="w-full">
          <div className="ds-sdk-product-list__list-view-default mt-md grid grid-cols-none pt-[15px] w-full gap-[10px]">
            {products?.map((product) => (
              <ProductItem
                item={product}
                key={product?.productView?.id}
                currencySymbol={currencySymbol}
                currencyRate={currencyRate}
                setRoute={setRoute}
                refineProduct={refineProduct}
                onAddToCartError={handleAddToCartError}
                addToCart={addToCart}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            gridTemplateColumns: `repeat(${numberOfColumns}, minmax(0, 1fr))`,
          }}
          className="ds-sdk-product-list__grid product-items mt-md grid gap-y-8 gap-x-2xl xl:gap-x-8"
        >
          {products?.map((product) => (
            <ProductItem
              item={product}
              key={product?.productView?.id}
              currencySymbol={currencySymbol}
              currencyRate={currencyRate}
              setRoute={setRoute}
              refineProduct={refineProduct}
              onAddToCartError={handleAddToCartError}
              addToCart={addToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
