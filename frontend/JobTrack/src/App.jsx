import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

function fromApi(application) {
  return {
    id: application.id,
    company: application.company,
    appliedDate: application.applied_date,
    responded: application.responded,
    interviewDate: application.interview_date || '',
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const error = await response.json()
      if (typeof error.detail === 'string') message = error.detail
    } catch {
      // Use the HTTP status message when the server doesn't return JSON.
    }
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function Icon({ name, size = 20 }) {
  const paths = {
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function App() {
  const [applications, setApplications] = useState([])
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/applications')
      .then((items) => {
        if (active) setApplications(items.map(fromApi))
      })
      .catch((error) => {
        if (active) setApiError(error.message || 'Could not connect to the JobTrack API.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [])

  const respondedCount = applications.filter((application) => application.responded).length
  const interviewCount = applications.filter((application) => application.interviewDate).length
  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase()
    return applications
      .filter((application) => {
        const matchesFilter =
          filter === 'all' || (filter === 'responded' ? application.responded : !application.responded)
        return matchesFilter && application.company.toLowerCase().includes(query)
      })
      .sort((first, second) => second.appliedDate.localeCompare(first.appliedDate))
  }, [applications, filter, search])

  async function addApplication(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const company = formData.get('company').trim()
    const appliedDate = formData.get('appliedDate')
    const interviewDate = formData.get('interviewDate')

    if (!company || !appliedDate) {
      setFormError('Add a company and application date to continue.')
      return
    }

    setIsSaving(true)
    setFormError('')
    setApiError('')
    try {
      const saved = await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({
          company,
          applied_date: appliedDate,
          interview_date: interviewDate || null,
        }),
      })
      setApplications((current) => [fromApi(saved), ...current])
      setIsFormOpen(false)
    } catch (error) {
      setFormError(error.message || 'Could not save this application.')
    } finally {
      setIsSaving(false)
    }
  }

  async function updateApplication(id, changes) {
    setPendingId(id)
    setApiError('')
    try {
      const saved = await apiRequest(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(Object.hasOwn(changes, 'responded') ? { responded: changes.responded } : {}),
          ...(Object.hasOwn(changes, 'interviewDate') ? { interview_date: changes.interviewDate || null } : {}),
        }),
      })
      setApplications((current) =>
        current.map((application) => application.id === id ? fromApi(saved) : application),
      )
    } catch (error) {
      setApiError(error.message || 'Could not update this application.')
    } finally {
      setPendingId(null)
    }
  }

  async function removeApplication(id) {
    setPendingId(id)
    setApiError('')
    try {
      await apiRequest(`/applications/${id}`, { method: 'DELETE' })
      setApplications((current) => current.filter((application) => application.id !== id))
    } catch (error) {
      setApiError(error.message || 'Could not remove this application.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="JobTrack home">
          <span className="brand-mark"><Icon name="briefcase" size={21} /></span>
          <span>jobtrack<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#applications">
            <Icon name="briefcase" size={18} />
            <span>Applications</span>
            <span className="nav-count">{applications.length}</span>
          </a>
        </nav>

        <div className="sidebar-tip">
          <div className="tip-icon"><Icon name="calendar" size={18} /></div>
          <p className="tip-title">Small steps add up.</p>
          <p>Keep your applications organized and your next opportunity in sight.</p>
        </div>

        <div className="sidebar-footer">
          <span className="avatar">JT</span>
          <span className="profile-copy"><strong>Your workspace</strong><small>Personal tracker</small></span>
          <span className={`online-dot${apiError || isLoading ? ' offline' : ''}`} aria-label={isLoading ? 'Connecting to API' : apiError ? 'API unavailable' : 'API connected'} />
        </div>
      </aside>

      <main className="main-content" id="applications">
        <header className="topbar">
          <span className="breadcrumb">Workspace <span>/</span> Applications</span>
          <div className="today-label"><Icon name="calendar" size={16} /> Your job search, in one place</div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">YOUR CAREER JOURNEY</div>
            <h1>Applications</h1>
            <p className="page-subtitle">A little organization goes a long way. Keep every opportunity moving.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => { setFormError(''); setIsFormOpen(true) }}>
            <Icon name="plus" size={18} /> Add application
          </button>
        </section>

        <section className="stats-grid" aria-label="Application summary">
          <article className="stat-card">
            <div className="stat-top"><span>Total applications</span><span className="stat-icon purple"><Icon name="briefcase" size={17} /></span></div>
            <div className="stat-number">{applications.length}</div>
            <div className="stat-note">opportunities you’re pursuing</div>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Responses</span><span className="stat-icon green"><Icon name="check" size={17} /></span></div>
            <div className="stat-number">{respondedCount}</div>
            <div className="stat-note">companies that got back to you</div>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Interviews</span><span className="stat-icon amber"><Icon name="calendar" size={17} /></span></div>
            <div className="stat-number">{interviewCount}</div>
            <div className="stat-note">interview dates on your calendar</div>
          </article>
        </section>

        <section className="applications-panel">
          <div className="panel-heading">
            <div>
              <h2>All applications <span className="heading-count">{applications.length}</span></h2>
              <p>Track where you’ve applied and what’s next.</p>
            </div>
            <label className="search-box">
              <Icon name="search" size={17} />
              <input
                aria-label="Search companies"
                placeholder="Search companies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="filter-row" role="group" aria-label="Filter applications">
            {[['all', 'All applications'], ['pending', 'Awaiting response'], ['responded', 'Responded']].map(([value, label]) => (
              <button
                className={`filter-button${filter === value ? ' selected' : ''}`}
                key={value}
                type="button"
                onClick={() => setFilter(value)}
              >
                {label}
                {value === 'all' && <span>{applications.length}</span>}
              </button>
            ))}
          </div>

          {apiError && <p className="storage-warning" role="alert">{apiError}</p>}

          {isLoading ? (
            <div className="empty-state" role="status">
              <h3>Loading applications…</h3>
              <p>Connecting to your JobTrack API.</p>
            </div>
          ) : visibleApplications.length > 0 ? (
            <div className="application-list">
              <div className="list-header">
                <span>COMPANY</span>
                <span>APPLIED ON</span>
                <span>RESPONSE</span>
                <span>INTERVIEW DATE</span>
                <span aria-label="Actions" />
              </div>
              {visibleApplications.map((application) => (
                <article className="application-row" key={application.id}>
                  <div className="company-cell">
                    <span className="company-avatar">{application.company.slice(0, 1).toUpperCase()}</span>
                    <span className="company-name">{application.company}</span>
                  </div>
                  <div className="date-cell"><Icon name="calendar" size={16} />{formatDate(application.appliedDate)}</div>
                  <div>
                    <button
                      className={`response-pill ${application.responded ? 'responded' : 'waiting'}`}
                      type="button"
                      aria-pressed={application.responded}
                      disabled={pendingId === application.id}
                      onClick={() => updateApplication(application.id, { responded: !application.responded })}
                    >
                      <span className="status-dot" />
                      {application.responded ? 'Responded' : 'Awaiting response'}
                    </button>
                  </div>
                  <div className="interview-cell">
                    {application.interviewDate ? (
                      <label className="interview-date">
                        <Icon name="calendar" size={16} />
                        <input
                          aria-label={`Interview date for ${application.company}`}
                          type="date"
                          value={application.interviewDate}
                          disabled={pendingId === application.id}
                          onChange={(event) => updateApplication(application.id, { interviewDate: event.target.value })}
                        />
                      </label>
                    ) : (
                      <label className="schedule-date">
                        <Icon name="plus" size={15} />
                        <input
                          aria-label={`Add interview date for ${application.company}`}
                          type="date"
                          value=""
                          disabled={pendingId === application.id}
                          onChange={(event) => updateApplication(application.id, { interviewDate: event.target.value })}
                        />
                        <span>Schedule</span>
                      </label>
                    )}
                  </div>
                  <button
                    className="remove-button"
                    type="button"
                    aria-label={`Remove ${application.company}`}
                    disabled={pendingId === application.id}
                    onClick={() => removeApplication(application.id)}
                  >
                    <Icon name="close" size={17} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-illustration"><Icon name={search || filter !== 'all' ? 'search' : 'briefcase'} size={27} /></div>
              <h3>{search || filter !== 'all' ? 'No matches found' : 'Your next opportunity starts here'}</h3>
              <p>{search || filter !== 'all' ? 'Try another search or switch to a different filter.' : 'Add your first application and keep all the important details together.'}</p>
              {!search && filter === 'all' && (
                <button className="secondary-button" type="button" onClick={() => setIsFormOpen(true)}>
                  <Icon name="plus" size={17} /> Add your first application
                </button>
              )}
            </div>
          )}
          <div className="panel-footer">{apiError ? 'Could not reach the JobTrack API.' : 'Connected to the JobTrack API.'}</div>
        </section>
      </main>

      {isFormOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFormOpen(false) }}>
          <section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">NEW OPPORTUNITY</div>
                <h2 id="modal-title">Add an application</h2>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setIsFormOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <p className="modal-description">Start with the details you know. You can add an interview date later.</p>
            <form onSubmit={addApplication}>
              <label className="form-field">
                <span>Company name <b>*</b></span>
                <input autoFocus name="company" placeholder="e.g. Acme Inc." required />
              </label>
              <label className="form-field">
                <span>Application date <b>*</b></span>
                <input name="appliedDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
              </label>
              <label className="form-field">
                <span>Interview date <small>Optional</small></span>
                <input name="interviewDate" type="date" />
              </label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="modal-actions">
                <button className="cancel-button" type="button" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  <Icon name="plus" size={17} /> {isSaving ? 'Saving…' : 'Save application'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App