import { createCli } from './commands'
import { createOptionalProblemProvider } from '../integrations/optional-problem-provider'
import { RojJsonProblemProvider, defaultRojJsonPath } from '../integrations/roj-json-problem-provider'
import { loadPcs2PracticeProvider } from '../integrations/pcs2-practice-provider'
import path from 'path'

function main(): void {
    const projectRoot = path.resolve(process.cwd())
    const legacyEjsLocals = require(path.join(projectRoot, 'bin', 'ejsrc.js')).locals || {}
    const rojJsonPath = defaultRojJsonPath(projectRoot)
    const problemProvider = createOptionalProblemProvider(
        () => new RojJsonProblemProvider({ jsonPath: rojJsonPath }),
        `题库数据不存在或不可用: ${rojJsonPath}`,
    )
    // 「相关题解」小节的数据源：pcs2 题解仓库的 showAtRbook。
    // 不可用时返回 null，由 build profile 决定告警（core）还是中断（full）。
    const pcs2 = loadPcs2PracticeProvider({ projectRoot })

    const cli = createCli({
        projectRoot,
        problemProvider,
        practiceProvider: pcs2.provider,
        practiceUnavailableReason: pcs2.reason,
        blogUrl: 'https://rbook.roj.ac.cn',
        rojBaseUrl: 'https://roj.ac.cn',
        contentMacros: { locals: legacyEjsLocals },
    })

    cli.parse(process.argv)
}

main()
