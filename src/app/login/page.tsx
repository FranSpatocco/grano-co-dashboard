"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRightIcon, BeanIcon, LockIcon, MailIcon } from "@/components/icons";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useT } from "@/i18n";
import { firebaseEnabled } from "@/lib/firebase/config";
import { EmailLoginUnavailableError, InvalidCredentialsError, useSession } from "@/lib/session";
import styles from "./login.module.css";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { status, signInDemo, signInWithEmail } = useSession();
  const [pending, setPending] = useState<"demo" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "signed-in") router.replace("/");
  }, [status, router]);

  async function enterDemo() {
    setPending("demo");
    setError(null);
    try {
      await signInDemo();
    } catch {
      setError(t.login.failed);
      setPending(null);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending("email");
    setError(null);
    try {
      await signInWithEmail(String(data.get("email")), String(data.get("password")));
    } catch (err) {
      setError(
        err instanceof EmailLoginUnavailableError
          ? t.login.demoOnly
          : err instanceof InvalidCredentialsError
            ? t.login.invalid
            : t.login.failed,
      );
      setPending(null);
    }
  }

  return (
    <main className={styles.login}>
      <section className={styles.side}>
        <div className={styles.sideTop}>
          <span className={styles.brand}>
            <span className={styles.brandMark}>
              <BeanIcon size={22} />
            </span>
            <span className="serif">{t.brand.name}</span>
          </span>
          <LanguageSwitch />
        </div>
        <div>
          <svg className={styles.illus} width="260" height="200" viewBox="0 0 260 200" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M60 92h110v38a46 46 0 0 1-46 46h-18a46 46 0 0 1-46-46z" />
            <path d="M170 104h12a18 18 0 0 1 0 36h-14" />
            <path d="M40 184h170" />
            <path className={styles.steam} d="M92 40c-10 12 10 20 0 34M116 30c-10 14 10 24 0 44M140 40c-10 12 10 20 0 34" />
            <ellipse cx="214" cy="60" rx="12" ry="17" transform="rotate(35 214 60)" />
            <path d="M207 71c6-5 3-12 8-17s6-5 8-6" />
            <ellipse cx="236" cy="104" rx="9" ry="13" transform="rotate(-20 236 104)" />
            <path d="M233 115c3-5 0-9 3-13s4-4 5-5" />
          </svg>
          <h1 className={`serif ${styles.hero}`}>{t.login.heroTitle}</h1>
          <p className={styles.heroText}>{t.login.heroText}</p>
        </div>
        <p className={`mono ${styles.since}`}>{t.login.since}</p>
      </section>

      <section className={styles.formSide}>
        <div className={styles.form}>
          <div>
            <h2 className={`serif ${styles.title}`}>{t.login.title}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t.login.subtitle}
            </p>
          </div>

          <button type="button" className={`btn btn-primary ${styles.enter}`} onClick={enterDemo} disabled={pending !== null}>
            <span className={styles.enterText}>
              <span>{pending === "demo" ? t.login.entering : t.login.demo}</span>
              <span className={styles.enterHint}>{t.login.demoHint}</span>
            </span>
            <ArrowRightIcon size={22} />
          </button>

          <div className={styles.or}>{t.login.or}</div>

          <form className={styles.fields} onSubmit={submit} noValidate={!firebaseEnabled}>
            <div className={styles.field}>
              <label htmlFor="email">{t.login.email}</label>
              <div className={styles.input}>
                <input id="email" name="email" type="email" autoComplete="email" placeholder={t.login.emailPlaceholder} required />
                <MailIcon />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="password">{t.login.password}</label>
              <div className={styles.input}>
                <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
                <LockIcon />
              </div>
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={`btn ${styles.submit}`} disabled={pending !== null}>
              {pending === "email" ? t.login.entering : t.login.submit}
            </button>
          </form>
          <p className={`muted ${styles.footer}`}>{t.login.footer}</p>
        </div>
      </section>
    </main>
  );
}
