<template>
  <div class="checkbox-group" style="padding: 1rem; border: 1px solid #0ea5e9; border-radius: 0.5rem; background-color: #f0f9ff;">
    <div class="checkbox-wrapper">
      <input
        id="pwasg-application-checkbox"
        type="checkbox"
        :checked="isChecked"
        @change="handleChange"
        aria-describedby="pwasg-conditions-description"
      />
      <div class="checkbox-content">
        <label for="pwasg-application-checkbox" class="checkbox-label">
          {{ PWASG_APPLICATION_CHECKBOX_LABEL }}
        </label>
        <p id="pwasg-conditions-description" class="checkbox-description">
          {{ PWASG_CONDITIONS_TEXT }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PWASG_APPLICATION_CHECKBOX_LABEL, PWASG_CONDITIONS_TEXT } from '../constants'

interface Props {
  isChecked: boolean
}

interface Emits {
  (e: 'update:checked', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:checked', target.checked)
}
</script>
