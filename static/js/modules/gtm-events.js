'use strict';

/**
 * GTM Events Module - правильний формат dataLayer для Google Tag Manager
 * Використовує існуючий GTM-KSDBPZNB
 */
export const GTMEvents = {
  /**
   * Відстеження початку заповнення форми
   * @param {string} formType - 'trial' | 'consultation' | 'testimonial'
   * @param {string} location - 'hero' | 'header-desktop' | 'header-mobile' | 'page' | 'modal'
   */
  formStart(formType, location) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'form_start',
      'form_type': formType,
      'form_location': location
    });
  },

  /**
   * Відстеження відправки форми
   * @param {string} formType - 'trial' | 'consultation' | 'testimonial'
   * @param {string} location - 'hero' | 'header-desktop' | 'header-mobile' | 'page' | 'modal'
   */
  formSubmit(formType, location) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'form_submit',
      'form_type': formType,
      'form_location': location
    });
  },

  /**
   * Відстеження успішної відправки форми
   * @param {string} formType - 'trial' | 'consultation' | 'testimonial'
   * @param {string} location - 'hero' | 'header-desktop' | 'header-mobile' | 'page' | 'modal'
   * @param {number|null} leadId - ID створеної заявки (якщо доступно)
   */
  formSuccess(formType, location, leadId = null) {
    window.dataLayer = window.dataLayer || [];
    const eventData = {
      'event': 'form_success',
      'form_type': formType,
      'form_location': location
    };

    if (leadId !== null) {
      eventData.lead_id = leadId;
    }

    window.dataLayer.push(eventData);
  },

  /**
   * Відстеження помилки відправки форми
   * @param {string} formType - 'trial' | 'consultation' | 'testimonial'
   * @param {string} location - 'hero' | 'header-desktop' | 'header-mobile' | 'page' | 'modal'
   * @param {string} errorType - 'validation' | 'network' | 'server'
   */
  formError(formType, location, errorType) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'form_error',
      'form_type': formType,
      'form_location': location,
      'error_type': errorType
    });
  }
};

