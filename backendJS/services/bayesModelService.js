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

  const lambda = (k + alpha) / (T + beta);
  return { eventCount: k, annualLambda: lambda };
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

  // posterior log-likelihood (up to constant)
  // Poisson-Gamma => posterior in lam is Gamma( alpha0+k, beta0+T ),
  // but let's pretend we do metropolis:
  const postLog = (lam) => {
    if (lam <= 0) return -Infinity;
    // priorGamma( lam| alpha0, beta0 ) => (alpha0-1)*ln(lam) - beta0*lam
    // likelihood ~ Poisson => k*ln(lam) - lam*T
    // combine => (alpha0-1+k)*ln(lam) - (beta0+T)*lam
    return (alpha0 - 1 + k) * Math.log(lam) - (beta0 + T) * lam;
  };

  let lam = (k + 1) / (T + 5); // initial guess
  let lp = postLog(lam);
  const draws = 800,
    burn = 200;
  const step = lam * 0.5 || 0.1;
  const samples = [];
  for (let i = 0; i < draws + burn; i++) {
    const candidate = Math.abs(lam + (Math.random() * 2 - 1) * step);
    const lp2 = postLog(candidate);
    if (Math.log(Math.random()) < lp2 - lp) {
      lam = candidate;
      lp = lp2;
    }
    if (i >= burn) samples.push(lam);
  }
  const meanLam = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { eventCount: k, annualLambda: meanLam };
}

/**
 * computeBayesianLikelihoodForHazards
 *   - Receives { hazards, femaRecords, horizonYears, modelApproach, interpretation }
 *   - modelApproach = "quickGamma" | "metroGamma"
 *   - interpretation= "prob30" or "annual30"
 */
export function computeBayesianLikelihoodForHazards({
  hazards,
  femaRecords,
  horizonYears = 30,
  modelApproach = 'quickGamma',
  interpretation = 'prob30',
}) {
  // We'll compute each hazard's annualLambda => then interpret

  // pick the method
  const methodFn =
    modelApproach === 'metroGamma' ? metroGammaMethod : quickGammaMethod;

  // compute results
  const results = hazards.map((hz) => {
    const { eventCount, annualLambda } = methodFn(hz, femaRecords);

    // interpret => finalValue
    let finalValue = 1;
    if (interpretation === 'prob30') {
      // p = 1 - e^(-30*lambda)
      const p = probAtLeastOne(annualLambda, horizonYears);
      // p => 1..5 rating or numeric?
      // let's return a 1..5 scale
      finalValue = mapProbToBand(p);
    } else if (interpretation === 'annual30') {
      // in 30 yrs => expected count = 30*lambda
      // we then do (30*lambda)/30 => = lambda
      // So finalValue = annualLambda, but we might scale it to 1..5 ??? Or just store raw?
      finalValue = annualLambda; // or map to ???

      // If you want a 1..5 mapping from annual rate, define some custom logic.
      // e.g. finalValue = mapRateToSomeBand(annualLambda)
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
