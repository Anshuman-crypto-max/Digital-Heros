import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "../ui/button";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = data as any;
    role = profile?.role;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-rose-500" />
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            Digital Heroes
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/charities" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Charities
          </Link>
          
          {!user ? (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              {role === 'admin' ? (
                <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Admin Portal
                </Link>
              ) : (
                <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
              )}
              
              <form action={logout}>
                <Button type="submit" variant="ghost" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Logout
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
