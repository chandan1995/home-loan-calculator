function calculateEMI(principal, annualRate, tenureMonths) {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function estimateTenureFromEmi(principal, annualRate, emi) {
  if (principal <= 0 || emi <= 0) return Infinity;
  const monthlyRate = annualRate / 12 / 100;
  if (emi <= principal * monthlyRate) return Infinity;
  const denom = emi - principal * monthlyRate;
  const n = Math.log(emi / denom) / Math.log(1 + monthlyRate);
  return n;
}

function generateOriginalSchedule(inputs) {
  const { principal, annualRate, tenureMonths, currentEmi } = inputs;
  const calculatedEmi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyEmi = currentEmi > 0 ? currentEmi : calculatedEmi;
  const monthlyRate = annualRate / 12 / 100;
  let effectiveTenure = tenureMonths;
  if (currentEmi > 0) {
    const implied = estimateTenureFromEmi(principal, annualRate, currentEmi);
    if (isFinite(implied) && implied > 0) effectiveTenure = Math.ceil(implied);
  }
  const schedule = [];
  let balance = principal;
  let totalInterestPaid = 0;
  for (let month = 1; month <= effectiveTenure && balance > 0; month++) {
    const interestPaid = balance * monthlyRate;
    let principalPaid = monthlyEmi - interestPaid;
    if (principalPaid > balance) principalPaid = balance;
    balance -= principalPaid;
    totalInterestPaid += interestPaid;
    schedule.push({ month, emi: month === tenureMonths ? principalPaid + interestPaid : monthlyEmi, principalPaid, interestPaid, prepayment: 0, closingBalance: Math.max(0, balance) });
  }
  return { monthlyEmi, totalInterest: totalInterestPaid, totalPayment: totalInterestPaid + principal, tenureMonths: schedule.length, schedule };
}

function generateModifiedSchedule(inputs) {
  const { principal, annualRate, tenureMonths, prepaymentType, onetimePrepayment, emiIncreasePercent, prepaymentStartMonth, currentEmi } = inputs;
  const calculatedEmi = calculateEMI(principal, annualRate, tenureMonths);
  const baseEmi = currentEmi > 0 ? currentEmi : calculatedEmi;
  const monthlyRate = annualRate / 12 / 100;
  let activeEmi = baseEmi;
  let balance = principal;
  let totalInterestPaid = 0;
  const schedule = [];
  let effectiveTenure = tenureMonths;
  if (currentEmi > 0) {
    const implied = estimateTenureFromEmi(principal, annualRate, currentEmi);
    if (isFinite(implied) && implied > 0) effectiveTenure = Math.ceil(implied);
  }
  const maxMonths = Math.max(effectiveTenure, tenureMonths) * 2;
  for (let month = 1; month <= maxMonths && balance > 0.01; month++) {
    const interestPaid = balance * monthlyRate;
    let emiForMonth = activeEmi;
    if (month >= prepaymentStartMonth) {
      if (prepaymentType === 'emiIncrease' || prepaymentType === 'both') {
        emiForMonth = baseEmi * (1 + emiIncreasePercent / 100);
        if (month === prepaymentStartMonth) activeEmi = emiForMonth;
      }
    }
    let principalPaid = emiForMonth - interestPaid;
    let prepayment = 0;
    if (month === prepaymentStartMonth) {
      if (prepaymentType === 'onetime' || prepaymentType === 'both') {
        prepayment = Math.min(onetimePrepayment, balance - principalPaid);
        if (prepayment < 0) prepayment = 0;
      }
    }
    if (principalPaid + prepayment > balance) {
      principalPaid = balance - prepayment;
      if (principalPaid < 0) { prepayment = balance; principalPaid = 0; }
    }
    balance = balance - principalPaid - prepayment;
    totalInterestPaid += interestPaid;
    schedule.push({ month, emi: emiForMonth, principalPaid, interestPaid, prepayment, closingBalance: Math.max(0, balance) });
    if (balance <= 0.01) break;
  }
  return { monthlyEmi: activeEmi, totalInterest: totalInterestPaid, totalPayment: totalInterestPaid + principal, tenureMonths: schedule.length, schedule };
}

function compareLoanScenarios(inputs) {
  const original = generateOriginalSchedule(inputs);
  const modified = generateModifiedSchedule(inputs);
  return { original, modified, tenureSaved: original.tenureMonths - modified.tenureMonths, emiSaved: original.monthlyEmi - modified.monthlyEmi, interestSaved: original.totalInterest - modified.totalInterest };
}

function runScenario(name, inputs) {
  console.log('\n=== ' + name + ' ===');
  const res = compareLoanScenarios(inputs);
  console.log('Original EMI:', Math.round(res.original.monthlyEmi), 'Tenure:', res.original.tenureMonths);
  console.log('Modified EMI:', Math.round(res.modified.monthlyEmi), 'Tenure:', res.modified.tenureMonths);
  console.log('Tenure saved:', res.tenureSaved);
  console.log('Interest saved:', Math.round(res.interestSaved));
}

const baseInputs = {
  principal: 1000000,
  annualRate: 8.5,
  tenureMonths: 240,
  currentEmi: 0,
  prepaymentType: 'none',
  onetimePrepayment: 100000,
  emiIncreasePercent: 10,
  prepaymentStartMonth: 13,
};

runScenario('No Prepayment (baseline)', baseInputs);

const onetime = { ...baseInputs, prepaymentType: 'onetime' };
runScenario('One-time Prepayment 100k at month 13', onetime);

const emiInc = { ...baseInputs, prepaymentType: 'emiIncrease', emiIncreasePercent: 20 };
runScenario('EMI Increase 20% from month 13', emiInc);

const both = { ...baseInputs, prepaymentType: 'both' };
runScenario('Both: One-time + EMI Increase', both);

// Test with user-provided current EMI override
const override = { ...baseInputs, currentEmi: 7500, prepaymentType: 'onetime' };
runScenario('User-specified current EMI override', override);
