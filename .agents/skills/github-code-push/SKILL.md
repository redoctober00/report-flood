---
name: github-code-push
description: Automate safe, reliable, and context-aware GitHub pushes. Use this skill when the user asks to commit, stage, sync, or push code changes to a repository, including handling branches, merge conflicts, or pre-push build/compile steps. Ensures commits are clean, descriptive, and aligned with repository workflow best practices.
license: Complete terms in LICENSE.txt
---

This skill guides an agent to push code to GitHub in a controlled, reliable manner, avoiding mistakes like broken builds, bad commit messages, or out-of-sync branches. It can handle standard workflows, feature branches, pre-push compilation/build steps, and verification on the remote repository.

The agent receives instructions about what code to push, including context about the branch, repository, or feature. It may also include additional steps such as compiling frontend code, running tests, or ensuring dependencies are updated before committing.

## Workflow Guidelines

Before pushing, ensure all steps are verified and executed with precision:

- **Repository Status**: Always check local changes first (`git status`) and identify new, modified, or deleted files. Confirm that only intended changes will be staged.
- **Staging**: Stage all changes or selectively stage files using `git add`. Avoid accidental commits by verifying staged content.
- **Commit Messages**: Use concise, descriptive messages explaining the change. Example: `"Fix MIME type issue in JSX module"`. Commit messages should provide context for future reviewers.
- **Branch Strategy**: Follow branching rules. For new features or fixes, create feature branches (`git checkout -b feature/short-description`). Keep `main`/`master` stable.
- **Syncing**: Pull the latest changes from the remote with rebase (`git pull origin <branch> --rebase`) to prevent merge conflicts and keep history clean.
- **Push**: Push local commits to GitHub (`git push origin <branch>`). Retry automatically if network errors occur.
- **Verification**: Confirm that commits appear on GitHub. Optionally trigger CI/CD pipelines or automated tests.

## Best Practices for Agent Implementation

- **Pre-Push Checks**: Run build or compile steps if needed (e.g., `npm run build` for React projects). Ensure the repository is in a deployable state.
- **Conflict Handling**: Detect conflicts automatically. Attempt rebase or merge resolution; if unable, report clearly.
- **Commit Hygiene**: Avoid large, ambiguous commits. Break work into small, coherent commits.
- **Branch Naming**: Use descriptive names for feature/fix branches. Example: `feature/add-login`, `bugfix/fix-jsx-error`.
- **Automation Awareness**: Respect repository conventions. Do not push directly to protected branches unless authorized.
- **Context-Aware Actions**: The agent can adapt steps depending on project type (frontend, backend, full-stack) and pre-push requirements.

