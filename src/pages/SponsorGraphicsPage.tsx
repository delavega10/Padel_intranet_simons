import { useEffect, useMemo, useRef, useState } from 'react'
import { WandSparkles, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EditorPanel } from '@/components/sponsor-graphics/EditorPanel'
import { SponsorPreview } from '@/components/sponsor-graphics/SponsorPreview'
import { TemplateSidebar } from '@/components/sponsor-graphics/TemplateSidebar'
import { sponsorTemplates } from '@/data/sponsorTemplates'
import { getFormatOption } from '@/components/sponsor-graphics/formatOptions'
import { exportAsPdf, exportAsPng } from '@/utils/exportImage'
import {
  deleteSponsorProject,
  loadSponsorProjects,
  upsertSponsorProject,
} from '@/utils/sponsorStorage'
import type { ExportFormat, SponsorContent, SponsorProject } from '@/types/sponsorTypes'

function cloneContent(content: SponsorContent): SponsorContent {
  return JSON.parse(JSON.stringify(content)) as SponsorContent
}

export function SponsorGraphicsPage() {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const exportPreviewRef = useRef<HTMLDivElement | null>(null)
  const [projects, setProjects] = useState<SponsorProject[]>(() => loadSponsorProjects())
  const [selectedTemplateId, setSelectedTemplateId] = useState(sponsorTemplates[0].id)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [format, setFormat] = useState<ExportFormat>('ratio_4_3')
  const [content, setContent] = useState<SponsorContent>(cloneContent(sponsorTemplates[0].defaultContent))
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)

  const selectedTemplate = useMemo(
    () => sponsorTemplates.find((template) => template.id === selectedTemplateId) ?? sponsorTemplates[0],
    [selectedTemplateId],
  )
  const selectedFormat = useMemo(() => getFormatOption(format), [format])

  function selectTemplate(templateId: string) {
    const next = sponsorTemplates.find((template) => template.id === templateId)
    if (!next) return
    setSelectedTemplateId(next.id)
    setContent(cloneContent(next.defaultContent))
    setActiveProjectId(null)
  }

  function createVariant() {
    setContent(cloneContent(selectedTemplate.defaultContent))
    setFormat('ratio_4_3')
    setActiveProjectId(null)
  }

  function saveVariant() {
    const activeProject = activeProjectId ? projects.find((project) => project.id === activeProjectId) : null
    const defaultName = activeProject?.name ?? `${selectedTemplate.name} variant`
    const name = window.prompt('Navn på varianten', defaultName)?.trim()
    if (!name) return

    const now = new Date().toISOString()
    const project: SponsorProject = {
      id: activeProjectId ?? crypto.randomUUID(),
      templateId: selectedTemplate.id,
      name,
      content,
      format,
      createdAt: activeProject?.createdAt ?? now,
      updatedAt: now,
    }

    try {
      const updated = upsertSponsorProject(project)
      setProjects(updated)
      setActiveProjectId(project.id)
    } catch (error) {
      console.error(error)
      alert('Kunne ikke gemme. LocalStorage kan være fuld pga. store billeder.')
    }
  }

  function openProject(projectId: string) {
    const project = projects.find((entry) => entry.id === projectId)
    if (!project) return
    setSelectedTemplateId(project.templateId)
    setContent(cloneContent(project.content))
    setFormat(project.format)
    setActiveProjectId(project.id)
  }

  function removeProject(projectId: string) {
    if (!confirm('Slet varianten permanent?')) return
    const nextProjects = deleteSponsorProject(projectId)
    setProjects(nextProjects)
    if (activeProjectId === projectId) {
      createVariant()
    }
  }

  function getExportFileBaseName() {
    const fileNameBase = activeProjectId
      ? projects.find((project) => project.id === activeProjectId)?.name ?? 'sponsor-grafik'
      : 'sponsor-grafik'
    return `${fileNameBase.toLowerCase().replace(/\s+/g, '-')}-${selectedFormat.label}`
  }

  async function handleExportImage() {
    if (!exportPreviewRef.current) return
    await exportAsPng(exportPreviewRef.current, getExportFileBaseName())
  }

  async function handleExportPdf() {
    if (!exportPreviewRef.current) return
    await exportAsPdf(exportPreviewRef.current, getExportFileBaseName())
  }

  useEffect(() => {
    if (!isPreviewExpanded) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsPreviewExpanded(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPreviewExpanded])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sponsor grafik"
        description="Låst template-motor til sponsorpræsentationer med live preview og eksport."
        icon={WandSparkles}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_380px_minmax(0,1fr)]">
        <TemplateSidebar
          templates={sponsorTemplates}
          selectedTemplateId={selectedTemplateId}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectTemplate={selectTemplate}
          onCreateVariant={createVariant}
          onSaveProject={saveVariant}
          onExportImage={handleExportImage}
          onExportPdf={handleExportPdf}
          onOpenProject={openProject}
          onDeleteProject={removeProject}
        />

        <EditorPanel
          content={content}
          format={format}
          onChangeContent={setContent}
          onChangeFormat={setFormat}
        />

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm xl:sticky xl:top-4 xl:self-start">
          <div
            className="rounded-xl border border-gray-200 bg-gray-100 p-4"
            onClick={(event) => {
              const target = event.target as HTMLElement
              if (target.closest('input, textarea, button, select, option, label')) return
              setIsPreviewExpanded(true)
            }}
          >
            <SponsorPreview
              ref={previewRef}
              content={content}
              format={format}
              onChangeContent={setContent}
            />
            <p className="mt-2 text-xs text-gray-500">Klik på previewet for stor redigering</p>
          </div>
        </section>
      </div>

      {isPreviewExpanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsPreviewExpanded(false)}
        >
          <div
            className="relative max-h-[92vh] w-[min(92vw,1700px)] overflow-auto rounded-2xl border border-white/15 bg-[#06090f] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPreviewExpanded(false)}
              className="sticky top-0 z-10 ml-auto mb-3 flex items-center gap-1 rounded-lg border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
              Luk
            </button>

            <SponsorPreview content={content} format={format} onChangeContent={setContent} />
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed -left-[99999px] top-0 opacity-0" aria-hidden="true">
        <div style={{ width: selectedFormat.width }}>
          <SponsorPreview ref={exportPreviewRef} content={content} format={format} />
        </div>
      </div>
    </div>
  )
}
