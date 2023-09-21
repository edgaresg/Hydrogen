import { useLoaderData, useLocation, useNavigation, useSearchParams } from "@remix-run/react"; import { CartForm } from "@shopify/hydrogen";
import { MediaFile, Money, ShopPayButton } from '@shopify/hydrogen-react';
import { json } from "@shopify/remix-oxygen";
import ProductOptions from "~/components/product/options/ProductOptions";

export const action = ({ params, context, request }) => {
  console.log(params);
}

export async function loader({ params, context, request }) {
  const { handle } = params
  const searchParams = new URL(request.url).searchParams
  const selectedOptions = []

  searchParams.forEach((value, name) => {
    selectedOptions.push({ name, value })
  })


  const { product } = await context.storefront.query(PRODUCT_QUERY, {
    variables: { handle, selectedOptions }
  })

  const selectedVariant = product.selectedVariant ?? product.variants.nodes[0]

  const storeDomain = context.storefront.getShopifyDomain()

  return json({ product, selectedVariant, storeDomain })
}

export default function ProductHandle() {
  const { product, selectedVariant, storeDomain } = useLoaderData();
  const orderable = selectedVariant?.availableForSale || false

  return (
    <section className="w-full gap-4 md:gap-8 grid px-6 md:px-8 lg:px-12">
      <div className="grid items-start gap-6 lg:gap-20 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid md:grid-flow-row md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
          <div className="md:col-span-2 snap-center card-image aspect-square md:w-full w-[80vw] shadow rounded">
            <ProductGallery media={selectedVariant} />
          </div>
        </div>
        <div className="md:sticky md:mx-auto max-w-xl md:max-w-[24rem] grid gap-8 p-0 md:p-6 md:px-0 top-[6rem] lg:top-[8rem] xl:top-[10rem]">
          <div className="grid gap-2">
            <h1 className="text-4xl font-bold leading-10 whitespace-normal">
              {product.title}
            </h1>
            <span className="max-w-prose whitespace-pre-wrap inherit text-copy opacity-50 font-medium">
              {product.vendor}
            </span>
          </div>
          <ProductOptions options={product.options} selectedVariant={selectedVariant} />
          <Money
            withoutTrailingZeros
            data={selectedVariant.price}
            className="text-xl font-semibold mb-2"
          />
          {orderable && (
            <div className="space-y-2">
              <ShopPayButton
                storeDomain={storeDomain}
                variantIds={[selectedVariant?.id]}
                width={'400px'}
              />
              <ProductForm variantId={selectedVariant?.id} />
            </div>
          )}

          <p>Selected variant: {product.selectedVariant?.id}</p>
          <div
            className="prose border-t border-gray-200 pt-6 text-black text-md"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          ></div>
        </div>
      </div>
    </section>
  );
}

function ProductGallery({ media }) {
  const { pathname, search } = useLocation()
  const [currentSearchParams] = useSearchParams()
  const navigation = useNavigation()

  const typeNameMap = {
    MODEL_3D: 'Model3d',
    VIDEO: 'Video',
    IMAGE: 'MediaImage',
    EXTERNAL_VIDEO: 'ExternalVideo',
  };

  const data = {
    ...media,
    __typename: typeNameMap[media.mediaContentType] || typeNameMap['IMAGE'],
    image: {
      ...media.image,
      altText: media.alt || 'Product image',
    },
  };

  return (
    <div
      className={`grid gap-4 overflow-x-scroll grid-flow-col md:grid-flow-row  md:p-0 md:overflow-x-auto md:grid-cols-2 w-[90vw] md:w-full lg:col-span-2`}
    >
      <div
        className={`md:col-span-2 snap-center card-image bg-white aspect-square md:w-full w-[80vw] shadow-sm rounded`}
      >
        <MediaFile
          tabIndex="0"
          className={`w-full h-full aspect-square object-cover`}
          data={data}
        />
      </div>
    </div>
  );
}

function ProductForm({ variantId }) {
  const lines = [{ merchandiseId: variantId, quantity: 1 }];

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={
        { lines }
      }
    >
      <button className="bg-black text-white px-6 py-3 w-full rounded-md text-center font-medium max-w-[400px]">
        Add to Bag
      </button>
    </CartForm>
  );
}



const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    product(handle: $handle) {
      id
      title
      handle
      vendor
      descriptionHtml
      media(first: 10) {
        nodes {
          ... on MediaImage {
            mediaContentType
            image {
              id
              url
              altText
              width
              height
            }
          }
          ... on Model3d {
            id
            mediaContentType
            sources {
              mimeType
              url
            }
          }
        }
      }
      options {
        name,
        values
      }
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;
