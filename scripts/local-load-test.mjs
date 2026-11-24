import { performance } from "node:perf_hooks";

const target = new URL(process.env.LOAD_TEST_URL || "http://127.0.0.1:4173/");
const allowedHosts = new Set(["127.0.0.1", "localhost", "::1"]);
if (!allowedHosts.has(target.hostname)) {
  console.error("رفض الاختبار: مسموح فقط بعنوان localhost حتى لا يصل الضغط إلى موقع الإنتاج.");
  process.exit(2);
}
if (!["http:", "https:"].includes(target.protocol)) {
  console.error("عنوان الاختبار غير صالح.");
  process.exit(2);
}

const stages = [
  { users: 25, seconds: 15 },
  { users: 50, seconds: 15 },
  { users: 100, seconds: 15 },
];
const results = [];

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
}

async function runStage({ users, seconds }) {
  const latencies = [];
  let completed = 0, failed = 0, active = 0;
  const stopAt = performance.now() + seconds * 1000;
  const worker = async () => {
    while (performance.now() < stopAt) {
      active++;
      const started = performance.now();
      try {
        const response = await fetch(target, { signal: AbortSignal.timeout(10000), redirect: "manual" });
        await response.arrayBuffer();
        if (!response.ok) failed++;
        else completed++;
      } catch {
        failed++;
      } finally {
        latencies.push(performance.now() - started);
        active--;
      }
    }
  };
  await Promise.all(Array.from({ length: users }, worker));
  const total = completed + failed;
  const result = {
    users, seconds, requests: total, successful: completed, failed,
    errorRate: total ? +(failed / total * 100).toFixed(2) : 0,
    p50Ms: +percentile(latencies, 0.50).toFixed(1),
    p95Ms: +percentile(latencies, 0.95).toFixed(1),
    maxMs: +Math.max(0, ...latencies).toFixed(1),
    requestsPerSecond: +(total / seconds).toFixed(2),
  };
  results.push(result);
  console.log(JSON.stringify(result));
  if (result.errorRate > 5 || result.p95Ms > 3000) {
    console.error("إيقاف تلقائي: تجاوزت الأخطاء 5% أو تجاوز زمن p95 ثلاث ثوانٍ.");
    process.exitCode = 1;
    return false;
  }
  return true;
}

console.log(`اختبار محلي فقط: ${target.origin}`);
console.log("المسار: GET / — لا يتم إنشاء طلبات شراء أو تعديل قاعدة البيانات.");
for (const stage of stages) {
  const keepGoing = await runStage(stage);
  if (!keepGoing) break;
}
console.log("\nملخص:", JSON.stringify(results, null, 2));
