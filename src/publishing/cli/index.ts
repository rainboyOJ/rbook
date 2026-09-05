import { createCli } from './commands'
import { createOptionalProblemProvider } from '../integrations/optional-problem-provider'
import path from 'path'

function main(): void {
    const projectRoot = path.resolve(process.cwd())
    const problemProvider = createOptionalProblemProvider(
        () => {
            const { default: ProblemDB } = require(path.join(projectRoot, '..', 'problems', 'src', 'lib', 'database', 'index.js'))
            const db = new ProblemDB()
            db.loadDatabase?.()
            return {
                name: 'problems-db',
                getProblemById(id: string) {
                    try { return db.getProblemById(id) } catch { return null }
                },
                getProblemsForArticle(rbookId: string) {
                    try { return db.solutions_has_practice_rbook(rbookId) || [] } catch { return [] }
                },
            }
        },
        '外部题库目录 ../problems 不存在或不可用',
    )

    const cli = createCli({
        projectRoot,
        problemProvider,
        blogUrl: 'https://rbook.roj.ac.cn',
        rojBaseUrl: 'https://roj.ac.cn',
    })

    cli.parse(process.argv)
}

main()