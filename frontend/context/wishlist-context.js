"use client";

import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "amp_wishlist";

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const isWishlisted = (productId) => items.some((i) => i.productId === productId);

  const toggleWishlist = (product) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === product._id)) {
        return prev.filter((i) => i.productId !== product._id);
      }
      return [
        ...prev,
        {
          productId: product._id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0]?.url || "",
        },
      ];
    });
  };

  const removeFromWishlist = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
