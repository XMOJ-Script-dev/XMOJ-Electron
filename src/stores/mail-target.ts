import { ref } from 'vue';
const targetUser = ref<string | null>(null);
export function useMailTarget() {
    function setTarget(username: string): void {
        targetUser.value = username;
    }
    function clearTarget(): void {
        targetUser.value = null;
    }
    return {
        targetUser,
        setTarget,
        clearTarget,
    };
}
