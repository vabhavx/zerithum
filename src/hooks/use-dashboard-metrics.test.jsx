import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboardMetrics } from "./use-dashboard-metrics";

describe("useDashboardMetrics", () => {
  beforeEach(() => {
    // Set system time to 2023-10-15
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-10-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return default metrics when no data is provided", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current).toEqual({
      totalRevenue: 0,
      prevRevenue: 0,
      revenueTrend: "neutral",
      revenueChange: "No prior data",
      activePlatformCount: 0,
      platformData: [],
      concentrationRisk: null,
      reconciledAmount: 0,
      unreconciledAmount: 0,
      unreconciledCount: 0,
    });
  });

  it("should calculate current month revenue correctly", () => {
    const transactions = [
      {
        transaction_date: "2023-10-05T10:00:00Z",
        amount: 100,
        platform: "youtube",
      },
      {
        transaction_date: "2023-10-10T10:00:00Z",
        amount: 200,
        platform: "patreon",
      },
      {
        transaction_date: "2023-09-25T10:00:00Z", // Previous month
        amount: 50,
        platform: "youtube",
      },
    ];

    const { result } = renderHook(() => useDashboardMetrics(transactions, []));

    expect(result.current.totalRevenue).toBe(300);
    expect(result.current.activePlatformCount).toBe(2);
    expect(result.current.prevRevenue).toBe(50);
  });

  it("should calculate revenue trend correctly (up)", () => {
    const transactions = [
      {
        transaction_date: "2023-10-05T10:00:00Z",
        amount: 200,
        platform: "youtube",
      },
      {
        transaction_date: "2023-09-25T10:00:00Z",
        amount: 100,
        platform: "youtube",
      },
    ];

    const { result } = renderHook(() => useDashboardMetrics(transactions, []));

    expect(result.current.totalRevenue).toBe(200);
    expect(result.current.prevRevenue).toBe(100);
    expect(result.current.revenueTrend).toBe("up");
    expect(result.current.revenueChange).toBe("+100.0% vs last month");
  });

  it("should calculate revenue trend correctly (down)", () => {
    const transactions = [
      {
        transaction_date: "2023-10-05T10:00:00Z",
        amount: 50,
        platform: "youtube",
      },
      {
        transaction_date: "2023-09-25T10:00:00Z",
        amount: 100,
        platform: "youtube",
      },
    ];

    const { result } = renderHook(() => useDashboardMetrics(transactions, []));

    expect(result.current.totalRevenue).toBe(50);
    expect(result.current.prevRevenue).toBe(100);
    expect(result.current.revenueTrend).toBe("down");
    expect(result.current.revenueChange).toBe("-50.0% vs last month");
  });

  it("should calculate platform breakdown correctly", () => {
    const transactions = [
      {
        transaction_date: "2023-10-05T10:00:00Z",
        amount: 100,
        platform: "youtube",
      },
      {
        transaction_date: "2023-09-25T10:00:00Z",
        amount: 50,
        platform: "youtube",
      },
      {
        transaction_date: "2023-09-20T10:00:00Z",
        amount: 75,
        platform: "patreon",
      },
    ];

    const { result } = renderHook(() => useDashboardMetrics(transactions, []));

    const platformData = result.current.platformData;
    expect(platformData).toHaveLength(2);

    const youtube = platformData.find((p) => p.platform === "youtube");
    expect(youtube).toEqual({
      platform: "youtube",
      currentMonth: 100,
      lastMonth: 50,
    });

    const patreon = platformData.find((p) => p.platform === "patreon");
    expect(patreon).toEqual({
      platform: "patreon",
      currentMonth: 0,
      lastMonth: 75,
    });
  });

  it("should calculate concentration risk correctly (high risk)", () => {
    // 90 days ago from 2023-10-15 is approx 2023-07-17
    const transactions = [
      {
        transaction_date: "2023-10-01T10:00:00Z",
        amount: 800,
        platform: "youtube",
      },
      {
        transaction_date: "2023-09-01T10:00:00Z",
        amount: 200,
        platform: "patreon",
      },
    ];

    const { result } = renderHook(() => useDashboardMetrics(transactions, []));

    expect(result.current.concentrationRisk).toEqual({
      platform: "youtube",
      percentage: 80,
      level: "high",
    });
  });

  it("should calculate concentration risk correctly (moderate risk)", () => {
    const transactions = [
      {
        transaction_date: "2023-10-01T10:00:00Z",
        amount: 600,
        platform: "youtube",
      },
      {
        transaction_date: "2023-09-01T10:00:00Z",
        amount: 400,
        platform: "patreon",
      },
    ];

    const { result } = renderHook(() => useDashboardMetrics(transactions, []));

    expect(result.current.concentrationRisk).toEqual({
      platform: "youtube",
      percentage: 60,
      level: "moderate",
    });
  });

  it("should calculate concentration risk correctly (diversified)", () => {
    const transactions = [
      {
        transaction_date: "2023-10-01T10:00:00Z",
        amount: 400,
        platform: "youtube",
      },
      {
        transaction_date: "2023-09-01T10:00:00Z",
        amount: 400,
        platform: "patreon",
      },
      {
        transaction_date: "2023-08-15T10:00:00Z",
        amount: 200,
        platform: "stripe",
      },
    ];

    const { result } = renderHook(() => useDashboardMetrics(transactions, []));

    // Total 1000. Top is 400 (40%)
    expect(result.current.concentrationRisk).toEqual({
      platform: "youtube", // or patreon, order depends on sort stability but both are 400
      percentage: 40,
      level: "diversified",
    });
  });

  it("should calculate reconciliation metrics correctly", () => {
    const reconciliations = [
      { status: "matched", amount: 100 },
      { status: "reconciled", amount: 200 },
      { status: "pending", amount: 50 },
      { status: "unmatched", amount: 25 },
    ];

    const { result } = renderHook(() => useDashboardMetrics([], reconciliations));

    expect(result.current.reconciledAmount).toBe(300);
    expect(result.current.unreconciledAmount).toBe(75);
    expect(result.current.unreconciledCount).toBe(2);
  });
});
