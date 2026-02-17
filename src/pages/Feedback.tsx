import { useState } from 'react'
import { Card, Button, Form, Spinner } from 'react-bootstrap'
import { toast } from '@/stores/toastStore'
import { submitFeedback } from '@/api/feedback'

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug report' },
  { value: 'feature', label: 'Feature request' },
  { value: 'general', label: 'General feedback' },
] as const

const MAX_TITLE = 200
const MAX_DESCRIPTION = 2000

export function Feedback() {
  const [type, setType] = useState<string>('general')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    const d = description.trim()
    if (!t) {
      toast.error('Please enter a title.')
      return
    }
    if (!d) {
      toast.error('Please enter a description.')
      return
    }
    if (t.length > MAX_TITLE) {
      toast.error(`Title must be at most ${MAX_TITLE} characters.`)
      return
    }
    if (d.length > MAX_DESCRIPTION) {
      toast.error(`Description must be at most ${MAX_DESCRIPTION} characters.`)
      return
    }

    setSubmitting(true)
    try {
      await submitFeedback({ type, title: t, description: d })
      toast.success('Feedback submitted. Thank you!')
      setTitle('')
      setDescription('')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not submit. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon">
            <i className="mdi mdi-message-text" aria-hidden />
          </span>
          Feedback
        </h3>
      </div>

      <Card className="grid-margin mb-4">
        <Card.Header as="h5" className="mb-0">
          Send feedback
        </Card.Header>
        <Card.Body>
          <p className="small text-muted mb-3">
            Report a bug, suggest a feature, or share general feedback. Your
            message is sent securely and will be reviewed.
          </p>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="feedback-type">Type</Form.Label>
              <Form.Select
                id="feedback-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={submitting}
              >
                {FEEDBACK_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="feedback-title">Title</Form.Label>
              <Form.Control
                id="feedback-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary"
                maxLength={MAX_TITLE}
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                {title.length}/{MAX_TITLE}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="feedback-description">Description</Form.Label>
              <Form.Control
                id="feedback-description"
                as="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your feedback in detail..."
                maxLength={MAX_DESCRIPTION}
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                {description.length}/{MAX_DESCRIPTION}
              </Form.Text>
            </Form.Group>
            <Button
              type="submit"
              className="btn-gradient-primary"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Submitting…
                </>
              ) : (
                'Submit feedback'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
