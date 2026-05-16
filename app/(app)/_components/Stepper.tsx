import Link from 'next/link'

type StepKey = 'brief' | 'production' | 'generate' | 'export'

const STEPS: Array<{ key: StepKey; n: number; label: string }> = [
  { key: 'brief',      n: 1, label: 'Brief' },
  { key: 'production', n: 2, label: 'Production' },
  { key: 'generate',   n: 3, label: 'Génération' },
  { key: 'export',     n: 4, label: 'Export' },
]

interface StepperProps {
  projectId: string
  current:   StepKey
}

/**
 * Stepper interactif — les étapes "done" (avant l'étape courante) sont cliquables
 * pour revenir en arrière. L'étape active et les futures restent passives.
 */
export function Stepper({ projectId, current }: StepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)

  return (
    <nav className="stepper" aria-label="Étapes du projet">
      {STEPS.map((step, i) => {
        const isActive = i === currentIdx
        const isDone   = i < currentIdx
        const isLocked = i > currentIdx

        const className =
          'step-item ' +
          (isActive ? 'active' : isDone ? 'done' : 'locked')

        const StepContent = (
          <>
            <div className="step-num">
              <span>{step.n}</span>
            </div>
            <div className="step-lbl">{step.label}</div>
          </>
        )

        return (
          <div key={step.key} style={{ display: 'contents' }}>
            {isDone ? (
              <Link
                href={`/project/${projectId}/${step.key}`}
                className={className}
                aria-label={`Revenir à l'étape ${step.label}`}
              >
                {StepContent}
              </Link>
            ) : (
              <div
                className={className}
                aria-current={isActive ? 'step' : undefined}
                aria-disabled={isLocked || undefined}
                title={isLocked ? `Étape ${step.label} — pas encore disponible` : undefined}
              >
                {StepContent}
              </div>
            )}

            {/* Barre de connexion entre les étapes */}
            {i < STEPS.length - 1 && (
              <div className={`step-bar ${i < currentIdx ? 'done' : ''}`}></div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/**
 * "← Étape précédente" — lien discret affiché en haut des pages 2/3/4.
 */
export function BackStep({ projectId, current }: StepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)
  if (currentIdx <= 0) return null

  const prev = STEPS[currentIdx - 1]

  return (
    <Link
      href={`/project/${projectId}/${prev.key}`}
      className="back-step"
      aria-label={`Revenir à l'étape ${prev.label}`}
    >
      ← Revenir à l&apos;étape {prev.label}
    </Link>
  )
}
