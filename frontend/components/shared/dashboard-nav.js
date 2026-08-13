import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Heart,
  Link2,
  BarChart3,
  Wallet,
  Users,
  Store,
  Receipt,
  TrendingUp,
  Boxes,
} from "lucide-react";

export const customerNav = [
  { href: "/dashboard/customer", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/customer/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/customer/wishlist", label: "Wishlist", icon: Heart },
];

export const sellerNav = [
  { href: "/dashboard/seller", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/seller/products", label: "Products", icon: Package },
  { href: "/dashboard/seller/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/seller/affiliate-sales", label: "Affiliate sales", icon: Link2 },
];

export const affiliateNav = [
  { href: "/dashboard/affiliate", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/affiliate/products", label: "Promote products", icon: Store },
  { href: "/dashboard/affiliate/commissions", label: "Commissions", icon: Wallet },
  { href: "/dashboard/affiliate/analytics", label: "Analytics", icon: BarChart3 },
];

export const adminNav = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/products", label: "Inventory", icon: Boxes },
  { href: "/dashboard/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/admin/affiliates", label: "Affiliates", icon: TrendingUp },
  { href: "/dashboard/admin/transactions", label: "Transactions", icon: Receipt },
];
