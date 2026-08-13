import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";

// Font note: this project ships with a system-font stack (no external fetch
// at build time, no layout-shift, works fully offline). To use Google
// Fonts instead, swap this block for e.g.:
//   import { Manrope } from "next/font/google";
//   const display = Manrope({ subsets: ["latin"], variable: "--font-display", weight: ["500","700","800"] });
//   const body = Manrope({ subsets: ["latin"], variable: "--font-body", weight: ["400","500","600"] });
// then apply `${display.variable} ${body.variable}` on <body> as below.

export const metadata = {
  title: "Affiliate Marketplace Pro",
  description:
    "A full-stack affiliate marketplace connecting sellers, affiliates, and customers - list products, generate tracked links, and earn commissions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <Toaster />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
