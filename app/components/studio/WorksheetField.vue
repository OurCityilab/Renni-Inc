<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  prompt?: string
  rows?: number
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <label class="block text-sm">
    <span class="block font-medium text-neutral-800">{{ label }}</span>
    <span v-if="prompt" class="mt-0.5 block text-xs text-neutral-600">{{ prompt }}</span>
    <textarea
      :value="modelValue"
      :rows="rows ?? 2"
      class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </label>
</template>
