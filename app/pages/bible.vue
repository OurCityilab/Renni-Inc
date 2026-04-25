<script setup lang="ts">
// Legacy alias. The student-facing feature is the Playbook, and this route
// exists only so stale bookmarks or test notes still land in the right place.
await navigateTo('/playbook', { replace: true, redirectCode: 301 })
</script>

<template>
  <p class="p-6 text-sm text-neutral-500">Redirecting to the Playbook…</p>
</template>
