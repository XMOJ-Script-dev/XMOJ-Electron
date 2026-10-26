import { ref } from 'vue';
export type PanelKind = 'rank' | 'source' | 'profile';
const kind = ref<PanelKind | null>(null);
const rankContestId = ref(0);
const rankTitle = ref('');
const rankOi = ref(true);
const sourceSolutionId = ref(0);
const sourceTitle = ref('');
const sourceLanguage = ref(1);
const profileUsername = ref('');
export function usePanel() {
    function openRank(contestId: number, title: string, oi = true): void {
        rankContestId.value = contestId;
        rankTitle.value = title;
        rankOi.value = oi;
        kind.value = 'rank';
    }
    function openSource(solutionId: number, title = '', language = 'C++'): void {
        sourceLanguage.value = /python/i.test(language) ? 3 : /javascript|node/i.test(language) ? 6 : /java/i.test(language) ? 4 : /pascal/i.test(language) ? 2 : /c#|csharp/i.test(language) ? 5 : /^c$|gcc/i.test(language) ? 0 : 1;
        sourceSolutionId.value = solutionId;
        sourceTitle.value = title || `提交 #${solutionId}`;
        kind.value = 'source';
    }
    function openProfile(username: string): void {
        profileUsername.value = username;
        kind.value = 'profile';
    }
    function close(): void {
        kind.value = null;
    }
    return {
        kind,
        rankContestId,
        rankTitle,
        rankOi,
        sourceSolutionId,
        sourceTitle,
        sourceLanguage,
        profileUsername,
        openRank,
        openSource,
        openProfile,
        close,
    };
}
