import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setShowMobileDrawer(true)}
          className="p-2 bg-white rounded-md shadow-md hover:bg-gray-50"
          aria-label="Åbn menu"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <Sidebar
        showMobileDrawer={showMobileDrawer}
        setShowMobileDrawer={setShowMobileDrawer}
      />

      <main className="lg:pl-72 transition-all duration-300">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
