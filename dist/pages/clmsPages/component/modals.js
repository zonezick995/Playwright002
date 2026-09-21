"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModalActions = exports.MODAL_SELECTORS = void 0;
const BasePage_1 = require("../../BasePage");
/**
* TypeScript Idiomatic: Modal component actions
* Pure functions thay vì class
*/
exports.MODAL_SELECTORS = {
    overlay: '.ant-modal-mask',
    container: '.ant-modal-content',
    title: '.ant-modal-title',
    closeBtn: '.ant-modal-close',
    okBtn: '.ant-modal-footer button.ant-btn-primary',
    cancelBtn: '.ant-modal-footer button:not(.ant-btn-primary)',
};
// Modal actions
const createModalActions = (page) => {
    const actions = (0, BasePage_1.createPageActions)(page);
    return {
        waitForOpen: async (timeout = 5000) => {
            await actions.wait.forVisible(exports.MODAL_SELECTORS.container, timeout);
        },
        waitForClose: async (timeout = 5000) => {
            await actions.wait.forHidden(exports.MODAL_SELECTORS.container, timeout);
        },
        close: async () => {
            await actions.click(exports.MODAL_SELECTORS.closeBtn);
            await actions.wait.forHidden(exports.MODAL_SELECTORS.container);
        },
        clickOk: async () => {
            await actions.click(exports.MODAL_SELECTORS.okBtn);
        },
        clickCancel: async () => {
            await actions.click(exports.MODAL_SELECTORS.cancelBtn);
        },
        getTitle: async () => {
            return await actions.query.getText(exports.MODAL_SELECTORS.title);
        },
        isOpen: async () => {
            return await actions.query.isVisible(exports.MODAL_SELECTORS.container);
        },
        // Helper: wait for modal and perform action
        withModal: async (action) => {
            await actions.wait.forVisible(exports.MODAL_SELECTORS.container);
            const result = await action();
            return result;
        },
    };
};
exports.createModalActions = createModalActions;
