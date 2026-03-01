/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import SettingsExample from "./components/SettingsExample.vue";
import TodosExample from "./components/TodosExample.vue";
import DeepStructureExample from "./components/DeepStructureExample.vue";
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
/** @type {[typeof SettingsExample, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(SettingsExample, new SettingsExample({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.hr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
/** @type {[typeof TodosExample, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(TodosExample, new TodosExample({}));
const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
__VLS_asFunctionalElement(__VLS_intrinsicElements.hr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
/** @type {[typeof DeepStructureExample, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(DeepStructureExample, new DeepStructureExample({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SettingsExample: SettingsExample,
            TodosExample: TodosExample,
            DeepStructureExample: DeepStructureExample,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
