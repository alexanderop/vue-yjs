/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref } from "vue";
import { useY, useYDoc, useUndoManager } from "vue-yjs";
import * as Y from "yjs";
const yDoc = useYDoc();
const yTodos = yDoc.getArray("todos");
const todos = useY(yTodos);
const { undo, redo, canUndo, canRedo } = useUndoManager(yTodos);
const newTodo = ref("");
function addTodo(event) {
    event.preventDefault();
    const todo = new Y.Map();
    todo.set("checked", false);
    todo.set("text", newTodo.value);
    yTodos.push([todo]);
    newTodo.value = "";
}
function toggleTodo(index, event) {
    yTodos.get(index).set("checked", event.target.checked);
}
function updateTodoText(index, event) {
    yTodos.get(index).set("text", event.target.value);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.undo) },
    disabled: (!__VLS_ctx.canUndo),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.redo) },
    disabled: (!__VLS_ctx.canRedo),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.addTodo) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "text",
    value: (__VLS_ctx.newTodo),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [todo, index] of __VLS_getVForSourceType((__VLS_ctx.todos))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (index),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.toggleTodo(index, $event);
            } },
        type: "checkbox",
        checked: todo.checked,
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.updateTodoText(index, $event);
            } },
        type: "text",
        value: todo.text,
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
(JSON.stringify(__VLS_ctx.todos, null, 2));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            todos: todos,
            undo: undo,
            redo: redo,
            canUndo: canUndo,
            canRedo: canRedo,
            newTodo: newTodo,
            addTodo: addTodo,
            toggleTodo: toggleTodo,
            updateTodoText: updateTodoText,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
