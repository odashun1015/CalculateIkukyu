export interface CalculationParams {
  averageMonthlySalaryLast6Months: number;
  leaveStartDate: Date;
  leaveEndDate: Date;
  individualMonthlySalaries?: number[];
  applyPostpartumSupportGrant: boolean; // User wishes to apply for PWASG
  spouseMeetsPwasgConditions: boolean; // Spouse meets PWASG conditions or is exempt
}

export interface PeriodDetail {
  days: number;
  amount: number; // Capped amount for this period (either 67% or 50% part)
  rawAmount: number; // Amount before monthly capping for this period
}

export interface PwasgDetails {
  isGrantApplicable: boolean; // True if all conditions for PWASG are met and it's calculated
  applicantTookMinLeaveForPwasg: boolean; // Applicant's own leave is >= PWASG_APPLICANT_MIN_LEAVE_DAYS
  spouseConditionMetForPwasg: boolean; // From input: params.spouseMeetsPwasgConditions
  
  daysCoveredByGrant: number; // The number of days (up to PWASG_MAX_DAYS) the 13% grant applies to
  dailyWageForGrantItself: number; // The daily wage amount used for the 13% calc (capped at PWASG_WAGE_DAILY_UPPER_LIMIT)
  grantAdditionalAmount: number; // The total 13% monetary amount (this is the add-on)
  grantAdditionalRate: number; // Should be PWASG_ADDITIONAL_RATE (0.13)

  // For display purposes, info about the base 67% benefit during these grant-covered days
  baseBenefitRateDuringGrantDays: number; // Should be BENEFIT_RATE_FIRST_PERIOD (0.67)
  dailyWageForBaseBenefitDuringGrantDays: number; // Daily wage for 67% part (capped at WAGE_DAILY_UPPER_LIMIT)
  
  // Note: The actual monetary amount for the 67% part during these days is part of firstPeriodDetails.amount,
  // which is subject to overall monthly capping for the standard benefit.
  // Displaying a separate "baseBenefitAmountForGrantDays_raw" might be complex due to interaction with monthly capping.
  // It's simpler to state that the 13% is an add-on to the standard calculated benefit.
}

export interface CalculationResult {
  totalBenefit: number; // Includes standard benefit (67%/50% capped) + PWASG additional amount if applicable
  standardBenefitTotal: number; // The total from 67%/50% periods after their own capping, before PWASG.
  dailyWageBeforeLeaveCapped: number; // Used for standard 67%/50% benefit calculation (capped at WAGE_DAILY_UPPER_LIMIT)
  
  firstPeriodDetails: PeriodDetail; // Details for the standard 67% part
  secondPeriodDetails: PeriodDetail; // Details for the standard 50% part
  
  totalLeaveDays: number;
  calculationParams: CalculationParams;
  pwasgDetails?: PwasgDetails; // Details of the Postpartum Work Absence Support Grant (13% add-on)
}

// Previous PostpartumSupportGrantDetails, now superseded by PwasgDetails
// export interface PostpartumSupportGrantDetails {
//   days: number;
//   amount: number;
//   rate: number;
//   isCalculated: boolean;
// }
