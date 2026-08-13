"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast-store";
import { Loader2 } from "lucide-react";

const roleDashboard = {
  admin: "/dashboard/admin",
  seller: "/dashboard/seller",
  affiliate: "/dashboard/affiliate",
  customer: "/dashboard/customer",
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast({ title: "Welcome back", description: user.name });
      router.push(roleDashboard[user.role] || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Welcome back to Marketplace Pro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Log in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account? <Link href="/register" className="font-semibold text-accent hover:underline">Sign up</Link>
          </p>
          <div className="mt-6 rounded-md border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold">Demo accounts (after running the seed script):</p>
            <p>admin@marketplace.test / Admin@12345</p>
            <p>seller@marketplace.test / Seller@12345</p>
            <p>affiliate@marketplace.test / Affiliate@12345</p>
            <p>customer@marketplace.test / Customer@12345</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
