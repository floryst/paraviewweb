/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    stillRender: (options = { size: [400, 400], view: -1 }) =>
      session.call('viewport.image.push', [options]),
    onRenderChange: (callback) =>
      session.subscribe('viewport.image.push.subscription', callback),
    offRenderChange: (subscription) => session.unsubscribe(subscription),
    addRenderObserver: (viewId) =>
      session.call('viewport.image.push.observer.add', [viewId]),
    removeRenderObserver: (viewId) =>
      session.call('viewport.image.push.observer.remove', [viewId]),
    enableView: (viewId, enabled) =>
      session.call('viewport.image.push.enabled', [viewId, enabled]),
    viewQuality: (viewId, quality, ratio = 1) =>
      session.call('viewport.image.push.quality', [viewId, quality, ratio]),
    viewSize: (viewId, width = 400, height = 400) =>
      session.call('viewport.image.push.original.size', [
        viewId,
        width,
        height,
      ]),
    invalidateCache: (viewId) =>
      session.call('viewport.image.push.invalidate.cache', [viewId]),
  };
}
