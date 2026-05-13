import type { AppUser, TeamPulseCycle } from '~/types/models'

const CHIEF_ROLES = new Set(['coceo', 'coo', 'cfo', 'cmo', 'csgo'])

export function isTeamPulseAdminTakeUser(profile: Pick<AppUser, 'role'> | null | undefined): boolean {
  return profile?.role === 'admin'
}

function isIncludedDepartment(cycle: TeamPulseCycle, user: Pick<AppUser, 'department'>): boolean {
  return cycle.departmentsIncluded.length === 0 || cycle.departmentsIncluded.includes(user.department)
}

function isActiveTeamPulseParticipant(user: Pick<AppUser, 'role'>): boolean {
  return user.role !== 'admin'
}

function isLeaderCandidate(user: Pick<AppUser, 'role' | 'isChief'>): boolean {
  return user.isChief || CHIEF_ROLES.has(user.role)
}

export function resolveTeamPulseTakeTargets(args: {
  cycle: TeamPulseCycle | null
  currentUser: AppUser | null
  users: AppUser[]
}) {
  const { cycle, currentUser } = args
  if (!cycle || !currentUser || isTeamPulseAdminTakeUser(currentUser)) {
    return {
      targets: [] as AppUser[],
      sameDepartmentPeerCount: 0,
      leaderCount: 0,
      currentUserDepartmentIncluded: false
    }
  }

  const currentUserDepartmentIncluded = isIncludedDepartment(cycle, currentUser)
  const sameDepartmentUsers = args.users
    .filter(isActiveTeamPulseParticipant)
    .filter((u) => isIncludedDepartment(cycle, u))
    .filter((u) => u.department === currentUser.department)

  const byUid = new Map<string, AppUser>()

  if (
    cycle.includeSelfRatings &&
    currentUserDepartmentIncluded &&
    isActiveTeamPulseParticipant(currentUser)
  ) {
    byUid.set(currentUser.uid, currentUser)
  }

  if (cycle.includePeerRatings || cycle.includeLeaderRatings) {
    for (const user of sameDepartmentUsers) {
      if (user.uid === currentUser.uid) continue
      if (cycle.includeLeaderRatings && isLeaderCandidate(user)) {
        byUid.set(user.uid, user)
        continue
      }
      if (cycle.includePeerRatings) byUid.set(user.uid, user)
    }
  }

  const targets = Array.from(byUid.values()).sort((a, b) => {
    if (a.uid === currentUser.uid) return -1
    if (b.uid === currentUser.uid) return 1
    if (isLeaderCandidate(a) !== isLeaderCandidate(b)) {
      return isLeaderCandidate(a) ? -1 : 1
    }
    return (a.displayName || a.email).localeCompare(b.displayName || b.email)
  })

  return {
    targets,
    sameDepartmentPeerCount: sameDepartmentUsers.filter((u) => u.uid !== currentUser.uid).length,
    leaderCount: sameDepartmentUsers.filter((u) => u.uid !== currentUser.uid && isLeaderCandidate(u)).length,
    currentUserDepartmentIncluded
  }
}
