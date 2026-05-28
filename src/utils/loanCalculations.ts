import { LoanInputs, MonthlyPayment, LoanSummary, ComparisonResult } from '../types/loan';

/**
 * Calculate EMI using standard formula
 * EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;
  
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Estimate number of months required to amortize a loan given an EMI
 * n = ln(EMI / (EMI - P*r)) / ln(1+r)
 */
export function estimateTenureFromEmi(principal: number, annualRate: number, emi: number): number {
  if (principal <= 0 || emi <= 0) return Infinity;
  const monthlyRate = annualRate / 12 / 100;
  // If EMI doesn't even cover monthly interest, tenure is infinite
  if (emi <= principal * monthlyRate) return Infinity;
  const denom = emi - principal * monthlyRate;
  const n = Math.log(emi / denom) / Math.log(1 + monthlyRate);
  return n;
}

/**
 * Generate amortization schedule without prepayment
 */
export function generateOriginalSchedule(inputs: LoanInputs): LoanSummary {
  const { principal, annualRate, tenureMonths, currentEmi } = inputs;
  const calculatedEmi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyEmi = currentEmi > 0 ? currentEmi : calculatedEmi;
  const monthlyRate = annualRate / 12 / 100;
  // If user provided an EMI, infer the effective tenure from it so calculations remain consistent
  let effectiveTenure = tenureMonths;
  if (currentEmi > 0) {
    const implied = estimateTenureFromEmi(principal, annualRate, currentEmi);
    if (isFinite(implied) && implied > 0) {
      effectiveTenure = Math.ceil(implied);
    }
  }
  
  const schedule: MonthlyPayment[] = [];
  let balance = principal;
  let totalInterestPaid = 0;
  
  for (let month = 1; month <= effectiveTenure && balance > 0; month++) {
    const interestPaid = balance * monthlyRate;
    let principalPaid = monthlyEmi - interestPaid;
    
    // Handle last month rounding
    if (principalPaid > balance) {
      principalPaid = balance;
    }
    
    balance -= principalPaid;
    totalInterestPaid += interestPaid;
    
    schedule.push({
      month,
      openingBalance: balance + principalPaid,
      emi: month === tenureMonths ? principalPaid + interestPaid : monthlyEmi,
      principalPaid,
      interestPaid,
      prepayment: 0,
      closingBalance: Math.max(0, balance),
      totalInterestPaid,
    });
  }
  
  return {
    monthlyEmi,
    totalInterest: totalInterestPaid,
    totalPayment: totalInterestPaid + principal,
    tenureMonths: schedule.length,
    schedule,
  };
}

/**
 * Generate amortization schedule with prepayment options
 */
export function generateModifiedSchedule(inputs: LoanInputs): LoanSummary {
  const { principal, annualRate, tenureMonths, prepaymentType, onetimePrepayment, emiIncreasePercent, prepaymentStartMonth, currentEmi } = inputs;
  const calculatedEmi = calculateEMI(principal, annualRate, tenureMonths);
  const baseEmi = currentEmi > 0 ? currentEmi : calculatedEmi;
  const monthlyRate = annualRate / 12 / 100;
  
  let activeEmi = baseEmi;
  let balance = principal;
  let totalInterestPaid = 0;
  const schedule: MonthlyPayment[] = [];
  // Use an expanded safety window based on effective tenure (if implied) to ensure schedule completes
  let effectiveTenure = tenureMonths;
  if (currentEmi > 0) {
    const implied = estimateTenureFromEmi(principal, annualRate, currentEmi);
    if (isFinite(implied) && implied > 0) {
      effectiveTenure = Math.ceil(implied);
    }
  }
  const maxMonths = Math.max(effectiveTenure, tenureMonths) * 2; // Safety limit
  
  for (let month = 1; month <= maxMonths && balance > 0.01; month++) {
    const interestPaid = balance * monthlyRate;
    let emiForMonth = activeEmi;
    
    // Apply EMI increase after start month
    if (month >= prepaymentStartMonth) {
      if (prepaymentType === 'emiIncrease' || prepaymentType === 'both') {
        emiForMonth = baseEmi * (1 + emiIncreasePercent / 100);
        if (month === prepaymentStartMonth) {
          activeEmi = emiForMonth;
        }
      }
    }
    
    let principalPaid = emiForMonth - interestPaid;
    let prepayment = 0;
    
    // Apply one-time prepayment
    if (month === prepaymentStartMonth) {
      if (prepaymentType === 'onetime' || prepaymentType === 'both') {
        prepayment = Math.min(onetimePrepayment, balance - principalPaid);
        if (prepayment < 0) prepayment = 0;
      }
    }
    
    // Handle last month
    if (principalPaid + prepayment > balance) {
      principalPaid = balance - prepayment;
      if (principalPaid < 0) {
        prepayment = balance;
        principalPaid = 0;
      }
    }
    
    balance = balance - principalPaid - prepayment;
    totalInterestPaid += interestPaid;
    
    schedule.push({
      month,
      openingBalance: balance + principalPaid + prepayment,
      emi: emiForMonth,
      principalPaid,
      interestPaid,
      prepayment,
      closingBalance: Math.max(0, balance),
      totalInterestPaid,
    });
    
    if (balance <= 0.01) break;
  }
  
  return {
    monthlyEmi: currentEmi,
    totalInterest: totalInterestPaid,
    totalPayment: totalInterestPaid + principal,
    tenureMonths: schedule.length,
    schedule,
  };
}

/**
 * Compare original loan vs modified with prepayment
 */
export function compareLoanScenarios(inputs: LoanInputs): ComparisonResult {
  const original = generateOriginalSchedule(inputs);
  const modified = generateModifiedSchedule(inputs);
  
  return {
    original,
    modified,
    tenureSaved: original.tenureMonths - modified.tenureMonths,
    emiSaved: original.monthlyEmi - modified.monthlyEmi,
    interestSaved: original.totalInterest - modified.totalInterest,
  };
}

/**
 * Format currency in Indian format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas (Indian style)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
