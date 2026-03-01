<script setup lang="ts">
const collaboration = useCollaboration('default')
</script>

<template>
  <TodoApp
    :status="collaboration.status.value"
    :synced="collaboration.synced.value"
    :awareness-states="collaboration.awarenessStates.value"
    :local-client-id="collaboration.localClientId"
    :user-name="collaboration.userName"
    :user-color="collaboration.userColor"
    @update-name="collaboration.updateUserName"
  />
  <DevToolsToggle />
  <DevToolsPanel
    :doc="collaboration.doc"
    :provider="collaboration.provider"
    :awareness-states="collaboration.awarenessStates.value"
    :local-client-id="collaboration.localClientId"
    :status="collaboration.status.value"
    :synced="collaboration.synced.value"
    :message-log="collaboration.messageLog"
  />
</template>
