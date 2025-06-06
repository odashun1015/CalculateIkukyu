import React, { useMemo } from 'react';

interface MonthlySalariesInputProps {
  leaveStartDateString: string;
  monthlySalaries: string[];
  onChange: (index: number, value: string) => void;
}

const MONTHS_COUNT = 6;

// Helper function to get previous months' labels
export function getPreviousMonthLabels(leaveStartDateStr: string, count: number): { year: number, monthIndex: number, label: string }[] {
  if (!leaveStartDateStr) {
    // Create dummy labels if date is not set, to avoid errors during initial render if date is briefly invalid
    return Array(count).fill(null).map((_, i) => ({
        year: 0,
        monthIndex: 0,
        label: `Month ${count - i}`
    }));
  }
  
  const startDate = new Date(leaveStartDateStr);
  // Ensure we are working with a valid date object
  if (isNaN(startDate.getTime())) {
    return Array(count).fill(null).map((_, i) => ({
        year: 0,
        monthIndex: 0,
        label: `Month ${count - i} (Invalid Start Date)`
    }));
  }
  
  // Use the first day of the leave start month for consistent month arithmetic
  const firstDayOfLeaveStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  const months = [];
  for (let i = 1; i <= count; i++) {
    const targetMonthDate = new Date(firstDayOfLeaveStartMonth);
    targetMonthDate.setMonth(firstDayOfLeaveStartMonth.getMonth() - i);
    const year = targetMonthDate.getFullYear();
    const monthIndex = targetMonthDate.getMonth(); // 0-indexed
    months.push({
      year,
      monthIndex,
      label: `${year}年${monthIndex + 1}月`,
    });
  }
  return months; // [Month-1, Month-2, ..., Month-6]
}


export const MonthlySalariesInput: React.FC<MonthlySalariesInputProps> = ({
  leaveStartDateString,
  monthlySalaries,
  onChange,
}) => {
  const monthLabels = useMemo(() => {
    return getPreviousMonthLabels(leaveStartDateString, MONTHS_COUNT);
  }, [leaveStartDateString]);

  const handleSalaryChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, event.target.value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-700">
        育休開始前{MONTHS_COUNT}ヶ月間の各月給与（額面）
      </h3>
      <p className="text-sm text-slate-500">
        育児休業を開始する日を基点に、その直前の{MONTHS_COUNT}ヶ月間の各月の給与（税金や社会保険料が引かれる前の金額）を入力してください。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {monthLabels.map((month, index) => (
          <div key={index} className="space-y-1">
            <label htmlFor={`monthlySalary-${index}`} className="block text-sm font-medium text-slate-600">
              {month.label}の給与
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                name={`monthlySalary-${index}`}
                id={`monthlySalary-${index}`}
                value={monthlySalaries[index]}
                onChange={(e) => handleSalaryChange(index, e)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-base border-slate-300 rounded-md py-2 px-3 placeholder-slate-400"
                placeholder="例: 300000"
                min="0"
                aria-describedby={`monthly-salary-currency-${index}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-slate-500 sm:text-sm" id={`monthly-salary-currency-${index}`}>
                  円
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};