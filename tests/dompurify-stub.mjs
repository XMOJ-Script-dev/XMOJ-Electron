const DOMPurify = {
    sanitize(html) {
        return html;
    },
    addHook() { },
    removeHook() { },
    setConfig() { },
    clearConfig() { },
    isSupported: false,
};
export default DOMPurify;
export const sanitize = DOMPurify.sanitize;
