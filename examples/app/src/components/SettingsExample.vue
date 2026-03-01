<script setup lang="ts">
import { useY, useYDoc } from "vue-yjs";

const yDoc = useYDoc();
const ySettings = yDoc.getMap<boolean>("settings");
ySettings.set("weeklyReminderEmail", true);

const settings = useY(ySettings);
</script>

<template>
  <label>
    <input
      type="checkbox"
      :checked="settings.weeklyReminderEmail"
      @change="ySettings.set('weeklyReminderEmail', ($event.target as HTMLInputElement).checked)"
    />
    Weekly Reminder Email
  </label>
  <div>Result: {{ JSON.stringify(settings, null, 2) }}</div>
</template>
