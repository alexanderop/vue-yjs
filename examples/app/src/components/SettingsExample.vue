<script setup lang="ts">
import { useYMap } from "vue-yjs";

interface Settings {
  weeklyReminderEmail: boolean;
}

const { data: settings, set } = useYMap<Settings>("settings", {
  defaults: { weeklyReminderEmail: true },
});
</script>

<template>
  <label>
    <input
      type="checkbox"
      :checked="settings.weeklyReminderEmail"
      @change="set('weeklyReminderEmail', ($event.target as HTMLInputElement).checked)"
    />
    Weekly Reminder Email
  </label>
  <div>Result: {{ JSON.stringify(settings, null, 2) }}</div>
</template>
