import { requireAdmin } from '@/lib/admin'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Ticket,
  Heart,
  Trophy,
  BarChart3,
  LogOut
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  const navigation = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Draws', href: '/admin/draws', icon: Ticket },
    { name: 'Charities', href: '/admin/charities', icon: Heart },
    { name: 'Winners', href: '/admin/winners', icon: Trophy },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/" className="text-xl font-black text-emerald-400">
            DIGITAL HEROES
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
            Admin Panel
          </div>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <item.icon className="mr-3 h-5 w-5 text-slate-400 group-hover:text-emerald-400" />
              {item.name}
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Exit Admin
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:pl-64 flex flex-col">
        {/* Mobile header could go here */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
