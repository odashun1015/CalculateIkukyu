import React from 'react';
import { PWASG_SPOUSE_CONDITION_CHECKBOX_LABEL, PWASG_SPOUSE_CONDITION_DESCRIPTION_TEXT, PWASG_APPLICATION_CHECKBOX_LABEL } from '../constants';

interface SpousePwasgConditionCheckboxProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  isDisabled?: boolean;
}

export const SpousePwasgConditionCheckbox: React.FC<SpousePwasgConditionCheckboxProps> = ({
  isChecked,
  onChange,
  isDisabled = false,
}) => {
  return (
    <div className={`space-y-3 p-4 border rounded-lg ${isDisabled ? 'bg-slate-100 opacity-70' : 'border-sky-200 bg-sky-50'}`}>
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id="spouse-pwasg-condition-checkbox"
            name="spouse-pwasg-condition-checkbox"
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={isDisabled}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby="spouse-pwasg-condition-description"
          />
        </div>
        <div className="ml-3 text-base leading-6">
          <label htmlFor="spouse-pwasg-condition-checkbox" className={`font-medium ${isDisabled ? 'text-slate-500' : 'text-slate-800'}`}>
            {PWASG_SPOUSE_CONDITION_CHECKBOX_LABEL}
          </label>
        </div>
      </div>
      {PWASG_SPOUSE_CONDITION_DESCRIPTION_TEXT && (
         <p id="spouse-pwasg-condition-description" className={`text-sm ${isDisabled ? 'text-slate-400' : 'text-slate-600'} whitespace-pre-line`}>
           {PWASG_SPOUSE_CONDITION_DESCRIPTION_TEXT}
         </p>
      )}
       {isDisabled && (
        <p className="text-xs text-amber-700 mt-1">
          ※ 「{PWASG_APPLICATION_CHECKBOX_LABEL}」にチェックを入れると選択可能になります。
        </p>
      )}
    </div>
  );
};