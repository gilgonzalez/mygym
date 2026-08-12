import { LocalWorkout } from '@/types/workout/viewTypes'

// The set of section "modes" a session can move between. Adding a new mode (e.g. 'emom')
// is a two-step change: extend this union, then add a matching entry to WorkoutChangeTypeView's
// KIND_CONFIG — every place that reads a section's kind goes through getWorkoutSegmentKind
// below, so nothing else needs to change.
export type WorkoutSegmentKind = 'standard' | 'amrap'

// A workout can mix normal sections with a single AMRAP section (workout.challenge points at
// one section by id). This is the single source of truth for "what mode is this section" —
// used both to pick which execution view renders a section and to warn, mid-rest, that the
// next section plays by different rules.
export function getWorkoutSegmentKind(workout: LocalWorkout, sectionIndex: number): WorkoutSegmentKind {
  const section = workout.sections[sectionIndex]
  if (workout.challenge && section?.id === workout.challenge.challengeSectionId) return 'amrap'
  return 'standard'
}
