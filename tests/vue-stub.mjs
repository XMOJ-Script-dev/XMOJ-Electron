let activeEffect = null;
const targetMap = new WeakMap();
function track(target, key) {
    if (activeEffect === null)
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap)
        targetMap.set(target, (depsMap = new Map()));
    let dep = depsMap.get(key);
    if (!dep)
        depsMap.set(key, (dep = new Set()));
    dep.add(activeEffect);
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap?.get(key);
    if (!dep)
        return;
    for (const effect of [...dep])
        effect();
}
export function ref(initial) {
    const holder = { _value: initial };
    return {
        get value() {
            track(holder, 'value');
            return holder._value;
        },
        set value(v) {
            if (holder._value !== v) {
                holder._value = v;
                trigger(holder, 'value');
            }
        },
    };
}
export function shallowRef(initial) {
    return ref(initial);
}
export function reactive(target) {
    return new Proxy(target, {
        get(t, key, receiver) {
            track(t, key);
            return Reflect.get(t, key, receiver);
        },
        set(t, key, value, receiver) {
            const had = Reflect.has(t, key);
            const old = t[key];
            const ok = Reflect.set(t, key, value, receiver);
            if (!had || old !== value)
                trigger(t, key);
            return ok;
        },
        deleteProperty(t, key) {
            const ok = Reflect.deleteProperty(t, key);
            if (ok)
                trigger(t, key);
            return ok;
        },
    });
}
export function computed(fn) {
    return {
        get value() {
            return fn();
        },
    };
}
export function watch(source, cb, options = {}) {
    let initialized = false;
    const job = () => {
        const prev = activeEffect;
        activeEffect = job;
        try {
            source();
        }
        finally {
            activeEffect = prev;
        }
        if (!initialized) {
            initialized = true;
            if (!options.immediate)
                return;
        }
        cb();
    };
    job();
}
