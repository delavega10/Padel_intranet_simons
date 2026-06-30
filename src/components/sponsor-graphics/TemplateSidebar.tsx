import { Save, Plus, FolderOpen, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CollapsibleBox } from '@/components/sponsor-graphics/CollapsibleBox'
import { ExportButton } from '@/components/sponsor-graphics/ExportButton'
import type { SponsorProject, SponsorTemplate } from '@/types/sponsorTypes'

export function TemplateSidebar({
  templates,
  selectedTemplateId,
  projects,
  activeProjectId,
  onSelectTemplate,
  onCreateVariant,
  onSaveProject,
  onExportImage,
  onExportPdf,
  onOpenProject,
  onDeleteProject,
}: {
  templates: SponsorTemplate[]
  selectedTemplateId: string
  projects: SponsorProject[]
  activeProjectId: string | null
  onSelectTemplate: (templateId: string) => void
  onCreateVariant: () => void
  onSaveProject: () => void
  onExportImage: () => void
  onExportPdf: () => void
  onOpenProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
}) {
  return (
    <aside className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <CollapsibleBox title="Templates">
        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                selectedTemplateId === template.id
                  ? 'bg-padel-50 text-padel-700'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </CollapsibleBox>

      <CollapsibleBox title="Handlinger">
        <div className="space-y-2">
          <Button type="button" variant="secondary" className="w-full" onClick={onCreateVariant}>
            <Plus className="h-4 w-4" />
            Ny variant
          </Button>
          <Button type="button" className="w-full" onClick={onSaveProject}>
            <Save className="h-4 w-4" />
            Gem template
          </Button>
          <ExportButton onClick={onExportImage} label="Eksporter som billede" />
          <ExportButton onClick={onExportPdf} label="Eksporter som PDF" />
        </div>
      </CollapsibleBox>

      <CollapsibleBox title="Varianter">
        <div className="space-y-2">
          {projects.length === 0 && <p className="text-sm text-gray-500">Ingen gemte varianter endnu.</p>}
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                  activeProjectId === project.id
                    ? 'bg-padel-50 text-padel-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="truncate">{project.name}</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                className="mt-1 inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Slet
              </button>
            </div>
          ))}
        </div>
      </CollapsibleBox>
    </aside>
  )
}
