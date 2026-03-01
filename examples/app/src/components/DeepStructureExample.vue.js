/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { useY, useYDoc } from "vue-yjs";
import * as Y from "yjs";
const yDoc = useYDoc();
const yPosts = yDoc.getArray("posts");
const yPost = new Y.Map();
yPosts.push([yPost]);
yPost.set("title", "Notes");
const yTags = new Y.Array();
yTags.push(["cooking", "vegetables"]);
yPost.set("tags", yTags);
const yTagsOfFirstPost = yPosts.get(0).get("tags");
const tagsOfFirstPost = useY(yTagsOfFirstPost);
function deleteTag(index) {
    yTagsOfFirstPost.delete(index);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
for (const [tag, index] of __VLS_getVForSourceType((__VLS_ctx.tagsOfFirstPost))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (`${tag}-${index}`),
    });
    (tag);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.deleteTag(index);
            } },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
(JSON.stringify(__VLS_ctx.yPosts.toJSON(), null, 2));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            yPosts: yPosts,
            tagsOfFirstPost: tagsOfFirstPost,
            deleteTag: deleteTag,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
