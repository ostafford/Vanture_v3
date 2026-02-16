import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  getAvailableBalance,
  getReservedAmount,
  getSpendableBalance,
} from '@/services/balance'
import { formatMoney } from '@/lib/format'

const spendableTooltip = (
  <Tooltip id="spendable-tooltip">
    Spendable = Available minus reserved for upcoming charges. Only charges due before your next
    payday are reserved; prorated for monthly/quarterly/yearly.
  </Tooltip>
)

export function BalanceCard() {
  const available = getAvailableBalance()
  const reserved = getReservedAmount()
  const spendable = getSpendableBalance()

  return (
    <Card>
      <Card.Body>
        <h6 className="text-muted">Available</h6>
        <h2 className="mb-0">${formatMoney(available)}</h2>
        <hr />
        <h6 className="text-muted d-flex align-items-center gap-1">
          Spendable
          <OverlayTrigger placement="top" overlay={spendableTooltip}>
            <span
              className="text-muted"
              style={{ cursor: 'help', fontSize: '0.9rem' }}
              role="img"
              aria-label="Info"
            >
              &#8505;
            </span>
          </OverlayTrigger>
        </h6>
        <h2 className="text-success mb-1">${formatMoney(spendable)}</h2>
        <small className="text-muted">${formatMoney(reserved)} reserved for upcoming</small>
      </Card.Body>
    </Card>
  )
}
