<template>
  <div class="result-display">
    <h2 class="result-title">計算結果</h2>

    <div class="result-summary">
      <div class="result-item">
        <div class="result-label">受給見込み総額（概算）</div>
        <div class="result-value">{{ formatCurrency(result.totalBenefit) }}</div>
        <div v-if="pwasgDetails && pwasgDetails.isGrantApplicable && pwasgDetails.grantAdditionalAmount > 0" 
             style="font-size: 0.875rem; margin-top: 0.25rem;">
          （{{ PWASG_NAME }} {{ formatCurrency(pwasgDetails.grantAdditionalAmount) }} を含む）
        </div>
      </div>
    </div>

    <!-- PWASG Details -->
    <div v-if="showPwasgNotApplicable" class="alert warning">
      <h3>{{ PWASG_NAME }}（上乗せ給付）について</h3>
      <p>指定された条件（{{ pwasgNotApplicableReason }}）のため、今回は{{ PWASG_NAME }}は計算されませんでした。</p>
    </div>

    <div v-if="pwasgDetails && pwasgDetails.isGrantApplicable" class="alert success">
      <h3>{{ PWASG_NAME }}（上乗せ給付）</h3>
      <div class="result-details">
        <div class="detail-section">
          <ul class="detail-list">
            <li>
              <span class="label">対象となりうる日数:</span>
              <span class="value">{{ pwasgDetails.daysCoveredByGrant }}日間</span>
            </li>
            <li>
              <span class="label">追加給付率:</span>
              <span class="value">{{ (pwasgDetails.grantAdditionalRate * 100).toFixed(0) }}%</span>
            </li>
            <li>
              <span class="label">この給付専用の計算賃金日額:</span>
              <span class="value">
                {{ formatCurrency(pwasgDetails.dailyWageForGrantItself) }}
                <span style="font-size: 0.75rem;">(上限{{ formatCurrency(PWASG_WAGE_DAILY_UPPER_LIMIT) }})</span>
              </span>
            </li>
            <li>
              <span class="label">上乗せ給付額（概算）:</span>
              <span class="value" style="font-size: 1.25rem; font-weight: 700;">{{ formatCurrency(pwasgDetails.grantAdditionalAmount) }}</span>
            </li>
          </ul>
          <p style="font-size: 0.75rem; margin-top: 0.5rem;">
            ※ この金額は、通常の育児休業給付金（67%/50%）に<strong>加算</strong>されます。<br />
            ※ この期間の基本給付（67%部分）は、下の「最初の180日間」の給付額に含まれており、その計算には標準の賃金日額上限（{{ formatCurrency(WAGE_DAILY_UPPER_LIMIT) }}）が適用されます。
          </p>
        </div>
      </div>
    </div>

    <!-- 基本部分の内訳 -->
    <div class="result-details">
      <div class="detail-section">
        <div class="detail-title">育児休業給付金（基本部分）の内訳</div>
        <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem;">※ {{ PWASG_NAME }}の上乗せ額は含まれません。</p>
        
        <div style="display: grid; gap: 1rem; margin-bottom: 1rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            <div style="padding: 1rem; background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 0.375rem;">
              <div style="font-weight: 600; color: #0c4a6e;">最初の180日間 ({{ (BENEFIT_RATE_FIRST_PERIOD * 100).toFixed(0) }}%支給)</div>
              <div style="font-size: 1.125rem; color: #0369a1;">{{ result.firstPeriodDetails.days }}日間</div>
              <div style="font-size: 1.25rem; font-weight: 600; color: #0284c7;">{{ formatCurrency(result.firstPeriodDetails.amount) }}</div>
            </div>
            <div style="padding: 1rem; background: rgba(147, 51, 234, 0.1); border: 1px solid rgba(147, 51, 234, 0.3); border-radius: 0.375rem;">
              <div style="font-weight: 600; color: #581c87;">181日目以降 ({{ (BENEFIT_RATE_SECOND_PERIOD * 100).toFixed(0) }}%支給)</div>
              <div style="font-size: 1.125rem; color: #7c3aed;">{{ result.secondPeriodDetails.days }}日間</div>
              <div style="font-size: 1.25rem; font-weight: 600; color: #8b5cf6;">{{ formatCurrency(result.secondPeriodDetails.amount) }}</div>
            </div>
          </div>
        </div>
        
        <p style="font-size: 0.875rem; color: #475569;">基本部分の合計（概算）: {{ formatCurrency(result.standardBenefitTotal) }}</p>
        <p style="font-size: 0.875rem; color: #475569;">合計育休期間: {{ result.totalLeaveDays }}日間</p>
      </div>

      <!-- 計算の前提 -->
      <div class="detail-section">
        <div class="detail-title">計算の前提</div>
        <ul class="detail-list">
          <li v-if="result.calculationParams.individualMonthlySalaries && result.calculationParams.individualMonthlySalaries.length > 0">
            <div style="font-weight: 600; color: #374151; margin-bottom: 0.5rem;">入力された各月の給与:</div>
            <div v-for="(salary, index) in result.calculationParams.individualMonthlySalaries" :key="index" style="margin-left: 1rem; margin-bottom: 0.25rem;">
              <span class="label">{{ previousMonthLabels[index]?.label || `過去 ${index + 1}ヶ月前` }}:</span>
              <span class="value">{{ formatCurrency(salary) }}</span>
            </div>
          </li>
          <li>
            <span class="label">計算された平均月給:</span>
            <span class="value">{{ formatCurrency(result.calculationParams.averageMonthlySalaryLast6Months) }}</span>
          </li>
          <li>
            <span class="label">基本給付の計算基礎となる賃金日額:</span>
            <span class="value">{{ formatCurrency(result.calculationParams.averageMonthlySalaryLast6Months / 30) }}</span>
          </li>
          <li>
            <span class="label">適用された基本給付の賃金日額:</span>
            <span class="value">
              {{ formatCurrency(result.dailyWageBeforeLeaveCapped) }}
              <span style="font-size: 0.75rem;">(上限{{ formatCurrency(WAGE_DAILY_UPPER_LIMIT) }}、下限{{ formatCurrency(WAGE_DAILY_LOWER_LIMIT) }})</span>
            </span>
          </li>
          <li>
            <span class="label">{{ PWASG_NAME }}の申請希望:</span>
            <span class="value">{{ result.calculationParams.applyPostpartumSupportGrant ? 'あり' : 'なし' }}</span>
          </li>
          <li v-if="result.calculationParams.applyPostpartumSupportGrant">
            <span class="label">└ 配偶者の{{ PWASG_NAME }}条件:</span>
            <span class="value">{{ result.calculationParams.spouseMeetsPwasgConditions ? '満たす（または免除）' : '満たさない' }}</span>
          </li>
        </ul>
      </div>

      <!-- 計算式 -->
      <div class="detail-section">
        <div class="detail-title">計算式（概要）</div>
        <ul style="list-style: disc; padding-left: 1.5rem; space-y: 0.5rem; font-size: 0.875rem; color: #475569;">
          <li style="margin-bottom: 0.5rem;">
            <strong>基本の休業開始時賃金日額 (A)</strong>:
            育休開始前6ヶ月間の賃金総額 ÷ 180日 (本計算機では 月給平均 ÷ 30日 で代用)。<br />
            上限{{ formatCurrency(WAGE_DAILY_UPPER_LIMIT) }}、下限{{ formatCurrency(WAGE_DAILY_LOWER_LIMIT) }}。あなたの適用額: {{ formatCurrency(result.dailyWageBeforeLeaveCapped) }}。
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>基本給付（最初の180日間）</strong>:
            (A) × {{ result.firstPeriodDetails.days }}日 × {{ (BENEFIT_RATE_FIRST_PERIOD * 100).toFixed(0) }}%
            = {{ formatCurrency(result.firstPeriodDetails.rawAmount) }} (月額上限適用前)
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>基本給付（181日目以降）</strong>:
            (A) × {{ result.secondPeriodDetails.days }}日 × {{ (BENEFIT_RATE_SECOND_PERIOD * 100).toFixed(0) }}%
            = {{ formatCurrency(result.secondPeriodDetails.rawAmount) }} (月額上限適用前)
          </li>
          <li v-if="pwasgDetails && pwasgDetails.isGrantApplicable && pwasgDetails.grantAdditionalAmount > 0" style="margin-bottom: 0.5rem;">
            <strong>{{ PWASG_NAME }}（上乗せ分）</strong>:<br />
            専用計算賃金日額 (B) × {{ pwasgDetails.daysCoveredByGrant }}日 × {{ (pwasgDetails.grantAdditionalRate * 100).toFixed(0) }}%
            = {{ formatCurrency(pwasgDetails.grantAdditionalAmount) }}<br />
            <span style="font-size: 0.75rem;">専用計算賃金日額(B): 基本賃金日額に対し上限{{ formatCurrency(PWASG_WAGE_DAILY_UPPER_LIMIT) }}を適用。あなたの適用額: {{ formatCurrency(pwasgDetails.dailyWageForGrantItself) }}。</span><br />
            <span style="font-size: 0.75rem;">この金額は、上記基本給付に<strong>加算</strong>されます。</span>
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>基本給付の支給上限額（月額）</strong>:
            <ul style="list-style: disc; padding-left: 1rem;">
              <li>最初の180日を含む支給単位期間: {{ formatCurrency(MONTHLY_CAP_FIRST_PERIOD_RATE) }} まで</li>
              <li>181日目以降のみの支給単位期間: {{ formatCurrency(MONTHLY_CAP_SECOND_PERIOD_RATE) }} まで</li>
            </ul>
            <span style="font-size: 0.75rem;">※ 月の途中で開始・終了する場合等は日数に応じて調整。本計算では考慮済。これは基本給付部分に適用されます。</span>
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>最終的な支給総額</strong>: 基本給付（月額上限適用後）と、適用される場合の{{ PWASG_NAME }}（上乗せ分）の合計です。
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalculationResult, PwasgDetails } from '../types'
import {
  BENEFIT_RATE_FIRST_PERIOD,
  BENEFIT_RATE_SECOND_PERIOD,
  MONTHLY_CAP_FIRST_PERIOD_RATE,
  MONTHLY_CAP_SECOND_PERIOD_RATE,
  WAGE_DAILY_UPPER_LIMIT,
  WAGE_DAILY_LOWER_LIMIT,
  PWASG_NAME,
  PWASG_WAGE_DAILY_UPPER_LIMIT,
  PWASG_APPLICANT_MIN_LEAVE_DAYS
} from '../constants'

interface Props {
  result: CalculationResult
}

const props = defineProps<Props>()

// Helper function to get previous months' labels (copied from MonthlySalariesInput)
function getPreviousMonthLabels(leaveStartDateStr: string, count: number): { year: number, monthIndex: number, label: string }[] {
  if (!leaveStartDateStr) {
    return Array(count).fill(null).map((_, i) => ({
      year: 0,
      monthIndex: 0,
      label: `Month ${count - i}`
    }))
  }
  
  const startDate = new Date(leaveStartDateStr)
  if (isNaN(startDate.getTime())) {
    return Array(count).fill(null).map((_, i) => ({
      year: 0,
      monthIndex: 0,
      label: `Month ${count - i} (Invalid Start Date)`
    }))
  }
  
  const firstDayOfLeaveStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  
  const months = []
  for (let i = 1; i <= count; i++) {
    const targetMonthDate = new Date(firstDayOfLeaveStartMonth)
    targetMonthDate.setMonth(firstDayOfLeaveStartMonth.getMonth() - i)
    const year = targetMonthDate.getFullYear()
    const monthIndex = targetMonthDate.getMonth()
    months.push({
      year,
      monthIndex,
      label: `${year}年${monthIndex + 1}月`,
    })
  }
  return months
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { 
    style: 'currency', 
    currency: 'JPY', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(Math.round(amount))
}

const pwasgDetails = computed(() => props.result.pwasgDetails)

const previousMonthLabels = computed(() => {
  return props.result.calculationParams.leaveStartDate
    ? getPreviousMonthLabels(
        props.result.calculationParams.leaveStartDate.toISOString().split('T')[0], 
        props.result.calculationParams.individualMonthlySalaries?.length || 0
      )
    : []
})

const showPwasgNotApplicable = computed(() => {
  const pwasg = pwasgDetails.value
  if (!pwasg || pwasg.isGrantApplicable) return false
  
  return pwasg.grantAdditionalAmount === 0 && 
         (pwasg.applicantTookMinLeaveForPwasg === false || pwasg.spouseConditionMetForPwasg === false) && 
         pwasg.applicantTookMinLeaveForPwasg !== undefined && 
         pwasg.spouseConditionMetForPwasg !== undefined
})

const pwasgNotApplicableReason = computed(() => {
  const pwasg = pwasgDetails.value
  if (!pwasg) return ""
  
  let reason = ""
  if (!pwasg.applicantTookMinLeaveForPwasg) {
    reason += `申請者の休業期間が${PWASG_APPLICANT_MIN_LEAVE_DAYS}日未満です。`
  }
  if (!pwasg.spouseConditionMetForPwasg) {
    if (reason) reason += " "
    reason += "配偶者の条件が満たされていません。"
  }
  return reason
})
</script>
