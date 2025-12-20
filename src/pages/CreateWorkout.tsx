import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Plus, X, Save } from 'lucide-react'

interface Exercise {
  name: string
  type: 'repetitions' | 'time' | 'rest'
  repetitions?: number
  duration_seconds?: number
}

interface Section {
  name: string
  exercises: Exercise[]
}

export default function CreateWorkout() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'cardio' | 'strength' | 'flexibility' | 'mixed'>('cardio')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [duration_minutes, setDurationMinutes] = useState('')
  const [sections, setSections] = useState<Section[]>([{ name: '', exercises: [{ name: '', type: 'repetitions' }] }])
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const addSection = () => {
    setSections([...sections, { name: '', exercises: [{ name: '', type: 'repetitions' }] }])
  }

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index))
    }
  }

  const updateSection = (index: number, field: 'name', value: string) => {
    const newSections = [...sections]
    newSections[index][field] = value
    setSections(newSections)
  }

  const addExercise = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].exercises.push({ name: '', type: 'repetitions' })
    setSections(newSections)
  }

  const removeExercise = (sectionIndex: number, exerciseIndex: number) => {
    const newSections = [...sections]
    if (newSections[sectionIndex].exercises.length > 1) {
      newSections[sectionIndex].exercises = newSections[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex)
      setSections(newSections)
    }
  }

  const updateExercise = (sectionIndex: number, exerciseIndex: number, field: keyof Exercise, value: string | number) => {
    const newSections = [...sections]
    const exercise = newSections[sectionIndex].exercises[exerciseIndex]
    
    if (field === 'type') {
      exercise[field] = value as 'repetitions' | 'time' | 'rest'
    } else if (field === 'name') {
      exercise[field] = value as string
    } else if (field === 'repetitions' || field === 'duration_seconds') {
      exercise[field] = value as number
    }
    
    setSections(newSections)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('You must be logged in to create a workout')
      return
    }

    if (!title.trim()) {
      alert('Please enter a workout title')
      return
    }

    const validSections = sections.filter(section => 
      section.name.trim() && section.exercises.some(exercise => exercise.name.trim())
    )

    if (validSections.length === 0) {
      alert('Please add at least one section with exercises')
      return
    }

    try {
      setLoading(true)

      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
          difficulty,
          duration_minutes: duration_minutes ? parseInt(duration_minutes) : null,
          is_public: isPublic
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      for (let sectionIndex = 0; sectionIndex < validSections.length; sectionIndex++) {
        const section = validSections[sectionIndex]
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .insert({
            workout_id: workout.id,
            name: section.name.trim(),
            order_index: sectionIndex
          })
          .select()
          .single()

        if (sectionError) throw sectionError

        const validExercises = section.exercises.filter(exercise => exercise.name.trim())
        
        for (let exerciseIndex = 0; exerciseIndex < validExercises.length; exerciseIndex++) {
          const exercise = validExercises[exerciseIndex]
          const { error: exerciseError } = await supabase
            .from('exercises')
            .insert({
              section_id: sectionData.id,
              name: exercise.name.trim(),
              type: exercise.type,
              repetitions: exercise.type === 'repetitions' ? exercise.repetitions || null : null,
              duration_seconds: exercise.type !== 'repetitions' ? exercise.duration_seconds || null : null,
              order_index: exerciseIndex
            })

          if (exerciseError) throw exerciseError
        }
      }

      navigate('/profile')
    } catch (error: any) {
      alert('Error creating workout: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Workout</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workout Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter workout title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration_minutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Estimated duration"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your workout..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cardio">Cardio</option>
                <option value="strength">Strength</option>
                <option value="flexibility">Flexibility</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Make this workout public</span>
            </label>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Workout Sections</h3>
              <button
                type="button"
                onClick={addSection}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-6">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSection(sectionIndex, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Section ${sectionIndex + 1} name (e.g., Warm-up, Cardio, Strength)`}
                    />
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sectionIndex)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {section.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(sectionIndex, exerciseIndex, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Exercise name"
                        />
                        
                        <select
                          value={exercise.type}
                          onChange={(e) => updateExercise(sectionIndex, exerciseIndex, 'type', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="repetitions">Repetitions</option>
                          <option value="time">Time</option>
                          <option value="rest">Rest</option>
                        </select>
                        
                        {exercise.type === 'repetitions' && (
                          <input
                            type="number"
                            value={exercise.repetitions || ''}
                            onChange={(e) => updateExercise(sectionIndex, exerciseIndex, 'repetitions', parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Reps"
                            min="1"
                          />
                        )}
                        
                        {(exercise.type === 'time' || exercise.type === 'rest') && (
                          <input
                            type="number"
                            value={exercise.duration_seconds || ''}
                            onChange={(e) => updateExercise(sectionIndex, exerciseIndex, 'duration_seconds', parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Seconds"
                            min="1"
                          />
                        )}
                        
                        {section.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExercise(sectionIndex, exerciseIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addExercise(sectionIndex)}
                      className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Exercise</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Workout'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}