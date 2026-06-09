/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { fireEvent, render, screen } from '@testing-library/preact';
import { act } from 'preact/test-utils';

import { sampleProductNotDiscounted } from './MockData';
import ProductItem from './ProductItem';

beforeEach(() => {
  // IntersectionObserver isn't available in test environment
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
});

describe('WidgetSDK - UIKit/ProductItem', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders', () => {
    const { container } = render(
      <ProductItem
        item={sampleProductNotDiscounted}
        currencySymbol="$"
        currencyRate="USD"
        setRoute={undefined}
        refineProduct={() => {}}
      />
    );

    const elem = container.querySelector('.ds-sdk-product-item');

    expect(!!elem).toEqual(true);
  });

  test('shows loading and success checkmark when add to cart succeeds', async () => {
    jest.useFakeTimers();
    let resolveAddToCart: () => void = () => {};
    const addToCart = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAddToCart = resolve;
        })
    );

    const { container } = render(
      <ProductItem
        item={sampleProductNotDiscounted}
        currencySymbol="$"
        currencyRate="USD"
        setRoute={undefined}
        refineProduct={() => {}}
        addToCart={addToCart}
      />
    );

    const button = screen.getByRole('button', { name: /add to cart/i });

    fireEvent.click(button);

    expect(button.hasAttribute('disabled')).toEqual(true);
    expect(button.textContent).toEqual('');
    const loadingIcon = container.querySelector(
      '.ds-sdk-add-to-cart-button .add-to-cart-loading-icon'
    ) as HTMLElement;
    expect(!!loadingIcon).toEqual(true);
    expect(loadingIcon.style.width).toEqual('25px');
    expect(loadingIcon.style.height).toEqual('25px');

    await act(async () => {
      resolveAddToCart();
    });

    expect(button.hasAttribute('disabled')).toEqual(false);
    expect(button.textContent).toEqual('');
    expect(button.getAttribute('aria-label')).toEqual('Added to cart');
    const successIcon = container.querySelector(
      '.ds-sdk-add-to-cart-button .add-to-cart-success-icon'
    ) as HTMLElement;
    expect(!!successIcon).toEqual(true);
    expect(successIcon.style.width).toEqual('25px');
    expect(successIcon.style.height).toEqual('25px');
    expect(
      !!container.querySelector('.add-to-cart .add-to-cart-message')
    ).toEqual(false);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(
      !!container.querySelector('.ds-sdk-add-to-cart-button .add-to-cart-success-icon')
    ).toEqual(false);
    expect(button.textContent).toEqual('Add to Cart');
  });

  test('reports error when add to cart fails', async () => {
    const errorMessage =
      'Something went wrong trying to add an item to your cart.';
    const addToCart = jest.fn(() => Promise.reject(new Error('failed')));
    const onAddToCartError = jest.fn();

    const { container } = render(
      <ProductItem
        item={sampleProductNotDiscounted}
        currencySymbol="$"
        currencyRate="USD"
        setRoute={undefined}
        refineProduct={() => {}}
        addToCart={addToCart}
        onAddToCartError={onAddToCartError}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    });

    expect(onAddToCartError).toHaveBeenCalledWith(errorMessage);
    expect(
      !!container.querySelector('.add-to-cart .add-to-cart-message')
    ).toEqual(false);
  });
});
