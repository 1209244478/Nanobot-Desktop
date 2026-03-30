import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { 
  MessageSquare, 
  LayoutDashboard, 
  Radio, 
  Server, 
  BookOpen,
  Clock, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import clsx from 'clsx'
import { useI18n } from '../store/i18nStore'

export default function Layout() {
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { to: '/', icon: MessageSquare, label: t.nav.chat },
    { to: '/dashboard', icon: LayoutDashboard, label: t.nav.dashboard },
    { to: '/channels', icon: Radio, label: t.nav.channels },
    { to: '/providers', icon: Server, label: t.nav.providers },
    { to: '/skills', icon: BookOpen, label: t.nav.skills },
    { to: '/cron', icon: Clock, label: t.nav.scheduledTasks },
    { to: '/settings', icon: Settings, label: t.nav.settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-screen pt-6 transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
          collapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center">
            <span className="text-2xl">🐈</span>
            {!collapsed && (
              <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white">nanobot</h1>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="px-3">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center rounded-lg transition-colors',
                      collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )
                  }
                  title={item.label}
                >
                  <item.icon size={20} className={collapsed ? '' : 'mr-3'} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className={clsx(
        'min-h-screen transition-all duration-300',
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
