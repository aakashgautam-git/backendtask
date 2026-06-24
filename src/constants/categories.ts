export const CATEGORIES = [
  "Electronics",
  "Books",
  "Fashion",
  "Sports",
  "Home",
  "Beauty",
  "Toys",
  "Automotive",
  "Office",
  "Kitchen",
] as const;

export type Category = (typeof CATEGORIES)[number];