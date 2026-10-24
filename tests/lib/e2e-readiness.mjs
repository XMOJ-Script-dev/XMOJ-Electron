export function isViewSettled(state) {
    return !state.busy && state.skeletons === 0 &&
        (state.rows > 0 || state.listItems > 0 || /没有|暂无|还没有/.test(state.text));
}
