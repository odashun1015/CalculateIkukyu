import { describe, test, expect } from 'vitest'
import { calculateChildcareLeaveBenefits } from '../CalculatorService'
import type { CalculationParams } from '../../types'
import {
  WAGE_DAILY_UPPER_LIMIT,
  WAGE_DAILY_LOWER_LIMIT,
  BENEFIT_RATE_FIRST_PERIOD,
  BENEFIT_RATE_SECOND_PERIOD,
  DAYS_IN_FIRST_PERIOD_THRESHOLD,
  MONTHLY_CAP_FIRST_PERIOD_RATE,
  MONTHLY_CAP_SECOND_PERIOD_RATE,
  PWASG_MAX_DAYS,
  PWASG_APPLICANT_MIN_LEAVE_DAYS,
  PWASG_ADDITIONAL_RATE,
  PWASG_WAGE_DAILY_UPPER_LIMIT,
  DAYS_PER_MONTH_FOR_CALC
} from '../../constants'

describe('CalculatorService', () => {
  describe('基本的な育児休業給付金計算', () => {
    test('標準的なケース: 6ヶ月（180日）の休業', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-09-30'), // 約180日
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      // 賃金日額計算: 300000 / 30 = 10000円（上限・下限内）
      expect(result.dailyWageBeforeLeaveCapped).toBe(10000)
      
      // 総休業日数確認
      expect(result.totalLeaveDays).toBe(183) // 4/1-9/30の日数
      
      // 最初の期間は全日数（180日以下なので）
      expect(result.firstPeriodDetails.days).toBe(180)
      expect(result.secondPeriodDetails.days).toBe(3) // 残り3日
      
      // 基本給付額計算
      const expectedFirstPeriodRaw = 10000 * 180 * BENEFIT_RATE_FIRST_PERIOD // 1,206,000円
      const expectedSecondPeriodRaw = 10000 * 3 * BENEFIT_RATE_SECOND_PERIOD // 15,000円
      
      expect(result.firstPeriodDetails.rawAmount).toBe(expectedFirstPeriodRaw)
      expect(result.secondPeriodDetails.rawAmount).toBe(expectedSecondPeriodRaw)
      
      // PWASGが適用されていないことを確認
      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.totalBenefit).toBe(result.standardBenefitTotal)
    })

    test('短期休業: 30日間のみ', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 250000,
        leaveStartDate: new Date('2024-05-01'),
        leaveEndDate: new Date('2024-05-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(30)
      expect(result.firstPeriodDetails.days).toBe(30) // 全て67%期間
      expect(result.secondPeriodDetails.days).toBe(0) // 50%期間なし
      
      const expectedDailyWage = 250000 / DAYS_PER_MONTH_FOR_CALC // 8333.33...
      expect(result.dailyWageBeforeLeaveCapped).toBeCloseTo(expectedDailyWage, 2)
    })

    test('長期休業: 12ヶ月間', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 400000,
        leaveStartDate: new Date('2024-01-01'),
        leaveEndDate: new Date('2024-12-31'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(366) // 2024年はうるう年
      expect(result.firstPeriodDetails.days).toBe(DAYS_IN_FIRST_PERIOD_THRESHOLD) // 180日
      expect(result.secondPeriodDetails.days).toBe(366 - DAYS_IN_FIRST_PERIOD_THRESHOLD) // 186日
    })

    test('67%期間と50%期間をまたぐケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-01-01'),
        leaveEndDate: new Date('2024-08-31'), // 約240日
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.firstPeriodDetails.days).toBe(180)
      expect(result.secondPeriodDetails.days).toBeGreaterThan(0)
      expect(result.firstPeriodDetails.days + result.secondPeriodDetails.days).toBe(result.totalLeaveDays)
    })
  })

  describe('賃金日額の境界値テスト', () => {
    test('上限額を超える高給与のケース', () => {
      const highSalary = WAGE_DAILY_UPPER_LIMIT * DAYS_PER_MONTH_FOR_CALC + 100000 // 上限を超える給与
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: highSalary,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_UPPER_LIMIT)
    })

    test('下限額を下回る低給与のケース', () => {
      const lowSalary = WAGE_DAILY_LOWER_LIMIT * DAYS_PER_MONTH_FOR_CALC - 10000 // 下限を下回る給与
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: lowSalary,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_LOWER_LIMIT)
    })

    test('上限額ちょうどのケース', () => {
      const exactUpperSalary = WAGE_DAILY_UPPER_LIMIT * DAYS_PER_MONTH_FOR_CALC
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: exactUpperSalary,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_UPPER_LIMIT)
    })

    test('下限額ちょうどのケース', () => {
      const exactLowerSalary = WAGE_DAILY_LOWER_LIMIT * DAYS_PER_MONTH_FOR_CALC
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: exactLowerSalary,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_LOWER_LIMIT)
    })
  })

  describe('月額上限適用テスト', () => {
    test('月額上限に達するケース', () => {
      // 高給与で月額上限に達するケース
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 600000, // 高給与
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'), // 1ヶ月
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      // 上限適用されているかチェック（浮動小数点の精度を考慮）
      const dailyWage = result.dailyWageBeforeLeaveCapped
      const rawMonthlyBenefit = dailyWage * 30 * BENEFIT_RATE_FIRST_PERIOD
      
      if (rawMonthlyBenefit > MONTHLY_CAP_FIRST_PERIOD_RATE) {
        expect(result.firstPeriodDetails.amount).toBeCloseTo(MONTHLY_CAP_FIRST_PERIOD_RATE, 0)
      }
    })

    test('月の途中から開始するケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-15'), // 月の途中から
        leaveEndDate: new Date('2024-04-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(16) // 4/15-4/30
      expect(result.firstPeriodDetails.days).toBe(16)
      expect(result.secondPeriodDetails.days).toBe(0)
    })

    test('月の途中で終了するケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-15'), // 月の途中で終了
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(15) // 4/1-4/15
      expect(result.firstPeriodDetails.days).toBe(15)
    })
  })

  describe('PWASG（出生後休業支援給付金）計算テスト', () => {
    test('PWASG適用条件を満たすケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'), // 30日（最小条件を満たす）
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.isGrantApplicable).toBe(true)
      expect(result.pwasgDetails?.applicantTookMinLeaveForPwasg).toBe(true)
      expect(result.pwasgDetails?.spouseConditionMetForPwasg).toBe(true)
      expect(result.pwasgDetails?.daysCoveredByGrant).toBe(PWASG_MAX_DAYS)
      expect(result.pwasgDetails?.grantAdditionalRate).toBe(PWASG_ADDITIONAL_RATE)
      
      // PWASG給付額計算
      const baseDailyWage = 300000 / DAYS_PER_MONTH_FOR_CALC
      const pwasgDailyWage = Math.min(baseDailyWage, PWASG_WAGE_DAILY_UPPER_LIMIT)
      const expectedPwasgAmount = pwasgDailyWage * PWASG_MAX_DAYS * PWASG_ADDITIONAL_RATE
      
      expect(result.pwasgDetails?.grantAdditionalAmount).toBeCloseTo(expectedPwasgAmount, 2)
      expect(result.totalBenefit).toBe(result.standardBenefitTotal + (result.pwasgDetails?.grantAdditionalAmount || 0))
    })

    test('最小日数未満でPWASG適用されないケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-10'), // 10日（最小条件未満）
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBeLessThan(PWASG_APPLICANT_MIN_LEAVE_DAYS)
      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.pwasgDetails?.applicantTookMinLeaveForPwasg).toBe(false)
      expect(result.pwasgDetails?.grantAdditionalAmount).toBe(0)
      expect(result.totalBenefit).toBe(result.standardBenefitTotal)
    })

    test('配偶者条件を満たさないケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'), // 30日（最小条件を満たす）
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: false // 配偶者条件未満たし
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.pwasgDetails?.applicantTookMinLeaveForPwasg).toBe(true)
      expect(result.pwasgDetails?.spouseConditionMetForPwasg).toBe(false)
      expect(result.pwasgDetails?.grantAdditionalAmount).toBe(0)
    })

    test('PWASG最大日数（28日）のケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'), // 長期休業
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.isGrantApplicable).toBe(true)
      expect(result.pwasgDetails?.daysCoveredByGrant).toBe(PWASG_MAX_DAYS) // 最大28日
      expect(result.totalLeaveDays).toBeGreaterThan(PWASG_MAX_DAYS)
    })

    test('PWASG賃金日額上限適用テスト', () => {
      const highSalary = PWASG_WAGE_DAILY_UPPER_LIMIT * DAYS_PER_MONTH_FOR_CALC + 100000
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: highSalary,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'),
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.dailyWageForGrantItself).toBe(PWASG_WAGE_DAILY_UPPER_LIMIT)
    })

    test('PWASGを希望しないケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'),
        applyPostpartumSupportGrant: false, // PWASG希望なし
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.pwasgDetails?.grantAdditionalAmount).toBe(0)
      expect(result.totalBenefit).toBe(result.standardBenefitTotal)
    })
  })

  describe('複合シナリオテスト', () => {
    test('高給与 + PWASG適用 + 長期休業', () => {
      // WAGE_DAILY_UPPER_LIMIT (16860) * DAYS_PER_MONTH_FOR_CALC (30) = 505800
      // これより高い給与を設定して上限適用を確認
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 600000, // 上限を超える給与
        leaveStartDate: new Date('2024-01-01'),
        leaveEndDate: new Date('2024-12-31'),
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      // 高給与なので標準給付の賃金日額は上限適用
      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_UPPER_LIMIT)
      
      // PWASGは別の上限
      expect(result.pwasgDetails?.dailyWageForGrantItself).toBeLessThanOrEqual(PWASG_WAGE_DAILY_UPPER_LIMIT)
      
      // 両方とも適用される
      expect(result.pwasgDetails?.isGrantApplicable).toBe(true)
      expect(result.totalBenefit).toBeGreaterThan(result.standardBenefitTotal)
    })

    test('計算結果の整合性チェック', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 350000,
        leaveStartDate: new Date('2024-03-01'),
        leaveEndDate: new Date('2024-08-31'),
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      // 基本的な整合性チェック
      expect(result.totalLeaveDays).toBeGreaterThan(0)
      expect(result.standardBenefitTotal).toBeGreaterThan(0)
      expect(result.totalBenefit).toBeGreaterThanOrEqual(result.standardBenefitTotal)
      expect(result.firstPeriodDetails.days + result.secondPeriodDetails.days).toBe(result.totalLeaveDays)
      expect(result.firstPeriodDetails.amount + result.secondPeriodDetails.amount).toBeCloseTo(result.standardBenefitTotal, 2)
      
      // パラメータの保存確認
      expect(result.calculationParams).toEqual(params)
    })
  })

  describe('エッジケースと境界値テスト', () => {
    test('1日だけの休業', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-01'), // 同じ日
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(1)
      expect(result.firstPeriodDetails.days).toBe(1)
      expect(result.secondPeriodDetails.days).toBe(0)
    })

    test('180日ちょうどの休業', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-01-01'),
        leaveEndDate: new Date('2024-06-28'), // ちょうど180日
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(180)
      expect(result.firstPeriodDetails.days).toBe(180)
      expect(result.secondPeriodDetails.days).toBe(0)
    })

    test('181日の休業（境界値超え）', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-01-01'),
        leaveEndDate: new Date('2024-06-29'), // 181日
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(181)
      expect(result.firstPeriodDetails.days).toBe(180)
      expect(result.secondPeriodDetails.days).toBe(1)
    })

    test('うるう年をまたぐケース', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-02-01'), // 2024年はうるう年
        leaveEndDate: new Date('2024-02-29'), // 2月29日まで
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(29) // うるう年の2月は29日
    })
  })
})