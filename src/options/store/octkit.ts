// import { createModel } from '@rematch/core'
// import Octokit, { ReposListCommitsResponseItem } from '@octokit/rest'
// const octokit = new Octokit()

// export type SharksState = ReposListCommitsResponseItem[]

// const sharks = createModel<SharksState>({
//   state: [],
//   reducers: {
//     updateCommits: (state, payload: SharksState) => [...state, ...payload]
//   },
//   effects: {
//     async fetchCommits (repoPath: string) {
//       const [owner, repo] = repoPath.split('/')
//       const activeResponse = await octokit.repos.listCommits({
//         owner,
//         repo
//       })
//       this.updateCommits(activeResponse.data)
//     },
//   },
// })

// export default sharks