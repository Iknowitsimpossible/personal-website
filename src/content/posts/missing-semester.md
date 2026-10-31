---
title: "What I Learned from MIT's Missing Semester"
summary: "Shell basics, why Git is not GitHub, and the 200-line loop behind coding agents."
date: 2026-10-28
category: reflection
draft: false
---

I recently went through [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/), MIT's short course on the tools programmers use every day but rarely get taught: the shell, editors, Git, debugging, packaging, and now AI coding agents. I moved through it fast and on purpose.

My goal wasn't to master every tool. It was to get **technical literacy**: enough to understand what's happening on my own computer and to follow the conventions engineers take for granted.

## The shell

The first two lectures covered the shell and the command-line environment. What stuck with me is that the terminal isn't a black box. It's a way to run small programs and connect them together. Once I understood pipes (`|`), redirection (`>`), exit codes, and `$PATH`, the install commands in READMEs stopped looking like magic spells I had to copy and paste.

## Git is not GitHub

Most of my time went to version control. The big realization was simple: **Git and GitHub are different things.** Git is the tool on my computer that records snapshots of a project. GitHub is a website that hosts those projects and adds pull requests, issues, and code review on top.

Git made sense once I saw it as a small model. Commits are snapshots, branches are just labels pointing at commits, and the staging area lets me choose exactly what goes into the next commit. With that in place, the open-source workflow became clear: fork, branch, commit, push, open a pull request, respond to review. Now I know how to contribute to a project instead of just reading it.

## An AI agent is just a loop

My favorite takeaway came from a reading in the [Agentic Coding](https://missing.csail.mit.edu/2026/agentic-coding/) lecture. The article [The Emperor Has No Clothes: How to Code Claude Code in 200 Lines of Code](https://www.mihaileric.com/The-Emperor-Has-No-Clothes/) explains what a coding agent does. Essentially, a coding agent does three things:

1. **Read files** so the LLM can see your code
2. **List files** so it can navigate your project
3. **Edit files** so it can direct the creation and modification of code

The program receives user input and adds it to the conversation. An inner loop calls the LLM, which determines whether tools need to be called. The program executes those tool calls and feeds the results back to the model as part of the conversation's context. The cycle repeats until the task is done.

The core of that loop fits in about 200 lines of code. I found that really elegant: tools that look almost magical come down to a simple, clever structure.

## What's next

That loop made me want to look one layer deeper, at the LLM inside it. So next I'm starting Andrej Karpathy's [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), which builds neural networks and a small GPT from scratch. Missing Semester gave me the tools; now I want to understand how the tool has been made.
