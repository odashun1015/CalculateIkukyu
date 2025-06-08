<template>
  <div 
    class="checkbox-group" 
    :class="{ disabled: isDisabled }"
    :style="{
      padding: '1rem',
      border: isDisabled ? '1px solid #e2e8f0' : '1px solid #0ea5e9',
      borderRadius: '0.5rem',
      backgroundColor: isDisabled ? '#f8fafc' : '#f0f9ff'
    }"
  >
    <div class="checkbox-wrapper">
      <input
        id="spouse-pwasg-condition-checkbox"
        type="checkbox"
        :checked="isChecked"
        :disabled="isDisabled"
        @change="handleChange"
        aria-describedby="spouse-pwasg-condition-description"
      />
      <div class="checkbox-content">
        <label 
          for="spouse-pwasg-condition-checkbox" 
          class="checkbox-label"
          :style="{ color: isDisabled ? '#64748b' : '#1e293b' }"
        >
          {{ PWASG_SPOUSE_CONDITION_CHECKBOX_LABEL }}
        </label>
        <p 
          id="spouse-pwasg-condition-description" 
          class="checkbox-description"
          :style="{ color: isDisabled ? '#94a3b8' : '#475569' }"
        >
          {{ PWASG_SPOUSE_CONDITION_DESCRIPTION_TEXT }}
        </p>
        <p 
          v-if="isDisabled" 
          style="font-size: 0.75rem; color: #d97706; margin-top: 0.25rem;"
        >
          ※ 「{{ PWASG_APPLICATION_CHECKBOX_LABEL }}」にチェックを入れると選択可能になります。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PWASG_SPOUSE_CONDITION_CHECKBOX_LABEL, PWASG_SPOUSE_CONDITION_DESCRIPTION_TEXT, PWASG_APPLICATION_CHECKBOX_LABEL } from '../constants'

interface Props {
  isChecked: boolean
  isDisabled?: boolean
}

interface Emits {
  (e: 'update:checked', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false
})
const emit = defineEmits<Emits>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:checked', target.checked)
}
</script>
