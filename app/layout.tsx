import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prodecta Sales Pilot",
  description: "Copilote commercial IA avant, pendant et apres RDV."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
