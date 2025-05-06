// backendJS/services/bayesModelService.js
import { parseISO } from 'date-fns';

function getYear(isoString) {
  if (!isoString) return -9999;
  const d = parseISO(isoString);
  if (!(d instanceof Date) || isNaN(d)) return -9999;
  return d.getFullYear();
}

// =============== Helper functions ==============
function probAtLeastOne(lambda, horizonYears) {
  // p = 1 - e^(- horizon * λ)
  return 1 - Math.exp(-horizonYears * lambda);
}
function mapProbToBand(p) {
  // purely for demonstration if we needed rating
  if (p < 0.05) return 1;
  if (p < 0.2) return 2;
  if (p < 0.5) return 3;
  if (p < 0.8) return 4;
  return 5;
}

/**
 * 新增: mapRateToBand(annualLambda)
 *  - 给 annualLambda 做一组自定义阈值 => 1..5
 *  - 下面仅作示例，可根据需要增大或减小间隔
 */
function mapRateToBand(lambda) {
  // 例如:
  //  <0.01 => 1
  //  <0.05 => 2
  //  <0.15 => 3
  //  <0.30 => 4
  //  else => 5
  if (lambda < 0.01) return 1;
  if (lambda < 0.05) return 2;
  if (lambda < 0.15) return 3;
  if (lambda < 0.3) return 4;
  return 5;
}

/** QuickGamma approach:
 *  - alpha=1, beta=5 (fixed)
 *  - annual lambda = (count + alpha)/(years + beta)
 */
function quickGammaMethod(hazard, femaRecords) {
  const YEAR_START = 1964;
  const alpha = 1,
    beta = 5;
  const currentYear = new Date().getFullYear();

  // count how many events for this hazard
  const recs = femaRecords.filter(
    (r) =>
      (r.incidentType || '').toLowerCase() === hazard.toLowerCase() &&
      getYear(r.incidentBeginDate) >= YEAR_START
  );
  const k = recs.length;
  const T = Math.max(1, currentYear - YEAR_START + 1);

  // 2) posterior lambda
  const lam = (k + alpha) / (T + beta);
  return { eventCount: k, annualLambda: lam };
}

/** MetroGamma approach (简化metropolis):
 *  - hyper prior from sample mean? or just do naive log-post?
 *  - Here we do the same alpha=1,beta=5 for demonstration,
 *    but do a small Metropolis to get distribution -> pick mean
 */
function metroGammaMethod(hazard, femaRecords) {
  const YEAR_START = 1964;
  const alpha0 = 1,
    beta0 = 5;
  const currentYear = new Date().getFullYear();

  // collect records
  const recs = femaRecords.filter(
    (r) =>
      (r.incidentType || '').toLowerCase() === hazard.toLowerCase() &&
      getYear(r.incidentBeginDate) >= YEAR_START
  );
  const k = recs.length;
  const T = Math.max(1, currentYear - YEAR_START + 1);

  // posterior log-likelihood ~ (alpha0-1+k)*ln(lam)-(beta0+T)*lam
  const logPost = (lam) => {
    if (lam <= 0) return -Infinity;
    return (alpha0 - 1 + k) * Math.log(lam) - (beta0 + T) * lam;
  };

  let lam = (k + 1) / (T + 5);
  let lp = logPost(lam);
  const draws = 800,
    burn = 200;
  const step = lam * 0.5 || 0.1;
  const samples = [];

  for (let i = 0; i < draws + burn; i++) {
    const cand = Math.abs(lam + (Math.random() * 2 - 1) * step);
    const lp2 = logPost(cand);
    if (Math.log(Math.random()) < lp2 - lp) {
      lam = cand;
      lp = lp2;
    }
    if (i >= burn) samples.push(lam);
  }
  const meanLam = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { eventCount: k, annualLambda: meanLam };
}

/**
 * computeBayesianLikelihoodForHazards
 *   - hazards: string[]
 *   - femaRecords: array
 *   - horizonYears=30
 *   - modelApproach='quickGamma' | 'metroGamma'
 *   - interpretation='prob30' or 'annual30'
 */
export function computeBayesianLikelihoodForHazards({
  hazards,
  femaRecords,
  horizonYears = 30,
  modelApproach = 'quickGamma',
  interpretation = 'prob30',
}) {
  // pick a method
  const methodFn =
    modelApproach === 'metroGamma' ? metroGammaMethod : quickGammaMethod;

  // compute results
  const results = hazards.map((hz) => {
    const { eventCount, annualLambda } = methodFn(hz, femaRecords);

    let finalValue = 1; // default
    if (interpretation === 'prob30') {
      // p = 1 - e^(- horizon * lam)
      const p = probAtLeastOne(annualLambda, horizonYears);
      // p => 1..5 rating or numeric?
      // let's return a 1..5 scale
      finalValue = mapProbToBand(p);
    } else if (interpretation === 'annual30') {
      // interpret annualLambda => mapRateToBand
      // so you get e.g. 1..5 with more nuance
      finalValue = mapRateToBand(annualLambda);
    }

    return {
      hazard: hz,
      eventCount,
      annualLambda,
      suggestedValue: finalValue,
    };
  });

  return results;
}
