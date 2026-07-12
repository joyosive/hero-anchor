import type { Metadata } from "next";
import { WorkerLog } from "@/components/WorkerLog";

export const metadata: Metadata = {
  title: "Hero Worker - log your verified work",
  description:
    "Builders log community work; each task becomes a tamper-evident receipt and the day's root anchors on-chain into the Hero anchor on Arbitrum Sepolia.",
};

export default function LogPage() {
  return <WorkerLog />;
}
