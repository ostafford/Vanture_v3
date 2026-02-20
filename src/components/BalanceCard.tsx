import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  getAvailableBalance,
  getReservedAmount,
  getSpendableBalance,
  getPayAmountCents,
} from '@/services/balance'
import { formatMoney } from '@/lib/format'

export function BalanceCard() {
  const available = getAvailableBalance()
  const reserved = getReservedAmount()
  const spendable = getSpendableBalance()
  const payAmountCents = getPayAmountCents()

  const spendableTooltip = (
    <Tooltip id="spendable-tooltip">
      Spendable = Available minus reserved for upcoming charges. Only charges due before your next
      payday are reserved; prorated for monthly/quarterly/yearly.
      {payAmountCents != null &&
        ` After payday (before new spending): about $${formatMoney(spendable)} + $${formatMoney(payAmountCents)} = $${formatMoney(spendable + payAmountCents)}.`}
    </Tooltip>
  )

  return (
    <Card className="bg-gradient-primary">
      <Card.Body>
        <h6 className="opacity-75 mb-1">Available</h6>
        <h2 className="mb-3 text-white">${formatMoney(available)}</h2>
        <hr className="border-white border-opacity-50" />
        <h6 className="opacity-75 d-flex align-items-center gap-1 mb-1">
          Spendable
          <OverlayTrigger placement="top" overlay={spendableTooltip}>
            <span
              style={{ cursor: 'help', fontSize: '0.9rem' }}
              role="img"
              aria-label="Info"
            >
              <i className="mdi mdi-information-outline text-white" aria-hidden />
            </span>
          </OverlayTrigger>
        </h6>
        <h2 className="text-white mb-1">${formatMoney(spendable)}</h2>
        <small className="opacity-75">${formatMoney(reserved)} reserved for upcoming</small>
      </Card.Body>
    </Card>
  )
}
