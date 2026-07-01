<script setup lang="ts">
definePageMeta({ layout: 'studio' })

// /studio is not a destination itself — bounce straight to Today so
// there is no dead/ambiguous landing route.
await navigateTo('/studio/today')
</script>

<template>
  <div />
</template>
