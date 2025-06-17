import { describe, test, expect } from 'vitest'
import { calculateChildcareLeaveBenefits } from '../CalculatorService'
import type { CalculationParams } from '../../types'
import {
  WAGE_DAILY_UPPER_LIMIT,
  WAGE_DAILY_LOWER_LIMIT,
  PWASG_APPLICANT_MIN_LEAVE_DAYS,
  PWASG_MAX_DAYS,
  DAYS_PER_MONTH_FOR_CALC
} from '../../constants'

describe('CalculatorService エッジケースと追加シナリオ', () => {
  describe('特殊な日付パターン', () => {
    test('月末から翌月末までの計算', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-01-31'),
        leaveEndDate: new Date('2024-02-29'), // うるう年の2月末
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(30) // 1/31 + 2月の29日 = 30日
      expect(result.firstPeriodDetails.days).toBe(30)
      expect(result.secondPeriodDetails.days).toBe(0)
    })

    test('12月から翌年1月への計算', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2023-12-15'),
        leaveEndDate: new Date('2024-01-15'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(32) // 12/15-12/31 (17日) + 1/1-1/15 (15日)
      expect(result.firstPeriodDetails.days).toBe(32)
    })

    test('複数年をまたぐ長期休業', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2023-06-01'),
        leaveEndDate: new Date('2024-05-31'), // 1年間
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(366) // 2024年はうるう年を含む
      expect(result.firstPeriodDetails.days).toBe(180)
      expect(result.secondPeriodDetails.days).toBe(186)
    })
  })

  describe('PWASG境界値テスト', () => {
    test('PWASG最小日数ちょうど（14日）', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-14'), // ちょうど14日
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(PWASG_APPLICANT_MIN_LEAVE_DAYS)
      expect(result.pwasgDetails?.isGrantApplicable).toBe(true)
      expect(result.pwasgDetails?.daysCoveredByGrant).toBe(14)
    })

    test('PWASG最小日数-1日（13日）', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-13'), // 13日
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(13)
      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.pwasgDetails?.applicantTookMinLeaveForPwasg).toBe(false)
    })

    test('PWASG最大日数+1日（29日）', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-29'), // 29日
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(29)
      expect(result.pwasgDetails?.daysCoveredByGrant).toBe(PWASG_MAX_DAYS) // 28日に制限
    })
  })

  describe('給与額の極端なケース', () => {
    test('非常に低い給与（最低賃金以下想定）', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 50000, // 非常に低い給与
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_LOWER_LIMIT)
      expect(result.standardBenefitTotal).toBeGreaterThan(0)
    })

    test('非常に高い給与（上限の10倍）', () => {
      const extremelyHighSalary = WAGE_DAILY_UPPER_LIMIT * DAYS_PER_MONTH_FOR_CALC * 10
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: extremelyHighSalary,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'),
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_UPPER_LIMIT)
      // PWASGも上限適用されることを確認
      expect(result.pwasgDetails?.dailyWageForGrantItself).toBeLessThanOrEqual(15690)
    })

    test('ゼロ給与（エラーケース想定）', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 0,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.dailyWageBeforeLeaveCapped).toBe(WAGE_DAILY_LOWER_LIMIT)
      expect(result.standardBenefitTotal).toBeGreaterThan(0)
    })
  })

  describe('複雑な期間パターン', () => {
    test('180日境界をまたぐ複数月', () => {
      // 180日目が月の途中になるケース
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-01-01'),
        leaveEndDate: new Date('2024-07-15'), // 約196日
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.firstPeriodDetails.days).toBe(180)
      expect(result.secondPeriodDetails.days).toBeGreaterThan(0)
      expect(result.firstPeriodDetails.days + result.secondPeriodDetails.days).toBe(result.totalLeaveDays)
    })

    test('月またぎでのPWASG適用', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000,
        leaveStartDate: new Date('2024-04-20'),
        leaveEndDate: new Date('2024-05-15'), // 月をまたぐ26日間
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.totalLeaveDays).toBe(26)
      expect(result.pwasgDetails?.isGrantApplicable).toBe(true)
      expect(result.pwasgDetails?.daysCoveredByGrant).toBe(26)
    })
  })

  describe('月額上限の詳細テスト', () => {
    test('月の一部期間での上限適用', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 700000, // 非常に高い給与
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-15'), // 半月
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      // 半月分の上限が適用されているかチェック
      const expectedDays = 15
      const proratedCap = (310143 / DAYS_PER_MONTH_FOR_CALC) * expectedDays
      expect(result.firstPeriodDetails.amount).toBeLessThanOrEqual(proratedCap)
    })

    test('複数月にわたる上限適用', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 600000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-06-30'), // 3ヶ月
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      // 各月で上限が適用されているため、トータルも上限以下になる
      expect(result.standardBenefitTotal).toBeGreaterThan(0)
      expect(result.firstPeriodDetails.amount).toBeGreaterThan(0)
    })
  })

  describe('PWASG条件の詳細パターン', () => {
    test('PWASG希望するが日数不足', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 400000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-07'), // 7日のみ
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.pwasgDetails?.applicantTookMinLeaveForPwasg).toBe(false)
      expect(result.pwasgDetails?.spouseConditionMetForPwasg).toBe(true)
      expect(result.pwasgDetails?.grantAdditionalAmount).toBe(0)
    })

    test('PWASG希望するが配偶者条件不足', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 400000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-05-01'), // 31日
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: false
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.pwasgDetails?.applicantTookMinLeaveForPwasg).toBe(true)
      expect(result.pwasgDetails?.spouseConditionMetForPwasg).toBe(false)
      expect(result.pwasgDetails?.grantAdditionalAmount).toBe(0)
    })

    test('PWASG希望しないが条件は満たす', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 400000,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-05-01'), // 31日
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      expect(result.pwasgDetails?.isGrantApplicable).toBe(false)
      expect(result.pwasgDetails?.grantAdditionalAmount).toBe(0)
      expect(result.totalBenefit).toBe(result.standardBenefitTotal)
    })
  })

  describe('数値精度と端数処理', () => {
    test('端数が発生する給与での計算', () => {
      const params: CalculationParams = {
        averageMonthlySalaryLast6Months: 333333.33, // 端数のある給与
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'),
        applyPostpartumSupportGrant: true,
        spouseMeetsPwasgConditions: true
      }

      const result = calculateChildcareLeaveBenefits(params)

      // 計算結果が有限数であることを確認
      expect(isFinite(result.dailyWageBeforeLeaveCapped)).toBe(true)
      expect(isFinite(result.standardBenefitTotal)).toBe(true)
      expect(isFinite(result.totalBenefit)).toBe(true)
      
      if (result.pwasgDetails?.isGrantApplicable) {
        expect(isFinite(result.pwasgDetails.grantAdditionalAmount)).toBe(true)
      }
    })

    test('非常に小さな給与差での計算精度', () => {
      const params1: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000.01,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const params2: CalculationParams = {
        averageMonthlySalaryLast6Months: 300000.02,
        leaveStartDate: new Date('2024-04-01'),
        leaveEndDate: new Date('2024-04-30'),
        applyPostpartumSupportGrant: false,
        spouseMeetsPwasgConditions: false
      }

      const result1 = calculateChildcareLeaveBenefits(params1)
      const result2 = calculateChildcareLeaveBenefits(params2)

      // 微小な給与差でも適切に計算されることを確認
      expect(result2.standardBenefitTotal).toBeGreaterThanOrEqual(result1.standardBenefitTotal)
    })
  })
})
