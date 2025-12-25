import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// We define a loose type for now to avoid circular deps with the page's Zod schema
// Ideally this should be imported from a shared types file
export interface CreateWorkoutState {
  workoutData: any | null
  formErrors: any | null
  submitStatus: 'idle' | 'loading' | 'success' | 'error'
  
  setWorkoutData: (data: any) => void
  setFormErrors: (errors: any) => void
  setSubmitStatus: (status: 'idle' | 'loading' | 'success' | 'error') => void
  reset: () => void
}

// Helper to remove circular references (like DOM refs) from react-hook-form errors
const sanitizeErrors = (errors: any): any => {
  if (!errors || typeof errors !== 'object') return errors
  
  if (Array.isArray(errors)) {
    return errors.map(item => sanitizeErrors(item))
  }

  const cleaned: any = {}
  for (const key in errors) {
    if (key === 'ref') continue
    cleaned[key] = sanitizeErrors(errors[key])
  }
  return cleaned
}

export const useCreateWorkoutStore = create<CreateWorkoutState>()(
  persist(
    (set) => ({
      workoutData: null,
      formErrors: null,
      submitStatus: 'idle',

      setWorkoutData: (data) => set({ workoutData: data }),
      setFormErrors: (errors) => set({ formErrors: sanitizeErrors(errors) }),
      setSubmitStatus: (status) => set({ submitStatus: status }),
      reset: () => set({ workoutData: null, formErrors: null, submitStatus: 'idle' }),
    }),
    {
      name: 'create-workout-storage', // name of the item in the storage (must be unique)
    }
  )
)