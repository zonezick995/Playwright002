import { Page } from '@playwright/test';
import { createPageActions } from '../../BasePage';

/**
* TypeScript Idiomatic: Modal component actions
* Pure functions thay vì class
*/

export const MODAL_SELECTORS = {
  overlay: '.ant-modal-mask',
  container: '.ant-modal-content',
  title: '.ant-modal-title',
  closeBtn: '.ant-modal-close',
  okBtn: '.ant-modal-footer button.ant-btn-primary',
  cancelBtn: '.ant-modal-footer button:not(.ant-btn-primary)',
} as const;

// Modal actions
export const createModalActions = (page: Page) => {
  const actions = createPageActions(page);

  return {
    waitForOpen: async (timeout = 5000) => {
      await actions.wait.forVisible(MODAL_SELECTORS.container, timeout);
    },

    waitForClose: async (timeout = 5000) => {
      await actions.wait.forHidden(MODAL_SELECTORS.container, timeout);
    },

    close: async () => {
      await actions.click(MODAL_SELECTORS.closeBtn);
      await actions.wait.forHidden(MODAL_SELECTORS.container);
    },

    clickOk: async () => {
      await actions.click(MODAL_SELECTORS.okBtn);
    },

    clickCancel: async () => {
      await actions.click(MODAL_SELECTORS.cancelBtn);
    },

    getTitle: async (): Promise<string> => {
      return await actions.query.getText(MODAL_SELECTORS.title);
    },

    isOpen: async (): Promise<boolean> => {
      return await actions.query.isVisible(MODAL_SELECTORS.container);
    },

    // Helper: wait for modal and perform action
    withModal: async <T>(action: () => Promise<T>): Promise<T> => {
      await actions.wait.forVisible(MODAL_SELECTORS.container);
      const result = await action();
      return result;
    },
  };
};

export type ModalActions = ReturnType<typeof createModalActions>;
 