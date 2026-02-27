// scripts/benchmark_optimization.js

// Mock import.meta.env
global.import = { meta: { env: {} } };

// Mock PLATFORMS data structure to avoid importing from src/lib/platforms.js
// which uses import.meta.env and causes runtime errors in Node without transformation.
const PLATFORMS = [
  { id: "youtube", name: "YouTube", requiresApiKey: false },
  { id: "patreon", name: "Patreon", requiresApiKey: false },
  { id: "gumroad", name: "Gumroad", requiresApiKey: false },
  { id: "stripe", name: "Stripe", requiresApiKey: false },
  { id: "tiktok", name: "TikTok", requiresApiKey: false },
  { id: "shopify", name: "Shopify", requiresShopName: true },
  { id: "twitch", name: "Twitch", requiresApiKey: false },
  { id: "substack", name: "Substack", requiresApiKey: true }
];

// --- Mock Data Generation ---

const generateConnections = (count) => {
  const connections = [];
  const platformIds = PLATFORMS.map((p) => p.id);
  const statuses = ['active', 'syncing', 'error', 'stale'];

  for (let i = 0; i < count; i++) {
    const platformId = platformIds[i % platformIds.length];
    connections.push({
      id: `conn_${i}`,
      platform: platformId,
      sync_status: statuses[i % statuses.length],
      error_message: i % 10 === 0 ? `Error connecting to ${platformId}` : null,
      connected_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    });
  }
  return connections;
};

// --- Baseline Implementation ---
// Replicates the logic found in src/pages/ConnectedPlatforms.jsx before optimization
const baselineFilter = (connections, query, statusFilter = 'all') => {
  const q = query.trim().toLowerCase();
  return connections.filter((connection) => {
    if (statusFilter !== "all" && connection.sync_status !== statusFilter) return false;
    if (!q) return true;

    // The inefficient part: finding platform inside the loop
    const platform = PLATFORMS.find((item) => item.id === connection.platform);

    // The inefficient part: array allocation and joining inside the loop
    const text = [platform?.name, connection.platform, connection.error_message]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(q);
  });
};

// --- Optimized Implementation ---
// Mimics pre-calculating the search string outside the loop.
// Note: In React, we'd use useMemo for this preparation.
const optimizedFilter = (connections, preparedSearchStrings, query, statusFilter = 'all') => {
  const q = query.trim().toLowerCase();

  return connections.filter((connection, index) => {
      if (statusFilter !== "all" && connection.sync_status !== statusFilter) return false;
      if (!q) return true;

      // O(1) lookup using pre-calculated string
      return preparedSearchStrings[index].includes(q);
  });
};

// --- Benchmarking ---

const runBenchmark = () => {
  const ITEM_COUNT = 10000;
  const ITERATIONS = 1000;
  const QUERY = 'youtube error'; // Search for something likely to be found or partially found

  console.log(`Generating ${ITEM_COUNT} connections...`);
  const connections = generateConnections(ITEM_COUNT);

  console.log(`\n--- Running Baseline (Allocations inside loop) ---`);
  const startBaseline = performance.now();
  let baselineResultCount = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const res = baselineFilter(connections, QUERY);
    baselineResultCount = res.length;
  }
  const endBaseline = performance.now();
  const baselineTotalTime = endBaseline - startBaseline;

  console.log(`Total time for ${ITERATIONS} iterations: ${baselineTotalTime.toFixed(2)}ms`);
  console.log(`Average time per iteration: ${(baselineTotalTime / ITERATIONS).toFixed(4)}ms`);


  console.log(`\n--- Running Optimized (Pre-calculated strings) ---`);

  // Preparation step (simulating useMemo)
  const startPrep = performance.now();

  // 1. Create Map (O(P) where P is platforms count)
  const platformMap = new Map(PLATFORMS.map(p => [p.id, p]));

  // 2. Pre-calculate strings (O(N) where N is connections count)
  const preparedSearchStrings = connections.map(c => {
      const platform = platformMap.get(c.platform);
      return [platform?.name, c.platform, c.error_message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
  });

  const endPrep = performance.now();
  console.log(`Preparation time (Map + String build): ${(endPrep - startPrep).toFixed(2)}ms (paid once per data change)`);

  const startOptimized = performance.now();
  let optimizedResultCount = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const res = optimizedFilter(connections, preparedSearchStrings, QUERY);
    optimizedResultCount = res.length;
  }
  const endOptimized = performance.now();
  const optimizedTotalTime = endOptimized - startOptimized;

  console.log(`Total time for ${ITERATIONS} iterations (filtering only): ${optimizedTotalTime.toFixed(2)}ms`);
  console.log(`Average time per iteration: ${(optimizedTotalTime / ITERATIONS).toFixed(4)}ms`);

  console.log(`\n--- Results ---`);
  console.log(`Baseline avg: ${(baselineTotalTime / ITERATIONS).toFixed(4)}ms`);
  console.log(`Optimized avg: ${(optimizedTotalTime / ITERATIONS).toFixed(4)}ms`);

  const speedup = baselineTotalTime / optimizedTotalTime;
  console.log(`Speedup factor: x${speedup.toFixed(2)}`);

  if (baselineResultCount !== optimizedResultCount) {
      console.error(`\nWARNING: Result counts do not match! Baseline: ${baselineResultCount}, Optimized: ${optimizedResultCount}`);
  } else {
      console.log(`\nVerification: Result counts match (${baselineResultCount}).`);
  }
};

runBenchmark();
