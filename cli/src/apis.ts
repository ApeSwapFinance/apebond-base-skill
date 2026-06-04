import {
  API_V2,
  CHAIN_ID_BASE,
  REALTIME_API,
  SOUL_ZAP_API,
  WIDGET_REFERENCE_ID,
} from './constants.js'
import type { BondsListResponse, RealtimeBond } from './types.js'

/** Full bonds catalog (all Base bond contracts). Used only to label positions, not to discover them. */
export async function fetchBondsCatalog(): Promise<
  Array<{ chainId?: number; contractAddress?: Record<number, string>; earnToken?: { symbol?: string } }>
> {
  const res = await fetch(`${REALTIME_API}/utils/bonds`)
  if (!res.ok) return []
  const data = (await res.json()) as unknown
  return Array.isArray(data) ? data : []
}

export async function fetchBaseBonds(bondAddress?: string): Promise<RealtimeBond[]> {
  const params = new URLSearchParams({ chainId: String(CHAIN_ID_BASE) })
  if (bondAddress) params.set('bond', bondAddress)
  const res = await fetch(`${REALTIME_API}/bonds?${params}`)
  if (!res.ok) throw new Error(`realtime-api /bonds failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as BondsListResponse
  return (data.bonds ?? []).filter((b) => b.hide !== true)
}

export async function fetchTierProofSignature(user: string, bond: string): Promise<string> {
  const res = await fetch(`${API_V2}/tier-signature`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user, bond, chainId: CHAIN_ID_BASE }),
  })
  if (!res.ok) throw new Error(`tier-signature failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { tierProofSignature?: string }
  if (!data.tierProofSignature) throw new Error('tier-signature response missing tierProofSignature')
  return data.tierProofSignature
}

export async function trackWidgetTransaction(opts: {
  transactionHash: string
  billContract: string
  reason?: string
}): Promise<void> {
  const params = new URLSearchParams({
    chainId: String(CHAIN_ID_BASE),
    transactionHash: opts.transactionHash,
    billContract: opts.billContract,
    referenceId: WIDGET_REFERENCE_ID,
  })
  if (opts.reason) params.set('reason', opts.reason)

  const res = await fetch(`${API_V2}/bills/widget/register?${params}`)
  if (!res.ok) throw new Error(`GET /bills/widget/register failed: ${res.status} ${await res.text()}`)
}

export async function fetchSoulZapQuote(body: Record<string, unknown>): Promise<{
  txData?: { to?: string; data?: string }
  protocolQuote?: unknown
}> {
  const res = await fetch(SOUL_ZAP_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Soul Zap failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { result?: { data?: { txData?: { to?: string; data?: string } } } }
  return json.result?.data ?? {}
}
