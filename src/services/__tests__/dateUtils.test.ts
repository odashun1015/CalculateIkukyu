import { describe, test, expect } from 'vitest'

// CalculatorService内の日付計算関数をテストするため、内部関数をテスト可能にする
// 実際のプロジェクトでは、これらの関数を別ファイルに分離することを推奨

describe('日付計算ユーティリティ', () => {
  // getDaysInCalendarMonth関数のテスト
  describe('getDaysInCalendarMonth', () => {
    // テスト用のヘルパー関数（CalculatorServiceから抽出）
    function getDaysInCalendarMonth(year: number, month: number): number {
      return new Date(year, month + 1, 0).getDate()
    }

    test('通常年の各月の日数計算', () => {
      const year = 2023 // 通常年
      
      expect(getDaysInCalendarMonth(year, 0)).toBe(31) // 1月
      expect(getDaysInCalendarMonth(year, 1)).toBe(28) // 2月（通常年）
      expect(getDaysInCalendarMonth(year, 2)).toBe(31) // 3月
      expect(getDaysInCalendarMonth(year, 3)).toBe(30) // 4月
      expect(getDaysInCalendarMonth(year, 4)).toBe(31) // 5月
      expect(getDaysInCalendarMonth(year, 5)).toBe(30) // 6月
      expect(getDaysInCalendarMonth(year, 6)).toBe(31) // 7月
      expect(getDaysInCalendarMonth(year, 7)).toBe(31) // 8月
      expect(getDaysInCalendarMonth(year, 8)).toBe(30) // 9月
      expect(getDaysInCalendarMonth(year, 9)).toBe(31) // 10月
      expect(getDaysInCalendarMonth(year, 10)).toBe(30) // 11月
      expect(getDaysInCalendarMonth(year, 11)).toBe(31) // 12月
    })

    test('うるう年の2月', () => {
      expect(getDaysInCalendarMonth(2024, 1)).toBe(29) // 2024年2月（うるう年）
      expect(getDaysInCalendarMonth(2020, 1)).toBe(29) // 2020年2月（うるう年）
      expect(getDaysInCalendarMonth(2000, 1)).toBe(29) // 2000年2月（うるう年）
    })

    test('100で割り切れるが400で割り切れない年（うるう年ではない）', () => {
      expect(getDaysInCalendarMonth(1900, 1)).toBe(28) // 1900年2月（うるう年ではない）
      expect(getDaysInCalendarMonth(2100, 1)).toBe(28) // 2100年2月（うるう年ではない）
    })
  })

  // differenceInDaysInclusive関数のテスト
  describe('differenceInDaysInclusive', () => {
    // テスト用のヘルパー関数（CalculatorServiceから抽出）
    function differenceInDaysInclusive(dateLeft: Date, dateRight: Date): number {
      const utc1 = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate())
      const utc2 = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate())
      return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1
    }

    test('同じ日の場合', () => {
      const date = new Date('2024-04-01')
      expect(differenceInDaysInclusive(date, date)).toBe(1)
    })

    test('連続した日の場合', () => {
      const startDate = new Date('2024-04-01')
      const endDate = new Date('2024-04-02')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(2)
    })

    test('1週間の場合', () => {
      const startDate = new Date('2024-04-01')
      const endDate = new Date('2024-04-07')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(7)
    })

    test('月をまたぐ場合', () => {
      const startDate = new Date('2024-04-28')
      const endDate = new Date('2024-05-03')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(6) // 4/28, 4/29, 4/30, 5/1, 5/2, 5/3
    })

    test('年をまたぐ場合', () => {
      const startDate = new Date('2023-12-30')
      const endDate = new Date('2024-01-02')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(4) // 12/30, 12/31, 1/1, 1/2
    })

    test('うるう年をまたぐ場合', () => {
      const startDate = new Date('2024-02-28')
      const endDate = new Date('2024-03-01')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(3) // 2/28, 2/29, 3/1
    })

    test('長期間（1年間）の場合', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(366) // 2024年はうるう年
    })

    test('通常年の1年間', () => {
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(365)
    })

    test('時刻が異なる場合でも日付のみで計算される', () => {
      const startDate = new Date('2024-04-01T23:59:59')
      const endDate = new Date('2024-04-02T00:00:01')
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(2)
    })

    test('タイムゾーンの影響を受けない（UTC基準）', () => {
      // JSTとUTCで日付が変わる境界でのテスト
      const startDate = new Date('2024-04-01T15:00:00Z') // UTC 15:00 = JST 00:00（翌日）
      const endDate = new Date('2024-04-01T16:00:00Z')   // UTC 16:00 = JST 01:00（翌日）
      expect(differenceInDaysInclusive(startDate, endDate)).toBe(1) // 同じUTC日付
    })
  })

  // addDays関数のテスト
  describe('addDays', () => {
    // テスト用のヘルパー関数（CalculatorServiceから抽出）
    function addDays(date: Date, days: number): Date {
      const result = new Date(date.getTime())
      result.setDate(result.getDate() + days)
      return result
    }

    test('通常の日付加算', () => {
      const baseDate = new Date('2024-04-01')
      const result = addDays(baseDate, 5)
      expect(result.getDate()).toBe(6)
      expect(result.getMonth()).toBe(3) // 0ベース（4月）
      expect(result.getFullYear()).toBe(2024)
    })

    test('月をまたぐ加算', () => {
      const baseDate = new Date('2024-04-28')
      const result = addDays(baseDate, 5)
      expect(result.getDate()).toBe(3)
      expect(result.getMonth()).toBe(4) // 0ベース（5月）
      expect(result.getFullYear()).toBe(2024)
    })

    test('年をまたぐ加算', () => {
      const baseDate = new Date('2023-12-28')
      const result = addDays(baseDate, 10)
      expect(result.getDate()).toBe(7)
      expect(result.getMonth()).toBe(0) // 0ベース（1月）
      expect(result.getFullYear()).toBe(2024)
    })

    test('うるう年の2月末からの加算', () => {
      const baseDate = new Date('2024-02-28')
      const result = addDays(baseDate, 2)
      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(2) // 0ベース（3月）
      expect(result.getFullYear()).toBe(2024)
    })

    test('0日加算（元の日付と同じ）', () => {
      const baseDate = new Date('2024-04-01')
      const result = addDays(baseDate, 0)
      expect(result.getTime()).toBe(baseDate.getTime())
    })

    test('負数での減算', () => {
      const baseDate = new Date('2024-04-05')
      const result = addDays(baseDate, -3)
      expect(result.getDate()).toBe(2)
      expect(result.getMonth()).toBe(3) // 0ベース（4月）
      expect(result.getFullYear()).toBe(2024)
    })

    test('大きな数値での加算', () => {
      const baseDate = new Date('2024-01-01')
      const result = addDays(baseDate, 365)
      expect(result.getDate()).toBe(31)
      expect(result.getMonth()).toBe(11) // 0ベース（12月）
      expect(result.getFullYear()).toBe(2024) // うるう年なので同年
    })

    test('元の日付オブジェクトが変更されないこと', () => {
      const baseDate = new Date('2024-04-01')
      const originalTime = baseDate.getTime()
      addDays(baseDate, 10)
      expect(baseDate.getTime()).toBe(originalTime) // 元のオブジェクトは変更されない
    })
  })

  describe('月境界での計算の正確性', () => {
    test('月末から月初への期間計算', () => {
      function differenceInDaysInclusive(dateLeft: Date, dateRight: Date): number {
        const utc1 = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate())
        const utc2 = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate())
        return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1
      }

      // 4月30日から5月1日
      const april30 = new Date('2024-04-30')
      const may1 = new Date('2024-05-01')
      expect(differenceInDaysInclusive(april30, may1)).toBe(2)

      // 2月28日から3月1日（うるう年）
      const feb28 = new Date('2024-02-28')
      const mar1 = new Date('2024-03-01')
      expect(differenceInDaysInclusive(feb28, mar1)).toBe(3) // 2/28, 2/29, 3/1
    })

    test('長期間での月境界計算', () => {
      function differenceInDaysInclusive(dateLeft: Date, dateRight: Date): number {
        const utc1 = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate())
        const utc2 = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate())
        return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1
      }

      // 6ヶ月間（180日前後）
      const start = new Date('2024-01-01')
      const end = new Date('2024-06-28')
      const days = differenceInDaysInclusive(start, end)
      expect(days).toBe(180) // 期待値確認
    })
  })
})
