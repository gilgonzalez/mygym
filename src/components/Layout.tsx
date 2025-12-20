import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Home, Search, User, LogOut, Dumbbell } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Dumbbell className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">FitShare</span>
              </div>
              
              <div className="hidden md:flex space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/') 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Feed
                </Link>
                <Link
                  to="/explore"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/explore') 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Explore
                </Link>
                <Link
                  to="/profile"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/profile') 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/create-workout"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Create Workout
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}