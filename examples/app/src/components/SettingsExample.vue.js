/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { useY, useYDoc } from "vue-yjs";
const yDoc = useYDoc();
const ySettings = yDoc.getMap("settings");
ySettings.set("weeklyReminderEmail", true);
const settings = useY(ySettings);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.ySettings.set('weeklyReminderEmail', $event.target.checked);
        } },
    type: "checkbox",
    checked: (__VLS_ctx.settings.weeklyReminderEmail),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
(JSON.stringify(__VLS_ctx.settings, null, 2));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ySettings: ySettings,
            settings: settings,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
