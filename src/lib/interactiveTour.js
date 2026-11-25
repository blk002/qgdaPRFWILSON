export const TOUR_EVENT_NAME = 'qg:start-interactive-tour';
export const TOUR_COMPLETED_KEY = 'qg_interactive_tour_completed_v1';

export function startInteractiveTour(startStepId = null) {
  window.dispatchEvent(
    new CustomEvent(TOUR_EVENT_NAME, {
      detail: { startStepId },
    })
  );
}
