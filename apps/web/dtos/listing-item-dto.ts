export interface ListingItemDTO {
  name: string;
  imageUrl: string;
  sku: string;
  asin: string;
  channel: string;
}

export interface UnassociatedListingItemsResponseDTO {
  items: ListingItemDTO[];
}

export interface AssociatedListingItemsResponseDTO {
  associations: ListingItemDTO[];
}
