import { ref } from 'vue';
export type PanelKind = 'rank' | 'source' | 'profile';
const kind = ref<PanelKind | null>(null);
const rankContestId = ref(0);
const rankTitle = ref('');
const rankOi = ref(true);
const sourceSolutionId = ref(0);
const sourceTitle = ref('');
const profileUsername = ref('');
export function usePanel() {
    function openRank(contestId: number, title: string, oi = true): void {
        rankContestId.value = contestId;
        rankTitle.value = title;
        rankOi.value = oi;
        kind.value = 'rank';
    }
    function openSource(solutionId: number, title = ''): void {
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
        profileUsername,
        openRank,
        openSource,
        openProfile,
        close,
    };
}
