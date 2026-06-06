import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prodecta Sales Pilot",
  description: "Dashboard commercial connecte pour Calendar, Tasks, Gmail et Airtable."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
