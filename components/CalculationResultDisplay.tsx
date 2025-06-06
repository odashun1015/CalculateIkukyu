import React from 'react';
import type { CalculationResult, PwasgDetails } from '../types';
import {
  BENEFIT_RATE_FIRST_PERIOD,
  BENEFIT_RATE_SECOND_PERIOD,
  MONTHLY_CAP_FIRST_PERIOD_RATE,
  MONTHLY_CAP_SECOND_PERIOD_RATE,
  WAGE_DAILY_UPPER_LIMIT, // Standard cap for 67%/50%
  WAGE_DAILY_LOWER_LIMIT,
  PWASG_NAME,
  PWASG_WAGE_DAILY_UPPER_LIMIT, // Specific cap for PWASG 13% part
  PWASG_APPLICANT_MIN_LEAVE_DAYS
} from '../constants';
import { getPreviousMonthLabels } from './MonthlySalariesInput';

interface CalculationResultDisplayProps {
  result: CalculationResult;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
};

const renderPwasgDetails = (pwasg: PwasgDetails | undefined, standardDailyWage: number) => {
  if (!pwasg || !pwasg.isGrantApplicable) {
    if (pwasg && pwasg.grantAdditionalAmount === 0 && 
        (pwasg.applicantTookMinLeaveForPwasg === false || pwasg.spouseConditionMetForPwasg === false) && 
        // only show if user intended to apply
        pwasg.applicantTookMinLeaveForPwasg !== undefined && pwasg.spouseConditionMetForPwasg !== undefined 
    ) {
      let reason = "";
      if (!pwasg.applicantTookMinLeaveForPwasg) {
        reason += `申請者の休業期間が${PWASG_APPLICANT_MIN_LEAVE_DAYS}日未満です。`;
      }
      if (!pwasg.spouseConditionMetForPwasg) {
        if (reason) reason += " ";
        reason += "配偶者の条件が満たされていません。";
      }
      return (
        <div className="mb-6 p-4 bg-amber-50 rounded-md border border-amber-200">
          <h3 className="text-lg font-semibold text-amber-800 mb-1">
            {PWASG_NAME}（上乗せ給付）について
          </h3>
          <p className="text-md text-amber-700">
            指定された条件（{reason}）のため、今回は{PWASG_NAME}は計算されませんでした。
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-teal-50 rounded-md border border-teal-200">
      <h3 className="text-lg font-semibold text-teal-800 mb-2">
        {PWASG_NAME}（上乗せ給付）
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-teal-700">対象となりうる日数:</p>
          <p className="text-md font-medium text-teal-600">{pwasg.daysCoveredByGrant}日間</p>
        </div>
        <div>
          <p className="text-teal-700">追加給付率:</p>
          <p className="text-md font-medium text-teal-600">{(pwasg.grantAdditionalRate * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-teal-700">この給付専用の計算賃金日額:</p>
          <p className="text-md font-medium text-teal-600">
            {formatCurrency(pwasg.dailyWageForGrantItself)}
            <span className="text-xs ml-1">(上限{formatCurrency(PWASG_WAGE_DAILY_UPPER_LIMIT)})</span>
          </p>
        </div>
        <div>
          <p className="text-teal-700">上乗せ給付額（概算）:</p>
          <p className="text-xl font-bold text-teal-600">{formatCurrency(pwasg.grantAdditionalAmount)}</p>
        </div>
      </div>
      <p className="text-xs text-teal-600 mt-2">
        ※ この金額は、通常の育児休業給付金（67%/50%）に<strong>加算</strong>されます。
        <br />
        ※ この期間の基本給付（67%部分）は、下の「最初の180日間」の給付額に含まれており、その計算には標準の賃金日額上限（{formatCurrency(WAGE_DAILY_UPPER_LIMIT)}）が適用されます。
      </p>
    </div>
  );
};


export const CalculationResultDisplay: React.FC<CalculationResultDisplayProps> = ({ result }) => {
  const {
    totalBenefit, // Now includes PWASG
    standardBenefitTotal, // Benefit from 67%/50% only, after their caps
    dailyWageBeforeLeaveCapped, // For standard 67%/50% benefit
    firstPeriodDetails,
    secondPeriodDetails,
    totalLeaveDays,
    calculationParams,
    pwasgDetails,
  } = result;

  const previousMonthLabels = calculationParams.leaveStartDate
    ? getPreviousMonthLabels(calculationParams.leaveStartDate.toISOString().split('T')[0], calculationParams.individualMonthlySalaries?.length || 0)
    : [];

  return (
    <div className="mt-10 p-6 bg-slate-50 rounded-lg shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-300">計算結果</h2>

      <div className="mb-8 p-6 bg-indigo-50 rounded-lg text-center">
        <p className="text-lg text-indigo-700 mb-1">受給見込み総額（概算）</p>
        <p className="text-4xl font-extrabold text-indigo-600">
          {formatCurrency(totalBenefit)}
        </p>
        {pwasgDetails && pwasgDetails.isGrantApplicable && pwasgDetails.grantAdditionalAmount > 0 && (
          <p className="text-sm text-indigo-500 mt-1">（{PWASG_NAME} {formatCurrency(pwasgDetails.grantAdditionalAmount)} を含む）</p>
        )}
      </div>

      {renderPwasgDetails(pwasgDetails, dailyWageBeforeLeaveCapped)}
      
      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 pt-4 border-t border-slate-200">
          育児休業給付金（基本部分）の内訳
        </h3>
        <p className="text-xs text-slate-500 mb-3">※ {PWASG_NAME}の上乗せ額は含まれません。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-sky-50 rounded-md border border-sky-200">
            <p className="font-medium text-sky-800">最初の180日間 ({(BENEFIT_RATE_FIRST_PERIOD * 100).toFixed(0)}%支給)</p>
            <p className="text-lg text-sky-700">{firstPeriodDetails.days}日間</p>
            <p className="text-xl font-semibold text-sky-600">{formatCurrency(firstPeriodDetails.amount)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
            <p className="font-medium text-purple-800">181日目以降 ({(BENEFIT_RATE_SECOND_PERIOD * 100).toFixed(0)}%支給)</p>
            <p className="text-lg text-purple-700">{secondPeriodDetails.days}日間</p>
            <p className="text-xl font-semibold text-purple-600">{formatCurrency(secondPeriodDetails.amount)}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">基本部分の合計（概算）: {formatCurrency(standardBenefitTotal)}</p>
        <p className="mt-1 text-sm text-slate-600">合計育休期間: {totalLeaveDays}日間</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 pt-4 border-t border-slate-200">計算の前提</h3>
        <dl className="space-y-2 text-sm text-slate-600">
          {calculationParams.individualMonthlySalaries && calculationParams.individualMonthlySalaries.length > 0 && (
            <>
              <dt className="font-medium text-slate-700">入力された各月の給与:</dt>
              {calculationParams.individualMonthlySalaries.map((salary, index) => (
                <div className="flex justify-between pl-4" key={index}>
                  <dt>{previousMonthLabels[index]?.label || `過去 ${index + 1}ヶ月前`}:</dt>
                  <dd className="font-medium text-slate-800">{formatCurrency(salary)}</dd>
                </div>
              ))}
            </>
          )}
          <div className="flex justify-between">
            <dt>計算された平均月給:</dt>
            <dd className="font-medium text-slate-800">{formatCurrency(calculationParams.averageMonthlySalaryLast6Months)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>基本給付の計算基礎となる賃金日額:</dt>
            <dd className="font-medium text-slate-800">
              {formatCurrency(calculationParams.averageMonthlySalaryLast6Months / 30)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>適用された基本給付の賃金日額:</dt>
            <dd className="font-medium text-slate-800">
              {formatCurrency(dailyWageBeforeLeaveCapped)}
              <span className="text-xs ml-1">
                (上限{formatCurrency(WAGE_DAILY_UPPER_LIMIT)}、下限{formatCurrency(WAGE_DAILY_LOWER_LIMIT)})
              </span>
            </dd>
          </div>
          <div className="flex justify-between">
             <dt>{PWASG_NAME}の申請希望:</dt>
             <dd className="font-medium text-slate-800">{calculationParams.applyPostpartumSupportGrant ? 'あり' : 'なし'}</dd>
           </div>
           {calculationParams.applyPostpartumSupportGrant && (
             <div className="flex justify-between">
               <dt>└ 配偶者の{PWASG_NAME}条件:</dt>
               <dd className="font-medium text-slate-800">{calculationParams.spouseMeetsPwasgConditions ? '満たす（または免除）' : '満たさない'}</dd>
             </div>
           )}
        </dl>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 pt-4 border-t border-slate-200">計算式（概要）</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 pl-2">
          <li>
            <strong>基本の休業開始時賃金日額 (A)</strong>:
            育休開始前6ヶ月間の賃金総額 ÷ 180日 (本計算機では 月給平均 ÷ 30日 で代用)。
            <br />
            上限{formatCurrency(WAGE_DAILY_UPPER_LIMIT)}、下限{formatCurrency(WAGE_DAILY_LOWER_LIMIT)}。あなたの適用額: {formatCurrency(dailyWageBeforeLeaveCapped)}。
          </li>
          <li>
            <strong>基本給付（最初の180日間）</strong>:
            (A) × {firstPeriodDetails.days}日 × {(BENEFIT_RATE_FIRST_PERIOD * 100).toFixed(0)}%
            = {formatCurrency(firstPeriodDetails.rawAmount)} (月額上限適用前)
          </li>
          <li>
            <strong>基本給付（181日目以降）</strong>:
            (A) × {secondPeriodDetails.days}日 × {(BENEFIT_RATE_SECOND_PERIOD * 100).toFixed(0)}%
            = {formatCurrency(secondPeriodDetails.rawAmount)} (月額上限適用前)
          </li>
          {pwasgDetails && pwasgDetails.isGrantApplicable && pwasgDetails.grantAdditionalAmount > 0 && (
            <li>
              <strong>{PWASG_NAME}（上乗せ分）</strong>:
              <br />
              専用計算賃金日額 (B) × {pwasgDetails.daysCoveredByGrant}日 × {(pwasgDetails.grantAdditionalRate * 100).toFixed(0)}%
              = {formatCurrency(pwasgDetails.grantAdditionalAmount)}
              <br />
              <span className="text-xs">専用計算賃金日額(B): 基本賃金日額に対し上限{formatCurrency(PWASG_WAGE_DAILY_UPPER_LIMIT)}を適用。あなたの適用額: {formatCurrency(pwasgDetails.dailyWageForGrantItself)}。</span>
              <br />
              <span className="text-xs">この金額は、上記基本給付に<strong>加算</strong>されます。</span>
            </li>
          )}
          <li>
            <strong>基本給付の支給上限額（月額）</strong>:
            <ul className="list-disc list-inside pl-4">
              <li>最初の180日を含む支給単位期間: {formatCurrency(MONTHLY_CAP_FIRST_PERIOD_RATE)} まで</li>
              <li>181日目以降のみの支給単位期間: {formatCurrency(MONTHLY_CAP_SECOND_PERIOD_RATE)} まで</li>
            </ul>
            <span className="text-xs">※ 月の途中で開始・終了する場合等は日数に応じて調整。本計算では考慮済。これは基本給付部分に適用されます。</span>
          </li>
           <li>
            <strong>最終的な支給総額</strong>: 基本給付（月額上限適用後）と、適用される場合の{PWASG_NAME}（上乗せ分）の合計です。
          </li>
        </ul>
      </div>
    </div>
  );
};
