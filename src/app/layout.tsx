import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-serif" });
const sans = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans" });
// Sin precarga: la mono solo se usa en cifras del panel (en el login, una línea).
// Precargarla competía con el CSS y las otras fuentes en la carga inicial en celular.
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", preload: false });

export const metadata: Metadata = {
  title: "Grano & Co. · Panel de gestión",
  description: "Dashboard de una cafetería de especialidad con resumen semanal generado con la API de Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
