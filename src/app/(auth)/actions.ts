'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  
  // We need to check role to redirect to correct dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = data as any
    if (profile?.role === 'admin') {
      redirect('/admin')
    }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const fullName = formData.get('fullName') as string
  
  if (password !== confirmPassword) {
    redirect('/signup?error=' + encodeURIComponent('Passwords do not match.'))
  }

  if (password.length < 6) {
    redirect('/signup?error=' + encodeURIComponent('Password must be at least 6 characters.'))
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error(error.message)
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://digital-heros-v8lx.onrender.com'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/forgot-password?message=' + encodeURIComponent('Check your email for the reset link.'))
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (password !== confirmPassword) {
    redirect('/reset-password?error=' + encodeURIComponent('Passwords do not match.'))
  }

  if (password.length < 6) {
    redirect('/reset-password?error=' + encodeURIComponent('Password must be at least 6 characters.'))
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/reset-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/dashboard')
}
