import type { SponsorProject } from '@/types/sponsorTypes'

const STORAGE_KEY = 'simons_sponsor_projects'

export function loadSponsorProjects(): SponsorProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SponsorProject[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (error) {
    console.error('Could not load sponsor projects from localStorage', error)
    return []
  }
}

export function saveSponsorProjects(projects: SponsorProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function upsertSponsorProject(project: SponsorProject): SponsorProject[] {
  const current = loadSponsorProjects()
  const index = current.findIndex((item) => item.id === project.id)

  if (index >= 0) {
    current[index] = project
  } else {
    current.unshift(project)
  }

  saveSponsorProjects(current)
  return current
}

export function deleteSponsorProject(projectId: string): SponsorProject[] {
  const filtered = loadSponsorProjects().filter((project) => project.id !== projectId)
  saveSponsorProjects(filtered)
  return filtered
}
