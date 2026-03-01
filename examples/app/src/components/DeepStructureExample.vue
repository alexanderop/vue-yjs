<script setup lang="ts">
import { useY } from "vue-yjs";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yPosts = yDoc.getArray<Y.Map<string | Y.Array<string>>>("posts");
const yPost = new Y.Map<string | Y.Array<string>>();
yPosts.push([yPost]);
yPost.set("title", "Notes");
const yTags = new Y.Array<string>();
yTags.push(["cooking", "vegetables"]);
yPost.set("tags", yTags);

const yTagsOfFirstPost = yPosts.get(0).get("tags") as Y.Array<string>;
const tagsOfFirstPost = useY(yTagsOfFirstPost);

function deleteTag(index: number) {
  const tags = yPosts.get(0).get("tags") as Y.Array<string>;
  tags.delete(index);
}
</script>

<template>
  <div v-for="(tag, index) in tagsOfFirstPost" :key="`${tag}-${index}`">
    {{ tag }}
    <button @click="deleteTag(index)">x</button>
  </div>
  <div>Result: {{ JSON.stringify(yPosts.toJSON(), null, 2) }}</div>
</template>
