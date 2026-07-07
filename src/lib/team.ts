import { createClient } from '@/lib/supabase/server'

export type TeamRole = 'admin' | 'member'

export interface WorkspaceContext {
  workspace: { id: string; name: string; owner_id: string }
  role: TeamRole
  isAdmin: boolean
}

export async function getWorkspaceContext(userId: string): Promise<WorkspaceContext | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('workspace_members')
    .select('role, status, workspaces(id, name, owner_id)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!data || !data.workspaces) return null

  const role = data.role as TeamRole
  return {
    workspace: data.workspaces as unknown as { id: string; name: string; owner_id: string },
    role,
    isAdmin: role === 'admin',
  }
}
