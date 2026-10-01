"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, SortIcon } from "@/components/icons";
import { useI18n } from "@/i18n";
import { PRODUCT_BY_ID } from "@/lib/catalog";
import { clock, integer, money, shortDate } from "@/lib/format";
import type { Order } from "@/lib/schemas";
import styles from "./dashboard.module.css";

const PER_PAGE = 10;
type SortKey = "time" | "total";
type SortDir = "asc" | "desc";

export function OrdersTable({ orders, limited }: { orders: Order[]; limited: boolean }) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "time", dir: "desc" });
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const described = orders.map((o) => ({
      ...o,
      products: o.items.map((it) => `${it.qty > 1 ? `${it.qty}× ` : ""}${PRODUCT_BY_ID[it.productId]?.name[lang] ?? it.productId}`).join(", "),
    }));
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? described.filter((o) => String(o.id).includes(needle) || o.products.toLowerCase().includes(needle))
      : described;
    const factor = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      if (sort.key === "total") return (a.total - b.total) * factor;
      return (a.date === b.date ? a.minute - b.minute : a.date < b.date ? -1 : 1) * factor;
    });
  }, [orders, q, sort, lang]);

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  function toggleSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
    setPage(1);
  }

  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none");
  const pageNumbers = visiblePages(current, pages);

  const caption = q
    ? t.orders.results(rows.length, q)
    : limited
      ? t.orders.captionLimited(integer(orders.length, t.locale))
      : t.orders.caption(integer(orders.length, t.locale));

  return (
    <>
      <div className={styles.ordersHead}>
        <div>
          <h2 id="orders-title" className="card-title">
            {t.orders.title}
          </h2>
          <div className="card-sub" aria-live="polite">
            {caption}
          </div>
        </div>
        <div className={styles.search}>
          <label htmlFor="orders-search">{t.orders.search}</label>
          <input
            id="orders-search"
            type="search"
            value={q}
            placeholder={t.orders.searchPlaceholder}
            autoComplete="off"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <SearchIcon size={18} />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="state" style={{ alignItems: "center", textAlign: "center" }}>
          <span className="state-icon">
            <SearchIcon size={22} />
          </span>
          <h3>{q ? t.orders.emptyTitle(q) : t.orders.emptyPeriodTitle}</h3>
          <p>{q ? t.orders.emptyText : t.orders.emptyPeriodText}</p>
          {q && (
            <button type="button" className="btn" onClick={() => setQ("")}>
              {t.orders.clear}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`${styles.ordersTable} ${styles.scrollX}`}>
            <table className="data-table">
              <caption className="sr-only">
                {t.orders.sortedBy(sort.key === "time" ? t.orders.time : t.orders.total, sort.dir === "asc" ? t.orders.asc : t.orders.desc)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t.orders.number}</th>
                  <th scope="col" aria-sort={ariaSort("time")}>
                    <button type="button" className={`${styles.sort} ${sort.key === "time" ? styles.sortActive : ""}`} onClick={() => toggleSort("time")}>
                      {t.orders.time} <SortIcon size={14} />
                    </button>
                  </th>
                  <th scope="col">{t.orders.products}</th>
                  <th scope="col" className="num" aria-sort={ariaSort("total")}>
                    <button type="button" className={`${styles.sort} ${sort.key === "total" ? styles.sortActive : ""}`} onClick={() => toggleSort("total")}>
                      {t.orders.total} <SortIcon size={14} />
                    </button>
                  </th>
                  <th scope="col">{t.orders.payment}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">#{o.id}</td>
                    <td>
                      <span className="mono">{clock(o.minute)}</span>{" "}
                      <span className="muted" style={{ fontSize: 13 }}>
                        {shortDate(o.date, t.locale)}
                      </span>
                    </td>
                    <td>{o.products}</td>
                    <td className="num">{money(o.total, t.locale)}</td>
                    <td className={styles.pay}>{t.orders.payments[o.payment]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.ordersList}>
            {visible.map((o) => (
              <li key={o.id} className={styles.orderItem}>
                <span>
                  <span className="mono">#{o.id}</span>{" "}
                  <span className="muted" style={{ fontSize: 13 }}>
                    · {clock(o.minute)} · {t.orders.payments[o.payment]}
                  </span>
                </span>
                <span className="mono">{money(o.total, t.locale)}</span>
                <span style={{ gridColumn: "1 / -1", fontSize: 14 }}>{o.products}</span>
              </li>
            ))}
          </ul>

          <nav className={styles.pager} aria-label={t.orders.pagination}>
            <span>{t.orders.showing((current - 1) * PER_PAGE + 1, Math.min(current * PER_PAGE, rows.length), rows.length)}</span>
            <div className={styles.pages}>
              <button type="button" className={`chip ${styles.pageBtn}`} aria-label={t.orders.prev} disabled={current === 1} onClick={() => setPage(current - 1)}>
                <ChevronLeftIcon size={18} />
              </button>
              {pageNumbers.map((n, i) =>
                n === null ? (
                  <span key={`gap-${i}`} className={styles.pageBtn} style={{ display: "inline-grid", placeItems: "center" }} aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    className={`chip ${styles.pageBtn}`}
                    aria-current={n === current ? "page" : undefined}
                    aria-label={t.orders.page(n)}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ),
              )}
              <button type="button" className={`chip ${styles.pageBtn}`} aria-label={t.orders.next} disabled={current === pages} onClick={() => setPage(current + 1)}>
                <ChevronRightIcon size={18} />
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

/** Números de página a mostrar, con huecos (null) cuando hay muchas: 1 … 4 5 6 … 20. */
function visiblePages(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}
