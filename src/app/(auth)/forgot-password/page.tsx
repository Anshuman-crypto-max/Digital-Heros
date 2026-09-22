import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { resetPassword } from "../actions"

export default async function ForgotPasswordPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string, message?: string }> 
}) {
  const resolvedParams = await searchParams

  return (
    <div className="container max-w-md mx-auto mt-20 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {resolvedParams.error && (
          <div className="mb-4 p-4 text-sm text-red-800 bg-red-50 rounded-lg">
            {resolvedParams.error}
          </div>
        )}
        
        {resolvedParams.message && (
          <div className="mb-4 p-4 text-sm text-green-800 bg-green-50 rounded-lg">
            {resolvedParams.message}
          </div>
        )}

        <form action={resetPassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="name@example.com" 
              required 
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
