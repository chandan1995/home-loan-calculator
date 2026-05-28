export interface LoanInputs {
  principal: number;
  annualRate: number;
  tenureMonths: number;
  currentEmi: number;
  prepaymentType: 'none' | 'onetime' | 'emiIncrease' | 'both';
  onetimePrepayment: number;
  emiIncreasePercent: number;
  prepaymentStartMonth: number;
  // Optional ISO month string (YYYY-MM) selected by user for prepayment start
  prepaymentStartDate?: string;
}

export interface MonthlyPayment {
  month: number;
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  prepayment: number;
  closingBalance: number;
  totalInterestPaid: number;
}

export interface LoanSummary {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  tenureMonths: number;
  schedule: MonthlyPayment[];
}

export interface ComparisonResult {
  original: LoanSummary;
  modified: LoanSummary;
  tenureSaved: number;
  emiSaved: number;
  interestSaved: number;
}
