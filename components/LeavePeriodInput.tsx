
import React from 'react';

interface LeavePeriodInputProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export const LeavePeriodInput: React.FC<LeavePeriodInputProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onStartDateChange(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onEndDateChange(event.target.value);
  };
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="leaveStartDate" className="block text-lg font-semibold text-slate-700">
          育児休業開始日
        </label>
        <input
          type="date"
          name="leaveStartDate"
          id="leaveStartDate"
          value={startDate}
          onChange={handleStartDateChange}
          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-base border-slate-300 rounded-md py-3 px-4"
          min={today} // Optional: prevent past dates for start
        />
      </div>
      <div>
        <label htmlFor="leaveEndDate" className="block text-lg font-semibold text-slate-700">
          育児休業終了日
        </label>
        <input
          type="date"
          name="leaveEndDate"
          id="leaveEndDate"
          value={endDate}
          onChange={handleEndDateChange}
          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-base border-slate-300 rounded-md py-3 px-4"
          min={startDate || today} // End date must be after start date
        />
      </div>
      <p className="mt-2 text-sm text-slate-500">
        育児休業を取得する期間を入力してください。
      </p>
    </div>
  );
};
