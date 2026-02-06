import type { Store } from "../types.js";

export const MOCK_STORES: Store[] = [
  {
    id: "store-001",
    name: "Downtown San Francisco",
    address: "865 Market St",
    city: "San Francisco",
    state: "CA",
    zip: "94103",
    phone: "(415) 555-0101",
    hours: "Mon–Sat 10am–9pm, Sun 11am–7pm",
    coordinates: { lat: 37.7839, lng: -122.4074 },
  },
  {
    id: "store-002",
    name: "Palo Alto Town & Country",
    address: "855 El Camino Real",
    city: "Palo Alto",
    state: "CA",
    zip: "94301",
    phone: "(650) 555-0202",
    hours: "Mon–Sat 10am–8pm, Sun 11am–6pm",
    coordinates: { lat: 37.4419, lng: -122.143 },
  },
  {
    id: "store-003",
    name: "San Jose Valley Fair",
    address: "2855 Stevens Creek Blvd",
    city: "San Jose",
    state: "CA",
    zip: "95050",
    phone: "(408) 555-0303",
    hours: "Mon–Sat 10am–9pm, Sun 11am–7pm",
    coordinates: { lat: 37.3254, lng: -121.9449 },
  },
  {
    id: "store-004",
    name: "Oakland Rockridge",
    address: "5416 College Ave",
    city: "Oakland",
    state: "CA",
    zip: "94618",
    phone: "(510) 555-0404",
    hours: "Mon–Sat 10am–7pm, Sun 12pm–6pm",
    coordinates: { lat: 37.844, lng: -122.2514 },
  },
  {
    id: "store-005",
    name: "Berkeley Fourth Street",
    address: "1786 Fourth St",
    city: "Berkeley",
    state: "CA",
    zip: "94710",
    phone: "(510) 555-0505",
    hours: "Mon–Sat 10am–8pm, Sun 11am–7pm",
    coordinates: { lat: 37.8698, lng: -122.3021 },
  },
];

export function findStoreById(id: string): Store | undefined {
  return MOCK_STORES.find((s) => s.id === id);
}

export function searchStores(query?: {
  zip?: string;
  limit?: number;
}): Store[] {
  let results = [...MOCK_STORES];

  if (query?.zip) {
    const prefix = query.zip.slice(0, 3);
    const filtered = results.filter((s) => s.zip.startsWith(prefix));
    if (filtered.length > 0) results = filtered;
  }

  if (query?.limit) {
    results = results.slice(0, query.limit);
  }

  return results;
}
