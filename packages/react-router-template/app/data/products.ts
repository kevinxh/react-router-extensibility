export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

export const PRODUCTS: Record<string, Product> = {
  "classic-sneaker": {
    id: "prod-100",
    slug: "classic-sneaker",
    name: "Classic Sneaker",
    price: 89.99,
    description:
      "A timeless low-top sneaker in premium canvas with a vulcanized rubber sole. Versatile enough for everyday wear.",
    category: "Footwear",
  },
  "denim-jacket": {
    id: "prod-200",
    slug: "denim-jacket",
    name: "Denim Jacket",
    price: 129.99,
    description:
      "Medium-weight denim trucker jacket with a classic fit. Features button closure, chest pockets, and adjustable waist tabs.",
    category: "Outerwear",
  },
  "running-shoes": {
    id: "prod-300",
    slug: "running-shoes",
    name: "Running Shoes",
    price: 149.99,
    description:
      "Lightweight performance running shoes with responsive cushioning and breathable engineered mesh upper.",
    category: "Footwear",
  },
};

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS[slug];
}

export function getAllProducts(): Product[] {
  return Object.values(PRODUCTS);
}
