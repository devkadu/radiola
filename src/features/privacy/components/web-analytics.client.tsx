"use client";

import { Analytics } from "@vercel/analytics/next";
import { filterAnalyticsEvent } from "@/features/privacy/utils/filter-analytics-event";

export const WebAnalytics = () => (
  <Analytics beforeSend={filterAnalyticsEvent} mode="production" debug={false} />
);
