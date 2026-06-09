/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import '../ProductItem/ProductItem.css';

import { useCart, useProducts, useSensor, useStore } from '../../context';
import NoImage from '../../icons/NoImage.svg';
import {
  Product,
  ProductViewMedia,
  RedirectRouteFunc,
  RefinedProduct,
} from '../../types/interface';
import { SEARCH_UNIT_ID } from '../../utils/constants';
import {
  generateOptimizedImages,
  getProductImageURLs,
} from '../../utils/getProductImage';
import { htmlStringDecode } from '../../utils/htmlStringDecode';
import { AddToCartButton } from '../AddToCartButton';
import { ImageCarousel } from '../ImageCarousel';
import { SwatchButtonGroup } from '../SwatchButtonGroup';
import ProductPrice from './ProductPrice';

const ADD_TO_CART_SUCCESS_DISPLAY_DELAY = 4000;
const ADD_TO_CART_ERROR_MESSAGE =
  'Something went wrong trying to add an item to your cart.';

export interface ProductProps {
  item: Product;
  currencySymbol: string;
  currencyRate?: string;
  setRoute?: RedirectRouteFunc | undefined;
  refineProduct: (optionIds: string[], sku: string) => any;
  onAddToCartError?: (message: string) => void;
  addToCart?: (
    sku: string,
    options: [],
    quantity: number
  ) => Promise<void | undefined>;
}

export const ProductItem: FunctionComponent<ProductProps> = ({
  item,
  currencySymbol,
  currencyRate,
  setRoute,
  refineProduct,
  onAddToCartError,
  addToCart,
}: ProductProps) => {
  const { product, productView } = item;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedSwatch, setSelectedSwatch] = useState('');
  const [imagesFromRefinedProduct, setImagesFromRefinedProduct] = useState<
    ProductViewMedia[] | null
  >();
  const [refinedProduct, setRefinedProduct] = useState<RefinedProduct>();
  const [isHovering, setIsHovering] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddToCartSuccessful, setIsAddToCartSuccessful] = useState(false);
  const { addToCartGraphQL, refreshCart } = useCart();
  const { viewType } = useProducts();
  const {
    config: { optimizeImages, imageBaseWidth, imageCarousel, listview },
  } = useStore();

  const { screenSize } = useSensor();

  useEffect(() => {
    if (!isAddToCartSuccessful) {
      return;
    }

    const successTimer = window.setTimeout(() => {
      setIsAddToCartSuccessful(false);
    }, ADD_TO_CART_SUCCESS_DISPLAY_DELAY);

    return () => {
      window.clearTimeout(successTimer);
    };
  }, [isAddToCartSuccessful]);

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };

  const handleSelection = async (optionIds: string[], sku: string) => {
    const data = await refineProduct(optionIds, sku);
    setSelectedSwatch(optionIds[0]);
    setImagesFromRefinedProduct(data.refineProduct.images);
    setRefinedProduct(data);
    setCarouselIndex(0);
  };
  
  const getAttributeValue = (attributeName: string) => {
    const value = productView.attributes?.find((attr) => attr.name === attributeName)?.value;
    return (value === null || value === '') ? null : value;
  };
  
  const getFormatIcon = () => {
    const formatIcon = getAttributeValue('format_icon');
    return (formatIcon) ? ('/media/wysiwyg/' + formatIcon ) : '';
  };
  
  const getFormat = () => {
    return getAttributeValue('format');
  }
  
  const getFormatClassName = () => {
    const format = getFormat();
    return format ? format.toLowerCase().replace(/ /g, '-') : '';
  };
  
  const getAuthors = () => {
    let authors = getAttributeValue('authors');
    if (Array.isArray(authors)) {
      return authors.join(', ');
    }
    return authors;
  }
  
  const getEBookUrl = () => {
    const externalUrl = getAttributeValue('external_url');
    const kindleUrl = getAttributeValue('kindle_url');
    const ibooksUrl = getAttributeValue('ibooks_url');
    const nookUrl = getAttributeValue('nook_url');
    const itunesUrl = getAttributeValue('itunes_url');
    return externalUrl || kindleUrl || ibooksUrl || nookUrl || itunesUrl;
  }
  
  const getIsNew = () => {
    const newFrom =  getAttributeValue('news_from_date');
    const newTill =  getAttributeValue('news_to_date');
    const today = new Date();
    return (newFrom && newTill) ? today >= new Date(newFrom) && today <= new Date(newTill) : false;
  }
  
  const getBadge = () => {
    let badgeText = '';
    if (getIsNew()) {
      badgeText = 'New Release';
    } else if (getAttributeValue('bestseller') == 'yes'){
      badgeText = 'Bestseller';
    } else if (getAttributeValue('payment_plan_available') == 'yes') {
      badgeText = 'Payment Plan Available';
    }
    const className = badgeText.toLowerCase().replace(/ /g, '-');
    if (badgeText) {
      return '<div class="product-tag detail ' + className + '"><span>' + badgeText + '</span></div>';
    }
    return null;
  };
  
  const getContentType = () => {
    return getAttributeValue('product_content_type');
  }
  
  const getExternalUrl = () => {
    return getAttributeValue('external_url');
  }

  const isSelected = (id: string) => {
    const selected = selectedSwatch ? selectedSwatch === id : false;
    return selected;
  };

  const productImageArray = imagesFromRefinedProduct
    ? getProductImageURLs(imagesFromRefinedProduct ?? [], imageCarousel ? 3 : 1)
    : getProductImageURLs(
        productView.images ?? [],
        imageCarousel ? 3 : 1, // number of images to display in carousel
        product.image?.url ?? undefined
      );
  let optimizedImageArray: { src: string; srcset: any }[] = [];

  if (optimizeImages) {
    optimizedImageArray = generateOptimizedImages(
      productImageArray,
      imageBaseWidth ?? 200
    );
  }

  // will have to figure out discount logic for amount_off and percent_off still
  const discount: boolean = refinedProduct
    ? refinedProduct.refineProduct?.priceRange?.minimum?.regular?.amount
        ?.value >
      refinedProduct.refineProduct?.priceRange?.minimum?.final?.amount?.value
    : product?.price_range?.minimum_price?.regular_price?.value >
        product?.price_range?.minimum_price?.final_price?.value ||
      productView?.price?.regular?.amount?.value >
        productView?.price?.final?.amount?.value;
  const isSimple = product?.__typename === 'SimpleProduct';
  const isComplexProductView = productView?.__typename === 'ComplexProductView';
  const isBundle = product?.__typename === 'BundleProduct';
  const isGrouped = product?.__typename === 'GroupedProduct';
  const isGiftCard = product?.__typename === 'GiftCardProduct';
  const isConfigurable = product?.__typename === 'ConfigurableProduct';
  const isVirtual = product?.__typename === 'VirtualProduct';

  const onProductClick = () => {
    window.magentoStorefrontEvents?.publish.searchProductClick(
      SEARCH_UNIT_ID,
      product?.sku
    );
  };

  const productUrl = setRoute
    ? setRoute({ sku: productView?.sku, urlKey: productView?.urlKey })
    : product?.canonical_url;

  const handleAddToCart = async () => {
    if (isAddingToCart) {
      return;
    }

    setIsAddToCartSuccessful(false);
    if (isSimple || isVirtual) {
      setIsAddingToCart(true);
      try {
        if (addToCart) {
          //Custom add to cart function passed in
          await addToCart(productView.sku, [], 1);
        } else {
          // Add to cart using GraphQL & Luma extension
          const response = await addToCartGraphQL(productView.sku);

          if (
            response?.errors ||
            response?.data?.addProductsToCart?.user_errors?.length > 0
          ) {
            onAddToCartError && onAddToCartError(ADD_TO_CART_ERROR_MESSAGE);
            return;
          }

          refreshCart && refreshCart();
        }
        setIsAddingToCart(false);
        window.location.href = '/checkout/cart'
        //setIsAddToCartSuccessful(true);
      } catch (error) {
        onAddToCartError && onAddToCartError(ADD_TO_CART_ERROR_MESSAGE);
      } finally {
        setIsAddingToCart(false);
      }
    } else if (productUrl) {
      window.open(productUrl, '_self');
    }
  };

  const badge = getBadge();

  if (listview && viewType === 'listview') {
    return (
      <>
        <div className="grid-container">
          <div
            className={`product-image ds-sdk-product-item__image relative rounded-md overflow-hidden}`}
          >
            <a
              href={productUrl as string}
              onClick={onProductClick}
              className="!text-primary hover:no-underline hover:text-primary"
            >
              {/* Image */}
              {productImageArray.length ? (
                <ImageCarousel
                  images={
                    optimizedImageArray.length
                      ? optimizedImageArray
                      : productImageArray
                  }
                  productName={product.name}
                  carouselIndex={carouselIndex}
                  setCarouselIndex={setCarouselIndex}
                />
              ) : (
                <NoImage
                  className={`max-h-[250px] max-w-[200px] pr-5 m-auto object-cover object-center lg:w-full`}
                />
              )}
            </a>
          </div>
          <div className="product-details">
            <div className="flex flex-col w-1/3">
              {/* Product name */}
              <a
                href={productUrl as string}
                onClick={onProductClick}
                className="!text-primary hover:no-underline hover:text-primary"
              >
                <div className="ds-sdk-product-item__product-name mt-xs text-sm text-primary">
                  {product.name !== null && htmlStringDecode(product.name)}
                </div>
                <div className="ds-sdk-product-item__product-sku mt-xs text-sm text-primary">
                  SKU:
                  {product.sku !== null && htmlStringDecode(product.sku)}
                </div>
              </a>

              {/* Swatch */}
              <div className="ds-sdk-product-item__product-swatch flex flex-row mt-sm text-sm text-primary pb-6">
                {productView?.options?.map(
                  (swatches) =>
                    swatches.id === 'color' && (
                      <SwatchButtonGroup
                        key={productView?.sku}
                        isSelected={isSelected}
                        swatches={swatches.values ?? []}
                        showMore={onProductClick}
                        productUrl={productUrl as string}
                        onClick={handleSelection}
                        sku={productView?.sku}
                      />
                    )
                )}
              </div>
            </div>
          </div>
          <div className="product-price">
            <a
              href={productUrl as string}
              onClick={onProductClick}
              className="!text-primary hover:no-underline hover:text-primary"
            >
              <ProductPrice
                item={refinedProduct ?? item}
                isBundle={isBundle}
                isGrouped={isGrouped}
                isGiftCard={isGiftCard}
                isConfigurable={isConfigurable}
                isComplexProductView={isComplexProductView}
                discount={discount}
                currencySymbol={currencySymbol}
                currencyRate={currencyRate}
              />
            </a>
          </div>
          <div className="product-description text-sm text-primary mt-xs">
            <a
              href={productUrl as string}
              onClick={onProductClick}
              className="!text-primary hover:no-underline hover:text-primary"
            >
              {product.short_description?.html ? (
                <>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: product.short_description.html,
                    }}
                  />
                </>
              ) : (
                <span />
              )}
            </a>
          </div>

          {/* TO BE ADDED LATER */}
          <div className="product-ratings" />
          {productView.inStock ? (
            <div className="product-add-to-cart add-to-cart">
              <div className="pb-4 w-96">
                <AddToCartButton
                  onClick={handleAddToCart}
                  loading={isAddingToCart}
                  success={isAddToCartSuccessful}
                />
              </div>
            </div>
          ) : (
              <div className="product-add-to-cart">Out of Stock</div>
          )}
        </div>
      </>
    );
  }

  return (
    <div
      className="ds-sdk-product-item product-item group relative flex flex-col max-w-sm justify-between h-full hover:border-[1.5px] border-solid hover:shadow-lg border-offset-2 p-2"
      style={{
        'border-color': '#D5D5D5',
      }}
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseOut}
    >
      <a
        href={productUrl as string}
        onClick={onProductClick}
        className="!text-primary hover:no-underline hover:text-primary product"
      >
        <div className="ds-sdk-product-item__main product-item-details relative flex flex-col justify-between h-full product-list-item">
          {badge ? <div dangerouslySetInnerHTML={{ __html: badge }} /> : null}
          <div className="ds-sdk-product-item__image relative w-full h-full rounded-md overflow-hidden">
            <div className="product-img-wrap">
            {productImageArray.length ? (
              <ImageCarousel
                images={
                  optimizedImageArray.length
                    ? optimizedImageArray
                    : productImageArray
                }
                productName={product.name}
                carouselIndex={carouselIndex}
                setCarouselIndex={setCarouselIndex}
              />
            ) : (
              <NoImage
                className={`max-h-[45rem] w-full object-cover object-center lg:w-full`}
              />
            )}
            </div>
          </div>
          <div className="flex flex-row">
            <div className="flex flex-col">
              {getFormat() ? (
              <div className={`format-type ${getFormatClassName()}`}>
                <img src={getFormatIcon()} alt={`${getFormat()}`}/>
                <span>{getFormat()}</span>
              </div>
              ): null}
              <div className="ds-sdk-product-item__product-name mt-md text-sm text-primary product-item-name">
                {product.name !== null && htmlStringDecode(product.name)}
              </div>
              <div className="ds-sdk-product-item__product-author mt-md text-sm text-primary expert detail">
                {getAuthors()}
              </div>
              <div className="product-description text-sm text-primary mt-xs">
                <a
                    href={productUrl as string}
                    onClick={onProductClick}
                    className="!text-primary hover:no-underline hover:text-primary"
                >
                  {product.short_description?.html ? (
                      <>
                  <span
                      dangerouslySetInnerHTML={{
                        __html: (product.short_description.html.replace(/<[^>]*>/g, '').substring(0, 45) + (product.short_description.html.replace(/<[^>]*>/g, '').length > 45 ? '...' : '')),
                      }}
                  />
                      </>
                  ) : (
                      <span />
                  )}
                </a>
              </div>
              <ProductPrice
                item={refinedProduct ?? item}
                isBundle={isBundle}
                isGrouped={isGrouped}
                isGiftCard={isGiftCard}
                isConfigurable={isConfigurable}
                isComplexProductView={isComplexProductView}
                discount={discount}
                currencySymbol={currencySymbol}
                currencyRate={currencyRate}
              />
            </div>

            {/* 
            //TODO: Wishlist button to be added later
            {flags.addToWishlist && widgetConfig.addToWishlist.enabled && (
              // TODO: Remove flag during phase 3 MSRCH-4278
              <div className="ds-sdk-wishlist ml-auto mt-md">
                <WishlistButton
                  productSku={item.product.sku}
                  type={widgetConfig.addToWishlist.placement}
                />
              </div>
            )} */}
          </div>
        </div>
      </a>

      {productView?.options && productView.options?.length > 0 && (
        <div className="ds-sdk-product-item__product-swatch flex flex-row mt-sm text-sm text-primary">
          {productView?.options?.map(
            (swatches) =>
              swatches.id == 'color' && (
                <SwatchButtonGroup
                  key={product?.sku}
                  isSelected={isSelected}
                  swatches={swatches.values ?? []}
                  showMore={onProductClick}
                  productUrl={productUrl as string}
                  onClick={handleSelection}
                  sku={product?.sku}
                />
              )
          )}
        </div>
      )}
        <div className="pb-4 mt-sm add-to-cart">
          { getEBookUrl() ? (
              <a href={productUrl as string} className="button ebook-url">
                <button>
                  View Details
                </button>
              </a>
          ) : getExternalUrl() ? (
              <a href={getExternalUrl() as string} className="button external-url">
                <button>
                  View Details
                </button>
              </a>
          ) : product.__typename === 'ConfigurableProduct' ? (
              <a href={product.canonical_url as string} className="button view-details">
                <button>
                  View Details
                </button>
              </a>
          ) : (
              productView.inStock ? (
                <>
                  <AddToCartButton
                    onClick={handleAddToCart}
                    loading={isAddingToCart}
                    success={isAddToCartSuccessful}
                  />
                </>
              ) : (
                <div className="out-of-stock">Out of Stock</div>
              )
          )}
        </div>
    </div>
  );
};

export default ProductItem;
