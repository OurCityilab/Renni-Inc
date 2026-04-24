<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  hint?: string
  tone?: 'default' | 'warn' | 'good'
}>()
</script>

<template>
  <div class="card">
    <p class="text-xs uppercase tracking-wide text-neutral-500">{{ label }}</p>
    <p
      class="mt-1 text-2xl font-semibold"
      :class="{
        'text-rose-700': tone === 'warn',
        'text-emerald-700': tone === 'good'
      }"
    >
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1 text-xs text-neutral-500">{{ hint }}</p>
  </div>
</template>
