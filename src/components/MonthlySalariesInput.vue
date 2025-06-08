<template>
  <div class="form-section">
    <h3 style="font-size: 1.125rem; font-weight: 600; color: #334155; margin-bottom: 1rem;">
      育休開始前{{ MONTHS_COUNT }}ヶ月間の各月給与（額面）
    </h3>
    <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
      育児休業を開始する日を基点に、その直前の{{ MONTHS_COUNT }}ヶ月間の各月の給与（税金や社会保険料が引かれる前の金額）を入力してください。
    </p>
    <div class="salary-grid">
      <div v-for="(month, index) in monthLabels" :key="index" class="form-group">
        <label :for="`monthlySalary-${index}`">
          {{ month.label }}の給与
        </label>
        <div class="salary-input-wrapper">
          <input
            type="number"
            :id="`monthlySalary-${index}`"
            :value="monthlySalaries[index]"
            @input="(event) => handleSalaryChange(index, event)"
            placeholder="例: 300000"
            min="0"
          />
          <span class="currency-symbol">円</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  leaveStartDateString: string
  monthlySalaries: string[]
}

interface Emits {
  (e: 'update:salary', index: number, value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const MONTHS_COUNT = 6

// Helper function to get previous months' labels
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

const monthLabels = computed(() => {
  return getPreviousMonthLabels(props.leaveStartDateString, MONTHS_COUNT)
})

const handleSalaryChange = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:salary', index, target.value)
}
</script>

<style scoped lang="scss">
.salary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.salary-input-wrapper {
  position: relative;
  
  input {
    padding-right: 2rem;
  }

  .currency-symbol {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    font-size: 0.875rem;
    pointer-events: none;
  }
}
</style>
