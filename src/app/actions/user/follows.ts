'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FollowListItem, FollowOverview, FollowStatus } from '@/types/social'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

function mapFollowStatus(status: string | null | undefined): FollowStatus {
  if (status === 'pending' || status === 'accepted') {
    return status
  }

  return 'none'
}

function mapFollowListItems(
  rows: any[],
  relationKey: 'follower' | 'followed'
): FollowListItem[] {
  return rows
    .map((row) => {
      const user = row?.[relationKey]

      if (!user?.id) {
        return null
      }

      return {
        user: {
          id: user.id,
          username: user.username ?? null,
          name: user.name ?? null,
          avatar_url: user.avatar_url ?? null,
          bio: user.bio ?? null,
        },
        status: row.status,
        requested_at: row.requested_at ?? null,
        accepted_at: row.accepted_at ?? null,
      }
    })
    .filter((item): item is FollowListItem => item !== null)
}

async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    throw new Error('Authentication required')
  }

  return { supabase, user }
}

function revalidateSocialSurfaces() {
  revalidatePath('/')
  revalidatePath('/profile')
}

export async function getFollowOverviewAction(userId?: string): Promise<ActionResult<FollowOverview>> {
  try {
    const { supabase, user } = await requireAuthenticatedUser()
    const targetUserId = userId ?? user.id

    if (targetUserId !== user.id) {
      throw new Error('Solicitud de visión general de seguimiento no autorizada')
    }

    const [followersResult, followingResult, requestsResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select(`
          status,
          requested_at,
          accepted_at,
          follower:users!user_follows_follower_id_fkey(
            id,
            username,
            name,
            avatar_url,
            bio
          )
        `)
        .eq('followed_id', targetUserId)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false }),
      supabase
        .from('user_follows')
        .select(`
          status,
          requested_at,
          accepted_at,
          followed:users!user_follows_followed_id_fkey(
            id,
            username,
            name,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', targetUserId)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false }),
      supabase
        .from('user_follows')
        .select(`
          status,
          requested_at,
          accepted_at,
          follower:users!user_follows_follower_id_fkey(
            id,
            username,
            name,
            avatar_url,
            bio
          )
        `)
        .eq('followed_id', targetUserId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false }),
    ])

    if (followersResult.error) throw followersResult.error
    if (followingResult.error) throw followingResult.error
    if (requestsResult.error) throw requestsResult.error

    const followers = mapFollowListItems((followersResult.data ?? []) as any[], 'follower')
    const following = mapFollowListItems((followingResult.data ?? []) as any[], 'followed')
    const pendingRequests = mapFollowListItems((requestsResult.data ?? []) as any[], 'follower')

    return {
      success: true,
      data: {
        followersCount: followers.length,
        followingCount: following.length,
        pendingRequestsCount: pendingRequests.length,
        followers,
        following,
        pendingRequests,
      },
    }
  } catch (error: any) {
    console.error('Error fetching follow overview:', error)
    return { success: false, error: error.message }
  }
}

export async function getFollowStatesAction(userIds: string[]): Promise<ActionResult<Record<string, FollowStatus>>> {
  try {
    const uniqueIds = [...new Set(userIds.filter(Boolean))]

    if (uniqueIds.length === 0) {
      return { success: true, data: {} }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: true, data: {} }
    }

    const idsToQuery = uniqueIds.filter((id) => id !== user.id)

    if (idsToQuery.length === 0) {
      return { success: true, data: {} }
    }

    const { data, error } = await supabase
      .from('user_follows')
      .select('followed_id, status')
      .eq('follower_id', user.id)
      .in('followed_id', idsToQuery)

    if (error) throw error

    const states = idsToQuery.reduce<Record<string, FollowStatus>>((acc, id) => {
      acc[id] = 'none'
      return acc
    }, {})

    for (const row of data ?? []) {
      states[row.followed_id] = mapFollowStatus(row.status)
    }

    return { success: true, data: states }
  } catch (error: any) {
    console.error('Error fetching follow states:', error)
    return { success: false, error: error.message }
  }
}

export async function requestFollowAction(followedUserId: string): Promise<ActionResult<{ status: FollowStatus }>> {
  try {
    const { supabase } = await requireAuthenticatedUser()
    const { error } = await supabase.rpc('request_follow', { p_followed_id: followedUserId })

    if (error) throw error

    revalidateSocialSurfaces()

    return { success: true, data: { status: 'pending' } }
  } catch (error: any) {
    console.error('Error requesting follow:', error)
    return { success: false, error: error.message }
  }
}

export async function cancelFollowRequestAction(followedUserId: string): Promise<ActionResult<{ status: FollowStatus }>> {
  try {
    const { supabase } = await requireAuthenticatedUser()
    const { error } = await supabase.rpc('cancel_follow_request', { p_followed_id: followedUserId })

    if (error) throw error

    revalidateSocialSurfaces()

    return { success: true, data: { status: 'none' } }
  } catch (error: any) {
    console.error('Error canceling follow request:', error)
    return { success: false, error: error.message }
  }
}

export async function unfollowUserAction(followedUserId: string): Promise<ActionResult<{ status: FollowStatus }>> {
  try {
    const { supabase } = await requireAuthenticatedUser()
    const { error } = await supabase.rpc('unfollow_user', { p_followed_id: followedUserId })

    if (error) throw error

    revalidateSocialSurfaces()

    return { success: true, data: { status: 'none' } }
  } catch (error: any) {
    console.error('Error unfollowing user:', error)
    return { success: false, error: error.message }
  }
}

export async function acceptFollowRequestAction(followerUserId: string): Promise<ActionResult<{ status: FollowStatus }>> {
  try {
    const { supabase } = await requireAuthenticatedUser()
    const { error } = await supabase.rpc('accept_follow_request', { p_follower_id: followerUserId })

    if (error) throw error

    revalidateSocialSurfaces()

    return { success: true, data: { status: 'accepted' } }
  } catch (error: any) {
    console.error('Error accepting follow request:', error)
    return { success: false, error: error.message }
  }
}

export async function rejectFollowRequestAction(followerUserId: string): Promise<ActionResult<{ status: FollowStatus }>> {
  try {
    const { supabase } = await requireAuthenticatedUser()
    const { error } = await supabase.rpc('reject_follow_request', { p_follower_id: followerUserId })

    if (error) throw error

    revalidateSocialSurfaces()

    return { success: true, data: { status: 'none' } }
  } catch (error: any) {
    console.error('Error rejecting follow request:', error)
    return { success: false, error: error.message }
  }
}

export async function removeFollowerAction(followerUserId: string): Promise<ActionResult<{ status: FollowStatus }>> {
  try {
    const { supabase } = await requireAuthenticatedUser()
    const { error } = await supabase.rpc('remove_follower', { p_follower_id: followerUserId })

    if (error) throw error

    revalidateSocialSurfaces()

    return { success: true, data: { status: 'none' } }
  } catch (error: any) {
    console.error('Error removing follower:', error)
    return { success: false, error: error.message }
  }
}
