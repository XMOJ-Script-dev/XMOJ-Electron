export function submitOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229 || event.shiftKey || event.altKey || event.metaKey || event.repeat || event.defaultPrevented) return;
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement) && !(target instanceof HTMLInputElement && ['text', 'search', 'password', 'number', 'email', 'url', 'tel'].includes(target.type))) return;
    const requiresCtrl = target instanceof HTMLTextAreaElement && target.dataset.enterSubmit === 'ctrl';
    if (event.ctrlKey !== requiresCtrl) return;
    if (target.disabled || target.readOnly || target.closest('.monaco-editor')) return;
    const form = target.form;
    if (!form) return;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!button) return;
    event.preventDefault();
    if (!button.disabled) form.requestSubmit(button);
}
export function installEnterSubmit(): void {
    document.addEventListener('keydown', submitOnEnter);
}
