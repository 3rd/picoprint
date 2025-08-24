SHELL         = /usr/bin/env bash
.SHELLFLAGS   = -eu -o pipefail -c
SOURCE        = $(realpath $(dir $(realpath $(lastword $(MAKEFILE_LIST)))))

# colors
BLACK         = $(shell tput -Txterm setaf 0)
RED           = $(shell tput -Txterm setaf 1)
GREEN         = $(shell tput -Txterm setaf 2)
YELLOW        = $(shell tput -Txterm setaf 3)
MAGENTA       = $(shell tput -Txterm setaf 5)
CYAN          = $(shell tput -Txterm setaf 6)
WHITE         = $(shell tput -Txterm setaf 7)
BLUE          = $(shell tput -Txterm setaf 4)
RESET         = $(shell tput -Txterm sgr0)

# log helper
define print_mod_start
	@echo "╭── $(1)"
endef
define print_mod
	@echo "│ • $(1)"
endef
define print_mod_end
	@echo "╰──────"
endef

.DEFAULT_GOAL = help
.PHONY: help install clean dev test test-watch test-coverage build tsc

help: ## help
	@echo "📦 ${YELLOW}bun-lib${RESET}"
	@grep -E '^[a-zA-Z_0-9%-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "${BLUE}%-20s${RESET} %s\n", $$1, $$2}'

install: ## install dependencies
	$(call print_mod_start,${MAGENTA}Install:${RESET} dependencies)
	@bun install
	$(call print_mod_end)

clean: ## clean build artifacts
	$(call print_mod_start,${MAGENTA}Clean:${RESET} artifacts)
	@rm -rf dist
	@rm -rf coverage
	@rm -rf .bun
	@rm -rf node_modules/.cache
	$(call print_mod,${GREEN}✓${RESET} cleaned)
	$(call print_mod_end)

dev: ## watch source files and run tests (without --watch)
	@watchexec --stop-timeout=0 --no-process-group -e ".ts,.js,.json" -i "dist/**" -i "coverage/**" -r -c clear "make test"

test: ## run tests
	$(call print_mod_start,${MAGENTA}Test:${RESET} running)
	@bun test
	$(call print_mod_end)

test-watch: ## run tests in watch mode
	@bun test --watch

test-coverage: ## run tests with coverage
	$(call print_mod_start,${MAGENTA}Test:${RESET} coverage)
	@bun test --coverage
	$(call print_mod_end)

build: ## build library
	$(call print_mod_start,${MAGENTA}Build:${RESET} library)
	$(call print_mod,${CYAN}clean${RESET} dist)
	@rm -rf dist
	$(call print_mod,${CYAN}build${RESET} esm)
	@bun build src/index.ts --outfile=dist/index.mjs --format=esm --target=node
	$(call print_mod,${CYAN}build${RESET} cjs)
	@bun build src/index.ts --outfile=dist/index.js --format=cjs --target=node
	$(call print_mod,${CYAN}build${RESET} types)
	@tsc --project tsconfig.build.json
	$(call print_mod,${GREEN}✓${RESET} built)
	$(call print_mod_end)

tsc: ## run type checking
	@tsc --noEmit

publish-dry: build ## dry run npm publish
	$(call print_mod_start,${MAGENTA}Publish:${RESET} dry run)
	@npm publish --dry-run
	$(call print_mod_end)

size: build ## check bundle size
	$(call print_mod_start,${MAGENTA}Size:${RESET} analysis)
	@echo "│ • ${CYAN}dist/index.mjs${RESET}: $$(du -h dist/index.mjs | cut -f1)"
	@echo "│ • ${CYAN}dist/index.js${RESET}: $$(du -h dist/index.js | cut -f1)"
	@echo "│ • ${CYAN}dist total${RESET}: $$(du -sh dist | cut -f1)"
	$(call print_mod_end)

