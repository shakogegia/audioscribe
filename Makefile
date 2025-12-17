.PHONY: *
.DEFAULT_GOAL := help

THIS_FILE := $(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

# Detect Docker Compose command
ifeq (,$(shell command docker compose 2> /dev/null))
  DOCKER_COMPOSE = docker-compose
else
  DOCKER_COMPOSE = docker compose
endif

help: ## Show this help message
	@echo "\n\033[1mUsage:\033[0m\n  make \033[36m<TARGET>\033[0m\n"
	@echo "\033[1mAvailable targets:\033[0m"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all containers in the background (with build and file watch)
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml up --build -d

down: ## Stop and remove containers and orphans
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml --profile="*" down --remove-orphans

restart: ## Restart containers (down + up)
	@$(MAKE) -f docker-compose.dev.yml down
	@$(MAKE) -f docker-compose.dev.yml up
	@echo "✔ Restart completed"

audioscribe-restart: ## Restart the audioscribe process
	docker exec -it audioscribe supervisorctl -c /etc/supervisor/supervisord.conf restart audioscribe
	@echo "✔ Restart completed"

workers-restart: ## Restart the workers process
	docker exec -it audioscribe supervisorctl -c /etc/supervisor/supervisord.conf restart workers
	@echo "✔ Restart completed"

chroma-restart: ## Restart the chroma process
	docker exec -it audioscribe supervisorctl -c /etc/supervisor/supervisord.conf restart chroma
	@echo "✔ Restart completed"