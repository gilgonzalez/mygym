import { Database } from "../database";

export type WorkoutData = Database['public']['Tables']['workouts']['Row']
export type SectionData = Database['public']['Tables']['sections']['Row']
export type ExerciseData = Database['public']['Tables']['exercises']['Row']
