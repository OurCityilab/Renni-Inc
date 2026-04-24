<script setup lang="ts">
// Legacy alias. The student-facing feature is the Playbook — this route
// exists only so stale bookmarks or test notes that point at /bible still
// land in the right place. No UI copy here should say "Bible".
await navigateTo('/playbook', { replace: true, redirectCode: 301 })
</script>

<template>
  <p class="p-6 text-sm text-neutral-500">Redirecting to the Playbook…</p>
</template>
