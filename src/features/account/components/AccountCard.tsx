import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { t, type MessageKey } from '../../../i18n/index.ts'
import { useAccount, type SyncStatus } from '../accountContext.ts'

const SYNC_STATUS_TEXT: Record<SyncStatus, MessageKey> = {
  idle: 'account.syncIdle',
  syncing: 'account.syncing',
  synced: 'account.synced',
  error: 'account.syncError',
}

type EmailState = 'idle' | 'sending' | 'sent' | 'error'

/** Sign in or out. Hidden when no Supabase project is configured. */
export function AccountCard() {
  const { enabled, loading, user, syncStatus, signInWithGoogle, sendEmailLink, signOut } = useAccount()
  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState<EmailState>('idle')
  const [googleError, setGoogleError] = useState(false)
  const emailId = useId()

  if (!enabled || loading) return null

  if (user) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('account.title')}</h2>
        <p>{t('account.signedInAs', { email: user.email ?? '' })}</p>
        <p role="status" className={`text-sm ${syncStatus === 'error' ? 'text-danger' : 'text-ink-muted'}`}>
          {t(SYNC_STATUS_TEXT[syncStatus])}
        </p>
        <div>
          <Button variant="secondary" onClick={() => void signOut()}>
            {t('account.signOut')}
          </Button>
        </div>
      </Card>
    )
  }

  const continueWithGoogle = async () => {
    setGoogleError(false)
    try {
      await signInWithGoogle()
    } catch {
      setGoogleError(true)
    }
  }

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault()
    if (email.trim() === '') return
    setEmailState('sending')
    try {
      await sendEmailLink(email.trim())
      setEmailState('sent')
    } catch {
      setEmailState('error')
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t('account.title')}</h2>
        <p className="text-sm text-ink-muted">{t('account.description')}</p>
      </div>
      <div>
        <Button onClick={() => void continueWithGoogle()}>{t('account.google')}</Button>
        {googleError && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {t('account.error')}
          </p>
        )}
      </div>
      <form onSubmit={(event) => void submitEmail(event)} className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="font-medium">
          {t('account.emailLabel')}
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailState('idle')
            }}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-2.5"
          />
          <Button type="submit" variant="secondary" disabled={emailState === 'sending' || email.trim() === ''}>
            {t('account.sendLink')}
          </Button>
        </div>
        {emailState === 'sent' && (
          <p role="status" className="text-sm text-success">
            {t('account.linkSent')}
          </p>
        )}
        {emailState === 'error' && (
          <p role="alert" className="text-sm text-danger">
            {t('account.error')}
          </p>
        )}
      </form>
    </Card>
  )
}
