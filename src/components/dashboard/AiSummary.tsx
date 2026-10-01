"use client";

import { AlertIcon, BeanIcon, RefreshIcon, SparkIcon } from "@/components/icons";
import { SummaryRequestError, useSummary } from "@/hooks/useSummary";
import { useI18n } from "@/i18n";
import { dateTime, integer, shortDate } from "@/lib/format";
import type { Summary } from "@/lib/schemas";
import styles from "./ticket.module.css";

function Zigzag() {
  let d = "M0 0 H320 V0";
  for (let x = 320; x > 0; x -= 16) d += ` L${x - 8} 10 L${x - 16} 0`;
  return (
    <svg className={styles.zigzag} viewBox="0 0 320 10" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} Z`} />
    </svg>
  );
}

function Ticket({ summary }: { summary: Summary }) {
  const { t } = useI18n();
  const range = `${shortDate(summary.weekFrom, t.locale)} – ${shortDate(summary.weekTo, t.locale)}`;
  return (
    <div className={styles.printer}>
      <div className={styles.slot} aria-hidden="true" />
      {/* La key reinicia la animación cada vez que llega un resumen nuevo. */}
      <div key={summary.generatedAt} className={`${styles.paper} ${styles.printing}`}>
        <article className={styles.ticket}>
          <div className={`${styles.top} ${styles.line} ${styles.l1}`}>{t.ai.ticketTop}</div>
          <h3 className={`serif ${styles.title} ${styles.line} ${styles.l1}`}>{t.ai.title}</h3>
          <div className={`${styles.meta} ${styles.line} ${styles.l1}`}>{t.ai.ticketMeta(range, integer(summary.orders, t.locale))}</div>
          <hr className={styles.rule} />
          <ol className={styles.list}>
            {summary.findings.map((f, i) => (
              <li key={i} className={`${styles.line} ${styles[`l${i + 2}`]}`}>
                <span className={styles.num}>0{i + 1}</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
          <hr className={styles.rule} />
          <div className={`${styles.foot} ${styles.line} ${styles.l5}`}>
            <span>{t.ai.generated(dateTime(summary.generatedAt, t.locale))}</span>
            <span>{summary.source === "claude" ? t.ai.byClaude : t.ai.byRules}</span>
          </div>
          <div className={`${styles.thanks} ${styles.line} ${styles.l5}`}>{t.ai.thanks}</div>
        </article>
        <Zigzag />
      </div>
    </div>
  );
}

function TicketSkeleton() {
  const { t } = useI18n();
  return (
    <div className={styles.printer} aria-busy="true">
      <div className={styles.slot} aria-hidden="true" />
      <div className={styles.paper}>
        <div className={styles.skeletonTicket} aria-hidden="true">
          <div className="skeleton" style={{ height: 10, width: "44%", margin: "0 auto" }} />
          <div className="skeleton" style={{ height: 22, width: "70%", margin: "12px auto 8px" }} />
          <div className="skeleton" style={{ height: 10, width: "52%", margin: "0 auto" }} />
          <hr className={styles.rule} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 8, marginBottom: 16 }}>
              <div className="skeleton" style={{ height: 12, width: 18 }} />
              <div>
                <div className="skeleton" style={{ height: 12, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "92%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "58%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className={styles.note} role="status" style={{ marginTop: 16, textAlign: "center" }}>
        {t.ai.loadingShort}
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useI18n();
  const detail = error instanceof SummaryRequestError ? error.detail : null;

  if (detail?.error === "insufficient_data") {
    const have = detail.daysAvailable ?? 0;
    const need = detail.daysRequired ?? 7;
    return (
      <div className="state">
        <span className="state-icon">
          <BeanIcon size={24} />
        </span>
        <h3>{t.ai.insufficientTitle}</h3>
        <p>{t.ai.insufficientText(have, need)}</p>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span className="muted">{t.ai.daysWithSales}</span>
            <span className="mono">
              {have} / {need}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "var(--soft)", overflow: "hidden" }}>
            <div style={{ width: `${(have / need) * 100}%`, height: "100%", background: "var(--fg)" }} />
          </div>
        </div>
      </div>
    );
  }

  const limited = detail?.error === "rate_limited";
  return (
    <div className="state" role="alert">
      <span className="state-icon" style={{ color: "var(--down)" }}>
        <AlertIcon size={24} />
      </span>
      <h3>{limited ? t.ai.limitTitle : t.ai.errorTitle}</h3>
      <p>{limited ? t.ai.limitText : t.ai.errorText}</p>
      {!limited && (
        <>
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            <RefreshIcon size={18} /> {t.ai.retry}
          </button>
          <p style={{ fontSize: 13 }}>{t.ai.errorNote}</p>
        </>
      )}
    </div>
  );
}

export function AiSummary() {
  const { t, lang } = useI18n();
  const { query, regenerate } = useSummary(lang);
  const data = query.data;
  const loading = query.isPending || regenerate.isPending;
  const error = regenerate.error ?? (data ? null : query.error);

  return (
    <>
      <div className="card-head">
        <div>
          <h2 id="ai-title" className="card-title">
            {t.ai.title}
          </h2>
          <div className="card-sub">{t.ai.sub}</div>
        </div>
        {data?.summary?.source === "claude" && (
          <span className="badge">
            <SparkIcon size={14} /> {t.ai.badge}
          </span>
        )}
      </div>

      <div aria-live="polite">
        {loading ? (
          <TicketSkeleton />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              regenerate.reset();
              if (data?.aiEnabled) regenerate.mutate();
              else void query.refetch();
            }}
          />
        ) : data?.summary ? (
          <Ticket summary={data.summary} />
        ) : null}
      </div>

      {data && !error && (
        <div className={styles.actions}>
          {data.aiEnabled ? (
            <span className={styles.note}>{data.remaining > 0 ? t.ai.remaining(data.remaining, data.limit) : t.ai.noneLeft}</span>
          ) : (
            <p className={styles.note}>{t.ai.rulesNote}</p>
          )}
          {data.aiEnabled && (
            <button type="button" className="btn" onClick={() => regenerate.mutate()} disabled={loading || data.remaining === 0}>
              <RefreshIcon size={18} /> {t.ai.regenerate}
            </button>
          )}
        </div>
      )}
    </>
  );
}
