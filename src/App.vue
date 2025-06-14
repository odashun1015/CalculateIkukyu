<template>
  <div class="container">
    <header class="header">
      <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v.008c0 .031.003.061.008.09A5.252 5.252 0 0115 5.25H16.5a.75.75 0 01.75.75V10.5a.75.75 0 01-.75.75h-1.519a5.25 5.25 0 01-5.973 3.98L8.08 16.153a.75.75 0 01-1.202-.865l.87-2.428A5.232 5.232 0 019.008 10.5H6.75a.75.75 0 01-.75-.75V5.25zm2.25 2.25a.75.75 0 000 1.5H15a.75.75 0 000-1.5H9z" clip-rule="evenodd" />
        <path d="M3 9.75a.75.75 0 01.75-.75H6v1.5H3.75a.75.75 0 01-.75-.75zM3.75 12a.75.75 0 000 1.5H6v-1.5H3.75zM3 14.25a.75.75 0 01.75-.75H6v1.5H3.75a.75.75 0 01-.75-.75zM17.25 9a.75.75 0 000 1.5h2.25a.75.75 0 000-1.5h-2.25zM18 11.25a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18.75a.75.75 0 01-.75-.75zM17.25 13.5a.75.75 0 000 1.5h2.25a.75.75 0 000-1.5h-2.25z" />
        <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25H3a.75.75 0 000 1.5h3.75A5.25 5.25 0 0012 13.5h.008c.03.001.06.002.092.003l.012.001.008.001h.001a5.25 5.25 0 005.13-4.526H21a.75.75 0 000-1.5h-3.75a5.25 5.25 0 00-5.25-5.25V1.5zm0 1.5v-.001A3.75 3.75 0 0115.75 6.75H8.25A3.75 3.75 0 0112 3z" clip-rule="evenodd" />
      </svg>
      <h1>育児休業給付金 計算機</h1>
      <p>2025年4月施行予定の「出生後休業支援給付金」にも対応。受給可能な育児休業関連給付の概算額を計算します。</p>
    </header>

    <main class="main-content">
      <form @submit="handleSubmit" class="form">
        <LeavePeriodInput
          :start-date="leaveStartDate"
          :end-date="leaveEndDate"
          @update:start-date="handleLeaveStartDateChange"
          @update:end-date="handleLeaveEndDateChange"
        />
        
        <MonthlySalariesInput
          :leave-start-date-string="leaveStartDate"
          :monthly-salaries="monthlySalaries"
          @update:salary="handleMonthlySalaryChange"
        />
        
        <div class="form-section">
          <PostpartumSupportGrantCheckbox 
            :is-checked="applyPostpartumSupportGrant"
            @update:checked="handlePwasgApplicationChange"
          />
          <SpousePwasgConditionCheckbox
            :is-checked="spouseMeetsPwasgConditions"
            :is-disabled="!applyPostpartumSupportGrant"
            @update:checked="handleSpousePwasgConditionChange"
          />
        </div>

        <div style="text-align: center;">
          <button type="submit" class="submit-button">
            計算する
          </button>
        </div>
      </form>

      <div v-if="error" class="alert error" role="alert">
        <h3>エラー</h3>
        <p>{{ error }}</p>
      </div>
      
      <div v-if="warning" class="alert warning" role="alert">
        <h3>留意事項</h3>
        <p>{{ warning }}</p>
      </div>

      <CalculationResultDisplay 
        v-if="calculationResult && !error"
        :result="calculationResult" 
      />
      
      <div class="disclaimer">
        {{ DISCLAIMER_TEXT }}
      </div>
    </main>
    
    <footer class="footer">
      <p>&copy; {{ new Date().getFullYear() }} 育児休業給付金計算機. All rights reserved (conceptually).</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LeavePeriodInput from './components/LeavePeriodInput.vue'
import MonthlySalariesInput from './components/MonthlySalariesInput.vue'
import CalculationResultDisplay from './components/CalculationResultDisplay.vue'
import PostpartumSupportGrantCheckbox from './components/PostpartumSupportGrantCheckbox.vue'
import SpousePwasgConditionCheckbox from './components/SpousePwasgConditionCheckbox.vue'
import { calculateChildcareLeaveBenefits } from './services/CalculatorService'
import type { CalculationParams, CalculationResult } from './types'
import { DISCLAIMER_TEXT, PWASG_APPLICANT_MIN_LEAVE_DAYS, PWASG_NAME } from './constants'

const MONTHS_FOR_AVERAGE = 6

// Reactive data
const monthlySalaries = ref<string[]>(Array(MONTHS_FOR_AVERAGE).fill(''))
const today = new Date().toISOString().split('T')[0]
const leaveStartDate = ref<string>(today)

const defaultEndDate = new Date()
defaultEndDate.setMonth(defaultEndDate.getMonth() + 6) // Default to 6 months leave
const minLeaveDate = new Date(today)
minLeaveDate.setDate(minLeaveDate.getDate() + PWASG_APPLICANT_MIN_LEAVE_DAYS - 1)
if (defaultEndDate < minLeaveDate) {
  defaultEndDate.setTime(minLeaveDate.getTime())
}
const leaveEndDate = ref<string>(defaultEndDate.toISOString().split('T')[0])

const applyPostpartumSupportGrant = ref<boolean>(false)
const spouseMeetsPwasgConditions = ref<boolean>(false)
const calculationResult = ref<CalculationResult | null>(null)
const error = ref<string | null>(null)
const warning = ref<string | null>(null)

// Methods
const resetOutputs = () => {
  calculationResult.value = null
  error.value = null
  warning.value = null
}

const handleMonthlySalaryChange = (index: number, value: string) => {
  monthlySalaries.value[index] = value
  resetOutputs()
}

const handleLeaveStartDateChange = (value: string) => {
  leaveStartDate.value = value
  resetOutputs()
}

const handleLeaveEndDateChange = (value: string) => {
  leaveEndDate.value = value
  resetOutputs()
}

const handlePwasgApplicationChange = (isChecked: boolean) => {
  applyPostpartumSupportGrant.value = isChecked
  if (!isChecked) {
    spouseMeetsPwasgConditions.value = false
  }
  resetOutputs()
}

const handleSpousePwasgConditionChange = (isChecked: boolean) => {
  spouseMeetsPwasgConditions.value = isChecked
  resetOutputs()
}

const handleSubmit = (event: Event) => {
  event.preventDefault()
  resetOutputs() // Clear previous errors/results/warnings

  const parsedSalaries: number[] = []
  for (let i = 0; i < MONTHS_FOR_AVERAGE; i++) {
    const salaryStr = monthlySalaries.value[i]
    if (salaryStr === '' || isNaN(parseFloat(salaryStr)) || parseFloat(salaryStr) < 0) {
      error.value = `有効な給与額を${MONTHS_FOR_AVERAGE}ヶ月分すべて入力してください（${i + 1}ヶ月目が未入力または無効です）。`
      return
    }
    parsedSalaries.push(parseFloat(salaryStr))
  }

  const totalSalary = parsedSalaries.reduce((sum, s) => sum + s, 0)
  const averageMonthlySalary = totalSalary / MONTHS_FOR_AVERAGE

  if (averageMonthlySalary <= 0) {
    error.value = '平均月給が0以下です。有効な給与額を入力してください。'
    return
  }

  if (!leaveStartDate.value || !leaveEndDate.value) {
    error.value = '育休開始日と終了日を両方入力してください。'
    return
  }

  const startDateObj = new Date(leaveStartDate.value)
  const endDateObj = new Date(leaveEndDate.value)

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    error.value = '日付の形式が正しくありません。'
    return
  }
  
  if (startDateObj >= endDateObj) {
    error.value = '育休終了日は開始日より後の日付にしてください。'
    return
  }
  
  // Calculate total leave days for PWASG condition check
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime())
  const totalLeaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Inclusive

  if (applyPostpartumSupportGrant.value && totalLeaveDays < PWASG_APPLICANT_MIN_LEAVE_DAYS) {
    warning.value = `「${PWASG_NAME}」の申請には、少なくとも${PWASG_APPLICANT_MIN_LEAVE_DAYS}日間の休業が必要です。現在の指定期間は${totalLeaveDays}日間です。このため、${PWASG_NAME}は計算されません。`
  }
  if (applyPostpartumSupportGrant.value && !spouseMeetsPwasgConditions.value) {
    const currentWarning = warning.value ? warning.value + "\n" : ""
    warning.value = currentWarning + `「${PWASG_NAME}」の申請には、配偶者の条件も満たす必要があります。配偶者条件がチェックされていないため、${PWASG_NAME}は計算されません。`
  }

  const params: CalculationParams = {
    averageMonthlySalaryLast6Months: averageMonthlySalary,
    leaveStartDate: startDateObj,
    leaveEndDate: endDateObj,
    individualMonthlySalaries: parsedSalaries,
    applyPostpartumSupportGrant: applyPostpartumSupportGrant.value,
    spouseMeetsPwasgConditions: spouseMeetsPwasgConditions.value,
  }

  try {
    const result = calculateChildcareLeaveBenefits(params)
    calculationResult.value = result
  } catch (e) {
    if (e instanceof Error) {
      error.value = `計算エラー: ${e.message}`
    } else {
      error.value = '不明なエラーが発生しました。'
    }
  }
}
</script>