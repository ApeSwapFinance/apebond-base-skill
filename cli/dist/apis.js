import { API_V2, CHAIN_ID_BASE, REALTIME_API, SOUL_ZAP_API, WIDGET_REFERENCE_ID, } from './constants.js';
/** Full bonds catalog (all Base bond contracts). Used only to label positions, not to discover them. */
export async function fetchBondsCatalog() {
    const res = await fetch(`${REALTIME_API}/utils/bonds`);
    if (!res.ok)
        return [];
    const data = (await res.json());
    return Array.isArray(data) ? data : [];
}
export async function fetchBaseBonds(bondAddress) {
    const params = new URLSearchParams({ chainId: String(CHAIN_ID_BASE) });
    if (bondAddress)
        params.set('bond', bondAddress);
    const res = await fetch(`${REALTIME_API}/bonds?${params}`);
    if (!res.ok)
        throw new Error(`realtime-api /bonds failed: ${res.status} ${await res.text()}`);
    const data = (await res.json());
    return data.bonds ?? [];
}
export async function fetchTierProofSignature(user, bond) {
    const res = await fetch(`${API_V2}/tier-signature`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user, bond, chainId: CHAIN_ID_BASE }),
    });
    if (!res.ok)
        throw new Error(`tier-signature failed: ${res.status} ${await res.text()}`);
    const data = (await res.json());
    if (!data.tierProofSignature)
        throw new Error('tier-signature response missing tierProofSignature');
    return data.tierProofSignature;
}
export async function trackWidgetTransaction(opts) {
    const res = await fetch(`${API_V2}/bills/widget`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            chainId: CHAIN_ID_BASE,
            transactionHash: opts.transactionHash,
            billContract: opts.billContract,
            referenceId: WIDGET_REFERENCE_ID,
            reason: opts.reason,
        }),
    });
    if (!res.ok)
        throw new Error(`POST /bills/widget failed: ${res.status} ${await res.text()}`);
}
export async function fetchSoulZapQuote(body) {
    const res = await fetch(SOUL_ZAP_API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`Soul Zap failed: ${res.status} ${await res.text()}`);
    const json = (await res.json());
    return json.result?.data ?? {};
}
