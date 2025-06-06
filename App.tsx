import React, { useState, useCallback, useMemo } from 'react';
import { MonthlySalariesInput } from './components/MonthlySalariesInput';
import { LeavePeriodInput } from './components/LeavePeriodInput';
import { CalculationResultDisplay } from './components/CalculationResultDisplay';
import { PostpartumSupportGrantCheckbox } from './components/PostpartumSupportGrantCheckbox';
import { SpousePwasgConditionCheckbox } from './components/SpousePwasgConditionCheckbox'; // Import new component
import { calculateChildcareLeaveBenefits } from './services/CalculatorService';
import type { CalculationParams, CalculationResult } from './types';
import { DISCLAIMER_TEXT, PWASG_APPLICANT_MIN_LEAVE_DAYS, PWASG_NAME } from './constants';

const MONTHS_FOR_AVERAGE = 6;

const App: React.FC = () => {
  const [monthlySalaries, setMonthlySalaries] = useState<string[]>(Array(MONTHS_FOR_AVERAGE).fill(''));
  const today = new Date().toISOString().split('T')[0];
  const [leaveStartDate, setLeaveStartDate] = useState<string>(today);
  
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 6); // Default to 6 months leave
  // Ensure default end date is at least PWASG_APPLICANT_MIN_LEAVE_DAYS after start date if PWASG is a focus
  const minLeaveDate = new Date(today);
  minLeaveDate.setDate(minLeaveDate.getDate() + PWASG_APPLICANT_MIN_LEAVE_DAYS -1); // -1 because difference is inclusive
  if (defaultEndDate < minLeaveDate) {
    defaultEndDate.setTime(minLeaveDate.getTime());
  }
  const [leaveEndDate, setLeaveEndDate] = useState<string>(defaultEndDate.toISOString().split('T')[0]);
  
  const [applyPostpartumSupportGrant, setApplyPostpartumSupportGrant] = useState<boolean>(false);
  const [spouseMeetsPwasgConditions, setSpouseMeetsPwasgConditions] = useState<boolean>(false); // State for new spouse condition checkbox
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);


  const resetOutputs = () => {
    setCalculationResult(null);
    setError(null);
    setWarning(null);
  };

  const handleMonthlySalaryChange = useCallback((index: number, value: string) => {
    setMonthlySalaries(prevSalaries => {
      const newSalaries = [...prevSalaries];
      newSalaries[index] = value;
      return newSalaries;
    });
    resetOutputs();
  }, []);

  const handleLeaveStartDateChange = useCallback((value: string) => {
    setLeaveStartDate(value);
    resetOutputs();
  }, []);

  const handleLeaveEndDateChange = useCallback((value: string) => {
    setLeaveEndDate(value);
    resetOutputs();
  }, []);

  const handlePwasgApplicationChange = useCallback((isChecked: boolean) => {
    setApplyPostpartumSupportGrant(isChecked);
    if (!isChecked) { // If PWASG is not applied, reset spouse condition
      setSpouseMeetsPwasgConditions(false);
    }
    resetOutputs();
  }, []);

  const handleSpousePwasgConditionChange = useCallback((isChecked: boolean) => {
    setSpouseMeetsPwasgConditions(isChecked);
    resetOutputs();
  }, []);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetOutputs(); // Clear previous errors/results/warnings

    const parsedSalaries: number[] = [];
    for (let i = 0; i < MONTHS_FOR_AVERAGE; i++) {
      const salaryStr = monthlySalaries[i];
      if (salaryStr === '' || isNaN(parseFloat(salaryStr)) || parseFloat(salaryStr) < 0) {
        setError(`有効な給与額を${MONTHS_FOR_AVERAGE}ヶ月分すべて入力してください（${i + 1}ヶ月目が未入力または無効です）。`);
        return;
      }
      parsedSalaries.push(parseFloat(salaryStr));
    }

    const totalSalary = parsedSalaries.reduce((sum, s) => sum + s, 0);
    const averageMonthlySalary = totalSalary / MONTHS_FOR_AVERAGE;

    if (averageMonthlySalary <= 0) {
      setError('平均月給が0以下です。有効な給与額を入力してください。');
      return;
    }

    if (!leaveStartDate || !leaveEndDate) {
      setError('育休開始日と終了日を両方入力してください。');
      return;
    }

    const startDateObj = new Date(leaveStartDate);
    const endDateObj = new Date(leaveEndDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      setError('日付の形式が正しくありません。');
      return;
    }
    
    if (startDateObj >= endDateObj) {
      setError('育休終了日は開始日より後の日付にしてください。');
      return;
    }
    
    // Calculate total leave days for PWASG condition check
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const totalLeaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

    if (applyPostpartumSupportGrant && totalLeaveDays < PWASG_APPLICANT_MIN_LEAVE_DAYS) {
      setWarning(
        `「${PWASG_NAME}」の申請には、少なくとも${PWASG_APPLICANT_MIN_LEAVE_DAYS}日間の休業が必要です。現在の指定期間は${totalLeaveDays}日間です。このため、${PWASG_NAME}は計算されません。`
      );
    }
     if (applyPostpartumSupportGrant && !spouseMeetsPwasgConditions) {
        const currentWarning = warning ? warning + "\n" : "";
        setWarning(currentWarning + `「${PWASG_NAME}」の申請には、配偶者の条件も満たす必要があります。配偶者条件がチェックされていないため、${PWASG_NAME}は計算されません。`);
    }


    const params: CalculationParams = {
      averageMonthlySalaryLast6Months: averageMonthlySalary,
      leaveStartDate: startDateObj,
      leaveEndDate: endDateObj,
      individualMonthlySalaries: parsedSalaries,
      applyPostpartumSupportGrant: applyPostpartumSupportGrant,
      spouseMeetsPwasgConditions: spouseMeetsPwasgConditions,
    };

    try {
      const result = calculateChildcareLeaveBenefits(params);
      setCalculationResult(result);
    } catch (e) {
      if (e instanceof Error) {
        setError(`計算エラー: ${e.message}`);
      } else {
        setError('不明なエラーが発生しました。');
      }
    }
  }, [monthlySalaries, leaveStartDate, leaveEndDate, applyPostpartumSupportGrant, spouseMeetsPwasgConditions, warning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <svg className="mx-auto mb-4 h-20 w-auto text-indigo-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v.008c0 .031.003.061.008.09A5.252 5.252 0 0115 5.25H16.5a.75.75 0 01.75.75V10.5a.75.75 0 01-.75.75h-1.519a5.25 5.25 0 01-5.973 3.98L8.08 16.153a.75.75 0 01-1.202-.865l.87-2.428A5.232 5.232 0 019.008 10.5H6.75a.75.75 0 01-.75-.75V5.25zm2.25 2.25a.75.75 0 000 1.5H15a.75.75 0 000-1.5H9z" clipRule="evenodd" />
             <path d="M3 9.75a.75.75 0 01.75-.75H6v1.5H3.75a.75.75 0 01-.75-.75zM3.75 12a.75.75 0 000 1.5H6v-1.5H3.75zM3 14.25a.75.75 0 01.75-.75H6v1.5H3.75a.75.75 0 01-.75-.75zM17.25 9a.75.75 0 000 1.5h2.25a.75.75 0 000-1.5h-2.25zM18 11.25a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18.75a.75.75 0 01-.75-.75zM17.25 13.5a.75.75 0 000 1.5h2.25a.75.75 0 000-1.5h-2.25z" />
             <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25H3a.75.75 0 000 1.5h3.75A5.25 5.25 0 0012 13.5h.008c.03.001.06.002.092.003l.012.001.008.001h.001a5.25 5.25 0 005.13-4.526H21a.75.75 0 000-1.5h-3.75a5.25 5.25 0 00-5.25-5.25V1.5zm0 1.5v-.001A3.75 3.75 0 0115.75 6.75H8.25A3.75 3.75 0 0112 3z" clipRule="evenodd" />
          </svg>
          <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">
            育児休業給付金 計算機
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            2025年4月施行予定の「出生後休業支援給付金」にも対応。受給可能な育児休業関連給付の概算額を計算します。
          </p>
        </header>

        <main className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <LeavePeriodInput
              startDate={leaveStartDate}
              endDate={leaveEndDate}
              onStartDateChange={handleLeaveStartDateChange}
              onEndDateChange={handleLeaveEndDateChange}
            />
            <MonthlySalariesInput
              leaveStartDateString={leaveStartDate}
              monthlySalaries={monthlySalaries}
              onChange={handleMonthlySalaryChange}
            />
            
            <div className="space-y-4">
              <PostpartumSupportGrantCheckbox 
                isChecked={applyPostpartumSupportGrant}
                onChange={handlePwasgApplicationChange}
              />
              <SpousePwasgConditionCheckbox
                isChecked={spouseMeetsPwasgConditions}
                onChange={handleSpousePwasgConditionChange}
                isDisabled={!applyPostpartumSupportGrant} // Disable if PWASG application is not checked
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
              >
                計算する
              </button>
            </div>
          </form>

          {error && (
            <div role="alert" className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm">
              <h3 className="font-bold">エラー</h3>
              <p className="whitespace-pre-line">{error}</p>
            </div>
          )}
          
          {warning && (
            <div role="alert" className="mt-8 p-4 bg-amber-100 border border-amber-400 text-amber-700 rounded-md shadow-sm">
              <h3 className="font-bold">留意事項</h3>
              <p className="whitespace-pre-line">{warning}</p>
            </div>
          )}

          {calculationResult && !error && (
            <CalculationResultDisplay result={calculationResult} />
          )}
          
          <div className="mt-10 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center whitespace-pre-line">
              {DISCLAIMER_TEXT}
            </p>
          </div>
        </main>
        
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} 育児休業給付金計算機. All rights reserved (conceptually).</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
