import type { CalculationParams, CalculationResult, PeriodDetail, PwasgDetails } from '../types';
import {
  WAGE_DAILY_LOWER_LIMIT,
  WAGE_DAILY_UPPER_LIMIT, // Standard cap for 67%/50% benefit
  BENEFIT_RATE_FIRST_PERIOD,
  BENEFIT_RATE_SECOND_PERIOD,
  DAYS_IN_FIRST_PERIOD_THRESHOLD,
  MONTHLY_CAP_FIRST_PERIOD_RATE,
  MONTHLY_CAP_SECOND_PERIOD_RATE,
  DAYS_PER_MONTH_FOR_CALC,
  PWASG_MAX_DAYS,
  PWASG_ADDITIONAL_RATE,
  PWASG_WAGE_DAILY_UPPER_LIMIT, // Specific cap for the 13% PWASG calculation
  PWASG_APPLICANT_MIN_LEAVE_DAYS,
} from '../constants';

function getDaysInCalendarMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function differenceInDaysInclusive(dateLeft: Date, dateRight: Date): number {
    const utc1 = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate());
    const utc2 = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1;
}


export const calculateChildcareLeaveBenefits = (params: CalculationParams): CalculationResult => {
  const { 
    averageMonthlySalaryLast6Months, 
    leaveStartDate, 
    leaveEndDate, 
    applyPostpartumSupportGrant, // User's wish to apply for PWASG
    spouseMeetsPwasgConditions   // Spouse condition for PWASG
  } = params;

  // --- 1. Calculate Daily Wage for Standard Benefit (67%/50%) ---
  const dailyWageBase = averageMonthlySalaryLast6Months / DAYS_PER_MONTH_FOR_CALC;
  const dailyWageForStandardBenefit = Math.max(
    WAGE_DAILY_LOWER_LIMIT,
    Math.min(dailyWageBase, WAGE_DAILY_UPPER_LIMIT) // Uses standard upper limit
  );

  // --- 2. Calculate Standard Childcare Leave Benefit (67%/50% with monthly caps) ---
  let standardBenefitTotal = 0;
  const firstPeriodDetails: PeriodDetail = { days: 0, amount: 0, rawAmount: 0 };
  const secondPeriodDetails: PeriodDetail = { days: 0, amount: 0, rawAmount: 0 };
  
  const totalLeaveDaysOverall = differenceInDaysInclusive(leaveStartDate, leaveEndDate);

  let currentDate = new Date(leaveStartDate.getFullYear(), leaveStartDate.getMonth(), leaveStartDate.getDate());
  const finalEndDate = new Date(leaveEndDate.getFullYear(), leaveEndDate.getMonth(), leaveEndDate.getDate());

  while (currentDate <= finalEndDate) {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, getDaysInCalendarMonth(currentYear, currentMonth));

    const monthLeaveStartDate = currentDate > firstDayOfMonth ? currentDate : firstDayOfMonth;
    const monthLeaveEndDate = finalEndDate < lastDayOfMonth ? finalEndDate : lastDayOfMonth;
    
    let daysInMonthCoveredByLeave = 0;
    if (monthLeaveStartDate <= monthLeaveEndDate) {
         daysInMonthCoveredByLeave = differenceInDaysInclusive(monthLeaveStartDate, monthLeaveEndDate);
    } else { 
        currentDate = addDays(firstDayOfMonth, getDaysInCalendarMonth(currentYear, currentMonth)); // Move to next month
        continue;
    }

    let rawBenefitThisMonthStandard = 0;
    let daysInFirstPeriodThisMonth = 0;
    let daysInSecondPeriodThisMonth = 0;
    let monthContainsFirstPeriodDays = false;
    
    let tempDateForOverallDayCounting = new Date(leaveStartDate.getTime());
    let overallDayAtMonthStart = 0;
    while(tempDateForOverallDayCounting < monthLeaveStartDate) {
        overallDayAtMonthStart++;
        tempDateForOverallDayCounting.setDate(tempDateForOverallDayCounting.getDate() + 1);
    }

    for (let i = 0; i < daysInMonthCoveredByLeave; i++) {
      const currentOverallLeaveDayNumber = overallDayAtMonthStart + i + 1;
      let dailyBenefitRateStandard: number;

      if (currentOverallLeaveDayNumber <= DAYS_IN_FIRST_PERIOD_THRESHOLD) {
        dailyBenefitRateStandard = BENEFIT_RATE_FIRST_PERIOD;
        daysInFirstPeriodThisMonth++;
        monthContainsFirstPeriodDays = true;
      } else {
        dailyBenefitRateStandard = BENEFIT_RATE_SECOND_PERIOD;
        daysInSecondPeriodThisMonth++;
      }
      rawBenefitThisMonthStandard += dailyWageForStandardBenefit * dailyBenefitRateStandard;
    }
    
    const applicableMonthlyCapStandard = monthContainsFirstPeriodDays
      ? MONTHLY_CAP_FIRST_PERIOD_RATE
      : MONTHLY_CAP_SECOND_PERIOD_RATE;
    
    const proratedMonthlyCapStandard = (applicableMonthlyCapStandard / DAYS_PER_MONTH_FOR_CALC) * daysInMonthCoveredByLeave;
    const cappedBenefitThisMonthStandard = Math.min(rawBenefitThisMonthStandard, proratedMonthlyCapStandard);
    
    standardBenefitTotal += cappedBenefitThisMonthStandard;

    if (rawBenefitThisMonthStandard > 0) {
        const firstPeriodPortionOfRaw = (dailyWageForStandardBenefit * BENEFIT_RATE_FIRST_PERIOD * daysInFirstPeriodThisMonth);
        const secondPeriodPortionOfRaw = (dailyWageForStandardBenefit * BENEFIT_RATE_SECOND_PERIOD * daysInSecondPeriodThisMonth);

        firstPeriodDetails.rawAmount += firstPeriodPortionOfRaw;
        secondPeriodDetails.rawAmount += secondPeriodPortionOfRaw;
        
        if (daysInFirstPeriodThisMonth > 0) {
          firstPeriodDetails.days += daysInFirstPeriodThisMonth;
          if (rawBenefitThisMonthStandard > 0) { // Avoid division by zero
            firstPeriodDetails.amount += (firstPeriodPortionOfRaw / rawBenefitThisMonthStandard) * cappedBenefitThisMonthStandard;
          }
        }
        if (daysInSecondPeriodThisMonth > 0) {
          secondPeriodDetails.days += daysInSecondPeriodThisMonth;
           if (rawBenefitThisMonthStandard > 0) { // Avoid division by zero
            secondPeriodDetails.amount += (secondPeriodPortionOfRaw / rawBenefitThisMonthStandard) * cappedBenefitThisMonthStandard;
           }
        }
    }
    currentDate = new Date(currentYear, currentMonth + 1, 1); // Move to the start of the next month
  }

  // --- 3. Calculate Postpartum Work Absence Support Grant (PWASG - 13% Add-on) ---
  let pwasgDetails: PwasgDetails = {
    isGrantApplicable: false,
    applicantTookMinLeaveForPwasg: totalLeaveDaysOverall >= PWASG_APPLICANT_MIN_LEAVE_DAYS,
    spouseConditionMetForPwasg: spouseMeetsPwasgConditions,
    daysCoveredByGrant: 0,
    dailyWageForGrantItself: 0,
    grantAdditionalAmount: 0,
    grantAdditionalRate: PWASG_ADDITIONAL_RATE,
    baseBenefitRateDuringGrantDays: BENEFIT_RATE_FIRST_PERIOD,
    dailyWageForBaseBenefitDuringGrantDays: dailyWageForStandardBenefit,
  };

  let totalBenefit = standardBenefitTotal; // Initialize with standard benefit

  if (applyPostpartumSupportGrant && pwasgDetails.applicantTookMinLeaveForPwasg && pwasgDetails.spouseConditionMetForPwasg) {
    pwasgDetails.isGrantApplicable = true;
    pwasgDetails.daysCoveredByGrant = Math.min(totalLeaveDaysOverall, PWASG_MAX_DAYS);
    
    // Daily wage for PWASG calculation uses its own upper cap
    const dailyWageForPwasgItselfCalc = Math.max(
      WAGE_DAILY_LOWER_LIMIT, // Assuming same lower limit applies
      Math.min(dailyWageBase, PWASG_WAGE_DAILY_UPPER_LIMIT)
    );
    pwasgDetails.dailyWageForGrantItself = dailyWageForPwasgItselfCalc;

    pwasgDetails.grantAdditionalAmount = 
      dailyWageForPwasgItselfCalc * pwasgDetails.daysCoveredByGrant * PWASG_ADDITIONAL_RATE;
    
    totalBenefit += pwasgDetails.grantAdditionalAmount; // Add PWASG to total
  } else {
    // Ensure values are explicit if not applicable, even if defaults are set
    pwasgDetails.isGrantApplicable = false;
    pwasgDetails.grantAdditionalAmount = 0;
  }

  return {
    totalBenefit,
    standardBenefitTotal,
    dailyWageBeforeLeaveCapped: dailyWageForStandardBenefit, // This is the one used for 67%/50%
    firstPeriodDetails,
    secondPeriodDetails,
    totalLeaveDays: totalLeaveDaysOverall,
    calculationParams: params,
    pwasgDetails,
  };
};
