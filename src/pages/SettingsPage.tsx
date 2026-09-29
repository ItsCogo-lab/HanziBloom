import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { InstallSetting } from '../features/install/components/InstallSetting.tsx'
import { ToneLegend } from '../features/dictionary/components/ToneLegend.tsx'
import { useProgress } from '../features/progress/progressContext.ts'
import { SESSION_SIZE_OPTIONS } from '../features/settings/settings.ts'
import { useSettings } from '../features/settings/settingsContext.ts'
import { t } from '../i18n/index.ts'

const DATA_SOURCES = [
  {
    labelKey: 'settings.aboutMeanings',
    name: 'CC-CEDICT',
    url: 'https://cc-cedict.org/wiki/',
    license: 'CC BY-SA 4.0',
  },
  {
    labelKey: 'settings.aboutWordList',
    name: 'clem109/hsk-vocabulary',
    url: 'https://github.com/clem109/hsk-vocabulary',
    license: 'MIT',
  },
  {
    labelKey: 'settings.aboutCharacterData',
    name: 'Unicode Unihan',
    url: 'https://www.unicode.org/reports/tr38/',
    license: 'Unicode License v3',
  },
  {
    labelKey: 'settings.aboutEtymology',
    name: 'Make Me a Hanzi',
    url: 'https://github.com/skishore/makemeahanzi',
    license: 'LGPL 3.0+',
  },
  {
    labelKey: 'settings.aboutStrokeOrder',
    name: 'Hanzi Writer data',
    url: 'https://github.com/chanind/hanzi-writer-data',
    license: 'Arphic Public License',
  },
  {
    labelKey: 'settings.aboutExamples',
    name: 'Tatoeba',
    url: 'https://tatoeba.org',
    license: 'CC BY 2.0 FR',
  },
] as const

export function SettingsPage() {
  return (
    <>
      <PageHeader title={t('nav.settings')} description={t('settings.description')} />
      <div className="flex max-w-2xl flex-col gap-6">
        <SettingsSection title={t('settings.practice')}>
          <SessionSizeSetting />
        </SettingsSection>
        <SettingsSection title={t('settings.tones')}>
          <div className="flex flex-col gap-4">
            <ToggleSetting setting="toneColors" label={t('settings.toneColors')} hint={t('settings.toneColorsHint')} />
            <ToggleSetting setting="toneNumbers" label={t('settings.toneNumbers')} hint={t('settings.toneNumbersHint')} />
            <ToneLegend className="border-t border-line pt-4" />
          </div>
        </SettingsSection>
        <SettingsSection title={t('settings.app')}>
          <InstallSetting />
        </SettingsSection>
        <SettingsSection title={t('settings.data')}>
          <ResetProgress />
        </SettingsSection>
        <SettingsSection title={t('settings.about')}>
          <ul className="flex flex-col gap-2">
            {DATA_SOURCES.map((source) => (
              <li key={source.name}>
                {t(source.labelKey)}:{' '}
                <a href={source.url} className="text-accent-strong underline underline-offset-2">
                  {source.name}
                </a>{' '}
                ({source.license})
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">{t('settings.aboutLicense')}</p>
        </SettingsSection>
      </div>
    </>
  )
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  )
}

/** Botones de opción con aspecto de selector segmentado. */
function SessionSizeSetting() {
  const { settings, updateSettings } = useSettings()
  return (
    <fieldset>
      <legend className="mb-2 text-ink-muted">{t('settings.sessionSize')}</legend>
      <div className="flex gap-2">
        {SESSION_SIZE_OPTIONS.map((size) => (
          <label
            key={size}
            className="cursor-pointer rounded-xl border-2 border-line px-5 py-2 font-medium tabular-nums has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name="session-size"
              value={size}
              checked={settings.sessionSize === size}
              onChange={() => updateSettings({ sessionSize: size })}
              className="sr-only"
            />
            {size}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

type ToggleSettingProps = {
  setting: 'toneColors' | 'toneNumbers'
  label: string
  hint: string
}

/** Un ajuste de sí o no, con una casilla nativa (accesible con teclado y lector de pantalla). */
function ToggleSetting({ setting, label, hint }: ToggleSettingProps) {
  const { settings, updateSettings } = useSettings()
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={settings[setting]}
        onChange={(event) => updateSettings({ [setting]: event.target.checked })}
        className="mt-1 size-5 shrink-0 accent-accent"
      />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-sm text-ink-muted">{hint}</span>
      </span>
    </label>
  )
}

/** Borrar el progreso pide confirmación en dos pasos, porque no se puede deshacer. */
function ResetProgress() {
  const { resetProgress } = useProgress()
  const [step, setStep] = useState<'idle' | 'confirming' | 'done'>('idle')
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (step === 'confirming') cancelRef.current?.focus()
  }, [step])

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-ink-muted">{t('settings.dataDescription')}</p>
      {step === 'confirming' ? (
        <div className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/5 p-4">
          <p>{t('settings.resetConfirm')}</p>
          <div className="flex flex-wrap gap-3">
            {/* El foco va a «Cancel»: pulsar Enter sin mirar no debe borrar nada */}
            <Button ref={cancelRef} variant="secondary" onClick={() => setStep('idle')}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetProgress()
                setStep('done')
              }}
            >
              {t('settings.resetConfirmButton')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setStep('confirming')}>
          {t('settings.reset')}
        </Button>
      )}
      <p role="status" className="text-success">
        {step === 'done' ? t('settings.resetDone') : ''}
      </p>
    </div>
  )
}
