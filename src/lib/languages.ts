export function judgeLanguageToMonaco(languageId: number): string {
    switch (languageId) {
        case 0:
            return 'c';
        case 1:
            return 'cpp';
        case 2:
            return 'pascal';
        case 3:
            return 'python';
        case 4:
            return 'java';
        case 5:
            return 'csharp';
        case 6:
            return 'javascript';
        default:
            return 'cpp';
    }
}
