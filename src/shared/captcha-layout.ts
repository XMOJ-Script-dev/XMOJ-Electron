import type { CaptchaBounds } from './types.ts';
export function captchaViewport(bounds: CaptchaBounds, width: number, height: number, zoom = 1) {
    const rect = { x: Math.round(bounds.x * zoom), y: Math.round(bounds.y * zoom), width: Math.round(bounds.width * zoom), height: Math.round(bounds.height * zoom) };
    if (![...Object.values(rect), width, height, zoom].every(Number.isFinite) || zoom <= 0) return null;
    const clipLeft = Math.max(0, Math.min(width, Math.round((bounds.clipLeft ?? 0) * zoom)));
    const clipRight = Math.max(clipLeft, Math.min(width, Math.round((bounds.clipRight ?? width / zoom) * zoom)));
    if (![clipLeft, clipRight].every(Number.isFinite)) return null;
    const x = Math.max(clipLeft, Math.min(clipRight, rect.x));
    const y = Math.max(0, Math.min(height, rect.y));
    const visibleWidth = Math.max(0, Math.min(clipRight, rect.x + rect.width) - x);
    const visibleHeight = Math.max(0, Math.min(height, rect.y + rect.height) - y);
    return {
        bounds: { x, y, width: Math.max(1, visibleWidth), height: Math.max(1, visibleHeight) },
        visible: bounds.visible && visibleWidth > 0 && visibleHeight > 0,
        offsetX: Math.max(0, x - rect.x) / zoom,
        offsetY: Math.max(0, y - rect.y) / zoom,
    };
}
