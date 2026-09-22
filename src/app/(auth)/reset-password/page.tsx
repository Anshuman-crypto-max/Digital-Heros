import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePassword } from "../actions"

export default async function ResetPasswordPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const resolvedParams = await searchParams

  return (
    <div className="container max-w-md mx-auto mt-20 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Enter New Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Please enter your new password below.
          </p>
        </div>

        {resolvedParams.error && (
          <div className="mb-4 p-4 text-sm text-red-800 bg-red-50 rounded-lg">
            {resolvedParams.error}
          </div>
        )}

        <form action={updatePassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  )
}
