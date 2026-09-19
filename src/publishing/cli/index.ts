import { createCli } from './commands'
import { createOptionalProblemProvider } from '../integrations/optional-problem-provider'
import { RojJsonProblemProvider, defaultRojJsonPath } from '../integrations/roj-json-problem-provider'
import path from 'path'

function main(): void {
    const projectRoot = path.resolve(process.cwd())
    const legacyEjsLocals = require(path.join(projectRoot, 'bin', 'ejsrc.js')).locals || {}
    const rojJsonPath = defaultRojJsonPath(projectRoot)
    const problemProvider = createOptionalProblemProvider(
        () => new RojJsonProblemProvider({ jsonPath: rojJsonPath }),
        `题库数据不存在或不可用: ${rojJsonPath}`,
    )

    const cli = createCli({
        projectRoot,
        problemProvider,
        blogUrl: 'https://rbook.roj.ac.cn',
        rojBaseUrl: 'https://roj.ac.cn',
        contentMacros: { locals: legacyEjsLocals },
    })

    cli.parse(process.argv)
}

main()
