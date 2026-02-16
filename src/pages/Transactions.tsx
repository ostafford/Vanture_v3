import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Form, Row, Col, Button } from 'react-bootstrap'
import {
  getTransactionsGroupedByDate,
  getFilteredTransactionsCount,
  getRoundUpsByParentIds,
  DEFAULT_PAGE_SIZE,
  type TransactionFilters,
  type TransactionSort,
  type TransactionRow,
} from '@/services/transactions'
import { getCategories } from '@/services/categories'
import { formatMoney, formatShortDate } from '@/lib/format'

const SORT_OPTIONS: { value: TransactionSort; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'merchant', label: 'Merchant' },
]

function useFiltersFromSearchParams(): {
  filters: TransactionFilters
  sort: TransactionSort
  setFilters: (f: TransactionFilters, s: TransactionSort) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: TransactionFilters = useMemo(() => {
    let dateFrom = searchParams.get('dateFrom') ?? ''
    let dateTo = searchParams.get('dateTo') ?? ''
    const categoryId = searchParams.get('categoryId') ?? undefined
    let amountMin: number | undefined
    let amountMax: number | undefined
    const rawMin = searchParams.get('amountMin')
    const rawMax = searchParams.get('amountMax')
    if (rawMin != null && rawMin !== '') {
      const n = Number(rawMin)
      if (!Number.isNaN(n)) amountMin = n
    }
    if (rawMax != null && rawMax !== '') {
      const n = Number(rawMax)
      if (!Number.isNaN(n)) amountMax = n
    }
    if (amountMin != null && amountMax != null && amountMin > amountMax) {
      ;[amountMin, amountMax] = [amountMax, amountMin]
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      ;[dateFrom, dateTo] = [dateTo, dateFrom]
    }
    const search = searchParams.get('search') ?? undefined
    return {
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(categoryId && { categoryId }),
      ...(amountMin != null && { amountMin }),
      ...(amountMax != null && { amountMax }),
      ...(search && { search }),
    }
  }, [searchParams])

  const sort = (searchParams.get('sort') as TransactionSort) || 'date'

  const setFilters = (f: TransactionFilters, s: TransactionSort) => {
    const next = new URLSearchParams()
    if (f.dateFrom) next.set('dateFrom', f.dateFrom)
    if (f.dateTo) next.set('dateTo', f.dateTo)
    if (f.categoryId) next.set('categoryId', f.categoryId)
    if (f.amountMin != null) next.set('amountMin', String(f.amountMin))
    if (f.amountMax != null) next.set('amountMax', String(f.amountMax))
    if (f.search) next.set('search', f.search)
    next.set('sort', s)
    setSearchParams(next)
  }

  return { filters, sort, setFilters }
}

export function Transactions() {
  const { filters, sort, setFilters } = useFiltersFromSearchParams()
  const [page, setPage] = useState(0)
  const categories = getCategories()
  const totalCount = useMemo(
    () => getFilteredTransactionsCount(filters),
    [filters]
  )
  const limit = (page + 1) * DEFAULT_PAGE_SIZE
  const grouped = useMemo(
    () =>
      getTransactionsGroupedByDate(filters, sort, {
        limit,
        offset: 0,
      }),
    [filters, sort, limit]
  )
  const dateKeys = useMemo(() => Object.keys(grouped).sort().reverse(), [grouped])
  const loadedCount = useMemo(
    () => dateKeys.reduce((n, k) => n + grouped[k].length, 0),
    [dateKeys, grouped]
  )
  const hasMore = loadedCount < totalCount

  const parentIdsByDate = useMemo(() => {
    const all: string[] = []
    for (const rows of Object.values(grouped)) {
      for (const row of rows) all.push(row.id)
    }
    return all
  }, [grouped])

  const roundUpsByParent = useMemo(
    () => getRoundUpsByParentIds(parentIdsByDate),
    [parentIdsByDate]
  )

  useEffect(() => {
    setPage(0)
  }, [filters.dateFrom, filters.dateTo, filters.categoryId, filters.amountMin, filters.amountMax, filters.search])

  const updateFilter = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => {
    setFilters({ ...filters, [key]: value }, sort)
  }

  const updateSort = (s: TransactionSort) => {
    setFilters(filters, s)
  }

  return (
    <>
      <Card className="mb-3">
        <Card.Header>Transactions</Card.Header>
        <Card.Body>
          <Row className="g-2 mb-3">
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                placeholder="From"
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                placeholder="To"
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.categoryId ?? ''}
                onChange={(e) =>
                  updateFilter('categoryId', e.target.value || undefined)
                }
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={1}>
              <Form.Control
                type="number"
                placeholder="Min $"
                value={
                  filters.amountMin != null ? filters.amountMin / 100 : ''
                }
                onChange={(e) => {
                  const v = e.target.value
                  updateFilter('amountMin', v === '' ? undefined : Number(v) * 100)
                }}
              />
            </Col>
            <Col md={1}>
              <Form.Control
                type="number"
                placeholder="Max $"
                value={
                  filters.amountMax != null ? filters.amountMax / 100 : ''
                }
                onChange={(e) => {
                  const v = e.target.value
                  updateFilter('amountMax', v === '' ? undefined : Number(v) * 100)
                }}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="search"
                placeholder="Search"
                value={filters.search ?? ''}
                onChange={(e) => updateFilter('search', e.target.value || undefined)}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={sort}
                onChange={(e) => updateSort(e.target.value as TransactionSort)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort: {o.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          {totalCount === 0 ? (
            <p className="text-muted mb-0">No transactions match your filters.</p>
          ) : (
            <p className="text-muted small mb-0">
              Showing {loadedCount} of {totalCount} transaction(s)
              {hasMore && ' — load more below'}
            </p>
          )}
        </Card.Body>
      </Card>

      {dateKeys.length === 0 ? null : (
        <>
          <Card>
            <Card.Body>
              {dateKeys.map((dateStr) => (
                <DateGroup
                  key={dateStr}
                  dateStr={dateStr}
                  rows={grouped[dateStr]}
                  roundUpsByParent={roundUpsByParent}
                />
              ))}
            </Card.Body>
          </Card>
          {hasMore && (
            <div className="d-flex justify-content-center mt-3">
              <Button
                variant="outline-primary"
                onClick={() => setPage((p) => p + 1)}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}

function DateGroup({
  dateStr,
  rows,
  roundUpsByParent,
}: {
  dateStr: string
  rows: TransactionRow[]
  roundUpsByParent: Map<string, { id: string; amount: number; transfer_account_id: string | null; transfer_account_display_name: string | null }[]>
}) {
  const displayDate = dateStr === 'Unknown' ? 'Unknown' : formatShortDate(dateStr)
  return (
    <div className="mb-4">
      <h6 className="text-muted mb-2">{displayDate}</h6>
      <ul className="list-unstyled mb-0">
        {rows.map((row) => (
          <li key={row.id} className="mb-2">
            <TransactionLine row={row} />
            {roundUpsByParent.get(row.id)?.map((ru) => (
              <div
                key={ru.id}
                className="small text-muted ms-3 mt-1"
                style={{ color: 'var(--vantura-text-secondary)' }}
              >
                Round-up +${formatMoney(Math.abs(ru.amount))}{' '}
                → {ru.transfer_account_display_name ?? 'Loose Change'}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TransactionLine({ row }: { row: TransactionRow }) {
  const isDebit = row.amount < 0
  const absCents = Math.abs(row.amount)
  return (
    <div className="d-flex justify-content-between align-items-baseline">
      <span>
        {row.description || row.raw_text || 'Unknown'}{' '}
        {row.category_name && (
          <span className="text-muted small">({row.category_name})</span>
        )}
      </span>
      <span className={isDebit ? '' : 'text-success'}>
        {isDebit ? '-' : '+'}${formatMoney(absCents)}
      </span>
    </div>
  )
}
