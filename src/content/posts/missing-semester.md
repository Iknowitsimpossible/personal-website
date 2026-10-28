---
title: "What I Took from MIT's Missing Semester"
summary: "Shell basics, why Git is not GitHub, checking AI's work, and the 200-line loop behind coding agents."
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

## Literacy

Why go through it so quickly? Today's AI tools can write most of the shell scripts, Git commands, and boilerplate for me. What they can't do is take responsibility for the result. AI makes confident mistakes, so the skill that matters most now is being able to **check and cross-verify** its work: read a diff, understand what a command will do before running it, and know when something looks wrong. That takes literacy, not mastery.

## An AI agent is just a loop

My favorite takeaway came from the [Agentic Coding](https://missing.csail.mit.edu/2026/agentic-coding/) lecture. A coding agent is an LLM running in a loop. The model decides on a step, like reading a file or running the tests. A surrounding program carries that step out and feeds the result back to the model, and the cycle repeats until the task is done.

The core of that loop fits in about 200 lines of code. I found that really elegant: tools that look almost magical come down to a simple, clever structure.

## What's next

That loop made me want to look one layer deeper, at the LLM inside it. So next I'm starting Andrej Karpathy's [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), which builds neural networks and a small GPT from scratch. Missing Semester gave me the tools; now I want to understand the model.
