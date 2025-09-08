# Docker image configuration
IMAGE_NAME = shakogegia/audioscribe
TAG = latest
PLATFORMS = linux/amd64,linux/arm64

.PHONY: help build publish push clean setup-buildx

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup-buildx: ## Setup Docker buildx for multi-platform builds
	@docker buildx create --name multiplatform --use --driver docker-container 2>/dev/null || echo "Buildx builder 'multiplatform' already exists"
	@docker buildx inspect --bootstrap

build: ## Build Docker image locally (current platform only)
	docker build -t $(IMAGE_NAME):$(TAG) .

publish: setup-buildx ## Build and push multi-platform Docker image
	docker buildx build --platform $(PLATFORMS) -t $(IMAGE_NAME):$(TAG) --push .

push: ## Push existing local image to registry
	docker push $(IMAGE_NAME):$(TAG)

clean: ## Remove local Docker images and buildx cache
	docker rmi $(IMAGE_NAME):$(TAG) 2>/dev/null || echo "Local image not found"
	docker buildx prune -f

run: ## Run the container locally using docker-compose
	docker-compose up -d

stop: ## Stop the running container
	docker-compose down

logs: ## Show container logs
	docker-compose logs -f

status: ## Show container status
	docker-compose ps

# Development helpers
dev-build: ## Quick local build for development
	docker build -t $(IMAGE_NAME):dev .

dev-run: dev-build ## Build and run container locally for development
	docker run -p 3000:3000 --rm -v ./app-data:/app/data -v ./temp-cache:/tmp/audiobook-wizard $(IMAGE_NAME):dev
