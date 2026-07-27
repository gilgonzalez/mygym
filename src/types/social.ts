import { Database } from '@/types/database'

export type FollowRequestStatus = Database['public']['Enums']['follow_request_status']
export type FollowStatus = 'none' | Extract<FollowRequestStatus, 'pending' | 'accepted'>

export interface SocialUserSummary {
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
  bio: string | null
}

export interface FollowListItem {
  user: SocialUserSummary
  status: FollowRequestStatus
  requested_at: string | null
  accepted_at: string | null
}

export interface FollowOverview {
  followersCount: number
  followingCount: number
  pendingRequestsCount: number
  followers: FollowListItem[]
  following: FollowListItem[]
  pendingRequests: FollowListItem[]
}
