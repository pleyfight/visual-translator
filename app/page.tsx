"use client";

import React from "react";
import { TranslationScreen } from "./components/TranslationScreen";

export default function Page() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">Visual Translator</h1>
      <p className="mt-2 text-gray-600">
        Next.js app scaffold. Install dependencies and run:{" "}
        <code>npm install</code> then <code>npm run dev</code>.
      </p>
      <TranslationScreen />
    </main>
  );
}