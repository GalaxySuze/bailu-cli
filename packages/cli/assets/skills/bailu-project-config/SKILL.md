---
name: bailu-project-config
description: "Bailu project rules configuration generator. Triggers: generate project rules, organize project rules, project config, /bailu-project-config. Scans project structure, identifies tech stack, generates project-level rule files compliant with the Bailu rules specification."
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Bailu Project Config - Project Rules Configuration Generator

> Placeholder for English version. Please use the Chinese version in `skills-zh/` for now.

This skill will be translated when English documentation is ready.

## Overview

This skill scans the current project structure, identifies the tech stack, and generates project-level rule files compliant with the Bailu rules specification (a module-based structure using `:::` markers).

## Usage

```
/bailu-project-config
/bailu-project-config --dry-run
/bailu-project-config --yes
```
