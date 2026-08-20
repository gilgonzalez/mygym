import { FileEdit, Globe, Lock, Users } from 'lucide-react-native'
import { visibilityLabelMap, type WorkoutVisibility } from '@mygym/shared'

import { SegmentedControl, type SegmentedOption } from '@/components/ui'

// Selector de visibilidad de un workout (draft/private/followers/public) —
// mismas 4 opciones que visibilityLabelMap en la web (src/lib/workout-utils.ts,
// ahora también en packages/shared). Para el form de creación/edición.
const OPTIONS: SegmentedOption<WorkoutVisibility>[] = [
  { value: 'draft', label: visibilityLabelMap.draft, icon: FileEdit },
  { value: 'private', label: visibilityLabelMap.private, icon: Lock },
  { value: 'followers', label: visibilityLabelMap.followers, icon: Users },
  { value: 'public', label: visibilityLabelMap.public, icon: Globe },
]

interface VisibilitySelectorProps {
  value: WorkoutVisibility
  onChange: (value: WorkoutVisibility) => void
}

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  return <SegmentedControl options={OPTIONS} value={value} onChange={onChange} scrollable />
}
