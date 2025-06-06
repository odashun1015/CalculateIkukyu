<template>
  <div class="form-section">
    <div class="form-group">
      <label for="leaveStartDate">育児休業開始日</label>
      <input
        type="date"
        id="leaveStartDate"
        :value="startDate"
        @input="handleStartDateChange"
        :min="today"
      />
    </div>
    <div class="form-group">
      <label for="leaveEndDate">育児休業終了日</label>
      <input
        type="date"
        id="leaveEndDate"
        :value="endDate"
        @input="handleEndDateChange"
        :min="startDate || today"
      />
    </div>
    <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">
      育児休業を取得する期間を入力してください。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  startDate: string
  endDate: string
}

interface Emits {
  (e: 'update:startDate', value: string): void
  (e: 'update:endDate', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const today = computed(() => new Date().toISOString().split('T')[0])

const handleStartDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:startDate', target.value)
}

const handleEndDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:endDate', target.value)
}
</script>