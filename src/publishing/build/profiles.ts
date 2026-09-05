import { BuildStage, prepareCatalog, renderPages, buildSiteShell, copyAssets, buildOptionalWidgets } from './stages'

export interface PublishProfile {
    name: string
    stages: BuildStage[]
}

export const CORE_PROFILE: PublishProfile = {
    name: 'core',
    stages: [
        prepareCatalog,
        renderPages,
        buildSiteShell,
        copyAssets,
    ],
}

export const FULL_PROFILE: PublishProfile = {
    name: 'full',
    stages: [
        ...CORE_PROFILE.stages,
        buildOptionalWidgets,
    ],
}

export function getProfile(name: string): PublishProfile {
    if (name === 'full') return FULL_PROFILE
    if (name === 'core') return CORE_PROFILE
    throw new Error(`未知 profile: ${name} (可选: core, full)`)
}