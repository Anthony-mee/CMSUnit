"use client";

import PocketBase from "pocketbase";

const pocketbaseUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/pocketbase-api`
    : process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export const pocketbaseClient = new PocketBase(pocketbaseUrl);
