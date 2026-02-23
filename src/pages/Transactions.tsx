import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Form, Row, Col, Button, Dropdown } from 'react-bootstrap'
import { useStore } from 'zustand'
import {
  getTransactionsGroupedByDate,
  getFilteredTransactionsCount,
  getRoundUpsByParentIds,
  DEFAULT_PAGE_SIZE,
  type TransactionFilters,
  type TransactionSort,
} from '@/services/transactions'
import { getCategories } from '@/services/categories'
import { syncStore } from '@/stores/syncStore'
import {
  formatMoney,
  formatShortDate,
  formatShortDateWithYear,
} from '@/lib/format'

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
    const categoryIds = searchParams.getAll('categoryId').filter(Boolean)
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
      ...(categoryIds.length > 0 && { categoryIds }),
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
    if (f.categoryIds?.length) {
      f.categoryIds.forEach((id) => next.append('categoryId', id))
    }
    if (f.amountMin != null) next.set('amountMin', String(f.amountMin))
    if (f.amountMax != null) next.set('amountMax', String(f.amountMax))
    if (f.search) next.set('search', f.search)
    next.set('sort', s)
    setSearchParams(next)
  }

  return { filters, sort, setFilters }
}

export function Transactions() {
  const lastSyncCompletedAt = useStore(syncStore, (s) => s.lastSyncCompletedAt)
  const { filters, sort, setFilters } = useFiltersFromSearchParams()
  const [page, setPage] = useState(0)
  const categories = getCategories()
  const totalCount = useMemo(() => {
    void lastSyncCompletedAt // Recompute when sync completes
    return getFilteredTransactionsCount(filters)
  }, [filters, lastSyncCompletedAt])
  const limit = (page + 1) * DEFAULT_PAGE_SIZE
  const grouped = useMemo(() => {
    void lastSyncCompletedAt // Recompute when sync completes
    return getTransactionsGroupedByDate(filters, sort, {
      limit,
      offset: 0,
    })
  }, [filters, sort, limit, lastSyncCompletedAt])
  const dateKeys = useMemo(
    () => Object.keys(grouped).sort().reverse(),
    [grouped]
  )
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
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.categoryIds,
    filters.amountMin,
    filters.amountMax,
    filters.search,
  ])

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
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon">
            <i className="mdi mdi-credit-card-multiple" aria-hidden />
          </span>
          Transactions
        </h3>
      </div>
      <Card className="mb-3 grid-margin">
        <Card.Body>
          <Row className="g-2 mb-3">
            <Col md={2}>
              <Form.Control
                id="transactions-filter-date-from"
                name="dateFrom"
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) =>
                  updateFilter('dateFrom', e.target.value || undefined)
                }
                placeholder="From"
              />
            </Col>
            <Col md={2}>
              <Form.Control
                id="transactions-filter-date-to"
                name="dateTo"
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) =>
                  updateFilter('dateTo', e.target.value || undefined)
                }
                placeholder="To"
              />
            </Col>
            <Col md={2}>
              <Dropdown
                autoClose="outside"
                onSelect={(e) => {
                  if (e === '__all__') {
                    updateFilter('categoryIds', [])
                    return
                  }
                  if (e == null) return
                  const current = filters.categoryIds ?? []
                  const set = new Set(current)
                  if (set.has(e)) set.delete(e)
                  else set.add(e)
                  updateFilter('categoryIds', Array.from(set))
                }}
              >
                <Dropdown.Toggle
                  id="transactions-filter-category"
                  variant="outline-secondary"
                  className="w-100 text-start d-flex align-items-center justify-content-between"
                >
                  <span className="text-truncate">
                    {(filters.categoryIds?.length ?? 0) === 0
                      ? 'All categories'
                      : filters.categoryIds!.length === 1
                        ? (categories.find(
                            (c) => c.id === filters.categoryIds![0]
                          )?.name ?? '1 category')
                        : `${filters.categoryIds!.length} categories`}
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="p-0">
                  <Dropdown.Item
                    eventKey="__all__"
                    active={(filters.categoryIds?.length ?? 0) === 0}
                  >
                    All categories
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  {categories.map((c) => (
                    <Dropdown.Item
                      key={c.id}
                      eventKey={c.id}
                      as="div"
                      className="d-flex align-items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`transactions-cat-${c.id}`}
                        label={c.name}
                        checked={(filters.categoryIds ?? []).includes(c.id)}
                        onChange={() => {
                          const current = filters.categoryIds ?? []
                          const set = new Set(current)
                          if (set.has(c.id)) set.delete(c.id)
                          else set.add(c.id)
                          updateFilter('categoryIds', Array.from(set))
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={1}>
              <Form.Control
                id="transactions-filter-amount-min"
                name="amountMin"
                type="number"
                placeholder="Min $"
                value={filters.amountMin != null ? filters.amountMin / 100 : ''}
                onChange={(e) => {
                  const v = e.target.value
                  updateFilter(
                    'amountMin',
                    v === '' ? undefined : Number(v) * 100
                  )
                }}
              />
            </Col>
            <Col md={1}>
              <Form.Control
                id="transactions-filter-amount-max"
                name="amountMax"
                type="number"
                placeholder="Max $"
                value={filters.amountMax != null ? filters.amountMax / 100 : ''}
                onChange={(e) => {
                  const v = e.target.value
                  updateFilter(
                    'amountMax',
                    v === '' ? undefined : Number(v) * 100
                  )
                }}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                id="transactions-filter-search"
                name="search"
                type="search"
                placeholder="Search"
                value={filters.search ?? ''}
                onChange={(e) =>
                  updateFilter('search', e.target.value || undefined)
                }
              />
            </Col>
            <Col md={2}>
              <Form.Select
                id="transactions-sort"
                name="sort"
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
            <p className="text-muted mb-0">
              No transactions match your filters.
            </p>
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
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-center align-middle">Status</th>
                    <th>Merchant</th>
                    <th>Category</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dateKeys.flatMap((dateStr, dateIndex) => {
                    const showYear =
                      !filters.dateFrom &&
                      !filters.dateTo &&
                      (filters.categoryIds?.length ?? 0) > 0
                    const displayDate =
                      dateStr === 'Unknown'
                        ? 'Unknown'
                        : showYear
                          ? formatShortDateWithYear(dateStr)
                          : formatShortDate(dateStr)
                    const dayRows = grouped[dateStr].flatMap((row) => {
                      const isDebit = row.amount < 0
                      const absCents = Math.abs(row.amount)
                      const mainRow = (
                        <tr key={row.id}>
                          <td>{displayDate}</td>
                          <td
                            className={`text-center align-middle ${row.status === 'HELD' ? 'status-held' : ''}`}
                          >
                            {row.status === 'HELD' ? 'Held' : 'Settled'}
                          </td>
                          <td>
                            {row.description || row.raw_text || 'Unknown'}
                          </td>
                          <td>{row.category_name ?? ''}</td>
                          <td
                            className={`text-end ${isDebit ? '' : 'text-success'}`}
                          >
                            {isDebit ? '-' : '+'}${formatMoney(absCents)}
                          </td>
                        </tr>
                      )
                      const roundUpRows = (
                        roundUpsByParent.get(row.id) ?? []
                      ).map((ru) => (
                        <tr key={ru.id} className="small text-muted">
                          <td />
                          <td />
                          <td>
                            Round-up to{' '}
                            {ru.transfer_account_display_name ?? 'Loose Change'}
                          </td>
                          <td />
                          <td />
                          <td className="text-end text-success">
                            +${formatMoney(Math.abs(ru.amount))}
                          </td>
                        </tr>
                      ))
                      return [mainRow, ...roundUpRows]
                    })
                    const separator =
                      dateIndex < dateKeys.length - 1 ? (
                        <tr
                          key={`sep-${dateStr}`}
                          className="transactions-day-separator"
                          aria-hidden="true"
                        >
                          <td colSpan={5} />
                        </tr>
                      ) : null
                    return [...dayRows, separator].filter(Boolean)
                  })}
                </tbody>
              </table>
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
