import { ProblemProvider, ProblemInfo } from './problem-provider'

export class OptionalProblemProvider implements ProblemProvider {
    constructor(
        public readonly name: string,
        private readonly impl: ProblemProvider | null,
        private readonly unavailableReason?: string,
    ) {}

    getProblemById(id: string): ProblemInfo | null {
        return this.impl ? this.impl.getProblemById(id) : null
    }

    getProblemsForArticle(rbookId: string): ProblemInfo[] {
        return this.impl ? this.impl.getProblemsForArticle(rbookId) : []
    }

    isAvailable(): boolean {
        return this.impl !== null
    }

    reason(): string | undefined {
        return this.unavailableReason
    }
}

export function createOptionalProblemProvider(
    loader: () => ProblemProvider | null,
    reason: string,
): OptionalProblemProvider {
    let impl: ProblemProvider | null = null
    try {
        impl = loader()
    }
    catch {
        impl = null
    }
    return new OptionalProblemProvider('problem-provider', impl, reason)
}