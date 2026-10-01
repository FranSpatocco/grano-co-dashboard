"use client";

import { useState, type FormEvent } from "react";
import { BeanIcon, CalendarIcon, LogoutIcon } from "@/components/icons";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useT } from "@/i18n";
import { addDays, type DateRange, type PeriodKey } from "@/lib/period";
import { useSession } from "@/lib/session";
import styles from "./dashboard.module.css";

interface Props {
  period: PeriodKey;
  custom: DateRange;
  today: string;
  /** Primer día con datos disponibles para el rango personalizado. */
  minDate: string;
  onPeriod: (p: PeriodKey) => void;
  onCustom: (r: DateRange) => void;
}

export function Header({ period, custom, today, minDate, onPeriod, onCustom }: Props) {
  const t = useT();
  const { isDemo, email, signOut } = useSession();
  const [showCustom, setShowCustom] = useState(false);

  const options: { key: PeriodKey; label: string }[] = [
    { key: "today", label: t.header.today },
    { key: "7d", label: t.header.last7 },
    { key: "30d", label: t.header.last30 },
  ];

  function applyCustom(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    let from = String(data.get("from"));
    let to = String(data.get("to"));
    if (from > to) [from, to] = [to, from];
    onCustom({ from: from < minDate ? minDate : from, to: to > today ? today : to });
    setShowCustom(false);
  }

  return (
    <header>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <BeanIcon size={22} />
          </span>
          <span>
            <span className={`serif ${styles.brandName}`}>{t.brand.name}</span>
            <span className={styles.brandSub}>{t.brand.place}</span>
          </span>
        </div>

        <div className={styles.controls}>
          <div className={styles.chips} role="group" aria-label={t.header.period}>
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                className="chip"
                aria-pressed={period === o.key}
                onClick={() => {
                  setShowCustom(false);
                  onPeriod(o.key);
                }}
              >
                {o.label}
              </button>
            ))}
            <button
              type="button"
              className="chip"
              aria-pressed={period === "custom"}
              aria-expanded={showCustom}
              aria-controls="custom-range"
              onClick={() => setShowCustom((v) => !v)}
            >
              <CalendarIcon size={16} />
              {t.header.custom}
            </button>
          </div>
          <LanguageSwitch />
          <span className={styles.user}>
            <span className={styles.avatar} aria-hidden="true">
              {(isDemo ? t.header.demoUser : (email ?? "?")).slice(0, 2).toUpperCase()}
            </span>
            <span className={styles.userText}>{isDemo ? t.header.demoUser : email}</span>
          </span>
          <button type="button" className={styles.iconBtn} onClick={() => signOut()} aria-label={t.header.signOut} title={t.header.signOut}>
            <LogoutIcon size={18} />
          </button>
        </div>
      </div>

      {showCustom && (
        <form id="custom-range" className={styles.customRange} onSubmit={applyCustom}>
          <label className={styles.dateField}>
            {t.header.from}
            <input type="date" name="from" defaultValue={custom.from} min={minDate} max={today} required />
          </label>
          <label className={styles.dateField}>
            {t.header.to}
            <input type="date" name="to" defaultValue={custom.to} min={minDate} max={today} required />
          </label>
          <button type="submit" className="btn btn-primary">
            {t.header.apply}
          </button>
        </form>
      )}
    </header>
  );
}

export function defaultCustomRange(today: string): DateRange {
  return { from: addDays(today, -13), to: today };
}
