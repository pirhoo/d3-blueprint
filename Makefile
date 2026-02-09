.DEFAULT_GOAL := help

.PHONY: help install test lint lint-fix build clean

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
	rm -rf dist/
