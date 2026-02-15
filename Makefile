.DEFAULT_GOAL := help

.PHONY: help install test lint lint-fix build clean docs-api docs-dev docs-build docs-thumbnails docs-clean

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

test: ## Run tests
	npm test

lint: ## Run linter
	npm run lint

lint-fix: ## Run linter with auto-fix
	npm run lint:fix

build: ## Build the project
	npm run build

clean: ## Remove build artifacts
	rm -rf dist/ temp/

docs-api: build ## Generate API reference docs
	npx api-extractor run --local
	cp docs/api/index.md temp/api-index.md.bak 2>/dev/null || true
	npx api-documenter markdown -i temp -o docs/api
	mv temp/api-index.md.bak docs/api/index.md 2>/dev/null || true

docs-dev: ## Start VitePress dev server
	npx vitepress dev docs --host 0.0.0.0 --port 8080

docs-build: docs-api ## Build documentation site
	npx vitepress build docs

docs-thumbnails: docs-build ## Generate gallery thumbnails (requires Playwright)
	node scripts/generate-thumbnails.mjs

docs-clean: ## Remove generated docs and caches
	rm -rf temp/ docs/.vitepress/dist/ docs/.vitepress/cache/
	find docs/api -name '*.md' ! -name 'index.md' -delete 2>/dev/null || true
