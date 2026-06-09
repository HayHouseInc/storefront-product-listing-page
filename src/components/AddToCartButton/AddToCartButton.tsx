/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { FunctionComponent } from 'preact';

import { useTranslation } from '../../context/translation';
import CheckmarkIcon from '../../icons/checkmark.svg';
import LoadingIcon from '../../icons/loading.svg';

export interface AddToCartButtonProps {
  onClick: (e: any) => any;
  loading?: boolean;
  success?: boolean;
}
export const AddToCartButton: FunctionComponent<AddToCartButtonProps> = ({
  onClick,
  loading = false,
  success = false,
}: AddToCartButtonProps) => {
  const translation = useTranslation();
  const btnLabel = translation.ProductCard.addToCart || 'Add to Cart';
  const accessibleLabel = success ? 'Added to cart' : btnLabel;

  return (
    <div className="ds-sdk-add-to-cart-button">
      <button
        className="flex items-center justify-center text-white text-sm rounded-full h-[32px] w-full p-sm"
        onClick={onClick}
        disabled={loading}
        aria-busy={loading}
        aria-label={accessibleLabel}
        type="button"
      >
        {loading && (
          <LoadingIcon
            className="add-to-cart-loading-icon inline-block animate-spin fill-white"
            style={{
              width: '25px',
              height: '25px',
              maxWidth: '25px',
              maxHeight: '25px',
              flexShrink: 0,
              color: 'white',
            }}
            aria-hidden="true"
          />
        )}
        {!loading && success && (
          <CheckmarkIcon
            className="add-to-cart-success-icon inline-block text-white"
            style={{
              width: '25px',
              height: '25px',
              maxWidth: '25px',
              maxHeight: '25px',
              flexShrink: 0,
              color: 'white',
            }}
            aria-hidden="true"
          />
        )}
        {!loading && !success && btnLabel}
      </button>
    </div>
  );
};
