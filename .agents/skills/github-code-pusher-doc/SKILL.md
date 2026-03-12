---
name: github-code-pusher-doc
description: 
  Detailed documentation for the GitHub code pusher skill. Explains purpose, workflow, best practices, and optional steps for pushing code safely to GitHub repositories. Designed for human readers and AI developers to understand how the skill works.
license: Complete terms in LICENSE.txt
---

purpose:
  - "Automate safe, reliable, and context-aware GitHub pushes."
  - "Ensure commits are descriptive, branches are managed, and repository integrity is maintained."
  - "Include optional pre-push checks like builds, tests, and compilation for frontend projects."

scope:
  - "Use this skill when committing, staging, syncing, or pushing code to GitHub."
  - "Applicable for both single-file changes and full-feature branches."
  - "Supports both main/master branch pushes and feature/fix branch workflows."

requirements:
  - "Local Git repository must exist."
  - "Remote GitHub repository configured."
  - "Branch to push must exist or be created."
  - "For frontend projects: Node.js/npm installed for build scripts."
  - "Access credentials or authentication to GitHub must be valid."

workflow:
  - step: check_status
    description: "Check local repository status for uncommitted changes."
    command: "git status"

  - step: stage_changes
    description: "Stage all changes or select specific files for commit."
    commands:
      - "git add ."
      - "git add path/to/file1 path/to/file2  # optional"

  - step: commit_changes
    description: "Commit staged changes with descriptive message."
    command: 'git commit -m "Descriptive commit message"'

  - step: sync_remote
    description: "Pull latest changes from remote branch to prevent conflicts."
    command: "git pull origin <branch-name> --rebase"

  - step: push_changes
    description: "Push local commits to GitHub."
    command: "git push origin <branch-name>"

  - step: branch_management
    description: "Create and push new feature/fix branches if needed."
    commands:
      - "git checkout -b feature/short-description"
      - "git push -u origin feature/short-description"

  - step: optional_pre_push_checks
    description: "Run pre-push scripts for frontend projects or automated tests."
    examples:
      - "npm run build"
      - "npm test"

best_practices:
  - "Always check repository status before staging."
  - "Use concise and descriptive commit messages."
  - "Pull latest changes before pushing to avoid conflicts."
  - "Break work into small, coherent commits."
  - "Use descriptive branch names like feature/add-login or bugfix/fix-jsx."
  - "Verify commits on GitHub and optionally trigger CI/CD pipelines."

notes:
  - "This YAML serves as documentation for the skill, not an executable workflow."
  - "It can be used as reference for AI agents or humans using the GitHub code pusher skill."
  - "For frontend projects, include build and compilation steps to prevent runtime errors like JSX MIME type issues."