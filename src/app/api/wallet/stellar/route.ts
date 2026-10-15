import { STELLAR } from "@/lib/chain/config";
import { errorResponse, okResponse, requireUser } from "@/lib/chain/api";
import { stellarActivityFor } from "@/lib/chain/activity";
import {
  StellarError,
  accountSnapshot,
  feeStats,
  reconcileStellarTransaction,
} from "@/lib/chain/stellar";
import {
  ensureWallet,
  listTransactions,
  mapConcurrent,
  markBalanceSynced,
  publicWallet,
} from "@/lib/chain/wallets";
import { ensureWallet, listTransactions, markBalanceSynced, publicWallet } from "@/lib/chain/wallets";
import { assertSameOrigin, CsrfError } from "@/lib/csrf";
import { mapConcurrent } from "@/lib/concurrency";

export const dynamic = "force-dynamic";

/**
 * Stellar Testnet dashboard payload: the address, live account state from
 * Horizon, the current fee, and merged activity.
 */
export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (e) {
    if (e instanceof CsrfError)
      return errorResponse("forbidden", e.message, 403);
    throw e;
  }

  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const historyLimit = Math.min(Math.max(Number(url.searchParams.get("history") ?? 15) || 15, 1), 40);

  try {
    const wallet = await ensureWallet(guard.user.id, "stellar");

    // Resolve anything left in flight before reporting a status. Best effort:
    // a Horizon hiccup must not break the dashboard.
    const rows = await listTransactions(guard.user.id, "stellar", 25);
    const pendingRows = rows.filter(
      (row) => (row.status === "pending" || row.status === "unknown") && row.tx_hash
    );
    await mapConcurrent(pendingRows, 5, async (row) => {
      try {
        await reconcileStellarTransaction(guard.user.id, row);
      } catch {
        // Best effort: a Horizon hiccup must not break the dashboard
      }
    });
    // Bounded-concurrency reconcile — 5 Horizon/RPC calls at a time
    // instead of serial (each was an unbounded round-trip). Per-row
    // failures collect into `failures`; one stuck row can't block the batch.
    await mapConcurrent(rows.filter(
      (row) => (row.status === "pending" || row.status === "unknown") && row.tx_hash
    ), 5, (row) => reconcileStellarTransaction(guard.user.id, row));

    const [account, fees] = await Promise.all([accountSnapshot(wallet.address), feeStats()]);
    const activity = await stellarActivityFor(wallet, historyLimit);
    await markBalanceSynced(wallet.id);

    return okResponse({
      wallet: publicWallet(wallet),
      network: {
        label: STELLAR.networkLabel,
        horizon: STELLAR.horizonUrl,
        asset: STELLAR.asset.code,
        explorer: STELLAR.explorerAccount,
        friendbot: STELLAR.friendbotUrl,
      },
      account: {
        exists: account.exists,
        funded: account.funded,
        xlmBalance: account.xlmBalance,
        balances: account.balances,
        subentries: account.subentries,
        minimumBalanceXlm: account.minimumBalanceXlm,
        spendableXlm: account.spendableXlm,
        sequence: account.sequence,
        lastModifiedLedger: account.lastModifiedLedger,
      },
      fees,
      activity: activity.items,
      degraded: activity.degraded,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof StellarError) {
      return errorResponse(error.code, error.message, error.retryable ? 503 : 400, error.retryable);
    }
    console.error("[earnly] stellar overview failed", (error as Error).message);
    return errorResponse("unavailable", "We could not load your Stellar wallet.", 500, true);
  }
}
