import React from 'react';
import { PWASG_APPLICATION_CHECKBOX_LABEL, PWASG_CONDITIONS_TEXT } from '../constants';

interface PostpartumSupportGrantCheckboxProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

// This component now serves as the checkbox for applying for the new PWASG (13% add-on).
export const PostpartumSupportGrantCheckbox: React.FC<PostpartumSupportGrantCheckboxProps> = ({
  isChecked,
  onChange,
}) => {
  return (
    <div className="space-y-3 p-4 border border-sky-200 rounded-lg bg-sky-50">
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id="pwasg-application-checkbox"
            name="pwasg-application-checkbox"
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            aria-describedby="pwasg-conditions-description"
          />
        </div>
        <div className="ml-3 text-base leading-6">
          <label htmlFor="pwasg-application-checkbox" className="font-medium text-slate-800">
            {PWASG_APPLICATION_CHECKBOX_LABEL}
          </label>
        </div>
      </div>
      <p id="pwasg-conditions-description" className="text-sm text-slate-600 whitespace-pre-line">
        {PWASG_CONDITIONS_TEXT}
      </p>
    </div>
  );
};
