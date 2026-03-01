<script setup lang="ts">
import { useYArray } from "vue-yjs";

interface Post {
  title: string;
  tags: string[];
}

const { items: posts, push, yArray: yPosts } = useYArray<Post>("posts");

// Add initial data if empty
if (yPosts.length === 0) {
  push({ title: "Notes", tags: ["cooking", "vegetables"] });
}

function deleteTag(postIndex: number, tagIndex: number) {
  // For nested arrays, use the escape hatch
  const yPost = yPosts.get(postIndex) as import("yjs").Map<unknown>;
  const yTags = yPost.get("tags") as import("yjs").Array<string>;
  yTags.delete(tagIndex);
}
</script>

<template>
  <div v-if="posts.length > 0">
    <div v-for="(tag, tagIndex) in posts[0]?.tags" :key="`${tag}-${tagIndex}`">
      {{ tag }}
      <button @click="deleteTag(0, tagIndex)">x</button>
    </div>
  </div>
  <div>Result: {{ JSON.stringify(posts, null, 2) }}</div>
</template>
