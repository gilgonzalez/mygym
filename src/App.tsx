import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import CreateWorkout from './pages/CreateWorkout'
import WorkoutDetail from './pages/WorkoutDetail'
import Layout from './components/Layout'

function App() {
  const { user, setUser, setIsLoading } = useAuthStore()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (userData) {
            setUser(userData)
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (userData) {
          setUser(userData)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [setUser, setIsLoading])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/auth/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/auth/login" />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="profile" element={<Profile />} />
          <Route path="create-workout" element={<CreateWorkout />} />
          <Route path="workout/:id" element={<WorkoutDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App