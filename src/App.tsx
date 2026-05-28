import { useState, useMemo } from 'react';
import {
  Calculator,
  Home,
  TrendingDown,
  Clock,
  Wallet,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { LoanInputs, ComparisonResult } from './types/loan';
import {
  compareLoanScenarios,
  formatCurrency,
  calculateEMI,
} from './utils/loanCalculations';
import { FormField } from './components/FormField';
import { SelectField } from './components/SelectField';
import { SummaryCard } from './components/SummaryCard';
import { AmortizationTable } from './components/AmortizationTable';
import { DonutChart } from './components/DonutChart';

const defaultInputs: LoanInputs = {
  principal: 5000000,
  annualRate: 8.5,
  tenureMonths: 240,
  currentEmi: 0,
  prepaymentType: 'none',
  onetimePrepayment: 500000,
  emiIncreasePercent: 10,
  prepaymentStartMonth: 13,
  prepaymentStartDate: '',
};

function App() {
  const [inputs, setInputs] = useState<LoanInputs>(defaultInputs);
  const [showResults, setShowResults] = useState(false);

  const updateInput = <K extends keyof LoanInputs>(key: K, value: LoanInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberInput = (key: keyof LoanInputs, value: string) => {
    const num = parseFloat(value) || 0;
    updateInput(key, num);
  };

  const addMonths = (d: Date, n: number) => {
    const dt = new Date(d.getTime());
    dt.setMonth(dt.getMonth() + n);
    return dt;
  };

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleDateInput = (value: string) => {
    // value is like 'YYYY-MM-DD'
    updateInput('prepaymentStartDate', value);
    if (!value) {
      updateInput('prepaymentStartMonth', 0);
      return;
    }
    const date = new Date(value + 'T00:00:00');
    const now = new Date();
    const monthsDiff = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
    const monthIndex = Math.max(1, monthsDiff + 1);
    const capped = Math.min(monthIndex, inputs.tenureMonths);
    updateInput('prepaymentStartMonth', capped);
  };

  const result: ComparisonResult | null = useMemo(() => {
    if (!showResults) return null;
    return compareLoanScenarios(inputs);
  }, [inputs, showResults]);

  const calculatedEmi = useMemo(
    () => calculateEMI(inputs.principal, inputs.annualRate, inputs.tenureMonths),
    [inputs]
  );

  const currentEmi = inputs.currentEmi > 0 ? inputs.currentEmi : calculatedEmi;

  const prepaymentOptions = [
    { value: 'none', label: 'No Prepayment' },
    { value: 'onetime', label: 'One-Time Lump Sum' },
    { value: 'emiIncrease', label: 'Increase EMI by %' },
    { value: 'both', label: 'One-Time + EMI Increase' },
  ];

  const handleCalculate = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setInputs(defaultInputs);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Home size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">HomeLoan Calculator</h1>
              <p className="text-xs text-slate-500">Prepayment & EMI Analysis Tool</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-1 bg-slate-800 rounded-md">S3 Ready</span>
            <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded-md">v1.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* Loan Details Card */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Wallet size={16} className="text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Loan Details</h2>
              </div>

              <FormField
                label="Outstanding Principal"
                value={inputs.principal === 0 ? '' : inputs.principal}
                onChange={(v) => handleNumberInput('principal', v)}
                prefix="₹"
                min={0}
                step={100000}
                helperText="Current loan balance"
              />

              <FormField
                label="Rate of Interest"
                value={inputs.annualRate === 0 ? '' : inputs.annualRate}
                onChange={(v) => handleNumberInput('annualRate', v)}
                suffix="%"
                min={0}
                max={30}
                step={0.1}
              />

              <FormField
                label="Remaining Tenure"
                value={inputs.tenureMonths === 0 ? '' : inputs.tenureMonths}
                onChange={(v) => handleNumberInput('tenureMonths', v)}
                suffix="mo"
                min={1}
                max={360}
                step={1}
                helperText={`${Math.floor(inputs.tenureMonths / 12)} years ${inputs.tenureMonths % 12} months`}
              />

              <FormField
                label="Current EMI (optional)"
                value={inputs.currentEmi === 0 ? '' : inputs.currentEmi}
                onChange={(v) => handleNumberInput('currentEmi', v)}
                prefix="₹"
                min={0}
                step={100}
                helperText="Enter your actual EMI if it differs from the calculated EMI"
              />

              {currentEmi > 0 && (
                <div className="bg-slate-800/60 rounded-lg p-3 flex items-center justify-between border border-slate-700/30">
                  <span className="text-sm text-slate-400">Current EMI</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(currentEmi)}</span>
                </div>
              )}

              {inputs.currentEmi > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Calculated EMI: {formatCurrency(calculatedEmi)}
                </p>
              )}
            </div>

            {/* Prepayment Options Card */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Prepayment Strategy</h2>
              </div>

              <SelectField
                label="Prepayment Type"
                value={inputs.prepaymentType}
                onChange={(v) => updateInput('prepaymentType', v as LoanInputs['prepaymentType'])}
                options={prepaymentOptions}
              />

              {inputs.prepaymentType !== 'none' && (
                <>
                  <FormField
                    label="Start date"
                    type="date"
                    value={inputs.prepaymentStartDate || ''}
                    onChange={(v) => handleDateInput(v)}
                    min={formatDate(new Date())}
                    max={formatDate(addMonths(new Date(), inputs.tenureMonths - 1))}
                    helperText="Pick a date (no past dates)."
                  />

                  {(inputs.prepaymentType === 'onetime' || inputs.prepaymentType === 'both') && (
                    <FormField
                      label="One-Time Prepayment"
                      value={inputs.onetimePrepayment === 0 ? '' : inputs.onetimePrepayment}
                      onChange={(v) => handleNumberInput('onetimePrepayment', v)}
                      prefix="₹"
                      min={0}
                      step={50000}
                      helperText="Lump sum amount to prepay"
                    />
                  )}

                  {(inputs.prepaymentType === 'emiIncrease' || inputs.prepaymentType === 'both') && (
                    <FormField
                      label="EMI Increase"
                      value={inputs.emiIncreasePercent === 0 ? '' : inputs.emiIncreasePercent}
                      onChange={(v) => handleNumberInput('emiIncreasePercent', v)}
                      suffix="%"
                      min={0}
                      max={100}
                      step={1}
                      helperText={`New EMI: ${formatCurrency(currentEmi * (1 + inputs.emiIncreasePercent / 100))}`}
                    />
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCalculate}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500
                  text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/25
                  transition-all duration-300 hover:shadow-emerald-500/40 hover:-translate-y-0.5
                  flex items-center justify-center gap-2"
              >
                <Calculator size={18} />
                Calculate
                <ArrowRight size={16} />
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white
                  rounded-xl border border-slate-700 transition-all duration-200 text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-7 space-y-6">
            {!showResults || !result ? (
              <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-700/50 p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
                  <Calculator size={28} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-400 mb-2">Enter Loan Details & Calculate</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Fill in your loan details on the left, choose a prepayment strategy, and click Calculate to see how much you can save.
                </p>
                <div className="flex items-center gap-6 mt-8 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown size={14} />
                    <span>Tenure reduction</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>EMI comparison</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={14} />
                    <span>Interest savings</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SummaryCard
                    icon={Clock}
                    title="Tenure"
                    originalValue={`${result.original.tenureMonths} mo`}
                    modifiedValue={`${result.modified.tenureMonths} mo`}
                    saved={result.tenureSaved > 0 ? `${result.tenureSaved} months saved` : 'No change'}
                    savedType="positive"
                    gradient="bg-gradient-to-br from-blue-950/60 to-blue-900/30"
                  />
                  <SummaryCard
                    icon={Wallet}
                    title="Monthly EMI"
                    originalValue={formatCurrency(result.original.monthlyEmi)}
                    modifiedValue={formatCurrency(result.modified.monthlyEmi)}
                    saved={result.emiSaved !== 0 ? `${formatCurrency(Math.abs(result.emiSaved))} ${result.emiSaved > 0 ? 'less' : 'more'}` : undefined}
                    savedType={result.emiSaved > 0 ? 'positive' : 'negative'}
                    gradient="bg-gradient-to-br from-purple-950/60 to-purple-900/30"
                  />
                  <SummaryCard
                    icon={TrendingDown}
                    title="Total Interest"
                    originalValue={formatCurrency(result.original.totalInterest)}
                    modifiedValue={formatCurrency(result.modified.totalInterest)}
                    saved={result.interestSaved > 0 ? `${formatCurrency(result.interestSaved)} saved` : 'No savings'}
                    savedType="positive"
                    gradient="bg-gradient-to-br from-emerald-950/60 to-emerald-900/30"
                  />
                </div>

                {/* Visual Comparison */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
                    <TrendingDown size={18} className="text-emerald-400" />
                    Payment Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 mb-3 font-medium">Original Loan</span>
                      <DonutChart
                        principal={inputs.principal}
                        interest={result.original.totalInterest}
                      />
                      <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                        <div>
                          <span className="text-xs text-slate-500 block">Principal</span>
                          <span className="text-sm font-semibold text-blue-400">{formatCurrency(inputs.principal)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Interest</span>
                          <span className="text-sm font-semibold text-orange-400">{formatCurrency(result.original.totalInterest)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 mb-3 font-medium">With Prepayment</span>
                      <DonutChart
                        principal={inputs.principal}
                        interest={result.modified.totalInterest}
                      />
                      <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                        <div>
                          <span className="text-xs text-slate-500 block">Principal</span>
                          <span className="text-sm font-semibold text-blue-400">{formatCurrency(inputs.principal)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Interest</span>
                          <span className="text-sm font-semibold text-orange-400">{formatCurrency(result.modified.totalInterest)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Savings Banner */}
                {result.interestSaved > 0 && (
                  <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 rounded-xl border border-emerald-700/30 p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-emerald-300 font-medium mb-1">💰 Total Savings with Prepayment</p>
                        <p className="text-3xl font-bold text-emerald-400">{formatCurrency(result.interestSaved)}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          You pay {formatCurrency(result.original.totalPayment)} instead of {formatCurrency(result.original.totalPayment + result.interestSaved)}
                        </p>
                      </div>
                      <div className="flex gap-4 text-center">
                        <div className="bg-slate-800/60 rounded-lg px-4 py-2">
                          <span className="text-xs text-slate-400 block">Tenure Saved</span>
                          <span className="text-lg font-bold text-white">{result.tenureSaved} mo</span>
                        </div>
                        <div className="bg-slate-800/60 rounded-lg px-4 py-2">
                          <span className="text-xs text-slate-400 block">Years Saved</span>
                          <span className="text-lg font-bold text-white">{(result.tenureSaved / 12).toFixed(1)} yr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info box when no prepayment */}
                {inputs.prepaymentType === 'none' && (
                  <div className="bg-blue-900/20 rounded-xl border border-blue-700/30 p-4 flex items-start gap-3">
                    <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">No prepayment selected</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Choose a prepayment strategy above to see potential savings. You can try one-time lump sum,
                        increase your EMI by a percentage, or combine both strategies.
                      </p>
                    </div>
                  </div>
                )}

                {/* Amortization Tables */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <ChevronRight size={18} className="text-slate-400" />
                    Amortization Schedules
                  </h3>
                  <AmortizationTable
                    schedule={result.original.schedule}
                    title="Original Schedule"
                    emi={result.original.monthlyEmi}
                  />
                  <AmortizationTable
                    schedule={result.modified.schedule}
                    title="Modified Schedule (with Prepayment)"
                    emi={result.modified.monthlyEmi}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">HomeLoan Calculator Pro — Prepayment Analysis Tool</p>
          <p className="text-xs text-slate-600">Deploy on S3 | Static Site Ready</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
